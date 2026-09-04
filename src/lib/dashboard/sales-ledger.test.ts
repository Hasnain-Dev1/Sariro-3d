import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { salesToCsv, netOf, realisedOf, type SaleWithNames } from './sales-ledger';

/**
 * SARIRO — the report a super-admin hands the accountant
 * =========================================================
 * A CSV whose header and rows disagree by one column is not a broken file —
 * it is a file that opens, looks right, and puts the tax under "refunded".
 * That is the failure these tests exist to catch.
 */

const sale = (over: Partial<SaleWithNames> = {}): SaleWithNames => ({
  invoice_number: 'SR2627-0042-K7XQ',
  invoice_id: 'i1',
  student_name: 'Anaya Sharma',
  student_email: 'parent@example.com',
  course_name: 'Python — Beginner',
  country: 'India',
  state: 'West Bengal',
  amount: 11800,
  currency_code: 'INR',
  currency_symbol: '₹',
  gst_included: true,
  taxable: 10000,
  total_tax: 1800,
  payment_type: 'full',
  sale_type: 'new',
  transaction_id: 'pay_LKJ8821',
  course_total: null,
  gateway_fee: 278.48,
  net_received: 11521.52,
  sold_on: '2026-08-04',
  seller_id: 's1',
  recorded_by: 'h1',
  notes: null,
  refunded_at: null,
  refund_amount: null,
  refund_reason: null,
  created_at: '2026-08-04T10:00:00Z',
  seller_name: 'Rhea Das',
  recorded_by_name: 'HR',
  ...over,
});

describe('the downloadable report', () => {
  test('every row has exactly as many fields as the header', () => {
    const csv = salesToCsv([sale(), sale({ invoice_number: 'SR2627-0043-YFV8' })]);
    const [header, ...rows] = csv.split('\r\n');
    const width = header.split(',').length;
    for (const row of rows) assert.equal(row.split(',').length, width);
  });

  test('an installment reports what it is part of, so it is not read as the whole sale', () => {
    const csv = salesToCsv([sale({ payment_type: 'installment', amount: 12000, course_total: 36000 })]);
    const cells = csv.split('\r\n')[1].split(',');
    const header = csv.split('\r\n')[0].split(',');
    assert.equal(cells[header.indexOf('Payment')], 'Installment');
    assert.equal(cells[header.indexOf('Course total')], '36000.00');
    assert.equal(cells[header.indexOf('Amount')], '12000.00');
  });

  test('a renewal is labelled, because it did not come through a trial', () => {
    const csv = salesToCsv([sale({ sale_type: 'renewal' })]);
    const header = csv.split('\r\n')[0].split(',');
    assert.equal(csv.split('\r\n')[1].split(',')[header.indexOf('Business')], 'Renewal');
  });

  test('the transaction id travels with the sale', () => {
    const csv = salesToCsv([sale()]);
    assert.ok(csv.includes('pay_LKJ8821'));
  });

  test('a name with a comma does not shift the columns after it', () => {
    const csv = salesToCsv([sale({ student_name: 'Sharma, Anaya' })]);
    assert.ok(csv.includes('"Sharma, Anaya"'));
  });

  test('net is the amount less any refund, never a second row', () => {
    assert.equal(netOf(sale()), 11800);
    assert.equal(netOf(sale({ refund_amount: 5000, refunded_at: '2026-08-20T00:00:00Z' })), 6800);
  });
});

describe('revenue and money in the bank are different facts', () => {
  test('realised is the amount less the gateway cut', () => {
    assert.equal(netOf(sale()), 11800);
    assert.equal(realisedOf(sale()), 11521.52);
  });

  test('a refund does not give the gateway fee back', () => {
    // The processor keeps its cut on the original capture, so a full refund
    // leaves the company down by the fee rather than square.
    const refunded = sale({ refund_amount: 11800, refunded_at: '2026-08-20T00:00:00Z' });
    assert.equal(netOf(refunded), 0);
    assert.equal(realisedOf(refunded), -278.48);
  });

  test('a sale taken by bank transfer realises the whole amount', () => {
    const direct = sale({ gateway_fee: 0, net_received: 11800 });
    assert.equal(realisedOf(direct), 11800);
  });

  test('a row from before fees were recorded falls back to the amount', () => {
    const old = sale({ gateway_fee: 0, net_received: null });
    assert.equal(realisedOf(old), 11800);
  });

  test('the fee and what landed are both columns in the report', () => {
    const csv = salesToCsv([sale()]);
    const header = csv.split('\r\n')[0].split(',');
    const cells = csv.split('\r\n')[1].split(',');
    assert.equal(cells[header.indexOf('Gateway fee')], '278.48');
    assert.equal(cells[header.indexOf('Net received')], '11521.52');
    assert.equal(cells[header.indexOf('Realised')], '11521.52');
  });
});
