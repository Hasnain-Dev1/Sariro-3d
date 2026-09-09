/**
 * SARIRO — the times a parent is offered, and who they end up with
 * ============================================================================
 * The seller's picker asks "when is THIS teacher free". A parent arriving from
 * an advert has no opinion about which teacher, and should not be asked to
 * form one. They want a time. So this collapses every bookable teacher's free
 * slots into one list of times, and quietly decides who teaches each of them.
 *
 * ── Filling a class beats opening one ───────────────────────────────────────
 * When two teachers are free at 5pm and one of them already has a trial there
 * with two seats left, the parent is given THAT one. It is the same half hour
 * either way for the child, and it is the difference between a teacher taking
 * three children in one sitting and three teachers taking one each.
 *
 * That single rule is most of why this file exists. Offering the empty slot
 * first is the natural implementation and it quietly costs two thirds of the
 * capacity we already have.
 *
 * ── What a parent is never shown ────────────────────────────────────────────
 * Teacher names, ids, how many teachers there are, how empty the diary is. A
 * public page that lists your staff and their occupancy is a competitor's
 * research for free. The picked teacher's id goes back to the server on the
 * booking request and never appears on screen.
 */

import type { SlotState } from '@/lib/scheduling/trial-capacity';

/** One teacher's answer for one instant. */
export interface Candidate {
  teacherId: string;
  iso: string;
  state: SlotState;
}

/** What the page renders and posts back. */
export interface PublicSlot {
  iso: string;
  /** Opaque to the visitor; the server re-checks it either way. */
  teacherId: string;
  seatsLeft: number;
  /** True when this joins a class that already exists. */
  joining: boolean;
}

/**
 * Best candidate per instant, worst dropped.
 *
 * Ordering within an instant:
 *   1. a class that already exists and has room   — fills capacity we own
 *   2. otherwise the emptiest slot                — spreads the load evenly
 *      across teachers rather than always picking the same one
 *
 * `seatsNeeded` matters because a family booking two children cannot be put in
 * a class with one seat left. Filtering here rather than at the click means
 * they never choose a time that is about to be refused.
 */
export function chooseSlots(candidates: readonly Candidate[], seatsNeeded = 1): PublicSlot[] {
  const best = new Map<string, Candidate>();

  for (const c of candidates) {
    if (!c?.iso || !c.state) continue;
    if (c.state.free < Math.max(1, seatsNeeded)) continue;

    const incumbent = best.get(c.iso);
    if (!incumbent || beats(c, incumbent)) best.set(c.iso, c);
  }

  return [...best.values()]
    .sort((a, b) => Date.parse(a.iso) - Date.parse(b.iso))
    .map((c) => ({
      iso: c.iso,
      teacherId: c.teacherId,
      seatsLeft: c.state.free,
      joining: c.state.joinBookingId !== null,
    }));
}

function beats(a: Candidate, b: Candidate): boolean {
  const aJoins = a.state.joinBookingId !== null;
  const bJoins = b.state.joinBookingId !== null;
  // A class that exists always wins. This is the capacity rule.
  if (aJoins !== bJoins) return aJoins;
  // Among equals, the emptiest — so one teacher is not handed every booking.
  if (a.state.free !== b.state.free) return a.state.free > b.state.free;
  // Deterministic, so the same query twice gives the same answer.
  return a.teacherId < b.teacherId;
}

export interface PublicDay {
  /** YYYY-MM-DD in the visitor's timezone. */
  date: string;
  label: string;
  slots: PublicSlot[];
}

/**
 * Grouped into days the visitor recognises.
 *
 * Formatted in THEIR timezone, not the teacher's. A parent in Dubai choosing
 * "Tuesday 7pm" means their Tuesday evening; showing them the teacher's local
 * Tuesday is how somebody misses a class they were looking forward to.
 */
export function groupByDay(slots: readonly PublicSlot[], timeZone: string): PublicDay[] {
  const days = new Map<string, PublicSlot[]>();

  for (const s of slots) {
    const d = new Date(s.iso);
    if (!Number.isFinite(d.getTime())) continue;
    const key = safeFormat(d, timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA');
    const list = days.get(key) ?? [];
    list.push(s);
    days.set(key, list);
  }

  return [...days.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, list]) => ({
      date,
      label: safeFormat(new Date(list[0].iso), timeZone, {
        weekday: 'long', day: 'numeric', month: 'long',
      }, 'en-GB'),
      slots: list,
    }));
}

/** The clock time, in the visitor's zone. */
export function slotLabel(iso: string, timeZone: string): string {
  return safeFormat(new Date(iso), timeZone, { hour: '2-digit', minute: '2-digit' }, 'en-GB');
}

/**
 * An unknown timezone must not take the page down.
 *
 * `timeZone` comes from Intl on the visitor's device and is passed to the
 * server and back. A value Intl does not recognise throws a RangeError, and a
 * throw here means a blank booking page for somebody who just cost us an ad
 * click. UTC is wrong for them; a blank page is worse.
 */
function safeFormat(
  d: Date,
  timeZone: string,
  opts: Intl.DateTimeFormatOptions,
  locale: string
): string {
  try {
    return d.toLocaleString(locale, { ...opts, timeZone });
  } catch {
    return d.toLocaleString(locale, opts);
  }
}
