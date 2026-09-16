/**
 * SARIRO — Lesson access: server-side viewer + progress resolution
 * ================================================================
 * Shared by /api/lessons/* routes. Figures out who is calling, their role, and
 * their completed-key set for a given course (student = own progress; teacher =
 * taught bookings for cohorts of that course). Keeps the DB shape in one place.
 */

import 'server-only';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { findCourseById, progressKey, type ViewerRole } from '@/lib/dashboard/lessons-data';
import { bandOfCourseId, bandOfLevel, isSpeakingCourseId, SPEAKING_TRACK_SLUG } from '@/lib/speaking/bands';
import { activeSpeakingBand } from '@/lib/speaking/access';

export interface ViewerProgress {
  userId: string;
  role: ViewerRole;
  /** Present for student/teacher; empty for admin (admin sees all regardless). */
  completedKeys: Set<string>;
  /** false when a student isn't enrolled / a teacher isn't eligible for the course. */
  authorizedForCourse: boolean;
}

export async function resolveViewerProgress(courseId: string): Promise<ViewerProgress | null> {
  let supa;
  try { supa = await createServerClientHelper(); } catch { return null; }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;

  const admin = createServiceClient();
  const { data: p } = await admin.from('profiles')
    .select('role, is_admin, is_super_admin, is_teacher').eq('id', user.id).single();
  const isAdmin = p?.role === 'admin' || p?.role === 'super_admin' || p?.is_admin || p?.is_super_admin;
  const isTeacher = p?.role === 'teacher' || p?.is_teacher;
  const role: ViewerRole = isAdmin ? 'admin' : isTeacher ? 'teacher' : 'student';

  const completedKeys = new Set<string>();

  /* Public Speaking is five band courses. A learner reads only the course of
     their current band — the most recent enrolment — and a teacher only the
     bands they are approved for (an approval from before the bands covers
     all five). An admin reads everything. */
  if (role !== 'admin' && isSpeakingCourseId(courseId)) {
    const courseBand = bandOfCourseId(courseId);
    if (role === 'student') {
      const [{ data: enr }, { data: me }] = await Promise.all([
        admin.from('enrollments').select('track, status, level, created_at')
          .eq('user_id', user.id).eq('track', SPEAKING_TRACK_SLUG).in('status', ['active', 'completed']),
        admin.from('profiles').select('grade').eq('id', user.id).maybeSingle(),
      ]);
      const rows = (enr ?? []) as { track: string; status: string; level: string | null; created_at: string | null }[];
      const band = activeSpeakingBand(rows, (me?.grade as number | null | undefined) ?? null);
      const authorized = !!band && (courseBand ? courseBand === band : rows.some((r) => (r.level ?? '').toLowerCase() === 'focus'));
      return { userId: user.id, role, completedKeys, authorizedForCourse: authorized };
    }
    const { data: approvals } = await admin.from('teacher_course_assignments')
      .select('level').eq('teacher_id', user.id).eq('track', SPEAKING_TRACK_SLUG);
    const levels = ((approvals ?? []) as { level: string | null }[]).map((a) => (a.level ?? '').toLowerCase());
    const authorized = levels.some((l) => l === 'focus' || !courseBand || bandOfLevel(l) === courseBand);
    return { userId: user.id, role, completedKeys, authorizedForCourse: authorized };
  }

  const course = findCourseById(courseId);
  if (role === 'admin' || !course) {
    return { userId: user.id, role, completedKeys, authorizedForCourse: true };
  }

  if (role === 'student') {
    const { data: enr } = await admin.from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('track', course.trackId)
      .ilike('level', course.level)
      .in('status', ['active', 'completed']);
    const enrollmentIds = (enr ?? []).map((e: { id: string }) => e.id);
    if (enrollmentIds.length === 0) {
      return { userId: user.id, role, completedKeys, authorizedForCourse: false };
    }
    const { data: prog } = await admin.from('lesson_progress')
      .select('module_num, lesson_name').in('enrollment_id', enrollmentIds);
    for (const r of prog ?? []) completedKeys.add(progressKey(String(r.module_num), r.lesson_name as string));
    return { userId: user.id, role, completedKeys, authorizedForCourse: true };
  }

  // teacher
  const { data: elig } = await admin.from('teacher_course_assignments')
    .select('id').eq('teacher_id', user.id)
    .eq('track', course.trackId).ilike('level', course.level).maybeSingle();
  if (!elig) {
    return { userId: user.id, role, completedKeys, authorizedForCourse: false };
  }
  const { data: cohorts } = await admin.from('cohorts')
    .select('id').eq('track', course.trackId).ilike('level', course.level);
  const cohortIds = (cohorts ?? []).map((c: { id: string }) => c.id);
  if (cohortIds.length > 0) {
    const { data: taught } = await admin.from('bookings')
      .select('module_num, lesson_name')
      .eq('teacher_id', user.id)
      .eq('status', 'completed')
      .in('cohort_id', cohortIds)
      .not('lesson_name', 'is', null);
    for (const b of taught ?? []) {
      if (b.module_num != null && b.lesson_name) completedKeys.add(progressKey(String(b.module_num), b.lesson_name as string));
    }
  }
  return { userId: user.id, role, completedKeys, authorizedForCourse: true };
}
