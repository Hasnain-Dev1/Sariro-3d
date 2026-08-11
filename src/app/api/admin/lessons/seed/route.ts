import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { flattenCourseLessons, findCourseById } from '@/lib/dashboard/lessons-data';

/**
 * SARIRO — POST /api/admin/lessons/seed
 *
 * Admin/super-admin only. Bulk-creates one lesson_pages row per lesson of a
 * course, seeded with empty HTML (just an <h1> of the lesson name). Idempotent:
 * existing pages are left untouched (ignoreDuplicates), so re-running only fills
 * gaps and never clobbers edited content.
 *
 * Body: { courseId }
 */

export const runtime = 'nodejs';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function requireAdmin(): Promise<{ userId: string } | null> {
  let supa;
  try { supa = await createServerClientHelper(); } catch { return null; }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;
  const admin = createServiceClient();
  const { data: profile } = await admin
    .from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).single();
  const ok = profile?.role === 'admin' || profile?.role === 'super_admin' ||
    profile?.is_admin === true || profile?.is_super_admin === true;
  return ok ? { userId: user.id } : null;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `lessons-seed:${auth.userId}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: { courseId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const courseId = String(body.courseId ?? '').trim();
  if (!courseId || !findCourseById(courseId)) {
    return NextResponse.json({ ok: false, error: 'unknown_course' }, { status: 400 });
  }

  const ordered = flattenCourseLessons(courseId);
  if (ordered.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_lessons' }, { status: 400 });
  }

  const rows = ordered.map((l) => ({
    course_id: courseId,
    module_num: l.module_num,
    lesson_index: l.lesson_index,
    lesson_name: l.lesson_name,
    title: l.lesson_name,
    html_content: `<h1>${escapeHtml(l.lesson_name)}</h1>`,
    published: true,
  }));

  const admin = createServiceClient();
  const { error } = await admin
    .from('lesson_pages')
    .upsert(rows, { onConflict: 'course_id,module_num,lesson_index', ignoreDuplicates: true });

  if (error) {
    console.warn('[lessons/seed] error:', error.message);
    return NextResponse.json({ ok: false, error: 'seed_failed', message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, courseId, lessons: rows.length });
}
