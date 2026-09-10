/**
 * SARIRO — keeping a seller's entitlement in step with what they have sold
 * ============================================================================
 * Run after a sale is punched, and after a refund. Never run speculatively:
 * everything here is derived from PUNCHED, UNREFUNDED sales, so it is always
 * safe to run again and always wrong to run before the money is confirmed.
 *
 * ── The duplicate-payment problem, and how it is actually prevented ─────────
 * The obvious design is "when a threshold is crossed, insert a request". That
 * pays twice the first time anything is retried, and thresholds get crossed by
 * several routes: a punch, a refund reversing one, an HR correction.
 *
 * So nothing is ever inserted twice: one row per seller per month, enforced by
 * a unique index in the database rather than by a check-then-insert here — the
 * check-then-insert is exactly the race it is trying to prevent. The row is
 * UPSERTED with the current entitlement, and the entitlement is recomputed
 * from scratch every time rather than adjusted.
 *
 * ── What happens after HR has already decided ───────────────────────────────
 * An approved row is frozen. If a later sale would raise the entitlement, the
 * approved figure is NOT quietly increased — HR approved a number and that is
 * the number that reaches payroll. The change is recorded as an event so it
 * can be seen and, if HR chooses, acted on. Silently editing an approved
 * amount is how a payroll figure stops matching the decision behind it.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { monthWindow } from '@/lib/leads/seller-assignment';
import { computeIncentive, readIncentiveConfig, needsApproval } from '@/lib/seller/incentives';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

export interface SyncResult {
  monthKey: string;
  salesCount: number;
  total: number;
  /** 'created' | 'updated' | 'unchanged' | 'frozen' | 'none' | 'failed' */
  outcome: string;
}

/**
 * Recompute one seller's entitlement for the month a given instant falls in.
 *
 * `at` is normally now. It is a parameter so a punch back-dated into last
 * month updates LAST month's entitlement rather than this one's — which is the
 * month the sale actually belongs to and the month HR will be approving.
 */
export async function syncSellerIncentive(
  admin: SupabaseClient,
  sellerId: string,
  at: number | Date = Date.now()
): Promise<SyncResult> {
  const { start, end, key } = monthWindow(at);

  const [{ data: sales }, { data: settings }] = await Promise.all([
    admin
      .from('sales')
      .select('id, amount, punched_at, refunded_at')
      .eq('seller_id', sellerId)
      .not('punched_at', 'is', null)
      .is('refunded_at', null)
      .gte('punched_at', start)
      .lt('punched_at', end),
    admin.from('app_settings').select('key, value').like('key', 'seller_%'),
  ]);

  const config = readIncentiveConfig(settings ?? []);
  const rows = (sales ?? []) as { id: string; amount: number | null }[];
  const breakdown = computeIncentive(
    rows.map((s) => ({ id: s.id, amount: Number(s.amount) || 0 })),
    config
  );

  const base: SyncResult = { monthKey: key, salesCount: breakdown.salesCount, total: breakdown.total, outcome: 'none' };

  /* Zero is not worth an approval row. A queue that fills with ₹0 entries for
     every seller every month is one nobody reads, and the ₹12,000 row is then
     approved by the same reflex as the empty ones. */
  if (!needsApproval(breakdown)) return base;

  const { data: existing } = await admin
    .from('seller_incentive_requests')
    .select('id, status, amount, sales_count')
    .eq('seller_id', sellerId)
    .eq('month_key', key)
    .maybeSingle();

  /* ── HR has already decided. The number stays. ─────────────────────────── */
  if (existing && existing.status !== 'pending') {
    if (Number(existing.amount) !== breakdown.total) {
      await recordEvent(admin, {
        event: 'incentive.changed_after_decision',
        subjectType: 'seller_month',
        subjectId: sellerId,
        payload: {
          monthKey: key,
          approvedAmount: Number(existing.amount),
          nowWorth: breakdown.total,
          status: existing.status,
        },
      });
      return { ...base, outcome: 'frozen' };
    }
    return { ...base, outcome: 'unchanged' };
  }

  /* ── Still pending, or does not exist yet ─────────────────────────────────
     Upserted on the unique (seller_id, month_key). The database decides which
     of two concurrent calls wins; neither can produce a second row. */
  const wrote = await bestEffort(
    'incentive-sync: upsert request',
    admin.from('seller_incentive_requests').upsert(
      {
        seller_id: sellerId,
        month_key: key,
        sales_count: breakdown.salesCount,
        tier_sales: breakdown.tierSales,
        amount: breakdown.total,
        breakdown: breakdown as unknown as Record<string, unknown>,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'seller_id,month_key' }
    )
  );

  if (!wrote) return { ...base, outcome: 'failed' };

  /* Only announce a genuinely new entitlement, or a tier step up. A
     notification every time a sale nudges the total by ₹200 is noise. */
  const crossedATier =
    !existing || Number(existing.sales_count ?? 0) < breakdown.tierSales;

  if (crossedATier && breakdown.tierSales > 0) {
    await recordEvent(admin, {
      event: 'incentive.earned',
      subjectType: 'seller_month',
      subjectId: sellerId,
      payload: { monthKey: key, tierSales: breakdown.tierSales, amount: breakdown.total },
    });

    const { data: hrPeople } = await admin
      .from('profiles').select('id').or('role.eq.hr,is_hr.eq.true').limit(20);
    for (const hr of hrPeople ?? []) {
      await bestEffort(
        'incentive-sync: notify HR',
        admin.from('notifications').insert({
          user_id: hr.id,
          type: 'incentive_approval',
          title: 'A seller has reached an incentive tier',
          message: `${breakdown.salesCount} sales this month — ₹${breakdown.total.toLocaleString('en-IN')} awaiting your approval.`,
          link: '/dashboard/hr',
        })
      );
    }
  }

  return { ...base, outcome: existing ? 'updated' : 'created' };
}
