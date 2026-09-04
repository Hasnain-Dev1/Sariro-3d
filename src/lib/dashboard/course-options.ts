'use client';

import { TRACKS } from '@/lib/sariro-data';
import { SCHOOL_SUBJECTS, SPECIALISATIONS, GRADE_GROUPS } from '@/lib/school/curriculum';

/**
 * SARIRO — the catalogue, in one place
 * =========================================================
 * V2 §4-6, §8. What can be created and what can be enrolled into must be the
 * same list.
 *
 * ── Why this was extracted ──────────────────────────────────────────────────
 * New Course and Manual Enrolment each had their own hardcoded pickers, both
 * offering coding tracks and three levels. Widening New Course to cover school
 * subjects and focus courses immediately produced a worse bug than the one it
 * fixed: an admin could create a Mathematics Grade 7 course and then have no
 * way to put a student in it.
 *
 * Two screens describing the same catalogue will drift, and the drift is
 * invisible until somebody tries to do the obvious thing. So there is one list
 * and both screens read it.
 *
 * ── How a choice is stored ──────────────────────────────────────────────────
 *   track  the subject slug — a coding track id, school subject slug, or
 *          specialisation slug
 *   level  beginner | intermediate | advanced | elementary   coding
 *          grade-1 … grade-12                                one school year
 *          focus                                             a specialisation
 *
 * Matches purchase_intents and cohorts, so a cohort and the order that filled
 * it describe the same product.
 */

export type CourseFamily = 'coding' | 'school' | 'focus';

export const COURSE_FAMILIES: { key: CourseFamily; label: string; blurb: string }[] = [
  { key: 'coding', label: 'Coding', blurb: 'Web, apps, AI agents — levels, not grades' },
  { key: 'school', label: 'School subject', blurb: 'Maths, Science, English — by grade' },
  { key: 'focus', label: 'Focus course', blurb: 'One topic, 48 classes' },
];

export const CODING_LEVELS = ['elementary', 'beginner', 'intermediate', 'advanced'] as const;

export const ALL_GRADES = GRADE_GROUPS.flatMap((g) => g.grades);

export interface CourseOption { value: string; label: string }

/** What the subject step offers for a family. */
export function optionsFor(family: CourseFamily | null): CourseOption[] {
  if (family === 'coding') return TRACKS.map((t) => ({ value: t.id, label: t.name }));
  if (family === 'school') return SCHOOL_SUBJECTS.map((s) => ({ value: s.slug, label: s.name }));
  if (family === 'focus') return SPECIALISATIONS.map((s) => ({ value: s.slug, label: s.name }));
  return [];
}

/**
 * The grades a school subject is actually taught for.
 *
 * The matrix is deliberately not full: Physics and Chemistry do not exist as
 * school subjects before grade 7 — primary school teaches combined Science.
 * Offering "Chemistry for Grade 2" tells a parent we do not understand schools.
 */
export function gradesFor(family: CourseFamily | null, track: string): number[] {
  if (family !== 'school' || !track) return ALL_GRADES;
  const subject = SCHOOL_SUBJECTS.find((s) => s.slug === track);
  if (!subject) return ALL_GRADES;
  return GRADE_GROUPS.filter((g) => subject.groups.includes(g.slug)).flatMap((g) => g.grades);
}

/** Guidance printed against a focus course. Never enforced. */
export function suitsGrades(track: string): string | null {
  return SPECIALISATIONS.find((s) => s.slug === track)?.suitsGrades ?? null;
}

/** The level value to store, given the family and what was picked. */
export function levelValue(family: CourseFamily, picked: string): string {
  return family === 'focus' ? 'focus' : picked;
}

/** Which family a stored (track, level) pair belongs to. */
export function familyOf(track: string, level: string): CourseFamily {
  if (level === 'focus' || SPECIALISATIONS.some((s) => s.slug === track)) return 'focus';
  if (level.startsWith('grade-') || level.startsWith('group-')) return 'school';
  return 'coding';
}

/** "Mathematics · Grade 7" — one phrasing, used wherever a course is named. */
export function describeCourse(track: string, level: string): string {
  const family = familyOf(track, level);
  const name = optionsFor(family).find((o) => o.value === track)?.label ?? track;

  if (family === 'focus') return `${name} · focus course`;
  if (family === 'school') {
    const n = level.replace(/^(grade|group)-/, '');
    return level.startsWith('group-') ? `${name} · Group ${n}` : `${name} · Grade ${n}`;
  }
  return `${name} · ${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}
