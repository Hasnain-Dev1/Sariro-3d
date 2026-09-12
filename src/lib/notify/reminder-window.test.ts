import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { dueForReminder, lookaheadMinutes, TRIAL_REMINDER_MIN, CLASS_REMINDER_MIN } from './reminder-window';

/**
 * SARIRO — reminder-window tests
 * ============================================================================
 * A trial family is told about an hour ahead; everybody else about half an
 * hour. The job runs every ten minutes, so the windows must be wider than
 * that or a class slips between two runs and nobody is told at all.
 */

const NOW = Date.parse('2026-09-11T10:00:00Z');
const inMin = (m: number) => NOW + m * 60_000;

describe('a free trial', () => {
  test('is reminded about an hour ahead', () => {
    assert.equal(dueForReminder({ slotStartMs: inMin(60), nowMs: NOW, isTrial: true }), true);
    assert.equal(dueForReminder({ slotStartMs: inMin(56), nowMs: NOW, isTrial: true }), true);
  });

  test('is not reminded two hours ahead', () => {
    assert.equal(dueForReminder({ slotStartMs: inMin(120), nowMs: NOW, isTrial: true }), false);
  });
});

describe('an ordinary class', () => {
  test('is still reminded about half an hour ahead, as before', () => {
    assert.equal(dueForReminder({ slotStartMs: inMin(30), nowMs: NOW, isTrial: false }), true);
  });

  test('is NOT reminded an hour ahead — only trials changed', () => {
    assert.equal(dueForReminder({ slotStartMs: inMin(60), nowMs: NOW, isTrial: false }), false);
  });
});

describe('never', () => {
  test('a class that has already started', () => {
    assert.equal(dueForReminder({ slotStartMs: inMin(-4), nowMs: NOW, isTrial: true }), false);
    assert.equal(dueForReminder({ slotStartMs: NOW, nowMs: NOW, isTrial: false }), false);
  });
});

describe('the windows outlast the ten-minute job', () => {
  test('each window is wider than the interval between runs', () => {
    assert.ok(TRIAL_REMINDER_MIN - 60 > 0 && TRIAL_REMINDER_MIN > 10);
    assert.ok(CLASS_REMINDER_MIN > 10);
  });

  /* Two runs ten minutes apart either side of the hour: at least one of them
     must catch a trial, or it is never reminded. */
  test('a trial cannot slip between two runs', () => {
    for (let offset = 0; offset < 10; offset++) {
      const first = inMin(0), second = inMin(10);
      const start = inMin(66 + offset);
      const caught =
        dueForReminder({ slotStartMs: start, nowMs: first, isTrial: true }) ||
        dueForReminder({ slotStartMs: start, nowMs: second, isTrial: true });
      assert.equal(caught, true, `a trial ${66 + offset} min out was missed by both runs`);
    }
  });

  test('the job looks far enough ahead for both kinds', () => {
    assert.equal(lookaheadMinutes(), Math.max(TRIAL_REMINDER_MIN, CLASS_REMINDER_MIN));
  });
});
