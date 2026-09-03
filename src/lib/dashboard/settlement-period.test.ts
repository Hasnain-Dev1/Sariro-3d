import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  windowForMonth, currentSettlementWindow, accruingWindow,
  isOpen, isAutoSettleDue, daysUntil, describeSettlement, isInWindow, istParts,
  AUTO_SETTLE_ON_DAY, AUTO_SETTLE_AT_HOUR_IST,
} from './settlement-period';

/**
 * SARIRO — the rule that decides when a teacher gets paid
 * =========================================================
 * §92 names these scenarios directly: settlement unavailable before the 1st,
 * available on the 1st, and automatic on the 5th at 10 AM IST. They are here
 * because every one of them is a wrong-money bug in a different direction:
 *
 *   opens early — a teacher settles a month that is still running, and the
 *                 classes taught after they clicked fall into a gap;
 *   opens late  — payday silently slips and nobody can explain why;
 *   auto wrong  — a teacher who never clicks is either paid twice or not at all.
 *
 * IST is stated in the spec, so every boundary here is pinned in IST rather
 * than in whatever timezone the test machine happens to sit in. `Z` times below
 * are UTC; IST is +05:30, so 18:30Z is midnight in India.
 */

/** A UTC instant for a wall-clock time in India. */
const ist = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(Date.UTC(y, m - 1, d, h, min) - 330 * 60_000);

describe('the IST clock', () => {
  test('midnight in India is 18:30 UTC the day before', () => {
    const p = istParts('2026-08-31T18:30:00.000Z');
    assert.deepEqual(
      { year: p.year, month: p.month, day: p.day, hour: p.hour },
      { year: 2026, month: 9, day: 1, hour: 0 },
      'the moment September begins in India'
    );
  });

  test('a date near midnight does not slip a month', () => {
    // 23:45 IST on 31 August is still August, though it is 18:15Z.
    const p = istParts(ist(2026, 8, 31, 23, 45));
    assert.equal(p.month, 8);
    assert.equal(p.day, 31);
  });
});

describe('which month is being settled', () => {
  test('on 3 September, August is the month waiting', () => {
    const w = currentSettlementWindow(ist(2026, 9, 3, 12));
    assert.equal(w.month, '2026-08');
    assert.equal(w.label, 'August 2026');
  });

  test('and September is still accruing', () => {
    assert.equal(accruingWindow(ist(2026, 9, 3, 12)).month, '2026-09');
  });

  test('January settles the previous December', () => {
    const w = currentSettlementWindow(ist(2027, 1, 2, 9));
    assert.equal(w.month, '2026-12', 'the year rolls back, not just the month');
  });

  test('a month ends exactly where the next begins — no class falls in both', () => {
    const aug = windowForMonth(2026, 8);
    const sep = windowForMonth(2026, 9);
    assert.equal(aug.periodEnd, sep.periodStart);
  });

  test('December rolls into the next January', () => {
    const dec = windowForMonth(2026, 12);
    assert.equal(dec.periodEnd, ist(2027, 1, 1).toISOString());
    assert.equal(dec.autoSettlesAt, ist(2027, 1, AUTO_SETTLE_ON_DAY, AUTO_SETTLE_AT_HOUR_IST).toISOString());
  });
});

describe('§41 — settlement opens on the 1st', () => {
  const august = windowForMonth(2026, 8);

  test('not on 31 August, however late in the day', () => {
    assert.equal(isOpen(august, ist(2026, 8, 31, 23, 59)), false);
  });

  test('the moment September begins in India', () => {
    assert.equal(isOpen(august, ist(2026, 9, 1, 0, 0)), true);
  });

  test('the old rule is gone — the 30th is not the boundary', () => {
    // The previous implementation opened on the 30th. August has 31 days, so
    // this instant used to be settleable and now is not.
    assert.equal(isOpen(august, ist(2026, 8, 30, 12)), false);
  });
});

describe('§42 — automatic on the 5th at 10:00 IST', () => {
  const august = windowForMonth(2026, 8);

  test('not at 09:59 on the 5th', () => {
    assert.equal(isAutoSettleDue(august, ist(2026, 9, 5, 9, 59)), false);
  });

  test('due at exactly 10:00', () => {
    assert.equal(isAutoSettleDue(august, ist(2026, 9, 5, 10, 0)), true);
  });

  test('still due later — a missed run must catch up, not skip the month', () => {
    assert.equal(isAutoSettleDue(august, ist(2026, 9, 9, 3)), true);
  });

  test('10:00 IST is 04:30 UTC — the boundary is not the server clock', () => {
    assert.equal(august.autoSettlesAt, '2026-09-05T04:30:00.000Z');
  });
});

describe('what the screen says', () => {
  test('between the 1st and the 5th it is ready and counting down', () => {
    const d = describeSettlement(ist(2026, 9, 2, 12));
    assert.equal(d.state, 'open');
    assert.equal(d.settling.month, '2026-08');
    assert.ok(d.headline.includes('August 2026'));
  });

  test('after the 5th at 10 it is due to settle itself', () => {
    assert.equal(describeSettlement(ist(2026, 9, 6, 11)).state, 'auto_due');
  });

  test('the accruing month reports when it will open', () => {
    const d = describeSettlement(ist(2026, 9, 20, 12));
    assert.equal(d.accruing.month, '2026-09');
    // 20 Sep → opens 1 Oct: 11 days.
    assert.equal(d.daysUntilNextOpens, 11);
  });

  test('a countdown never runs negative', () => {
    assert.equal(daysUntil('2026-01-01T00:00:00.000Z', ist(2026, 9, 3)), 0);
  });
});

describe('which classes a settlement pays for', () => {
  const august = windowForMonth(2026, 8);

  test('a class on the 1st of the month is in it', () => {
    assert.equal(isInWindow(ist(2026, 8, 1, 9).toISOString(), august), true);
  });

  test('a class at 23:30 IST on the last day is still in it', () => {
    // 23:30 IST on 31 Aug is 18:00Z — a naive UTC month check would drop it.
    assert.equal(isInWindow(ist(2026, 8, 31, 23, 30).toISOString(), august), true);
  });

  test('a class on 1 September is not', () => {
    assert.equal(isInWindow(ist(2026, 9, 1, 0, 30).toISOString(), august), false);
  });

  test('a class in July is not', () => {
    assert.equal(isInWindow(ist(2026, 7, 31, 20).toISOString(), august), false);
  });

  test('rubbish in gets false, not a crash', () => {
    assert.equal(isInWindow('not-a-date', august), false);
  });
});
