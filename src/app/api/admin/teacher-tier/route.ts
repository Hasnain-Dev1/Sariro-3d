import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/admin/teacher-tier  (SUPER-ADMIN only)
 * Body: { teacherId, tier (1|2|3) }
 *
 * Sets profiles.teacher_tier, which drives the per-tier pay rate the earnings
 * trigger reads from app_settings.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `teacher-tier:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: { teacherId?: string; tier?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const tier = Number(body.tier);
  if (!body.teacherId || ![1, 2, 3].includes(tier)) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user.id).maybeSingle();
  const isSuper = profile?.role === 'super_admin' || profile?.is_super_admin === true;
  if (!isSuper) return NextResponse.json({ ok: false, error: 'forbidden', message: 'Only a super-admin can set teacher tiers.' }, { status: 403 });

  const admin = createServiceClient();
  const { error } = await admin.from('profiles').update({ teacher_tier: tier }).eq('id', body.teacherId);
  if (error) return NextResponse.json({ ok: false, error: 'update_failed', message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
