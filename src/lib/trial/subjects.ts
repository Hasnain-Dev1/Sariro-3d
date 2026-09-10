/* Deliberately NOT 'use client'. Read by the slots route and the booking route
   as well as by the form — and a server route that imports a client module
   receives client references rather than functions, which throws before the
   route can return anything. That has happened twice on this project. */

import { optionsFor, type CourseOption } from '@/lib/dashboard/course-options';

/**
 * SARIRO — what a family can ask for a trial in, and who can teach it
 * ============================================================================
 * The booking page never asked what the class was ABOUT. It collected a name,
 * a number and a grade, then offered every free half hour any teacher had.
 *
 * So a parent looking for Mathematics could be seated with a Public Speaking
 * teacher, and the first thing that would tell anybody is the class itself —
 * with the family watching. §6 and §14 exist to stop precisely that.
 *
 * ── The catalogue is not re-typed here ──────────────────────────────────────
 * The subjects come from lib/dashboard/course-options.ts, which is what New
 * Course and Manual Enrolment already offer. A second hardcoded list would
 * drift, and the drift is invisible until a parent picks something nobody can
 * actually teach.
 *
 * ── Matching a teacher, and why it is loose in one specific way ─────────────
 * Eligibility lives in teacher_course_assignments as (track, level). The track
 * is a slug and matches exactly. The LEVEL does not: production holds
 * 'Intermediate', 'Beginner', 'Advanced' and 'focus' — capitalised by one
 * screen and lowercased by another, over months.
 *
 * A trial is a taster, so it does not need the level to match at all: being
 * approved to teach the subject is the question. Comparing levels strictly
 * would silently exclude teachers whose rows happen to be capitalised, which
 * is a data accident rather than a statement about what they can teach.
 */

export interface TrialSubject extends CourseOption {
  /** Which part of the catalogue it came from — shown as a heading. */
  group: string;
}

/**
 * Everything a family can ask for a trial in.
 *
 * Grouped the way a parent thinks: school subjects by name, coding by what
 * gets built, and the focus courses that are neither.
 */
export function trialSubjects(): TrialSubject[] {
  const g = (group: string, list: CourseOption[]) => list.map((o) => ({ ...o, group }));
  return [
    ...g('School subjects', optionsFor('school')),
    ...g('Coding & AI', optionsFor('coding')),
    ...g('Focus courses', optionsFor('focus')),
  ];
}

/** The label for a slug, or the slug itself when it is not in the catalogue. */
export function subjectLabel(slug: string | null | undefined): string {
  if (!slug) return '';
  return trialSubjects().find((s) => s.value === slug)?.label ?? slug;
}

/** Whether a slug is something we actually offer. */
export function isTrialSubject(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return trialSubjects().some((s) => s.value === slug);
}

/** One row of teacher_course_assignments, as it comes off the database. */
export interface TeacherSubjectRow {
  teacher_id: string;
  track: string | null;
  level?: string | null;
}

/**
 * The teachers approved to teach this subject.
 *
 * An empty subject means "no preference expressed", and everybody is eligible
 * — a family who has not chosen yet should still see that times exist.
 *
 * A subject NOBODY is approved for returns an empty set rather than falling
 * back to everybody. Offering a Mathematics slot with a teacher who has never
 * been approved to teach it is worse than saying there are none: the family
 * turns up, and the teacher finds out at the same moment they do.
 */
export function teachersFor(
  subject: string | null | undefined,
  rows: readonly TeacherSubjectRow[],
  allTeacherIds: readonly string[]
): Set<string> {
  const wanted = (subject ?? '').trim();
  if (!wanted) return new Set(allTeacherIds);

  const eligible = new Set<string>();
  for (const r of rows) {
    if ((r.track ?? '').trim().toLowerCase() === wanted.toLowerCase()) {
      eligible.add(r.teacher_id);
    }
  }
  return eligible;
}

/**
 * Whether a teacher may take a trial in this subject at this grade.
 *
 * Grade eligibility is stored per teacher as an inclusive range. A teacher
 * with no range recorded is treated as able to teach ANY grade — the ranges
 * are new, nobody has filled them in, and defaulting the other way would mean
 * no teacher is eligible for anything and the booking page shows nothing at
 * all on the day it ships.
 */
export function teacherCanTake(
  opts: {
    subjectOk: boolean;
    grade: number | null | undefined;
    minGrade?: number | null;
    maxGrade?: number | null;
  }
): boolean {
  if (!opts.subjectOk) return false;
  if (opts.grade == null) return true;
  const lo = opts.minGrade ?? null;
  const hi = opts.maxGrade ?? null;
  if (lo === null && hi === null) return true;
  if (lo !== null && opts.grade < lo) return false;
  if (hi !== null && opts.grade > hi) return false;
  return true;
}
