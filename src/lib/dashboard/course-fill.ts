import type { createServiceClient } from '@/lib/supabase/server';
import { generateOccurrences, type PerDayTime } from '@/lib/dashboard/schedule-generation';
import { findLesson, lessonsOf, planCourseFill } from '@/lib/dashboard/lesson-plan';

/**
 * SARIRO — schedule the whole course, not the next eight classes
 * ============================================================================
 * SERVER ONLY.
 *
 * The founder, 17 Sep 2026: a Public Speaking batch of 48 classes showed eight
 * in the teacher's calendar and stopped in November. The schedulers generated
 * an eight-class "horizon" that was meant to be "topped up later", and nothing
 * ever topped it up — so every batch was eight classes long, and rescheduling
 * one replaced its future with another eight.
 *
 * This fills a batch to its course: every class the course has, on the batch's
 * own days and times, each stamped with its lesson. It is idempotent — a batch
 * that already has its whole course gets nothing added — so it runs after
 * scheduling, after a reschedule and when a batch gets a teacher back, and an
 * admin can run it on any batch.
 *
 * A slot where the teacher or one of the children already has another class is
 * skipped, not double-booked, and the course continues on the next free day;
 * the skipped dates are reported so a person can see why the course runs a week
 * longer.
 */

type Admin = ReturnType<typeof createServiceClient>;

/** A course the catalogue has no lessons for still runs a year of weekly classes. */
const FALLBACK_CLASSES = 48;
/** Room to step past clashes before giving up. */
const EXTRA_CANDIDATES = 26;

export interface FillResult {
  ok: boolean;
  reason?: string;
  /** Classes the course has. */
  total: number;
  /** Classes added now. */
  added: number;
  /** Existing classes given their lesson now. */
  stamped: number;
  /** Start times skipped because the teacher or a child already has a class then. */
  skipped: string[];
  /** Classes the batch still lacks after this run (only when it ran out of free slots). */
  stillMissing: number;
}

interface BookingRow { id: string; slot_start: string; slot_end: string | null; module_num: string | null; lesson_name: string | null }

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

export async function fillCourseSchedule(admin: Admin, scheduleId: string, opts: { from?: string } = {}): Promise<FillResult> {
  const empty = (reason: string): FillResult => ({ ok: false, reason, total: 0, added: 0, stamped: 0, skipped: [], stillMissing: 0 });

  const { data: sched } = await admin.from('cohort_schedules')
    .select('id, cohort_id, teacher_id, start_date, days_of_week, time_local, duration_min, timezone, status')
    .eq('id', scheduleId).maybeSingle();
  if (!sched) return empty('schedule_not_found');
  if (sched.status !== 'active') return empty('schedule_not_active');
  if (!sched.teacher_id) return empty('no_teacher');

  const [{ data: cohort }, { data: dayRows }] = await Promise.all([
    admin.from('cohorts').select('track, level').eq('id', sched.cohort_id).maybeSingle(),
    admin.from('cohort_schedule_days').select('day_of_week, time_local, duration_min').eq('schedule_id', scheduleId),
  ]);
  const lessons = cohort ? lessonsOf(cohort.track as string, cohort.level as string) : [];
  const total = lessons.length || FALLBACK_CLASSES;

  /* The batch's real classes so far, in order. Cancelled and no-show classes do
     not use up a lesson — the same rule as lesson-identity and the cancel route. */
  const { data: existingRows } = await admin.from('bookings')
    .select('id, slot_start, slot_end, module_num, lesson_name')
    .eq('cohort_id', sched.cohort_id).in('status', ['scheduled', 'completed'])
    .order('slot_start', { ascending: true });
  const existing = (existingRows ?? []) as BookingRow[];

  const plan = planCourseFill(existing, total, (b) => (lessons.length ? findLesson(lessons, b.module_num, b.lesson_name)?.number ?? null : null));

  let stamped = 0;
  for (const s of plan.stamps) {
    const lesson = lessons[s.number - 1];
    if (!lesson) continue;
    const { error } = await admin.from('bookings').update({ module_num: lesson.moduleNum, lesson_name: lesson.name }).eq('id', s.item.id);
    if (!error) stamped++;
  }

  if (plan.toAdd === 0) return { ok: true, total, added: 0, stamped, skipped: [], stillMissing: 0 };

  /* After the last class, never in the past, never before the batch starts. */
  const last = existing[existing.length - 1];
  const fromMs = opts.from ? Date.parse(`${opts.from}T00:00:00Z`) : 0;
  const after = new Date(Math.max(last ? Date.parse(last.slot_start) + 60_000 : 0, Date.now(), Number.isFinite(fromMs) ? fromMs : 0));
  const perDay: Record<number, PerDayTime> = {};
  for (const d of (dayRows ?? []) as { day_of_week: number; time_local: string; duration_min: number | null }[]) {
    perDay[d.day_of_week] = { time: d.time_local, durationMin: d.duration_min ?? undefined };
  }
  const daysOfWeek = Object.keys(perDay).length ? Object.keys(perDay).map(Number) : ((sched.days_of_week as number[] | null) ?? []);
  if (daysOfWeek.length === 0) return { ok: false, reason: 'no_days', total, added: 0, stamped, skipped: [], stillMissing: plan.toAdd };

  const candidates = generateOccurrences({
    startDate: (sched.start_date as string) ?? new Date().toISOString().slice(0, 10),
    daysOfWeek,
    timeLocal: (sched.time_local as string) ?? '17:00',
    durationMin: (sched.duration_min as number | null) ?? 60,
    timezone: (sched.timezone as string) ?? 'Asia/Kolkata',
    perDay,
  }, plan.toAdd + EXTRA_CANDIDATES, after);
  if (candidates.length === 0) return { ok: false, reason: 'no_slots', total, added: 0, stamped, skipped: [], stillMissing: plan.toAdd };

  /* Clashes, fetched once for the whole run rather than twice per class. */
  const windowStart = candidates[0].slotStart;
  const windowEnd = candidates[candidates.length - 1].slotEnd;
  const { data: roster } = await admin.from('enrollments').select('user_id').eq('cohort_id', sched.cohort_id).eq('status', 'active');
  const learnerIds = [...new Set((roster ?? []).map((r) => r.user_id as string).filter(Boolean))];
  let otherCohorts: string[] = [];
  if (learnerIds.length) {
    const { data: theirs } = await admin.from('enrollments').select('cohort_id').in('user_id', learnerIds).eq('status', 'active');
    const ids: string[] = (theirs ?? []).map((e) => e.cohort_id as string | null).filter((c): c is string => !!c && c !== sched.cohort_id);
    otherCohorts = [...new Set(ids)];
  }
  const [{ data: teacherBusy }, { data: learnersBusy }] = await Promise.all([
    admin.from('bookings').select('slot_start, slot_end, cohort_id')
      .eq('teacher_id', sched.teacher_id).in('status', ['scheduled', 'completed'])
      .lt('slot_start', windowEnd).gt('slot_end', windowStart),
    otherCohorts.length
      ? admin.from('bookings').select('slot_start, slot_end').in('cohort_id', otherCohorts).in('status', ['scheduled', 'completed'])
        .lt('slot_start', windowEnd).gt('slot_end', windowStart)
      : Promise.resolve({ data: [] as { slot_start: string; slot_end: string }[] }),
  ]);
  const busy = [...(teacherBusy ?? []), ...(learnersBusy ?? [])].map((b) => [Date.parse(b.slot_start as string), Date.parse(b.slot_end as string)] as const);

  const rows: Record<string, unknown>[] = [];
  const skipped: string[] = [];
  let number = plan.lastNumber;
  for (const c of candidates) {
    if (rows.length >= plan.toAdd) break;
    const s = Date.parse(c.slotStart);
    const e = Date.parse(c.slotEnd);
    if (busy.some(([bs, be]) => overlaps(s, e, bs, be))) { skipped.push(c.slotStart); continue; }
    number += 1;
    const lesson = lessons[number - 1] ?? null;
    rows.push({
      cohort_id: sched.cohort_id,
      teacher_id: sched.teacher_id,
      schedule_id: scheduleId,
      slot_start: c.slotStart,
      slot_end: c.slotEnd,
      status: 'scheduled',
      module_num: lesson?.moduleNum ?? null,
      lesson_name: lesson?.name ?? null,
    });
  }

  if (rows.length) {
    const { error } = await admin.from('bookings').insert(rows);
    if (error) {
      console.error('[course-fill] insert failed:', error.code, error.message);
      return { ok: false, reason: 'insert_failed', total, added: 0, stamped, skipped, stillMissing: plan.toAdd };
    }
  }
  return { ok: true, total, added: rows.length, stamped, skipped, stillMissing: plan.toAdd - rows.length };
}
