import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFilters, describeFilters, summarise, outstandingPlans, dueOnSale, enrolmentKey,
  NO_FILTERS, type LedgerSale,
} from './sales-report';

/* The four sales in the live ledger on 13 Sep 2026, exactly as they are. The
   report was blank for all of them, because it read the lead instead. */
const base = {
  student_email: null, currency_code: 'INR', currency_symbol: '₹', gateway_fee: 0,
  net_received: null, total_tax: 0, refund_amount: null, refunded_at: null, course_total: null,
} as const;

const LIVE: LedgerSale[] = [
  { ...base, invoice_number: 'SARIRO-INV-2026-0001', student_name: 'Mehul Rakhecha', course_name: 'Agent Architecture',
    amount: 3250, gst_included: false, payment_type: 'full', sale_type: 'new', net_received: 3250, sold_on: '2026-09-04' },
  { ...base, invoice_number: 'SR2627-0002-AZTK', student_name: 'Angshu Patra', course_name: 'Public speaking',
    amount: 100, gst_included: true, payment_type: 'installment', sale_type: 'new', course_total: 300,
    net_received: 100, total_tax: 15.25, refund_amount: 100, refunded_at: '2026-09-13T10:00:00Z', sold_on: '2026-09-13' },
  { ...base, invoice_number: 'SR2627-0003-LF5H', student_name: 'Isha patra', course_name: 'Python',
    amount: 500, gst_included: true, payment_type: 'installment', sale_type: 'new', course_total: 1000,
    net_received: 500, total_tax: 76.27, refund_amount: 500, refunded_at: '2026-09-13T10:05:00Z', sold_on: '2026-09-13' },
  { ...base, invoice_number: 'SR2627-0004-KRBP', student_name: 'Mimo Test', course_name: 'Web Development Beginner',
    amount: 100, gst_included: true, payment_type: 'full', sale_type: 'renewal', gateway_fee: 2.36,
    net_received: 97.64, total_tax: 15.25, sold_on: '2026-09-13' },
];

describe('the filters the founder asked for', () => {
  test('renewals only', () => {
    assert.deepEqual(applyFilters(LIVE, { ...NO_FILTERS, saleType: 'renewal' }).map((s) => s.invoice_number), ['SR2627-0004-KRBP']);
  });

  test('new sales only', () => {
    assert.equal(applyFilters(LIVE, { ...NO_FILTERS, saleType: 'new' }).length, 3);
  });

  test('refunded, and not refunded', () => {
    assert.equal(applyFilters(LIVE, { ...NO_FILTERS, refund: 'refunded' }).length, 2);
    assert.equal(applyFilters(LIVE, { ...NO_FILTERS, refund: 'not_refunded' }).length, 2);
  });

  test('GST opted, and GST not opted', () => {
    assert.equal(applyFilters(LIVE, { ...NO_FILTERS, gst: 'opted' }).length, 3);
    assert.deepEqual(applyFilters(LIVE, { ...NO_FILTERS, gst: 'not_opted' }).map((s) => s.invoice_number), ['SARIRO-INV-2026-0001']);
  });

  test('installments, and full payments', () => {
    assert.equal(applyFilters(LIVE, { ...NO_FILTERS, payment: 'installment' }).length, 2);
    assert.equal(applyFilters(LIVE, { ...NO_FILTERS, payment: 'full' }).length, 2);
  });

  test('filters combine', () => {
    const rows = applyFilters(LIVE, { saleType: 'new', refund: 'not_refunded', gst: 'not_opted', payment: 'full' });
    assert.deepEqual(rows.map((s) => s.invoice_number), ['SARIRO-INV-2026-0001']);
  });

  test('no filter means everything, said in words', () => {
    assert.equal(applyFilters(LIVE, NO_FILTERS).length, 4);
    assert.equal(describeFilters(NO_FILTERS), 'all sales');
    assert.equal(describeFilters({ saleType: 'renewal', refund: 'all', gst: 'opted', payment: 'all' }), 'renewals, GST opted');
  });
});

describe('the five figures, on the real ledger', () => {
  const [inr] = summarise(LIVE);

  test('counts every kind of sale', () => {
    assert.equal(inr.sales, 4);
    assert.equal(inr.newSales, 3);
    assert.equal(inr.renewals, 1);
    assert.equal(inr.refunds, 2);
    assert.equal(inr.gstOpted, 3);
    assert.equal(inr.gstNotOpted, 1);
  });

  test('collected is what was actually paid', () => {
    assert.equal(inr.collected, 3950);
  });

  test('refunded is its own figure, and net takes it off', () => {
    assert.equal(inr.refunded, 600);
    assert.equal(inr.net, 3350);
  });

  test('invoiced counts a plan’s whole course fee, once', () => {
    // 3250 full + 300 plan + 1000 plan + 100 renewal
    assert.equal(inr.invoiced, 4650);
  });

  test('a refunded plan owes nothing — nobody chases a refunded family', () => {
    assert.equal(inr.due, 0);
  });

  test('realised is what reached the bank, after the gateway and refunds', () => {
    assert.equal(inr.gatewayFees, 2.36);
    assert.equal(inr.realised, 3347.64);
  });

  test('tax collected is added up', () => {
    assert.equal(inr.tax, 106.77);
  });
});

describe('installment plans', () => {
  const plan = (invoice: string, amount: number, sold_on: string): LedgerSale => ({
    ...base, invoice_number: invoice, student_name: 'Aarav', student_email: 'aarav@x.com', course_name: 'Python',
    amount, gst_included: true, payment_type: 'installment', sale_type: 'new', course_total: 1000, sold_on,
  });
  const first = plan('INV-1', 400, '2026-08-10');
  const second = plan('INV-2', 300, '2026-09-10');

  test('what is still owed is the fee less every payment so far', () => {
    const plans = outstandingPlans([first, second]);
    assert.equal(plans.get(enrolmentKey(first))?.due, 300);
  });

  test('a report on one month still knows about the earlier payment', () => {
    // Only September's installment is in the range, but the plan owes 300, not 700.
    const [inr] = summarise([second], [first, second]);
    assert.equal(inr.due, 300);
    assert.equal(inr.invoiced, 1000, 'the fee is counted once, not per installment');
    assert.equal(inr.collected, 300, 'collected is only what came in during the range');
  });

  test('two installments in one report still count the fee once', () => {
    const [inr] = summarise([first, second]);
    assert.equal(inr.invoiced, 1000);
    assert.equal(inr.collected, 700);
  });

  test('each row can show what its plan still owes', () => {
    const plans = outstandingPlans([first, second]);
    assert.equal(dueOnSale(second, plans), 300);
    assert.equal(dueOnSale(LIVE[0], plans), 0, 'a full payment owes nothing');
  });

  test('a paid-off plan owes nothing, never a negative', () => {
    const plans = outstandingPlans([first, second, plan('INV-3', 500, '2026-10-10')]);
    assert.equal(plans.get(enrolmentKey(first))?.due, 0);
  });
});

test('currencies are never added together', () => {
  const usd: LedgerSale = { ...LIVE[0], invoice_number: 'US-1', currency_code: 'USD', currency_symbol: '$', amount: 50 };
  const out = summarise([...LIVE, usd]);
  assert.deepEqual(out.map((c) => c.currency), ['INR', 'USD'], 'INR first, then the rest');
  assert.equal(out[1].collected, 50);
  assert.equal(out[0].collected, 3950, 'the rupee total is untouched by the dollars');
});
