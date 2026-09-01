import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  joinWindow,
  canJoinNow,
  humanCountdown,
  JOIN_OPENS_MINUTES_BEFORE,
  JOIN_GRACE_MINUTES_AFTER,
} from './join-window';

/**
 * SARIRO — the rule that decides whether a child gets into their class
 * =========================================================
 * This had no tests, which is startling for what it controls. Getting it wrong
 * in either direction is expensive and silent:
 *
 *   too tight  — a learner who is on time is told to wait, and concludes the
 *                class is not happening;
 *   too loose  — the original bug: a child pressed Join a day early, landed in
 *                an empty Meet, and decided nobody came. That one never
 *                generated a support ticket. Families just left.
 *
 * The teacher card, the student card and the server all read the same two
 * constants, so a change here moves all three at once. These pin the edges.
 */

const START = '2026-09-01T17:00:00.000Z';
const END = '2026-09-01T18:00:00.000Z';

/** `n` minutes either side of the 17:00 start. */
const atStartOffset = (mins: number) => new Date(Date.parse(START) + mins * 60_000);

describe('joinWindow', () => {
  test('the doors open exactly 15 minutes before, not 16', () => {
    assert.equal(JOIN_OPENS_MINUTES_BEFORE, 15, 'the product promise is 15 minutes');

    // One minute before the window: still shut.
    assert.equal(joinWindow(START, END, atStartOffset(-16)).state, 'too_early');
    // The moment it opens.
    assert.equal(joinWindow(START, END, atStartOffset(-15)).state, 'open');
  });

  test('stays open through the class and the grace period', () => {
    assert.equal(joinWindow(START, END, atStartOffset(0)).state, 'open', 'at the start');
    assert.equal(joinWindow(START, END, atStartOffset(30)).state, 'open', 'mid-class');
    // A learner arriving late has missed a lot, but locking them out of the
    // remainder helps nobody.
    assert.equal(
      joinWindow(START, END, atStartOffset(60 + JOIN_GRACE_MINUTES_AFTER - 1)).state,
      'open',
      'inside the grace period',
    );
  });

  test('closes once the grace period is over', () => {
    assert.equal(
      joinWindow(START, END, atStartOffset(60 + JOIN_GRACE_MINUTES_AFTER + 1)).state,
      'ended',
    );
  });

  test('msUntilOpen counts down and then stops at zero', () => {
    assert.equal(joinWindow(START, END, atStartOffset(-45)).msUntilOpen, 30 * 60_000);
    // Never negative — the countdown text reads straight off this.
    assert.equal(joinWindow(START, END, atStartOffset(10)).msUntilOpen, 0);
  });

  test('a missing end time is an hour, not an open door', () => {
    // A null slot_end must not mean "joinable forever".
    assert.equal(joinWindow(START, null, atStartOffset(30)).state, 'open');
    assert.equal(
      joinWindow(START, null, atStartOffset(60 + JOIN_GRACE_MINUTES_AFTER + 1)).state,
      'ended',
    );
  });

  test('canJoinNow agrees with the window it wraps', () => {
    assert.equal(canJoinNow(START, END, atStartOffset(-16)), false);
    assert.equal(canJoinNow(START, END, atStartOffset(-15)), true);
    assert.equal(canJoinNow(START, END, atStartOffset(999)), false);
  });
});

describe('humanCountdown', () => {
  test('reads as an orientation, not a stopwatch', () => {
    assert.equal(humanCountdown(0), 'now');
    assert.equal(humanCountdown(-5_000), 'now', 'never counts upward past zero');
    assert.equal(humanCountdown(60_000), 'in 1 minute', 'singular');
    assert.equal(humanCountdown(12 * 60_000), 'in 12 minutes');
    assert.equal(humanCountdown(60 * 60_000), 'in 1 hour');
    assert.equal(humanCountdown(5 * 60 * 60_000), 'in 5 hours');
    assert.equal(humanCountdown(48 * 60 * 60_000), 'in 2 days');
  });
});
