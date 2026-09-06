import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileInvoices, GRACE_HOURS, type IssuedInvoice } from './invoice-reconciliation';

/**
 * SARIRO — money that was billed and never booked
 * =========================================================
 * A sale can only be recorded from an invoice, which is what makes the ledger
 * trustworthy. This closes the other direction: an invoice issued, the customer
 * billed, the money possibly arrived, and the books never told.
 *
 * The number this produces is one somebody acts on, so the arithmetic is
 * checked rather than trusted.
 */

const HOUR = 3_600_000;
const NOW = Date.parse('2026-09-06T12:00:00Z');

const invoice = (number: string, hoursAgo: number, over: Partial<IssuedInvoice> = {}): IssuedInvoice => ({
  invoice_number: number,
  customer_name: 'Anaya Sharma',
  customer_email: 'parent@example.com',
  course_name: 'Public Speaking',
  total: 11800,
  currency_symbol: '₹',
  invoice_date: '2026-09-05',
  created_at: new Date(NOW - hoursAgo * HOUR).toISOString(),
  payment_status: 'Paid',
  ...over,
});

describe('counting what reached the books', () => {
  test('an invoice in the ledger is recorded and does not appear as pending', () => {
    const r = reconcileInvoices([invoice('A', 48)], ['A'], NOW);
    assert.equal(r.issued, 1);
    assert.equal(r.recorded, 1);
    assert.equal(r.pending.length, 0);
    assert.equal(r.overdue, 0);
  });

  test('an invoice issued this morning is waiting, not overdue', () => {
    const r = reconcileInvoices([invoice('A', 3)], [], NOW);
    assert.equal(r.waiting, 1);
    assert.equal(r.overdue, 0);
    assert.equal(r.pending[0].overdue, false);
    assert.equal(r.pending[0].ageHours, 3);
  });

  test('an invoice from two days ago with no sale is overdue', () => {
    const r = reconcileInvoices([invoice('A', 48)], [], NOW);
    assert.equal(r.overdue, 1);
    assert.equal(r.pending[0].ageHours, 48);
  });

  /** The handover between HR and a seller is allowed a day. */
  test('exactly at the grace period it becomes overdue', () => {
    assert.equal(reconcileInvoices([invoice('A', GRACE_HOURS - 1)], [], NOW).overdue, 0);
    assert.equal(reconcileInvoices([invoice('A', GRACE_HOURS)], [], NOW).overdue, 1);
  });

  test('the totals always add up', () => {
    const r = reconcileInvoices(
      [invoice('A', 2), invoice('B', 30), invoice('C', 90), invoice('D', 1)],
      ['A'],
      NOW
    );
    assert.equal(r.issued, 4);
    assert.equal(r.recorded + r.pending.length, r.issued);
    assert.equal(r.waiting + r.overdue, r.pending.length);
  });
});

describe('the list is a work queue', () => {
  test('overdue above waiting, oldest first within each', () => {
    const r = reconcileInvoices(
      [invoice('recent', 1), invoice('old', 100), invoice('medium', 30), invoice('today', 5)],
      [],
      NOW
    );
    assert.deepEqual(r.pending.map((p) => p.invoice_number), ['old', 'medium', 'today', 'recent']);
    assert.deepEqual(r.pending.map((p) => p.overdue), [true, true, false, false]);
  });

  test('the customer name travels with it — HR needs to know who to chase', () => {
    const r = reconcileInvoices([invoice('A', 48, { customer_name: 'Mehul Rakhecha' })], [], NOW);
    assert.equal(r.pending[0].customer_name, 'Mehul Rakhecha');
    assert.equal(r.pending[0].total, 11800);
  });
});

describe('the awkward inputs', () => {
  test('no invoices at all is not an alarm', () => {
    const r = reconcileInvoices([], [], NOW);
    assert.deepEqual([r.issued, r.recorded, r.waiting, r.overdue], [0, 0, 0, 0]);
  });

  test('a sale whose invoice is outside the window does not go negative', () => {
    // The ledger can hold a sale for an invoice older than the page we fetched.
    const r = reconcileInvoices([invoice('A', 5)], ['A', 'B', 'C'], NOW);
    assert.equal(r.recorded, 1);
    assert.equal(r.pending.length, 0);
  });

  /**
   * A row with a broken timestamp must not scream "issued in 1970, overdue by
   * fifty years" at somebody. Treated as just issued; it ages into the list on
   * its own if it is real.
   */
  test('an unparseable timestamp is treated as new rather than ancient', () => {
    const r = reconcileInvoices([invoice('A', 0, { created_at: 'not a date' })], [], NOW);
    assert.equal(r.pending[0].ageHours, 0);
    assert.equal(r.pending[0].overdue, false);
  });

  test('a timestamp in the future does not produce a negative age', () => {
    const r = reconcileInvoices([invoice('A', -5)], [], NOW);
    assert.equal(r.pending[0].ageHours, 0);
    assert.equal(r.pending[0].overdue, false);
  });

  test('the grace period can be tightened for a test or a policy change', () => {
    assert.equal(reconcileInvoices([invoice('A', 3)], [], NOW, 2).overdue, 1);
  });
});
