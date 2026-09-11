import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { previewSettlement, settleableRequests, isBeforeStart, monthLabel, type PayoutRequest } from './payout';

/**
 * SARIRO — the settlement-preview tests
 * ============================================================================
 * This preview must agree with settle_seller_month() in the database, or a
 * seller is shown one figure and paid another. Every rule that function
 * applies is pinned here, and each test says which one.
 */

const req = (over: Partial<PayoutRequest> = {}): PayoutRequest => ({
  id: Math.random().toString(36).slice(2),
  kind: 'tier',
  month_key: '2026-09',
  amount: 5000,
  status: 'approved',
  settlement_id: null,
  ...over,
});

describe('what a settlement takes', () => {
  test('base pay alone, when nothing has been approved', () => {
    const p = previewSettlement({ month: '2026-09', base: 10000, requests: [] });
    assert.deepEqual(
      { base: p.base, incentives: p.incentives, total: p.total },
      { base: 10000, incentives: 0, total: 10000 }
    );
  });

  test('approved incentives are added to the base', () => {
    const p = previewSettlement({ month: '2026-09', base: 10000, requests: [req({ amount: 5000 }), req({ kind: 'manual', amount: 1500 })] });
    assert.equal(p.incentives, 6500);
    assert.equal(p.incentiveCount, 2);
    assert.equal(p.total, 16500);
  });

  test('pending is not money yet, and rejected never will be', () => {
    const p = previewSettlement({
      month: '2026-09', base: 10000,
      requests: [req({ status: 'pending' }), req({ status: 'rejected' })],
    });
    assert.equal(p.incentives, 0);
  });

  test('nothing already in a settlement is counted twice', () => {
    const p = previewSettlement({ month: '2026-09', base: 10000, requests: [req({ settlement_id: 'abc' })] });
    assert.equal(p.incentives, 0);
  });

  /* The straggler rule. HR approves an August incentive on 7 September, after
     August closed. It must ride on September's settlement, not vanish. */
  test('an earlier month’s approved incentive is picked up by the next settlement', () => {
    const p = previewSettlement({ month: '2026-09', base: 10000, requests: [req({ month_key: '2026-08', amount: 2000 })] });
    assert.equal(p.incentives, 2000);
  });

  test('a later month’s incentive waits for its own settlement', () => {
    const p = previewSettlement({ month: '2026-09', base: 10000, requests: [req({ month_key: '2026-10' })] });
    assert.equal(p.incentives, 0);
  });

  test('a malformed amount is skipped, not allowed to make the total NaN', () => {
    const p = previewSettlement({
      month: '2026-09', base: 10000,
      requests: [req({ amount: 'abc' }), req({ amount: null }), req({ amount: -50 }), req({ amount: 300 })],
    });
    assert.equal(p.incentives, 300);
    assert.ok(Number.isFinite(p.total));
  });

  test('the total is always base plus incentives and nothing else', () => {
    const p = previewSettlement({ month: '2026-09', base: 12000, requests: [req({ amount: 5000 }), req({ amount: 200 })] });
    assert.equal(p.total, p.base + p.incentives);
  });
});

describe('the start of seller payouts', () => {
  /* The first run of the schedule must not invent a backdated payroll entry
     for a month that was paid some other way. */
  test('a month before the start settles to nothing', () => {
    const p = previewSettlement({ month: '2026-08', base: 10000, requests: [req({ month_key: '2026-08' })], startMonth: '2026-09' });
    assert.equal(p.beforeStart, true);
    assert.equal(p.total, 0);
  });

  test('the start month itself is payable', () => {
    assert.equal(isBeforeStart('2026-09', '2026-09'), false);
  });

  test('a missing or malformed start means no cut-off, not "never pay"', () => {
    assert.equal(isBeforeStart('2020-01', null), false);
    assert.equal(isBeforeStart('2020-01', 'September'), false);
  });
});

describe('small things', () => {
  test('settleableRequests ignores a month key that is not YYYY-MM', () => {
    assert.equal(settleableRequests([req({ month_key: 'Sept' })], '2026-09').length, 0);
  });

  test('month labels read like a person wrote them', () => {
    assert.equal(monthLabel('2026-09'), 'September 2026');
    assert.equal(monthLabel('2026-12'), 'December 2026');
  });
});
