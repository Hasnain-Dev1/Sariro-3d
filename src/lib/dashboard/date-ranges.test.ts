import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRange, inRange, dateInRange } from './date-ranges';

/**
 * SARIRO — what "this month" means
 * =========================================================
 * §73 puts the same date filter on several dashboards. The failure worth
 * testing is not a wrong label — it is two screens quietly disagreeing about
 * the same words, so an expense total and a payout total for "this month" do
 * not reconcile and nobody can tell which is right.
 *
 * The boundaries are India's, matching the settlement cycle. `Z` times are UTC;
 * IST is +05:30, so 18:30Z is midnight in India.
 */

const ist = (y: number, m: number, d: number, h = 0) =>
  new Date(Date.UTC(y, m - 1, d, h) - 330 * 60_000);

describe('boundaries follow India, not the server', () => {
  test('"today" starts at midnight IST, not midnight UTC', () => {
    // 02:00 IST on 3 Sep is 20:30Z on 2 Sep. A UTC-based "today" would call
    // this the 2nd and show the wrong day's classes.
    const r = resolveRange('today', undefined, ist(2026, 9, 3, 2));
    assert.equal(r.from, ist(2026, 9, 3).toISOString());
    assert.equal(r.to, ist(2026, 9, 4).toISOString());
  });

  test('a month runs from the 1st to the 1st', () => {
    const r = resolveRange('month', undefined, ist(2026, 9, 15, 12));
    assert.equal(r.from, ist(2026, 9, 1).toISOString());
    assert.equal(r.to, ist(2026, 10, 1).toISOString());
    assert.equal(r.label, 'September 2026');
  });

  test('previous month rolls the year back in January', () => {
    const r = resolveRange('prev_month', undefined, ist(2027, 1, 8));
    assert.equal(r.label, 'December 2026');
    assert.equal(r.to, ist(2027, 1, 1).toISOString());
  });

  test('the week starts on Monday', () => {
    // Thursday 3 Sep 2026 → the week began Monday the 31st of August.
    const r = resolveRange('week', undefined, ist(2026, 9, 3, 10));
    assert.equal(r.from, ist(2026, 8, 31).toISOString());
  });

  test('on a Sunday the week is the one ending that day, not starting it', () => {
    // Sunday 6 Sep 2026. A Sunday-first week would start today and show an
    // almost-empty week to somebody reviewing the one just finished.
    const r = resolveRange('week', undefined, ist(2026, 9, 6, 10));
    assert.equal(r.from, ist(2026, 8, 31).toISOString());
  });
});

describe('ranges are half-open, so nothing is counted twice', () => {
  test('adjacent months share a boundary and do not overlap', () => {
    const aug = resolveRange('prev_month', undefined, ist(2026, 9, 10));
    const sep = resolveRange('month', undefined, ist(2026, 9, 10));
    assert.equal(aug.to, sep.from);

    const midnight = ist(2026, 9, 1).toISOString();
    assert.equal(inRange(midnight, aug), false, 'exclusive end');
    assert.equal(inRange(midnight, sep), true, 'inclusive start');
  });

  test('a class late on the last day stays in its own month', () => {
    const aug = resolveRange('prev_month', undefined, ist(2026, 9, 10));
    assert.equal(inRange(ist(2026, 8, 31, 23).toISOString(), aug), true);
  });
});

describe('custom ranges', () => {
  test('the chosen end date is included in full', () => {
    // Picking 30 September means "to the end of the 30th", not "to its
    // midnight" — otherwise a whole day silently vanishes from every total.
    const r = resolveRange('custom', { from: '2026-09-01', to: '2026-09-30' }, ist(2026, 10, 5));
    assert.equal(inRange(ist(2026, 9, 30, 22).toISOString(), r), true);
    assert.equal(inRange(ist(2026, 10, 1, 1).toISOString(), r), false);
  });

  test('a half-filled custom range falls back to everything, not to nothing', () => {
    const r = resolveRange('custom', { from: '2026-09-01' }, ist(2026, 9, 10));
    assert.equal(r.preset, 'all', 'an empty table would look like a bug');
  });

  test('a backwards range falls back rather than returning nothing', () => {
    const r = resolveRange('custom', { from: '2026-09-30', to: '2026-09-01' }, ist(2026, 10, 5));
    assert.equal(r.preset, 'all');
  });

  test('rubbish dates do not crash', () => {
    assert.equal(resolveRange('custom', { from: 'yesterday', to: 'soon' }).preset, 'all');
  });
});

describe('plain date columns', () => {
  test('a date-only value is read as an India date', () => {
    // expenses.spent_on is a DATE. Parsed as UTC midnight it lands 5.5 hours
    // before India's, so an expense on the 1st falls into the previous month.
    const sep = resolveRange('month', undefined, ist(2026, 9, 15));
    assert.equal(dateInRange('2026-09-01', sep), true);
    assert.equal(dateInRange('2026-08-31', sep), false);
    assert.equal(dateInRange('2026-10-01', sep), false);
  });

  test('a missing or malformed date is excluded, not counted', () => {
    const sep = resolveRange('month', undefined, ist(2026, 9, 15));
    assert.equal(dateInRange(null, sep), false);
    assert.equal(dateInRange('not-a-date', sep), false);
  });
});
