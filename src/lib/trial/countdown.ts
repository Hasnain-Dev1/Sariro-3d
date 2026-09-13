/**
 * SARIRO — the arithmetic behind the trial clock
 *
 * Pure, so the clock can be tested without a clock. The component in
 * components/dashboard/flip-countdown.tsx only draws what this decides.
 */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Milliseconds left, never negative. */
  msLeft: number;
}

export function countdownParts(msLeft: number): CountdownParts {
  const ms = Math.max(0, msLeft);
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
    msLeft: ms,
  };
}

/**
 * How the clock should FEEL, which changes as the class gets near.
 *
 *   far    more than a day away — calm
 *   today  within a day — it is happening today
 *   soon   within the hour — get ready, the seconds pulse
 *   now    the join window is open (ten minutes before)
 *   over   the start has passed
 *
 * Deliberately not one flat display for three days and ten minutes alike: a
 * countdown that looks the same at "3 days" as at "8 minutes" gives nobody the
 * nudge to go and find a quiet room.
 */
export type Urgency = 'far' | 'today' | 'soon' | 'now' | 'over';

export const JOIN_OPENS_MS = 10 * 60_000;

export function urgencyOf(msLeft: number): Urgency {
  if (msLeft <= 0) return 'over';
  if (msLeft <= JOIN_OPENS_MS) return 'now';
  if (msLeft <= 60 * 60_000) return 'soon';
  if (msLeft <= 24 * 60 * 60_000) return 'today';
  return 'far';
}

/** Two digits, always — a flip clock never shows "7", it shows "07". */
export function twoDigits(n: number): [string, string] {
  const s = String(Math.max(0, Math.floor(n)) % 100).padStart(2, '0');
  return [s[0], s[1]];
}
