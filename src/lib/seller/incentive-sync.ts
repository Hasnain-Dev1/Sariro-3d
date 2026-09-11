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
 * So the computed entitlement is one row per seller per month, enforced by a
 * PARTIAL unique index — `where kind = 'tier'` — because the same table also
 * holds the seller's own manual requests, of which there may be several.
 * PostgREST cannot aim an upsert at a partial index, so this inserts or
 * updates explicitly, and when two punches race to create the month's row the
 * index refuses the second insert and the loser updates the winner's row
 * instead. The index is the guarantee; this code only has to be polite about
 * it.
 *
 * The entitlement is recomputed from scratch every time rather than adjusted,
 * so a missed run is corrected by the next one instead of compounding.
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
import { hrRecipientsFor } from '@/lib/seller/settle';
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
      /* `sales` is keyed by invoice_number and has no `id` column. Asking for
         one failed the whole read — and the failure looked exactly like a
         seller with no sales, so no incentive would ever have been raised.
         Caught against the live database, not by any test. */
      .select('invoice_number, amount, punched_at, refunded_at')
      .eq('seller_id', sellerId)
      .not('punched_at', 'is', null)
      .is('refunded_at', null)
      .gte('punched_at', start)
      .lt('punched_at', end),
    admin.from('app_settings').select('key, value').like('key', 'seller_%'),
  ]);

  const config = readIncentiveConfig(settings ?? []);
  const rows = (sales ?? []) as { invoice_number: string; amount: number | null }[];
  const breakdown = computeIncentive(
    rows.map((s) => ({ id: s.invoice_number, amount: Number(s.amount) || 0 })),
    config
  );

  const base: SyncResult = { monthKey: key, salesCount: breakdown.salesCount, total: breakdown.total, outcome: 'none' };

  /* Zero is not worth an approval row. A queue that fills with ₹0 entries for
     every seller every month is one nobody reads, and the ₹12,000 row is then
     approved by the same reflex as the empty ones. */
  if (!needsApproval(breakdown)) return base;

  /* Only the computed kind. A seller's own ask for a bonus lives in the same
     table and must never be mistaken for — or overwritten as — the month's
     tier entitlement. */
  const { data: existing } = await admin
    .from('seller_incentive_requests')
    .select('id, status, amount, sales_count')
    .eq('seller_id', sellerId)
    .eq('month_key', key)
    .eq('kind', 'tier')
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

  const fields = {
    sales_count: breakdown.salesCount,
    tier_sales: breakdown.tierSales,
    amount: breakdown.total,
    breakdown: breakdown as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  };

  let wrote = false;
  if (existing) {
    /* Guarded on still being pending, so an approval landing between the read
       above and this write is not overwritten by the recomputation. */
    wrote = await bestEffort(
      'incentive-sync: update the month’s tier request',
      admin.from('seller_incentive_requests').update(fields).eq('id', existing.id).eq('status', 'pending')
    );
  } else {
    const { error } = await admin.from('seller_incentive_requests').insert({
      ...fields,
      seller_id: sellerId,
      month_key: key,
      kind: 'tier',
      status: 'pending',
    });
    if (!error) {
      wrote = true;
    } else if (error.code === '23505') {
      /* Another punch for the same seller created the row a moment ago. The
         index refused the duplicate — which is the whole point — and the right
         move is to bring the winner's row up to date, not to fail. */
      wrote = await bestEffort(
        'incentive-sync: update after losing the insert race',
        admin
          .from('seller_incentive_requests')
          .update(fields)
          .eq('seller_id', sellerId)
          .eq('month_key', key)
          .eq('kind', 'tier')
          .eq('status', 'pending')
      );
    } else {
      console.warn('[incentive-sync] insert failed:', error.code, error.message);
    }
  }

  if (!wrote) return { ...base, outcome: 'failed' };

  /* Only announce a genuinely new entitlement, or a tier step up. A
     notification every time a sale nudges the total by ₹200 is noise. */
  const crossedATier = !existing || Number(existing.sales_count ?? 0) < breakdown.tierSales;

  if (crossedATier && breakdown.tierSales > 0) {
    await recordEvent(admin, {
      event: 'incentive.earned',
      subjectType: 'seller_month',
      subjectId: sellerId,
      payload: { monthKey: key, tierSales: breakdown.tierSales, amount: breakdown.total },
    });

    for (const hr of await hrRecipientsFor(admin, sellerId)) {
      await bestEffort(
        'incentive-sync: notify HR',
        admin.from('notifications').insert({
          user_id: hr,
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
