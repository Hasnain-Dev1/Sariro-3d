import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { latePenalty, LATE_GRACE_MINUTES, LATE_PENALTY } from './late-penalty';

/**
 * SARIRO — the class that started 39 minutes late and cost nothing
 * ============================================================================
 * The trigger charged only between 5 and 10 minutes, trusting the app to
 * finalise anything later as a no-show. It did not. The first real class on
 * the system started 39 minutes late and was paid ₹250 with a ₹0 penalty,
 * while the payout screen told that teacher the rule was "more than 5 minutes
 * — ₹100" with no ceiling at all.
 */

const START = '2026-09-06T08:55:00.000Z';
const plus = (mins: number) => new Date(Date.parse(START) + mins * 60_000).toISOString();

describe('latePenalty', () => {
  test('exactly on time costs nothing', () => {
    assert.equal(latePenalty(START, START).amount, 0);
  });

  test('early costs nothing, and reports the negative honestly', () => {
    const p = latePenalty(START, plus(-4));
    assert.equal(p.amount, 0);
    assert.equal(p.lateMinutes, -4);
  });

  test('inside the grace costs nothing', () => {
    assert.equal(latePenalty(START, plus(LATE_GRACE_MINUTES)).amount, 0);
  });

  test('one minute past the grace charges', () => {
    const p = latePenalty(START, plus(LATE_GRACE_MINUTES + 1));
    assert.equal(p.amount, LATE_PENALTY);
    assert.match(p.reason!, /6 min/);
  });

  test('the 39-minute class is charged — this is the bug', () => {
    // Real data: booking 2026-09-06T08:55, teacher started 09:34, penalty 0.
    const p = latePenalty(START, '2026-09-06T09:34:00.000Z');
    assert.equal(p.amount, LATE_PENALTY, 'a 39-minute late start must not be free');
    assert.equal(p.lateMinutes, 39);
  });

  test('there is no upper bound — the old 10-minute ceiling is gone', () => {
    // The ceiling existed because "anything later becomes a no-show". When
    // that does not happen, the class is paid in full. It is the gap between
    // two rules, and it is where the money leaks.
    for (const mins of [11, 20, 45, 90]) {
      assert.equal(latePenalty(START, plus(mins)).amount, LATE_PENALTY, `${mins} min must charge`);
    }
  });

  test('no recorded start is not a late join', () => {
    // Either a no-show — handled elsewhere, at ₹1,000 — or a gap in our own
    // instrumentation. Charging for a missing timestamp punishes the teacher
    // for something we failed to record.
    assert.equal(latePenalty(START, null).amount, 0);
    assert.equal(latePenalty(START, undefined).amount, 0);
  });

  test('a missing slot time is not a penalty either', () => {
    assert.equal(latePenalty(null, plus(30)).amount, 0);
  });

  test('unparseable timestamps do not invent a charge', () => {
    assert.equal(latePenalty('not a date', plus(30)).amount, 0);
    assert.equal(latePenalty(START, 'not a date').amount, 0);
  });

  test('Date objects work as well as strings', () => {
    const p = latePenalty(new Date(START), new Date(Date.parse(START) + 30 * 60_000));
    assert.equal(p.amount, LATE_PENALTY);
    assert.equal(p.lateMinutes, 30);
  });

  test('the reason names the minutes, because a teacher will query it', () => {
    assert.equal(latePenalty(START, plus(12)).reason, 'Late join (12 min)');
  });
});
