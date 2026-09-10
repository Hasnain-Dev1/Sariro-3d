/* Deliberately NOT 'use client' — imported by API routes as well as screens. */

/**
 * SARIRO — when the Super Admin is allowed to hear about it
 * ============================================================================
 * A child has paid for lessons they missed. Somebody has to actually teach
 * them, and the only person who can arrange that is their teacher.
 *
 * The founder's rule is that the Super Admin must NOT be part of the normal
 * path. A dashboard that lists every obligation the moment it is created is a
 * dashboard nobody reads by the second week, and then the one case that
 * genuinely needed a person is sitting in the middle of forty that did not.
 *
 * So for the first three days this is entirely between the teacher and their
 * reminders. Only when a deadline actually passes does anyone else see it, and
 * then it goes to the teacher's own admin first, and to HR after that.
 *
 * ── Each missed lesson carries its own clock ────────────────────────────────
 * Five lessons created together are five separate obligations. A teacher who
 * schedules two of them has done two-fifths of the job, and the remaining
 * three keep the deadline they were born with. Restarting the clock on a
 * partial effort would let an obligation be deferred for ever, three days at a
 * time, by scheduling one thing a week.
 */

/** How long each stage lasts. Stored in app_settings, never in the code. */
export interface EscalationConfig {
  /** Hours the teacher gets before anyone else is told. Default 72. */
  adminEscalationHours: number;
  /** Hours before HR is told as well. Default 120. */
  hrEscalationHours: number;
}

export const DEFAULT_ESCALATION: EscalationConfig = {
  adminEscalationHours: 72,
  hrEscalationHours: 120,
};

/** Keys in app_settings, so the whole thing is tunable without a deploy. */
export const ESCALATION_SETTING_KEYS = {
  adminEscalationHours: 'catchup_admin_escalation_hours',
  hrEscalationHours: 'catchup_hr_escalation_hours',
} as const;

/**
 * Read the config out of whatever app_settings returned.
 *
 * Anything missing or unparseable falls back to the default rather than to
 * zero — a misread setting must never mean "escalate everything immediately",
 * which would bury the Super Admin in exactly the noise this design exists to
 * prevent.
 */
export function readEscalationConfig(
  settings: Readonly<Record<string, string | number | null | undefined>>
): EscalationConfig {
  const num = (key: string, fallback: number) => {
    const raw = settings?.[key];
    const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const admin = num(ESCALATION_SETTING_KEYS.adminEscalationHours, DEFAULT_ESCALATION.adminEscalationHours);
  const hrRaw = num(ESCALATION_SETTING_KEYS.hrEscalationHours, DEFAULT_ESCALATION.hrEscalationHours);
  return {
    adminEscalationHours: admin,
    /* HR cannot come before the admin. A config where it did would mean HR is
       told about something the teacher's own manager has not seen yet. */
    hrEscalationHours: Math.max(admin, hrRaw),
  };
}

export type EscalationLevel = 'teacher' | 'admin' | 'hr';

/** One missed lesson, and whether anybody has done anything about it. */
export interface CatchUpObligation {
  id: string;
  lessonNumber: number;
  lessonTitle?: string | null;
  /** When this obligation came into existence. Its own clock starts here. */
  createdAt: string;
  /** Set once a session exists for it. */
  scheduledAt?: string | null;
  completedAt?: string | null;
}

const HOUR = 3_600_000;

/** When this one had to be scheduled by. */
export function deadlineFor(createdAt: string, config: EscalationConfig): number {
  return Date.parse(createdAt) + config.adminEscalationHours * HOUR;
}

/**
 * Who should be able to see this obligation right now.
 *
 * Scheduled and completed obligations never escalate — the job was done, and
 * how late it was done is a question for a performance review rather than an
 * exception panel.
 */
export function levelFor(
  o: CatchUpObligation,
  now: number,
  config: EscalationConfig = DEFAULT_ESCALATION
): EscalationLevel {
  if (o.scheduledAt || o.completedAt) return 'teacher';
  const born = Date.parse(o.createdAt);
  if (!Number.isFinite(born)) return 'teacher';
  const hours = (now - born) / HOUR;
  if (hours >= config.hrEscalationHours) return 'hr';
  if (hours >= config.adminEscalationHours) return 'admin';
  return 'teacher';
}

/** The nudges a teacher gets while it is still only their problem. */
export type ReminderStage = 'created' | 'day_1' | 'day_2' | 'final' | 'overdue' | null;

/**
 * Which reminder is due, given the last one already sent.
 *
 * Returns null when nothing new is owed, so a scheduler can run every ten
 * minutes and send a message only when the stage actually changes.
 */
export function reminderDue(
  o: CatchUpObligation,
  now: number,
  lastSent: ReminderStage = null,
  config: EscalationConfig = DEFAULT_ESCALATION
): ReminderStage {
  if (o.scheduledAt || o.completedAt) return null;
  const born = Date.parse(o.createdAt);
  if (!Number.isFinite(born)) return null;

  const hours = (now - born) / HOUR;
  const deadline = config.adminEscalationHours;

  /* Proportional to the deadline rather than fixed at 24/48/72, so shortening
     the window in settings does not silently produce a single reminder that
     arrives after it has already expired. */
  const stage: ReminderStage =
    hours >= deadline ? 'overdue'
      : hours >= deadline * (2 / 3) ? 'final'
        : hours >= deadline * (1 / 2) ? 'day_2'
          : hours >= deadline * (1 / 3) ? 'day_1'
            : 'created';

  const order: ReminderStage[] = ['created', 'day_1', 'day_2', 'final', 'overdue'];
  const at = order.indexOf(stage);
  const already = lastSent ? order.indexOf(lastSent) : -1;
  return at > already ? stage : null;
}

/** Everything a panel needs about one student's outstanding catch-up. */
export interface CatchUpCase {
  total: number;
  scheduled: number;
  unscheduled: number;
  completed: number;
  /** The obligations still with nothing arranged, oldest first. */
  pending: CatchUpObligation[];
  /** The earliest deadline among the pending ones, as an ISO string. */
  earliestDeadline: string | null;
  /** Whole days past that deadline. 0 when nothing is overdue. */
  daysOverdue: number;
  level: EscalationLevel;
  /** True while anything remains unscheduled and its deadline has passed. */
  escalated: boolean;
}

/**
 * Roll a student's obligations into the one case a panel shows.
 *
 * The case stays open while ANY obligation is unscheduled — scheduling three
 * of five is progress, not completion — and closes itself the moment the last
 * one is arranged. Nobody has to remember to tidy it away.
 */
export function summariseCase(
  obligations: readonly CatchUpObligation[],
  now: number,
  config: EscalationConfig = DEFAULT_ESCALATION
): CatchUpCase {
  const all = [...obligations];
  const completed = all.filter((o) => o.completedAt).length;
  const pending = all
    .filter((o) => !o.scheduledAt && !o.completedAt)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const scheduled = all.filter((o) => o.scheduledAt && !o.completedAt).length;

  const deadlines = pending
    .map((o) => deadlineFor(o.createdAt, config))
    .filter((n) => Number.isFinite(n));
  const earliest = deadlines.length > 0 ? Math.min(...deadlines) : null;

  /* The worst level among the pending ones. A case where four are merely late
     and one has reached HR is an HR case. */
  const level: EscalationLevel = pending.reduce<EscalationLevel>((worst, o) => {
    const l = levelFor(o, now, config);
    if (worst === 'hr' || l === 'hr') return 'hr';
    if (worst === 'admin' || l === 'admin') return 'admin';
    return 'teacher';
  }, 'teacher');

  return {
    total: all.length,
    scheduled,
    unscheduled: pending.length,
    completed,
    pending,
    earliestDeadline: earliest !== null ? new Date(earliest).toISOString() : null,
    daysOverdue: earliest !== null && now > earliest
      ? Math.floor((now - earliest) / 86_400_000)
      : 0,
    level,
    escalated: pending.length > 0 && level !== 'teacher',
  };
}
