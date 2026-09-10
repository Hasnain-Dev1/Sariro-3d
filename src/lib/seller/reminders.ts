/**
 * SARIRO — the follow-up a seller would otherwise have to remember
 * ============================================================================
 * A seller rings a father who says "call me after Thursday". Today that
 * sentence is typed into `student_leads.notes`, which the next note overwrites,
 * and Thursday is a thing the seller has to hold in their head alongside the
 * other forty leads. The follow-up that decides whether a family buys is the
 * least reliable part of the whole pipeline.
 *
 * ── Three statuses, none of them stored ─────────────────────────────────────
 * Upcoming, Due and Overdue are `due_at` compared with the clock. Storing them
 * would need a job walking every row at midnight to move yesterday's Due into
 * Overdue — and between midnight and the job running, every screen in the
 * business would be lying. Derived, they are correct at the instant they are
 * read and there is no job to fail.
 *
 * Only the states a HUMAN causes are stored: completed and cancelled. Those
 * are facts about what somebody did, not about what time it is.
 *
 * ── Why "overdue" is a different DAY, not a number of hours ─────────────────
 * A reminder set for 4pm and read at 5pm is not overdue in any sense a seller
 * would recognise — it is this afternoon's work, still in front of them. It
 * becomes overdue when the day it belonged to has ended.
 *
 * That also makes the two queues and the three statuses one rule rather than
 * two: "Today's Follow-Ups" is exactly the reminders whose day is today, and
 * "Overdue" is exactly the ones whose day has passed. Two lists that could
 * disagree about the same reminder would be a bug waiting for a boundary.
 */

import { dayWindow } from '@/lib/leads/seller-assignment';

/** Where a reminder stands, at the moment somebody looks at it. */
export type ReminderStatus = 'upcoming' | 'due' | 'overdue' | 'completed' | 'cancelled';

/** The stored half — what a human did to it. */
export type ReminderState = 'pending' | 'completed' | 'cancelled';

export interface ReminderRow {
  id: string;
  lead_id: string;
  due_at: string;
  status: ReminderState;
  body?: string | null;
  seller_id?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  notified_at?: string | null;
}

/**
 * What to show against one reminder.
 *
 * A completed or cancelled reminder keeps that answer forever — it does not
 * become "overdue" a week later because its due date has passed. Somebody
 * dealt with it; the clock has no further opinion.
 */
export function reminderStatus(
  row: Pick<ReminderRow, 'due_at' | 'status'>,
  now: number | Date = Date.now(),
  timeZone = 'Asia/Kolkata'
): ReminderStatus {
  if (row.status === 'completed') return 'completed';
  if (row.status === 'cancelled') return 'cancelled';

  const due = Date.parse(row.due_at);
  /* An unparseable date is shown as due rather than hidden. A reminder nobody
     can see is worse than one shown a day early: the first loses the family,
     the second costs a glance. */
  if (!Number.isFinite(due)) return 'due';

  const at = new Date(now).getTime();
  if (due > at) return 'upcoming';

  const today = dayWindow(at, timeZone);
  return due >= Date.parse(today.start) ? 'due' : 'overdue';
}

/** True when this reminder belongs to today's list, due later today or already. */
export function isToday(
  row: Pick<ReminderRow, 'due_at' | 'status'>,
  now: number | Date = Date.now(),
  timeZone = 'Asia/Kolkata'
): boolean {
  if (row.status !== 'pending') return false;
  const due = Date.parse(row.due_at);
  if (!Number.isFinite(due)) return false;
  const { start, end } = dayWindow(now, timeZone);
  return due >= Date.parse(start) && due < Date.parse(end);
}

/** True when the day this reminder belonged to has ended and nobody dealt with it. */
export function isOverdue(
  row: Pick<ReminderRow, 'due_at' | 'status'>,
  now: number | Date = Date.now(),
  timeZone = 'Asia/Kolkata'
): boolean {
  return reminderStatus(row, now, timeZone) === 'overdue';
}

/* ══════════════════════════════════════════════════════════════════════════
   Saying WHEN, in the two ways a person actually says it
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * "3 hours", "1 day", "4 days" → an instant.
 *
 * A seller on a call types the gap, not the date — working out that Thursday
 * 4pm is "in 3 days and 2 hours" is arithmetic nobody should do while somebody
 * is talking to them. An exact date/time is also accepted, by the caller,
 * because "call back on the 14th" is equally natural. Both end up as one
 * `due_at`, so nothing downstream has to know which was typed.
 *
 * Returns null rather than guessing. A reminder set for the wrong day is worse
 * than one that was refused, because nobody re-checks a reminder they think
 * they set.
 */
export function parseRelative(input: string, now: number | Date = Date.now()): string | null {
  const ms = relativeMs(input);
  if (ms === null) return null;
  return new Date(new Date(now).getTime() + ms).toISOString();
}

/** The offset in milliseconds, or null when the phrase is not one we accept. */
export function relativeMs(input: string): number | null {
  const s = (input ?? '').trim().toLowerCase();
  if (!s) return null;

  /* "in 3 hours" and "3 hours" are the same request. "3h" too — a seller in a
     hurry types the short form and being strict about it buys nothing. */
  const m = /^(?:in\s+)?(\d{1,4})\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|week|weeks)$/.exec(s);
  if (!m) return null;

  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;

  const unit = m[2];
  const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  if (/^(m|min|mins|minute|minutes)$/.test(unit)) return capped(n * MIN);
  if (/^(h|hr|hrs|hour|hours)$/.test(unit)) return capped(n * HOUR);
  if (/^(d|day|days)$/.test(unit)) return capped(n * DAY);
  return capped(n * 7 * DAY);
}

/**
 * A year. Not a business rule — a guard against a typo becoming a reminder
 * nobody will live to see, and against "9999 days" as an integer overflow.
 */
const MAX_AHEAD_MS = 365 * 24 * 60 * 60 * 1000;

function capped(ms: number): number | null {
  return ms > MAX_AHEAD_MS ? null : ms;
}

/** The shortcuts offered as buttons, in the order a seller reaches for them. */
export const QUICK_REMINDERS: { label: string; value: string }[] = [
  { label: '3 hours', value: '3 hours' },
  { label: 'Tomorrow', value: '1 day' },
  { label: '2 days', value: '2 days' },
  { label: '4 days', value: '4 days' },
  { label: 'Next week', value: '1 week' },
];

/**
 * An exact date/time typed by a person, as an instant.
 *
 * `<input type="datetime-local">` hands back "2026-09-14T16:00" with no zone,
 * which `Date.parse` reads as LOCAL time in the browser and as UTC in some
 * server runtimes — a five-and-a-half hour difference in India, which is the
 * difference between an afternoon call and a call at half past nine at night.
 * So the zone is supplied explicitly rather than left to the parser.
 */
export function parseExact(
  local: string,
  timeZone = 'Asia/Kolkata'
): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec((local ?? '').trim());
  if (!m) return null;

  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[];
  const naive = Date.UTC(y, mo - 1, d, h, mi, 0);
  if (!Number.isFinite(naive)) return null;

  /* Two passes. The offset depends on the instant, and the instant is what we
     are solving for, so the first guess is corrected once — enough for every
     zone including the DST boundaries where the first guess lands an hour out. */
  let guess = naive - offsetAt(naive, timeZone);
  guess = naive - offsetAt(guess, timeZone);
  return new Date(guess).toISOString();
}

/** How far ahead of UTC the zone is, at a given instant, in milliseconds. */
function offsetAt(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** "in 3 hours" / "2 days ago" — for a list a seller scans rather than reads. */
export function describeDue(dueAt: string, now: number | Date = Date.now()): string {
  const due = Date.parse(dueAt);
  if (!Number.isFinite(due)) return '';
  const diff = due - new Date(now).getTime();
  const ahead = diff >= 0;
  const mins = Math.round(Math.abs(diff) / 60_000);

  const phrase =
    mins < 1 ? 'now'
    : mins < 60 ? `${mins} min`
    : mins < 60 * 24 ? `${Math.round(mins / 60)} hr`
    : `${Math.round(mins / (60 * 24))} day${Math.round(mins / (60 * 24)) === 1 ? '' : 's'}`;

  if (phrase === 'now') return 'now';
  return ahead ? `in ${phrase}` : `${phrase} ago`;
}
