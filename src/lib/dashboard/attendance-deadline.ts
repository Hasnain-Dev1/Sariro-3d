import { ATTENDANCE_DEADLINE_HOURS } from './payout-breakdown';

/**
 * SARIRO — how long is left to mark a class
 * =========================================================
 * V2 §15: the pending-attendance card must show "time remaining before late
 * attendance penalty" and a penalty warning. Pure functions, so the countdown
 * a teacher reads can be tested rather than trusted.
 *
 * ── Why this is shown at all ────────────────────────────────────────────────
 * The penalty is ₹100, which is not much. What it is really protecting is
 * larger: unmarked attendance means the student's credit is never consumed,
 * the teacher's own earning is never created, and the lesson never advances —
 * so a child's progress stops moving for a class they actually attended.
 *
 * A teacher who can see "6 hours left" marks it. One who finds out afterwards
 * learns only that the system fines them, which is the same information
 * arriving too late to be useful.
 */

export type DeadlineState = 'not_ended' | 'plenty' | 'soon' | 'urgent' | 'missed';

export interface DeadlineStatus {
  state: DeadlineState;
  /** Hours left. Negative once the deadline has passed. */
  hoursLeft: number;
  /** What the card says. */
  label: string;
  /** True once a penalty would apply. */
  penalised: boolean;
}

const MS_PER_HOUR = 3_600_000;

export function attendanceDeadline(
  slotEnd: string,
  finalizedAt: string | null,
  now: Date = new Date(),
  deadlineHours: number = ATTENDANCE_DEADLINE_HOURS
): DeadlineStatus {
  const end = Date.parse(slotEnd);
  if (!Number.isFinite(end)) {
    return { state: 'not_ended', hoursLeft: deadlineHours, label: '', penalised: false };
  }

  // Already marked: whether it was late is settled history, not a countdown.
  if (finalizedAt) {
    const done = Date.parse(finalizedAt);
    const took = Number.isFinite(done) ? (done - end) / MS_PER_HOUR : 0;
    return took > deadlineHours
      ? { state: 'missed', hoursLeft: -(took - deadlineHours), label: `Marked ${Math.round(took)}h after the class — penalty applied`, penalised: true }
      : { state: 'plenty', hoursLeft: 0, label: 'Attendance closed', penalised: false };
  }

  const t = now.getTime();
  if (t < end) {
    return { state: 'not_ended', hoursLeft: deadlineHours, label: '', penalised: false };
  }

  const hoursLeft = deadlineHours - (t - end) / MS_PER_HOUR;

  if (hoursLeft <= 0) {
    return {
      state: 'missed',
      hoursLeft,
      label: `${Math.round(-hoursLeft)}h past the deadline — ₹100 penalty applies when you mark it`,
      penalised: true,
    };
  }
  if (hoursLeft <= 3) {
    return { state: 'urgent', hoursLeft, label: `${Math.max(1, Math.round(hoursLeft))}h left to mark this`, penalised: false };
  }
  if (hoursLeft <= 8) {
    return { state: 'soon', hoursLeft, label: `${Math.round(hoursLeft)}h left to mark this`, penalised: false };
  }
  return { state: 'plenty', hoursLeft, label: `${Math.round(hoursLeft)}h left to mark this`, penalised: false };
}

/** One hue, darker as the time runs down. Not four unrelated colours. */
export function deadlineTone(state: DeadlineState): { fg: string; bg: string } | null {
  switch (state) {
    case 'missed': return { fg: '#B91C1C', bg: '#B91C1C14' };
    case 'urgent': return { fg: '#C2410C', bg: '#C2410C14' };
    case 'soon': return { fg: '#B45309', bg: '#B4530914' };
    case 'plenty': return { fg: '#64748B', bg: '#64748B14' };
    default: return null;
  }
}
