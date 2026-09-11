import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { saleBonus, computeIncentive } from './incentives';

/**
 * SARIRO — one sale's value bonus
 * ============================================================================
 * saleBonus() is what the payout screen prints next to each sale, and what
 * computeIncentive() now counts with. The property that matters is that the
 * two can never disagree: a row showing ₹2,000 beside a total that counted
 * ₹200 is a payslip a seller cannot check.
 */

describe('the two bands', () => {
  test('₹50,000 or more is the 50k band, and only that band', () => {
    assert.deepEqual(saleBonus(60000), { band: '50k', amount: 2000 });
    assert.deepEqual(saleBonus(50000), { band: '50k', amount: 2000 });
  });

  test('more than ₹20,000 is the 20k band', () => {
    assert.deepEqual(saleBonus(49999), { band: '20k', amount: 200 });
    assert.deepEqual(saleBonus(20001), { band: '20k', amount: 200 });
  });

  test('exactly ₹20,000 earns nothing — the rule is MORE THAN', () => {
    assert.deepEqual(saleBonus(20000), { band: null, amount: 0 });
  });

  test('nothing, negative and nonsense earn nothing', () => {
    for (const a of [0, -5, Number.NaN, 3250]) {
      assert.deepEqual(saleBonus(a), { band: null, amount: 0 }, `${a}`);
    }
  });
});

describe('the screen and the total agree', () => {
  test('for every amount, one sale’s bonus is exactly what the total counted', () => {
    const probes = [0, 1000, 19999, 20000, 20001, 35000, 49999, 50000, 50001, 120000];
    for (const amount of probes) {
      assert.equal(
        computeIncentive([{ amount }]).bonusAmount,
        saleBonus(amount).amount,
        `disagreement at ₹${amount}`
      );
    }
  });
});
