/**
 * SARIRO — Student Dashboard v2 data layer
 *
 * Backs the rebuilt student experience:
 *   - Lesson progress tracking (mark/unmark per module + lesson)
 *   - Course syllabus lookup (track + level → ordered modules/lessons)
 *   - Cohort materials (per-cohort resource links)
 *   - Certificate data (for /certificate/[id] page)
 *   - Drop course (status → 'dropped')
 *
 * supabase client is created INSIDE each function (not at module level)
 * to avoid SSR issues — createBrowserClient must run in the browser only.
 */

import { createClient } from '@/lib/supabase/client';
import { COURSES, TRACKS } from '@/lib/sariro-data';

/* ───────────────────────────── Types ───────────────────────────── */

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LessonProgressRow {
  id: string;
  enrollment_id: string;
  module_num: string;
  lesson_name: string;
  completed_at: string;
}

export interface SyllabusModule {
  num: string;
  name: string;
  project: string;
  lessons: string[];
}

export interface CourseSyllabus {
  courseId: string;
  trackId: string;
  trackName: string;
  level: CourseLevel;
  title: string;
  totalLessons: number;
  modules: SyllabusModule[];
}

export interface CohortMaterial {
  id: string;
  cohort_id: string;
  title: string;
  url: string;
  kind: string | null;
  created_at: string;
}

export interface CertificateData {
  enrollment_id: string;
  student_name: string;
  student_email: string | null;
  track_id: string;
  track_name: string;
  level: CourseLevel;
  cohort_id: string | null;
  started_at: string | null;
  completed_at: string;
  certificate_number: string;
  founder_name: string;
  brand_name: string;
}

export interface ProgressSummary {
  totalLessons: number;
  completedLessons: number;
  percent: number;
  completedKeys: Set<string>; // `${moduleNum}::${lessonName}`
}

/* ─────────────────────── Helpers ─────────────────────── */

function normalizeLevel(level: string): CourseLevel {
  const lower = (level || '').toLowerCase();
  if (lower === 'intermediate' || lower === 'advanced') return lower;
  return 'beginner';
}

/** Builds the unique progress key used to dedupe lesson completion rows. */
export function progressKey(moduleNum: string, lessonName: string): string {
  return `${moduleNum}::${lessonName}`;
}

/* ─────────────────────── fetchLessonProgress ───────────────────────
   Returns ALL lesson_progress rows for a given enrollment, newest first. */
export async function fetchLessonProgress(enrollmentId: string): Promise<LessonProgressRow[]> {
  if (!enrollmentId) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('id, enrollment_id, module_num, lesson_name, completed_at')
      .eq('enrollment_id', enrollmentId)
      .order('completed_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as LessonProgressRow[];
  } catch (err) {
    console.warn('[student] fetchLessonProgress error:', err);
    return [];
  }
}

/* ─────────────────────── markLessonComplete ───────────────────────
   Idempotent — if a row already exists for (enrollment, module, lesson),
   we leave it alone. */
export async function markLessonComplete(
  enrollmentId: string,
  moduleNum: string,
  lessonName: string
): Promise<{ success: boolean; error?: string }> {
  if (!enrollmentId || !moduleNum || !lessonName) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('lesson_progress')
      .insert({
        enrollment_id: enrollmentId,
        module_num: moduleNum,
        lesson_name: lessonName,
      });

    if (error) {
      // 23505 = unique_violation — already marked, treat as success
      if (error.code === '23505') return { success: true };
      throw error;
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[student] markLessonComplete error:', err);
    return { success: false, error: msg };
  }
}

/* ─────────────────────── unmarkLesson ───────────────────────
   Removes the lesson_progress row for (enrollment, module, lesson). */
export async function unmarkLesson(
  enrollmentId: string,
  moduleNum: string,
  lessonName: string
): Promise<{ success: boolean; error?: string }> {
  if (!enrollmentId || !moduleNum || !lessonName) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('lesson_progress')
      .delete()
      .eq('enrollment_id', enrollmentId)
      .eq('module_num', moduleNum)
      .eq('lesson_name', lessonName);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[student] unmarkLesson error:', err);
    return { success: false, error: msg };
  }
}

/* ─────────────────────── calculateProgress ───────────────────────
   Pure function — given a track, level, and the list of completed lesson
   rows, returns a ProgressSummary used to render progress bars + counts. */
export function calculateProgress(
  track: string,
  level: CourseLevel | string,
  completedLessons: LessonProgressRow[]
): ProgressSummary {
  const syllabus = getCourseSyllabus(track, level);
  const completedKeys = new Set(
    (completedLessons ?? []).map((r) => progressKey(r.module_num, r.lesson_name))
  );
  const totalLessons = syllabus.totalLessons;
  const completedLessonsCount = syllabus.modules.reduce((sum, mod) => {
    return sum + mod.lessons.filter((lesson) => completedKeys.has(progressKey(mod.num, lesson))).length;
  }, 0);
  const percent = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  return {
    totalLessons,
    completedLessons: completedLessonsCount,
    percent,
    completedKeys,
  };
}

/* ─────────────────────── getCourseSyllabus ───────────────────────
   Looks up the matching COURSE entry by trackId + level. Falls back to
   the first course in the same track if an exact match isn't found. */
export function getCourseSyllabus(track: string, level: CourseLevel | string): CourseSyllabus {
  const normalizedLevel = normalizeLevel(level);
  const trackName = TRACKS.find((t) => t.id === track)?.name ?? track;

  const course =
    COURSES.find((c) => c.trackId === track && c.level.toLowerCase() === normalizedLevel) ??
    COURSES.find((c) => c.trackId === track);

  if (!course) {
    return {
      courseId: `${track}-${normalizedLevel}`,
      trackId: track,
      trackName,
      level: normalizedLevel,
      title: trackName,
      totalLessons: 0,
      modules: [],
    };
  }

  const modules: SyllabusModule[] = (course.syllabus ?? []).map((m) => ({
    num: m.num,
    name: m.name,
    project: m.project,
    lessons: m.lessons ?? [],
  }));

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return {
    courseId: course.id,
    trackId: course.trackId,
    trackName,
    level: normalizedLevel,
    title: course.title,
    totalLessons,
    modules,
  };
}

/* ─────────────────────── dropCourse ───────────────────────
   Marks an enrollment as 'dropped'. RLS guarantees the student owns the
   row — server-side enforcement is via the same RLS policy. */
export async function dropCourse(
  enrollmentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!enrollmentId) return { success: false, error: 'Missing enrollment id' };
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'dropped' })
      .eq('id', enrollmentId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[student] dropCourse error:', err);
    return { success: false, error: msg };
  }
}

/* ─────────────────────── fetchCohortMaterials ───────────────────────
   Returns all material links attached to a cohort (recordings, slides,
   worksheets, etc.). Newest first. */
export async function fetchCohortMaterials(cohortId: string): Promise<CohortMaterial[]> {
  if (!cohortId) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cohort_materials')
      .select('id, cohort_id, title, url, kind, created_at')
      .eq('cohort_id', cohortId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as CohortMaterial[];
  } catch (err) {
    console.warn('[student] fetchCohortMaterials error:', err);
    return [];
  }
}

/* ─────────────────────── fetchCertificateData ───────────────────────
   Builds the data needed to render /certificate/[enrollmentId].

   Verifies the enrollment exists, belongs to the requesting user (RLS),
   has status='completed', and joins the student's profile + cohort.

   Returns null if the enrollment isn't eligible for a certificate. */
export async function fetchCertificateData(
  enrollmentId: string
): Promise<CertificateData | null> {
  if (!enrollmentId) return null;
  try {
    const supabase = createClient();

    // 1. Fetch the enrollment — RLS guarantees ownership
    const { data: enrollment, error: enrollErr } = await supabase
      .from('enrollments')
      .select('id, user_id, track, level, cohort_id, started_at, completed_at, status')
      .eq('id', enrollmentId)
      .maybeSingle();

    if (enrollErr) throw enrollErr;
    if (!enrollment) return null;
    if (enrollment.status !== 'completed') return null;

    // 2. Fetch the student's profile (name + email)
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', enrollment.user_id)
      .maybeSingle();

    if (profileErr) throw profileErr;

    const trackName =
      TRACKS.find((t) => t.id === enrollment.track)?.name ?? enrollment.track;

    // 3. Build a deterministic certificate number (enrollment id is a UUID —
    // we use the first 8 chars + a year tag for a friendlier ID).
    const year = enrollment.completed_at
      ? new Date(enrollment.completed_at).getFullYear()
      : new Date().getFullYear();
    const shortId = (enrollment.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
    const certificateNumber = `SARIRO-${year}-${shortId}`;

    return {
      enrollment_id: enrollment.id,
      student_name: profile?.full_name ?? 'Sariro Student',
      student_email: profile?.email ?? null,
      track_id: enrollment.track,
      track_name: trackName,
      level: normalizeLevel(enrollment.level),
      cohort_id: enrollment.cohort_id ?? null,
      started_at: enrollment.started_at ?? null,
      completed_at: enrollment.completed_at ?? new Date().toISOString(),
      certificate_number: certificateNumber,
      founder_name: 'Mimo Patra',
      brand_name: 'Sariro',
    };
  } catch (err) {
    console.warn('[student] fetchCertificateData error:', err);
    return null;
  }
}
