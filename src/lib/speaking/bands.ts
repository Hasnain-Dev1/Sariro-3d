import { GRADE_UNDERGRADUATE } from '@/lib/grade/tag';

/**
 * SARIRO — Public Speaking, sold as five courses
 * ============================================================================
 * The founder's call (16 Sep 2026): Public Speaking is five courses, one per
 * age band — not one course that quietly adapts to whoever opens it.
 *
 *   Grades 1–3                  band-foundation   Sprouts
 *   Grades 4–6                  band-primary      Explorers
 *   Grades 7–9                  band-middle       Speakers
 *   Grades 10–12                band-senior       Leaders
 *   UG, PG & professionals      band-adult        Professionals
 *
 * Each is its own course everywhere a course exists: what is bought, what a
 * student is enrolled in, which batch they sit in, which teachers are approved
 * for it, and which version of every lesson they read. The track stays
 * `public-speaking` — the practice room and the lesson content belong to the
 * subject — and the band is the LEVEL, the way a school subject's grade is.
 *
 * `focus`, the old single level, is still read: a course bought before this
 * uses the learner's grade to pick the band, exactly as it always did.
 *
 * Pure and dependency-light, so server routes that validate a course do not
 * pull the lesson content in with it.
 */

export type SpeakingBand = 'foundation' | 'primary' | 'middle' | 'senior' | 'adult';

export const SPEAKING_TRACK_SLUG = 'public-speaking';

export const BAND_ORDER: SpeakingBand[] = ['foundation', 'primary', 'middle', 'senior', 'adult'];

export const BAND_LABEL: Record<SpeakingBand, string> = {
  foundation: 'Grades 1–3',
  primary: 'Grades 4–6',
  middle: 'Grades 7–9',
  senior: 'Grades 10–12',
  adult: 'UG, PG & professionals',
};

const LEVEL_PREFIX = 'band-';

export const isSpeakingTrack = (track: string | null | undefined) =>
  (track ?? '').trim().toLowerCase() === SPEAKING_TRACK_SLUG;

/** The level stored for a band: `band-middle`. */
export const bandLevel = (band: SpeakingBand): string => `${LEVEL_PREFIX}${band}`;

/** The band a stored level names, or null (`focus`, a grade, anything else). */
export function bandOfLevel(level: string | null | undefined): SpeakingBand | null {
  const l = (level ?? '').trim().toLowerCase();
  if (!l.startsWith(LEVEL_PREFIX)) return null;
  const b = l.slice(LEVEL_PREFIX.length) as SpeakingBand;
  return BAND_ORDER.includes(b) ? b : null;
}

/** A grade on the 1–14 scale to its band. Unknown grade: Grades 7–9. */
export function bandForGrade(grade: number | null | undefined): SpeakingBand {
  if (grade === null || grade === undefined || !Number.isFinite(grade)) return 'middle';
  if (grade >= GRADE_UNDERGRADUATE) return 'adult';
  if (grade >= 10) return 'senior';
  if (grade >= 7) return 'middle';
  if (grade >= 4) return 'primary';
  return 'foundation';
}

/** The lesson course id for a band: `public-speaking-middle`. */
export const speakingCourseId = (band: SpeakingBand) => `${SPEAKING_TRACK_SLUG}-${band}`;

/** The band a lesson course id names; null for the old `public-speaking-focus` and everything else. */
export function bandOfCourseId(courseId: string | null | undefined): SpeakingBand | null {
  const id = (courseId ?? '').trim().toLowerCase();
  const prefix = `${SPEAKING_TRACK_SLUG}-`;
  if (!id.startsWith(prefix)) return null;
  const b = id.slice(prefix.length) as SpeakingBand;
  return BAND_ORDER.includes(b) ? b : null;
}

/**
 * The course whose lessons a Public Speaking course id shows. The old single
 * `public-speaking-focus` course (no enrolments left on it since the bands SQL)
 * reads as Grades 7–9, the middle of the range.
 */
export const speakingBandOfCourse = (courseId: string | null | undefined): SpeakingBand =>
  bandOfCourseId(courseId) ?? 'middle';

/** Any Public Speaking lesson course, banded or the old single one. */
export const isSpeakingCourseId = (courseId: string | null | undefined) =>
  !!bandOfCourseId(courseId) || (courseId ?? '').trim().toLowerCase() === `${SPEAKING_TRACK_SLUG}-focus`;

/** "Public Speaking · Grades 7–9". */
export const bandCourseName = (band: SpeakingBand) => `Public Speaking · ${BAND_LABEL[band]}`;
