import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  TRIAL_CAPACITY, slotState, describeSlot, blockingIntervals, canSeat,
  type SlotBooking,
} from './trial-capacity';

/**
 * SARIRO — four seats, and the money in the other three
 * ============================================================================
 * The bug this replaces: any booking at a time made that slot busy, so a trial
 * holding ONE child vanished from the picker and the other three seats could
 * never be sold. A teacher's half-hour spent on one child instead of four.
 *
 * The tests are weighted towards the two ways this can go wrong in opposite
 * directions — hiding a slot that has room (lost revenue) and offering one
 * that has none (a fifth child turning up to a full class).
 */

const trial = (start: string, seats: number, id = 'b-' + start): SlotBooking => ({
  slotStart: start,
  slotEnd: new Date(Date.parse(start) + 30 * 60_000).toISOString(),
  isTrial: true,
  seatsTaken: seats,
  bookingId: id,
});

const paid = (start: string): SlotBooking => ({
  slotStart: start,
  slotEnd: new Date(Date.parse(start) + 60 * 60_000).toISOString(),
  isTrial: false,
});

const FIVE = '2026-09-14T12:30:00.000Z';
const SIX = '2026-09-14T13:30:00.000Z';

describe('slotState', () => {
  test('an empty slot has all four seats', () => {
    const s = slotState(FIVE, []);
    assert.equal(s.taken, 0);
    assert.equal(s.free, TRIAL_CAPACITY);
    assert.equal(s.full, false);
    assert.equal(s.joinBookingId, null);
  });

  test('one child booked leaves three seats and a booking to join', () => {
    // The whole point. Before this, the slot simply disappeared.
    const s = slotState(FIVE, [trial(FIVE, 1, 'b1')]);
    assert.equal(s.taken, 1);
    assert.equal(s.free, 3);
    assert.equal(s.full, false);
    assert.equal(s.joinBookingId, 'b1');
  });

  test('four children is full and offers nothing to join', () => {
    const s = slotState(FIVE, [trial(FIVE, 4, 'b1')]);
    assert.equal(s.free, 0);
    assert.equal(s.full, true);
    assert.equal(s.joinBookingId, null);
  });

  test('a trial at a different time does not touch this slot', () => {
    const s = slotState(FIVE, [trial(SIX, 3)]);
    assert.equal(s.taken, 0);
    assert.equal(s.free, 4);
  });

  test('a paid class at the same time takes no trial seats', () => {
    // It blocks the slot entirely — that is blockingIntervals' job, not this
    // function's. Counting it as a seat would say "1 of 4" about a class no
    // child can join at all.
    const s = slotState(FIVE, [paid(FIVE)]);
    assert.equal(s.taken, 0);
  });

  test('two trials somehow sharing a start are added together', () => {
    // A double-write or a race. Reporting "1 of 4" twice would let six
    // children into a class that holds four.
    const s = slotState(FIVE, [trial(FIVE, 2, 'b1'), trial(FIVE, 2, 'b2')]);
    assert.equal(s.taken, 4);
    assert.equal(s.full, true);
  });

  test('a seat count above the cap never reports negative free seats', () => {
    const s = slotState(FIVE, [trial(FIVE, 9)]);
    assert.equal(s.free, 0);
    assert.equal(s.full, true);
  });

  test('a missing seat count is read as empty, not as full', () => {
    // An older row with no participants written. Showing it as bookable is
    // recoverable; hiding the slot forever is not.
    const s = slotState(FIVE, [{ slotStart: FIVE, slotEnd: SIX, isTrial: true, bookingId: 'b1' }]);
    assert.equal(s.taken, 0);
    assert.equal(s.joinBookingId, 'b1');
  });
});

describe('describeSlot', () => {
  test('says both halves, so nobody has to do the subtraction', () => {
    assert.equal(describeSlot(2, 2), '2 of 4 booked · 2 seats left');
  });

  test('one seat is singular', () => {
    assert.match(describeSlot(3, 1), /1 seat left/);
  });

  test('empty and full each read as a state, not a sum', () => {
    assert.match(describeSlot(0, 4), /Empty/);
    assert.match(describeSlot(4, 0), /Full/);
  });
});

describe('blockingIntervals', () => {
  test('a trial with room is NOT blocking — this is the revenue', () => {
    const out = blockingIntervals([trial(FIVE, 1)]);
    assert.equal(out.length, 0, 'a half-full trial must stay in the picker');
  });

  test('a full trial blocks', () => {
    assert.equal(blockingIntervals([trial(FIVE, 4)]).length, 1);
  });

  test('a paid class always blocks', () => {
    assert.equal(blockingIntervals([paid(FIVE)]).length, 1);
  });

  test('a paid class overlapping an open trial still blocks', () => {
    // Otherwise a teacher gets double-booked by their own trial's open seats.
    const out = blockingIntervals([trial(FIVE, 1), paid(FIVE)]);
    assert.equal(out.length, 1);
    assert.equal(out[0].slotEnd, paid(FIVE).slotEnd);
  });

  test('a trial that overlaps but does not share a start blocks', () => {
    // 17:00 and 17:15 are not the same class, however much they overlap.
    const odd = trial('2026-09-14T12:45:00.000Z', 1);
    const out = blockingIntervals([trial(FIVE, 1), odd]);
    assert.equal(out.length, 0, 'both have room at their own start times');
    const full = blockingIntervals([trial(FIVE, 4), odd]);
    assert.equal(full.length, 1);
  });
});

describe('canSeat', () => {
  test('three children into an empty slot is fine', () => {
    assert.deepEqual(canSeat({ free: 4 }, 3), { ok: true });
  });

  test('filling the last seat exactly is fine', () => {
    assert.deepEqual(canSeat({ free: 1 }, 1), { ok: true });
  });

  test('a full slot is refused with the reason, not a shrug', () => {
    const r = canSeat({ free: 0 }, 1);
    assert.equal(r.ok, false);
    assert.match(r.ok === false ? r.message : '', /full/i);
  });

  test('two children into one remaining seat is refused, and says so', () => {
    const r = canSeat({ free: 1 }, 2);
    assert.equal(r.ok, false);
    assert.match(r.ok === false ? r.message : '', /Only 1 seat is left/);
  });

  test('more than the cap is refused even in an empty slot', () => {
    const r = canSeat({ free: 4 }, 5);
    assert.equal(r.ok, false);
    assert.match(r.ok === false ? r.message : '', /holds 4 children/);
  });

  test('zero students is not a booking', () => {
    assert.equal(canSeat({ free: 4 }, 0).ok, false);
  });
});
