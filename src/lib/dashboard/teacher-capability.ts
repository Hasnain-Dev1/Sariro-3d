/**
 * SARIRO — what a teacher is actually trained for, in one line
 * ============================================================================
 * A teacher's eligibility is stored one row per (track, level): Mathematics
 * Grade 7, Mathematics Grade 8, Mathematics Grade 9, Web Beginner, Public
 * Speaking. Correct for scheduling, useless for reading — the person looking at
 * it wants to know "maths, coding, public speaking", not to count nine rows and
 * work the subjects out for themselves.
 *
 * So this collapses the rows into SUBJECTS, which is the unit everybody
 * actually thinks in. Three grades of maths is one chip that says Mathematics,
 * with the grades kept underneath for anybody who needs them.
 *
 * Used in four places that must agree: the super-admin and admin eligibility
 * panels, HR's teacher table, and the teacher's own dashboard — where it
 * answers the question a teacher genuinely has, which is "what am I allowed to
 * be given?"
 *
 * ── Trained is not the same as eligible ─────────────────────────────────────
 * A row can exist without `training_completed_at`. That is a real state — an
 * admin has said "this teacher will teach maths" and the training has not
 * happened — and flattening it away would put a teacher in front of a class
 * they have not been prepared for. So a subject is only "trained" when EVERY
 * course under it is, and a partly-trained subject says so with a count rather
 * than rounding in either direction.
 */

import { familyOf, optionsFor, type CourseFamily } from './course-options';

export interface TeacherAssignmentRow {
  track: string;
  level: string;
  training_completed_at?: string | null;
}

export interface Capability {
  /** The stored track slug — `mathematics`, `web`, `public-speaking`. */
  track: string;
  /** What a person calls it — "Mathematics", "Web Development". */
  label: string;
  family: CourseFamily;
  /** Every level held under this subject, in the order they were given. */
  levels: string[];
  /** How many of those levels have training signed off. */
  trainedCount: number;
  /** True only when every level under this subject is signed off. */
  trained: boolean;
}

/** Family order, so the chips read the same way on every screen. */
const FAMILY_RANK: Record<CourseFamily, number> = { school: 0, coding: 1, focus: 2 };

/**
 * Collapse assignment rows into one entry per subject.
 *
 * Order is deliberate and stable: school subjects, then coding, then focus
 * courses, alphabetical within each. A list that reshuffles between renders is
 * a list nobody learns to scan.
 */
export function summariseCapabilities(rows: TeacherAssignmentRow[] | null | undefined): Capability[] {
  const bySubject = new Map<string, Capability>();

  for (const row of rows ?? []) {
    const track = (row?.track ?? '').trim();
    if (!track) continue;
    const level = (row?.level ?? '').trim();
    const family = familyOf(track, level);

    let cap = bySubject.get(track);
    if (!cap) {
      cap = {
        track,
        label: optionsFor(family).find((o) => o.value === track)?.label ?? track,
        family,
        levels: [],
        trainedCount: 0,
        trained: false,
      };
      bySubject.set(track, cap);
    }

    // A duplicate (track, level) is a double-assignment, not a second course.
    if (level && !cap.levels.includes(level)) cap.levels.push(level);
    if (row.training_completed_at) cap.trainedCount++;
  }

  const out = [...bySubject.values()];
  for (const cap of out) {
    /* A subject with no levels at all still counts as one course, or a row
       stored with an empty level would report 0 of 0 and read as trained. */
    const total = Math.max(cap.levels.length, 1);
    cap.trained = cap.trainedCount >= total;
  }

  return out.sort(
    (a, b) => FAMILY_RANK[a.family] - FAMILY_RANK[b.family] || a.label.localeCompare(b.label)
  );
}

/**
 * The one-line answer for a table cell: "Mathematics, Web Development, Public
 * Speaking". Empty string when there is nothing, so the caller can decide what
 * "nothing" looks like rather than being handed the word "None".
 */
export function capabilityLine(rows: TeacherAssignmentRow[] | null | undefined, limit = 0): string {
  const caps = summariseCapabilities(rows);
  if (caps.length === 0) return '';
  if (limit > 0 && caps.length > limit) {
    return `${caps.slice(0, limit).map((c) => c.label).join(', ')} +${caps.length - limit} more`;
  }
  return caps.map((c) => c.label).join(', ');
}

/**
 * What the chip says underneath the subject name.
 *
 * Three states, because two would lie. "Grade 7, 8, 9" when everything is
 * signed off; "2 of 3 trained" when it is halfway, which is the state an admin
 * needs to see and act on; "training pending" when none of it is done.
 */
export function capabilityDetail(cap: Capability): string {
  const total = Math.max(cap.levels.length, 1);

  if (cap.trainedCount === 0) return 'training pending';
  if (!cap.trained) return `${cap.trainedCount} of ${total} trained`;

  if (cap.family === 'school') {
    const grades = cap.levels
      .map((l) => l.replace(/^(grade|group)-/, ''))
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));
    return grades.length ? `Grade ${grades.join(', ')}` : 'trained';
  }
  if (cap.family === 'focus') return 'focus course';
  return cap.levels.length ? cap.levels.join(', ') : 'trained';
}

/**
 * Can this teacher be put in front of this exact course?
 *
 * The strict question, for the scheduler: eligible AND trained for that precise
 * (track, level). "Trained for Mathematics" is a summary for humans; a Grade 9
 * class needs the Grade 9 row signed off, and a summary must never be what
 * decides that.
 */
export function isTrainedFor(
  rows: TeacherAssignmentRow[] | null | undefined,
  track: string,
  level: string
): boolean {
  return (rows ?? []).some(
    (r) => r.track === track && r.level === level && !!r.training_completed_at
  );
}

/** Eligible for it, whether or not the training is signed off. */
export function isEligibleFor(
  rows: TeacherAssignmentRow[] | null | undefined,
  track: string,
  level: string
): boolean {
  return (rows ?? []).some((r) => r.track === track && r.level === level);
}
