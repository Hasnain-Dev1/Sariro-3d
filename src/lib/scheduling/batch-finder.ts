/**
 * SARIRO — finding the right batch, fast
 * ============================================================================
 * The founder, 17 Sep 2026: "think like a scheduler". Placing a child was a
 * tour of every batch — open it, count the children, work out which lesson it
 * is on, check the teacher, check the time — for every child who paid, paused
 * or came back.
 *
 * This is the part of that job a machine should do: every open batch with its
 * seats, its teacher, its days and the lesson it has reached, filtered the way
 * a scheduler asks ("Grades 1–3, a seat free, somewhere around lesson 12") and,
 * for one particular child, ranked by how well each batch fits them — no clash
 * with their other classes, a seat, and the lesson they are actually up to.
 *
 * Pure: the route (api/admin/batch-finder) reads the database.
 */

export interface BatchDay { day: number; time: string }

export interface BatchSummary {
  cohortId: string;
  batchCode: string | null;
  courseTitle: string;
  track: string;
  level: string;
  ratio: string;
  status: string;
  country: string | null;
  capacity: number;
  enrolled: number;
  studentNames: string[];
  scheduleId: string | null;
  teacher: { id: string; name: string | null } | null;
  days: BatchDay[];
  timezone: string | null;
  /** Classes taught so far. */
  lessonsDone: number;
  /** The lesson the next class teaches, or null (no class scheduled, or past the course). */
  nextLesson: { number: number; name: string } | null;
  totalLessons: number;
  nextClassAt: string | null;
  /** Scheduled classes still to come. */
  remaining: number;
  /** Set in student mode: the batch's first upcoming class that overlaps one of that child's classes. */
  clashAt?: string | null;
}

export interface FinderFilters {
  courseTitle?: string | null;
  ratio?: string | null;
  freeSeatsOnly?: boolean;
  lessonFrom?: number | null;
  lessonTo?: number | null;
  teacherId?: string | null;
  day?: number | null;
  status?: string | null;
}

/** Seats in a batch: its own limit, else what its ratio allows. */
export function seatCapacity(ratio: string | null | undefined, maxCapacity: number | null | undefined): number {
  if (typeof maxCapacity === 'number' && maxCapacity > 0) return maxCapacity;
  return ratio === '1:1' ? 1 : 4;
}

export const freeSeats = (b: Pick<BatchSummary, 'capacity' | 'enrolled'>) => Math.max(0, b.capacity - b.enrolled);

/** The lesson a batch is "at": what its next class teaches, or one past what it has taught. */
export const batchLessonAt = (b: Pick<BatchSummary, 'nextLesson' | 'lessonsDone'>) => b.nextLesson?.number ?? b.lessonsDone + 1;

export function matchesFilters(b: BatchSummary, f: FinderFilters): boolean {
  if (f.courseTitle && b.courseTitle !== f.courseTitle) return false;
  if (f.ratio && b.ratio !== f.ratio) return false;
  if (f.freeSeatsOnly && freeSeats(b) === 0) return false;
  if (f.status && b.status !== f.status) return false;
  if (f.teacherId && b.teacher?.id !== f.teacherId) return false;
  if (typeof f.day === 'number' && !b.days.some((d) => d.day === f.day)) return false;
  const at = batchLessonAt(b);
  if (typeof f.lessonFrom === 'number' && at < f.lessonFrom) return false;
  if (typeof f.lessonTo === 'number' && at > f.lessonTo) return false;
  return true;
}

export interface StudentPosition {
  /** Lessons this child has finished in the course. */
  lessonsDone: number;
}

export interface Fit {
  /** Lessons the child would miss (positive) or repeat (negative) joining now. 0 is a perfect fit. */
  gap: number;
  clash: boolean;
  full: boolean;
  /** Lower is better. */
  rank: number;
  /** What a scheduler reads next to the batch. */
  note: string;
}

export function fitFor(b: BatchSummary, student: StudentPosition): Fit {
  const gap = batchLessonAt(b) - (student.lessonsDone + 1);
  const clash = !!b.clashAt;
  const full = freeSeats(b) === 0;
  const note = gap === 0
    ? 'At the lesson they are up to'
    : gap > 0
      ? `Ahead by ${gap} lesson${gap === 1 ? '' : 's'} — they would miss ${gap === 1 ? 'one' : gap}`
      : `Behind by ${-gap} lesson${gap === -1 ? '' : 's'} — they would repeat ${gap === -1 ? 'one' : -gap}`;
  // A clash or a full batch cannot take them at all; after that, the closest lesson wins,
  // missing lessons counting a little worse than repeating them.
  const rank = (clash ? 10_000 : 0) + (full ? 5_000 : 0) + (gap > 0 ? gap * 12 : -gap * 10);
  return { gap, clash, full, rank, note };
}

/** Batches for one child, best first. Ties go to the batch that starts sooner. */
export function rankForStudent(batches: readonly BatchSummary[], student: StudentPosition): { batch: BatchSummary; fit: Fit }[] {
  return batches
    .map((batch) => ({ batch, fit: fitFor(batch, student) }))
    .sort((a, b) => a.fit.rank - b.fit.rank || (Date.parse(a.batch.nextClassAt ?? '9999') - Date.parse(b.batch.nextClassAt ?? '9999')));
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Sun 17:00, Wed 18:30" */
export const daysLabel = (days: readonly BatchDay[]) =>
  days.length ? [...days].sort((a, b) => a.day - b.day).map((d) => `${WD[d.day] ?? '?'} ${d.time.slice(0, 5)}`).join(', ') : 'No days set';
