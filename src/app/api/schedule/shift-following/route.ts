import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { resolveActor } from '@/lib/dashboard/schedule-ops-server';

/**
 * SARIRO — POST /api/schedule/shift-following
 *
 * "Cascade shift": move ONE class and EVERY class after it forward by N days
 * (default 1). Used when a class is disrupted and the whole remaining sequence
 * should slide, keeping the lesson order intact — e.g. a teacher pushes today's
 * class to tomorrow and everything after moves a day too, or (on a student
 * cancel) the teacher opts to slide the batch by a day.
 *
 * Only future *scheduled* classes in the same batch (schedule) are moved; past
 * and completed classes are untouched. Teacher may shift their OWN batch; admins
 * any.
 *
 * Body: { bookingId, days? (1..14, default 1) }
 */
export const runtime = 'nodejs';

interface Body { bookingId?: string; days?: number }

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const rl = rateLimit({ key: `shift-following:${actor.userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (!body.bookingId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const days = Math.min(14, Math.max(1, Math.round(Number(body.days) || 1)));
  const shiftMs = days * 24 * 60 * 60 * 1000;

  const admin = createServiceClient();
  const { data: anchor } = await admin.from('bookings')
    .select('id, cohort_id, teacher_id, schedule_id, slot_start, status')
    .eq('id', body.bookingId).maybeSingle();
  if (!anchor) return NextResponse.json({ ok: false, error: 'booking_not_found' }, { status: 404 });
  if (anchor.status !== 'scheduled') {
    return NextResponse.json({ ok: false, error: 'not_shiftable', message: `A ${anchor.status} class cannot be shifted.` }, { status: 400 });
  }

  // Authorization: teacher owns the batch; admin can touch any.
  if (!actor.isAdmin && !(actor.isTeacher && anchor.teacher_id === actor.userId)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // Every scheduled class in this batch from the anchor onward (inclusive).
  // Prefer the schedule_id grouping; fall back to the cohort if it's absent.
  let q = admin.from('bookings')
    .select('id, slot_start, slot_end')
    .eq('status', 'scheduled')
    .gte('slot_start', anchor.slot_start);
  q = anchor.schedule_id ? q.eq('schedule_id', anchor.schedule_id) : q.eq('cohort_id', anchor.cohort_id);
  const { data: following } = await q;

  const rows = following ?? [];
  let shifted = 0;
  for (const b of rows) {
    const newStart = new Date(new Date(b.slot_start).getTime() + shiftMs).toISOString();
    const newEnd = new Date(new Date(b.slot_end).getTime() + shiftMs).toISOString();
    const { error } = await admin.from('bookings')
      .update({ slot_start: newStart, slot_end: newEnd })
      .eq('id', b.id);
    if (!error) shifted += 1;
  }

  return NextResponse.json({ ok: true, shifted, days });
}
