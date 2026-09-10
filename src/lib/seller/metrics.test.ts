import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sellerMetrics, pct, type MetricLead, type MetricSale } from './metrics';

/**
 * SARIRO — the seller metric tests
 * ============================================================================
 * The trap these exist for: counting a trial from the lead's CURRENT stage.
 * A family who booked a trial, attended and bought is sitting on `enrolled`,
 * so a naive count says they never had a trial — and the conversion rate then
 * divides by a smaller number every time somebody converts, making a seller's
 * rate climb as they sell less.
 */

const NOW = Date.parse('2026-09-10T09:00:00Z'); // 14:30 IST, 10 Sep 2026

const lead = (over: Partial<MetricLead> = {}): MetricLead => ({
  id: Math.random().toString(36).slice(2),
  created_at: '2026-09-05T00:00:00Z',
  ...over,
});

const sale = (over: Partial<MetricSale> = {}): MetricSale => ({
  id: Math.random().toString(36).slice(2),
  amount: 3250,
  punched_at: '2026-09-06T00:00:00Z',
  ...over,
});

describe('a trial is counted from what the lead has been through', () => {
  test('a family who converted still counts as a trial booked AND completed', () => {
    const m = sellerMetrics([lead({ stage: 'enrolled', trial_status: 'attended' })], [], NOW);
    assert.equal(m.month.trialsBooked, 1);
    assert.equal(m.month.trialsCompleted, 1);
  });

  test('a booking id is enough on its own', () => {
    const m = sellerMetrics([lead({ stage: 'seller_assigned', booking_id: 'b1' })], [], NOW);
    assert.equal(m.month.trialsBooked, 1);
  });

  test('a no-show booked a trial but did not complete one', () => {
    const m = sellerMetrics([lead({ stage: 'gathering_booked', trial_status: 'no_show' })], [], NOW);
    assert.equal(m.month.trialsBooked, 1);
    assert.equal(m.month.trialsCompleted, 0);
  });

  /* The family who asked for a time and got none never had a class booked.
     Counting them would depress the completion rate for a failure of supply. */
  test('slot assistance is not a booked trial', () => {
    const m = sellerMetrics([lead({ stage: 'seller_assigned', trial_status: 'slot_assistance' })], [], NOW);
    assert.equal(m.month.trialsBooked, 0);
    assert.equal(m.month.trialsCompleted, 0);
  });

  test('a no-show who later enrolled is still not a completed trial', () => {
    const m = sellerMetrics([lead({ stage: 'enrolled', trial_status: 'no_show' })], [], NOW);
    assert.equal(m.month.trialsBooked, 1);
    assert.equal(m.month.trialsCompleted, 0);
  });

  test('a brand new lead has booked nothing', () => {
    const m = sellerMetrics([lead({ stage: 'new' })], [], NOW);
    assert.equal(m.month.leadsReceived, 1);
    assert.equal(m.month.trialsBooked, 0);
  });
});

describe('the rates', () => {
  test('conversion is sales over trials booked', () => {
    const leads = [
      lead({ stage: 'enrolled', trial_status: 'attended' }),
      lead({ stage: 'final', trial_status: 'attended' }),
      lead({ stage: 'trial_booked', trial_status: 'booked' }),
      lead({ stage: 'gathering_booked', trial_status: 'no_show' }),
    ];
    const m = sellerMetrics(leads, [sale()], NOW);
    assert.equal(m.month.trialsBooked, 4);
    assert.equal(m.month.sales, 1);
    assert.equal(m.month.conversionRate, 25);
  });

  test('completion is completed over booked', () => {
    const leads = [
      lead({ stage: 'final', trial_status: 'attended' }),
      lead({ stage: 'gathering_booked', trial_status: 'no_show' }),
    ];
    assert.equal(sellerMetrics(leads, [], NOW).month.trialCompletionRate, 50);
  });

  /* Null, not zero. A new joiner with no trials has an UNKNOWN rate, and
     showing 0% puts them bottom of a leaderboard for having done nothing. */
  test('no trials means an unknown rate, not a zero one', () => {
    const m = sellerMetrics([lead({ stage: 'new' })], [], NOW);
    assert.equal(m.month.conversionRate, null);
    assert.equal(m.month.trialCompletionRate, null);
    assert.equal(pct(null), '—');
    assert.equal(pct(25), '25%');
  });

  test('rates are given to one decimal place, not sixteen', () => {
    const leads = Array.from({ length: 3 }, () => lead({ stage: 'trial_booked', trial_status: 'booked' }));
    assert.equal(sellerMetrics(leads, [sale()], NOW).month.conversionRate, 33.3);
  });
});

describe('refunds', () => {
  test('a refunded sale is not a sale', () => {
    const m = sellerMetrics(
      [lead({ stage: 'enrolled', trial_status: 'attended' })],
      [sale({ refunded_at: '2026-09-08T00:00:00Z' })],
      NOW
    );
    assert.equal(m.month.sales, 0);
    assert.equal(m.month.revenue, 0);
    assert.equal(m.month.conversionRate, 0);
  });
});

describe('the three windows disagree on purpose', () => {
  test('a sale from last month is lifetime but not this month', () => {
    const leads = [lead({ created_at: '2026-08-15T00:00:00Z', stage: 'enrolled', trial_status: 'attended' })];
    const sales = [sale({ punched_at: '2026-08-20T00:00:00Z' })];
    const m = sellerMetrics(leads, sales, NOW);
    assert.equal(m.month.sales, 0);
    assert.equal(m.lifetime.sales, 1);
    /* 20 Aug is within 30 days of 10 Sep, so it IS in the rolling window —
       which is exactly why both windows exist. */
    assert.equal(m.last30.sales, 1);
  });

  test('something from six months ago is lifetime only', () => {
    const m = sellerMetrics(
      [lead({ created_at: '2026-03-01T00:00:00Z' })],
      [sale({ punched_at: '2026-03-02T00:00:00Z' })],
      NOW
    );
    assert.equal(m.last30.sales, 0);
    assert.equal(m.month.sales, 0);
    assert.equal(m.lifetime.sales, 1);
  });

  test('the month key is the Indian month, not the UTC one', () => {
    /* 2026-09-30T19:00Z is 00:30 on 1 October in Kolkata. A UTC month says
       September and pays the incentive against the wrong target. */
    const m = sellerMetrics([], [], Date.parse('2026-09-30T19:00:00Z'));
    assert.equal(m.monthKey, '2026-10');
  });
});

describe('an unpunched sale is a draft', () => {
  test('it is counted nowhere, not even lifetime', () => {
    const m = sellerMetrics(
      [lead({ stage: 'final', trial_status: 'attended' })],
      [sale({ punched_at: null })],
      NOW
    );
    assert.equal(m.month.sales, 0);
    assert.equal(m.lifetime.sales, 0);
    assert.equal(m.month.conversionRate, 0);
  });
});

describe('junk input', () => {
  test('empty everything is zeroes and dashes, not NaN', () => {
    const m = sellerMetrics([], [], NOW);
    assert.equal(m.lifetime.leadsReceived, 0);
    assert.equal(m.lifetime.revenue, 0);
    assert.equal(m.lifetime.conversionRate, null);
  });

  test('an undated lead does not land in a window it cannot be in', () => {
    const m = sellerMetrics([lead({ created_at: null })], [], NOW);
    assert.equal(m.month.leadsReceived, 0);
    assert.equal(m.lifetime.leadsReceived, 1);
  });

  test('a malformed amount does not poison the revenue', () => {
    const m = sellerMetrics([], [sale({ amount: null }), sale({ amount: 1000 })], NOW);
    assert.equal(m.month.revenue, 1000);
  });
});
