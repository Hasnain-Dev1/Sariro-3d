import type { SupabaseClient } from '@supabase/supabase-js';
import type { SettlementWindow } from '@/lib/dashboard/settlement-period';

/**
 * SARIRO — settling one month for one seller
 * ============================================================================
 * SERVER ONLY. A thin call onto settle_seller_month() in
 * scripts/seller-pipeline-and-sale.sql, for the same reason the teacher
 * version is: the automatic settlement on the 5th runs inside Postgres on a
 * pg_cron schedule and cannot call TypeScript. Two implementations of "what
 * goes into a seller's month" is how a payslip stops matching the button that
 * produced it.
 *
 * Three callers, one function: the seller pressing Settle, the payout screen
 * noticing the 5th has passed, and the hourly schedule. All idempotent — the
 * unique index on (seller_id, period_month) makes a second settlement of the
 * same month impossible rather than merely unlikely.
 *
 * ── Why a seller's month is not a teacher's ─────────────────────────────────
 * A teacher's settlement bundles per-class earning rows. A seller has none:
 * their month is a base salary plus whatever incentive HR approved. So the
 * function is new, but the cycle — opens on the 1st, settles itself on the 5th
 * at 10:00 IST — is lib/dashboard/settlement-period.ts, shared, so a seller
 * and a teacher are never told two different dates.
 */

export interface SellerSettleResult {
  ok: boolean;
  outcome: 'settled' | 'already_settled' | 'nothing_to_settle' | 'failed';
  settlementId?: string;
  total?: number;
  base?: number;
  incentives?: number;
  message?: string;
  /** The migration has not been run. Said separately so a screen can say so. */
  setupMissing?: boolean;
}

export async function settleMonthForSeller(
  admin: SupabaseClient,
  sellerId: string,
  window: SettlementWindow,
  opts: { type: 'manual' | 'auto'; reason?: string }
): Promise<SellerSettleResult> {
  const { data, error } = await admin.rpc('settle_seller_month', {
    p_seller_id: sellerId,
    p_month: window.month,
    p_type: opts.type,
    p_reason: opts.reason ?? null,
  });

  if (error) {
    const missing = /does not exist|could not find|schema cache/i.test(error.message ?? '');
    return {
      ok: false,
      outcome: 'failed',
      setupMissing: missing,
      message: missing
        ? 'Seller payouts are not set up yet — run scripts/seller-pipeline-and-sale.sql in Supabase.'
        : error.message,
    };
  }

  /* Null covers both "already settled" and "nothing to settle" — neither is an
     error and neither writes. One read tells them apart, only when asked. */
  if (!data) {
    const { data: existing } = await admin
      .from('seller_settlements')
      .select('id')
      .eq('seller_id', sellerId)
      .eq('period_month', window.month)
      .maybeSingle();

    return existing
      ? { ok: true, outcome: 'already_settled', settlementId: existing.id as string }
      : { ok: true, outcome: 'nothing_to_settle' };
  }

  const settlementId = data as string;
  const { data: row } = await admin
    .from('seller_settlements')
    .select('total_amount, base_amount, incentive_amount')
    .eq('id', settlementId)
    .maybeSingle();

  return {
    ok: true,
    outcome: 'settled',
    settlementId,
    total: Number(row?.total_amount ?? 0),
    base: Number(row?.base_amount ?? 0),
    incentives: Number(row?.incentive_amount ?? 0),
  };
}

/** Everybody who draws a seller's pay. Admins who merely hold leads do not. */
export async function activeSellerIds(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin.from('profiles').select('id').or('role.eq.seller,is_seller.eq.true');
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

/**
 * Who should hear about a seller's payout: their own reporting HR if one is
 * assigned, otherwise every HR. The assignment is what makes the mapping mean
 * something — an HR who never hears about their sellers' money has a name on a
 * profile and nothing else.
 */
export async function hrRecipientsFor(admin: SupabaseClient, sellerId: string): Promise<string[]> {
  const { data: me } = await admin
    .from('profiles')
    .select('reporting_hr_id')
    .eq('id', sellerId)
    .maybeSingle();
  const own = (me as { reporting_hr_id?: string | null } | null)?.reporting_hr_id ?? null;
  if (own) return [own];

  const { data } = await admin.from('profiles').select('id').or('role.eq.hr,is_hr.eq.true').limit(20);
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}
