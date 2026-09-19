import type { createServiceClient } from '@/lib/supabase/server';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';
import { COURSES } from '@/lib/sariro-data';
import { resolveUnitKey } from '@/lib/curriculum/identity';
import { evidenceForUnit } from '@/lib/learner-model/evidence';
import { recordEvidence } from '@/lib/learner-model/record';

/**
 * SARIRO — a class attended moves the student one lesson on
 * ============================================================================
 * Lifted out of /api/teacher/attendance (19 Sep 2026), because it was the ONLY
 * place a lesson advanced — and a teacher tapping "Present" was the only thing
 * that called it. A child who joined through Sariro was already written down
 * as present by /api/student/join-class, so the register showed "Present" lit
 * up, the teacher had nothing to tap, and that child's progress never moved.
 *
 * Now the same function runs from the single mark, the whole-register confirm
 * (/api/teacher/register) and, as a safety net, when a class is completed. It
 * is idempotent — lesson_progress is unique per (enrollment, module, lesson) —
 * so running it twice is a no-op, never a double count.
 *
 * Lesson order: this booking's position among the cohort's REAL classes
 * (scheduled or completed, by start time) — a cancelled or no-show slot does
 * not use up a lesson.
 */

type Admin = ReturnType<typeof createServiceClient>;

export interface AdvanceResult {
  lessonMarked: boolean;
  idempotent?: boolean;
  moduleNum?: string;
  lessonName?: string;
  /** 1-based — the number a teacher and a student both use. */
  lessonNumber?: number;
  lessonIndex?: number;
  syllabusLength?: number;
  reason?: string;
  error?: string;
}

function flattenSyllabus(track: string, level: string): { moduleNum: string; lessonName: string }[] {
  const syllabus = getCourseSyllabus(track, level);
  const out: { moduleNum: string; lessonName: string }[] = [];
  for (const mod of syllabus.modules) {
    for (const lesson of mod.lessons) {
      out.push({ moduleNum: mod.num, lessonName: typeof lesson === 'string' ? lesson : lesson.name });
    }
  }
  return out;
}

/** Record a completed lesson as (weak) learning evidence. Never throws. */
async function recordLessonEvidence(track: string, level: string, studentId: string, moduleNum: string, lessonName: string): Promise<void> {
  try {
    const course = COURSES.find((c) => c.trackId === track && c.level.toLowerCase() === String(level).toLowerCase());
    if (!course) return;
    const unitKey = resolveUnitKey(course.id, moduleNum, lessonName);
    if (!unitKey) return;
    const rows = evidenceForUnit(unitKey, {
      learnerId: studentId,
      source: 'lesson_complete',
      // Keyed to the lesson so re-marking the same lesson cannot inflate mastery.
      sourceRef: `${course.id}:${moduleNum}:${lessonName}`,
      signal: 0.4,
    });
    await recordEvidence(rows, 'attendance');
  } catch (err) {
    console.warn('[advance-lesson] evidence skipped:', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Mark this booking's lesson complete for one student. The caller has already
 * checked who may do this; the service-role client is needed because
 * lesson_progress belongs to the student.
 */
export async function advanceLesson(admin: Admin, bookingId: string, cohortId: string, studentId: string): Promise<AdvanceResult> {
  const { data: cohort } = await admin.from('cohorts').select('id, track, level').eq('id', cohortId).maybeSingle();
  if (!cohort) return { lessonMarked: false, reason: 'cohort_not_found' };

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', studentId)
    .eq('cohort_id', cohortId)
    .neq('status', 'dropped')
    .limit(1)
    .maybeSingle();
  if (!enrollment) return { lessonMarked: false, reason: 'enrollment_not_found' };

  const lessons = flattenSyllabus(cohort.track as string, cohort.level as string);
  if (lessons.length === 0) return { lessonMarked: false, reason: 'no_syllabus' };

  const { data: cohortBookings, error: cbErr } = await admin
    .from('bookings')
    .select('id, slot_start')
    .eq('cohort_id', cohortId)
    .in('status', ['scheduled', 'completed'])
    .order('slot_start', { ascending: true });
  if (cbErr || !cohortBookings) return { lessonMarked: false, reason: 'cohort_bookings_lookup_failed' };

  const lessonIndex = cohortBookings.findIndex((b) => b.id === bookingId);
  if (lessonIndex < 0 || lessonIndex >= lessons.length) {
    return {
      lessonMarked: false,
      reason: lessonIndex < 0 ? 'booking_not_in_cohort' : 'lesson_index_out_of_syllabus',
      lessonIndex,
      syllabusLength: lessons.length,
    };
  }
  const { moduleNum, lessonName } = lessons[lessonIndex];
  const lessonNumber = lessonIndex + 1;

  /* Stamp the lesson onto the booking, so the teacher's calendar and the
     student's Class Notes can name it. Best-effort, and only when blank. */
  await admin.from('bookings').update({ module_num: moduleNum, lesson_name: lessonName }).eq('id', bookingId).is('module_num', null);

  const { error: lpErr } = await admin.from('lesson_progress').insert({
    enrollment_id: enrollment.id,
    module_num: moduleNum,
    lesson_name: lessonName,
  });
  if (lpErr) {
    // 23505 = unique_violation: already marked — the lesson HAS advanced.
    if (lpErr.code === '23505') return { lessonMarked: true, idempotent: true, moduleNum, lessonName, lessonNumber, lessonIndex };
    console.warn('[advance-lesson] lesson_progress insert error:', lpErr.message);
    return { lessonMarked: false, reason: 'lesson_progress_insert_failed', error: lpErr.message };
  }

  await recordLessonEvidence(cohort.track as string, cohort.level as string, studentId, moduleNum, lessonName);
  return { lessonMarked: true, moduleNum, lessonName, lessonNumber, lessonIndex, syllabusLength: lessons.length };
}

/**
 * The safety net: advance the lesson for every student this class has as
 * present or late. Used when a class is completed. Never throws — a class that
 * was taught must stay completed even if a lesson cannot be stamped.
 */
export async function advanceLessonsForClass(admin: Admin, bookingId: string, cohortId: string): Promise<{ advanced: number; failed: number }> {
  let advanced = 0;
  let failed = 0;
  try {
    const { data: rows } = await admin.from('session_attendance').select('student_id, status').eq('booking_id', bookingId).in('status', ['present', 'late']);
    for (const r of rows ?? []) {
      const res = await advanceLesson(admin, bookingId, cohortId, r.student_id as string);
      if (res.lessonMarked) advanced += 1;
      else failed += 1;
    }
  } catch (err) {
    console.warn('[advance-lesson] class sweep failed:', err instanceof Error ? err.message : String(err));
  }
  return { advanced, failed };
}
