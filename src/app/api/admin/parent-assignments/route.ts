import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { TRACKS } from '@/lib/sariro-data';

/**
 * SARIRO — POST /api/admin/parent-assignments  (SUPER-ADMIN only)
 *
 * Grant/revoke course eligibility for a PARENT. Assigning also flags the
 * profile is_parent = true so the account is recognised as a parent.
 *
 * Body: { action: 'assign' | 'remove', parent_id, track, level }
 */
export const runtime = 'nodejs';

const VALID_LEVELS = ['Elementary', 'Beginner', 'Intermediate', 'Advanced'];
const VALID_TRACKS: string[] = TRACKS.map((t) => t.id);

interface Body {
  action?: 'assign' | 'remove';
  parent_id?: string;
  track?: string;
  level?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `parent-assign:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.action || !body.parent_id || !body.track || !body.level) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  if (!VALID_TRACKS.includes(body.track)) return NextResponse.json({ ok: false, error: 'invalid_track' }, { status: 400 });
  if (!VALID_LEVELS.includes(body.level)) return NextResponse.json({ ok: false, error: 'invalid_level' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user.id).maybeSingle();
  const isSuper = profile?.role === 'super_admin' || profile?.is_super_admin === true;
  if (!isSuper) return NextResponse.json({ ok: false, error: 'forbidden', message: 'Only a super-admin can assign parent eligibility.' }, { status: 403 });

  const admin = createServiceClient();

  if (body.action === 'assign') {
    const { error } = await admin.from('parent_course_assignments')
      .upsert({ parent_id: body.parent_id, track: body.track, level: body.level, assigned_by: user.id }, { onConflict: 'parent_id,track,level' });
    if (error) return NextResponse.json({ ok: false, error: 'assign_failed', message: error.message }, { status: 500 });
    await admin.from('profiles').update({ is_parent: true }).eq('id', body.parent_id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'remove') {
    const { error } = await admin.from('parent_course_assignments')
      .delete().eq('parent_id', body.parent_id).eq('track', body.track).eq('level', body.level);
    if (error) return NextResponse.json({ ok: false, error: 'remove_failed', message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
}
