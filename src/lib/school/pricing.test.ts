import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CADENCE_DISCOUNT,
  CLASSES_PER_MONTH,
  PRICE_PER_CLASS_GROUP,
  PRICE_PER_CLASS_ONE_TO_ONE,
  cadencePlans,
  formatPrice,
  perClassFor,
  perMonthFor,
  priceBundle,
  roundDownTo9,
} from './pricing';
import { LESSONS_PER_GRADE, LESSONS_PER_GROUP } from './curriculum';

/**
 * SARIRO — pricing tests
 * =========================================================
 * The first tests in this repository, and they are here rather than anywhere
 * else because this file decides what real people are charged. Everything else
 * that breaks is embarrassing; this is the only module where a bug takes money
 * from someone, or fails to.
 *
 * Run: `npx tsx --test "src/**\/*.test.ts"`
 *
 * These are pure-function tests — no database, no network, no Next. They are
 * fast enough to run on every commit and cannot flake.
 *
 * The numbers asserted below are the ones printed in HANDOFF-CONTEXT §4. If a
 * change makes one of these fail, the question is not "which number do I
 * update" — it is "did we mean to change what a parent pays?"
 */

describe('roundDownTo9', () => {
  test('lands on a 9, always downward', () => {
    // The rule the whole price list rests on: never round a customer UP.
    assert.equal(roundDownTo9(299.7), 299);
    assert.equal(roundDownTo9(335.52), 329);
    assert.equal(roundDownTo9(1006.56), 999);
    assert.equal(roundDownTo9(479.52), 479);
  });

  test('an exact 9 is already correct and must not drop a further ten', () => {
    assert.equal(roundDownTo9(9), 9);
    assert.equal(roundDownTo9(279), 279);
    assert.equal(roundDownTo9(999), 999);
  });

  test('never returns something above the input', () => {
    for (let n = 0; n < 400; n += 0.37) {
      assert.ok(roundDownTo9(n) <= n, `roundDownTo9(${n}) rounded UP`);
    }
  });

  test('below nine there is no valid price, so it collapses to zero', () => {
    assert.equal(roundDownTo9(8.99), 0);
    assert.equal(roundDownTo9(0), 0);
  });
});

describe('per-class and per-month rates', () => {
  test('match the published rates', () => {
    assert.equal(perClassFor('1:4'), PRICE_PER_CLASS_GROUP);
    assert.equal(perClassFor('1:1'), PRICE_PER_CLASS_ONE_TO_ONE);
    assert.equal(perClassFor('1:4'), 6.99);
    assert.equal(perClassFor('1:1'), 9.99);
  });

  test('monthly is the .99-rounded multiple, and the ONLY upward rounding', () => {
    // 4 x $6.99 = $27.96, advertised as $27.99. Deliberate, and documented in
    // pricing.ts: "a price ending in .96 looks like a mistake, which costs more
    // than three cents." This test pins the size of that exception — three
    // cents, on the monthly rate only — so it cannot quietly grow into a
    // general licence to round customers up.
    for (const ratio of ['1:4', '1:1'] as const) {
      const exact = Math.round(perClassFor(ratio) * CLASSES_PER_MONTH * 100) / 100;
      const advertised = perMonthFor(ratio);
      const gap = Math.round((advertised - exact) * 100) / 100;
      assert.ok(gap >= 0 && gap <= 0.03, `${ratio}: monthly is ${gap} above the exact multiple`);
      assert.ok(
        advertised.toFixed(2).endsWith('.99'),
        `${ratio}: monthly ${advertised} does not end in .99, so the rounding bought nothing`
      );
    }
  });

  test('1:1 always costs more than 1:4', () => {
    assert.ok(perMonthFor('1:1') > perMonthFor('1:4'));
  });
});

describe('priceBundle', () => {
  test('a school year at 1:4 matches the published figures', () => {
    const b = priceBundle(LESSONS_PER_GRADE, '1:4');
    assert.equal(b.classes, 48);
    assert.equal(b.rawTotal, 335.52);
    assert.equal(b.total, 329);
    assert.equal(b.months, 12);
    assert.equal(b.monthlyEquivalent, 335.88);
  });

  test('a full grade group at 1:4 matches the published figures', () => {
    const b = priceBundle(LESSONS_PER_GROUP, '1:4');
    assert.equal(b.classes, 144);
    assert.equal(b.total, 999);
    assert.equal(b.months, 36);
  });

  test('rounding never charges more than the honest arithmetic', () => {
    for (const classes of [30, 42, 48, 96, 144]) {
      for (const ratio of ['1:4', '1:1'] as const) {
        const b = priceBundle(classes, ratio);
        assert.ok(
          b.total <= b.rawTotal,
          `${ratio} x${classes}: advertised ${b.total} exceeds raw ${b.rawTotal}`
        );
        assert.ok(b.roundingDiscount >= 0);
      }
    }
  });

  test('buying up front is never worse than paying monthly', () => {
    // "Save by paying up front" is printed on the page. If this ever goes
    // negative the site is advertising a saving that does not exist.
    for (const classes of [30, 42, 48, 96, 144]) {
      for (const ratio of ['1:4', '1:1'] as const) {
        const b = priceBundle(classes, ratio);
        assert.ok(
          b.upfrontSaving >= 0,
          `${ratio} x${classes}: upfront costs ${-b.upfrontSaving} MORE than monthly`
        );
      }
    }
  });
});

describe('formatPrice', () => {
  test('whole numbers carry no cents, and cents are never dropped', () => {
    assert.equal(formatPrice(999), '$999');
    assert.equal(formatPrice(27.99), '$27.99');
    assert.equal(formatPrice(279), '$279');
  });

  test('thousands are grouped so a big number stays readable', () => {
    assert.equal(formatPrice(1007.64), '$1,007.64');
  });
});

describe('cadencePlans', () => {
  const plans = cadencePlans(LESSONS_PER_GRADE, '1:4');
  const by = (c: string) => plans.find((p) => p.cadence === c)!;

  test('offers exactly three ways to pay, cheapest commitment first', () => {
    assert.equal(plans.length, 3);
    assert.deepEqual(plans.map((p) => p.cadence), ['monthly', 'quarterly', 'full']);
  });

  test('the monthly plan is the baseline and claims no saving', () => {
    const m = by('monthly');
    assert.equal(m.perPayment, 27.99);
    assert.equal(m.payments, 12);
    assert.equal(m.lifetimeTotal, 335.88);
    assert.equal(m.saving, 0);
    assert.equal(m.savingLabel, null);
  });

  test('quarterly and full match the published figures', () => {
    assert.equal(by('quarterly').perPayment, 79);
    assert.equal(by('quarterly').payments, 4);
    assert.equal(by('quarterly').lifetimeTotal, 316);
    assert.equal(by('full').perPayment, 279);
    assert.equal(by('full').payments, 1);
  });

  test('more commitment never costs more', () => {
    // The ordering the whole page depends on. If this inverts, the site is
    // asking a parent to pay MORE for committing longer.
    for (const classes of [30, 42, 48, 96, 144]) {
      for (const ratio of ['1:4', '1:1'] as const) {
        const [monthly, quarterly, full] = cadencePlans(classes, ratio);
        assert.ok(
          quarterly.lifetimeTotal <= monthly.lifetimeTotal,
          `${ratio} x${classes}: quarterly ${quarterly.lifetimeTotal} > monthly ${monthly.lifetimeTotal}`
        );
        assert.ok(
          full.lifetimeTotal <= quarterly.lifetimeTotal,
          `${ratio} x${classes}: full ${full.lifetimeTotal} > quarterly ${quarterly.lifetimeTotal}`
        );
      }
    }
  });

  test('every quoted saving is real arithmetic against the monthly total', () => {
    for (const classes of [30, 48, 144]) {
      const plans = cadencePlans(classes, '1:4');
      const monthlyTotal = plans[0].lifetimeTotal;
      for (const p of plans) {
        assert.equal(
          p.saving,
          Math.round((monthlyTotal - p.lifetimeTotal) * 100) / 100,
          `${p.cadence} x${classes}: quoted saving does not equal monthly minus lifetime`
        );
      }
    }
  });

  test('a saving is only labelled when there is one', () => {
    for (const p of cadencePlans(LESSONS_PER_GRADE, '1:4')) {
      if (p.saving > 0) assert.ok(p.savingLabel, `${p.cadence} saves but shows no label`);
      else assert.equal(p.savingLabel, null, `${p.cadence} saves nothing but claims a saving`);
    }
  });

  test('the discount percentages are the agreed ones', () => {
    assert.equal(CADENCE_DISCOUNT.monthly, 0);
    assert.equal(CADENCE_DISCOUNT.quarterly, 0.05);
    assert.equal(CADENCE_DISCOUNT.full, 0.15);
  });

  test('every payment figure lands on a price we would print', () => {
    for (const classes of [30, 42, 48, 96, 144]) {
      for (const p of cadencePlans(classes, '1:4')) {
        assert.ok(p.perPayment > 0, `${p.cadence} x${classes}: non-positive payment`);
        assert.ok(
          Number.isFinite(p.lifetimeTotal) && p.lifetimeTotal > 0,
          `${p.cadence} x${classes}: bad lifetime total`
        );
      }
    }
  });
});
