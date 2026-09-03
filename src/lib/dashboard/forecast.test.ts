import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildForecast, formatMoney, type ForecastInputs } from './forecast';

/**
 * SARIRO — the numbers somebody will quote to a bank
 * =========================================================
 * §68 says predictions must be clearly distinguished from actual financial
 * data. These tests hold that line, because the failure is not a wrong pixel —
 * it is a founder reading a projected figure as a committed one in a funding
 * conversation, or a profit number silently produced by treating dollars as
 * rupees.
 *
 * That last one is not hypothetical here: this codebase has already shipped a
 * $199 course charged as INR 199. The currency tests below exist because of it.
 */

const base = (p: Partial<ForecastInputs> = {}): ForecastInputs => ({
  scheduled: [
    { ratio: '1:1', rate: 250, bonus: 0 },
    { ratio: '1:1', rate: 250, bonus: 0 },
    { ratio: '1:4', rate: 275, bonus: 25 },
  ],
  outstandingCredits: 40,
  pricePerCreditUsd: 10,
  recentMonthlyExpenses: [12000, 8000],
  learnersNeedingRenewal: 3,
  typicalRenewalCredits: 12,
  usdToInr: null,
  ...p,
});

describe('committed figures are arithmetic, not forecasts', () => {
  test('teacher cost is the scheduled classes times their rates', () => {
    const f = buildForecast(base());
    const payouts = f.committed.find((l) => l.label === 'Teacher payouts')!;
    assert.equal(payouts.value.amount, 800, '250 + 250 + 275 + 25 bonus');
    assert.equal(payouts.value.currency, 'INR');
  });

  test('deferred revenue is credits already paid for', () => {
    const f = buildForecast(base());
    const deferred = f.committed.find((l) => l.label === 'Deferred revenue')!;
    assert.equal(deferred.value.amount, 400, '40 credits at $10');
    assert.equal(deferred.value.currency, 'USD');
  });

  test('every line explains where it came from', () => {
    const f = buildForecast(base());
    for (const line of [...f.committed, ...f.projected]) {
      assert.ok(line.basis.length > 20, `${line.label} must state its basis`);
    }
  });

  test('renewals are projected, never committed', () => {
    // The distinction §68 is actually about: money that might arrive must not
    // sit in the same list as money already received.
    const f = buildForecast(base());
    assert.ok(f.projected.some((l) => l.label === 'Expected renewals'));
    assert.ok(!f.committed.some((l) => l.label === 'Expected renewals'));
  });

  test('the renewal assumption is stated as the upper bound it is', () => {
    const f = buildForecast(base());
    const renewals = f.projected.find((l) => l.label === 'Expected renewals')!;
    assert.match(renewals.basis, /every one renews|upper bound/i);
  });
});

describe('currency is never quietly mixed', () => {
  test('with no exchange rate there is no profit number, and it says why', () => {
    const f = buildForecast(base({ usdToInr: null }));
    assert.equal(f.profitability, null, 'no number at all');
    assert.match(f.profitabilityUnavailable!, /exchange rate/i);
    assert.match(f.profitabilityUnavailable!, /usd_to_inr/, 'and says how to fix it');
  });

  test('with a rate, profit is computed and labelled as converted', () => {
    const f = buildForecast(base({ usdToInr: 83 }));
    assert.ok(f.profitability, 'a rate makes it computable');
    assert.equal(f.profitability!.value.currency, 'INR');
    assert.match(f.profitability!.basis, /83/, 'the rate used is stated');
  });

  test('profit maths uses the rate rather than treating $1 as ₹1', () => {
    // The defect this guards: revenue 400 + 360 = $760. At ₹83 that is
    // ₹63,080, minus ₹800 payouts and ₹10,000 average expenses.
    const f = buildForecast(base({ usdToInr: 83 }));
    assert.equal(f.profitability!.value.amount, Math.round(760 * 83 - 800 - 10000));
  });

  test('an unpriced credit blocks profit rather than valuing it at zero', () => {
    const f = buildForecast(base({ usdToInr: 83, pricePerCreditUsd: null }));
    assert.equal(f.profitability, null);
    assert.match(f.profitabilityUnavailable!, /price per credit/i);
  });
});

describe('empty and new-company cases', () => {
  test('no expense history projects nothing and says so', () => {
    const f = buildForecast(base({ recentMonthlyExpenses: [] }));
    const expenses = f.projected.find((l) => l.label === 'Expenses')!;
    assert.equal(expenses.value.amount, 0);
    assert.match(expenses.basis, /nothing to project from/i);
  });

  test('nothing scheduled means a zero payout, not a crash', () => {
    const f = buildForecast(base({ scheduled: [] }));
    assert.equal(f.committed.find((l) => l.label === 'Teacher payouts')!.value.amount, 0);
  });

  test('unsold credits produce no deferred revenue line at all', () => {
    const f = buildForecast(base({ outstandingCredits: 0 }));
    assert.ok(!f.committed.some((l) => l.label === 'Deferred revenue'));
  });
});

describe('formatting', () => {
  test('rupees group the Indian way, dollars the American way', () => {
    assert.equal(formatMoney({ amount: 120000, currency: 'INR' }), '₹1,20,000');
    assert.equal(formatMoney({ amount: 120000, currency: 'USD' }), '$120,000');
  });
});
