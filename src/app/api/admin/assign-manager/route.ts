import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/admin/assign-manager  (super_admin only)
 *
 * Sets a teacher's reporting Admin or reporting HR.
 * Body: { teacherId, field: 'admin' | 'hr', managerId: string | null }
 * (managerId null clears the assignment.)
 */
export const runtime = 'nodejs';

interface Body { teacherId?: string; field?: 'admin' | 'hr'; managerId?: string | null }

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

  const admin = createServiceClient();
  const { data: p } = await admin.from('profiles').select('role, is_super_admin').eq('id', userId).single();
  const isSuper = p?.role === 'super_admin' || p?.is_super_admin === true;
  if (!isSuper) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `assign-manager:${userId}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (!body.teacherId || (body.field !== 'admin' && body.field !== 'hr')) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
  }
  const managerId = body.managerId || null;

  // If setting (not clearing), verify the manager has the right role.
  if (managerId) {
    const { data: m } = await admin.from('profiles').select('role, is_admin, is_hr').eq('id', managerId).maybeSingle();
    if (!m) return NextResponse.json({ ok: false, error: 'manager_not_found' }, { status: 404 });
    const ok = body.field === 'admin'
      ? (m.role === 'admin' || m.role === 'super_admin' || m.is_admin === true)
      : (m.role === 'hr' || m.is_hr === true);
    if (!ok) return NextResponse.json({ ok: false, error: 'wrong_manager_role' }, { status: 400 });
  }

  const column = body.field === 'admin' ? 'reporting_admin_id' : 'reporting_hr_id';
  const { error } = await admin.from('profiles').update({ [column]: managerId }).eq('id', body.teacherId);
  if (error) return NextResponse.json({ ok: false, error: 'update_failed', message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
