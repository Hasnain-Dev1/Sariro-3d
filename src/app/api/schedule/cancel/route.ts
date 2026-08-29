import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { notifyUsers } from '@/lib/notify';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';
import { resolveActor, teacherCancelCountThisMonth, POLICY } from '@/lib/dashboard/schedule-ops-server';

/**
 * SARIRO — POST /api/schedule/cancel
 *
 * Cancels one booking under the class-operations policy:
 *   • GROUP class → cancellation is disallowed for students/teachers. Only an
 *     admin may force-cancel. (Absent students are handled at class time:
 *     credits are charged to all + recordings are shared — not here.)
 *   • 1:1 STUDENT cancel → allowed only >= 2h before start → teacher ZERO pay.
 *     (A student NO-SHOW is different: the completion trigger pays HALF, and the
 *      teacher can claim the other half via a recorded doubt session.)
 *   • 1:1 TEACHER cancel → counts toward 12 self-serve/month (then admin-only):
 *       - planned leave      → ZERO pay
 *       - HR-approved doubt session conducted → FULL pay
 *   • ADMIN cancel → unlimited; pay defaults to zero (override with payStatus).
 *
 * A make-up class is appended to the schedule end so the student's paid lesson
 * count is preserved.
 *
 * Body: { bookingId, cancelType?, reason?, payStatus? (admin only) }
 */
export const runtime = 'nodejs';

interface Body {
  bookingId?: string;
  cancelType?: 'teacher_leave' | 'doubt_session';
  reason?: string;
  payStatus?: 'full' | 'partial' | 'zero';
}

/** Code-default rate matrix (mirrors the SQL trigger fallbacks). */
function defaultBaseRate(tier: number, isGroup: boolean): number {
  if (isGroup) return tier === 1 ? 300 : tier === 2 ? 275 : 250;
  return tier === 1 ? 300 : tier === 2 ? 250 : 225;
}

/** Live base rate: app_settings override → code default. Keeps cancellation pay
 *  consistent with the editable per-tier rates the earnings trigger reads. */
async function baseRate(admin: ReturnType<typeof createServiceClient>, tier: number, isGroup: boolean): Promise<number> {
  const key = `pay_tier${tier}_${isGroup ? 'group' : '1on1'}`;
  const { data } = await admin.from('app_settings').select('value').eq('key', key).maybeSingle();
  const v = Number(data?.value);
  return Number.isFinite(v) && v > 0 ? v : defaultBaseRate(tier, isGroup);
}

async function appendOneMakeup(admin: ReturnType<typeof createServiceClient>, scheduleId: string | null) {
  if (!scheduleId) return;
  const { data: sched } = await admin.from('cohort_schedules').select('*').eq('id', scheduleId).maybeSingle();
  if (!sched) return;
  const { data: last } = await admin.from('bookings').select('slot_start')
    .eq('schedule_id', scheduleId).in('status', ['scheduled', 'completed'])
    .order('slot_start', { ascending: false }).limit(1).maybeSingle();
  const after = last ? new Date(last.slot_start) : new Date(sched.start_date + 'T00:00:00Z');
  const slots = generateOccurrences({
    startDate: sched.start_date, daysOfWeek: sched.days_of_week, timeLocal: sched.time_local,
    durationMin: sched.duration_min, timezone: sched.timezone,
  }, 1, after);
  if (slots.length) {
    await admin.from('bookings').insert({
      cohort_id: sched.cohort_id, teacher_id: sched.teacher_id, schedule_id: scheduleId,
      slot_start: slots[0].slotStart, slot_end: slots[0].slotEnd, status: 'scheduled',
    });
  }
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const rl = rateLimit({ key: `cancel:${actor.userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (!body.bookingId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const admin = createServiceClient();
  const { data: booking } = await admin.from('bookings')
    .select('id, cohort_id, teacher_id, slot_start, slot_end, status, schedule_id, lesson_name')
    .eq('id', body.bookingId).maybeSingle();
  if (!booking) return NextResponse.json({ ok: false, error: 'booking_not_found' }, { status: 404 });
  if (booking.status !== 'scheduled') {
    return NextResponse.json({ ok: false, error: 'not_cancellable', message: `A ${booking.status} class cannot be cancelled.` }, { status: 400 });
  }

  const { data: cohort } = await admin.from('cohorts')
    .select('id, track, level, ratio').eq('id', booking.cohort_id).maybeSingle();
  const ratio = cohort?.ratio ?? '1:1';
  const isGroup = ratio !== '1:1';
  const startMs = new Date(booking.slot_start).getTime();

  // Ownership: student must be enrolled in the cohort; teacher must own it.
  let isOwnerStudent = false;
  if (actor.isStudent) {
    const { data: enr } = await admin.from('enrollments').select('id')
      .eq('cohort_id', booking.cohort_id).eq('user_id', actor.userId).neq('status', 'dropped').limit(1).maybeSingle();
    isOwnerStudent = !!enr;
  }
  const isOwnerTeacher = actor.isTeacher && booking.teacher_id === actor.userId;
  if (!actor.isAdmin && !isOwnerStudent && !isOwnerTeacher) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // ── Decide cancel_type + pay_status + who ──
  let cancelledBy: 'student' | 'teacher' | 'admin';
  let cancelType: 'student_1to1' | 'teacher_leave' | 'doubt_session' | 'group_blocked' | 'admin';
  let payStatus: 'full' | 'partial' | 'zero';

  if (isGroup && !actor.isAdmin) {
    return NextResponse.json({ ok: false, error: 'group_no_cancel', message: 'Group classes cannot be cancelled. Absent students are charged and given the recording.' }, { status: 403 });
  }

  if (actor.isAdmin) {
    cancelledBy = 'admin'; cancelType = isGroup ? 'group_blocked' : 'admin';
    payStatus = body.payStatus ?? 'zero';
  } else if (isOwnerStudent) {
    // 1:1 student cancel — must be >= 2h before start.
    const hoursBefore = (startMs - Date.now()) / 3_600_000;
    if (hoursBefore < POLICY.ONE_TO_ONE_CANCEL_WINDOW_HOURS) {
      return NextResponse.json({ ok: false, error: 'too_late', message: `1:1 classes can only be cancelled at least ${POLICY.ONE_TO_ONE_CANCEL_WINDOW_HOURS} hours before start.` }, { status: 409 });
    }
    // Student cancelled in advance → teacher gets NO pay (a no-show is different:
    // that pays half, handled by the completion trigger + doubt-session top-up).
    cancelledBy = 'student'; cancelType = 'student_1to1'; payStatus = 'zero';
  } else {
    // 1:1 teacher cancel — self-serve monthly limit, then admin-only.
    const used = await teacherCancelCountThisMonth(admin, actor.userId);
    if (used >= POLICY.SELF_SERVE_CANCEL_LIMIT) {
      return NextResponse.json({ ok: false, error: 'monthly_limit_reached', message: `You've used all ${POLICY.SELF_SERVE_CANCEL_LIMIT} self-serve cancellations this month. Ask an admin to handle further cancellations.` }, { status: 429 });
    }
    cancelledBy = 'teacher';
    if (body.cancelType === 'doubt_session') {
      // Full pay only if there's an HR-approved doubt session for this teacher/cohort.
      const { data: ds } = await admin.from('doubt_sessions').select('id')
        .eq('teacher_id', actor.userId).eq('cohort_id', booking.cohort_id)
        .in('status', ['hr_approved', 'conducted']).limit(1).maybeSingle();
      if (!ds) {
        return NextResponse.json({ ok: false, error: 'doubt_not_approved', message: 'Full pay needs an HR-approved doubt session for this batch.' }, { status: 409 });
      }
      cancelType = 'doubt_session'; payStatus = 'full';
    } else {
      cancelType = 'teacher_leave'; payStatus = 'zero';
    }
  }

  // ── Apply cancellation ──
  const nowIso = new Date().toISOString();
  const { error: uErr } = await admin.from('bookings').update({
    status: 'cancelled',
    cancel_actor_role: cancelledBy,
    cancelled_by: actor.userId,
    cancelled_at: nowIso,
    cancel_reason: body.reason?.slice(0, 300) ?? null,
    cancel_type: cancelType,
    pay_status: payStatus,
  }).eq('id', booking.id);
  if (uErr) return NextResponse.json({ ok: false, error: 'update_failed', message: uErr.message }, { status: 500 });

  // ── Teacher pay for partial/full (zero = no earning row) ──
  if (payStatus === 'partial' || payStatus === 'full') {
    const { data: prof } = await admin.from('profiles').select('teacher_tier').eq('id', booking.teacher_id).maybeSingle();
    const tier = prof?.teacher_tier ?? 3;
    const { count: studentCount } = await admin.from('enrollments')
      .select('id', { count: 'exact', head: true }).eq('cohort_id', booking.cohort_id).eq('status', 'active');
    const base = await baseRate(admin, tier, isGroup);
    const pay = payStatus === 'partial' ? Math.round((base * POLICY.PARTIAL_PAY_PERCENT) / 100) : base;
    const reason = payStatus === 'partial' ? `Student cancellation (${POLICY.PARTIAL_PAY_PERCENT}% partial pay)` : 'HR-approved doubt session (full pay)';
    // Only insert if there isn't already an earning for this booking.
    const { data: existing } = await admin.from('teacher_earnings').select('id').eq('booking_id', booking.id).maybeSingle();
    if (!existing) {
      await admin.from('teacher_earnings').insert({
        teacher_id: booking.teacher_id, booking_id: booking.id, class_date: booking.slot_start,
        lesson_name: booking.lesson_name, track: cohort?.track ?? null, level: cohort?.level ?? null,
        ratio, student_count: studentCount ?? 1,
        base_amount: base, bonus_amount: 0, penalty_amount: 0, penalty_reason: reason,
        net_amount: pay, amount: pay, status: 'pending',
      });
    }
  }

  // ── Preserve paid lesson count: append one make-up at the schedule end ──
  await appendOneMakeup(admin, booking.schedule_id);

  // ── Tell everyone whose evening just changed ────────────────────────
  // A cancelled class is the one notification nobody can afford to miss: without
  // it a child sits waiting for a lesson that is not happening. Emailed for that
  // reason, and only for that reason — see lib/notify for why most things should
  // stay in-app.
  //
  // Deliberately last and deliberately unable to fail: the cancellation is
  // already committed, and returning a 500 here would tell the caller it did not
  // happen when it did.
  try {
    const { data: roster } = await admin
      .from('enrollments')
      .select('user_id')
      .eq('cohort_id', booking.cohort_id)
      .eq('status', 'active');

    const when = new Date(booking.slot_start).toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
    });

    const recipients = [
      ...new Set([
        ...(roster ?? []).map((r: { user_id: string }) => r.user_id),
        booking.teacher_id,
      ]),
    ].filter(Boolean) as string[];

    await notifyUsers(
      recipients.map((userId) => ({
        userId,
        type: 'session_cancelled' as const,
        title: 'Your class on ' + when + ' was cancelled',
        message: body.reason
          ? `Reason: ${body.reason}`
          : 'Your dashboard shows the rest of your schedule.',
        link: userId === booking.teacher_id ? '/dashboard/teacher' : '/dashboard/student',
        email: true,
      }))
    );
  } catch (err) {
    console.warn('[cancel] notification skipped:', err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({ ok: true, bookingId: booking.id, cancelledBy, cancelType, payStatus });
}
