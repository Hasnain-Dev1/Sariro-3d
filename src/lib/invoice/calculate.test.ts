import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateInvoice, formatMoney, gstAvailable, paymentSummary, gatewayFee, GST_RATE,
} from './calculate';

/**
 * SARIRO — the arithmetic on a document sent to a paying customer
 * =========================================================
 * This is the one calculation in the product that reaches a customer's
 * accountant and a GST return at the same time. Two mistakes are possible and
 * both are quiet:
 *
 *   adding GST instead of extracting it — an ₹11,800 sale invoices at ₹13,924,
 *   which the customer did not pay and we would then owe tax on;
 *
 *   showing a tax line to an international customer — a zero-rated GST row on
 *   an export invoice invites a question with no useful answer, and looks like
 *   we do not know our own tax position.
 *
 * The examples the team wrote are pinned literally, so a refactor that changes
 * the answer fails here rather than on an issued invoice.
 */

describe('the entered price is what the customer pays', () => {
  test('Example A — ₹11,800 with GST included', () => {
    const r = calculateInvoice({ price: 11800, country: 'India', includeGst: true });
    assert.equal(r.taxable, 10000, 'taxable is the price divided by 1.18');
    assert.equal(r.totalTax, 1800);
    assert.equal(r.total, 11800, 'the total must equal what was entered');
  });

  test('GST is extracted, never added', () => {
    // The whole file exists for this line. 11800 × 1.18 would be 13,924.
    const r = calculateInvoice({ price: 11800, country: 'India', includeGst: true });
    assert.notEqual(r.total, 11800 * 1.18);
    assert.equal(r.total, 11800);
  });

  test('the parts always reconcile to the total', () => {
    // A price that does not divide cleanly by 1.18 — where naive rounding
    // leaves the invoice a paisa short and an accountant asking why.
    for (const price of [11800, 9999, 1, 33333.33, 4567.89]) {
      const r = calculateInvoice({ price, country: 'India', includeGst: true });
      const sum = r.taxable + r.taxLines.reduce((s, l) => s + l.amount, 0);
      assert.ok(Math.abs(sum - r.total) < 0.01, `${price}: parts ${sum} vs total ${r.total}`);
    }
  });

  test('Example B — India with GST off', () => {
    const r = calculateInvoice({ price: 10000, country: 'India', includeGst: false });
    assert.equal(r.taxable, 10000);
    assert.equal(r.total, 10000);
    assert.deepEqual(r.taxLines, [], 'no tax lines at all');
    assert.equal(r.showsTax, false);
  });
});

describe('international invoices carry no tax section', () => {
  test('Example C — $300 to the USA', () => {
    const r = calculateInvoice({ price: 300, country: 'United States', includeGst: false });
    assert.equal(r.total, 300);
    assert.equal(r.showsTax, false);
    assert.deepEqual(r.taxLines, [], 'not a zero row — no row');
  });

  test('turning GST on for a foreign country changes nothing', () => {
    // The UI disables the switch, but a stale value must not produce a tax line
    // on an export invoice. The rule lives here, not in the checkbox.
    const r = calculateInvoice({ price: 300, country: 'United States', includeGst: true });
    assert.equal(r.showsTax, false);
    assert.equal(r.totalTax, 0);
    assert.equal(r.total, 300);
  });

  test('country matching is not case-sensitive', () => {
    assert.equal(calculateInvoice({ price: 100, country: 'INDIA', includeGst: true }).showsTax, true);
    assert.equal(calculateInvoice({ price: 100, country: ' india ', includeGst: true }).showsTax, true);
  });
});

describe('intra-state versus inter-state', () => {
  test('a West Bengal customer gets CGST and SGST', () => {
    // Sariro's GSTIN begins 19 — West Bengal — so this is a local sale.
    const r = calculateInvoice({ price: 11800, country: 'India', includeGst: true, customerStateCode: '19' });
    assert.equal(r.treatment, 'intra_state');
    assert.deepEqual(r.taxLines.map((l) => l.label), ['CGST', 'SGST']);
    assert.equal(r.taxLines[0].amount + r.taxLines[1].amount, 1800);
    assert.equal(r.taxLines[0].rate, 9);
  });

  test('a Maharashtra customer gets IGST', () => {
    const r = calculateInvoice({ price: 11800, country: 'India', includeGst: true, customerStateCode: '27' });
    assert.equal(r.treatment, 'inter_state');
    assert.deepEqual(r.taxLines.map((l) => l.label), ['IGST']);
    assert.equal(r.taxLines[0].amount, 1800);
    assert.equal(r.taxLines[0].rate, 18);
  });

  test('an unknown state defaults to IGST', () => {
    // IGST charged where SGST was due is a credit the customer reclaims.
    // A missing SGST is a shortfall we owe. The safer default is IGST.
    assert.equal(calculateInvoice({ price: 11800, country: 'India', includeGst: true }).treatment, 'inter_state');
  });

  test('the split halves add up exactly, even on an odd amount', () => {
    // ₹1 of tax cannot halve evenly. The two lines must still sum to it.
    const r = calculateInvoice({ price: 100.01, country: 'India', includeGst: true, customerStateCode: '19' });
    assert.equal(r.taxLines[0].amount + r.taxLines[1].amount, r.totalTax);
  });
});

describe('the rate is the stated one', () => {
  test('18%', () => {
    assert.equal(GST_RATE, 0.18);
  });
});

describe('bad input does not produce a bad invoice', () => {
  test('zero, negative and nonsense prices all give zero, not NaN', () => {
    for (const price of [0, -500, NaN, Infinity]) {
      const r = calculateInvoice({ price, country: 'India', includeGst: true });
      assert.equal(r.total, 0, `${price} must not produce a total`);
      assert.ok(Number.isFinite(r.taxable));
    }
  });
});

describe('gst availability', () => {
  test('offered for India only', () => {
    assert.equal(gstAvailable('India'), true);
    assert.equal(gstAvailable('United States'), false);
    assert.equal(gstAvailable(''), false);
  });
});

describe('money reads correctly for its currency', () => {
  test('rupees group Indian-style', () => {
    assert.equal(formatMoney(120000, 'INR', '₹'), '₹1,20,000.00');
  });

  test('dollars group Western-style', () => {
    assert.equal(formatMoney(120000, 'USD', '$'), '$120,000.00');
  });

  test('always two decimals — an invoice does not show ₹10,000', () => {
    assert.equal(formatMoney(10000, 'INR', '₹'), '₹10,000.00');
  });
});

describe('paying in parts', () => {
  test('a full payment leaves nothing owed', () => {
    const s = paymentSummary({ paymentType: 'full', courseTotal: 0, previouslyPaid: 0, amountNow: 11800 });
    assert.equal(s.isInstallment, false);
    assert.equal(s.paidToDate, 11800);
    assert.equal(s.balance, 0);
    assert.equal(s.settled, true);
  });

  test('a full payment ignores a course total somebody left in the box', () => {
    const s = paymentSummary({ paymentType: 'full', courseTotal: 50000, previouslyPaid: 20000, amountNow: 11800 });
    assert.equal(s.courseTotal, 11800);
    assert.equal(s.previouslyPaid, 0);
    assert.equal(s.balance, 0);
  });

  test('the first installment of three', () => {
    const s = paymentSummary({ paymentType: 'installment', courseTotal: 36000, previouslyPaid: 0, amountNow: 12000 });
    assert.equal(s.paidToDate, 12000);
    assert.equal(s.balance, 24000);
    assert.equal(s.settled, false);
  });

  test('the last installment settles it exactly', () => {
    const s = paymentSummary({ paymentType: 'installment', courseTotal: 36000, previouslyPaid: 24000, amountNow: 12000 });
    assert.equal(s.paidToDate, 36000);
    assert.equal(s.balance, 0);
    assert.equal(s.overpaid, 0);
    assert.equal(s.settled, true);
  });

  test('an overpayment is said in different words, never as a negative balance', () => {
    const s = paymentSummary({ paymentType: 'installment', courseTotal: 36000, previouslyPaid: 30000, amountNow: 10000 });
    assert.equal(s.balance, 0);
    assert.equal(s.overpaid, 4000);
    assert.equal(s.settled, true);
  });

  test('thirds of a price that does not divide leave no stray paisa', () => {
    const a = paymentSummary({ paymentType: 'installment', courseTotal: 10000, previouslyPaid: 0, amountNow: 3333.33 });
    const b = paymentSummary({ paymentType: 'installment', courseTotal: 10000, previouslyPaid: 3333.33, amountNow: 3333.33 });
    const c = paymentSummary({ paymentType: 'installment', courseTotal: 10000, previouslyPaid: 6666.66, amountNow: 3333.34 });
    assert.equal(a.balance, 6666.67);
    assert.equal(b.balance, 3333.34);
    assert.equal(c.balance, 0);
    assert.equal(c.settled, true);
  });

  test('rubbish inputs collapse to zero rather than NaN', () => {
    const s = paymentSummary({ paymentType: 'installment', courseTotal: NaN, previouslyPaid: -5, amountNow: NaN });
    assert.equal(s.courseTotal, 0);
    assert.equal(s.previouslyPaid, 0);
    assert.equal(s.amountNow, 0);
    assert.equal(s.balance, 0);
  });

  /**
   * The rule the whole feature exists to protect: an installment is taxed on
   * what arrived, not on what the course costs. If these two ever diverge, GST
   * is being collected on money nobody has received.
   */
  test('GST is charged on the installment, never on the course total', () => {
    const summary = paymentSummary({ paymentType: 'installment', courseTotal: 35400, previouslyPaid: 0, amountNow: 11800 });
    const totals = calculateInvoice({ price: summary.amountNow, country: 'India', includeGst: true, customerStateCode: '19' });
    assert.equal(totals.total, 11800);
    assert.equal(totals.totalTax, 1800);
    assert.equal(totals.taxable, 10000);
  });
});

describe('what the gateway kept', () => {
  test('a percentage becomes money', () => {
    const g = gatewayFee({ total: 11800, mode: 'percent', value: 2 });
    assert.equal(g.fee, 236);
    assert.equal(g.netReceived, 11564);
    assert.equal(g.percent, 2);
  });

  test('the exact figure off the settlement report becomes a percentage', () => {
    const g = gatewayFee({ total: 11800, mode: 'amount', value: 278.48 });
    assert.equal(g.fee, 278.48);
    assert.equal(g.netReceived, 11521.52);
    // Razorpay's 2.36% — the 2% card rate with GST on the fee.
    assert.equal(g.percent, 2.36);
  });

  test('a bank transfer costs nothing, and zero is a real answer', () => {
    const g = gatewayFee({ total: 11800, mode: 'percent', value: 0 });
    assert.equal(g.fee, 0);
    assert.equal(g.netReceived, 11800);
    assert.equal(g.percent, 0);
  });

  test('a fee cannot exceed the payment', () => {
    const g = gatewayFee({ total: 500, mode: 'amount', value: 900 });
    assert.equal(g.fee, 500);
    assert.equal(g.netReceived, 0);
  });

  test('rubbish collapses to zero rather than NaN', () => {
    const g = gatewayFee({ total: NaN, mode: 'percent', value: -3 });
    assert.equal(g.fee, 0);
    assert.equal(g.netReceived, 0);
    assert.equal(g.percent, 0);
  });

  /**
   * The rule this whole feature must not break. The customer paid ₹11,800 and
   * that is the consideration; netting the gateway's cut off first would
   * under-declare output GST on every card payment the company ever takes.
   */
  test('the fee does not touch the tax — GST is on what the customer paid', () => {
    const totals = calculateInvoice({ price: 11800, country: 'India', includeGst: true, customerStateCode: '19' });
    const g = gatewayFee({ total: totals.total, mode: 'percent', value: 2.36 });
    assert.equal(totals.total, 11800);
    assert.equal(totals.totalTax, 1800);
    assert.equal(totals.taxable, 10000);
    // The fee lives entirely outside that.
    assert.equal(g.netReceived, 11521.52);
  });

  test('an installment is charged the fee on the installment, not the course', () => {
    const s = paymentSummary({ paymentType: 'installment', courseTotal: 36000, previouslyPaid: 0, amountNow: 12000 });
    const g = gatewayFee({ total: s.amountNow, mode: 'percent', value: 2 });
    assert.equal(g.fee, 240);
    assert.equal(g.netReceived, 11760);
  });
});

/**
 * The structure, stated once so a change to it has to be deliberate.
 * West Bengal is home, so a West Bengal customer is CGST + SGST, everyone else
 * in India is IGST, and outside India there is no tax section at all.
 */
describe('the shape of the tax, whatever the rate is set to', () => {
  const at = (stateCode: string, country = 'India') =>
    calculateInvoice({ price: 10000, country, includeGst: true, customerStateCode: stateCode });

  test('West Bengal splits into CGST and SGST, evenly', () => {
    const t = at('19');
    assert.deepEqual(t.taxLines.map((l) => l.label), ['CGST', 'SGST']);
    assert.equal(t.taxLines[0].rate, t.taxLines[1].rate);
    assert.equal(t.taxLines[0].rate, (GST_RATE / 2) * 100);
    assert.equal(t.treatment, 'intra_state');
  });

  test('any other Indian state is one IGST line at the full rate', () => {
    for (const code of ['27', '29', '07', '33']) {
      const t = at(code);
      assert.deepEqual(t.taxLines.map((l) => l.label), ['IGST']);
      assert.equal(t.taxLines[0].rate, GST_RATE * 100);
      assert.equal(t.treatment, 'inter_state');
    }
  });

  test('outside India there is no tax section — not a zero line', () => {
    const t = at('', 'United States');
    assert.equal(t.showsTax, false);
    assert.deepEqual(t.taxLines, []);
    assert.equal(t.treatment, 'export');
  });

  test('the two halves always add back to the whole tax', () => {
    const t = at('19');
    assert.equal(t.taxLines[0].amount + t.taxLines[1].amount, t.totalTax);
  });
});
