import type { SupabaseClient } from '@supabase/supabase-js';
import { subjectLabel } from '@/lib/trial/subjects';
import { gradeTag } from '@/lib/grade/tag';

/**
 * SARIRO — the trial completion certificate
 * ============================================================================
 * The class page tells every family: "Join on time to receive your trial
 * completion certificate." Until this existed, nothing issued one. A promise
 * on the first page a parent ever reads, that nobody keeps, is the most
 * expensive kind of placeholder — so this is the thing that keeps it.
 *
 * ── What "on time" means, and how it is known ───────────────────────────────
 * A trial student never goes through /api/student/join-class (it requires a
 * cohort and credits, and a trial has neither), so for months nothing recorded
 * WHEN they joined. /api/trial/join now records it the moment they press Join,
 * as minutes after the start.
 *
 *   joined within ON_TIME_GRACE_MIN of the start   → certificate
 *   joined later than that                         → no certificate
 *   teacher recorded them absent                   → no certificate
 *   teacher confirmed them present, no join time   → certificate
 *
 * The last line is deliberate generosity. A child whose parent opened the
 * meeting from the email instead of our button still sat in the class, and
 * the teacher said so. Refusing them a certificate over which link was
 * clicked would punish the family for our instrumentation.
 *
 * ── Nothing is stored ───────────────────────────────────────────────────────
 * Like the course certificate, it is worked out from the booking and the
 * attendance whenever it is asked for. The number is deterministic, so the
 * same child and class always produce the same certificate.
 */

/** Minutes after the start that still count as on time. */
export const ON_TIME_GRACE_MIN = 5;

export interface AttendanceRow {
  status: string | null;
  join_delay_minutes: number | null;
}

export type Eligibility =
  | { eligible: true }
  | { eligible: false; reason: 'not_finished' | 'not_attended' | 'joined_late' | 'not_found' };

/** Whole minutes after the start, never negative — early is on time. */
export function lateByMinutes(slotStartIso: string, joinedAtMs: number): number {
  const start = Date.parse(slotStartIso);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((joinedAtMs - start) / 60_000));
}

/** The whole rule, with no database in it. */
export function certificateEligibility(input: {
  classOver: boolean;
  attendance: AttendanceRow | null;
}): Eligibility {
  if (!input.classOver) return { eligible: false, reason: 'not_finished' };
  const a = input.attendance;
  if (!a || !a.status || a.status === 'absent' || a.status === 'excused') {
    return { eligible: false, reason: 'not_attended' };
  }
  if (a.join_delay_minutes !== null && a.join_delay_minutes > ON_TIME_GRACE_MIN) {
    return { eligible: false, reason: 'joined_late' };
  }
  return { eligible: true };
}

/** The same child and class always produce the same number. */
export function certificateNumber(bookingId: string, studentId: string, slotStartIso: string): string {
  const year = new Date(slotStartIso).getUTCFullYear() || new Date().getUTCFullYear();
  const b = bookingId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const s = studentId.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `SARIRO-T-${year}-${b}${s}`;
}

export const REASON_COPY: Record<Exclude<Eligibility, { eligible: true }>['reason'], string> = {
  not_finished: 'Your certificate is issued once the class has finished.',
  not_attended: 'This certificate is issued to learners who attended the class.',
  joined_late: `This certificate is issued to learners who joined within ${ON_TIME_GRACE_MIN} minutes of the start.`,
  not_found: 'We could not find that class on your account.',
};

export interface TrialCertificate {
  number: string;
  studentName: string;
  course: string;
  grade: string;
  teacherName: string | null;
  /** ISO, for the page to format in the reader's own way. */
  classDate: string;
}

export type CertificateResult =
  | { ok: true; certificate: TrialCertificate }
  | { ok: false; reason: Exclude<Eligibility, { eligible: true }>['reason'] };

/**
 * Everything needed to decide, and to print. `studentId` is always the signed
 * in child — nobody can ask for a certificate on somebody else's behalf.
 */
export async function trialCertificateFor(
  admin: SupabaseClient,
  bookingId: string,
  studentId: string,
  nowMs: number = Date.now()
): Promise<CertificateResult> {
  const { data: booking } = await admin
    .from('bookings')
    .select('id, slot_start, slot_end, status, is_trial, trial_student_id, trial_subject, teacher_id')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking || !booking.is_trial || booking.status === 'cancelled') {
    return { ok: false, reason: 'not_found' };
  }

  const [{ data: seat }, { data: attendance }, { data: student }] = await Promise.all([
    admin.from('trial_participants').select('grade')
      .eq('booking_id', bookingId).eq('student_id', studentId).maybeSingle(),
    admin.from('session_attendance').select('status, join_delay_minutes')
      .eq('booking_id', bookingId).eq('student_id', studentId).maybeSingle(),
    admin.from('profiles').select('full_name').eq('id', studentId).maybeSingle(),
  ]);

  // Theirs? Named on the booking, or seated in it.
  if (booking.trial_student_id !== studentId && !seat) return { ok: false, reason: 'not_found' };

  const classOver = booking.status === 'completed' || Date.parse(booking.slot_end) < nowMs;
  const verdict = certificateEligibility({
    classOver,
    attendance: (attendance as AttendanceRow | null) ?? null,
  });
  if (!verdict.eligible) return { ok: false, reason: verdict.reason };

  let teacherName: string | null = null;
  if (booking.teacher_id) {
    const { data: t } = await admin.from('profiles').select('full_name').eq('id', booking.teacher_id).maybeSingle();
    /* A profile name like "Mimo Patra (CEO & Director)" is a staff directory
       entry, not what a certificate should say. The title comes off. */
    teacherName = ((t?.full_name as string | null) ?? '').replace(/\s*\([^)]*\)\s*$/, '').trim() || null;
  }

  return {
    ok: true,
    certificate: {
      number: certificateNumber(bookingId, studentId, booking.slot_start),
      studentName: (student?.full_name as string | null) || 'Sariro learner',
      course: booking.trial_subject ? subjectLabel(booking.trial_subject) : 'Trial class',
      grade: gradeTag((seat?.grade as number | null) ?? null),
      teacherName,
      classDate: booking.slot_start,
    },
  };
}
