import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { checkFeedback, payGate, type ClassFeedback } from '@/lib/dashboard/class-feedback';
import { latePenalty } from '@/lib/dashboard/late-penalty';

/**
 * SARIRO — POST /api/trial/feedback
 *
 * One person's write-up of one class, and the money that depends on it.
 *
 * ── Why this is a route and not a table write ───────────────────────────────
 * Saving the feedback is the easy half. The other half is what it unlocks: a
 * teacher's trial pay is held until every child in the class has been written
 * up, and the lead moves to its final stage once the class is done. Both of
 * those have to happen in the same breath as the save, or a teacher writes up
 * three children and is still not paid because a client forgot to call
 * something afterwards.
 *
 * ── The pay rule, in one place ──────────────────────────────────────────────
 * payGate() in lib/dashboard/class-feedback.ts decides, and it is the same
 * function the teacher's screen uses to tell them what is outstanding. One
 * rule, so the screen can never promise a payment the server withholds.
 *
 * Flat 100 for a completed trial, whoever teaches it. A trial is the same half
 * hour of work at any tier, and paying it against the course rate would make
 * the cheapest trials the least attractive to pick up.
 */
export const runtime = 'nodejs';

interface Body {
  bookingId?: string;
  /** The child this is about. A parent writing their own may omit it. */
  subjectStudentId?: string;
  rating?: number;
  remarks?: string;
  interestLevel?: 'hot' | 'warm' | 'cold';
}

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

  const rl = rateLimit({ key: `trial-feedback:${userId}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many submissions at once.');

  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  if (!body.bookingId) {
    return NextResponse.json({ ok: false, error: 'missing_booking' }, { status: 400 });
  }

  const admin = createServiceClient();

  // ── Were you actually in this class? ──────────────────────────────────────
  const { data: booking } = await admin
    .from('bookings')
    .select('id, teacher_id, trial_student_id, demo_request_id, cohort_id, is_trial, status, slot_start, teacher_started_at')
    .eq('id', body.bookingId)
    .maybeSingle();
  if (!booking) return NextResponse.json({ ok: false, error: 'no_such_class' }, { status: 404 });

  const isTeacher = booking.teacher_id === userId;
  let isStudent = booking.trial_student_id === userId;
  if (!isTeacher && !isStudent) {
    // A second or third child in the class is just as entitled to say how it
    // went as the first one, and only the join table knows they were there.
    try {
      const { data } = await admin
        .from('trial_participants')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('student_id', userId)
        .maybeSingle();
      isStudent = !!data;
    } catch { /* table not created yet */ }
  }
  if (!isTeacher && !isStudent) {
    return NextResponse.json({ ok: false, error: 'not_your_class' }, { status: 403 });
  }
  const role: 'teacher' | 'student' = isTeacher ? 'teacher' : 'student';

  /* A class that has not happened cannot be reported on. Without this, a
     teacher could write up and be paid for a class they never taught. */
  if (booking.status !== 'completed') {
    return NextResponse.json(
      {
        ok: false,
        error: 'class_not_finished',
        message: 'This class has not been marked complete yet.',
      },
      { status: 409 }
    );
  }

  const rating = typeof body.rating === 'number' ? body.rating : null;
  const remarks = (body.remarks ?? '').trim();
  const check = checkFeedback(role, rating, remarks);
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: 'invalid_feedback', message: check.problem }, { status: 400 });
  }

  // A parent writes about themselves; a teacher must name the child.
  const subject = role === 'student' ? userId : (body.subjectStudentId ?? booking.trial_student_id ?? null);
  if (role === 'teacher' && subject) {
    /* The named child has to actually be in the class. Without this a teacher
       could write up — and be paid for — a child who was never there. */
    const roster = await trialRoster(admin, booking);
    if (roster.length > 0 && !roster.some((r) => r.id === subject)) {
      return NextResponse.json(
        { ok: false, error: 'not_in_class', message: 'That student was not in this class.' },
        { status: 409 }
      );
    }
  }
  if (role === 'teacher' && !subject) {
    return NextResponse.json({ ok: false, error: 'missing_subject' }, { status: 400 });
  }

  const { error: upErr } = await admin.from('class_feedback').upsert(
    {
      booking_id: body.bookingId,
      author_id: userId,
      author_role: role,
      subject_student_id: subject,
      rating,
      remarks: remarks || null,
      interest_level: role === 'teacher' ? (body.interestLevel ?? null) : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'booking_id,author_id,subject_student_id' }
  );
  if (upErr) {
    const missing = /does not exist|schema cache/i.test(upErr.message);
    return NextResponse.json(
      {
        ok: false,
        error: 'save_failed',
        message: missing
          ? 'Feedback is not set up on the database yet — run scripts/class-feedback.sql.'
          : upErr.message,
      },
      { status: 500 }
    );
  }

  /* ── What the write-up unlocked ──────────────────────────────────────────
     Only the teacher's feedback moves money, and only once every child in the
     class has one. The gate is re-evaluated here from what is now stored,
     rather than from what this request happened to contain. */
  let payReleased = false;
  let gateMessage = '';

  if (role === 'teacher' && booking.is_trial) {
    const roster = await trialRoster(admin, booking);
    const { data: rows } = await admin
      .from('class_feedback')
      .select('author_role, subject_student_id, rating, remarks')
      .eq('booking_id', body.bookingId);

    const gate = payGate(roster, (rows ?? []) as ClassFeedback[]);
    gateMessage = gate.message;

    if (gate.unlocked) {
      payReleased = await payForTrial(admin, booking, roster.length);
      await advanceLeadStage(admin, booking);
    }
  }

  return NextResponse.json({ ok: true, payReleased, gateMessage });
}

type Admin = ReturnType<typeof createServiceClient>;
type Booking = {
  id: string;
  teacher_id: string | null;
  trial_student_id: string | null;
  demo_request_id: string | null;
  is_trial: boolean;
  slot_start: string;
  /** When the teacher actually pressed Start. Null when they never did. */
  teacher_started_at: string | null;
};

/**
 * Every child expected in this trial, named, so the gate can list who is left.
 *
 * trial_participants is the truth when it has rows; bookings.trial_student_id
 * is the fallback. A trial booked before that table existed has only the
 * column, and scripts/trial-participants.sql backfills it — but a route that
 * only reads the table would withhold pay for those until somebody ran the
 * migration, which is the wrong way for this to fail.
 */
async function trialRoster(admin: Admin, booking: Booking): Promise<{ id: string; name: string }[]> {
  let ids: string[] = [];
  try {
    const { data } = await admin
      .from('trial_participants')
      .select('student_id')
      .eq('booking_id', booking.id);
    ids = (data ?? []).map((r) => r.student_id as string);
  } catch { /* table not created yet — fall back below */ }

  if (ids.length === 0 && booking.trial_student_id) ids = [booking.trial_student_id];
  if (ids.length === 0) return [];

  const { data } = await admin.from('profiles').select('id, full_name, email').in('id', ids);
  return (data ?? []).map((p) => ({
    id: p.id as string,
    name: (p.full_name as string) || (p.email as string) || 'the student',
  }));
}

/**
 * The flat trial fee, once. Idempotent on booking_id, because a teacher
 * editing their remarks must not pay them twice.
 */
async function payForTrial(admin: Admin, booking: Booking, studentCount: number): Promise<boolean> {
  const { data: existing } = await admin
    .from('teacher_earnings')
    .select('id')
    .eq('booking_id', booking.id)
    .maybeSingle();
  if (existing) return false;

  let amount = 100;
  try {
    const { data: setting } = await admin.from('trial_pay_settings').select('amount').eq('id', true).maybeSingle();
    if (setting?.amount != null) amount = Number(setting.amount);
  } catch { /* the default is the documented one */ }

  /* The same late-join rule as every other class.
     ────────────────────────────────────────────────────────────────────────
     This was hardcoded to zero, so a teacher who joined a trial twenty
     minutes late was paid the full fee while the payout screen told them the
     rule was "more than 5 minutes — ₹100". A trial is half an hour of a
     child's first impression of Sariro; if anything it is the class where
     turning up on time matters most. */
  const penalty = latePenalty(booking.slot_start, booking.teacher_started_at);
  const net = Math.max(0, amount - penalty.amount);

  const { error } = await admin.from('teacher_earnings').insert({
    teacher_id: booking.teacher_id,
    booking_id: booking.id,
    class_date: booking.slot_start,
    lesson_name: 'Trial class',
    track: 'trial',
    level: 'trial',
    ratio: '1:1',
    student_count: Math.max(1, studentCount),
    base_amount: amount,
    bonus_amount: 0,
    penalty_amount: penalty.amount,
    penalty_reason: penalty.reason,
    amount: net,
    net_amount: net,
    status: 'pending',
  });
  if (error) {
    console.warn('[trial-feedback] earning insert failed:', error.message);
    return false;
  }
  return true;
}

/**
 * The lead has had its class, so it moves to the seller pipeline's `final`
 * stage — the one that says "yours to close" rather than "yours to schedule".
 *
 * The stage lives on student_leads, NOT on demo_class_requests. That matters:
 * demo_class_requests.status has a CHECK constraint that refuses 'final'
 * outright (23514, verified against the live database), and writing there
 * would have failed silently inside a best-effort try. student_leads.stage is
 * the vocabulary the seller pipeline actually uses — new, seller_assigned,
 * connected, gathering_booked, final, deferred, enrolled — and 'final' is
 * already in use on it.
 *
 * The demo request is still marked completed, because that is what its own
 * vocabulary means and the trial genuinely happened.
 *
 * Best effort throughout: a stage that did not move must never cost a teacher
 * their pay.
 */
async function advanceLeadStage(admin: Admin, booking: Booking): Promise<void> {
  if (!booking.demo_request_id) return;
  const now = new Date().toISOString();

  try {
    /* Only forward. A lead already enrolled has moved past `final`, and
       dragging it back would tell a seller to re-close a sale they have
       already made. */
    await admin
      .from('student_leads')
      .update({ stage: 'final', updated_at: now, last_updated: now })
      .eq('demo_request_id', booking.demo_request_id)
      .not('stage', 'in', '("final","enrolled")');
  } catch (err) {
    console.warn('[trial-feedback] lead stage update failed:', err);
  }

  try {
    await admin
      .from('demo_class_requests')
      .update({ status: 'completed', updated_at: now })
      .eq('id', booking.demo_request_id);
  } catch (err) {
    console.warn('[trial-feedback] demo request update failed:', err);
  }
}
