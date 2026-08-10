import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/leads/financials  { leadId, saleValue, amountPaid }
 *
 * Sets a lead's sale value + amount paid. Allowed for the lead's assigned
 * seller, or any admin / super_admin / hr (HR can fix miscalculations).
 * `due` is derived client-side (sale_value − amount_paid); never stored.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let userId: string | null = null;
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* 401 */ }
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const rl = rateLimit({ key: `lead-financials:${userId}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let body: { leadId?: string; saleValue?: number; amountPaid?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const saleValue = Number(body.saleValue);
  const amountPaid = Number(body.amountPaid);
  if (!body.leadId) return NextResponse.json({ ok: false, error: 'missing_lead' }, { status: 400 });
  if (!Number.isFinite(saleValue) || saleValue < 0 || saleValue > 100_000_000) return NextResponse.json({ ok: false, error: 'invalid_sale_value' }, { status: 400 });
  if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > 100_000_000) return NextResponse.json({ ok: false, error: 'invalid_amount_paid' }, { status: 400 });

  const admin = createServiceClient();

  // Authorize: seller who owns the lead, or admin/super_admin/hr.
  const { data: lead } = await admin.from('student_leads').select('id, assigned_seller').eq('id', body.leadId).maybeSingle();
  if (!lead) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  let allowed = lead.assigned_seller === userId;
  if (!allowed) {
    const { data: p } = await admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', userId).single();
    allowed = p?.role === 'admin' || p?.role === 'super_admin' || p?.role === 'hr' || p?.is_admin === true || p?.is_super_admin === true;
  }
  if (!allowed) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const { error } = await admin.from('student_leads')
    .update({ sale_value: saleValue, amount_paid: amountPaid, last_updated: new Date().toISOString() })
    .eq('id', body.leadId);
  if (error) return NextResponse.json({ ok: false, error: 'update_failed', message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, due: saleValue - amountPaid });
}
