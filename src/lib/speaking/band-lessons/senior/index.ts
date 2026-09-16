import type { BandLesson } from '../types';
import { SENIOR_WORLD_1, SENIOR_WORLD_2 } from './world-1-2';
import { SENIOR_WORLD_3, SENIOR_WORLD_4 } from './world-3-4';
import { SENIOR_WORLD_5, SENIOR_WORLD_6 } from './world-5-6';
import { SENIOR_WORLD_7, SENIOR_WORLD_8 } from './world-7-8';

/** Grades 10–12: boards, vivas, admissions interviews, MUN and debate. */
export const SENIOR_LESSONS: readonly BandLesson[] = [
  ...SENIOR_WORLD_1, ...SENIOR_WORLD_2, ...SENIOR_WORLD_3, ...SENIOR_WORLD_4,
  ...SENIOR_WORLD_5, ...SENIOR_WORLD_6, ...SENIOR_WORLD_7, ...SENIOR_WORLD_8,
];
