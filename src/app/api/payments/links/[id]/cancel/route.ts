import { NextRequest, NextResponse } from 'next/server';
import { requireActor } from '@/lib/auth/actor';
import { bestEffort } from '@/lib/supabase/best-effort';
import { isLiveAutopay, type LinkRow } from '@/lib/payments/link-store';
import { cancelSubscription } from '@/lib/razorpay/subscriptions';

/**
 * SARIRO — end an autopay
 * ============================================================================
 * POST /api/payments/links/:id/cancel   (id = the payment_links row)
 *
 * Admins and the super admin only. Razorpay stops every future charge at once;
 * payments already collected stay collected (a refund is a separate decision).
 * The row records who ended it and when, and the audit log says so too.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireActor(req, { bucket: 'payment-links-cancel', limit: 20, allow: ['admin', 'super_admin'] });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, error: 'invalid', message: 'Unknown link.' }, { status: 400 });

  const { data, error } = await actor.admin
    .from('payment_links')
    .select('id, kind, razorpay_id, status, customer_name, customer_email, customer_phone, amount_inr, frequency, total_count, paid_count')
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: 'db', message: 'Could not read that link.' }, { status: 500 });
  const row = data as (Pick<LinkRow, 'id' | 'kind' | 'razorpay_id' | 'status' | 'customer_name' | 'customer_email' | 'customer_phone' | 'amount_inr' | 'frequency' | 'total_count' | 'paid_count'>) | null;
  if (!row) return NextResponse.json({ ok: false, error: 'not_found', message: 'That link no longer exists.' }, { status: 404 });
  if (row.kind !== 'autopay') return NextResponse.json({ ok: false, error: 'not_autopay', message: 'Only an autopay can be ended.' }, { status: 400 });
  if (!isLiveAutopay(row)) {
    return NextResponse.json({ ok: false, error: 'not_live', message: `This autopay is already ${row.status.replace(/_/g, ' ')}.` }, { status: 409 });
  }

  const cancelled = await cancelSubscription(row.razorpay_id);
  if (!cancelled.ok) return NextResponse.json({ ok: false, error: 'razorpay', message: cancelled.error }, { status: 502 });

  const now = new Date().toISOString();
  const { error: updateError } = await actor.admin
    .from('payment_links')
    .update({ status: cancelled.value.status, paid_count: cancelled.value.paidCount, cancelled_at: now, cancelled_by: actor.id, updated_at: now })
    .eq('id', row.id);
  if (updateError) console.error('[payment-links] cancel recorded at Razorpay but not in the table:', updateError.code, updateError.message);

  await bestEffort(
    'payment-links: cancel audit',
    actor.admin.from('admin_audit_logs').insert({
      admin_id: actor.id,
      action: 'autopay_cancelled',
      target_type: 'payment_link',
      target_id: row.id,
      metadata: {
        razorpay_id: row.razorpay_id,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        amount_inr: Number(row.amount_inr),
        frequency: row.frequency,
        total_count: row.total_count,
        paid_count: cancelled.value.paidCount,
      },
    })
  );

  return NextResponse.json({ ok: true, status: cancelled.value.status, paidCount: cancelled.value.paidCount });
}
