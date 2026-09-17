import type { createServiceClient } from '@/lib/supabase/server';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';
import { cohortStudentConflicts, teacherHasConflict } from '@/lib/dashboard/schedule-ops-server';
import { fillCourseSchedule } from '@/lib/dashboard/course-fill';

/**
 * SARIRO — changing a batch's teacher and its timetable (SERVER ONLY)
 * ============================================================================
 * The founder, 17 Sep 2026: changing a batch's teacher needs to move every
 * upcoming class to them — and the new teacher may not be free at the batch's
 * times, so the same place has to let the admin change the days and times as
 * well, without the two tools disagreeing.
 *
 * One home for both, used by the admin's batch control, the teacher's own
 * "change schedule" (api/schedule/reschedule-batch) and Manage batches:
 *
 *   rescheduleBatch   new days/times from a date, for the batch's teacher or a
 *                     new one: checks clashes first, then replaces the future
 *                     classes and fills the rest of the course
 *   changeTeacher     every upcoming class to a new teacher — refused, with the
 *                     clashing dates, when they are not free at those times
 */

type Admin = ReturnType<typeof createServiceClient>;

export interface DayTime { day: number; time: string; durationMin?: number }

const HM_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Checked for clashes before anything changes; course-fill schedules the rest after. */
const PRECHECK = 8;

export type OpResult<T> = ({ ok: true } & T) | { ok: false; status: number; error: string; message: string; clashes?: string[] };

/** Days from a request: 1–7 distinct weekdays, each with an HH:MM time. */
export function normaliseDays(raw: unknown): { ok: true; days: DayTime[] } | { ok: false; message: string } {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<number>();
  const days: DayTime[] = [];
  for (const d of list as { day?: unknown; time?: unknown; durationMin?: unknown }[]) {
    const day = Number(d?.day);
    const time = String(d?.time ?? '');
    if (!Number.isInteger(day) || day < 0 || day > 6) return { ok: false, message: `That is not a weekday: ${String(d?.day)}.` };
    if (!HM_RE.test(time)) return { ok: false, message: 'Give every day a time.' };
    if (seen.has(day)) continue;
    seen.add(day);
    const dur = Number(d?.durationMin);
    days.push({ day, time, durationMin: dur > 0 ? dur : undefined });
  }
  if (days.length < 1 || days.length > 7) return { ok: false, message: 'Pick between one and seven weekdays, each with a time.' };
  return { ok: true, days: days.sort((a, b) => a.day - b.day) };
}

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

/** Whether this teacher's training for the batch's course is marked complete. */
export async function teacherTrainedFor(admin: Admin, teacherId: string, cohortId: string): Promise<boolean> {
  const { data: cohort } = await admin.from('cohorts').select('track, level').eq('id', cohortId).maybeSingle();
  if (!cohort) return false;
  const { data } = await admin.from('teacher_course_assignments').select('id')
    .eq('teacher_id', teacherId).ilike('track', cohort.track as string).ilike('level', cohort.level as string)
    .not('training_completed_at', 'is', null).limit(1).maybeSingle();
  return !!data;
}

/** The batch's upcoming classes a teacher is NOT free for, at its current times. */
export async function clashesAtCurrentTimes(admin: Admin, scheduleId: string, teacherId: string): Promise<{ upcoming: number; clashes: string[] }> {
  const nowIso = new Date().toISOString();
  const { data: future } = await admin.from('bookings').select('slot_start, slot_end')
    .eq('schedule_id', scheduleId).eq('status', 'scheduled').gt('slot_start', nowIso).order('slot_start', { ascending: true });
  const upcoming = future ?? [];
  if (!upcoming.length) return { upcoming: 0, clashes: [] };
  const first = upcoming[0].slot_start as string;
  const last = upcoming[upcoming.length - 1].slot_end as string;
  const { data: busy } = await admin.from('bookings').select('slot_start, slot_end, schedule_id')
    .eq('teacher_id', teacherId).in('status', ['scheduled', 'completed'])
    .lt('slot_start', last).gt('slot_end', first);
  const theirs = (busy ?? []).filter((b) => b.schedule_id !== scheduleId);
  const t = (v: unknown) => Date.parse(String(v));
  const clashes = upcoming
    .filter((u) => theirs.some((b) => t(u.slot_start) < t(b.slot_end) && t(b.slot_start) < t(u.slot_end)))
    .map((u) => u.slot_start as string);
  return { upcoming: upcoming.length, clashes };
}

/**
 * New days and times from a date — for the batch's teacher, or for a new one.
 * Nothing changes if the first classes of the new timetable clash for the
 * teacher or a child.
 */
export async function rescheduleBatch(
  admin: Admin,
  opts: { scheduleId: string; days: DayTime[]; effectiveFrom?: string | null; teacherId?: string | null; actor: { userId: string; isAdmin: boolean } }
): Promise<OpResult<{ regenerated: number; cancelled: number; effectiveFrom: string; skipped: string[]; teacherId: string }>> {
  const { data: sched } = await admin.from('cohort_schedules')
    .select('id, cohort_id, teacher_id, timezone, duration_min, start_date').eq('id', opts.scheduleId).maybeSingle();
  if (!sched) return { ok: false, status: 404, error: 'not_found', message: 'That batch schedule no longer exists.' };
  const teacherId = (opts.teacherId || sched.teacher_id) as string | null;
  if (!teacherId) return { ok: false, status: 409, error: 'no_teacher', message: 'Pick a teacher for this batch.' };

  const todayStr = new Date().toISOString().slice(0, 10);
  let effectiveFrom = todayStr;
  if (opts.effectiveFrom) {
    if (!DATE_RE.test(opts.effectiveFrom) || Number.isNaN(Date.parse(opts.effectiveFrom))) {
      return { ok: false, status: 400, error: 'bad_effective_from', message: 'Pick a valid start date.' };
    }
    effectiveFrom = opts.effectiveFrom < todayStr ? todayStr : opts.effectiveFrom;
  }
  // Never before the batch starts.
  if (sched.start_date && effectiveFrom < (sched.start_date as string)) effectiveFrom = sched.start_date as string;

  const perDay: Record<number, { time: string; durationMin?: number }> = {};
  for (const d of opts.days) perDay[d.day] = { time: d.time, durationMin: d.durationMin };
  const slots = generateOccurrences({
    startDate: effectiveFrom, daysOfWeek: opts.days.map((d) => d.day), timeLocal: opts.days[0].time,
    durationMin: (sched.duration_min as number | null) ?? 60, timezone: (sched.timezone as string) ?? 'Asia/Kolkata', perDay,
  }, PRECHECK);

  const clashes: string[] = [];
  for (const s of slots) {
    if (await teacherHasConflict(admin, teacherId, s.slotStart, s.slotEnd, { excludeScheduleId: sched.id as string })) clashes.push(s.slotStart);
  }
  if (clashes.length) {
    return { ok: false, status: 409, error: 'teacher_conflict', clashes, message: `The teacher already has another class at ${clashes.slice(0, 3).map(when).join(', ')}${clashes.length > 3 ? ` and ${clashes.length - 3} more` : ''} (IST). Pick other days or times.` };
  }
  for (const s of slots) {
    const kids = await cohortStudentConflicts(admin, sched.cohort_id as string, s.slotStart, s.slotEnd);
    if (kids.length) {
      return { ok: false, status: 409, error: 'student_conflict', clashes: [s.slotStart], message: `${kids.length === 1 ? 'A child' : `${kids.length} children`} in this batch already ${kids.length === 1 ? 'has' : 'have'} another class at ${when(s.slotStart)} (IST). Pick other days or times.` };
    }
  }

  const nowIso = new Date().toISOString();
  await admin.from('cohort_schedules').update({
    days_of_week: opts.days.map((d) => d.day), time_local: opts.days[0].time, classes_per_week: opts.days.length,
    teacher_id: teacherId, status: 'active', updated_at: nowIso,
  }).eq('id', sched.id);
  await admin.from('cohort_schedule_days').delete().eq('schedule_id', sched.id);
  await admin.from('cohort_schedule_days').insert(opts.days.map((d) => ({
    schedule_id: sched.id, day_of_week: d.day, time_local: d.time, duration_min: d.durationMin ?? null,
  })));

  const { data: future } = await admin.from('bookings').select('id')
    .eq('schedule_id', sched.id).eq('status', 'scheduled').gt('slot_start', nowIso);
  if (future?.length) {
    await admin.from('bookings').update({
      status: 'cancelled', cancel_actor_role: opts.actor.isAdmin ? 'admin' : 'teacher', cancel_type: 'admin',
      pay_status: 'zero', cancelled_at: nowIso, cancelled_by: opts.actor.userId,
    }).in('id', future.map((b) => b.id));
  }

  if (slots.length) {
    await admin.from('bookings').insert(slots.map((s) => ({
      cohort_id: sched.cohort_id, teacher_id: teacherId, schedule_id: sched.id,
      slot_start: s.slotStart, slot_end: s.slotEnd, status: 'scheduled',
    })));
  }

  const filled = await fillCourseSchedule(admin, sched.id as string, { from: effectiveFrom });
  return {
    ok: true,
    regenerated: slots.length + (filled.ok ? filled.added : 0),
    cancelled: future?.length ?? 0,
    effectiveFrom,
    skipped: filled.skipped,
    teacherId,
  };
}

/** Every upcoming class of the batch to a new teacher, at the same days and times. */
export async function changeTeacher(
  admin: Admin,
  opts: { scheduleId: string; teacherId: string }
): Promise<OpResult<{ moved: number; previousTeacherId: string | null }>> {
  const { data: sched } = await admin.from('cohort_schedules').select('id, cohort_id, teacher_id').eq('id', opts.scheduleId).maybeSingle();
  if (!sched) return { ok: false, status: 404, error: 'not_found', message: 'That batch schedule no longer exists.' };

  const { clashes } = await clashesAtCurrentTimes(admin, opts.scheduleId, opts.teacherId);
  if (clashes.length) {
    return {
      ok: false, status: 409, error: 'teacher_conflict', clashes,
      message: `This teacher is not free for ${clashes.length} of the batch's upcoming classes (first: ${when(clashes[0])} IST). Change the days and times with the teacher.`,
    };
  }

  const nowIso = new Date().toISOString();
  const { error } = await admin.from('cohort_schedules').update({ teacher_id: opts.teacherId, status: 'active', updated_at: nowIso }).eq('id', opts.scheduleId);
  if (error) return { ok: false, status: 500, error: 'update_failed', message: error.message };
  const { data: moved } = await admin.from('bookings').update({ teacher_id: opts.teacherId })
    .eq('schedule_id', opts.scheduleId).eq('status', 'scheduled').gt('slot_start', nowIso).select('id');
  await fillCourseSchedule(admin, opts.scheduleId);
  return { ok: true, moved: moved?.length ?? 0, previousTeacherId: (sched.teacher_id as string | null) ?? null };
}
