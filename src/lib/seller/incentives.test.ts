import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeIncentive,
  readIncentiveConfig,
  baseSalary,
  needsApproval,
  DEFAULT_INCENTIVES,
  type SaleForIncentive,
} from './incentives';

/**
 * SARIRO — the incentive tests
 * ============================================================================
 * The interesting assertions here are the PROPERTIES, not the fixed numbers:
 * tiers never sum, the two value bonuses never both apply to one sale, and
 * selling more never pays less. A test that only pins 15 → 5000 would pass
 * against an implementation that also paid 5000 + 12000 at thirty.
 */

const sale = (amount: number): SaleForIncentive => ({ amount });
const many = (n: number, amount = 1000) => Array.from({ length: n }, () => sale(amount));

describe('tiers do not stack', () => {
  test('below the first tier there is no flat entitlement', () => {
    const b = computeIncentive(many(14));
    assert.equal(b.tierSales, 0);
    assert.equal(b.tierAmount, 0);
    assert.equal(b.total, 0);
  });

  test('exactly 15 sales earns 5,000', () => {
    const b = computeIncentive(many(15));
    assert.equal(b.tierSales, 15);
    assert.equal(b.total, 5000);
  });

  test('29 sales is still the first tier, not a blend', () => {
    assert.equal(computeIncentive(many(29)).total, 5000);
  });

  /* The whole reason this module exists. A loop that adds every tier passed
     would return 17,000 here and nobody would query a good month. */
  test('exactly 30 sales earns 12,000 — NOT 5,000 + 12,000', () => {
    const b = computeIncentive(many(30));
    assert.equal(b.tierSales, 30);
    assert.equal(b.tierAmount, 12000);
    assert.equal(b.total, 12000);
    assert.notEqual(b.total, 17000);
  });

  test('past the top tier each further sale is a flat 500', () => {
    const b = computeIncentive(many(33));
    assert.equal(b.extraSales, 3);
    assert.equal(b.extraAmount, 1500);
    assert.equal(b.total, 13500);
  });

  test('the 31st sale adds exactly one rate, not a new tier', () => {
    const at30 = computeIncentive(many(30)).total;
    const at31 = computeIncentive(many(31)).total;
    assert.equal(at31 - at30, DEFAULT_INCENTIVES.abovePerSale);
  });
});

describe('value bonuses replace each other', () => {
  test('a 60,000 sale is worth 2,000 — the 20k band is cancelled, not added', () => {
    const b = computeIncentive([sale(60000)]);
    assert.equal(b.bonus50kCount, 1);
    assert.equal(b.bonus20kCount, 0);
    assert.equal(b.bonusAmount, 2000);
    assert.notEqual(b.bonusAmount, 2200);
  });

  test('a 25,000 sale is worth 200', () => {
    assert.equal(computeIncentive([sale(25000)]).bonusAmount, 200);
  });

  test('an ordinary sale carries no value bonus', () => {
    assert.equal(computeIncentive([sale(3250)]).bonusAmount, 0);
  });

  /* ── The asymmetric boundary, pinned rather than tidied ───────────────────
     The rule was given as "more then 20k" and "50k+", which are different
     comparisons. Both sides are asserted so that changing either one is a
     deliberate act with a failing test attached, not a silent adjustment to
     somebody's pay. */
  test('exactly 20,000 earns nothing — the rule is MORE THAN 20k', () => {
    assert.equal(computeIncentive([sale(20000)]).bonusAmount, 0);
  });

  test('one rupee over 20,000 earns the bonus', () => {
    assert.equal(computeIncentive([sale(20001)]).bonusAmount, 200);
  });

  test('exactly 50,000 earns 2,000 — the rule is 50k PLUS', () => {
    assert.equal(computeIncentive([sale(50000)]).bonusAmount, 2000);
  });

  test('bonuses accrue below the first tier too — the rule says "anytime"', () => {
    const b = computeIncentive([sale(60000), sale(25000)]);
    assert.equal(b.tierAmount, 0);
    assert.equal(b.total, 2200); // 2000 + 200, two different sales
  });
});

describe('properties that must always hold', () => {
  test('selling more never pays less', () => {
    let previous = -1;
    for (let n = 0; n <= 40; n++) {
      const total = computeIncentive(many(n)).total;
      assert.ok(total >= previous, `${n} sales paid less than ${n - 1}`);
      previous = total;
    }
  });

  test('a larger sale never pays less than a smaller one', () => {
    const amounts = [0, 1000, 19999, 20000, 20001, 49999, 50000, 100000];
    let previous = -1;
    for (const a of amounts) {
      const total = computeIncentive([sale(a)]).total;
      assert.ok(total >= previous, `a ${a} sale paid less than the one below it`);
      previous = total;
    }
  });

  test('the total is always the three parts and nothing else', () => {
    const b = computeIncentive([...many(32), sale(60000), sale(25000)]);
    assert.equal(b.total, b.tierAmount + b.extraAmount + b.bonusAmount);
  });

  test('no sales is zero, not NaN', () => {
    const b = computeIncentive([]);
    assert.equal(b.total, 0);
    assert.equal(b.salesCount, 0);
    assert.ok(Number.isFinite(b.total));
  });

  test('a malformed amount is ignored rather than poisoning the sum', () => {
    const b = computeIncentive([
      sale(60000),
      { amount: Number.NaN },
      { amount: -5 },
      { amount: undefined as unknown as number },
    ]);
    assert.equal(b.bonusAmount, 2000);
    assert.ok(Number.isFinite(b.total));
  });
});

describe('the next step up', () => {
  test('a new seller is told how far the first tier is', () => {
    assert.deepEqual(computeIncentive(many(4)).nextTier, { salesNeeded: 11, amount: 5000 });
  });

  test('past the first tier it points at the second', () => {
    assert.deepEqual(computeIncentive(many(15)).nextTier, { salesNeeded: 15, amount: 12000 });
  });

  test('at the top there is no next tier to chase', () => {
    assert.equal(computeIncentive(many(30)).nextTier, null);
  });
});

describe('configuration', () => {
  test('missing settings fall back to the defaults', () => {
    assert.deepEqual(readIncentiveConfig([]), DEFAULT_INCENTIVES);
    assert.deepEqual(readIncentiveConfig(null), DEFAULT_INCENTIVES);
  });

  test('a malformed row falls back for that key alone', () => {
    const c = readIncentiveConfig([
      { key: 'seller_incentive_tier1_amount', value: 'not a number' },
      { key: 'seller_incentive_tier2_amount', value: '15000' },
    ]);
    assert.equal(c.tier1Amount, DEFAULT_INCENTIVES.tier1Amount);
    assert.equal(c.tier2Amount, 15000);
  });

  test('changed tiers are honoured by the arithmetic', () => {
    const c = readIncentiveConfig([
      { key: 'seller_incentive_tier1_sales', value: '10' },
      { key: 'seller_incentive_tier1_amount', value: '3000' },
    ]);
    assert.equal(computeIncentive(many(10), c).total, 3000);
    assert.equal(computeIncentive(many(9), c).total, 0);
  });

  test("a seller's own base salary wins over the company default", () => {
    const rows = [{ key: 'seller_base_salary_default', value: '10000' }];
    assert.equal(baseSalary(18000, rows), 18000);
    assert.equal(baseSalary(null, rows), 10000);
    assert.equal(baseSalary(undefined, []), 10000);
  });

  test('a base salary of zero is a real answer, not a missing one', () => {
    assert.equal(baseSalary(0, [{ key: 'seller_base_salary_default', value: '10000' }]), 0);
  });
});

describe('approval', () => {
  test('a zero month is never sent to HR', () => {
    assert.equal(needsApproval(computeIncentive(many(3))), false);
  });

  test('a month with only a value bonus still is', () => {
    assert.equal(needsApproval(computeIncentive([sale(60000)])), true);
  });
});
