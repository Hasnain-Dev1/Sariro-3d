import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { TRACKS } from '@/lib/sariro-data';

export const runtime = 'nodejs';

const VALID_LEVELS = ['Elementary', 'Beginner', 'Intermediate', 'Advanced'];
const VALID_TRACKS: string[] = TRACKS.map((t) => t.id);

interface AssignBody {
  action?: 'assign' | 'remove';
  teacher_id?: string;
  track?: string;
  level?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `teacher-assignments:${requestIp}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: AssignBody;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.action || !body.teacher_id || !body.track || !body.level) return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 });
  if (!VALID_TRACKS.includes(body.track)) return NextResponse.json({ ok: false, error: 'invalid_track' }, { status: 400 });
  if (!VALID_LEVELS.includes(body.level)) return NextResponse.json({ ok: false, error: 'invalid_level' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (role !== 'admin' && role !== 'super_admin') return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable', message: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 503 }); }

  const { data: teacherProfile } = await admin.from('profiles').select('id, role, is_teacher').eq('id', body.teacher_id).maybeSingle();
  if (!teacherProfile) return NextResponse.json({ ok: false, error: 'teacher_not_found' }, { status: 404 });
  // Accept either a 'teacher' role OR the is_teacher flag — a profile can carry
  // is_teacher=true while its primary role says something else.
  const isTeacher = teacherProfile.role === 'teacher' || teacherProfile.is_teacher === true;
  if (!isTeacher) return NextResponse.json({ ok: false, error: 'not_a_teacher' }, { status: 400 });

  try {
    if (body.action === 'assign') {
      const { error: insertErr } = await admin.from('teacher_course_assignments').upsert({ teacher_id: body.teacher_id, track: body.track, level: body.level, assigned_by: user.id }, { onConflict: 'teacher_id,track,level' });
      if (insertErr) return NextResponse.json({ ok: false, error: 'insert_failed', message: insertErr.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'remove') {
      const { error: deleteErr } = await admin.from('teacher_course_assignments').delete().eq('teacher_id', body.teacher_id).eq('track', body.track).eq('level', body.level);
      if (deleteErr) return NextResponse.json({ ok: false, error: 'delete_failed', message: deleteErr.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  } catch (err) {
    console.warn('[teacher-assignments] action error:', err);
    return NextResponse.json({ ok: false, error: 'action_failed', message: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}