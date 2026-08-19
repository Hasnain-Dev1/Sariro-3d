import type { StructuredCourse, StructuredLesson } from '@/lib/curriculum/types';
import { momentumCourse } from '@/lib/curriculum/momentum';
import { orbitCourse } from '@/lib/curriculum/orbit';
import { compassCourse } from '@/lib/curriculum/compass';

/**
 * SARIRO — Structured Curriculum Registry
 * =========================================================
 * Maps a course id to its in-codebase structured curriculum. When a course is
 * listed here, the LessonsViewer renders its lessons as rich 5-tab pages (with
 * an interactive quiz) straight from this data, instead of the DB html_content
 * path. Courses not listed here keep using the legacy lesson_pages HTML.
 */
const REGISTRY: Record<string, StructuredCourse> = {
  [momentumCourse.courseId]: momentumCourse, // web-101 — Momentum (Beginner)
  [orbitCourse.courseId]: orbitCourse,       // web-201 — Orbit (Intermediate)
  [compassCourse.courseId]: compassCourse,   // agent-101 — Compass (Beginner)
};

/** The structured curriculum for a course, or null if it uses legacy HTML lessons. */
export function getStructuredCourse(courseId: string): StructuredCourse | null {
  return REGISTRY[courseId] ?? null;
}

/** True if this course has any structured lessons authored. */
export function hasStructuredCurriculum(courseId: string): boolean {
  const c = REGISTRY[courseId];
  return !!c && c.lessons.length > 0;
}

/** Find a single structured lesson by course + module + in-module index. */
export function getStructuredLesson(
  courseId: string,
  moduleNum: number,
  lessonIndex: number
): StructuredLesson | null {
  const course = REGISTRY[courseId];
  if (!course) return null;
  return course.lessons.find((l) => l.moduleNum === moduleNum && l.lessonIndex === lessonIndex) ?? null;
}
