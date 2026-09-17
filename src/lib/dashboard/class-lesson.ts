import { allLessonCourses, lessonCourseIdFor } from '@/lib/dashboard/lessons-data';
import { findLesson, lessonsOf, type PlannedLesson } from '@/lib/dashboard/lesson-plan';
import { getTrackName } from '@/lib/dashboard/upsell-engine';

/**
 * SARIRO — "Lesson 12 of 48 · Public Speaking · Grades 1–3", for any class
 * ============================================================================
 * The founder, 17 Sep 2026: a teacher's calendar and next-class card said
 * "Public Speaking, 5pm" and nothing else. With several batches of the same
 * subject at different ages, the teacher could not tell which lesson was due or
 * which age group it was for without opening the lesson plan and counting.
 *
 * One answer for every screen: the lesson number and name, the course's own
 * name (which carries the grade or age group), and a link that opens that exact
 * lesson. Reads the lesson stamped on the booking; a class not stamped yet can
 * be given its position in the batch as a fallback.
 */

export interface ClassLesson {
  /** 1-based in the course, or null when the class has no lesson (revision, trial, unknown course). */
  number: number | null;
  total: number;
  name: string | null;
  /** "Public Speaking · Grades 1–3", "Mathematics · Grade 7". */
  courseTitle: string;
  courseId: string | null;
  /** Opens this lesson in the teacher's lesson browser. */
  href: string | null;
}

const lessonCache = new Map<string, PlannedLesson[]>();
let titleCache: Map<string, string> | null = null;

function lessonsCached(track: string, level: string): PlannedLesson[] {
  const key = `${track}::${level}`;
  let hit = lessonCache.get(key);
  if (!hit) { hit = lessonsOf(track, level); lessonCache.set(key, hit); }
  return hit;
}

export function courseTitleOf(track: string, level: string): string {
  if (!titleCache) titleCache = new Map(allLessonCourses().map((c) => [c.id, c.title]));
  const id = lessonCourseIdFor(track, level);
  return (id && titleCache.get(id)) || `${getTrackName(track)} · ${level}`;
}

export function lessonHref(lesson: Pick<PlannedLesson, 'courseId' | 'module' | 'lessonIndex'>): string {
  return `/dashboard/teacher/lessons?course=${encodeURIComponent(lesson.courseId)}&module=${lesson.module}&index=${lesson.lessonIndex}`;
}

export function classLessonOf(
  booking: { cohort_track: string; cohort_level: string; module_num: string | null; lesson_name: string | null },
  fallbackNumber: number | null = null
): ClassLesson {
  const track = booking.cohort_track ?? '';
  const level = booking.cohort_level ?? '';
  const lessons = track && level ? lessonsCached(track, level) : [];
  const courseId = track && level ? lessonCourseIdFor(track, level) : null;
  const found =
    findLesson(lessons, booking.module_num, booking.lesson_name) ??
    (!booking.lesson_name && fallbackNumber ? lessons[fallbackNumber - 1] ?? null : null);
  return {
    number: found?.number ?? null,
    total: lessons.length,
    name: found?.name ?? booking.lesson_name ?? null,
    courseTitle: track ? courseTitleOf(track, level) : 'Class',
    courseId,
    href: found ? lessonHref(found) : courseId ? `/dashboard/teacher/lessons?course=${encodeURIComponent(courseId)}` : null,
  };
}

/**
 * Each class's place in its batch, for classes not stamped with a lesson yet:
 * the Nth real class (scheduled or completed, in date order) is the Nth lesson.
 */
export function batchPositions(bookings: readonly { id: string; cohort_id: string | null; status: string; slot_start: string; is_trial?: boolean }[]): Map<string, number> {
  const byCohort = new Map<string, { id: string; at: number }[]>();
  for (const b of bookings) {
    if (!b.cohort_id || b.is_trial || (b.status !== 'scheduled' && b.status !== 'completed')) continue;
    const list = byCohort.get(b.cohort_id) ?? [];
    list.push({ id: b.id, at: Date.parse(b.slot_start) });
    byCohort.set(b.cohort_id, list);
  }
  const out = new Map<string, number>();
  for (const list of byCohort.values()) {
    list.sort((a, b) => a.at - b.at).forEach((x, i) => out.set(x.id, i + 1));
  }
  return out;
}
