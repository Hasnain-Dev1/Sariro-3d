/**
 * SARIRO — four seats in a trial, and who is sitting in them
 * ============================================================================
 * A trial class holds up to four children, the same cap as every paid class.
 * Until now the booking picker did not know that: any booking at a time made
 * that whole slot busy, so a trial with one child in it disappeared from the
 * picker and the other three seats were never sold.
 *
 * That is a teacher's half-hour spent on one child instead of four, every time.
 *
 * ── The two kinds of "busy" ─────────────────────────────────────────────────
 * A paid class blocks its slot completely — nobody joins somebody else's
 * lesson. A trial blocks it only once it is FULL. Between one and three
 * children it is not busy at all; it is a class with seats left, and the right
 * thing to show a seller is how many.
 *
 * ── Why joining beats booking alongside ─────────────────────────────────────
 * Two trials at the same time with the same teacher is not two classes, it is
 * one class recorded twice — and the teacher's calendar, the attendance sheet
 * and the pay calculation all then disagree with reality. So a second booking
 * into an occupied slot adds children to the booking that is already there.
 * See /api/trial/book, which does the joining and re-checks this cap.
 */

/** Four children, no exceptions. The same number as a paid class. */
export const TRIAL_CAPACITY = 4;

export interface SlotBooking {
  /** ISO instant the class starts. */
  slotStart: string;
  /** ISO instant it ends. Used only to work out whether a slot is blocked. */
  slotEnd: string;
  isTrial: boolean;
  /** How many children are already in it. A paid class need not say. */
  seatsTaken?: number;
  /** The booking to join, when there are seats left. */
  bookingId?: string;
}

export interface SlotState {
  /** Seats already filled. 0 for a slot nobody has booked. */
  taken: number;
  capacity: number;
  /** Seats a seller could still fill. Never negative. */
  free: number;
  full: boolean;
  /** The existing trial to join, when there is one. */
  joinBookingId: string | null;
  /** Ready for the UI: "2 of 4 booked · 2 seats left". */
  label: string;
}

const iso = (s: string) => Date.parse(s);

/**
 * What is happening at one start time.
 *
 * `bookings` is everything in the teacher's diary; only exact start-time
 * matches count as the same class. A trial that merely OVERLAPS is a
 * different class and blocks the slot rather than sharing it — see
 * `blockingIntervals`.
 */
export function slotState(startIso: string, bookings: readonly SlotBooking[]): SlotState {
  const start = iso(startIso);
  const here = bookings.filter((b) => b.isTrial && iso(b.slotStart) === start);

  const taken = here.reduce((n, b) => n + Math.max(0, b.seatsTaken ?? 0), 0);
  const free = Math.max(0, TRIAL_CAPACITY - taken);
  const full = free === 0;

  /* The booking to add children to. When two trials somehow share a start —
     a double-write, a race — the one with room is the one to join. */
  const join = here.find((b) => (b.seatsTaken ?? 0) < TRIAL_CAPACITY) ?? null;

  return {
    taken,
    capacity: TRIAL_CAPACITY,
    free,
    full,
    joinBookingId: join?.bookingId ?? null,
    label: describeSlot(taken, free),
  };
}

/** The sentence a seller reads. Deliberately says both halves. */
export function describeSlot(taken: number, free: number): string {
  if (taken === 0) return 'Empty · 4 seats';
  if (free === 0) return 'Full · no seats left';
  return `${taken} of ${TRIAL_CAPACITY} booked · ${free} ${free === 1 ? 'seat' : 'seats'} left`;
}

/**
 * The intervals that genuinely block new bookings, for feeding to freeSlots().
 *
 * Everything that is not a trial, plus every trial that is full. A trial with
 * room is deliberately absent: its slot must keep appearing in the picker, or
 * the remaining seats can never be sold.
 *
 * Overlapping-but-not-identical trials block too. Sharing a class only makes
 * sense when it is the same class, and 17:00 and 17:15 are not.
 */
export function blockingIntervals(
  bookings: readonly SlotBooking[]
): { slotStart: string; slotEnd: string }[] {
  const openStarts = new Set(
    bookings
      .filter((b) => b.isTrial && (b.seatsTaken ?? 0) < TRIAL_CAPACITY)
      .map((b) => b.slotStart)
  );

  return bookings
    .filter((b) => !(b.isTrial && openStarts.has(b.slotStart)))
    .map((b) => ({ slotStart: b.slotStart, slotEnd: b.slotEnd }));
}

/**
 * Can this many children be added here?
 *
 * Asked in the picker as a courtesy and again in the API as the boundary,
 * because a stale tab and two sellers booking at once both arrive at the
 * second one.
 */
export function canSeat(
  state: Pick<SlotState, 'free'>,
  howMany: number
): { ok: true } | { ok: false; message: string } {
  if (howMany < 1) return { ok: false, message: 'Choose at least one student.' };
  if (howMany > TRIAL_CAPACITY) {
    return { ok: false, message: `A trial class holds ${TRIAL_CAPACITY} children. Book the rest into another slot.` };
  }
  if (howMany > state.free) {
    return {
      ok: false,
      message: state.free === 0
        ? 'That slot is full — all four seats are taken. Pick another time.'
        : `Only ${state.free} ${state.free === 1 ? 'seat is' : 'seats are'} left in that slot, and you chose ${howMany}.`,
    };
  }
  return { ok: true };
}
