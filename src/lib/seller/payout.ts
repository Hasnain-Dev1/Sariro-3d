/**
 * SARIRO — what a seller's settlement will contain, before it exists
 * ============================================================================
 * A seller pressing Settle should see the figure first — base pay plus every
 * incentive HR has approved and nobody has paid yet. This computes that
 * preview, and it has to agree with what the database then actually writes.
 *
 * ── It mirrors settle_seller_month(), line for line ─────────────────────────
 * The settlement itself is written by one plpgsql function (see
 * scripts/seller-pipeline-and-sale.sql) because pg_cron cannot call
 * TypeScript and the automatic settlement on the 5th has to use the same rule
 * as the button. This file is the same rule in TypeScript, for the screen. If
 * one changes and the other does not, a seller is shown one number and paid
 * another — so the rules are few and the tests pin each of them:
 *
 *   · only APPROVED requests count — pending is not money yet
 *   · only requests not already in a settlement — nothing is paid twice
 *   · every approved request up to and including the month being settled,
 *     not only that month's — an incentive HR approved on 7 October for a
 *     September sale must not be stranded because September already closed
 *   · nothing before the month seller payouts began — so the first run of the
 *     schedule cannot invent a backdated payroll entry for months that were
 *     paid some other way
 */

export interface PayoutRequest {
  id: string;
  /** 'tier' — earned automatically. 'manual' — asked for by the seller. */
  kind?: string | null;
  /** 'YYYY-MM' the request belongs to. */
  month_key: string;
  amount: number | string | null;
  status: string;
  settlement_id?: string | null;
}

export interface SettlementPreview {
  month: string;
  base: number;
  incentives: number;
  incentiveCount: number;
  total: number;
  /** True when this month predates seller payouts — nothing will be written. */
  beforeStart: boolean;
}

const MONTH = /^\d{4}-\d{2}$/;

/**
 * Whether a month predates seller payouts.
 *
 * 'YYYY-MM' compares correctly as a string, which is the reason the months are
 * stored that way. A missing or malformed start means "no cut-off" rather than
 * "nothing is ever payable" — the failure that stops everybody being paid is
 * the worse of the two.
 */
export function isBeforeStart(month: string, startMonth: string | null | undefined): boolean {
  if (!startMonth || !MONTH.test(startMonth) || !MONTH.test(month)) return false;
  return month < startMonth;
}

/** The requests a settlement for `month` would take. */
export function settleableRequests<T extends PayoutRequest>(requests: readonly T[], month: string): T[] {
  return requests.filter(
    (r) =>
      r.status === 'approved' &&
      !r.settlement_id &&
      typeof r.month_key === 'string' &&
      MONTH.test(r.month_key) &&
      r.month_key <= month
  );
}

export function previewSettlement(input: {
  month: string;
  base: number;
  requests: readonly PayoutRequest[];
  startMonth?: string | null;
}): SettlementPreview {
  if (isBeforeStart(input.month, input.startMonth)) {
    return { month: input.month, base: 0, incentives: 0, incentiveCount: 0, total: 0, beforeStart: true };
  }

  const picked = settleableRequests(input.requests, input.month);
  const incentives = round2(
    picked.reduce((n, r) => {
      const a = Number(r.amount);
      /* A malformed amount is skipped rather than allowed to turn the whole
         figure into NaN, which renders as a blank payslip. */
      return n + (Number.isFinite(a) && a > 0 ? a : 0);
    }, 0)
  );
  const base = Math.max(0, Number(input.base) || 0);

  return {
    month: input.month,
    base,
    incentives,
    incentiveCount: picked.length,
    total: round2(base + incentives),
    beforeStart: false,
  };
}

/** The four states a settlement moves through, in the order it moves. */
export const SELLER_PAYMENT_STATUSES = ['seller_settled', 'admin_settled', 'processing', 'paid'] as const;
export type SellerPaymentStatus = (typeof SELLER_PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  seller_settled: 'Settled · waiting for HR',
  admin_settled: 'Approved by HR',
  processing: 'Payment on its way',
  paid: 'Paid',
};

/** 'September 2026' from '2026-09'. */
export function monthLabel(key: string | null | undefined): string {
  if (!key || !MONTH.test(key)) return key ?? '';
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}
