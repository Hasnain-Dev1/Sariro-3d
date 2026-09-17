import { flattenCourseLessons, lessonCourseIdFor } from '@/lib/dashboard/lessons-data';

/**
 * SARIRO — which lesson a scheduled class is actually teaching
 * ============================================================================
 * Two problems, one answer.
 *
 * ── The batch scheduler never said ──────────────────────────────────────────
 * /api/admin/schedule generates a term's worth of bookings and wrote no lesson
 * on any of them. Every batch-scheduled booking in production has module_num
 * and lesson_name NULL, so no screen can name what is being taught — the
 * teacher's class list, the student's "Today:", the reminder email, all blank.
 *
 * ── And the scheduler could not choose where to start ───────────────────────
 * The lesson was derived from a count: the Nth booking is the Nth lesson. That
 * is right for a batch starting at the beginning and wrong for every other
 * case — a batch resuming after a break, a group that covered the first three
 * lessons in a bridge course, a re-run for children who joined late.
 *
 * So the sequence is computed here from an explicit starting point, and the
 * scheduler picks it.
 *
 * ── Every kind of course (17 Sep 2026) ──────────────────────────────────────
 * This read the coding catalogue only, so every school subject and all five
 * Public Speaking courses had no lessons at all — and every one of their
 * classes was scheduled with no lesson on it. It now reads the same flattened
 * course the lesson pages use (lessons-data), which knows all three kinds, and
 * keeps the assessment slots: a test is a class a teacher turns up to.
 */

export interface PlannedLesson {
  /** 1-based across the whole course, which is what a person counts in. */
  number: number;
  /** Kept as a string because that is what bookings.module_num stores. */
  moduleNum: string;
  name: string;
  /** Where the lesson page is: the course, the module number and the 0-based index in it. */
  courseId: string;
  module: number;
  lessonIndex: number;
}

/**
 * Every lesson in a course, flattened and numbered.
 *
 * Modules are a teaching structure, not a schedule. A scheduler thinking about
 * "start at lesson 9" does not want to work out that lesson 9 is module 3
 * lesson 1, and neither does anything else in this file.
 */
export function lessonsOf(track: string, level: string): PlannedLesson[] {
  const courseId = lessonCourseIdFor(track, level);
  if (!courseId) return [];
  return flattenCourseLessons(courseId).map((l, i) => ({
    number: i + 1,
    moduleNum: l.module_str,
    name: l.lesson_name,
    courseId,
    module: l.module_num,
    lessonIndex: l.lesson_index,
  }));
}

/**
 * The lesson for the Nth class of a run that starts at `startAt`.
 *
 * `index` is 0-based within the run: the first generated booking is index 0 and
 * teaches `startAt`.
 *
 * Returns null past the end of the course rather than wrapping or clamping. A
 * batch with more sessions than lessons is having revision classes, and
 * labelling those "Lesson 1" again would be worse than labelling them nothing.
 */
export function lessonForIndex(
  track: string,
  level: string,
  index: number,
  startAt = 1
): PlannedLesson | null {
  const all = lessonsOf(track, level);
  if (all.length === 0) return null;

  const start = Math.max(1, Math.min(all.length, Math.round(startAt || 1)));
  const wanted = start + Math.max(0, Math.round(index));
  return all[wanted - 1] ?? null;
}

/**
 * The lesson a booking was stamped with, found again in its course — so a class
 * can say "Lesson 12" and open that lesson's page. Matched on the module and the
 * name, because that is what a booking stores.
 */
export function findLesson(lessons: readonly PlannedLesson[], moduleNum: string | null | undefined, lessonName: string | null | undefined): PlannedLesson | null {
  if (!lessonName) return null;
  const mod = Number(moduleNum);
  return (
    lessons.find((l) => l.name === lessonName && (!Number.isFinite(mod) || mod === 0 || l.module === mod)) ??
    lessons.find((l) => l.name === lessonName) ??
    null
  );
}

/**
 * How many of a course a run starting here would actually cover.
 *
 * Shown next to the picker so "start at lesson 9" is visibly a decision about
 * how much of the course a batch gets, not a numbering preference.
 */
export function remainingFrom(track: string, level: string, startAt: number): number {
  const total = lessonsOf(track, level).length;
  if (total === 0) return 0;
  const start = Math.max(1, Math.min(total, Math.round(startAt || 1)));
  return total - start + 1;
}

/**
 * What a batch still needs to teach the whole course.
 *
 * Walks the batch's real classes in date order. A class already stamped with a
 * lesson sets the position (so a batch that started at lesson 9, or that a
 * cancellation moved along, keeps its numbering); an unstamped class takes the
 * next lesson. What is left after the last class is how many classes to add.
 *
 * `known` resolves a stamped class to its lesson number, or null when unstamped.
 */
export function planCourseFill<T>(
  classes: readonly T[],
  totalLessons: number,
  known: (c: T) => number | null
): { stamps: { item: T; number: number }[]; lastNumber: number; toAdd: number } {
  let cursor = 0;
  const stamps: { item: T; number: number }[] = [];
  for (const c of classes) {
    const n = known(c);
    if (n !== null) { cursor = n; continue; }
    cursor += 1;
    if (cursor <= totalLessons) stamps.push({ item: c, number: cursor });
  }
  return { stamps, lastNumber: cursor, toAdd: Math.max(0, totalLessons - cursor) };
}
