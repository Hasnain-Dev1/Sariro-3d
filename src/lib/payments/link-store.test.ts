import { test } from 'node:test';
import assert from 'node:assert/strict';
import { autopaysForAccount, isLiveAutopay, matchesCreator, rowFromRazorpayLink, rowFromSubscription, toView, type Creator, type LinkRow } from './link-store';

const SELLER = '11111111-1111-4111-8111-111111111111';
const creators = new Map<string, Creator>([[SELLER, { id: SELLER, name: 'Asha Seller', email: 'asha@sariro.com', phone: '+91 98300 12345', role: 'seller' }]]);

const row = (over: Partial<LinkRow> = {}): LinkRow => ({
  id: 'r1', kind: 'autopay', razorpay_id: 'sub_ABC', razorpay_plan_id: 'plan_X', short_url: 'https://rzp.io/i/sub', status: 'active',
  amount_inr: '3000.00', frequency: 'monthly', total_count: 12, paid_count: 2, amount_paid_inr: '0',
  ratio: '1:4', months: 1, description: 'Sariro — small batch (1:4) — autopay, monthly, 12 payments',
  customer_name: 'Priya Sharma', customer_phone: '+919876543210', customer_email: 'Priya@Example.com', lead_id: null,
  below_floor: false, created_by: SELLER, created_by_role: 'seller', created_at: '2026-09-17T10:00:00.000Z',
  cancelled_at: null, cancelled_by: null, ...over,
});

test('the list shows an autopay’s terms, what it adds up to, and who made it', () => {
  const v = toView(row(), creators, SELLER);
  assert.equal(v.amount, 3000);
  assert.equal(v.total, 36000);
  assert.equal(v.amountPaid, 6000, 'two payments taken');
  assert.equal(v.frequencyLabel, 'Monthly');
  assert.equal(v.createdBy?.email, 'asha@sariro.com');
  assert.equal(v.mine, true);
  assert.equal(v.cancellable, true);
  const once = toView(row({ kind: 'one_time', frequency: null, total_count: null, amount_inr: 7999, amount_paid_inr: 7999, status: 'paid' }), creators, 'someone-else');
  assert.equal(once.total, 7999);
  assert.equal(once.frequency, null);
  assert.equal(once.cancellable, false, 'only an autopay has anything to end');
  assert.equal(once.mine, false);
});

test('an autopay that can still charge is live; one that has ended is not', () => {
  for (const s of ['created', 'authenticated', 'active', 'pending', 'halted', 'paused']) assert.equal(isLiveAutopay({ kind: 'autopay', status: s }), true, s);
  for (const s of ['cancelled', 'completed', 'expired']) assert.equal(isLiveAutopay({ kind: 'autopay', status: s }), false, s);
});

test('search finds the creator by email, name, or phone however it is typed', () => {
  const v = toView(row(), creators, 'x');
  assert.equal(matchesCreator(v, ''), true);
  assert.equal(matchesCreator(v, 'ASHA@sariro'), true);
  assert.equal(matchesCreator(v, 'asha seller'), true);
  assert.equal(matchesCreator(v, '98300 12345'), true);
  assert.equal(matchesCreator(v, '+91-98300'), true);
  assert.equal(matchesCreator(v, '99999'), false);
  assert.equal(matchesCreator(v, 'priya'), false, 'the search is for who made it, not the family');
  assert.equal(matchesCreator(toView(row({ created_by: null }), creators, 'x'), 'asha'), false);
});

test('a student sees only live autopays made for their own email or phone', () => {
  const rows = [
    row({ id: 'mine-email' }),
    row({ id: 'mine-phone', customer_email: null, customer_phone: '+91 98765 43210' }),
    row({ id: 'ended', status: 'cancelled' }),
    row({ id: 'one-time', kind: 'one_time', frequency: null, total_count: null }),
    row({ id: 'someone-else', customer_email: 'other@example.com', customer_phone: '+919000000000' }),
  ];
  const found = autopaysForAccount(rows, { email: 'priya@example.com ', phone: '9876543210' }).map((r) => r.id);
  assert.deepEqual(found, ['mine-email', 'mine-phone']);
  assert.deepEqual(autopaysForAccount(rows, { email: null, phone: null }), []);
});

test('links made before the table existed are recovered from Razorpay with their creator', () => {
  const r = rowFromRazorpayLink({
    id: 'plink_1', url: 'https://rzp.io/i/x', status: 'paid', amount: 7999, paid: 7999, description: 'd',
    customerName: 'Priya', createdAt: 1_758_000_000, createdBy: SELLER, leadId: 'not-a-uuid', notes: { ratio: '1:4', months: '3', below_floor: 'yes' },
  });
  assert.equal(r.kind, 'one_time');
  assert.equal(r.created_by, SELLER);
  assert.equal(r.lead_id, null, 'a malformed lead id is dropped, not written');
  assert.equal(r.below_floor, true);
  assert.equal(r.paid_count, 1);
});

test('an autopay is recovered from its notes, and skipped when the notes do not say what it charges', () => {
  const base = { id: 'sub_1', planId: 'plan_1', url: 'https://rzp.io/i/s', status: 'active', totalCount: 12, paidCount: 3, createdAt: 1_758_000_000 };
  const r = rowFromSubscription({ ...base, notes: { amount_inr: '2500', frequency: 'monthly', created_by: SELLER, customer_name: 'Priya', customer_phone: '+919876543210' } });
  assert.ok(r);
  assert.equal(r.amount_inr, 2500);
  assert.equal(r.amount_paid_inr, 7500);
  assert.equal(r.frequency, 'monthly');
  assert.equal(rowFromSubscription({ ...base, notes: { frequency: 'monthly' } }), null);
  assert.equal(rowFromSubscription({ ...base, notes: { amount_inr: '2500', frequency: 'fortnightly' } }), null);
});
