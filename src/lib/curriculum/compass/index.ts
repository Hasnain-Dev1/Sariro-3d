import type { StructuredCourse, StructuredLesson } from '@/lib/curriculum/types';
import { lesson01 } from '@/lib/curriculum/compass/lesson-01';
import { lesson02 } from '@/lib/curriculum/compass/lesson-02';
import { lesson03 } from '@/lib/curriculum/compass/lesson-03';
import { lesson04 } from '@/lib/curriculum/compass/lesson-04';
import { lesson05 } from '@/lib/curriculum/compass/lesson-05';
import { lesson06 } from '@/lib/curriculum/compass/lesson-06';
import { lesson07 } from '@/lib/curriculum/compass/lesson-07';
import { lesson08 } from '@/lib/curriculum/compass/lesson-08';
import { lesson09 } from '@/lib/curriculum/compass/lesson-09';
import { lesson10 } from '@/lib/curriculum/compass/lesson-10';
import { lesson11 } from '@/lib/curriculum/compass/lesson-11';
import { lesson12 } from '@/lib/curriculum/compass/lesson-12';
import { lesson13 } from '@/lib/curriculum/compass/lesson-13';
import { lesson14 } from '@/lib/curriculum/compass/lesson-14';
import { lesson15 } from '@/lib/curriculum/compass/lesson-15';
import { lesson16 } from '@/lib/curriculum/compass/lesson-16';
import { lesson17 } from '@/lib/curriculum/compass/lesson-17';
import { lesson18 } from '@/lib/curriculum/compass/lesson-18';
import { lesson19 } from '@/lib/curriculum/compass/lesson-19';
import { lesson20 } from '@/lib/curriculum/compass/lesson-20';
import { lesson21 } from '@/lib/curriculum/compass/lesson-21';
import { lesson22 } from '@/lib/curriculum/compass/lesson-22';
import { lesson23 } from '@/lib/curriculum/compass/lesson-23';
import { lesson24 } from '@/lib/curriculum/compass/lesson-24';
import { lesson25 } from '@/lib/curriculum/compass/lesson-25';
import { lesson26 } from '@/lib/curriculum/compass/lesson-26';
import { lesson27 } from '@/lib/curriculum/compass/lesson-27';
import { lesson28 } from '@/lib/curriculum/compass/lesson-28';
import { lesson29 } from '@/lib/curriculum/compass/lesson-29';
import { lesson30 } from '@/lib/curriculum/compass/lesson-30';

/**
 * Compass — the Agent Architect (Beginner, agent-101) flagship curriculum.
 * 30 structured lessons across 5 modules. Students build Compass, a personal
 * AI research/task agent, from a single Claude API call (M1) through tools,
 * memory, planning, to a deployed agent (M5). Lessons added here as authored.
 */
const lessons: StructuredLesson[] = [
  lesson01, lesson02, lesson03, lesson04, lesson05, lesson06,
  lesson07, lesson08, lesson09, lesson10, lesson11, lesson12,
  lesson13, lesson14, lesson15, lesson16, lesson17, lesson18,
  lesson19, lesson20, lesson21, lesson22, lesson23, lesson24,
  lesson25, lesson26, lesson27, lesson28, lesson29, lesson30,
  // All 30 lessons complete — Agent Architect (Beginner) / Compass.
].sort((a, b) => a.globalNumber - b.globalNumber);

export const compassCourse: StructuredCourse = {
  courseId: 'agent-101',
  productName: 'Compass',
  lessons,
};

/** Look up a structured lesson by its module + in-module index (matches lesson_pages keys). */
export function getCompassLesson(moduleNum: number, lessonIndex: number): StructuredLesson | null {
  return lessons.find((l) => l.moduleNum === moduleNum && l.lessonIndex === lessonIndex) ?? null;
}

/** Look up by the 1..30 number students see. */
export function getCompassLessonByNumber(globalNumber: number): StructuredLesson | null {
  return lessons.find((l) => l.globalNumber === globalNumber) ?? null;
}
