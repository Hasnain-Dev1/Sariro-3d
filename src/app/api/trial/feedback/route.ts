import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { checkFeedback, payGate, type ClassFeedback } from '@/lib/dashboard/class-feedback';
import { latePenalty } from '@/lib/dashboard/late-penalty';
import { bestEffort } from '@/lib/supabase/best-effort';
import { recordEvent } from '@/lib/events/log';
import { notifyUsers } from '@/lib/notify';
import { trialCertificateFor } from '@/lib/trial/certificate';

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
  /**
   * Whether the child was actually there. Teacher only.
   *
   * Omitted means "they were" — every call before this field existed was a
   * write-up of a child who attended, and defaulting the other way would
   * retrospectively mark all of them absent.
   *
   * `false` is a different action, not a variant of this one: there is no
   * rating for a class a child did not sit in, and the lead goes back to the
   * gathering pool rather than forward to the closing conversation.
   */
  attended?: boolean;
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

  /* ── The absence path ────────────────────────────────────────────────────
     Handled before the rating is validated, because there is nothing to rate.
     A teacher forced to invent a score for a child who never appeared would
     be putting a number on the seller's screen that describes nobody. */
  if (role === 'teacher' && body.attended === false) {
    return markNoShow(admin, booking, body.subjectStudentId ?? booking.trial_student_id ?? null, userId);
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
    /* The child was there. Recorded per student, in the same table every
       other class uses, so "did they attend" has one answer whatever kind of
       class it was. */
    if (subject) await markAttendance(admin, booking.id, subject, 'present', userId);

    /* ── The certificate the class page promised ────────────────────────────
       Now is when it becomes true: the teacher has said the child was there.
       Sent by email as well as the bell, because by now the family has left
       the page. Once only — editing the feedback must not send it again. */
    if (subject) {
      const cert = await trialCertificateFor(admin, booking.id, subject);
      if (cert.ok) {
        const link = `/certificate/trial/${booking.id}`;
        const { data: sent } = await admin
          .from('notifications').select('id').eq('user_id', subject).eq('link', link).limit(1);
        if (!sent || sent.length === 0) {
          await notifyUsers([{
            userId: subject,
            type: 'certificate_ready',
            title: 'Your trial completion certificate is ready',
            message: `${cert.certificate.course} · ${cert.certificate.grade} — view and download it any time.`,
            link,
            email: true,
          }]);
        }
      }
    }

    const roster = await trialRoster(admin, booking);
    const { data: rows } = await admin
      .from('class_feedback')
      .select('author_role, subject_student_id, rating, remarks')
      .eq('booking_id', body.bookingId);

    const gate = payGate(roster, (rows ?? []) as ClassFeedback[]);
    gateMessage = gate.message;

    if (gate.unlocked) {
      payReleased = await payForTrial(admin, booking, roster.length);
    }

    /* The lead moves as soon as THIS child's write-up exists, not when the
       whole class is finished. A family whose child was written up first
       should not wait for a sibling's classmate before their seller is told
       the trial went well — the pay gate is about the teacher, not them. */
    if (subject) await advanceLeadStage(admin, booking, subject);
  }

  return NextResponse.json({ ok: true, payReleased, gateMessage });
}

/**
 * The child did not come.
 *
 * ── Why this is a whole branch and not a flag ───────────────────────────────
 * Everything downstream differs. There is no rating, so nothing is written to
 * class_feedback. The lead does not go forward to the closing conversation; it
 * goes back to the gathering pool, because the thing that was supposed to sell
 * the course did not happen. And the seller needs a different verb — rebook,
 * not close.
 *
 * The teacher is still paid: they turned up and waited, which is the deal.
 * That is why this does NOT touch the pay gate — payGate() already treats an
 * absent child as written up, so one no-show cannot hold a whole class's fee.
 */
async function markNoShow(
  admin: Admin,
  booking: Booking,
  studentId: string | null,
  teacherId: string
): Promise<NextResponse> {
  if (!studentId) {
    return NextResponse.json(
      { ok: false, error: 'missing_subject', message: 'Say which student did not attend.' },
      { status: 400 }
    );
  }

  const roster = await trialRoster(admin, booking);
  if (roster.length > 0 && !roster.some((r) => r.id === studentId)) {
    return NextResponse.json(
      { ok: false, error: 'not_in_class', message: 'That student was not in this class.' },
      { status: 409 }
    );
  }

  await markAttendance(admin, booking.id, studentId, 'absent', teacherId);

  const now = new Date().toISOString();
  const leads = await leadsForTrial(admin, booking, studentId);

  for (const lead of leads) {
    /* `gathering_booked` rather than a new 'gathering' stage. This pipeline
       already carries four hand-written stage lists and the fourth was stale;
       a fifth name for one place a lead sits is how a board starts
       double-counting. The trial_status carries the actual reason. */
    await bestEffort(
      'trial-feedback: no-show stage',
      admin
        .from('student_leads')
        .update({ stage: 'gathering_booked', trial_status: 'no_show', last_updated: now, updated_at: now })
        .eq('id', lead.id)
        .not('stage', 'in', '("enrolled")')
    );

    await bestEffort(
      'trial-feedback: no-show note',
      admin.from('lead_notes').insert({
        lead_id: lead.id,
        author_id: teacherId,
        author_role: 'teacher',
        priority: 'high',
        category: 'no_show',
        note: 'Student did not attend the trial. Needs rebooking.',
      })
    );

    if (lead.assigned_seller) {
      await bestEffort(
        'trial-feedback: notify seller of no-show',
        admin.from('notifications').insert({
          user_id: lead.assigned_seller,
          type: 'trial_no_show',
          title: 'A trial was missed',
          message: `${lead.student_name ?? 'A student'} did not attend their trial. Ring them and rebook.`,
          link: '/dashboard/seller',
        })
      );
    }

    await recordEvent(admin, {
      event: 'trial.no_show',
      subjectType: 'lead',
      subjectId: lead.id,
      actorId: teacherId,
      payload: { bookingId: booking.id, studentId },
    });
  }

  return NextResponse.json({
    ok: true,
    outcome: 'no_show',
    leadsMoved: leads.length,
    message: leads.length
      ? 'Recorded. Their seller has been told to rebook.'
      : 'Recorded. There was no lead attached to this student to move.',
  });
}

/**
 * One row per child per class, the same table every other class uses.
 *
 * Idempotent on (booking_id, student_id): a teacher correcting themselves —
 * marked absent, then the child appears — must overwrite rather than leave two
 * contradictory rows for the same half hour.
 */
async function markAttendance(
  admin: Admin,
  bookingId: string,
  studentId: string,
  status: 'present' | 'absent',
  markedBy: string
): Promise<void> {
  await bestEffort(
    `trial-feedback: attendance ${status}`,
    admin.from('session_attendance').upsert(
      {
        booking_id: bookingId,
        student_id: studentId,
        status,
        marked_at: new Date().toISOString(),
        marked_by: markedBy,
      },
      { onConflict: 'booking_id,student_id' }
    )
  );
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
async function advanceLeadStage(admin: Admin, booking: Booking, studentId: string): Promise<void> {
  const now = new Date().toISOString();
  const leads = await leadsForTrial(admin, booking, studentId);

  for (const lead of leads) {
    /* Only forward. A lead already enrolled has moved past `final`, and
       dragging it back would tell a seller to re-close a sale they have
       already made. */
    await bestEffort(
      'trial-feedback: advance to final',
      admin
        .from('student_leads')
        .update({
          stage: 'final',
          /* The seller's queue reads this, not the stage. `final` alone says
             where the lead is; this says what it is waiting for. */
          trial_status: 'final_conversation_pending',
          updated_at: now,
          last_updated: now,
        })
        .eq('id', lead.id)
        .not('stage', 'in', '("final","enrolled")')
    );

    if (lead.assigned_seller) {
      await bestEffort(
        'trial-feedback: notify seller of completion',
        admin.from('notifications').insert({
          user_id: lead.assigned_seller,
          type: 'trial_completed',
          title: 'A trial is finished — ring them',
          message: `${lead.student_name ?? 'A student'} has had their trial class. They are in your Final Conversation queue.`,
          link: '/dashboard/seller',
        })
      );
    }

    await recordEvent(admin, {
      event: 'trial.completed',
      subjectType: 'lead',
      subjectId: lead.id,
      payload: { bookingId: booking.id, studentId },
    });
  }

  if (booking.demo_request_id) {
    await bestEffort(
      'trial-feedback: demo request completed',
      admin
        .from('demo_class_requests')
        .update({ status: 'completed', updated_at: now })
        .eq('id', booking.demo_request_id)
    );
  }
}

/**
 * The lead (or leads) this trial belongs to.
 *
 * ── The bug this replaced ───────────────────────────────────────────────────
 * This used to be a single `.eq('demo_request_id', …)` behind an early return
 * on that column being null. Self-booked trials — the whole public booking
 * page — never have a demo request; they are joined to their lead by
 * `student_leads.booking_id`, which was written by the spine migration and
 * never read here.
 *
 * So the branch returned immediately and NO SELF-BOOKED TRIAL HAS EVER MOVED
 * TO `final`. The teacher wrote the class up, was paid, and the seller's board
 * never changed — the family sat in Trial Booked forever, with nothing
 * anywhere to say the class had happened.
 *
 * Three joins now, most specific first, and the results de-duplicated because
 * a lead can legitimately match on two of them at once.
 */
async function leadsForTrial(
  admin: Admin,
  booking: Booking,
  studentId: string | null
): Promise<{ id: string; assigned_seller: string | null; student_name: string | null }[]> {
  const found = new Map<string, { id: string; assigned_seller: string | null; student_name: string | null }>();

  const collect = (rows: unknown[] | null | undefined) => {
    for (const r of (rows ?? []) as Record<string, unknown>[]) {
      const id = r.id as string;
      if (id && !found.has(id)) {
        found.set(id, {
          id,
          assigned_seller: (r.assigned_seller as string | null) ?? null,
          student_name: (r.student_name as string | null) ?? null,
        });
      }
    }
  };

  const cols = 'id, assigned_seller, student_name';

  try {
    const { data } = await admin.from('student_leads').select(cols).eq('booking_id', booking.id);
    collect(data);
  } catch { /* the column predates some deployments; the other two still work */ }

  if (studentId) {
    try {
      const { data } = await admin.from('student_leads').select(cols).eq('student_id', studentId);
      collect(data);
    } catch { /* same */ }
  }

  if (booking.demo_request_id) {
    try {
      const { data } = await admin.from('student_leads').select(cols).eq('demo_request_id', booking.demo_request_id);
      collect(data);
    } catch { /* same */ }
  }

  return [...found.values()];
}
