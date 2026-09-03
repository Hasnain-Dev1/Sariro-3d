import { getCourseSyllabus } from '@/lib/dashboard/student-data';
import type { createServiceClient } from '@/lib/supabase/server';

/**
 * SARIRO — which lesson a class actually is
 * =========================================================
 * SERVER ONLY.
 *
 * ── The gap this closes ─────────────────────────────────────────────────────
 * Every booking in the database had module_num and lesson_name set to NULL. A
 * scheduled class knew its date, its teacher and its cohort, but not which
 * lesson it was. The lesson number was worked out during attendance marking,
 * used once, and thrown away.
 *
 * Four separate complaints came out of that one gap:
 *   - a teacher could not see which lesson number a class was;
 *   - the student's Class Notes and Projects said "Review Lesson" for every
 *     entry, because there was no name to show;
 *   - progress depended on recomputing the index correctly every time;
 *   - and when that recomputation failed it failed silently.
 *
 * ── One rule, written down once ─────────────────────────────────────────────
 * The Nth real class in a cohort is the Nth lesson of its syllabus. Cancelled
 * and no-show slots do not consume a lesson: a missed class slides the
 * remaining lessons forward rather than skipping one, which is what the
 * reschedule engine already assumes.
 *
 * ── Why it re-stamps rather than assigning once ─────────────────────────────
 * Classes get rescheduled, cancelled and inserted. A lesson number written once
 * at creation would be wrong the first time a class moved. So identity is
 * derived from current position every time this runs, and rows whose stored
 * value disagrees are corrected. It is idempotent and safe to call often.
 */

type Admin = ReturnType<typeof createServiceClient>;

export interface Lesson {
  /** 1-based position across the whole course. */
  number: number;
  moduleNum: string;
  lessonName: string;
}

/** The syllabus as a flat, ordered list — the order classes are taught in. */
export function lessonsForCourse(track: string, level: string): Lesson[] {
  const syllabus = getCourseSyllabus(track, level);
  const out: Lesson[] = [];
  for (const mod of syllabus.modules) {
    for (const lesson of mod.lessons) {
      const lessonName = typeof lesson === 'string' ? lesson : lesson.name;
      out.push({ number: out.length + 1, moduleNum: mod.num, lessonName });
    }
  }
  return out;
}

/** Statuses that occupy a place in the lesson order. */
const COUNTS_TOWARD_ORDER = ['scheduled', 'completed'];

export interface BookingLesson {
  bookingId: string;
  slotStart: string;
  lesson: Lesson | null;
}

/**
 * Work out — and persist — which lesson each of a cohort's classes is.
 *
 * Returns the mapping whether or not anything needed writing, so callers can
 * use it directly rather than reading the rows back.
 */
export async function assignLessonIdentity(
  admin: Admin,
  cohortId: string
): Promise<{ lessons: BookingLesson[]; updated: number; reason?: string }> {
  const { data: cohort } = await admin
    .from('cohorts')
    .select('id, track, level')
    .eq('id', cohortId)
    .maybeSingle();
  if (!cohort) return { lessons: [], updated: 0, reason: 'cohort_not_found' };

  const syllabus = lessonsForCourse(cohort.track as string, cohort.level as string);
  if (syllabus.length === 0) return { lessons: [], updated: 0, reason: 'no_syllabus' };

  const { data: bookingRows } = await admin
    .from('bookings')
    .select('id, slot_start, status, module_num, lesson_name')
    .eq('cohort_id', cohortId)
    .in('status', COUNTS_TOWARD_ORDER)
    .order('slot_start', { ascending: true });

  const bookings = (bookingRows ?? []) as {
    id: string; slot_start: string; status: string;
    module_num: string | null; lesson_name: string | null;
  }[];

  const lessons: BookingLesson[] = [];
  const toFix: { id: string; moduleNum: string; lessonName: string }[] = [];

  bookings.forEach((b, i) => {
    // A course can run out of syllabus before it runs out of scheduled slots.
    // Those classes get no lesson rather than a wrong one.
    const lesson = i < syllabus.length ? syllabus[i] : null;
    lessons.push({ bookingId: b.id, slotStart: b.slot_start, lesson });

    if (lesson && (b.module_num !== lesson.moduleNum || b.lesson_name !== lesson.lessonName)) {
      toFix.push({ id: b.id, moduleNum: lesson.moduleNum, lessonName: lesson.lessonName });
    }
  });

  // Written one at a time rather than as an upsert: an upsert on bookings would
  // need every NOT NULL column present, and getting that wrong would blank real
  // scheduling data to stamp a lesson name on it.
  for (const fix of toFix) {
    await admin
      .from('bookings')
      .update({ module_num: fix.moduleNum, lesson_name: fix.lessonName })
      .eq('id', fix.id);
  }

  return { lessons, updated: toFix.length };
}

