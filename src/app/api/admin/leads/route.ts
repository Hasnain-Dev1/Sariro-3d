import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

export const runtime = 'nodejs';

interface LeadsBody {
  action?: 'assign_seller' | 'update_stage';
  lead_id?: string;
  seller_id?: string;
  new_stage?: string;
  note?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `leads:${requestIp}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: LeadsBody;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.action || !body.lead_id) return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (role !== 'admin' && role !== 'super_admin') return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable', message: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 503 }); }

  const { data: lead, error: leadErr } = await admin.from('student_leads').select('id, stage, assigned_seller, student_name').eq('id', body.lead_id).maybeSingle();
  if (leadErr || !lead) return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });

  try {
    if (body.action === 'assign_seller') {
      if (!body.seller_id) return NextResponse.json({ ok: false, error: 'missing_seller_id' }, { status: 400 });
      const { data: sellerProfile } = await admin.from('profiles').select('id, role, is_admin').eq('id', body.seller_id).maybeSingle();
      if (!sellerProfile) return NextResponse.json({ ok: false, error: 'seller_not_found' }, { status: 404 });
      const sellerRole = sellerProfile.role ?? (sellerProfile.is_admin ? 'admin' : 'student');
      if (sellerRole !== 'admin' && sellerRole !== 'super_admin') return NextResponse.json({ ok: false, error: 'not_a_seller' }, { status: 400 });

      const oldSeller = lead.assigned_seller;
      const isReassignment = oldSeller !== null;
      const newStage = lead.stage === 'new' ? 'seller_assigned' : lead.stage;
      const { error: updateErr } = await admin.from('student_leads').update({ assigned_seller: body.seller_id, stage: newStage }).eq('id', body.lead_id);
      if (updateErr) throw updateErr;

      await admin.from('lead_history').insert({ lead_id: body.lead_id, action: isReassignment ? 'seller_changed' : 'seller_assigned', old_value: oldSeller, new_value: body.seller_id, performed_by: user.id, performed_by_role: role, notes: isReassignment ? `Seller changed from ${oldSeller} to ${body.seller_id}` : `Seller assigned: ${body.seller_id}` });
      if (newStage !== lead.stage) await admin.from('lead_history').insert({ lead_id: body.lead_id, action: 'stage_changed', old_value: lead.stage, new_value: newStage, performed_by: user.id, performed_by_role: role, notes: 'Auto-moved to seller_assigned on seller assignment' });

      return NextResponse.json({ ok: true, new_stage: newStage });
    }

    if (body.action === 'update_stage') {
      const validStages = ['new', 'seller_assigned', 'connected', 'gathering_booked', 'final', 'deferred', 'enrolled'];
      if (!body.new_stage || !validStages.includes(body.new_stage)) return NextResponse.json({ ok: false, error: 'invalid_stage' }, { status: 400 });
      const oldStage = lead.stage;
      if (oldStage === body.new_stage) return NextResponse.json({ ok: true, message: 'no_change' });

      const { error: updateErr } = await admin.from('student_leads').update({ stage: body.new_stage }).eq('id', body.lead_id);
      if (updateErr) throw updateErr;
      await admin.from('lead_history').insert({ lead_id: body.lead_id, action: 'stage_changed', old_value: oldStage, new_value: body.new_stage, performed_by: user.id, performed_by_role: role, notes: body.note || `Stage changed from ${oldStage} to ${body.new_stage}` });

      return NextResponse.json({ ok: true, new_stage: body.new_stage });
    }

    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  } catch (err) {
    console.warn('[leads] action error:', err);
    return NextResponse.json({ ok: false, error: 'action_failed', message: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}