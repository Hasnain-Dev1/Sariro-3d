import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/admin/update-student-name
 * Body: { userId, fullName?, nameLocked? }
 *
 * Lets an admin / super-admin rename a student and (optionally) lock or unlock
 * the student's ability to change their own name from Settings.
 *
 * Uses the SERVICE ROLE to write another user's profile row (RLS only lets a
 * user update their OWN profile). Gated server-side to admin / super-admin —
 * a plain student calling this is rejected with 403.
 *
 * Security posture:
 *   - Same-origin (CSRF) check + IP blocklist + per-caller rate limit.
 *   - Auth required; caller role resolved from THEIR OWN profile row, never
 *     trusted from the request body.
 *   - Target must be an actual student account (role student / is_student /
 *     unassigned default) — staff accounts can't be renamed through this
 *     student-management endpoint.
 *   - full_name is validated + length-capped + trimmed before writing.
 */
export const runtime = 'nodejs';

interface Body {
  userId?: string;
  fullName?: string;
  nameLocked?: boolean;
  website?: string; // honeypot
}

const MAX_NAME_LEN = 80;

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `update-student-name:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true }); // honeypot: silently accept, do nothing
  if (!body.userId) return NextResponse.json({ ok: false, error: 'missing_user' }, { status: 400 });
  if (body.fullName === undefined && body.nameLocked === undefined) {
    return NextResponse.json({ ok: false, error: 'nothing_to_update' }, { status: 400 });
  }

  // ── Auth: caller must be signed in ──
  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  // ── Authorization: caller must be admin / super-admin (from their OWN row) ──
  const { data: me } = await supabase.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const callerRole = me?.role ?? (me?.is_super_admin ? 'super_admin' : me?.is_admin ? 'admin' : 'student');
  if (!['admin', 'super_admin'].includes(callerRole)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  // ── Target must be a student account (not staff) ──
  const { data: target } = await admin.from('profiles').select('id, role, is_student, is_teacher, is_admin, is_super_admin').eq('id', body.userId).maybeSingle();
  if (!target) return NextResponse.json({ ok: false, error: 'user_not_found' }, { status: 404 });
  const targetIsStudent = target.is_student || target.role === 'student' || (!target.role && !target.is_teacher && !target.is_admin && !target.is_super_admin);
  if (!targetIsStudent) {
    return NextResponse.json({ ok: false, error: 'not_a_student', message: 'This endpoint only manages student accounts.' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (body.fullName !== undefined) {
    const name = String(body.fullName).trim();
    if (name.length === 0) return NextResponse.json({ ok: false, error: 'empty_name', message: 'Name cannot be empty.' }, { status: 400 });
    if (name.length > MAX_NAME_LEN) return NextResponse.json({ ok: false, error: 'name_too_long', message: `Name must be ${MAX_NAME_LEN} characters or fewer.` }, { status: 400 });
    patch.full_name = name;
  }
  if (body.nameLocked !== undefined) {
    patch.name_locked = !!body.nameLocked;
  }

  const { error } = await admin.from('profiles').update(patch).eq('id', body.userId);
  if (error) {
    return NextResponse.json({ ok: false, error: 'update_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
