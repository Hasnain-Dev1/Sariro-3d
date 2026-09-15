/**
 * SARIRO — what we owe the GST department, for a period
 * ============================================================================
 * The founder, 15 Sep 2026: show output GST, input GST and the total, so filing
 * is simple.
 *
 *   Output GST   GST on the invoices we issued. Every tax invoice from
 *                Generate Invoice is output GST — split CGST + SGST inside West
 *                Bengal, IGST everywhere else in India (lib/invoice/calculate.ts).
 *   Less         GST on refunds (a credit note reverses the tax on the part
 *                refunded), dated when the refund was made.
 *   Input GST    GST we PAID on expenses, on bills that can be claimed back —
 *                the input tax credit. Approved expenses only; a pending claim is
 *                not a cost yet.
 *   Net          output − input. Positive is payable; negative is credit carried
 *                forward to next month.
 *
 * Only invoices with GST count towards output tax. Exports (outside India) and
 * Indian invoices raised without GST are listed separately — both belong on the
 * return as values, neither carries tax.
 *
 * Pure: no I/O. Tested beside this file. This is a working summary for the
 * accountant, not the return itself.
 */

export interface GstInvoice {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_state: string | null;
  taxable: number;
  total_tax: number;
  total: number;
  /** 'intra_state' | 'inter_state' | 'no_gst' | 'export' */
  tax_treatment: string;
  currency_code: string;
}

export interface GstRefund {
  invoice_number: string;
  refunded_at: string | null;
  refund_amount: number | null;
}

export interface GstExpense {
  id: string;
  spent_on: string;
  title: string;
  vendor: string | null;
  vendor_gstin?: string | null;
  bill_number?: string | null;
  amount: number;
  gst_amount?: number | null;
  itc_claimable?: boolean | null;
  status: string;
}

export interface TaxSplit {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface GstSummary {
  output: TaxSplit & { invoices: number };
  creditNotes: TaxSplit & { refunds: number };
  /** Output after credit notes. */
  outputNet: number;
  input: { total: number; bills: number; spend: number };
  /** GST paid on bills that cannot be claimed (no GSTIN, blocked credit). Shown, not deducted. */
  notClaimable: { total: number; bills: number };
  /** outputNet − input.total. */
  net: number;
  exports: { invoices: number; byCurrency: { currency: string; value: number }[] };
  noGstInIndia: { invoices: number; value: number };
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const zeroSplit = (): TaxSplit => ({ taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

/** CGST and SGST are half each, the remainder to SGST so the paise always add up. */
export function splitTax(tax: number, treatment: string): Pick<TaxSplit, 'cgst' | 'sgst' | 'igst'> {
  const t = round2(tax);
  if (treatment === 'intra_state') {
    const cgst = round2(t / 2);
    return { cgst, sgst: round2(t - cgst), igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: t };
}

const isTaxed = (treatment: string) => treatment === 'intra_state' || treatment === 'inter_state';

function add(into: TaxSplit, taxable: number, tax: number, treatment: string): void {
  const s = splitTax(tax, treatment);
  into.taxable = round2(into.taxable + taxable);
  into.cgst = round2(into.cgst + s.cgst);
  into.sgst = round2(into.sgst + s.sgst);
  into.igst = round2(into.igst + s.igst);
  into.total = round2(into.total + tax);
}

/**
 * `inPeriod` decides what falls in the period (invoices by invoice date,
 * refunds by refund date, expenses by spend date). `allInvoices` is every
 * invoice, so a refund this month on last month's invoice still finds its tax.
 */
export function gstSummary(input: {
  invoices: readonly GstInvoice[];
  allInvoices?: readonly GstInvoice[];
  refunds: readonly GstRefund[];
  expenses: readonly GstExpense[];
  inPeriod: (ymd: string | null | undefined) => boolean;
}): GstSummary {
  const output = { ...zeroSplit(), invoices: 0 };
  const creditNotes = { ...zeroSplit(), refunds: 0 };
  const exportsByCurrency = new Map<string, number>();
  let exportsCount = 0;
  const noGst = { invoices: 0, value: 0 };

  for (const inv of input.invoices) {
    if (!input.inPeriod(inv.invoice_date)) continue;
    if (isTaxed(inv.tax_treatment) && Number(inv.total_tax) > 0) {
      output.invoices += 1;
      add(output, Number(inv.taxable), Number(inv.total_tax), inv.tax_treatment);
    } else if (inv.tax_treatment === 'export') {
      exportsCount += 1;
      exportsByCurrency.set(inv.currency_code, round2((exportsByCurrency.get(inv.currency_code) ?? 0) + Number(inv.total)));
    } else {
      noGst.invoices += 1;
      noGst.value = round2(noGst.value + Number(inv.total));
    }
  }

  const byNumber = new Map((input.allInvoices ?? input.invoices).map((i) => [i.invoice_number, i]));
  for (const r of input.refunds) {
    const refund = Number(r.refund_amount ?? 0);
    if (refund <= 0 || !input.inPeriod(r.refunded_at)) continue;
    const inv = byNumber.get(r.invoice_number);
    if (!inv || !isTaxed(inv.tax_treatment) || Number(inv.total) <= 0 || Number(inv.total_tax) <= 0) continue;
    const share = Math.min(1, refund / Number(inv.total));
    const tax = round2(Number(inv.total_tax) * share);
    creditNotes.refunds += 1;
    add(creditNotes, round2(refund - tax), tax, inv.tax_treatment);
  }

  const inputGst = { total: 0, bills: 0, spend: 0 };
  const notClaimable = { total: 0, bills: 0 };
  for (const e of input.expenses) {
    if (e.status !== 'approved' || !input.inPeriod(e.spent_on)) continue;
    const gst = Number(e.gst_amount ?? 0);
    if (gst <= 0) continue;
    if (e.itc_claimable === false) {
      notClaimable.bills += 1;
      notClaimable.total = round2(notClaimable.total + gst);
      continue;
    }
    inputGst.bills += 1;
    inputGst.total = round2(inputGst.total + gst);
    inputGst.spend = round2(inputGst.spend + Number(e.amount));
  }

  const outputNet = round2(output.total - creditNotes.total);
  return {
    output,
    creditNotes,
    outputNet,
    input: inputGst,
    notClaimable,
    net: round2(outputNet - inputGst.total),
    exports: {
      invoices: exportsCount,
      byCurrency: [...exportsByCurrency.entries()].map(([currency, value]) => ({ currency, value })),
    },
    noGstInIndia: noGst,
  };
}

/** GST inside a GST-inclusive amount, at a rate in percent: ₹1,180 at 18% → ₹180. */
export function gstInside(amount: number, ratePercent: number): number {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(ratePercent) || ratePercent <= 0) return 0;
  return round2(amount - amount / (1 + ratePercent / 100));
}

/** The shape of a GSTIN: 2-digit state, PAN, entity, Z, check. */
export function isValidGstin(gstin: string | null | undefined): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test((gstin ?? '').trim().toUpperCase());
}

/** One file for the accountant: every taxed invoice, every credit note, every claimable bill. */
export function gstCsv(input: {
  invoices: readonly GstInvoice[];
  allInvoices?: readonly GstInvoice[];
  refunds: readonly GstRefund[];
  expenses: readonly GstExpense[];
  inPeriod: (ymd: string | null | undefined) => boolean;
}): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows: unknown[][] = [[
    'Type', 'Date', 'Document no.', 'Party', 'Party GSTIN / state', 'Taxable (INR)', 'CGST', 'SGST', 'IGST', 'GST total', 'Document total',
  ]];

  for (const inv of input.invoices) {
    if (!input.inPeriod(inv.invoice_date) || !isTaxed(inv.tax_treatment) || Number(inv.total_tax) <= 0) continue;
    const s = splitTax(Number(inv.total_tax), inv.tax_treatment);
    rows.push(['Output — invoice', inv.invoice_date, inv.invoice_number, inv.customer_name, inv.customer_state ?? '',
      Number(inv.taxable).toFixed(2), s.cgst.toFixed(2), s.sgst.toFixed(2), s.igst.toFixed(2), Number(inv.total_tax).toFixed(2), Number(inv.total).toFixed(2)]);
  }

  const byNumber = new Map((input.allInvoices ?? input.invoices).map((i) => [i.invoice_number, i]));
  for (const r of input.refunds) {
    const refund = Number(r.refund_amount ?? 0);
    const inv = byNumber.get(r.invoice_number);
    if (refund <= 0 || !input.inPeriod(r.refunded_at) || !inv || !isTaxed(inv.tax_treatment) || Number(inv.total) <= 0) continue;
    const tax = round2(Number(inv.total_tax) * Math.min(1, refund / Number(inv.total)));
    const s = splitTax(tax, inv.tax_treatment);
    rows.push(['Less — refund (credit note)', (r.refunded_at ?? '').slice(0, 10), inv.invoice_number, inv.customer_name, inv.customer_state ?? '',
      (-(refund - tax)).toFixed(2), (-s.cgst).toFixed(2), (-s.sgst).toFixed(2), (-s.igst).toFixed(2), (-tax).toFixed(2), (-refund).toFixed(2)]);
  }

  for (const e of input.expenses) {
    const gst = Number(e.gst_amount ?? 0);
    if (e.status !== 'approved' || !input.inPeriod(e.spent_on) || gst <= 0) continue;
    rows.push([e.itc_claimable === false ? 'Input — not claimable' : 'Input — expense', e.spent_on, e.bill_number ?? '', e.vendor ?? e.title,
      e.vendor_gstin ?? '', (Number(e.amount) - gst).toFixed(2), '', '', '', gst.toFixed(2), Number(e.amount).toFixed(2)]);
  }

  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}
