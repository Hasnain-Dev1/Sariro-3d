import type { SpeakingBand } from '@/lib/speaking/bands';
import type { BandLesson } from './types';
import { PRIMARY_WORLD_1, PRIMARY_WORLD_2 } from './primary/world-1-2';
import { PRIMARY_WORLD_3, PRIMARY_WORLD_4 } from './primary/world-3-4';
import { PRIMARY_WORLD_5, PRIMARY_WORLD_6 } from './primary/world-5-6';
import { PRIMARY_WORLD_7, PRIMARY_WORLD_8 } from './primary/world-7-8';
import { MIDDLE_WORLD_1, MIDDLE_WORLD_2 } from './middle/world-1-2';
import { MIDDLE_WORLD_3, MIDDLE_WORLD_4 } from './middle/world-3-4';
import { MIDDLE_WORLD_5, MIDDLE_WORLD_6 } from './middle/world-5-6';
import { MIDDLE_WORLD_7, MIDDLE_WORLD_8 } from './middle/world-7-8';
import { ADULT_WORLD_1, ADULT_WORLD_2 } from './adult/world-1-2';
import { ADULT_WORLD_3, ADULT_WORLD_4 } from './adult/world-3-4';
import { ADULT_WORLD_5, ADULT_WORLD_6 } from './adult/world-5-6';
import { ADULT_WORLD_7, ADULT_WORLD_8 } from './adult/world-7-8';
import { SENIOR_LESSONS } from './senior';

export type { BandLesson } from './types';

/**
 * SARIRO — every band's own version of the course
 * ============================================================================
 * Grades 1–3 read lib/speaking/junior, which was written for them. Every other
 * band has its own forty-six lessons here. lib/speaking/stages.ts is the only
 * reader: it lays the band's lesson over the syllabus lesson.
 */
export const BAND_LESSONS: Partial<Record<SpeakingBand, readonly BandLesson[]>> = {
  primary: [
    ...PRIMARY_WORLD_1, ...PRIMARY_WORLD_2, ...PRIMARY_WORLD_3, ...PRIMARY_WORLD_4,
    ...PRIMARY_WORLD_5, ...PRIMARY_WORLD_6, ...PRIMARY_WORLD_7, ...PRIMARY_WORLD_8,
  ],
  middle: [
    ...MIDDLE_WORLD_1, ...MIDDLE_WORLD_2, ...MIDDLE_WORLD_3, ...MIDDLE_WORLD_4,
    ...MIDDLE_WORLD_5, ...MIDDLE_WORLD_6, ...MIDDLE_WORLD_7, ...MIDDLE_WORLD_8,
  ],
  senior: SENIOR_LESSONS,
  adult: [
    ...ADULT_WORLD_1, ...ADULT_WORLD_2, ...ADULT_WORLD_3, ...ADULT_WORLD_4,
    ...ADULT_WORLD_5, ...ADULT_WORLD_6, ...ADULT_WORLD_7, ...ADULT_WORLD_8,
  ],
};

const INDEX = new Map<string, BandLesson>(
  Object.entries(BAND_LESSONS).flatMap(([band, list]) => (list ?? []).map((l) => [`${band}:${l.number}`, l] as const))
);

/** One band's version of lesson `number`, or null where the band has none. */
export function bandLesson(band: SpeakingBand, number: number): BandLesson | null {
  return INDEX.get(`${band}:${number}`) ?? null;
}
