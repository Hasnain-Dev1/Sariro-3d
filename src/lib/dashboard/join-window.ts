/**
 * SARIRO — When a class can be joined
 * =========================================================
 * There was no answer to this question anywhere in the product. The Join button
 * was disabled only for `joining || !hasCredits || joined`, and the API said so
 * out loud: *"a student is free to join a class whenever they like."*
 *
 * So a child with a class tomorrow at 17:30 pressed Join today, landed in an
 * empty Meet, and concluded that nobody came. That is the most expensive kind of
 * bug: it destroys trust at the exact moment a new family is deciding whether
 * this was a good idea, and it never generates a support ticket — they just
 * leave.
 *
 * ── Why a window at all, when lateness is only ever the teacher's problem ──
 * The original reasoning was sound as far as it went: students are never
 * penalised for being early or late, so why restrict them? Because the
 * restriction is not a penalty — it is an *answer*. A learner pressing Join
 * outside the window has a real question ("when is my class?") and the product
 * previously replied with an empty room.
 *
 * Pressing Join early now opens the next-class page instead. Nobody is blocked;
 * they are told.
 *
 * Kept deliberately generous at both ends: joining early is a sign of a keen
 * child, and joining late is a child who had trouble getting there. Neither
 * should be turned away.
 */

/** Doors open this long before the scheduled start. */
export const JOIN_OPENS_MINUTES_BEFORE = 15;

/**
 * How long after the scheduled END a learner can still get in.
 *
 * Long, on purpose: a student arriving 20 minutes into a 60-minute class has
 * missed a lot, but locking them out of the remainder helps nobody.
 */
export const JOIN_GRACE_MINUTES_AFTER = 20;

const MINUTE = 60_000;

export type JoinState =
  /** Too early — the next-class page answers "when?" instead. */
  | 'too_early'
  /** Doors are open. */
  | 'open'
  /** The class is over and the grace period has passed. */
  | 'ended';

export interface JoinWindow {
  state: JoinState;
  opensAt: Date;
  closesAt: Date;
  /** Milliseconds until the doors open. Zero once they have. */
  msUntilOpen: number;
}

export function joinWindow(
  slotStartIso: string,
  slotEndIso: string | null,
  now: Date = new Date()
): JoinWindow {
  const start = new Date(slotStartIso);
  // A missing end is treated as a one-hour class rather than an open door.
  const end = slotEndIso ? new Date(slotEndIso) : new Date(start.getTime() + 60 * MINUTE);

  const opensAt = new Date(start.getTime() - JOIN_OPENS_MINUTES_BEFORE * MINUTE);
  const closesAt = new Date(end.getTime() + JOIN_GRACE_MINUTES_AFTER * MINUTE);

  const state: JoinState =
    now < opensAt ? 'too_early' : now > closesAt ? 'ended' : 'open';

  return {
    state,
    opensAt,
    closesAt,
    msUntilOpen: Math.max(0, opensAt.getTime() - now.getTime()),
  };
}

export function canJoinNow(
  slotStartIso: string,
  slotEndIso: string | null,
  now: Date = new Date()
): boolean {
  return joinWindow(slotStartIso, slotEndIso, now).state === 'open';
}

/**
 * "in 3 days", "in 4 hours", "in 12 minutes".
 *
 * Deliberately coarse. A parent asking when the class is wants an orientation,
 * not a stopwatch — and a second-by-second countdown to something 30 hours away
 * is a re-render loop that buys nothing.
 */
export function humanCountdown(ms: number): string {
  if (ms <= 0) return 'now';

  const minutes = Math.round(ms / MINUTE);
  if (minutes < 60) return `in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;

  const days = Math.round(hours / 24);
  return `in ${days} ${days === 1 ? 'day' : 'days'}`;
}
