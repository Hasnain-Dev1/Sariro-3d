/**
 * SARIRO — Lesson pages: ordering + access resolution (pure, testable)
 * ====================================================================
 * Lesson content lives in the `lesson_pages` table as ONE page per lesson of a
 * course (per-course template, shared by every cohort). This module has NO
 * Supabase calls — it turns a course's static syllabus into a flat ordered list
 * and decides, from progress, which lessons a viewer may open:
 *
 *   • Student  → CURRENT + COMPLETED lessons only (never upcoming).
 *   • Teacher  → EVERY lesson of an ELIGIBLE (assigned) course — teachers must
 *                be able to review any lesson, not just what they've taught so
 *                far, to complete their own training. `access` still labels
 *                each lesson (completed/current/next/upcoming) from the
 *                teacher's taught progress, so the list reads as a training
 *                tracker even though nothing is actually locked.
 *   • Admin    → everything.
 *
 * The DB reads (enrollment, lesson_progress, eligibility) happen in the API
 * routes; the resolvers below take that data as plain inputs.
 */

import { COURSES } from '@/lib/sariro-data';
import {
  SCHOOL_SUBJECTS, SPECIALISATIONS, GRADE_GROUPS, buildGradeSyllabus,
} from '@/lib/school/curriculum';
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
  if (!course || !Array.isArray(course.syllabus)) {
    // Not a coding course. It may still be a school subject or a focus course —
    // see parseSchoolCourseId at the bottom of this file.
    const school = parseSchoolCourseId(courseId);
    return school ? flattenSchoolLessons(school.subjectSlug, school.grade) : [];
  }
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
    // Teachers can review EVERY lesson of a course they're assigned to, so they
    // can finish training on lessons they haven't taught yet — access still
    // shows where they actually are (completed/current/next/upcoming).
    else if (role === 'teacher') viewable = true;
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

/* ══════════════════════════════════════════════════════════════════════════
   School subjects and focus courses
   ══════════════════════════════════════════════════════════════════════════
   Everything above knows only COURSES — the coding tracks and the elementary
   ones. School subjects (Mathematics Grade 7) and focus courses (Public
   Speaking) were invisible to the whole lesson system: no page could be
   authored for them, no student could open one, and a teacher could not review
   the syllabus before class.

   Public Speaking is the clearest case. It is priced on /pricing, offered on
   the homepage, listed in the course chooser, and has forty-six authored lesson
   titles sitting in lib/school/curriculum.ts — and none of it could be reached,
   because a course id like `web-101` was the only shape this file understood.

   ── The id ──────────────────────────────────────────────────────────────────
   `lesson_pages.course_id` is free text, so these get an id of their own:

       mathematics-grade-7      a school subject in one grade
       public-speaking-focus    a specialisation, which has no grade

   Parsed from the end, because subject slugs contain hyphens of their own —
   `organic-chemistry`, `algebra-1`, `public-speaking`. Splitting on the first
   hyphen would turn Public Speaking into a subject called "public".
   ══════════════════════════════════════════════════════════════════════════ */

/** A school or focus course id, or null if this is not one. */
export function parseSchoolCourseId(
  courseId: string
): { subjectSlug: string; grade: number } | null {
  const focus = /^(.+)-focus$/.exec(courseId);
  if (focus && SPECIALISATIONS.some((s) => s.slug === focus[1])) {
    // Specialisations have no grade. buildGradeSyllabus keys them at 0, and
    // AUTHORED_TITLES stores them as `public-speaking:0`.
    return { subjectSlug: focus[1], grade: 0 };
  }
  const school = /^(.+)-grade-(\d{1,2})$/.exec(courseId);
  if (school) {
    const subject = SCHOOL_SUBJECTS.find((s) => s.slug === school[1]);
    const grade = Number(school[2]);
    // The grade has to be one the subject is actually offered for. Without this
    // `mathematics-grade-99` parsed happily, and buildGradeSyllabus would hand
    // back forty-eight slots called "Lesson 1"… for a year that does not exist.
    if (subject && gradesForSubject(subject).includes(grade)) {
      return { subjectSlug: subject.slug, grade };
    }
  }
  return null;
}

/**
 * The course id for an enrolment, whichever kind it is.
 *
 * Enrolments store (track, level): ('web', 'beginner'), ('mathematics',
 * 'grade-7'), ('public-speaking', 'focus'). One function so the student page,
 * the admin editor and the seeder cannot disagree about what a course is
 * called.
 */
export function lessonCourseIdFor(track: string, level: string): string | null {
  const lvl = (level ?? '').toLowerCase();

  const coding = COURSES.find(
    (c) => c.trackId === track && c.level.toLowerCase() === lvl
  );
  if (coding) return coding.id;

  if (lvl === 'focus' && SPECIALISATIONS.some((s) => s.slug === track)) {
    return `${track}-focus`;
  }

  const g = /^grade-(\d{1,2})$/.exec(lvl);
  if (g) {
    const subject = SCHOOL_SUBJECTS.find((s) => s.slug === track);
    // Built through the parser's own rule, so an id this returns is always one
    // parseSchoolCourseId will read back.
    if (subject && gradesForSubject(subject).includes(Number(g[1]))) {
      return `${track}-grade-${g[1]}`;
    }
  }

  return null;
}

/** Flatten a school or focus course. Assessment slots are real classes and are kept. */
function flattenSchoolLessons(subjectSlug: string, grade: number): OrderedLesson[] {
  const syllabus = buildGradeSyllabus(subjectSlug, grade);
  const out: OrderedLesson[] = [];
  let order = 0;
  for (const mod of syllabus.modules) {
    for (const l of mod.lessons) {
      out.push({
        module_num: mod.num,
        // Zero-padded to match the coding courses' syllabus keys, which is what
        // lesson_progress.module_num holds.
        module_str: String(mod.num).padStart(2, '0'),
        module_name: mod.title,
        lesson_index: l.lessonIndex,
        lesson_name: l.title,
        order: order++,
      });
    }
  }
  return out;
}

/** Every course that has lessons to author — coding, school and focus alike. */
export function allLessonCourses(): { id: string; title: string; family: 'coding' | 'school' | 'focus' }[] {
  const out: { id: string; title: string; family: 'coding' | 'school' | 'focus' }[] = [];

  for (const c of COURSES) {
    if (Array.isArray(c.syllabus) && c.syllabus.length > 0) {
      out.push({ id: c.id, title: c.title, family: 'coding' });
    }
  }

  for (const s of SPECIALISATIONS) {
    out.push({ id: `${s.slug}-focus`, title: `${s.name} · focus course`, family: 'focus' });
  }

  for (const s of SCHOOL_SUBJECTS) {
    for (const grade of gradesForSubject(s)) {
      out.push({ id: `${s.slug}-grade-${grade}`, title: `${s.name} · Grade ${grade}`, family: 'school' });
    }
  }

  return out;
}

/** The grades a subject is actually offered for, from its grade groups. */
function gradesForSubject(subject: { groups: string[] }): number[] {
  return GRADE_GROUPS.filter((g) => subject.groups.includes(g.slug)).flatMap((g) => g.grades);
}

/** Whether this id names a course with lessons. Used where findCourseById was. */
export function lessonCourseExists(courseId: string): boolean {
  return !!findCourseById(courseId) || !!parseSchoolCourseId(courseId);
}
