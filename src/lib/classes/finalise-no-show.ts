import type { SupabaseClient } from '@supabase/supabase-js';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';

/**
 * SARIRO — finalising a teacher no-show.
 *
 * ── Why this is a library and not just a route ──────────────────────────────
 * It used to live inside POST /api/booking/finalize-noshow, which needs a
 * person: a student, a teacher or an admin with the page open, clicking. So a
 * class nobody was sitting in front of was never finalised at all. On the live
 * database that was NINE trials in a row — every one a class the teacher never
 * started, every one still marked 'scheduled' days later, with no penalty, no
 * excusal and no lead moving anywhere.
 *
 * The rule is unchanged and still decided here rather than by the caller:
 * only a booking that is still 'scheduled', whose teacher never pressed Start,
 * more than ten minutes after it should have begun.
 *
 * On finalise (idempotent — a second call is a no-op):
 *   1. booking.status → 'no_show'
 *   2. −₹1,000 penalty earning for the teacher (pending)
 *   3. everybody due in the room marked 'excused' — enrolments for an ordinary
 *      class, the trial roster for a trial — so no class credit is consumed
 *   4. one make-up class appended to the end of a recurring schedule
 */

export const NO_SHOW_THRESHOLD_MIN = 10;
export const NO_SHOW_PENALTY = 1000;

export interface NoShowBooking {
  id: string;
  cohort_id: string | null;
  teacher_id: string | null;
  schedule_id: string | null;
  slot_start: string;
  status: string;
  teacher_started_at: string | null;
  is_trial: boolean | null;
  trial_student_id: string | null;
}

export type FinaliseOutcome =
  | { ok: true; already: true }
  | { ok: true; already: false; makeupAppended: boolean; excused: number }
  | { ok: false; reason: 'not_found' | 'not_yet' | 'update_failed'; message: string };

/** The columns finaliseNoShow needs — shared so callers select the same set. */
export const NO_SHOW_COLUMNS =
  'id, cohort_id, teacher_id, schedule_id, slot_start, slot_end, status, teacher_started_at, is_trial, trial_student_id';

/** Is this booking a no-show right now? The whole decision, in one place. */
export function isNoShowDue(booking: NoShowBooking, nowMs: number, thresholdMin = NO_SHOW_THRESHOLD_MIN): boolean {
  if (booking.status !== 'scheduled') return false;
  if (booking.teacher_started_at) return false;
  return nowMs - new Date(booking.slot_start).getTime() >= thresholdMin * 60_000;
}

export async function finaliseNoShow(
  admin: SupabaseClient,
  booking: NoShowBooking,
  nowMs: number = Date.now()
): Promise<FinaliseOutcome> {
  if (booking.status === 'no_show') return { ok: true, already: true };
  if (!isNoShowDue(booking, nowMs)) {
    return { ok: false, reason: 'not_yet', message: 'No-show conditions not met.' };
  }

  // 1. Mark no_show (guarded, so a race can only win once).
  const { data: updated, error: uErr } = await admin
    .from('bookings').update({ status: 'no_show' }).eq('id', booking.id).eq('status', 'scheduled').select('id');
  if (uErr) return { ok: false, reason: 'update_failed', message: uErr.message };
  // Lost the race — somebody else finalised it a moment ago.
  if (!updated || updated.length === 0) return { ok: true, already: true };

  // 2. −₹1,000 penalty earning (skipped if this booking already has one).
  const { data: existing } = await admin
    .from('teacher_earnings').select('id').eq('booking_id', booking.id).maybeSingle();
  if (!existing && booking.teacher_id) {
    // Guarded: a trial has no cohort, and `id = null` is not a lookup.
    const { data: cohort } = booking.cohort_id
      ? await admin.from('cohorts').select('ratio, track, level').eq('id', booking.cohort_id).maybeSingle()
      : { data: null };
    await admin.from('teacher_earnings').insert({
      teacher_id: booking.teacher_id, booking_id: booking.id, class_date: booking.slot_start,
      ratio: cohort?.ratio ?? null, track: cohort?.track ?? null, level: cohort?.level ?? null,
      student_count: 0, base_amount: 0, bonus_amount: 0,
      penalty_amount: NO_SHOW_PENALTY, penalty_reason: 'No-show / >10 min late',
      net_amount: -NO_SHOW_PENALTY, amount: -NO_SHOW_PENALTY, status: 'pending',
    });
  }

  /* 3. Excuse everybody who was due in the room, so no credit is consumed.
        A trial student is in neither enrolments nor a cohort — they are in
        trial_participants, or named on the booking. */
  const excusing = new Set<string>();
  if (booking.cohort_id) {
    const { data: enrs } = await admin.from('enrollments')
      .select('user_id').eq('cohort_id', booking.cohort_id).eq('status', 'active');
    for (const e of enrs ?? []) excusing.add((e as { user_id: string }).user_id);
  }
  if (booking.is_trial) {
    if (booking.trial_student_id) excusing.add(booking.trial_student_id);
    const { data: seats } = await admin.from('trial_participants')
      .select('student_id').eq('booking_id', booking.id);
    for (const s of seats ?? []) excusing.add((s as { student_id: string }).student_id);
  }
  for (const studentId of excusing) {
    await admin.from('session_attendance').upsert(
      { booking_id: booking.id, student_id: studentId, status: 'excused', marked_at: new Date().toISOString() },
      { onConflict: 'booking_id,student_id' }
    );
  }

  // 4. Append one make-up class at the end of the schedule (cascade forward).
  let makeupAppended = false;
  if (booking.schedule_id) {
    const { data: sched } = await admin
      .from('cohort_schedules').select('*').eq('id', booking.schedule_id).maybeSingle();
    if (sched && sched.status === 'active') {
      const { data: last } = await admin.from('bookings').select('slot_start')
        .eq('schedule_id', sched.id).in('status', ['scheduled', 'completed'])
        .order('slot_start', { ascending: false }).limit(1).maybeSingle();
      const after = last ? new Date(last.slot_start) : new Date(booking.slot_start);
      const slots = generateOccurrences({
        startDate: sched.start_date, daysOfWeek: sched.days_of_week, timeLocal: sched.time_local,
        durationMin: sched.duration_min, timezone: sched.timezone,
      }, 1, after);
      if (slots[0]) {
        await admin.from('bookings').insert({
          cohort_id: booking.cohort_id, teacher_id: booking.teacher_id, schedule_id: sched.id,
          slot_start: slots[0].slotStart, slot_end: slots[0].slotEnd, status: 'scheduled',
        });
        makeupAppended = true;
      }
    }
  }

  return { ok: true, already: false, makeupAppended, excused: excusing.size };
}
