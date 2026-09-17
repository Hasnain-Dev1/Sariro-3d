import { NextRequest, NextResponse } from 'next/server';
import { requireActor } from '@/lib/auth/actor';
import { AUTOPAY_LIVE_STATUSES, autopaysForAccount, type LinkRow } from '@/lib/payments/link-store';
import { FREQUENCY_LABEL } from '@/lib/payments/link-request';

/**
 * SARIRO — "is there an autopay on my account?"
 * ============================================================================
 * GET /api/account/autopay
 *
 * Settings shows a signed-in learner or parent the autopays a seller made for
 * their email or phone, with how to pause or cancel one (by email or WhatsApp
 * to Sariro — an admin ends it; nothing is cancelled from this page). Only the
 * caller's own rows, matched on their own account's email and phone, and only
 * what they need to recognise it.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'account-autopay', limit: 30, skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const [{ data: auth }, { data: me }] = await Promise.all([
    actor.admin.auth.admin.getUserById(actor.id),
    actor.admin.from('profiles').select('email, phone').eq('id', actor.id).maybeSingle(),
  ]);
  const email = (auth?.user?.email ?? (me?.email as string | null) ?? null) || null;
  const phone = ((me?.phone as string | null) ?? null) || null;
  if (!email && !phone) return NextResponse.json({ ok: true, autopays: [] }, { headers: { 'Cache-Control': 'no-store' } });

  const { data, error } = await actor.admin
    .from('payment_links')
    .select('id, kind, status, amount_inr, frequency, total_count, paid_count, description, customer_email, customer_phone, created_at')
    .eq('kind', 'autopay')
    .in('status', [...AUTOPAY_LIVE_STATUSES])
    .order('created_at', { ascending: false })
    .limit(200);
  // No table yet, or no reading it: nothing to tell the learner, and nothing to break Settings over.
  if (error) return NextResponse.json({ ok: true, autopays: [] }, { headers: { 'Cache-Control': 'no-store' } });

  const mine = autopaysForAccount((data ?? []) as LinkRow[], { email, phone }).map((r) => ({
    id: r.id,
    status: r.status,
    amount: Number(r.amount_inr),
    frequency: r.frequency ? FREQUENCY_LABEL[r.frequency] : null,
    totalCount: r.total_count,
    paidCount: r.paid_count,
    description: r.description,
    createdAt: r.created_at,
  }));
  return NextResponse.json({ ok: true, autopays: mine, email, phone }, { headers: { 'Cache-Control': 'no-store' } });
}
