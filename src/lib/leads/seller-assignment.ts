/**
 * SARIRO — who gets the next lead
 * ============================================================================
 * Every trial that comes in from the website has to land on somebody's desk.
 * Left to itself it lands on nobody: five of the thirteen leads in production
 * when this was written had no seller at all, which means five families booked
 * a free class and nobody was ever told to ring them.
 *
 * ── Least-assigned first, random tie-break ──────────────────────────────────
 * Not round-robin, and not pure random. Round-robin needs a cursor that
 * survives restarts and skips a seller who joins mid-month. Pure random is
 * unfair over the small numbers a month actually contains — with four sellers
 * and forty leads, one of them plausibly gets sixteen.
 *
 * So: whoever is holding the fewest this month wins, and a tie is settled by
 * a coin. Fair over the month, and it self-corrects — a seller who was away
 * for a week comes back at the front of the queue rather than needing an
 * exception.
 *
 * ── Why the count is derived, never stored ──────────────────────────────────
 * A counter column has to be incremented, decremented on transfer, reset on
 * the first of the month, and repaired by hand the first time any of those is
 * missed. It cannot be recomputed, so once it is wrong it stays wrong and
 * quietly biases every future assignment.
 *
 * Counting the rows instead means the answer is derivable from the leads
 * themselves at any moment, including after somebody corrects an assignment
 * six weeks later. A transfer moves the lead and the counts follow, which is
 * the behaviour anybody would expect: the seller who is holding it is the
 * seller whose desk it is on.
 */

/** A seller and how much of this month they are already carrying. */
export interface SellerLoad {
  id: string;
  /** Leads assigned to them within the current month. */
  assignedThisMonth: number;
}

/**
 * The seller the next lead should go to, or null when there is nobody to give
 * it to.
 *
 * `rnd` returns a float in [0, 1) — injected so the tie-break is testable.
 * Callers pass only ACTIVE sellers; deciding who is active is a question about
 * employment, not about distribution, and it does not belong here.
 */
export function chooseSeller(
  sellers: readonly SellerLoad[],
  rnd: () => number = Math.random
): string | null {
  /* No sellers at all. Returned rather than thrown: a company with nobody in
     the seat still has to be able to take a booking, and a free class that
     fails because of an internal staffing gap is the worst possible trade. The
     lead is created unassigned and shows up in the unassigned queue. */
  if (sellers.length === 0) return null;

  let lowest = Infinity;
  for (const s of sellers) {
    const n = Number.isFinite(s.assignedThisMonth) ? Math.max(0, s.assignedThisMonth) : 0;
    if (n < lowest) lowest = n;
  }

  const tied = sellers.filter((s) => {
    const n = Number.isFinite(s.assignedThisMonth) ? Math.max(0, s.assignedThisMonth) : 0;
    return n === lowest;
  });

  if (tied.length === 1) return tied[0].id;

  /* Clamped because a broken rnd returning exactly 1 (or something outside the
     range) must not index past the end and hand back undefined — which would
     read downstream as "no sellers" and silently stop assigning. */
  const i = Math.min(tied.length - 1, Math.max(0, Math.floor(rnd() * tied.length)));
  return tied[i].id;
}

/**
 * Where the sales month starts and ends, in real instants.
 *
 * ── Why this is not just "the UTC month" ────────────────────────────────────
 * The business runs on Indian time and the targets are monthly. A sale entered
 * at 2am on the 1st of October in Delhi is 8:30pm on the 30th of September in
 * UTC — so a naive UTC month puts it in the wrong month, credits it against
 * the wrong target, and can pay or withhold an incentive on the strength of a
 * timezone. That is a real amount of somebody's money decided by a bug.
 *
 * Returns half-open [start, end): the instant the month begins and the instant
 * the next one does, so a row is in exactly one month and never both.
 */
export function monthWindow(
  now: number | Date = Date.now(),
  timeZone = 'Asia/Kolkata'
): { start: string; end: string; key: string } {
  const at = new Date(now);

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');

  const year = get('year');
  const month = get('month'); // 1-12

  /* The zone's offset AT THIS INSTANT, worked out by asking what wall-clock
     time it is there and subtracting. Doing it this way rather than hardcoding
     +05:30 means the same function is correct for a zone that observes DST,
     which India does not and a future market might. */
  const asUtc = Date.UTC(
    year, month - 1, get('day'), get('hour') % 24, get('minute'), get('second')
  );
  const offsetMs = asUtc - (at.getTime() - (at.getTime() % 1000));

  const startUtc = Date.UTC(year, month - 1, 1, 0, 0, 0) - offsetMs;
  const endUtc = Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1, 0, 0, 0) - offsetMs;

  return {
    start: new Date(startUtc).toISOString(),
    end: new Date(endUtc).toISOString(),
    /** "2026-09". What a monthly metric row is keyed by. */
    key: `${year}-${String(month).padStart(2, '0')}`,
  };
}

/**
 * The same thing for a single day — "today", as the office would say it.
 *
 * Sits beside monthWindow because it answers the same question at a different
 * scale and must agree with it at the boundaries: the first day of a month has
 * to start at the same instant the month does, or a follow-up due at 00:15 on
 * the 1st lands in today's list and last month's count.
 *
 * Used by the seller's Today's Follow-Ups queue and by reminderStatus(), which
 * is the whole reason "overdue" means a day that has ended rather than a fixed
 * number of hours. See lib/seller/reminders.ts.
 */
export function dayWindow(
  now: number | Date = Date.now(),
  timeZone = 'Asia/Kolkata'
): { start: string; end: string; key: string } {
  const at = new Date(now);

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');

  const year = get('year');
  const month = get('month');
  const day = get('day');

  const asUtc = Date.UTC(year, month - 1, day, get('hour') % 24, get('minute'), get('second'));
  const offsetMs = asUtc - (at.getTime() - (at.getTime() % 1000));

  /* day + 1 rather than start + 24h. Date.UTC rolls the month and the year
     over by itself, and a day is not always 24 hours long in a zone that
     observes DST — the same reason monthWindow builds its end from the next
     month's first day rather than by adding thirty of anything. */
  const startUtc = Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs;
  const endUtc = Date.UTC(year, month - 1, day + 1, 0, 0, 0) - offsetMs;

  return {
    start: new Date(startUtc).toISOString(),
    end: new Date(endUtc).toISOString(),
    /** "2026-09-10". */
    key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}
