/* Deliberately NOT 'use client'. Imported by API routes only. */

import type { SupabaseClient } from '@supabase/supabase-js';
import { allocate, missedBetween, type StudentKind, type MissedLesson } from './allocation';
import { DEFAULT_ESCALATION, readEscalationConfig } from './catchup-escalation';

/**
 * SARIRO — money arrives, and everything else happens by itself
 * ============================================================================
 * The founder's rule for this whole feature is that the Super Admin is not
 * part of it. A family pays and the system works out, on its own, what they
 * missed, what the payment covers, whether they can start again, which lessons
 * a teacher now owes them, and by when.
 *
 * So this is the one place credits are ever added, and everything downstream
 * hangs off it.
 *
 * ── Why the ledger is written before the balance ────────────────────────────
 * There is no transaction across PostgREST. The house pattern — the one
 * /api/teacher/complete-class already uses to spend a credit — is to write the
 * ledger row FIRST, because it carries the unique index, and only then apply
 * the balance. A crash between the two leaves a recorded movement that has not
 * been applied, which is visible and repairable. The other order leaves money
 * that appeared from nowhere, which is neither.
 *
 * ── Why both balances move in ONE update ────────────────────────────────────
 * §12: a family must never see all eight credits land in the main balance and
 * three of them disappear a moment later. The first number is the one they
 * remember, and it was never true. Everything is computed before anything is
 * written, and the two columns change together in a single statement.
 */

export interface AddCreditsInput {
  studentId: string;
  /** How many classes were paid for. Positive. */
  credits: number;
  /** What to write on the ledger row. */
  reason: string;
  /** Who did it. Null for an automated payment. */
  actorId?: string | null;
  /**
   * The payment this came from, when there is one. Carries a unique index, so
   * a webhook firing twice cannot buy the same course twice.
   */
  paymentTransactionId?: string | null;
}

export interface AddCreditsResult {
  ok: boolean;
  /** True when an identical payment had already been applied. */
  duplicate?: boolean;
  mainAdded: number;
  catchupAdded: number;
  mainBalance: number;
  catchupBalance: number;
  /** Missed lessons this payment turned into catch-up obligations. */
  catchupLessons: MissedLesson[];
  /** Missed lessons still unfunded after this payment. */
  stillUnfunded: MissedLesson[];
  resumed: boolean;
  resumeAtLesson: number | null;
  /** The sentence to show the family, straight from the allocator. */
  message: string;
  error?: string;
}

const fail = (error: string): AddCreditsResult => ({
  ok: false, error, mainAdded: 0, catchupAdded: 0, mainBalance: 0, catchupBalance: 0,
  catchupLessons: [], stillUnfunded: [], resumed: false, resumeAtLesson: null, message: '',
});

/**
 * Add credits, work out what they buy, and restart the student if they can be.
 */
export async function addCredits(
  admin: SupabaseClient,
  input: AddCreditsInput
): Promise<AddCreditsResult> {
  const credits = Math.floor(Number(input.credits));
  if (!Number.isFinite(credits) || credits <= 0) return fail('credits_must_be_positive');

  /* ── Is the two-balance schema actually there? ───────────────────────────
     Code and migration deploy separately, and this project has twice shipped a
     migration that was installed and did not run. Without the check, adding
     credits on a database that has not had credit-pause-and-catchup.sql
     applied would fail outright on an unknown column — turning a missing
     migration into "nobody can pay us". Falling back to the old single-balance
     add is worse than the new behaviour and far better than none. */
  if (!(await hasTwoBalances(admin))) {
    return legacyAdd(admin, input, credits);
  }

  /* ── Has this payment already been applied? ───────────────────────────────
     Checked before anything else. A gateway retry, a double-clicked button and
     a replayed webhook all arrive here looking identical. */
  if (input.paymentTransactionId) {
    const { data: seen } = await admin
      .from('credit_transactions')
      .select('id')
      .eq('payment_transaction_id', input.paymentTransactionId)
      .limit(1)
      .maybeSingle();
    if (seen) {
      const bal = await readBalances(admin, input.studentId);
      return {
        ok: true, duplicate: true, mainAdded: 0, catchupAdded: 0,
        mainBalance: bal.main, catchupBalance: bal.catchup,
        catchupLessons: [], stillUnfunded: [], resumed: false, resumeAtLesson: null,
        message: 'This payment has already been added to the account.',
      };
    }
  }

  const context = await readContext(admin, input.studentId);

  /* Missed lessons that no catch-up credit has been bought for yet. The ones
     already funded are excluded, so a second payment does not create a second
     obligation for the same lesson. */
  const unfundedMissed = context.kind === 'group'
    ? context.missed.filter((m) => !context.alreadyFunded.has(m.lessonNumber))
    : [];

  const plan = allocate({
    kind: context.kind,
    creditsAdded: credits,
    unfundedMissed,
    groupCurrentLesson: context.groupCurrentLesson,
    lastCompletedLesson: context.lastCompletedLesson,
  });

  // ── The ledger first: it is the claim. ────────────────────────────────────
  const ledger: Record<string, unknown>[] = [];
  if (plan.mainAdded > 0) {
    ledger.push({
      user_id: input.studentId, amount: plan.mainAdded, type: 'purchase',
      balance_kind: 'main', description: input.reason,
      created_by: input.actorId ?? null,
      payment_transaction_id: input.paymentTransactionId ?? null,
    });
  }
  if (plan.catchupAdded > 0) {
    ledger.push({
      user_id: input.studentId, amount: plan.catchupAdded, type: 'catchup_allocation',
      balance_kind: 'catchup',
      description:
        `${input.reason} — allocated to ${plan.catchupAdded} missed ` +
        `${plan.catchupAdded === 1 ? 'lesson' : 'lessons'} ` +
        `(${plan.fundedLessons.map((l) => l.lessonNumber).join(', ')})`,
      created_by: input.actorId ?? null,
      /* Only one row can carry the payment id — it is unique. The main row
         takes it when there is one, otherwise this one does. */
      payment_transaction_id: plan.mainAdded > 0 ? null : (input.paymentTransactionId ?? null),
    });
  }

  if (ledger.length > 0) {
    const { error } = await admin.from('credit_transactions').insert(ledger);
    if (error) {
      // 23505 on the payment index means somebody else won the race. Not a
      // failure — the credits are being applied by that request.
      if ((error as { code?: string }).code === '23505') {
        const bal = await readBalances(admin, input.studentId);
        return {
          ok: true, duplicate: true, mainAdded: 0, catchupAdded: 0,
          mainBalance: bal.main, catchupBalance: bal.catchup,
          catchupLessons: [], stillUnfunded: [], resumed: false, resumeAtLesson: null,
          message: 'This payment has already been added to the account.',
        };
      }
      return fail(error.message);
    }
  }

  // ── Then the balances, both in one statement. ─────────────────────────────
  const before = await readBalances(admin, input.studentId);
  const mainBalance = before.main + plan.mainAdded;
  const catchupBalance = before.catchup + plan.catchupAdded;
  const { error: balErr } = await admin.from('credits').upsert(
    { user_id: input.studentId, balance: mainBalance, catchup_balance: catchupBalance },
    { onConflict: 'user_id' }
  );
  if (balErr) return fail(balErr.message);

  // ── The lessons a teacher now owes, one row each. ─────────────────────────
  if (plan.fundedLessons.length > 0) {
    const deadlineHours = context.escalation.adminEscalationHours;
    const now = Date.now();
    const rows = plan.fundedLessons.map((l) => ({
      student_id: input.studentId,
      cohort_id: context.cohortId,
      teacher_id: context.teacherId,
      track: context.track,
      level: context.level,
      lesson_number: l.lessonNumber,
      lesson_title: l.lessonTitle ?? null,
      status: 'pending_scheduling',
      /* Its own clock, from now. Scheduling one of five must never buy time
         for the other four — see lib/credits/catchup-escalation.ts. */
      scheduling_deadline: new Date(now + deadlineHours * 3_600_000).toISOString(),
      created_by: input.actorId ?? null,
    }));
    // A unique index makes the same lesson unrepeatable; ignore the collision.
    const { error } = await admin.from('catchup_lessons').insert(rows);
    if (error && (error as { code?: string }).code !== '23505') {
      console.warn('[credits] catch-up rows failed:', error.message);
    }
  }

  // ── Start them again, if there is anything to start with. ─────────────────
  let resumed = false;
  if (plan.canResume) {
    const { error } = await admin.from('profiles').update({
      student_status: 'active',
      credit_paused_at: null,
      credit_grace_period_ends_at: null,
    }).eq('id', input.studentId);
    resumed = !error;
  }

  await notify(admin, {
    studentId: input.studentId,
    teacherId: context.teacherId,
    plan,
    resumed,
  });

  return {
    ok: true,
    mainAdded: plan.mainAdded,
    catchupAdded: plan.catchupAdded,
    mainBalance,
    catchupBalance,
    catchupLessons: plan.fundedLessons,
    stillUnfunded: plan.stillUnfunded,
    resumed,
    resumeAtLesson: plan.resumeAtLesson,
    message: plan.message,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   Surviving a migration that has not been applied yet
   ══════════════════════════════════════════════════════════════════════════ */

/** Cached per process: the schema does not change while the server is up. */
let twoBalances: boolean | null = null;

async function hasTwoBalances(admin: SupabaseClient): Promise<boolean> {
  if (twoBalances !== null) return twoBalances;
  const { error } = await admin.from('credits').select('catchup_balance').limit(1);
  // 42703 is "column does not exist" — anything else (an empty table, a
  // network blip) is not evidence the migration is missing.
  twoBalances = (error as { code?: string } | null)?.code !== '42703';
  if (!twoBalances) {
    console.warn('[credits] credit-pause-and-catchup.sql has not been run; adding credits the old way.');
  }
  return twoBalances;
}

/** What this route did before two balances existed: add, and record it. */
async function legacyAdd(
  admin: SupabaseClient,
  input: AddCreditsInput,
  credits: number
): Promise<AddCreditsResult> {
  const { data } = await admin.from('credits').select('balance').eq('user_id', input.studentId).maybeSingle();
  const balance = Number(data?.balance ?? 0) + credits;

  const { error: txErr } = await admin.from('credit_transactions').insert({
    user_id: input.studentId, amount: credits, type: 'purchase',
    description: input.reason, created_by: input.actorId ?? null,
  });
  if (txErr) return fail(txErr.message);

  const { error } = await admin.from('credits')
    .upsert({ user_id: input.studentId, balance }, { onConflict: 'user_id' });
  if (error) return fail(error.message);

  return {
    ok: true, mainAdded: credits, catchupAdded: 0,
    mainBalance: balance, catchupBalance: 0,
    catchupLessons: [], stillUnfunded: [], resumed: false, resumeAtLesson: null,
    message: `${credits} ${credits === 1 ? 'credit' : 'credits'} added.`,
  };
}

/** Test seam: forget what we learned about the schema. */
export function resetSchemaCacheForTests(): void {
  twoBalances = null;
}

/* ══════════════════════════════════════════════════════════════════════════
   Reading where a student stands
   ══════════════════════════════════════════════════════════════════════════ */

interface Context {
  kind: StudentKind;
  cohortId: string | null;
  teacherId: string | null;
  track: string | null;
  level: string | null;
  lastCompletedLesson: number | null;
  groupCurrentLesson: number | null;
  missed: MissedLesson[];
  /** Lessons that already have a catch-up obligation, funded or scheduled. */
  alreadyFunded: Set<number>;
  escalation: typeof DEFAULT_ESCALATION;
}

async function readContext(admin: SupabaseClient, studentId: string): Promise<Context> {
  const empty: Context = {
    kind: 'one_to_one', cohortId: null, teacherId: null, track: null, level: null,
    lastCompletedLesson: null, groupCurrentLesson: null, missed: [],
    alreadyFunded: new Set(), escalation: DEFAULT_ESCALATION,
  };

  const { data: enrolment } = await admin
    .from('enrollments')
    .select('cohort_id, ratio, track, level')
    .eq('user_id', studentId).eq('status', 'active')
    .order('enrolled_at', { ascending: false })
    .limit(1).maybeSingle();

  const settings = await readSettings(admin);
  const escalation = readEscalationConfig(settings);

  if (!enrolment?.cohort_id) return { ...empty, escalation };

  const cohortId = enrolment.cohort_id as string;
  const { data: cohort } = await admin
    .from('cohorts').select('ratio, track, level').eq('id', cohortId).maybeSingle();

  /* '1:1' is the only shape with nobody else in the room. Everything else —
     1:2, 1:4 — is a group that carries on without an absent child. */
  const ratio = (cohort?.ratio ?? enrolment.ratio ?? '') as string;
  const kind: StudentKind = ratio.trim() === '1:1' ? 'one_to_one' : 'group';

  const [{ data: classes }, { data: attended }, { data: funded }] = await Promise.all([
    admin.from('bookings')
      .select('id, module_num, lesson_name, status, slot_start, teacher_id')
      .eq('cohort_id', cohortId)
      .not('module_num', 'is', null)
      .order('slot_start', { ascending: true }),
    admin.from('session_attendance')
      .select('booking_id, status').eq('student_id', studentId),
    admin.from('catchup_lessons')
      .select('lesson_number').eq('student_id', studentId).neq('status', 'cancelled'),
  ]);

  const all = (classes ?? []) as {
    id: string; module_num: number; lesson_name: string | null;
    status: string; slot_start: string; teacher_id: string | null;
  }[];

  const wasThere = new Set(
    ((attended ?? []) as { booking_id: string; status: string }[])
      .filter((a) => a.status === 'present' || a.status === 'late')
      .map((a) => a.booking_id)
  );

  /* The last lesson this child actually sat in. Not "the last one the batch
     did" and not a count of their credits — attendance is the only record of
     what they were actually in the room for. */
  const lastCompletedLesson = all
    .filter((b) => b.status === 'completed' && wasThere.has(b.id))
    .reduce<number | null>((max, b) => (max === null || b.module_num > max ? b.module_num : max), null);

  /* Where the group is now: the next class it will actually teach. That is the
     lesson a returning child rejoins at, and §16 makes it the source of truth
     rather than anything on the child's own record. */
  const nextUp = all.find((b) => b.status === 'scheduled' && Date.parse(b.slot_start) >= Date.now());
  const groupCurrentLesson = nextUp?.module_num
    ?? all.filter((b) => b.status === 'completed')
      .reduce<number | null>((max, b) => (max === null || b.module_num > max ? b.module_num : max), null);

  const titleByNumber = new Map<number, string | null>(
    all.map((b) => [b.module_num, b.lesson_name])
  );

  return {
    kind,
    cohortId,
    teacherId: nextUp?.teacher_id ?? all[all.length - 1]?.teacher_id ?? null,
    track: (cohort?.track ?? enrolment.track ?? null) as string | null,
    level: (cohort?.level ?? enrolment.level ?? null) as string | null,
    lastCompletedLesson,
    groupCurrentLesson: groupCurrentLesson ?? null,
    missed: kind === 'group'
      ? missedBetween(lastCompletedLesson, groupCurrentLesson, (n) => titleByNumber.get(n) ?? null)
      : [],
    alreadyFunded: new Set(
      ((funded ?? []) as { lesson_number: number }[]).map((f) => f.lesson_number)
    ),
    escalation,
  };
}

async function readBalances(admin: SupabaseClient, studentId: string) {
  const { data } = await admin
    .from('credits').select('balance, catchup_balance').eq('user_id', studentId).maybeSingle();
  return {
    main: Number(data?.balance ?? 0),
    catchup: Number(data?.catchup_balance ?? 0),
  };
}

async function readSettings(admin: SupabaseClient): Promise<Record<string, string>> {
  const { data } = await admin.from('app_settings').select('key, value');
  return Object.fromEntries(
    ((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value])
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Telling the two people who need to know
   ══════════════════════════════════════════════════════════════════════════ */

async function notify(
  admin: SupabaseClient,
  a: {
    studentId: string;
    teacherId: string | null;
    plan: ReturnType<typeof allocate>;
    resumed: boolean;
  }
): Promise<void> {
  const rows: Record<string, unknown>[] = [{
    user_id: a.studentId,
    type: 'credits_added',
    title: a.plan.canResume ? 'Your classes are back on' : 'Credits added',
    message: a.plan.message,
    link: '/dashboard/student',
  }];

  /* The teacher is told only when they now owe somebody a lesson. A message
     saying "a student paid" is not something a teacher can act on. */
  if (a.teacherId && a.plan.fundedLessons.length > 0) {
    const numbers = a.plan.fundedLessons.map((l) => l.lessonNumber).join(', ');
    rows.push({
      user_id: a.teacherId,
      type: 'catchup_required',
      title: 'Catch-up sessions to arrange',
      message:
        `A student has resumed and missed ${a.plan.fundedLessons.length} ` +
        `${a.plan.fundedLessons.length === 1 ? 'lesson' : 'lessons'} (${numbers}). ` +
        `Please schedule their catch-up sessions within 3 days.`,
      link: '/dashboard/teacher',
    });
  }

  await admin.from('notifications').insert(rows).then(() => {}, (e: unknown) => {
    console.warn('[credits] notify failed:', e instanceof Error ? e.message : e);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   The other half: running out
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Pause a student the moment their main balance reaches zero.
 *
 * Called after a class is marked complete, which is where a credit is spent.
 * §2 — no admin action, no button. The seven-day grace period starts here and
 * nothing about their schedule, teacher, group or curriculum position is
 * touched: those are what make resuming automatic later.
 */
export async function pauseIfExhausted(
  admin: SupabaseClient,
  studentId: string
): Promise<{ paused: boolean }> {
  try {
    const { data } = await admin
      .from('credits').select('balance').eq('user_id', studentId).maybeSingle();
    if (Number(data?.balance ?? 0) > 0) return { paused: false };

    const { data: profile } = await admin
      .from('profiles').select('student_status').eq('id', studentId).maybeSingle();
    // Already paused: leave the original clock alone. Restarting the grace
    // period on every subsequent class would make it never expire.
    if (profile?.student_status && profile.student_status !== 'active') return { paused: false };

    const settings = await readSettings(admin);
    const days = Number(settings.credit_grace_period_days) > 0
      ? Number(settings.credit_grace_period_days)
      : 7;
    const now = Date.now();

    const { error } = await admin.from('profiles').update({
      student_status: 'paused_credit_issue',
      credit_paused_at: new Date(now).toISOString(),
      credit_grace_period_ends_at: new Date(now + days * 86_400_000).toISOString(),
    }).eq('id', studentId);
    if (error) return { paused: false };

    await admin.from('notifications').insert({
      user_id: studentId,
      type: 'credits_exhausted',
      title: 'Your class credits have run out',
      message:
        'Your upcoming classes are paused for now. Add credits and they start again ' +
        'straight away — your teacher, your group and your place in the course are all held.',
      link: '/dashboard/student',
    }).then(() => {}, () => {});

    return { paused: true };
  } catch (err) {
    // Never fatal: a class was just taught, and failing to pause must not undo
    // marking it complete.
    console.warn('[credits] pause failed:', err instanceof Error ? err.message : err);
    return { paused: false };
  }
}
