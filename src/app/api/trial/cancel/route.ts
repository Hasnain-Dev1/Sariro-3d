import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { notifyUsers } from '@/lib/notify';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — POST /api/trial/cancel  { bookingId }
 *
 * A family calls off their own free class.
 *
 * It exists because the booking form now refuses a SECOND free class in the
 * same course, and telling somebody to cancel the one they have is only fair
 * if they can actually do it. Without this the advice was a dead end and the
 * only way out was a phone call.
 *
 * ── What it does, and what it deliberately does not ─────────────────────────
 * A trial seats up to four children, so cancelling is per CHILD: their seat
 * goes, and the class stays for everybody else. Only when the room is empty is
 * the class itself called off — cancelling a lesson three other families are
 * waiting for, because one of them dropped out, would be the worse bug.
 *
 * The lead goes back to the counsellor's Needs Slot Assistance queue rather
 * than being closed. A family who cancels has not gone away; they have a
 * reason, and that is a conversation worth having.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let userId: string | null = null;
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* 401 below */ }
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const rl = rateLimit({ key: `trial-cancel:${userId}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let bookingId: string | undefined;
  try { bookingId = (await req.json())?.bookingId; } catch { /* handled */ }
  if (!bookingId) return NextResponse.json({ ok: false, error: 'missing_booking' }, { status: 400 });

  const admin = createServiceClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id, slot_start, status, is_trial, trial_student_id, teacher_id, trial_subject')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking || !booking.is_trial) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  /* Theirs? The owner is named on the booking; anybody who joined is in the
     roster. Both are asked, because a child who joined somebody else's slot is
     just as entitled to leave it. */
  const { data: seats } = await admin
    .from('trial_participants').select('id, student_id').eq('booking_id', bookingId);
  const roster = (seats ?? []) as { id: string; student_id: string }[];
  const mine = booking.trial_student_id === userId || roster.some((r) => r.student_id === userId);
  if (!mine) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  if (booking.status !== 'scheduled') {
    return NextResponse.json(
      { ok: false, error: 'not_cancellable', message: 'That class is no longer open to cancel.' },
      { status: 409 }
    );
  }
  if (new Date(booking.slot_start).getTime() <= Date.now()) {
    return NextResponse.json(
      { ok: false, error: 'already_started', message: 'That class has already started. Ring us and we will sort it out.' },
      { status: 409 }
    );
  }

  // 1. Their seat goes.
  await bestEffort(
    'trial-cancel: release the seat',
    admin.from('trial_participants').delete().eq('booking_id', bookingId).eq('student_id', userId)
  );
  const others = roster.filter((r) => r.student_id !== userId);

  /* 2. The class itself, but only when nobody is left in it. A named child who
        was booked in by somebody else still counts as somebody in the room. */
  const ownerElsewhere = booking.trial_student_id !== null && booking.trial_student_id !== userId;
  const classEmpty = others.length === 0 && !ownerElsewhere;

  if (classEmpty) {
    await admin.from('bookings').update({
      status: 'cancelled',
      cancelled_by: userId,
      cancelled_at: new Date().toISOString(),
      cancel_reason: 'Cancelled by the family',
      cancel_actor_role: 'student',
      cancel_type: 'trial_cancelled',
    }).eq('id', bookingId).eq('status', 'scheduled');
  } else if (booking.trial_student_id === userId && others.length > 0) {
    /* The named child left a room that still has children in it. Somebody has
       to own the booking, or it reads as nobody's class. */
    await bestEffort(
      'trial-cancel: hand the booking to a child who stayed',
      admin.from('bookings').update({ trial_student_id: others[0].student_id }).eq('id', bookingId)
    );
  }

  /* 3. Back to a counsellor. Not closed: a family who cancels has a reason,
        and that reason is the most useful thing anybody could learn today. */
  const { data: leads } = await admin
    .from('student_leads')
    .select('id, assigned_seller, student_name')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  const lead = (leads ?? [])[0] as { id: string; assigned_seller: string | null; student_name: string } | undefined;

  if (lead) {
    const now = new Date().toISOString();
    await bestEffort(
      'trial-cancel: lead back to slot assistance',
      admin.from('student_leads')
        .update({ trial_status: 'slot_assistance', last_updated: now, updated_at: now })
        .eq('id', lead.id)
    );
    if (lead.assigned_seller) {
      await notifyUsers([{
        userId: lead.assigned_seller,
        type: 'session_cancelled' as const,
        title: `${lead.student_name} cancelled their free class`,
        message: 'They are back in your Needs Slot Assistance queue. Worth a call to find out why.',
        link: `/dashboard/seller?lead=${lead.id}`,
      }]);
    }
  }

  // 4. The teacher, but only when the room actually emptied.
  if (classEmpty && booking.teacher_id) {
    await notifyUsers([{
      userId: booking.teacher_id,
      type: 'session_cancelled' as const,
      title: 'A free class was cancelled',
      message: 'The family called it off. Nothing for you to do — the slot is free again.',
      link: '/dashboard/teacher',
      email: true,
    }]);
  }

  await recordEvent(admin, {
    event: 'trial.cancelled',
    subjectType: 'booking',
    subjectId: bookingId,
    actorId: userId,
    payload: { classCancelled: classEmpty, subject: booking.trial_subject ?? null },
  });

  return NextResponse.json({ ok: true, classCancelled: classEmpty });
}
