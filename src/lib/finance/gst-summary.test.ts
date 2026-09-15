import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { gstCsv, gstInside, gstSummary, isValidGstin, splitTax, type GstExpense, type GstInvoice } from './gst-summary';

const inv = (over: Partial<GstInvoice>): GstInvoice => ({
  invoice_number: 'SR2627-0001-AAAA', invoice_date: '2026-09-10', customer_name: 'A Family', customer_state: 'Maharashtra',
  taxable: 10_000, total_tax: 1_800, total: 11_800, tax_treatment: 'inter_state', currency_code: 'INR', ...over,
});
const exp = (over: Partial<GstExpense>): GstExpense => ({
  id: 'e1', spent_on: '2026-09-05', title: 'Zoom', vendor: 'Zoom', amount: 1_180, gst_amount: 180, itc_claimable: true, status: 'approved', ...over,
});
const september = (ymd: string | null | undefined) => (ymd ?? '').startsWith('2026-09');

describe('output GST — the invoices we issue', () => {
  test('inter-state is IGST; intra-state is CGST + SGST, and the halves add back', () => {
    assert.deepEqual(splitTax(1_800, 'inter_state'), { cgst: 0, sgst: 0, igst: 1_800 });
    assert.deepEqual(splitTax(1_800, 'intra_state'), { cgst: 900, sgst: 900, igst: 0 });
    const odd = splitTax(15.27, 'intra_state');
    assert.equal(Math.round((odd.cgst + odd.sgst) * 100), 1527);
  });

  test('a month of invoices adds up by head', () => {
    const s = gstSummary({
      invoices: [inv({}), inv({ invoice_number: 'B', tax_treatment: 'intra_state' }), inv({ invoice_number: 'C', invoice_date: '2026-08-31' })],
      refunds: [], expenses: [], inPeriod: september,
    });
    assert.equal(s.output.invoices, 2);
    assert.equal(s.output.total, 3_600);
    assert.equal(s.output.igst, 1_800);
    assert.equal(s.output.cgst, 900);
    assert.equal(s.output.taxable, 20_000);
  });

  test('exports and GST-free Indian invoices are listed, never taxed', () => {
    const s = gstSummary({
      invoices: [inv({ invoice_number: 'X', tax_treatment: 'export', total_tax: 0, total: 300, currency_code: 'USD' }),
        inv({ invoice_number: 'N', tax_treatment: 'no_gst', total_tax: 0, total: 5_000 })],
      refunds: [], expenses: [], inPeriod: september,
    });
    assert.equal(s.output.total, 0);
    assert.deepEqual(s.exports.byCurrency, [{ currency: 'USD', value: 300 }]);
    assert.deepEqual(s.noGstInIndia, { invoices: 1, value: 5_000 });
  });
});

describe('a refund reverses its share of the tax', () => {
  test('half refunded this month on last month’s invoice', () => {
    const august = inv({ invoice_date: '2026-08-20' });
    const s = gstSummary({
      invoices: [august], allInvoices: [august],
      refunds: [{ invoice_number: august.invoice_number, refunded_at: '2026-09-02T10:00:00Z', refund_amount: 5_900 }],
      expenses: [], inPeriod: september,
    });
    assert.equal(s.output.total, 0, 'the invoice is August’s');
    assert.equal(s.creditNotes.total, 900);
    assert.equal(s.outputNet, -900);
  });
});

describe('input GST — what we paid and can claim back', () => {
  test('approved, claimable bills count; pending and blocked ones do not', () => {
    const s = gstSummary({
      invoices: [inv({})], refunds: [],
      expenses: [exp({}), exp({ id: 'p', status: 'pending' }), exp({ id: 'b', itc_claimable: false, gst_amount: 90 }), exp({ id: 'z', gst_amount: 0 })],
      inPeriod: september,
    });
    assert.equal(s.input.total, 180);
    assert.equal(s.input.bills, 1);
    assert.deepEqual(s.notClaimable, { total: 90, bills: 1 });
    assert.equal(s.net, 1_620, '1,800 output less 180 input');
  });

  test('more input than output is credit carried forward — a negative net', () => {
    const s = gstSummary({ invoices: [], refunds: [], expenses: [exp({ gst_amount: 500, amount: 3_278 })], inPeriod: september });
    assert.equal(s.net, -500);
  });

  test('GST inside an inclusive bill, and the GSTIN shape', () => {
    assert.equal(gstInside(1_180, 18), 180);
    assert.equal(gstInside(1_050, 5), 50);
    assert.equal(gstInside(100, 0), 0);
    assert.equal(isValidGstin('19ABCDE1234F1Z5'), true);
    assert.equal(isValidGstin('19abcde1234f1z5'), true, 'lower case is read as upper');
    assert.equal(isValidGstin('NOTAGSTIN'), false);
  });
});

test('the accountant’s file carries every line, with refunds negative', () => {
  const csv = gstCsv({
    invoices: [inv({ tax_treatment: 'intra_state' })],
    refunds: [{ invoice_number: 'SR2627-0001-AAAA', refunded_at: '2026-09-12', refund_amount: 11_800 }],
    expenses: [exp({ vendor_gstin: '19ABCDE1234F1Z5', bill_number: 'INV-77' })],
    inPeriod: september,
  });
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 4);
  assert.match(lines[1], /^Output — invoice,2026-09-10,SR2627-0001-AAAA,.*,10000\.00,900\.00,900\.00,0\.00,1800\.00,11800\.00$/);
  assert.match(lines[2], /Less — refund/);
  assert.match(lines[2], /-1800\.00,-11800\.00$/);
  assert.match(lines[3], /^Input — expense,2026-09-05,INV-77,Zoom,19ABCDE1234F1Z5,1000\.00,,,,180\.00,1180\.00$/);
});
