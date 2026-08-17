import type { StructuredCourse, StructuredLesson } from '@/lib/curriculum/types';
import { lesson01 } from '@/lib/curriculum/orbit/lesson-01';

/**
 * Orbit — the Web Builder Pro (Intermediate) flagship curriculum.
 * 30 structured lessons across 6 modules. Lessons are added here as they are
 * authored; the viewer + course registry read from this array.
 */
const lessons: StructuredLesson[] = [
  lesson01,
  // lesson02 … lesson30 land here as they're written.
].sort((a, b) => a.globalNumber - b.globalNumber);

export const orbitCourse: StructuredCourse = {
  courseId: 'web-201',
  productName: 'Orbit',
  lessons,
};

/** Look up a structured lesson by its module + in-module index (matches lesson_pages keys). */
export function getOrbitLesson(moduleNum: number, lessonIndex: number): StructuredLesson | null {
  return lessons.find((l) => l.moduleNum === moduleNum && l.lessonIndex === lessonIndex) ?? null;
}

/** Look up by the 1..30 number students see. */
export function getOrbitLessonByNumber(globalNumber: number): StructuredLesson | null {
  return lessons.find((l) => l.globalNumber === globalNumber) ?? null;
}
