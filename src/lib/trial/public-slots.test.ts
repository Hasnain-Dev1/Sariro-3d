import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { chooseSlots, groupByDay, slotLabel, type Candidate } from './public-slots';
import { TRIAL_CAPACITY } from '@/lib/scheduling/trial-capacity';

/**
 * SARIRO — which teacher a parent silently ends up with
 * ============================================================================
 * The rule that matters commercially: when two teachers are free at the same
 * time and one already has a trial there with room, the parent joins THAT one.
 * Same half hour for the child either way; the difference is one teacher
 * taking three children in a sitting instead of three teachers taking one each.
 *
 * Offering the empty slot first is the natural implementation and it quietly
 * throws away two thirds of the capacity we already have. Most of these tests
 * exist to stop somebody "simplifying" it back.
 */

const state = (free: number, joinBookingId: string | null = null) => ({
  taken: TRIAL_CAPACITY - free,
  capacity: TRIAL_CAPACITY,
  free,
  full: free === 0,
  joinBookingId,
  label: '',
});

const cand = (teacherId: string, iso: string, free: number, join: string | null = null): Candidate =>
  ({ teacherId, iso, state: state(free, join) });

const FIVE = '2026-09-15T12:30:00.000Z';
const SIX = '2026-09-15T13:00:00.000Z';

describe('chooseSlots', () => {
  test('a lone free slot is offered', () => {
    const out = chooseSlots([cand('t1', FIVE, 4)]);
    assert.equal(out.length, 1);
    assert.equal(out[0].teacherId, 't1');
    assert.equal(out[0].seatsLeft, 4);
    assert.equal(out[0].joining, false);
  });

  test('a full slot is not offered at all', () => {
    assert.deepEqual(chooseSlots([cand('t1', FIVE, 0, null)]), []);
  });

  test('an existing class with room beats an empty teacher — the whole point', () => {
    const out = chooseSlots([
      cand('empty', FIVE, 4),
      cand('running', FIVE, 2, 'booking-1'),
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].teacherId, 'running', 'must fill the class that exists');
    assert.equal(out[0].joining, true);
  });

  test('order of candidates does not change the answer', () => {
    const a = chooseSlots([cand('running', FIVE, 1, 'b1'), cand('empty', FIVE, 4)]);
    const b = chooseSlots([cand('empty', FIVE, 4), cand('running', FIVE, 1, 'b1')]);
    assert.equal(a[0].teacherId, 'running');
    assert.equal(b[0].teacherId, 'running');
  });

  test('among empty teachers the emptiest wins, so one is not handed everything', () => {
    const out = chooseSlots([cand('busy', FIVE, 2), cand('free', FIVE, 4)]);
    assert.equal(out[0].teacherId, 'free');
  });

  test('a tie is broken deterministically', () => {
    const one = chooseSlots([cand('b', FIVE, 4), cand('a', FIVE, 4)]);
    const two = chooseSlots([cand('a', FIVE, 4), cand('b', FIVE, 4)]);
    assert.equal(one[0].teacherId, two[0].teacherId, 'same query twice, same answer');
  });

  test('two children are not offered a slot with one seat', () => {
    // Otherwise they pick a time and the booking is refused at the click,
    // which is the worst possible moment to find out.
    assert.deepEqual(chooseSlots([cand('t1', FIVE, 1, 'b1')], 2), []);
    assert.equal(chooseSlots([cand('t1', FIVE, 2, 'b1')], 2).length, 1);
  });

  test('a half-full class is still preferred when it has room for the whole family', () => {
    const out = chooseSlots([cand('empty', FIVE, 4), cand('running', FIVE, 2, 'b1')], 2);
    assert.equal(out[0].teacherId, 'running');
  });

  test('results come back in time order', () => {
    const out = chooseSlots([cand('t1', SIX, 4), cand('t1', FIVE, 4)]);
    assert.deepEqual(out.map((s) => s.iso), [FIVE, SIX]);
  });

  test('rubbish in the list is skipped rather than thrown over', () => {
    const rough = [
      cand('t1', FIVE, 4),
      { teacherId: 't2', iso: '', state: state(4) },
      { teacherId: 't3', iso: SIX } as unknown as Candidate,
    ];
    assert.equal(chooseSlots(rough).length, 1);
  });
});

describe('groupByDay', () => {
  test('slots are grouped and labelled in the VISITOR timezone', () => {
    // 12:30 UTC is the same evening in Kolkata and the same afternoon in
    // London. A parent choosing "Tuesday 6pm" means their Tuesday.
    const slots = chooseSlots([cand('t1', FIVE, 4), cand('t1', SIX, 4)]);
    const days = groupByDay(slots, 'Asia/Kolkata');
    assert.equal(days.length, 1);
    assert.equal(days[0].slots.length, 2);
    assert.match(days[0].label, /September/);
  });

  test('an instant that falls on the next day locally gets its own day', () => {
    // 20:00 UTC is already tomorrow in Kolkata (01:30 IST).
    const late = '2026-09-15T20:00:00.000Z';
    const days = groupByDay(chooseSlots([cand('t1', FIVE, 4), cand('t1', late, 4)]), 'Asia/Kolkata');
    assert.equal(days.length, 2, 'must split on the local date, not the UTC one');
  });

  test('days come back in order', () => {
    const later = '2026-09-17T12:30:00.000Z';
    const days = groupByDay(chooseSlots([cand('t1', later, 4), cand('t1', FIVE, 4)]), 'UTC');
    assert.ok(days[0].date < days[1].date);
  });

  test('a timezone Intl does not know does not blank the page', () => {
    // timeZone comes off the visitor's device. A RangeError here is a blank
    // booking page for somebody who just cost us an ad click.
    const days = groupByDay(chooseSlots([cand('t1', FIVE, 4)]), 'Mars/Olympus_Mons');
    assert.equal(days.length, 1);
    assert.ok(days[0].label.length > 0);
  });
});

describe('slotLabel', () => {
  test('renders a clock time in the visitor zone', () => {
    assert.equal(slotLabel(FIVE, 'Asia/Kolkata'), '18:00');
    assert.equal(slotLabel(FIVE, 'UTC'), '12:30');
  });

  test('a bad timezone still returns a time', () => {
    assert.ok(slotLabel(FIVE, 'nonsense/zone').length > 0);
  });
});
