import { getCourseSyllabus } from '@/lib/dashboard/student-data';

/**
 * SARIRO — which lesson a scheduled class is actually teaching
 * ============================================================================
 * Two problems, one answer.
 *
 * ── The batch scheduler never said ──────────────────────────────────────────
 * /api/admin/schedule generates a term's worth of bookings and wrote no lesson
 * on any of them. Every batch-scheduled booking in production has module_num
 * and lesson_name NULL, so no screen can name what is being taught — the
 * teacher's class list, the student's "Today:", the reminder email, all blank.
 *
 * ── And the scheduler could not choose where to start ───────────────────────
 * The lesson was derived from a count: the Nth booking is the Nth lesson. That
 * is right for a batch starting at the beginning and wrong for every other
 * case — a batch resuming after a break, a group that covered the first three
 * lessons in a bridge course, a re-run for children who joined late.
 *
 * So the sequence is computed here from an explicit starting point, and the
 * scheduler picks it.
 */

export interface PlannedLesson {
  /** 1-based across the whole course, which is what a person counts in. */
  number: number;
  /** Kept as a string because that is what bookings.module_num stores. */
  moduleNum: string;
  name: string;
}

/**
 * Every lesson in a course, flattened and numbered.
 *
 * Modules are a teaching structure, not a schedule. A scheduler thinking about
 * "start at lesson 9" does not want to work out that lesson 9 is module 3
 * lesson 1, and neither does anything else in this file.
 */
export function lessonsOf(track: string, level: string): PlannedLesson[] {
  const syllabus = getCourseSyllabus(track, level);
  const out: PlannedLesson[] = [];
  for (const mod of syllabus?.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      out.push({
        number: out.length + 1,
        moduleNum: String(mod.num),
        name: typeof lesson === 'string' ? lesson : lesson.name,
      });
    }
  }
  return out;
}

/**
 * The lesson for the Nth class of a run that starts at `startAt`.
 *
 * `index` is 0-based within the run: the first generated booking is index 0 and
 * teaches `startAt`.
 *
 * Returns null past the end of the course rather than wrapping or clamping. A
 * batch with more sessions than lessons is having revision classes, and
 * labelling those "Lesson 1" again would be worse than labelling them nothing.
 */
export function lessonForIndex(
  track: string,
  level: string,
  index: number,
  startAt = 1
): PlannedLesson | null {
  const all = lessonsOf(track, level);
  if (all.length === 0) return null;

  const start = Math.max(1, Math.min(all.length, Math.round(startAt || 1)));
  const wanted = start + Math.max(0, Math.round(index));
  return all[wanted - 1] ?? null;
}

/**
 * How many of a course a run starting here would actually cover.
 *
 * Shown next to the picker so "start at lesson 9" is visibly a decision about
 * how much of the course a batch gets, not a numbering preference.
 */
export function remainingFrom(track: string, level: string, startAt: number): number {
  const total = lessonsOf(track, level).length;
  if (total === 0) return 0;
  const start = Math.max(1, Math.min(total, Math.round(startAt || 1)));
  return total - start + 1;
}
