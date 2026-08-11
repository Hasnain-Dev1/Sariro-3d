import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { findCourseById, flattenCourseLessons, resolveLessonAccess } from '@/lib/dashboard/lessons-data';
import { resolveViewerProgress } from '@/lib/dashboard/lessons-server';

/**
 * SARIRO — GET /api/lessons/content?courseId=&module=&index=
 *
 * Returns a single lesson page's HTML, but ONLY if the caller is allowed to see
 * it. The lesson_pages table is RLS-locked to admins, so this route is the one
 * door students and teachers use.
 *
 *   • Student → completed or current lesson of one of their active enrollments.
 *   • Teacher → eligible course, up to current+next of a cohort they teach.
 *   • Admin   → anything.
 */

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const courseId = String(url.searchParams.get('courseId') ?? '').trim();
  const moduleNum = parseInt(url.searchParams.get('module') ?? '', 10);
  const lessonIndex = parseInt(url.searchParams.get('index') ?? '', 10);

  const course = findCourseById(courseId);
  if (!course || !Number.isInteger(moduleNum) || !Number.isInteger(lessonIndex)) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const viewer = await resolveViewerProgress(courseId);
  if (!viewer) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  if (!viewer.authorizedForCourse) {
    return NextResponse.json({ ok: false, error: viewer.role === 'teacher' ? 'not_eligible' : 'not_enrolled' }, { status: 403 });
  }

  if (viewer.role !== 'admin') {
    const ordered = flattenCourseLessons(courseId);
    const resolved = resolveLessonAccess(ordered, viewer.completedKeys, viewer.role);
    const hit = resolved.find((l) => l.module_num === moduleNum && l.lesson_index === lessonIndex);
    if (!hit) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    if (!hit.viewable) return NextResponse.json({ ok: false, error: 'locked', access: hit.access }, { status: 403 });
  }

  const admin = createServiceClient();
  const { data: page, error } = await admin.from('lesson_pages')
    .select('course_id, module_num, lesson_index, lesson_name, title, html_content, published')
    .eq('course_id', courseId).eq('module_num', moduleNum).eq('lesson_index', lessonIndex)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500 });
  if (!page || page.published === false) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, page });
}
