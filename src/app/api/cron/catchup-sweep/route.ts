import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  reminderDue, levelFor, readEscalationConfig,
  type CatchUpObligation, type ReminderStage,
} from '@/lib/credits/catchup-escalation';

/**
 * SARIRO — GET/POST /api/cron/catchup-sweep
 *
 * The clock that makes the catch-up system self-driving. Two jobs, both of
 * which are "time has passed, so do something".
 *
 * ── 1. The teacher's ladder, then the escalation ────────────────────────────
 * §28: for three days a catch-up obligation is entirely between a teacher and
 * their reminders. Four nudges, spaced across the window, each sent once —
 * `last_reminder` on the row is what stops a sweep running every ten minutes
 * from sending the same message 144 times a day.
 *
 * Only when a deadline actually passes does anyone else hear about it, and
 * then the teacher's own admin first and HR after that. The panels already
 * derive the LEVEL from the same functions; this is what puts a message in
 * front of somebody who is not looking at a panel.
 *
 * ── 2. The seven days a schedule is held ────────────────────────────────────
 * §6: when a family runs out, everything about their arrangement is kept for a
 * week — teacher, group, curriculum position, recurring slot. That is what
 * makes resuming instant when they pay.
 *
 * After a week without payment the slot is released, because a 1:1 teacher's
 * Tuesday evening cannot be held open indefinitely for somebody who has not
 * come back. A GROUP is never touched: the group carries on, and the absent
 * child simply stops being expected.
 *
 * Nothing about their teacher, course or last completed lesson is destroyed on
 * either path. Paying still restarts them; it just may not be at the old time.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Never touch an unbounded number of rows in one run. */
const MAX_PER_RUN = 300;

function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed. This route writes booking statuses and student states.
  if (!secret) return false;
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get('key') === secret;
}

async function run(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json(
      {
        ok: false, error: 'unauthorised',
        message: process.env.CRON_SECRET
          ? 'Bad or missing cron secret.'
          : 'CRON_SECRET is not set on the server, so this route is disabled.',
      },
      { status: 401 }
    );
  }

  const dryRun = new URL(req.url).searchParams.get('dryRun') === '1';
  const admin = createServiceClient();
  const now = Date.now();

  const { data: settingRows } = await admin.from('app_settings').select('key, value');
  const settings = Object.fromEntries(
    ((settingRows ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value])
  );
  const config = readEscalationConfig(settings);

  /* ── 1. Reminders and escalation ──────────────────────────────────────── */
  const { data: pendingRaw } = await admin
    .from('catchup_lessons')
    .select('id, student_id, teacher_id, lesson_number, lesson_title, created_at, scheduled_at, completed_at, last_reminder')
    .eq('status', 'pending_scheduling')
    .limit(MAX_PER_RUN);

  const pending = (pendingRaw ?? []) as {
    id: string; student_id: string; teacher_id: string | null;
    lesson_number: number; lesson_title: string | null;
    created_at: string; scheduled_at: string | null; completed_at: string | null;
    last_reminder: string | null;
  }[];

  const notifications: Record<string, unknown>[] = [];
  const stamped: { id: string; stage: ReminderStage }[] = [];
  let escalatedToAdmin = 0;
  let escalatedToHr = 0;

  /* Managers, resolved once. §31 — reporting_admin_id and reporting_hr_id
     already existed on profiles and are reused rather than duplicated. */
  const teacherIds = [...new Set(pending.map((p) => p.teacher_id).filter(Boolean) as string[])];
  const { data: teachersRaw } = teacherIds.length
    ? await admin.from('profiles').select('id, full_name, reporting_admin_id, reporting_hr_id').in('id', teacherIds)
    : { data: [] };
  const teacherOf = new Map(
    ((teachersRaw ?? []) as Record<string, unknown>[]).map((t) => [String(t.id), t])
  );

  for (const p of pending) {
    const obligation: CatchUpObligation = {
      id: p.id,
      lessonNumber: p.lesson_number,
      lessonTitle: p.lesson_title,
      createdAt: p.created_at,
      scheduledAt: p.scheduled_at,
      completedAt: p.completed_at,
    };

    const stage = reminderDue(obligation, now, p.last_reminder as ReminderStage, config);
    if (!stage) continue;

    const lesson = `lesson ${p.lesson_number}${p.lesson_title ? ` — ${p.lesson_title}` : ''}`;

    if (p.teacher_id) {
      notifications.push({
        user_id: p.teacher_id,
        type: 'catchup_reminder',
        title: stage === 'overdue' ? 'Catch-up session overdue' : 'Catch-up session to arrange',
        message: TEACHER_WORDS[stage](lesson),
        link: '/dashboard/teacher#catchup',
      });
    }

    /* The moment it crosses a threshold, the people responsible for the
       teacher are told — once, on the same stamp, so nobody is emailed daily
       about the same thing. */
    if (stage === 'overdue' && p.teacher_id) {
      const t = teacherOf.get(p.teacher_id);
      const level = levelFor(obligation, now, config);
      const managerId = level === 'hr' ? t?.reporting_hr_id : t?.reporting_admin_id;
      if (managerId) {
        notifications.push({
          user_id: String(managerId),
          type: 'catchup_overdue',
          title: 'Catch-up scheduling overdue',
          message:
            `${t?.full_name ?? 'A teacher'} has not scheduled a catch-up session for ${lesson}. ` +
            `The deadline has passed — please follow up.`,
          link: level === 'hr' ? '/dashboard/hr' : '/dashboard/admin',
        });
        if (level === 'hr') escalatedToHr++; else escalatedToAdmin++;
      }
    }

    stamped.push({ id: p.id, stage });
  }

  /* ── 2. The seven days ────────────────────────────────────────────────── */
  const { data: lapsedRaw } = await admin
    .from('profiles')
    .select('id, full_name, credit_grace_period_ends_at')
    .eq('student_status', 'paused_credit_issue')
    .lt('credit_grace_period_ends_at', new Date(now).toISOString())
    .limit(MAX_PER_RUN);
  const lapsed = (lapsedRaw ?? []) as { id: string; full_name: string | null }[];

  let expired = 0;
  let slotsReleased = 0;

  if (!dryRun) {
    if (notifications.length > 0) {
      await admin.from('notifications').insert(notifications).then(() => {}, (e: unknown) => {
        console.warn('[catchup-sweep] notify failed:', e instanceof Error ? e.message : e);
      });
    }
    for (const s of stamped) {
      await admin.from('catchup_lessons')
        .update({ last_reminder: s.stage, updated_at: new Date(now).toISOString() })
        .eq('id', s.id);
    }

    for (const student of lapsed) {
      const released = await releaseHeldSlots(admin, student.id);
      slotsReleased += released;

      const { error } = await admin.from('profiles')
        .update({ student_status: 'paused_credit_expired' })
        .eq('id', student.id)
        .eq('student_status', 'paused_credit_issue');  // only once
      if (!error) expired++;

      await admin.from('notifications').insert({
        user_id: student.id,
        type: 'credit_grace_expired',
        title: 'Your class time has been released',
        message: released > 0
          ? 'Your weekly slot has been released so another family can use it. Your teacher, ' +
            'your course and everything you have completed are all still here — add credits ' +
            'and we will find you a new time.'
          : 'Your classes are still paused. Your teacher, your course and everything you have ' +
            'completed are all still here — add credits to start again.',
        link: '/dashboard/student',
      }).then(() => {}, () => {});
    }
  }

  return NextResponse.json({
    ok: true,
    ...(dryRun ? { dryRun: true } : {}),
    pendingObligations: pending.length,
    remindersSent: notifications.length,
    escalatedToAdmin,
    escalatedToHr,
    graceLapsed: lapsed.length,
    expired,
    slotsReleased,
  });
}

/** What each nudge says. Written as sentences a person would actually send. */
const TEACHER_WORDS: Record<Exclude<ReminderStage, null>, (lesson: string) => string> = {
  created: (l) => `A student has catch-up credits for ${l}. Please arrange a 30-minute session within 3 days.`,
  day_1: (l) => `Still to arrange: a catch-up session for ${l}.`,
  day_2: (l) => `A catch-up session for ${l} has not been scheduled yet.`,
  final: (l) => `Last reminder — a catch-up session for ${l} is due to be scheduled today.`,
  overdue: (l) => `The catch-up session for ${l} is now overdue and your admin has been notified.`,
};

/**
 * Give back a 1:1 learner's held slot once the grace period lapses.
 *
 * Only a 1:1 batch, and only when this learner is the last active person in
 * it. §6 is explicit that a GROUP is never affected: the group carries on and
 * the absent child simply stops being expected, so cancelling its classes
 * would punish four families for one family's payment.
 *
 * Only FUTURE classes, and the schedule rule itself is left alone — resuming
 * later regenerates from it, which is what keeps "add credits and we will find
 * you a new time" true.
 */
async function releaseHeldSlots(
  admin: ReturnType<typeof createServiceClient>,
  studentId: string
): Promise<number> {
  const { data: enrolments } = await admin
    .from('enrollments').select('cohort_id').eq('user_id', studentId).eq('status', 'active');
  const cohortIds = [...new Set((enrolments ?? []).map((e) => e.cohort_id).filter(Boolean) as string[])];
  if (cohortIds.length === 0) return 0;

  let released = 0;
  for (const cohortId of cohortIds) {
    const { data: cohort } = await admin
      .from('cohorts').select('ratio').eq('id', cohortId).maybeSingle();
    if ((cohort?.ratio ?? '').trim() !== '1:1') continue;

    // Somebody else is still in this batch: not this learner's slot to give back.
    const { count } = await admin.from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId).eq('status', 'active').neq('user_id', studentId);
    if ((count ?? 0) > 0) continue;

    const { data: cancelled } = await admin.from('bookings')
      .update({
        status: 'cancelled',
        cancel_reason: 'Credit grace period expired — slot released',
        cancel_type: 'credit_expired',
        cancelled_at: new Date().toISOString(),
      })
      .eq('cohort_id', cohortId)
      .eq('status', 'scheduled')
      .gt('slot_start', new Date().toISOString())
      .select('id');
    released += (cancelled ?? []).length;
  }
  return released;
}

export async function GET(req: NextRequest) { return run(req); }
export async function POST(req: NextRequest) { return run(req); }
