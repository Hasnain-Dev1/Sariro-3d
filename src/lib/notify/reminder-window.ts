/**
 * SARIRO — how long before a class somebody is reminded
 * ============================================================================
 * One reminder per class, claimed by `bookings.reminder_sent_at` so it is sent
 * once however often the job runs. What differs is WHEN:
 *
 *   an ordinary class   ~30 minutes before — the student has been here before
 *   a free trial        ~60 minutes before — a family who has never joined a
 *                       Sariro class, may not have the page open, and may need
 *                       the hour to get a child home, fed and at a laptop
 *
 * The job runs every ten minutes (lib/cron/schedule.ts), so each window is the
 * lead time plus a little slack: a trial due at 17:00 is reminded on whichever
 * run lands between 15:55 and 16:05. A window SMALLER than the interval would
 * silently skip classes, which is the failure worth designing against; a
 * slightly early reminder costs nothing.
 */

/** Ordinary classes: the existing default, unchanged. */
export const CLASS_REMINDER_MIN = 35;
/** Free trials: an hour, plus the slack. */
export const TRIAL_REMINDER_MIN = 65;

/** How far ahead the job must look to catch both kinds. */
export function lookaheadMinutes(classWindowMin: number = CLASS_REMINDER_MIN): number {
  return Math.max(classWindowMin, TRIAL_REMINDER_MIN);
}

/**
 * Whether a class starting at `slotStartMs` should be reminded on this run.
 *
 * A class already started is never reminded — "your class started 4 minutes
 * ago" is not a reminder.
 */
export function dueForReminder(opts: {
  slotStartMs: number;
  nowMs: number;
  isTrial: boolean;
  classWindowMin?: number;
}): boolean {
  const ahead = opts.slotStartMs - opts.nowMs;
  if (!Number.isFinite(ahead) || ahead <= 0) return false;
  const window = opts.isTrial ? TRIAL_REMINDER_MIN : (opts.classWindowMin ?? CLASS_REMINDER_MIN);
  return ahead <= window * 60_000;
}
