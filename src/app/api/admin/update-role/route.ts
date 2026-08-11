import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/admin/update-role
 * Body: { userId, newRole }
 *
 * Uses SERVICE ROLE to bypass RLS — the browser client can't update
 * other users' profiles (RLS only allows updating own profile).
 */

export const runtime = 'nodejs';

interface UpdateRoleBody {
  userId?: string;
  newRole?: 'student' | 'teacher' | 'seller' | 'hr' | 'admin' | 'super_admin';
  website?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `update-role:${requestIp}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: UpdateRoleBody;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.userId || !body.newRole) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });

  const validRoles = ['student', 'teacher', 'seller', 'hr', 'admin', 'super_admin'];
  if (!validRoles.includes(body.newRole)) return NextResponse.json({ ok: false, error: 'invalid_role' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (!['admin', 'super_admin'].includes(role)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  // Escalation guardrail: only a super-admin may grant staff/elevated roles
  // (hr, admin, super_admin). Plain admins can only assign student/teacher/seller.
  const STAFF_ROLES = ['hr', 'admin', 'super_admin'];
  if (STAFF_ROLES.includes(body.newRole) && role !== 'super_admin') {
    return NextResponse.json({ ok: false, error: 'forbidden_staff_grant', message: 'Only a super-admin can set HR, Admin, or Super Admin roles.' }, { status: 403 });
  }

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  const patch = {
    role: body.newRole,
    is_student: body.newRole === 'student',
    is_teacher: body.newRole === 'teacher',
    is_seller: body.newRole === 'seller',
    is_hr: body.newRole === 'hr',
    is_admin: body.newRole === 'admin' || body.newRole === 'super_admin',
    is_super_admin: body.newRole === 'super_admin',
  };

  const { error } = await admin.from('profiles').update(patch).eq('id', body.userId);
  if (error) {
    console.warn('[update-role] error:', error.message);
    return NextResponse.json({ ok: false, error: 'update_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}