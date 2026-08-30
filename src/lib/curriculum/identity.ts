import { COURSES } from '@/lib/sariro-data';
import { getAllStructuredCourses, getStructuredCourse } from '@/lib/curriculum';
import type { StructuredLesson } from '@/lib/curriculum/types';

/**
 * SARIRO — Content Identity
 * =========================================================
 * Stage 2 needs one question answered reliably: *what did this student actually
 * learn?* That requires joining progress rows to lesson content — and today
 * those two things are keyed differently.
 *
 *   SYLLABUS   `sariro-data.ts` → syllabus[].lessons: string[]
 *              keyed by module_num (STRING, "02") + lesson_name (STRING)
 *              ← this is what `lesson_progress` / `session_attendance` store
 *
 *   STRUCTURED `curriculum/*` → StructuredLesson
 *              keyed by courseId + moduleNum (NUMBER) + lessonIndex (NUMBER)
 *              ← this is what the 5-tab lesson viewer renders
 *
 * The names are not reliably equal across the two — web-101 module 1 lesson 1 is
 * "HTML structure + semantic tags" in the syllabus and "HTML structure & semantic
 * tags" in the structured lesson. Matching on the string would silently drop
 * progress on the floor, so we match on ORDINAL POSITION within the module and
 * treat the name only as a corroborating signal.
 *
 * `unitKey` is the canonical id everything in the learner model hangs off:
 * capability tags, evidence rows, mastery. It is derived from three fields that
 * are already immutable in the authored content, so no lesson file has to carry
 * a hand-written id that could drift out of sync with its own position.
 *
 * Because it is DERIVED, reordering lessons would silently repoint every tag.
 * `scripts/audit-content-identity.ts` writes a committed lockfile of every key so
 * that any such reorder shows up as a reviewable diff instead of silent damage.
 */

/** `${courseId}:${moduleNum}:${lessonIndex}` — e.g. `web-101:1:0`. */
export type UnitKey = string;

export function unitKeyOf(courseId: string, moduleNum: number, lessonIndex: number): UnitKey {
  return `${courseId}:${moduleNum}:${lessonIndex}`;
}

export function unitKeyOfLesson(lesson: StructuredLesson): UnitKey {
  return unitKeyOf(lesson.courseId, lesson.moduleNum, lesson.lessonIndex);
}

export function parseUnitKey(key: UnitKey): { courseId: string; moduleNum: number; lessonIndex: number } | null {
  const parts = key.split(':');
  if (parts.length !== 3) return null;
  const moduleNum = Number(parts[1]);
  const lessonIndex = Number(parts[2]);
  if (!parts[0] || !Number.isInteger(moduleNum) || !Number.isInteger(lessonIndex)) return null;
  return { courseId: parts[0], moduleNum, lessonIndex };
}

/**
 * Fold the cosmetic differences between the two authoring surfaces so the same
 * lesson compares equal: "&" vs "+", em-dashes, smart quotes, casing, padding.
 * Used only to CORROBORATE an ordinal match, never to make one.
 */
export function normalizeLessonName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[&+]/g, ' and ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Syllabus `module_num` is a zero-padded string ("02"); structured is a number (2).
 *
 * The empty-string guard is not paranoia: `Number('')` and `Number('   ')` are
 * both `0`, and `Number.isInteger(0)` is true — so without it, a blank or
 * whitespace `module_num` resolved to "module 0" instead of being rejected.
 * Module 0 does not exist, so it surfaced as an unresolved lesson rather than a
 * wrong one, but "silently became a different module" is the exact class of bug
 * this identity layer exists to prevent.
 */
export function parseModuleNum(moduleNum: string | number): number | null {
  if (typeof moduleNum === 'number') return Number.isInteger(moduleNum) ? moduleNum : null;
  const trimmed = moduleNum.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : null;
}

/**
 * Escape hatch for lessons the ordinal rule genuinely cannot resolve — a syllabus
 * module whose lesson list has drifted out of step with the authored curriculum.
 * Keyed `courseId::module_num::lesson_name` (raw syllabus strings) → unitKey.
 * Empty by design: every entry here is a piece of debt. Prefer fixing the data.
 */
export const IDENTITY_OVERRIDES: Record<string, UnitKey> = {};

export type ResolutionQuality =
  | 'exact'        // ordinal match, names agree once normalized
  | 'name-drift'   // ordinal match, names differ — resolved, but worth a look
  | 'override'     // resolved via IDENTITY_OVERRIDES
  | 'unresolved';  // no structured lesson at that position

export interface Resolution {
  unitKey: UnitKey | null;
  quality: ResolutionQuality;
  syllabusName: string;
  structuredName?: string;
}

type SyllabusModule = { num: string; name: string; project?: string; lessons: readonly string[] };

/** The authored syllabus for a course, or null if it has none. */
export function getSyllabus(courseId: string): readonly SyllabusModule[] | null {
  const course = COURSES.find((c) => c.id === courseId);
  const syllabus = (course as { syllabus?: readonly SyllabusModule[] } | undefined)?.syllabus;
  return syllabus ?? null;
}

/**
 * Resolve a progress row — the shape `lesson_progress` actually stores — to the
 * structured lesson it refers to.
 */
export function resolveSyllabusLesson(
  courseId: string,
  moduleNum: string | number,
  lessonName: string
): Resolution {
  const override = IDENTITY_OVERRIDES[`${courseId}::${moduleNum}::${lessonName}`];
  if (override) return { unitKey: override, quality: 'override', syllabusName: lessonName };

  const miss: Resolution = { unitKey: null, quality: 'unresolved', syllabusName: lessonName };

  const modNum = parseModuleNum(moduleNum);
  const syllabus = getSyllabus(courseId);
  const structured = getStructuredCourse(courseId);
  if (modNum === null || !syllabus || !structured) return miss;

  const mod = syllabus.find((m) => parseModuleNum(m.num) === modNum);
  if (!mod) return miss;

  // Ordinal position of this lesson within its syllabus module — the join key.
  const wanted = normalizeLessonName(lessonName);
  const ordinal = mod.lessons.findIndex((l) => normalizeLessonName(l) === wanted);
  if (ordinal < 0) return miss;

  const lesson = structured.lessons.find((l) => l.moduleNum === modNum && l.lessonIndex === ordinal);
  if (!lesson) return miss;

  return {
    unitKey: unitKeyOfLesson(lesson),
    quality: normalizeLessonName(lesson.name) === wanted ? 'exact' : 'name-drift',
    syllabusName: lessonName,
    structuredName: lesson.name,
  };
}

/** Convenience for callers that only care whether it resolved. */
export function resolveUnitKey(courseId: string, moduleNum: string | number, lessonName: string): UnitKey | null {
  return resolveSyllabusLesson(courseId, moduleNum, lessonName).unitKey;
}

export interface ContentUnit {
  unitKey: UnitKey;
  courseId: string;
  moduleNum: number;
  lessonIndex: number;
  globalNumber: number;
  name: string;
  title: string;
}

/** Every authored lesson across every structured course — the S0 inventory. */
export function listContentUnits(): ContentUnit[] {
  return getAllStructuredCourses().flatMap((course) =>
    course.lessons.map((l) => ({
      unitKey: unitKeyOfLesson(l),
      courseId: l.courseId,
      moduleNum: l.moduleNum,
      lessonIndex: l.lessonIndex,
      globalNumber: l.globalNumber,
      name: l.name,
      title: l.title,
    }))
  );
}
