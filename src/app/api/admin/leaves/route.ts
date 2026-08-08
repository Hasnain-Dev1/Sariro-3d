import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/admin/leaves
 * Admin-only endpoint for leave approval/rejection.
 * Teachers get 12 free leaves; subsequent leaves cost ₹1000 each.
 */

export const runtime = 'nodejs';

interface LeaveBody {
  action?: 'approve' | 'reject';
  leave_id?: string;
  notes?: string;
  override_penalty?: boolean; // HR/Admin can override ₹1000 penalty for valid reasons (medical)
  website?: string;
}

const FREE_LEAVES_LIMIT = 12;
const NON_FREE_LEAVE_PENALTY = 1000;

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `leaves:${requestIp}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: LeaveBody;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.action || !body.leave_id) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (!['admin', 'super_admin'].includes(role)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  // Fetch the leave
  const { data: leave, error: leaveErr } = await admin.from('teacher_leaves').select('*').eq('id', body.leave_id).maybeSingle();
  if (leaveErr || !leave) return NextResponse.json({ ok: false, error: 'leave_not_found' }, { status: 404 });

  try {
    if (body.action === 'approve') {
      // Count approved leaves for this teacher
      const { count } = await admin.from('teacher_leaves').select('*', { count: 'exact', head: true }).eq('teacher_id', leave.teacher_id).eq('status', 'approved');

      const approvedCount = count ?? 0;
      const isFree = approvedCount < FREE_LEAVES_LIMIT;
      const penaltyAmount = (isFree || body.override_penalty) ? 0 : NON_FREE_LEAVE_PENALTY;

      const { error } = await admin.from('teacher_leaves').update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        is_free: isFree,
        penalty_amount: penaltyAmount,
        notes: body.notes || (body.override_penalty ? 'Penalty overridden by admin' : undefined),
      }).eq('id', body.leave_id);

      if (error) throw error;

      // If there's a penalty, insert it as a negative earning
      if (penaltyAmount > 0) {
        await admin.from('teacher_earnings').insert({
          teacher_id: leave.teacher_id,
          class_date: leave.leave_date,
          lesson_name: 'Leave penalty',
          track: 'N/A',
          level: 'N/A',
          base_amount: 0,
          penalty_amount: -penaltyAmount,
          net_amount: -penaltyAmount,
          amount: -penaltyAmount,
          penalty_reason: `Excess leave (beyond ${FREE_LEAVES_LIMIT} free)`,
          status: 'pending',
        });
      }

      return NextResponse.json({ ok: true, is_free: isFree, penalty_amount: penaltyAmount });
    }

    if (body.action === 'reject') {
      const { error } = await admin.from('teacher_leaves').update({
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        notes: body.notes,
      }).eq('id', body.leave_id);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  } catch (err) {
    console.warn('[leaves] action error:', err);
    return NextResponse.json({ ok: false, error: 'action_failed', message: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}