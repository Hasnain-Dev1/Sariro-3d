/* Deliberately NOT 'use client' — the admin route validates with readCourses(). */

import { checkCourse, describeCourse, familyOf, levelsFor, levelValue, optionsFor, type CourseFamily } from '@/lib/dashboard/course-options';

/**
 * SARIRO — picking many courses at once (teacher eligibility + training)
 * ============================================================================
 * Mimo, 19 Sep 2026: approving a teacher meant choosing ONE course and level,
 * pressing Add, then pressing "Mark trained" on it — twelve times over for a
 * maths teacher who teaches every grade. Now the eligibility panel shows every
 * course in a family as a grid; tick as many as you like (or "All" for a whole
 * subject) and add them in one request, trained or not.
 *
 * The catalogue itself stays in course-options.ts; this is the list handling.
 */

export interface CoursePick { track: string; level: string }

/** One identity per course, whatever case an old row stored its level in. */
export const pickKey = (c: CoursePick) => `${c.track.trim()}|${c.level.trim().toLowerCase()}`;

export interface GridRow {
  track: string;
  name: string;
  /** level: the stored value; label: the short text on the chip. */
  levels: { level: string; label: string }[];
}

/** Every subject in a family with every level it is taught at — the picker's grid. */
export function courseGrid(family: CourseFamily): GridRow[] {
  return optionsFor(family).map((o) => ({
    track: o.value,
    name: o.label,
    levels: levelsFor(family, o.value).map((l) => ({
      level: levelValue(family, l.value).toLowerCase(),
      label: family === 'school' ? l.label.replace(/^Grade /, '') : l.label,
    })),
  }));
}

export const MAX_COURSES = 80;

export type ReadCourses =
  | { ok: true; courses: CoursePick[] }
  | { ok: false; code: string; message: string };

/**
 * A request's course list: every course checked against the catalogue,
 * duplicates dropped, at most MAX_COURSES. A body with the old single
 * `track` + `level` is read as a list of one. Levels are passed through as
 * written — removing or training an old row must match its stored case.
 */
export function readCourses(list: unknown, single?: { track?: unknown; level?: unknown }): ReadCourses {
  const raw: unknown[] = Array.isArray(list) ? list : single && (single.track || single.level) ? [single] : [];
  if (!raw.length) return { ok: false, code: 'missing_required_fields', message: 'Choose at least one course.' };
  if (raw.length > MAX_COURSES) return { ok: false, code: 'too_many', message: `At most ${MAX_COURSES} courses at once.` };
  const seen = new Set<string>();
  const courses: CoursePick[] = [];
  for (const item of raw) {
    const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const track = typeof o.track === 'string' ? o.track.trim() : '';
    const level = typeof o.level === 'string' ? o.level.trim() : '';
    const check = checkCourse(track, level);
    if (!check.ok) return { ok: false, code: check.code, message: track && level ? `${track} · ${level}: ${check.message}` : check.message };
    const key = pickKey({ track, level });
    if (seen.has(key)) continue;
    seen.add(key);
    courses.push({ track, level });
  }
  return { ok: true, courses };
}

/**
 * Many courses, said briefly — one line per subject, runs of grades joined:
 * "Mathematics · Grades 1–6, 9", "Python · Beginner, Advanced".
 */
export function describeCourses(courses: CoursePick[]): string[] {
  const bySubject = new Map<string, CoursePick[]>();
  for (const c of courses) bySubject.set(c.track, [...(bySubject.get(c.track) ?? []), c]);
  return [...bySubject.values()].map((group) => {
    const first = group[0];
    if (group.length === 1) return describeCourse(first.track, first.level);
    const name = describeCourse(first.track, first.level).split(' · ')[0];
    if (familyOf(first.track, first.level) === 'school') {
      const grades = group.map((c) => Number(c.level.replace(/^(grade|group)-/, ''))).filter(Number.isFinite).sort((a, b) => a - b);
      return `${name} · Grade${grades.length > 1 ? 's' : ''} ${runs(grades)}`;
    }
    return `${name} · ${group.map((c) => describeCourse(c.track, c.level).split(' · ')[1]).join(', ')}`;
  });
}

/** [1,2,3,5,7,8] → "1–3, 5, 7–8" */
function runs(ns: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < ns.length; i++) {
    let j = i;
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
    out.push(j > i ? `${ns[i]}–${ns[j]}` : `${ns[i]}`);
    i = j;
  }
  return out.join(', ');
}
