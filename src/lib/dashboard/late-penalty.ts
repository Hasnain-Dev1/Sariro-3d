/**
 * SARIRO — the late-join penalty, in one place
 * ============================================================================
 * The rule every teacher reads on their payout screen:
 *
 *     "More than 5 minutes after the scheduled start — ₹100"
 *
 * No upper bound. That is the promise the product makes.
 *
 * ── The gap this closes ─────────────────────────────────────────────────────
 * The database trigger implemented `> 5 and <= 10 minutes`, on the assumption
 * that anything later would be finalised as a no-show by the app instead. When
 * that does not happen — nobody runs the no-show finaliser, or the teacher
 * marks the class complete first — a class started forty minutes late falls
 * between the two rules and is paid in full.
 *
 * That is not hypothetical. The first real class on the system started 39
 * minutes late and was paid ₹250 with a ₹0 penalty.
 *
 * A rule a teacher reads and then watches go unenforced teaches them which
 * other rules to ignore. So this matches what is printed: over the grace, the
 * penalty applies, however late.
 *
 * ── Why a shared module and not just SQL ────────────────────────────────────
 * Two things pay teachers: a trigger on `bookings` for ordinary classes, and
 * /api/trial/feedback for trials. They disagreed — the trial path hardcoded a
 * penalty of zero, so a teacher who turned up twenty minutes late to a trial
 * was paid the full fee. This is the arithmetic both sides now use.
 */

/** Minutes of grace before anything is charged. See late-join-grace-5min.sql. */
export const LATE_GRACE_MINUTES = 5;

/** The charge itself. Flat, whatever the class is worth. */
export const LATE_PENALTY = 100;

export interface Penalty {
  amount: number;
  /** Shown on the payout row. Null when nothing is charged. */
  reason: string | null;
  /** Whole minutes past the scheduled start. Negative when early. */
  lateMinutes: number | null;
}

const NONE: Penalty = { amount: 0, reason: null, lateMinutes: null };

/**
 * What to charge for starting this class when they did.
 *
 * `startedAt` null means the teacher never pressed Start. That is not a late
 * join — it is either a no-show (handled separately, at a much larger number)
 * or a class where nobody recorded the start. Charging ₹100 for a missing
 * timestamp would punish teachers for a gap in our own instrumentation.
 */
export function latePenalty(
  slotStart: string | Date | null | undefined,
  startedAt: string | Date | null | undefined
): Penalty {
  if (!slotStart || !startedAt) return NONE;

  const scheduled = slotStart instanceof Date ? slotStart.getTime() : Date.parse(slotStart);
  const actual = startedAt instanceof Date ? startedAt.getTime() : Date.parse(startedAt);
  if (!Number.isFinite(scheduled) || !Number.isFinite(actual)) return NONE;

  const lateMinutes = Math.round((actual - scheduled) / 60_000);
  if (lateMinutes <= LATE_GRACE_MINUTES) {
    return { amount: 0, reason: null, lateMinutes };
  }

  return {
    amount: LATE_PENALTY,
    reason: `Late join (${lateMinutes} min)`,
    lateMinutes,
  };
}
