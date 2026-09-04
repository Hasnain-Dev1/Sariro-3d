import { HOME_STATE_CODE } from './company';

/**
 * SARIRO — what an invoice actually adds up to
 * =========================================================
 * Pure functions. No I/O, no React, no formatting decisions beyond the numbers.
 *
 * ── The rule that everything here exists to protect ─────────────────────────
 * The price the team enters is the FINAL price the customer pays. For an Indian
 * customer with GST included, that price ALREADY CONTAINS the 18%.
 *
 * So GST is extracted, never added:
 *
 *     taxable = price / 1.18
 *     gst     = price - taxable
 *     total   = price          ← unchanged, always
 *
 * Adding 18% on top instead would turn a ₹11,800 sale into a ₹13,924 invoice.
 * The customer paid 11,800. The invoice would say something else, the GST
 * return would be filed on a number nobody received, and it would be found by
 * an accountant months later. Every test in the suite beside this file exists
 * because that mistake is one character away.
 *
 * ── Intra-state versus inter-state ──────────────────────────────────────────
 * Indian GST is not one line. A sale inside the seller's own state is CGST 9%
 * plus SGST 9%; a sale to another state is IGST 18%. The totals are identical,
 * the invoice is not, and filing the wrong one is a real correction.
 *
 * Sariro's GSTIN begins 19 — West Bengal. A customer in West Bengal gets
 * CGST+SGST; everyone else in India gets IGST.
 *
 * ── International ───────────────────────────────────────────────────────────
 * No tax lines at all. Not "GST: 0", not "not applicable" — absent. Export of
 * services is outside GST, and a zero-rated line on a customer-facing invoice
 * invites a question that has no useful answer.
 */

/**
 * The one number to change if the rate ever changes.
 *
 * Everything derives from it: CGST and SGST are each half of it, IGST is all of
 * it, and the labels on the invoice are printed from it. Setting it to 0.16
 * would produce CGST 8% + SGST 8% within West Bengal and IGST 16% elsewhere,
 * with no other edit anywhere.
 *
 * It is 0.18 because 18% is the rate for online educational and coaching
 * services in India, and because India's GST slabs are 0, 5, 12, 18 and 28 —
 * there is no 16% slab. Changing it is a decision for the company's accountant,
 * not a preference, so it lives here alone rather than being spread across the
 * document and the calculation.
 */
export const GST_RATE = 0.18;

export interface InvoiceInput {
  /** What the customer pays. Never modified by any calculation here. */
  price: number;
  country: string;
  /** Only meaningful when the country is India. */
  includeGst: boolean;
  /**
   * GST state code of the customer, e.g. '27' for Maharashtra. Decides
   * CGST+SGST versus IGST. Empty means unknown, which is treated as
   * inter-state — the safer default, because IGST wrongly charged is a
   * refundable credit while a missing SGST is a shortfall.
   */
  customerStateCode?: string;
}

export type TaxTreatment = 'intra_state' | 'inter_state' | 'no_gst' | 'export';

export interface TaxLine {
  label: string;
  /** The percentage, for the label. */
  rate: number;
  amount: number;
}

export interface InvoiceTotals {
  treatment: TaxTreatment;
  /** The amount before tax. Equals the total when no GST applies. */
  taxable: number;
  /** Empty when no tax should be shown at all. */
  taxLines: TaxLine[];
  totalTax: number;
  /** Always equals the entered price. */
  total: number;
  /** Whether the invoice shows any tax section. */
  showsTax: boolean;
}

const isIndia = (country: string) => country.trim().toLowerCase() === 'india';

/** Two decimal places, without the drift of repeated floating-point addition. */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculateInvoice(input: InvoiceInput): InvoiceTotals {
  const price = Number.isFinite(input.price) && input.price > 0 ? input.price : 0;

  // Outside India: no tax section exists at all.
  if (!isIndia(input.country)) {
    return {
      treatment: 'export',
      taxable: round2(price),
      taxLines: [],
      totalTax: 0,
      total: round2(price),
      showsTax: false,
    };
  }

  // India, GST switched off by the person raising it.
  if (!input.includeGst) {
    return {
      treatment: 'no_gst',
      taxable: round2(price),
      taxLines: [],
      totalTax: 0,
      total: round2(price),
      showsTax: false,
    };
  }

  // India, GST included in the price. Extract, never add.
  const taxable = round2(price / (1 + GST_RATE));
  // Derived by subtraction rather than as taxable × 0.18, so the parts always
  // reconcile to the total even where rounding would otherwise leave a paisa.
  const totalTax = round2(price - taxable);
  const intraState = !!input.customerStateCode && input.customerStateCode === HOME_STATE_CODE;

  const taxLines: TaxLine[] = intraState
    ? [
        // Split by halving the tax, then giving the remainder to SGST, so the
        // two halves add to totalTax exactly rather than to a paisa less.
        { label: 'CGST', rate: (GST_RATE / 2) * 100, amount: round2(totalTax / 2) },
        { label: 'SGST', rate: (GST_RATE / 2) * 100, amount: round2(totalTax - round2(totalTax / 2)) },
      ]
    : [{ label: 'IGST', rate: GST_RATE * 100, amount: totalTax }];

  return {
    treatment: intraState ? 'intra_state' : 'inter_state',
    taxable,
    taxLines,
    totalTax,
    total: round2(price),
    showsTax: true,
  };
}

/**
 * Money, in the invoice's own currency.
 *
 * Rupees group Indian-style (1,20,000) and everything else Western-style. An
 * invoice that renders ₹120,000 to an Indian customer looks foreign on a
 * document whose whole job is to look official.
 */
export function formatMoney(amount: number, currencyCode: string, symbol: string): string {
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Whether GST may be charged at all. The UI uses this to disable the switch,
 * so nobody has to remember the rule.
 */
export const gstAvailable = (country: string) => isIndia(country);

/* ══════════════════════════════════════════════════════════════════════════
   Paying in parts
   ══════════════════════════════════════════════════════════════════════════
   A parent pays half now and half in six weeks, and the second invoice must
   not look like a second course. So the invoice carries three numbers beside
   the one being charged: what the course costs, what had already been paid,
   and what is being paid today.

   The tax is on TODAY'S amount and nothing else. Under GST the time of supply
   for a service includes receipt of payment, so each receipt carries its own
   tax — charging the whole course's GST on the first installment would collect
   tax on money nobody has received. Nothing below feeds calculateInvoice(),
   which is exactly the point: `price` already means "received on this
   invoice", so the tax base is right by construction rather than by a rule
   somebody has to remember.
   ══════════════════════════════════════════════════════════════════════════ */

export type PaymentType = 'full' | 'installment';

export interface PaymentInput {
  paymentType: PaymentType;
  /** What the whole course costs. Ignored for a full payment. */
  courseTotal: number;
  /** What had already been received before this invoice. */
  previouslyPaid: number;
  /** What is being paid now — the taxable amount. */
  amountNow: number;
}

export interface PaymentSummary {
  isInstallment: boolean;
  courseTotal: number;
  previouslyPaid: number;
  amountNow: number;
  /** Everything received including this invoice. */
  paidToDate: number;
  /** What is still owed. Never negative — see `overpaid`. */
  balance: number;
  /** By how much the payments exceed the course total, if they do. */
  overpaid: number;
  /** This payment clears the course. */
  settled: boolean;
}

export function paymentSummary(input: PaymentInput): PaymentSummary {
  const amountNow = Number.isFinite(input.amountNow) && input.amountNow > 0 ? input.amountNow : 0;

  // A full payment is the degenerate case of an installment: the course total
  // is the amount, nothing came before, and nothing is left. Returning the same
  // shape means the document has one code path, not two.
  if (input.paymentType !== 'installment') {
    return {
      isInstallment: false,
      courseTotal: round2(amountNow),
      previouslyPaid: 0,
      amountNow: round2(amountNow),
      paidToDate: round2(amountNow),
      balance: 0,
      overpaid: 0,
      settled: true,
    };
  }

  const courseTotal = Number.isFinite(input.courseTotal) && input.courseTotal > 0 ? input.courseTotal : 0;
  const previouslyPaid = Number.isFinite(input.previouslyPaid) && input.previouslyPaid > 0 ? input.previouslyPaid : 0;
  const paidToDate = round2(previouslyPaid + amountNow);
  const difference = round2(courseTotal - paidToDate);

  return {
    isInstallment: true,
    courseTotal: round2(courseTotal),
    previouslyPaid: round2(previouslyPaid),
    amountNow: round2(amountNow),
    paidToDate,
    // Split rather than signed: a negative "balance due" on a customer-facing
    // document reads as a discount. An overpayment is a different fact and
    // gets said in different words.
    balance: difference > 0 ? difference : 0,
    overpaid: difference < 0 ? round2(-difference) : 0,
    settled: difference <= 0,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   What the gateway kept
   ══════════════════════════════════════════════════════════════════════════
   Razorpay takes its cut before the money reaches the bank, and the rate is
   not one number — it moves with the instrument (UPI, card, netbanking, an
   international card) and with whatever was negotiated that quarter. So it is
   recorded per transaction rather than assumed.

   Three facts that are easy to confuse and must not be:

     total         what the customer paid, and what GST is charged on
     fee           what the gateway kept — a cost Sariro bears
     netReceived   what actually landed in the bank

   The fee is NOT a charge to the customer. It changes nothing about the tax:
   GST is on the consideration the customer paid, not on what survived the
   deduction. Netting the fee off before computing tax would under-declare
   output GST on every card payment the company ever takes.

   Entered either way — a percentage, or the exact figure off the settlement
   report — because both are things a person actually has in front of them, and
   two inputs that must agree is a bug waiting to happen. One value, one mode,
   and the other side is derived.
   ══════════════════════════════════════════════════════════════════════════ */

export type FeeMode = 'percent' | 'amount';

export interface GatewayFeeInput {
  /** What the customer paid. The gross figure that reached the gateway. */
  total: number;
  mode: FeeMode;
  /** A percentage when mode is 'percent', otherwise the money deducted. */
  value: number;
}

export interface GatewayFeeResult {
  /** The effective rate, whichever way it was entered. */
  percent: number;
  /** The money the gateway kept. */
  fee: number;
  /** total − fee. What reconciles against the bank. */
  netReceived: number;
}

export function gatewayFee(input: GatewayFeeInput): GatewayFeeResult {
  const total = Number.isFinite(input.total) && input.total > 0 ? round2(input.total) : 0;
  const raw = Number.isFinite(input.value) && input.value > 0 ? input.value : 0;

  // Capped at the payment itself. A fee larger than the amount is arithmetic
  // nobody meant, and letting it through would put a negative figure into the
  // one column the books are reconciled against.
  const fee = round2(Math.min(input.mode === 'percent' ? (total * raw) / 100 : raw, total));

  // Rounded to three places: 2.36% is Razorpay's card rate once GST on the fee
  // is included, and rounding that to 2.4 would misstate every reconciliation.
  const percent = total > 0 ? Math.round((fee / total) * 100000) / 1000 : 0;

  return { percent, fee, netReceived: round2(total - fee) };
}
