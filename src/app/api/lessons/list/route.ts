import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { findCourseById, flattenCourseLessons, resolveLessonAccess } from '@/lib/dashboard/lessons-data';
import { resolveViewerProgress } from '@/lib/dashboard/lessons-server';

/**
 * SARIRO — GET /api/lessons/list?courseId=
 *
 * Returns the course's lessons in order, each tagged with the caller's access
 * state (completed | current | next | upcoming) and whether it's viewable.
 * Upcoming/locked lessons are returned WITHOUT content — just enough to render
 * a locked row. The actual HTML is fetched per-lesson via /api/lessons/content.
 */

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const courseId = String(url.searchParams.get('courseId') ?? '').trim();
  const course = findCourseById(courseId);
  if (!course) return NextResponse.json({ ok: false, error: 'unknown_course' }, { status: 400 });

  const viewer = await resolveViewerProgress(courseId);
  if (!viewer) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  if (!viewer.authorizedForCourse) {
    return NextResponse.json({ ok: false, error: viewer.role === 'teacher' ? 'not_eligible' : 'not_enrolled' }, { status: 403 });
  }

  const ordered = flattenCourseLessons(courseId);
  const resolved = resolveLessonAccess(ordered, viewer.completedKeys, viewer.role);

  return NextResponse.json({
    ok: true,
    courseId,
    title: course.title,
    role: viewer.role,
    lessons: resolved.map((l) => ({
      module_num: l.module_num,
      module_name: l.module_name,
      lesson_index: l.lesson_index,
      lesson_name: l.lesson_name,
      order: l.order,
      access: l.access,
      viewable: l.viewable,
    })),
  });
}
