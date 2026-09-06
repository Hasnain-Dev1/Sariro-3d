import type { SpeakingLesson, SpeakingModule } from '@/lib/speaking/lesson';
import { module1 } from '@/lib/speaking/modules/module-1';
import { module2 } from '@/lib/speaking/modules/module-2';
import { module3 } from '@/lib/speaking/modules/module-3';
import { module4 } from '@/lib/speaking/modules/module-4';
import { module5 } from '@/lib/speaking/modules/module-5';
import { module6 } from '@/lib/speaking/modules/module-6';
import { module7 } from '@/lib/speaking/modules/module-7';
import { module8 } from '@/lib/speaking/modules/module-8';

/**
 * SARIRO — the Public Speaking course, written
 * =========================================================
 * Eight modules, 46 lessons. Slots 24 and 48 are assessments, which is why
 * modules 4 and 8 carry five lessons rather than six — see testPositions in
 * lib/school/curriculum.ts.
 *
 * The titles here must match the ones in AUTHORED_TITLES under
 * `public-speaking:0`, because the syllabus is what a parent is sold and the
 * lesson is what a student opens. speaking.test.ts checks that they do, so the
 * two cannot drift.
 */
export const SPEAKING_MODULES: SpeakingModule[] = [
  module1, module2, module3, module4, module5, module6, module7, module8,
];

/** A lesson by its position in the syllabus, or null where none is written. */
export function getSpeakingLesson(moduleNum: number, lessonIndex: number): SpeakingLesson | null {
  for (const m of SPEAKING_MODULES) {
    const hit = m.lessons.find((l) => l.moduleNum === moduleNum && l.lessonIndex === lessonIndex);
    if (hit) return hit;
  }
  return null;
}

/** Every written lesson, in course order. */
export function allSpeakingLessons(): SpeakingLesson[] {
  return SPEAKING_MODULES.flatMap((m) => m.lessons).sort((a, b) => a.number - b.number);
}

/** How much of the course is written. Used by scripts/audit-lesson-content.ts. */
export const speakingWrittenCount = () => allSpeakingLessons().length;
