import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoice, formatMoney, gstAvailable, GST_RATE } from './calculate';

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
