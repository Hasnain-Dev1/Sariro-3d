/**
 * SARIRO — what the sales ledger adds up to
 * ============================================================================
 * Pure. Used by the sales ledger panel and the Earnings & Sales report, so the
 * two screens cannot tell the founder two different numbers for the same words.
 *
 * ── Why the report was blank ────────────────────────────────────────────────
 * Earnings & Sales read the money from the LEAD: sale_value and amount_paid,
 * typed by hand, on leads in the 'enrolled' stage. Recording a sale moved to the
 * invoice-backed ledger months ago and never wrote those fields again — every
 * lead carries 0 for both. So invoiced, collected and due were all ₹0, and the
 * list of enrolled sales was empty, while four real sales sat in the ledger.
 *
 * Every figure here comes from the ledger (public.sales), which comes from the
 * invoice the customer holds.
 *
 * ── What each number means ──────────────────────────────────────────────────
 *   Invoiced   the value sold. An installment plan counts its whole course fee,
 *              once; a full payment counts what was paid.
 *   Collected  the payments actually received.
 *   Due        what is still owed on installment plans.
 *   Refunded   what went back to customers.
 *   Net        collected − refunded.
 *
 * Every total is per currency. Adding dollars to rupees produces a number that
 * looks like revenue and is not.
 */

/** The ledger columns this needs — a subset of SaleRow, so this stays pure. */
export interface LedgerSale {
  invoice_number: string;
  student_name: string;
  student_email: string | null;
  course_name: string;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  gst_included: boolean;
  payment_type: string | null;
  sale_type: string | null;
  course_total: number | null;
  gateway_fee: number | null;
  net_received: number | null;
  total_tax: number | null;
  sold_on: string;
  refund_amount: number | null;
  refunded_at: string | null;
}

/* ─────────────────────────── Filters ─────────────────────────── */

export type SaleTypeFilter = 'all' | 'new' | 'renewal';
export type RefundFilter = 'all' | 'refunded' | 'not_refunded';
export type GstFilter = 'all' | 'opted' | 'not_opted';
export type PaymentFilter = 'all' | 'full' | 'installment';

export interface SalesFilters {
  saleType: SaleTypeFilter;
  refund: RefundFilter;
  gst: GstFilter;
  payment: PaymentFilter;
}

export const NO_FILTERS: SalesFilters = { saleType: 'all', refund: 'all', gst: 'all', payment: 'all' };

const isRenewal = (s: LedgerSale) => s.sale_type === 'renewal';
const isRefunded = (s: LedgerSale) => !!s.refunded_at || Number(s.refund_amount ?? 0) > 0;
const isInstallment = (s: LedgerSale) => s.payment_type === 'installment';

export function applyFilters<T extends LedgerSale>(rows: readonly T[], f: SalesFilters): T[] {
  return rows.filter((s) => {
    if (f.saleType === 'new' && isRenewal(s)) return false;
    if (f.saleType === 'renewal' && !isRenewal(s)) return false;
    if (f.refund === 'refunded' && !isRefunded(s)) return false;
    if (f.refund === 'not_refunded' && isRefunded(s)) return false;
    if (f.gst === 'opted' && !s.gst_included) return false;
    if (f.gst === 'not_opted' && s.gst_included) return false;
    if (f.payment === 'installment' && !isInstallment(s)) return false;
    if (f.payment === 'full' && isInstallment(s)) return false;
    return true;
  });
}

/** The filters, in words — for a report's filename and heading. */
export function describeFilters(f: SalesFilters): string {
  const parts: string[] = [];
  if (f.saleType !== 'all') parts.push(f.saleType === 'new' ? 'new sales' : 'renewals');
  if (f.refund !== 'all') parts.push(f.refund === 'refunded' ? 'refunded' : 'not refunded');
  if (f.gst !== 'all') parts.push(f.gst === 'opted' ? 'GST opted' : 'GST not opted');
  if (f.payment !== 'all') parts.push(f.payment === 'full' ? 'full payment' : 'installments');
  return parts.length ? parts.join(', ') : 'all sales';
}

/* ─────────────────────────── Money ─────────────────────────── */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * One customer's one course. An installment plan is several invoices — the
 * first payment, the second — and they belong together: the course fee is owed
 * once, not once per installment.
 */
export function enrolmentKey(s: LedgerSale): string {
  const who = (s.student_email || s.student_name || '').trim().toLowerCase();
  return `${who}|${(s.course_name || '').trim().toLowerCase()}|${s.currency_code}`;
}

export interface Outstanding {
  courseTotal: number;
  paid: number;
  due: number;
  /** A refund on the plan cancels what is left — nobody chases a refunded family. */
  cancelled: boolean;
}

/**
 * What is still owed on every installment plan, across the WHOLE ledger.
 *
 * Deliberately not limited to a date range: a plan started in August and paid
 * again in September owes whatever is left after both payments, whichever month
 * the report is looking at.
 */
export function outstandingPlans(all: readonly LedgerSale[]): Map<string, Outstanding> {
  const plans = new Map<string, Outstanding>();
  for (const s of all) {
    if (!isInstallment(s)) continue;
    const key = enrolmentKey(s);
    const p = plans.get(key) ?? { courseTotal: 0, paid: 0, due: 0, cancelled: false };
    p.courseTotal = Math.max(p.courseTotal, Number(s.course_total ?? 0));
    p.paid = round2(p.paid + Number(s.amount));
    if (isRefunded(s)) p.cancelled = true;
    plans.set(key, p);
  }
  for (const p of plans.values()) {
    p.due = p.cancelled ? 0 : Math.max(0, round2(p.courseTotal - p.paid));
  }
  return plans;
}

export interface CurrencySummary {
  currency: string;
  symbol: string;
  sales: number;
  newSales: number;
  renewals: number;
  refunds: number;
  gstOpted: number;
  gstNotOpted: number;
  installments: number;
  invoiced: number;
  collected: number;
  due: number;
  refunded: number;
  net: number;
  gatewayFees: number;
  /** What reached the bank, after the gateway's cut and any refund. */
  realised: number;
  tax: number;
}

/**
 * The totals for a set of rows, per currency.
 *
 * `all` is the whole ledger, used only to work out what installment plans still
 * owe; `rows` is what is being reported on (a date range, a filter).
 */
export function summarise(rows: readonly LedgerSale[], all: readonly LedgerSale[] = rows): CurrencySummary[] {
  const plans = outstandingPlans(all);
  const byCurrency = new Map<string, CurrencySummary>();
  const countedPlan = new Set<string>();

  for (const s of rows) {
    const c = byCurrency.get(s.currency_code) ?? {
      currency: s.currency_code, symbol: s.currency_symbol,
      sales: 0, newSales: 0, renewals: 0, refunds: 0, gstOpted: 0, gstNotOpted: 0, installments: 0,
      invoiced: 0, collected: 0, due: 0, refunded: 0, net: 0, gatewayFees: 0, realised: 0, tax: 0,
    };
    const amount = Number(s.amount);
    const refund = Number(s.refund_amount ?? 0);
    const fee = Number(s.gateway_fee ?? 0);

    c.sales += 1;
    if (isRenewal(s)) c.renewals += 1; else c.newSales += 1;
    if (isRefunded(s)) c.refunds += 1;
    if (s.gst_included) c.gstOpted += 1; else c.gstNotOpted += 1;

    c.collected = round2(c.collected + amount);
    c.refunded = round2(c.refunded + refund);
    c.gatewayFees = round2(c.gatewayFees + fee);
    c.tax = round2(c.tax + Number(s.total_tax ?? 0));
    c.realised = round2(c.realised + Number(s.net_received ?? amount - fee) - refund);

    if (isInstallment(s)) {
      c.installments += 1;
      // The course fee is sold once per plan, however many installments appear.
      const key = enrolmentKey(s);
      if (!countedPlan.has(key)) {
        countedPlan.add(key);
        const plan = plans.get(key);
        c.invoiced = round2(c.invoiced + (plan?.courseTotal || amount));
        c.due = round2(c.due + (plan?.due ?? 0));
      }
    } else {
      c.invoiced = round2(c.invoiced + amount);
    }

    c.net = round2(c.collected - c.refunded);
    byCurrency.set(s.currency_code, c);
  }

  // INR first — it is the currency the books are kept in.
  return [...byCurrency.values()].sort((a, b) =>
    a.currency === 'INR' ? -1 : b.currency === 'INR' ? 1 : b.collected - a.collected
  );
}

/** What is still owed on the plan this sale belongs to. 0 for a full payment. */
export function dueOnSale(s: LedgerSale, plans: Map<string, Outstanding>): number {
  if (!isInstallment(s)) return 0;
  return plans.get(enrolmentKey(s))?.due ?? 0;
}
