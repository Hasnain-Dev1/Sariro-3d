import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SITE_PRICES, cadencePlans, perClassFor, perMonthFor, priceBundle } from '@/lib/school/pricing';
import { LESSONS_PER_GRADE } from '@/lib/school/curriculum';
import { resolveCheckoutItem } from '@/lib/checkout/resolve';
import { SITE_PRICE_KEYS, sitePriceRows, sitePricesFromRows, validateSitePrices } from './site-prices';

/**
 * HR can now change the website's prices from the dashboard. What must never
 * happen: a bad row breaking the price list, a typo reaching checkout, or the
 * page and the charge being worked out from different numbers.
 */

const raised = { groupMonthly: 44.99, oneToOneMonthly: 64.99, quarterlyDiscount: 5, fullDiscount: 15 };

describe('reading the stored prices', () => {
  test('no rows is the defaults', () => {
    assert.deepEqual(sitePricesFromRows([]), DEFAULT_SITE_PRICES);
    assert.deepEqual(sitePricesFromRows(null), DEFAULT_SITE_PRICES);
  });

  test('saved rows round-trip', () => {
    assert.deepEqual(sitePricesFromRows(sitePriceRows(raised)), raised);
  });

  test('a blank, garbage or out-of-range row falls back for that number only', () => {
    const p = sitePricesFromRows([
      { key: SITE_PRICE_KEYS.groupMonthly, value: 'abc' },
      { key: SITE_PRICE_KEYS.oneToOneMonthly, value: '64.99' },
      { key: SITE_PRICE_KEYS.quarterlyDiscount, value: '95' },
      { key: SITE_PRICE_KEYS.fullDiscount, value: '' },
    ]);
    assert.equal(p.groupMonthly, DEFAULT_SITE_PRICES.groupMonthly);
    assert.equal(p.oneToOneMonthly, 64.99);
    assert.equal(p.quarterlyDiscount, DEFAULT_SITE_PRICES.quarterlyDiscount);
    assert.equal(p.fullDiscount, DEFAULT_SITE_PRICES.fullDiscount);
  });
});

describe('saving', () => {
  test('a sensible change is accepted', () => {
    assert.deepEqual(validateSitePrices(raised), { ok: true, prices: raised });
  });

  test('a slipped digit is refused', () => {
    assert.equal(validateSitePrices({ ...raised, groupMonthly: 3999 }).ok, false);
    assert.equal(validateSitePrices({ ...raised, fullDiscount: 90 }).ok, false);
    assert.equal(validateSitePrices({ ...raised, groupMonthly: undefined }).ok, false);
  });

  test('one to one is never cheaper than a group seat; the year saves at least the quarter', () => {
    assert.equal(validateSitePrices({ ...raised, oneToOneMonthly: 30 }).ok, false);
    assert.equal(validateSitePrices({ ...raised, quarterlyDiscount: 20, fullDiscount: 10 }).ok, false);
  });
});

describe('the price list follows the saved numbers', () => {
  test('the defaults give exactly today’s site', () => {
    assert.equal(perClassFor('1:4'), 9.99);
    assert.equal(perClassFor('1:1'), 14.99);
    assert.equal(cadencePlans(LESSONS_PER_GRADE, '1:4').find((p) => p.cadence === 'full')!.perPayment, 399);
  });

  test('a new month price moves the class price, the bundles and every plan', () => {
    assert.equal(perMonthFor('1:4', raised), 44.99);
    assert.equal(perClassFor('1:4', raised), 11.24);
    assert.ok(priceBundle(48, '1:4', raised).total > priceBundle(48, '1:4').total);
    const full = cadencePlans(LESSONS_PER_GRADE, '1:4', raised).find((p) => p.cadence === 'full')!;
    assert.ok(full.perPayment > 399);
    assert.equal(full.discountPercent, 15);
  });

  test('a saving is labelled exactly when there is one — never "Save $0"', () => {
    // At 0% the quarterly plan can still save a little, from rounding each
    // payment down to end in 9. That is a real saving and says so.
    for (const discount of [0, 5, 15]) {
      for (const p of cadencePlans(LESSONS_PER_GRADE, '1:4', { ...raised, quarterlyDiscount: discount, fullDiscount: discount })) {
        assert.equal(p.savingLabel === null, p.saving <= 0, `${p.cadence} at ${discount}%`);
      }
    }
  });

  test('checkout prices from the same numbers create-order will use', () => {
    const item = resolveCheckoutItem({ subject: 'mathematics', grade: '7', scope: 'grade', ratio: '1:4', cadence: 'monthly' }, raised);
    assert.ok(item);
    assert.equal(item!.perPayment, 44.99);
  });
});
