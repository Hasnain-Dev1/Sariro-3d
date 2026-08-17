import type { StructuredCourse, StructuredLesson } from '@/lib/curriculum/types';
import { lesson01 } from '@/lib/curriculum/momentum/lesson-01';
import { lesson02 } from '@/lib/curriculum/momentum/lesson-02';
import { lesson03 } from '@/lib/curriculum/momentum/lesson-03';
import { lesson04 } from '@/lib/curriculum/momentum/lesson-04';
import { lesson05 } from '@/lib/curriculum/momentum/lesson-05';
import { lesson06 } from '@/lib/curriculum/momentum/lesson-06';

/**
 * Momentum — the Web Builder Pro (Beginner, web-101) flagship curriculum.
 * 30 structured lessons across 5 modules. Students build Momentum, an AI-powered
 * habit companion, from a static HTML page (M1) to a deployed Next.js app with an
 * AI coach (M5). Lessons are added here as they're authored.
 */
const lessons: StructuredLesson[] = [
  lesson01, lesson02, lesson03, lesson04, lesson05, lesson06,
  // Module 1 (HTML + CSS Foundations) complete. lesson07 … lesson30 to come.
].sort((a, b) => a.globalNumber - b.globalNumber);

export const momentumCourse: StructuredCourse = {
  courseId: 'web-101',
  productName: 'Momentum',
  lessons,
};

/** Look up a structured lesson by its module + in-module index (matches lesson_pages keys). */
export function getMomentumLesson(moduleNum: number, lessonIndex: number): StructuredLesson | null {
  return lessons.find((l) => l.moduleNum === moduleNum && l.lessonIndex === lessonIndex) ?? null;
}

/** Look up by the 1..30 number students see. */
export function getMomentumLessonByNumber(globalNumber: number): StructuredLesson | null {
  return lessons.find((l) => l.globalNumber === globalNumber) ?? null;
}
