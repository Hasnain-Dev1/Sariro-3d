import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { resolveActor } from '@/lib/dashboard/schedule-ops-server';

/**
 * SARIRO — POST /api/teacher/complete-class
 *
 * Marks a class 'completed' from the teacher dashboard. This is the step that
 * MOVES MONEY: flipping a booking to 'completed' fires the DB trigger
 * create_teacher_earning_on_complete(), which creates the teacher's earning
 * (base + bonus − any late-join penalty − any student no-show half-withhold).
 *
 * It is a SERVER route (service role) — not a raw client update — because it
 * gates on ownership + timing and must reliably fire the earning, regardless of
 * table RLS.
 *
 *   outcome 'completed'       → normal completion (full pay + late penalty if the
 *                               teacher started 3–10 min late).
 *   outcome 'student_no_show' → the STUDENT didn't show: mark the enrolled
 *                               student(s) 'absent', then complete. For a 1:1
 *                               the trigger withholds HALF the base (claimable
 *                               later via a doubt session). Teacher no-shows are
 *                               a separate, auto-detected flow (finalize-noshow).
 *
 * Body: { bookingId, outcome? }
 */
export const runtime = 'nodejs';

interface Body { bookingId?: string; outcome?: 'completed' | 'student_no_show' }

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const rl = rateLimit({ key: `complete-class:${actor.userId}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (!body.bookingId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  const outcome: 'completed' | 'student_no_show' = body.outcome === 'student_no_show' ? 'student_no_show' : 'completed';

  const admin = createServiceClient();
  const { data: booking } = await admin.from('bookings')
    .select('id, cohort_id, teacher_id, slot_start, status, is_complimentary')
    .eq('id', body.bookingId).maybeSingle();
  if (!booking) return NextResponse.json({ ok: false, error: 'booking_not_found' }, { status: 404 });

  // Ownership: teacher owns the booking; admins may complete any.
  if (!actor.isAdmin && !(actor.isTeacher && booking.teacher_id === actor.userId)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // Idempotent: already completed.
  if (booking.status === 'completed') return NextResponse.json({ ok: true, already: true });
  if (booking.status !== 'scheduled') {
    return NextResponse.json({ ok: false, error: 'not_completable', message: `A ${booking.status} class cannot be completed.` }, { status: 400 });
  }

  // The class must have started (matches the dashboard, which only shows the
  // action on past sessions).
  if (Date.now() < new Date(booking.slot_start).getTime()) {
    return NextResponse.json({ ok: false, error: 'class_not_started', message: 'You can only complete a class after it has started.' }, { status: 409 });
  }

  // Student no-show → mark absent the active students who aren't already marked
  // present/late/excused, so the completion trigger applies the half-withhold.
  if (outcome === 'student_no_show') {
    const { data: enrs } = await admin.from('enrollments')
      .select('user_id').eq('cohort_id', booking.cohort_id).eq('status', 'active');
    const studentIds = (enrs ?? []).map((e: { user_id: string }) => e.user_id);
    if (studentIds.length) {
      const { data: existing } = await admin.from('session_attendance')
        .select('student_id, status').eq('booking_id', booking.id).in('student_id', studentIds);
      const keep = new Set((existing ?? [])
        .filter((a: { status: string }) => ['present', 'late', 'excused'].includes(a.status))
        .map((a: { student_id: string }) => a.student_id));
      const nowIso = new Date().toISOString();
      for (const sid of studentIds) {
        if (keep.has(sid)) continue;
        await admin.from('session_attendance').upsert(
          { booking_id: booking.id, student_id: sid, status: 'absent', marked_at: nowIso },
          { onConflict: 'booking_id,student_id' }
        );
      }
    }
  }

  // Flip to completed (guarded so it only wins once) → fires the earning trigger.
  const { data: updated, error: uErr } = await admin.from('bookings')
    .update({ status: 'completed' }).eq('id', booking.id).eq('status', 'scheduled').select('id');
  if (uErr) return NextResponse.json({ ok: false, error: 'update_failed', message: uErr.message }, { status: 500 });
  if (!updated || updated.length === 0) return NextResponse.json({ ok: true, already: true });

  // ── Consume 1 credit per active student (1 credit = 1 class). This used to
  //    rely on a DB trigger that was never actually present, so completed
  //    classes never deducted. We now do it here, idempotently: a
  //    'class_consumed' credit_transactions row keyed to this booking + student
  //    is the guard, so re-completing (or a retry) never double-deducts. ──
  // Complimentary classes (the 3-4 diagnostic sessions that open a 1:1
  // masterclass) are real classes the teacher is paid for — the learner is just
  // never charged a credit for them. Without this guard a learner who bought 12
  // classes and received 4 diagnostics would silently get 8.
  if (booking.is_complimentary) {
    return NextResponse.json({ ok: true, completed: true, outcome, complimentary: true });
  }

  await deductClassCredits(admin, booking.id, booking.cohort_id);

  return NextResponse.json({ ok: true, completed: true, outcome });
}

/**
 * Deduct one class credit from each active student in the cohort, exactly once
 * per (booking, student). Guarded by a matching 'class_consumed' transaction so
 * it's safe to call again on a retry or re-completion.
 */
async function deductClassCredits(
  admin: ReturnType<typeof createServiceClient>,
  bookingId: string,
  cohortId: string
) {
  const { data: enrs } = await admin.from('enrollments')
    .select('user_id').eq('cohort_id', cohortId).eq('status', 'active');
  const studentIds = [...new Set((enrs ?? []).map((e: { user_id: string }) => e.user_id))];
  if (studentIds.length === 0) return;

  // Which students were already charged for THIS booking?
  const { data: charged } = await admin.from('credit_transactions')
    .select('user_id').eq('related_booking_id', bookingId).eq('type', 'class_consumed');
  const already = new Set((charged ?? []).map((c: { user_id: string }) => c.user_id));

  for (const sid of studentIds) {
    if (already.has(sid)) continue;
    const { data: cr } = await admin.from('credits').select('balance').eq('user_id', sid).maybeSingle();
    const balance = cr?.balance ?? 0;
    const newBalance = Math.max(0, balance - 1);
    // Record the consumption first (the idempotency guard), then apply it.
    const { error: txErr } = await admin.from('credit_transactions').insert({
      user_id: sid, amount: -1, type: 'class_consumed',
      description: 'Class attended', related_booking_id: bookingId,
    });
    if (txErr) continue; // a concurrent completion already charged this student
    await admin.from('credits').upsert({ user_id: sid, balance: newBalance }, { onConflict: 'user_id' });
  }
}
