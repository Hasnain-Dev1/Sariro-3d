import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { resolveActor, cohortTimeline, teacherHasConflict } from '@/lib/dashboard/schedule-ops-server';

/**
 * SARIRO — POST /api/schedule/reschedule
 *
 * Move one booking to a new time. Rules:
 *   • initiator is REQUIRED ('student' | 'teacher' | 'admin') — who asked.
 *   • Teacher may reschedule only their OWN booking.
 *   • SEQUENCE PRESERVED: the new start must sit strictly AFTER the previous
 *     class ends and strictly BEFORE the next class starts — a class can never
 *     be pushed past the following class. Admins bypass this (unlimited).
 *   • New start must be in the future.
 *
 * Body: { bookingId, newStart (ISO), durationMin?, initiator, reason? }
 */
export const runtime = 'nodejs';

interface Body {
  bookingId?: string;
  newStart?: string;
  durationMin?: number;
  initiator?: 'student' | 'teacher' | 'admin';
  reason?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const rl = rateLimit({ key: `reschedule:${actor.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const initiator = body.initiator;
  if (!initiator || !['student', 'teacher', 'admin'].includes(initiator)) {
    return NextResponse.json({ ok: false, error: 'initiator_required', message: 'Specify who initiated: student, teacher, or admin.' }, { status: 400 });
  }
  if (!body.bookingId || !body.newStart || Number.isNaN(Date.parse(body.newStart))) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data: booking } = await admin.from('bookings')
    .select('id, cohort_id, teacher_id, slot_start, slot_end, status, reschedule_count')
    .eq('id', body.bookingId).maybeSingle();
  if (!booking) return NextResponse.json({ ok: false, error: 'booking_not_found' }, { status: 404 });
  if (booking.status !== 'scheduled') {
    return NextResponse.json({ ok: false, error: 'not_reschedulable', message: `A ${booking.status} class cannot be rescheduled.` }, { status: 400 });
  }

  // Authorization: teacher owns their booking; admin can touch any. Students
  // can't call reschedule directly (they request; teacher/admin actions it).
  if (!actor.isAdmin) {
    if (!(actor.isTeacher && booking.teacher_id === actor.userId)) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
  }

  const newStart = new Date(body.newStart);
  const durationMin = Number(body.durationMin) > 0
    ? Number(body.durationMin)
    : Math.max(15, Math.round((new Date(booking.slot_end).getTime() - new Date(booking.slot_start).getTime()) / 60_000));
  const newEnd = new Date(newStart.getTime() + durationMin * 60_000);

  if (newStart.getTime() <= Date.now()) {
    return NextResponse.json({ ok: false, error: 'past_time', message: 'Pick a future time.' }, { status: 400 });
  }

  // Sequence constraint (teachers only; admins are unlimited).
  if (!actor.isAdmin) {
    const timeline = await cohortTimeline(admin, booking.cohort_id);
    const idx = timeline.findIndex((b) => b.id === booking.id);
    const prev = idx > 0 ? timeline[idx - 1] : null;
    const next = idx >= 0 && idx < timeline.length - 1 ? timeline[idx + 1] : null;
    if (prev && newStart.getTime() <= new Date(prev.slot_end).getTime()) {
      return NextResponse.json({ ok: false, error: 'before_previous', message: 'New time must be after the previous class.' }, { status: 409 });
    }
    if (next && newEnd.getTime() >= new Date(next.slot_start).getTime()) {
      return NextResponse.json({ ok: false, error: 'past_next_class', message: 'A class cannot be rescheduled past the next class — lesson order must hold.' }, { status: 409 });
    }
  }

  // Double-booking guard: the teacher can't end up in two overlapping
  // classes, regardless of which cohort each belongs to. Applies to every
  // actor (including admin) — this is a hard scheduling constraint, not a
  // policy preference, and excluding this booking's own current slot means
  // a same-slot "reschedule" (e.g. just changing something else) never
  // false-flags against itself.
  if (await teacherHasConflict(admin, booking.teacher_id, newStart.toISOString(), newEnd.toISOString(), { excludeBookingId: booking.id })) {
    return NextResponse.json(
      { ok: false, error: 'teacher_conflict', message: 'This teacher already has another class scheduled during that time.' },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = {
    slot_start: newStart.toISOString(),
    slot_end: newEnd.toISOString(),
    reschedule_count: (booking.reschedule_count ?? 0) + 1,
    reschedule_initiator: initiator,
    rescheduled_by: actor.userId,
    rescheduled_at: nowIso,
  };
  // Preserve the ORIGINAL slot only the first time it's moved.
  if ((booking.reschedule_count ?? 0) === 0) patch.rescheduled_from = booking.slot_start;
  const { error } = await admin.from('bookings').update(patch).eq('id', booking.id);

  if (error) return NextResponse.json({ ok: false, error: 'update_failed', message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, bookingId: booking.id, newStart: newStart.toISOString(), newEnd: newEnd.toISOString() });
}
