/**
 * SARIRO — Lesson pages: ordering + access resolution (pure, testable)
 * ====================================================================
 * Lesson content lives in the `lesson_pages` table as ONE page per lesson of a
 * course (per-course template, shared by every cohort). This module has NO
 * Supabase calls — it turns a course's static syllabus into a flat ordered list
 * and decides, from progress, which lessons a viewer may open:
 *
 *   • Student  → CURRENT + COMPLETED lessons only (never upcoming).
 *   • Teacher  → up to CURRENT + NEXT (past-taught, current, next) for an
 *                ELIGIBLE course; nothing further into the future.
 *   • Admin    → everything.
 *
 * The DB reads (enrollment, lesson_progress, eligibility) happen in the API
 * routes; the resolvers below take that data as plain inputs.
 */

import { COURSES } from '@/lib/sariro-data';
import { lessonName as extractLessonName } from '@/lib/capstones';

/* ───────────────────────────── Types ───────────────────────────── */

export interface OrderedLesson {
  module_num: number;     // 1-based (parsed from syllabus "01")
  module_str: string;     // original syllabus module key ("01") — matches lesson_progress.module_num
  module_name: string;
  lesson_index: number;   // 0-based within the module
  lesson_name: string;
  order: number;          // global 0-based order across the whole course
}

export type LessonAccess = 'completed' | 'current' | 'next' | 'upcoming' | 'locked';

export interface ResolvedLesson extends OrderedLesson {
  access: LessonAccess;
  /** Whether the given viewer may open this lesson's content. */
  viewable: boolean;
}

/* ─────────────────────── Flatten a course ─────────────────────── */

/** Find a course entry by its id (e.g. "python-elem"). */
export function findCourseById(courseId: string) {
  return COURSES.find((c) => c.id === courseId) ?? null;
}

/** Flatten a course's syllabus into a globally-ordered lesson list. */
export function flattenCourseLessons(courseId: string): OrderedLesson[] {
  const course = findCourseById(courseId);
  if (!course || !Array.isArray(course.syllabus)) return [];
  const out: OrderedLesson[] = [];
  let order = 0;
  for (const mod of course.syllabus) {
    const moduleStr = String(mod.num);
    const moduleNum = parseInt(moduleStr, 10) || out.length + 1;
    const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
    lessons.forEach((lesson, idx) => {
      out.push({
        module_num: moduleNum,
        module_str: moduleStr,
        module_name: mod.name,
        lesson_index: idx,
        lesson_name: extractLessonName(lesson as never),
        order: order++,
      });
    });
  }
  return out;
}

/* ─────────────────────── Progress → current index ─────────────────────── */

/** Progress key matching lesson_progress rows: `${module_num}::${lesson_name}`. */
export function progressKey(moduleStr: string, lessonName: string): string {
  return `${moduleStr}::${lessonName}`;
}

/**
 * Index (global order) of the CURRENT lesson = the first lesson, in order, that
 * has no completion row. If every lesson is complete, current = length (course
 * finished). Completed lessons are simply those with a row.
 */
export function currentLessonIndex(
  ordered: OrderedLesson[],
  completedKeys: Set<string>
): number {
  for (let i = 0; i < ordered.length; i++) {
    if (!completedKeys.has(progressKey(ordered[i].module_str, ordered[i].lesson_name))) {
      return i;
    }
  }
  return ordered.length;
}

/* ─────────────────────── Resolve access per viewer ─────────────────────── */

export type ViewerRole = 'student' | 'teacher' | 'admin';

/**
 * Tag every lesson with its access state for a viewer, and whether it's
 * viewable. `completedKeys` come from lesson_progress; for a teacher they
 * describe the cohort's taught progress, for a student their own.
 */
export function resolveLessonAccess(
  ordered: OrderedLesson[],
  completedKeys: Set<string>,
  role: ViewerRole
): ResolvedLesson[] {
  const current = currentLessonIndex(ordered, completedKeys);
  return ordered.map((l) => {
    const done = completedKeys.has(progressKey(l.module_str, l.lesson_name));
    let access: LessonAccess;
    if (done) access = 'completed';
    else if (l.order === current) access = 'current';
    else if (l.order === current + 1) access = 'next';
    else access = 'upcoming';

    let viewable: boolean;
    if (role === 'admin') viewable = true;
    else if (role === 'teacher') viewable = l.order <= current + 1; // past+current+next
    else viewable = done || access === 'current';                    // student: completed+current

    return { ...l, access, viewable };
  });
}

/** Convenience: can a specific (module,index) be viewed by this viewer? */
export function canViewLesson(
  courseId: string,
  moduleNum: number,
  lessonIndex: number,
  completedKeys: Set<string>,
  role: ViewerRole
): boolean {
  const ordered = flattenCourseLessons(courseId);
  const resolved = resolveLessonAccess(ordered, completedKeys, role);
  const hit = resolved.find((l) => l.module_num === moduleNum && l.lesson_index === lessonIndex);
  return !!hit?.viewable;
}
