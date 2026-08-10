import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/hr
 * HR-only endpoint for: incentive management, credit adjustments, tier changes, payment status
 * Body: { action, ... }
 */

export const runtime = 'nodejs';

interface HRBody {
  action?: 'approve_incentive' | 'reject_incentive' | 'edit_incentive' | 'delete_incentive' | 'adjust_credits' | 'set_teacher_tier' | 'set_student_tier' | 'update_payment_status';
  incentive_id?: string;
  teacher_id?: string;
  student_id?: string;
  amount?: number;
  reason?: string;
  tier?: number;
  student_tier?: string;
  settlement_id?: string;
  payment_status?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `hr:${requestIp}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: HRBody;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.action) return NextResponse.json({ ok: false, error: 'missing_action' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (!['hr', 'admin', 'super_admin'].includes(role)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  try {
    switch (body.action) {
      // ── INCENTIVE MANAGEMENT ──
      case 'approve_incentive': {
        if (!body.incentive_id) return NextResponse.json({ ok: false, error: 'missing_incentive_id' }, { status: 400 });
        // Read first so we only pay out once (skip if already approved).
        const { data: inc } = await admin.from('teacher_incentives').select('id, teacher_id, amount, reason, status').eq('id', body.incentive_id).maybeSingle();
        if (!inc) return NextResponse.json({ ok: false, error: 'incentive_not_found' }, { status: 404 });
        const { error } = await admin.from('teacher_incentives').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', body.incentive_id);
        if (error) throw error;
        // Reflect the approved incentive in the teacher's PENDING PAYOUT as a
        // positive earning (only when transitioning INTO approved).
        if (inc.status !== 'approved') {
          const amt = Number(inc.amount) || 0;
          await admin.from('teacher_earnings').insert({
            teacher_id: inc.teacher_id, booking_id: null, class_date: new Date().toISOString(),
            lesson_name: `Incentive: ${(inc.reason ?? '').slice(0, 80)}`,
            student_count: 0, base_amount: amt, bonus_amount: 0, penalty_amount: 0,
            net_amount: amt, amount: amt, status: 'pending',
          });
        }
        return NextResponse.json({ ok: true });
      }
      case 'reject_incentive': {
        if (!body.incentive_id) return NextResponse.json({ ok: false, error: 'missing_incentive_id' }, { status: 400 });
        const { error } = await admin.from('teacher_incentives').update({ status: 'rejected', approved_by: user.id, approved_at: new Date().toISOString(), notes: body.reason }).eq('id', body.incentive_id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'edit_incentive': {
        if (!body.incentive_id || !body.amount || !body.reason) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
        const { error } = await admin.from('teacher_incentives').update({ amount: body.amount, reason: body.reason, notes: body.reason }).eq('id', body.incentive_id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }
      case 'delete_incentive': {
        if (!body.incentive_id) return NextResponse.json({ ok: false, error: 'missing_incentive_id' }, { status: 400 });
        const { error } = await admin.from('teacher_incentives').update({ status: 'deleted' }).eq('id', body.incentive_id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      // ── CREDIT ADJUSTMENT ──
      case 'adjust_credits': {
        if (!body.student_id || !body.amount || !body.reason) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
        // Ensure credits row exists
        await admin.from('credits').upsert({ user_id: body.student_id, balance: 0 }, { onConflict: 'user_id' });
        // Update balance
        const { data: current } = await admin.from('credits').select('balance').eq('user_id', body.student_id).maybeSingle();
        const newBalance = (current?.balance ?? 0) + body.amount;
        await admin.from('credits').update({ balance: newBalance }).eq('user_id', body.student_id);
        // Insert transaction
        await admin.from('credit_transactions').insert({ user_id: body.student_id, amount: body.amount, type: 'admin_adjustment', description: body.reason, created_by: user.id });
        return NextResponse.json({ ok: true, new_balance: newBalance });
      }

      // ── TEACHER TIER ──
      case 'set_teacher_tier': {
        if (!body.teacher_id || ![1, 2, 3].includes(body.tier ?? 0)) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
        const { error } = await admin.from('profiles').update({ teacher_tier: body.tier }).eq('id', body.teacher_id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      // ── STUDENT TIER ──
      case 'set_student_tier': {
        if (!body.student_id || !body.student_tier) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
        const { error } = await admin.from('profiles').update({ student_tier: body.student_tier }).eq('id', body.student_id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      // ── PAYMENT STATUS ──
      case 'update_payment_status': {
        if (!body.settlement_id || !body.payment_status) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
        const validStatuses = ['not_settled', 'teacher_settled', 'admin_settled', 'processing', 'paid'];
        if (!validStatuses.includes(body.payment_status)) return NextResponse.json({ ok: false, error: 'invalid_status' }, { status: 400 });
        const updates: Record<string, unknown> = { payment_status: body.payment_status };
        if (body.payment_status === 'paid') { updates.paid_at = new Date().toISOString(); updates.status = 'paid'; }
        if (body.payment_status === 'admin_settled') { updates.approved_by = user.id; updates.approved_at = new Date().toISOString(); }
        const { error } = await admin.from('teacher_settlements').update(updates).eq('id', body.settlement_id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
    }
  } catch (err) {
    console.warn('[hr] action error:', err);
    return NextResponse.json({ ok: false, error: 'action_failed', message: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
