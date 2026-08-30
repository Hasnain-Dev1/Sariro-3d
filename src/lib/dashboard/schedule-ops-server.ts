/**
 * SARIRO — Class-operations policy: shared server helpers
 * =======================================================
 * Actor resolution + policy constants for the reschedule / cancel engines.
 * Server-only (uses the service role after an auth check).
 */

import 'server-only';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';

/** Business-rule constants (single source of truth). */
export const POLICY = {
  /** Teacher self-serve class cancellations allowed per calendar month. */
  SELF_SERVE_CANCEL_LIMIT: 12,
  /** Teacher pay for a student-initiated 1:1 cancellation, as % of base. */
  PARTIAL_PAY_PERCENT: 50,
  /** A student may cancel a 1:1 only this many hours (or more) before start. */
  ONE_TO_ONE_CANCEL_WINDOW_HOURS: 2,
} as const;

export type ActorRole = 'student' | 'teacher' | 'admin' | 'super_admin' | 'hr' | 'parent' | 'unknown';

export interface Actor {
  userId: string;
  role: ActorRole;
  isAdmin: boolean;   // admin OR super_admin
  isTeacher: boolean;
  isStudent: boolean;
  isHr: boolean;
}

/** Resolve the signed-in caller and their effective role. Null if unauthenticated. */
export async function resolveActor(): Promise<Actor | null> {
  let supa;
  try { supa = await createServerClientHelper(); } catch { return null; }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;

  const admin = createServiceClient();
  const { data: p } = await admin.from('profiles')
    .select('role, is_admin, is_super_admin, is_teacher, is_hr')
    .eq('id', user.id).single();

  const isAdmin = p?.role === 'admin' || p?.role === 'super_admin' || !!p?.is_admin || !!p?.is_super_admin;
  const isHr = p?.role === 'hr' || !!p?.is_hr;
  const isTeacher = p?.role === 'teacher' || !!p?.is_teacher;
  const role: ActorRole =
    p?.role === 'super_admin' || p?.is_super_admin ? 'super_admin'
    : p?.role === 'admin' || p?.is_admin ? 'admin'
    : isHr ? 'hr'
    : isTeacher ? 'teacher'
    : (p?.role as ActorRole) ?? 'student';

  return {
    userId: user.id, role,
    isAdmin, isHr, isTeacher,
    isStudent: !isAdmin && !isHr && !isTeacher,
  };
}

export interface BookingRow {
  id: string;
  cohort_id: string;
  teacher_id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  schedule_id: string | null;
}

/** The active bookings of a cohort, ordered by start (scheduled + completed). */
export async function cohortTimeline(admin: ReturnType<typeof createServiceClient>, cohortId: string): Promise<BookingRow[]> {
  const { data } = await admin.from('bookings')
    .select('id, cohort_id, teacher_id, slot_start, slot_end, status, schedule_id')
    .eq('cohort_id', cohortId)
    .in('status', ['scheduled', 'completed'])
    .order('slot_start', { ascending: true });
  return (data ?? []) as BookingRow[];
}

/** Count a teacher's own cancellations in the current calendar month (UTC). */
export async function teacherCancelCountThisMonth(admin: ReturnType<typeof createServiceClient>, teacherId: string): Promise<number> {
  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const { count } = await admin.from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .eq('cancel_actor_role', 'teacher')
    .gte('cancelled_at', monthStart.toISOString());
  return count ?? 0;
}

/**
 * True if the given teacher already has an active (scheduled/completed)
 * booking that overlaps [slotStart, slotEnd) — same teacher can't be in two
 * classes at once. Standard interval-overlap test: existing.start < new.end
 * AND existing.end > new.start. Pass excludeBookingId when checking a
 * reschedule so the booking's own current slot doesn't conflict with itself.
 */
export async function teacherHasConflict(
  admin: ReturnType<typeof createServiceClient>,
  teacherId: string,
  slotStart: string,
  slotEnd: string,
  opts?: { excludeBookingId?: string; excludeScheduleId?: string }
): Promise<boolean> {
  let query = admin.from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .in('status', ['scheduled', 'completed'])
    .lt('slot_start', slotEnd)
    .gt('slot_end', slotStart);
  if (opts?.excludeBookingId) query = query.neq('id', opts.excludeBookingId);
  // Exclude a whole recurring schedule's own bookings — used when regenerating
  // that same schedule's slots, so its own (soon-to-be-replaced) bookings
  // never conflict with themselves.
  if (opts?.excludeScheduleId) query = query.or(`schedule_id.is.null,schedule_id.neq.${opts.excludeScheduleId}`);
  const { count } = await query;
  return (count ?? 0) > 0;
}

/**
 * The same test, for LEARNERS — which nothing checked until now.
 *
 * `teacherHasConflict` has always stopped a teacher being booked twice at once,
 * but a student could be. That was survivable while Sariro sold one coding
 * track per learner; it stopped being survivable when a child could take maths,
 * physics and coding at the same time. Three separate enrolments, three separate
 * schedulers, and nothing anywhere noticing they collide on a Tuesday at 17:30.
 *
 * The learner is not on `bookings` — they reach it through `enrollments`, so
 * this is two hops: their active cohorts, then any overlapping booking in one.
 *
 * Returns the clashing cohorts rather than a bare boolean, because the useful
 * admin message is "clashes with their Physics batch", not "conflict".
 */
export async function studentConflicts(
  admin: ReturnType<typeof createServiceClient>,
  studentId: string,
  slotStart: string,
  slotEnd: string,
  opts?: { excludeCohortId?: string; excludeBookingId?: string }
): Promise<{ bookingId: string; cohortId: string; slotStart: string; slotEnd: string }[]> {
  const { data: enrolments } = await admin
    .from('enrollments')
    .select('cohort_id')
    .eq('user_id', studentId)
    .eq('status', 'active');

  const cohortIds = (enrolments ?? [])
    .map((e: { cohort_id: string | null }) => e.cohort_id)
    .filter((id): id is string => !!id && id !== opts?.excludeCohortId);

  if (cohortIds.length === 0) return [];

  let query = admin
    .from('bookings')
    .select('id, cohort_id, slot_start, slot_end')
    .in('cohort_id', cohortIds)
    .in('status', ['scheduled', 'completed'])
    .lt('slot_start', slotEnd)
    .gt('slot_end', slotStart);
  if (opts?.excludeBookingId) query = query.neq('id', opts.excludeBookingId);

  const { data } = await query;
  return (data ?? []).map((b: { id: string; cohort_id: string; slot_start: string; slot_end: string }) => ({
    bookingId: b.id,
    cohortId: b.cohort_id,
    slotStart: b.slot_start,
    slotEnd: b.slot_end,
  }));
}

/**
 * "Aarav and Meera" rather than two UUIDs. An admin fixing a clash needs to know
 * WHO clashes — a message they cannot act on is the same as no message.
 */
export async function studentNamesFor(
  admin: ReturnType<typeof createServiceClient>,
  studentIds: string[]
): Promise<string> {
  if (studentIds.length === 0) return 'A student';
  const { data } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', studentIds);

  const names = (data ?? [])
    .map((p: { full_name: string | null }) => p.full_name?.trim())
    .filter((n): n is string => !!n);

  if (names.length === 0) return studentIds.length === 1 ? 'A student' : `${studentIds.length} students`;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Every learner in a cohort who would be double-booked by a slot at this time.
 *
 * This is the one the schedulers want: they are placing a whole batch, not one
 * child, so the question is "which of these kids already has something then?"
 */
export async function cohortStudentConflicts(
  admin: ReturnType<typeof createServiceClient>,
  cohortId: string,
  slotStart: string,
  slotEnd: string,
  opts?: { excludeBookingId?: string }
): Promise<{ studentId: string; clashingCohortIds: string[] }[]> {
  const { data: roster } = await admin
    .from('enrollments')
    .select('user_id')
    .eq('cohort_id', cohortId)
    .eq('status', 'active');

  const studentIds: string[] = [
    ...new Set<string>(
      (roster ?? [])
        .map((r: { user_id: string | null }) => r.user_id)
        .filter((id): id is string => !!id)
    ),
  ];

  const clashes: { studentId: string; clashingCohortIds: string[] }[] = [];
  for (const studentId of studentIds) {
    const found = await studentConflicts(admin, studentId, slotStart, slotEnd, {
      excludeCohortId: cohortId,
      excludeBookingId: opts?.excludeBookingId,
    });
    if (found.length > 0) {
      clashes.push({
        studentId,
        clashingCohortIds: [...new Set(found.map((f) => f.cohortId))],
      });
    }
  }
  return clashes;
}
