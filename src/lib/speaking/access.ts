/**
 * SARIRO — who the practice room is for
 * ============================================================================
 * The speaking, listening and writing labs are the Public Speaking course's
 * homework, not a general feature. A child learning Python has no use for a
 * filler-word counter, and putting it in their sidebar makes the product look
 * unfocused to the person paying for it.
 *
 * It is also the thing worth wanting. A coding student who sees "Practice
 * room — enrol in Public Speaking" has been told something true and been given
 * somewhere to go, which is a better use of the row than hiding it entirely.
 *
 * ── Why a dropped enrolment still counts as "was enrolled" but not access ───
 * Somebody who dropped the course did not lose the skill, but they are no
 * longer paying for the tool. They see the locked state, same as anybody
 * else — with the difference that they already know what is behind it.
 */

import { bandForGrade, bandOfLevel, BAND_LABEL, type SpeakingBand } from '@/lib/speaking/bands';

/** The one track this unlocks. Not a list: there is one speaking subject, sold as five band courses. */
export const SPEAKING_TRACK = 'public-speaking';

export interface EnrolmentLike {
  track: string;
  status: string;
  /** `band-middle`, or `focus` from before the bands. */
  level?: string | null;
  created_at?: string | null;
}

/** Statuses that mean "this course is theirs". */
const OPEN = new Set(['active', 'completed']);

/**
 * Everything a caller needs to render the gate, from the enrolment list it
 * already has. No extra query, and no second opinion about what counts.
 */
export interface PracticeAccess {
  allowed: boolean;
  /** They had it and let it go. Worth a different sentence. */
  lapsed: boolean;
  /** Straight into the UI, so the wording lives in one place. */
  reason: string;
  /**
   * Which Public Speaking course's room this is: the band of the most recent
   * open enrolment. Enrolling in the next band replaces the room with that
   * band's — older bands are not offered alongside. Null when locked.
   */
  band: SpeakingBand | null;
  /** "Public Speaking · Grades 4–6" — shown in the room so a learner knows which course it is. */
  courseName: string | null;
}

/**
 * The band a learner is practising in, from their enrolments. Latest open
 * Public Speaking enrolment wins; one from before the bands (`focus`) uses the
 * learner's grade, as it always did.
 */
export function activeSpeakingBand(
  enrolments: readonly EnrolmentLike[] | null | undefined,
  grade?: number | null
): SpeakingBand | null {
  const open = (enrolments ?? [])
    .filter((e) => typeof e?.track === 'string' && e.track.trim().toLowerCase() === SPEAKING_TRACK && OPEN.has(String(e.status).trim().toLowerCase()))
    .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '') || 0);
  if (open.length === 0) return null;
  return bandOfLevel(open[0].level) ?? bandForGrade(grade ?? null);
}

export function practiceAccess(
  enrolments: readonly EnrolmentLike[] | null | undefined,
  grade?: number | null
): PracticeAccess {
  const rows = (enrolments ?? []).filter(
    (e) => typeof e?.track === 'string' && e.track.trim().toLowerCase() === SPEAKING_TRACK
  );

  const band = activeSpeakingBand(rows, grade);
  if (band) {
    return { allowed: true, lapsed: false, reason: '', band, courseName: `Public Speaking · ${BAND_LABEL[band]}` };
  }

  const lapsed = rows.length > 0;
  return {
    allowed: false,
    lapsed,
    band: null,
    courseName: null,
    reason: lapsed
      ? 'Your Public Speaking course has ended, so the practice room is closed. Pick it back up and everything you recorded is still here.'
      : 'The practice room comes with Public Speaking. It measures your pace, your filler words and how much of a passage you catch — every attempt, on your own device.',
  };
}

/** Convenience for the places that only need the boolean. */
export function canPractise(enrolments: readonly EnrolmentLike[] | null | undefined): boolean {
  return practiceAccess(enrolments).allowed;
}
