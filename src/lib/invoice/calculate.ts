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
