import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_INPUTS, DEFAULT_LADDER, PLAN_MONTHS, NOT_APPROVED,
  breakdown, capacityPlan, cacFor, contributionTarget, isApproved, keepFactor, ladderWarnings,
  mathematicalMinimum, monthlyCost, planMix, recommendedFloor, requiredCost, roundUpTo99,
  sellerFloor, sellerPriceList, splitCohort, statusFor, teamSales,
  type EconomicsInputs,
} from './economics';
import { DEFAULT_PRICE_BOOK, sanitizePriceBook } from './price-book';

/**
 * The founder's brief (15 Sep 2026) came with worked numbers. Each of them is
 * pinned here, so the calculator cannot quietly disagree with the person who
 * wrote the rules.
 */

const I = (over: Partial<EconomicsInputs> = {}): EconomicsInputs => ({ ...DEFAULT_INPUTS, ...over });
const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

describe('sales and CAC', () => {
  test('today: 5 sellers at ₹13,300 bring 52 students', () => {
    const s = teamSales(I());
    assert.equal(s.costPerSeller, 13_300);
    close(s.productivity, 10.4);
    close(s.cac, 66_500 / 52);
  });

  test('200 a month at 10.4 each needs 20 sellers, ₹2,66,000, ₹1,330 a student', () => {
    const p = capacityPlan(I());
    assert.equal(p.sellers, 20);
    assert.equal(p.teamCost, 266_000);
    close(p.cac, 1_330);
  });

  test('seller count rounds up, but not on a floating-point hair', () => {
    assert.equal(capacityPlan(I(), 104).sellers, 10, '104 ÷ 10.4 is exactly 10');
    assert.equal(capacityPlan(I(), 105).sellers, 11);
  });

  test('changing productivity moves CAC, and pricing follows it', () => {
    const slow = I({ cacSource: 'target', productivityOverride: 5 });
    const fast = I({ cacSource: 'target', productivityOverride: 20 });
    assert.ok(cacFor(slow) > cacFor(fast));
    assert.ok(mathematicalMinimum(slow, '1:4', 3).value > mathematicalMinimum(fast, '1:4', 3).value);
  });
});

describe('teacher and monthly cost', () => {
  test('1:4 teacher cost per child follows how full the batch is', () => {
    assert.equal(monthlyCost(I({ batchOccupancy: 4 }), '1:4').teacher, 300);
    assert.equal(monthlyCost(I({ batchOccupancy: 3 }), '1:4').teacher, 400);
    assert.equal(monthlyCost(I({ batchOccupancy: 2 }), '1:4').teacher, 600);
    assert.equal(monthlyCost(I({ batchOccupancy: 1 }), '1:4').teacher, 1_200);
  });

  test('1:1 is ₹250 × 4 = ₹1,000', () => {
    assert.equal(monthlyCost(I(), '1:1').teacher, 1_000);
  });

  test('month 1 has no operations cost; months 2+ do', () => {
    assert.equal(monthlyCost(I(), '1:4').firstMonth, 650);
    assert.equal(monthlyCost(I(), '1:4').laterMonth, 850);
    assert.equal(monthlyCost(I(), '1:1').firstMonth, 1_350);
    assert.equal(monthlyCost(I(), '1:1').laterMonth, 1_550);
  });

  test('operations over a plan is ₹200 × (N − 1)', () => {
    const ops = PLAN_MONTHS.map((m) => breakdown(I(), '1:4', m, 10_000).ops);
    assert.deepEqual(ops, [0, 400, 1_000, 2_200, 7_000]);
  });

  test('conservative mode uses every catch-up and doubt session; off, the utilisation counts', () => {
    assert.equal(monthlyCost(I({ catchupUtilisation: 50 }), '1:4').catchup, 150);
    assert.equal(monthlyCost(I({ conservative: false, catchupUtilisation: 50 }), '1:4').catchup, 75);
    assert.equal(monthlyCost(I({ conservative: false, doubtUtilisation: 0 }), '1:4').doubt, 0);
  });
});

describe('GST and the gateway', () => {
  test('GST is inside the price, never added to it', () => {
    const b = breakdown(I(), '1:4', 3, 11_800);
    close(b.revenueExGst, 10_000);
    close(b.gst, 1_800);
  });

  test('the gateway takes 2.5% of the whole payment', () => {
    close(breakdown(I(), '1:4', 12, 10_000).gateway, 250);
  });

  test('no GST from outside India', () => {
    const b = breakdown(I({ gstEnabled: false }), '1:4', 3, 10_000);
    assert.equal(b.gst, 0);
    assert.equal(b.revenueExGst, 10_000);
    close(keepFactor(I({ gstEnabled: false })), 0.975);
  });
});

describe('the minimum price', () => {
  test('the contribution a plan must leave is ₹400 × N', () => {
    assert.deepEqual([3, 6, 12, 36].map((m) => contributionTarget(I(), m)), [1_200, 2_400, 4_800, 14_400]);
  });

  test('the founder’s example: 3 months, 1:4, CAC ₹1,330 → ₹5,934, floor ₹6,499', () => {
    const at200 = I({ cacSource: 'target' });
    assert.equal(requiredCost(at200, '1:4', 3).total, 4_880);
    assert.equal(Math.ceil(mathematicalMinimum(at200, '1:4', 3).value), 5_934);
    assert.equal(recommendedFloor(at200, '1:4', 3), 6_499);
  });

  test('at exactly the minimum, the plan leaves exactly its target', () => {
    for (const ratio of ['1:4', '1:1'] as const) {
      for (const m of [3, 6, 12, 36]) {
        const b = breakdown(I(), ratio, m, mathematicalMinimum(I(), ratio, m).value);
        close(b.contribution, contributionTarget(I(), m), 1e-6);
      }
    }
  });

  test('a monthly plan must cover month 1 AND a renewal month, whichever needs more', () => {
    const min = mathematicalMinimum(I(), '1:4', 1);
    assert.ok(min.renewal !== null);
    assert.equal(min.value, Math.max(min.firstMonth, min.renewal!));
    // CAC is not charged again on renewal.
    const noCac = mathematicalMinimum(I({ sellers: 0 }), '1:4', 1);
    assert.equal(noCac.renewal, min.renewal);
  });

  test('a small first-month target stops CAC forcing the monthly fee up', () => {
    const lenient = mathematicalMinimum(I({ firstMonthContribution: 0, renewalMonthContribution: 0 }), '1:4', 1).value;
    const strict = mathematicalMinimum(I({ firstMonthContribution: 400 }), '1:4', 1).value;
    assert.ok(strict > lenient);
  });

  test('nothing can be covered if GST and the gateway take everything', () => {
    assert.equal(mathematicalMinimum(I({ gatewayRate: 90 }), '1:4', 3).value, Infinity);
  });

  test('floors round UP to a price ending in 99', () => {
    assert.equal(roundUpTo99(5_934), 5_999);
    assert.equal(roundUpTo99(6_434), 6_499);
    assert.equal(roundUpTo99(5_999), 5_999);
    assert.equal(roundUpTo99(6_000), 6_099);
    assert.equal(recommendedFloor(I({ cacSource: 'target', bufferMode: 'percent', bufferValue: 10 }), '1:4', 3), 6_599);
  });
});

describe('what a price leaves', () => {
  test('a 3-year plan reserves all 36 months before calling anything contribution', () => {
    const b = breakdown(I(), '1:4', 36, 64_999);
    assert.equal(b.deliveryReserve, 36 * 650 + 35 * 200);
    close(b.contribution, b.revenueExGst - b.gateway - b.cac - b.deliveryReserve);
    close(b.perMonth, b.contribution / 36);
    close(b.perClass, b.contribution / (36 * 4));
    close(b.perBatch!, b.contribution * 4);
  });

  test('1:1 has no batch', () => {
    assert.equal(breakdown(I(), '1:1', 6, 17_999).perBatch, null);
  });

  test('status: red below target, yellow near it, green comfortably over', () => {
    assert.equal(statusFor(I(), -1, 0), 'red');
    assert.equal(statusFor(I(), 99, 100), 'red');
    assert.equal(statusFor(I(), 110, 100), 'yellow');
    assert.equal(statusFor(I(), 125, 100), 'green');
  });

  test('the monthly plan is only as green as its weaker month', () => {
    const b = breakdown(I({ renewalMonthContribution: 100_000 }), '1:4', 1, 3_000);
    assert.equal(b.status, 'red');
  });
});

describe('the seller ladder', () => {
  test('below the floor is not approved', () => {
    const floor = sellerFloor(I(), '1:4', 6, DEFAULT_LADDER['1:4'][6]);
    assert.ok(isApproved(floor, floor));
    assert.ok(!isApproved(floor - 1, floor));
    assert.match(NOT_APPROVED, /NOT APPROVED/);
  });

  test('a manager’s floor replaces the calculated one, and is flagged if it is below the minimum', () => {
    const e = { ...DEFAULT_LADDER['1:4'][6], manualFloor: 1_000 };
    assert.equal(sellerFloor(I(), '1:4', 6, e), 1_000);
    assert.ok(ladderWarnings(I(), '1:4', 6, e).includes('manual_floor_below_minimum'));
  });

  test('today’s 1:1 monthly price sits below its own floor, and says so', () => {
    assert.ok(ladderWarnings(I(), '1:1', 1, DEFAULT_LADDER['1:1'][1]).includes('public_below_floor'));
  });

  test('a seller never receives costs or the maths minimum, and never an offer below the floor', () => {
    const ladder = structuredClone(DEFAULT_LADDER);
    ladder['1:4'][6] = { publicPrice: 14_999, offer1: 13_999, offer2: 100, manualFloor: null };
    const list = sellerPriceList(I(), ladder);
    const six = list['1:4'].find((p) => p.months === 6)!;
    assert.equal(six.offer1, 13_999);
    assert.equal(six.offer2, null);
    assert.deepEqual(Object.keys(six).sort(), ['floor', 'label', 'months', 'offer1', 'offer2', 'publicPrice']);
  });
});

describe('a cohort', () => {
  test('200 students at 55/30/10/5 are 110, 60, 20 and 10', () => {
    assert.deepEqual(splitCohort(200, { 1: 55, 3: 30, 6: 0, 12: 10, 36: 5 }), { 1: 110, 3: 60, 6: 0, 12: 20, 36: 10 });
  });

  test('whole children that always add up to the cohort', () => {
    const s = splitCohort(7, { 1: 33.3, 3: 33.3, 6: 33.4, 12: 0, 36: 0 });
    assert.equal(Object.values(s).reduce((a, b) => a + b, 0), 7);
  });

  test('totals are the sum of the plans', () => {
    const r = planMix(I(), DEFAULT_LADDER, DEFAULT_PRICE_BOOK.mix);
    close(r.totals.cash, r.rows.reduce((n, x) => n + x.cash, 0));
    assert.equal(r.totals.students, 200);
    assert.equal(r.percentTotal, 100);
  });
});

describe('sanitizing a saved book', () => {
  test('garbage becomes the defaults', () => {
    assert.deepEqual(sanitizePriceBook('nonsense'), DEFAULT_PRICE_BOOK);
    assert.deepEqual(sanitizePriceBook({ inputs: { gstRate: 'x' } }).inputs.gstRate, 18);
  });

  test('numbers are clamped and strings are read', () => {
    const b = sanitizePriceBook({ inputs: { gatewayRate: -5, batchOccupancy: 9, sellers: '12' } });
    assert.equal(b.inputs.gatewayRate, 0);
    assert.equal(b.inputs.batchOccupancy, 4);
    assert.equal(b.inputs.sellers, 12);
  });

  test('a cleared public price stays cleared; a missing one keeps the default', () => {
    const b = sanitizePriceBook({ ladder: { '1:4': { 3: { publicPrice: null } } } });
    assert.equal(b.ladder['1:4'][3].publicPrice, null);
    assert.equal(b.ladder['1:4'][6].publicPrice, 14_999);
  });

  test('fields that are not part of the book do not survive', () => {
    const b = sanitizePriceBook({ inputs: { evil: 1 }, extra: true }) as unknown as Record<string, unknown>;
    assert.equal('extra' in b, false);
    assert.equal('evil' in (b.inputs as Record<string, unknown>), false);
  });
});
