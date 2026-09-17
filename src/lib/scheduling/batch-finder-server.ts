import type { SupabaseClient } from '@supabase/supabase-js';
import { courseTitleOf } from '@/lib/dashboard/class-lesson';
import { findLesson, lessonsOf, type PlannedLesson } from '@/lib/dashboard/lesson-plan';
import { seatCapacity, type BatchSummary } from '@/lib/scheduling/batch-finder';

/**
 * SARIRO — the batch finder's reads (SERVER ONLY)
 * ============================================================================
 * Behind api/admin/batch-finder. Kept apart from the route so it can be run
 * against the database without a signed-in session.
 */

const OPEN = ['gathering', 'ready', 'active'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** How many of a batch's upcoming classes are checked against a child's timetable. */
const CLASH_LOOKAHEAD = 12;

const overlaps = (a0: string, a1: string, b0: string, b1: string) => Date.parse(a0) < Date.parse(b1) && Date.parse(b0) < Date.parse(a1);

/** A child by name, email or phone — up to eight. */
export async function findStudents(admin: SupabaseClient, raw: string) {
  const q = raw.replace(/[%,()]/g, ' ').trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, '');
  const ors = [`full_name.ilike.%${q}%`, `email.ilike.%${q}%`];
  if (digits.length >= 5) ors.push(`phone.ilike.%${digits}%`);
  const { data } = await admin.from('profiles').select('id, full_name, email, grade, role').or(ors.join(',')).limit(12);
  return (data ?? [])
    .filter((p) => !p.role || p.role === 'student')
    .slice(0, 8)
    .map((p) => ({ id: p.id as string, name: (p.full_name as string | null) ?? null, email: (p.email as string | null) ?? null, grade: (p.grade as number | null) ?? null }));
}

export async function loadBatchFinder(admin: SupabaseClient, studentId: string | null) {
  /* ── Every open batch ─────────────────────────────────────────────────── */
  const { data: cohortRows, error: cErr } = await admin.from('cohorts')
    .select('id, track, level, ratio, status, max_capacity, batch_code, country')
    .in('status', OPEN).order('created_at', { ascending: false }).limit(500);
  if (cErr) throw new Error(`cohorts: ${cErr.message}`);
  const cohorts = cohortRows ?? [];
  const cohortIds = cohorts.map((c) => c.id as string);

  const [enrolRes, schedRes, bookingRes] = cohortIds.length
    ? await Promise.all([
        admin.from('enrollments').select('user_id, cohort_id').in('cohort_id', cohortIds).eq('status', 'active'),
        admin.from('cohort_schedules').select('id, cohort_id, teacher_id, days_of_week, time_local, timezone').in('cohort_id', cohortIds).eq('status', 'active'),
        admin.from('bookings').select('cohort_id, slot_start, slot_end, status, module_num, lesson_name')
          .in('cohort_id', cohortIds).in('status', ['scheduled', 'completed']).order('slot_start', { ascending: true }).limit(20000),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const enrolments = (enrolRes.data ?? []) as { user_id: string; cohort_id: string }[];
  const schedules = (schedRes.data ?? []) as { id: string; cohort_id: string; teacher_id: string | null; days_of_week: number[] | null; time_local: string | null; timezone: string | null }[];
  const bookings = (bookingRes.data ?? []) as { cohort_id: string; slot_start: string; slot_end: string; status: string; module_num: string | null; lesson_name: string | null }[];

  const { data: dayRows } = schedules.length
    ? await admin.from('cohort_schedule_days').select('schedule_id, day_of_week, time_local').in('schedule_id', schedules.map((s) => s.id))
    : { data: [] };

  const peopleIds = [...new Set([...enrolments.map((e) => e.user_id), ...schedules.map((s) => s.teacher_id).filter((x): x is string => !!x)])];
  const { data: people } = peopleIds.length ? await admin.from('profiles').select('id, full_name').in('id', peopleIds) : { data: [] };
  const nameOf = new Map((people ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? null]));

  const lessonCache = new Map<string, PlannedLesson[]>();
  const lessonsFor = (track: string, level: string) => {
    const k = `${track}::${level}`;
    if (!lessonCache.has(k)) lessonCache.set(k, lessonsOf(track, level));
    return lessonCache.get(k)!;
  };

  const now = Date.now();
  const batches: BatchSummary[] = cohorts.map((c) => {
    const id = c.id as string;
    const track = c.track as string;
    const level = c.level as string;
    const lessons = lessonsFor(track, level);
    const roster = enrolments.filter((e) => e.cohort_id === id);
    const sched = schedules.find((s) => s.cohort_id === id) ?? null;
    const own = bookings.filter((b) => b.cohort_id === id);
    const lessonsDone = own.filter((b) => b.status === 'completed').length;
    const future = own.filter((b) => b.status === 'scheduled' && Date.parse(b.slot_end) > now);
    const next = future[0] ?? null;
    const stamped = next ? findLesson(lessons, next.module_num, next.lesson_name) : null;
    const nextLesson = stamped ?? (next ? lessons[lessonsDone] ?? null : null);
    const days = sched
      ? ((dayRows ?? []) as { schedule_id: string; day_of_week: number; time_local: string }[])
        .filter((d) => d.schedule_id === sched.id).map((d) => ({ day: d.day_of_week, time: d.time_local }))
      : [];
    return {
      cohortId: id,
      batchCode: (c.batch_code as string | null) ?? null,
      courseTitle: courseTitleOf(track, level),
      track,
      level,
      ratio: (c.ratio as string) ?? '1:4',
      status: c.status as string,
      country: (c.country as string | null) ?? null,
      capacity: seatCapacity(c.ratio as string, c.max_capacity as number | null),
      enrolled: roster.length,
      studentNames: roster.map((r) => nameOf.get(r.user_id) ?? 'Unnamed'),
      scheduleId: sched?.id ?? null,
      teacher: sched?.teacher_id ? { id: sched.teacher_id, name: nameOf.get(sched.teacher_id) ?? null } : null,
      days: days.length ? days : (sched?.days_of_week ?? []).map((d) => ({ day: d, time: sched?.time_local ?? '' })),
      timezone: sched?.timezone ?? null,
      lessonsDone,
      nextLesson: nextLesson ? { number: nextLesson.number, name: nextLesson.name } : null,
      totalLessons: lessons.length,
      nextClassAt: next?.slot_start ?? null,
      remaining: future.length,
    };
  });

  /* ── Teachers trained for each course, and how busy their next week is ── */
  const { data: assignments } = await admin.from('teacher_course_assignments')
    .select('teacher_id, track, level, training_completed_at').not('training_completed_at', 'is', null);
  const teacherIds = [...new Set((assignments ?? []).map((a) => a.teacher_id as string))];
  const [{ data: teacherPeople }, { data: weekLoad }] = teacherIds.length
    ? await Promise.all([
        admin.from('profiles').select('id, full_name').in('id', teacherIds),
        admin.from('bookings').select('teacher_id').in('teacher_id', teacherIds).eq('status', 'scheduled')
          .gte('slot_start', new Date(now).toISOString()).lt('slot_start', new Date(now + 7 * 86_400_000).toISOString()),
      ])
    : [{ data: [] }, { data: [] }];
  const teacherName = new Map((teacherPeople ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? null]));
  const load = new Map<string, number>();
  for (const b of weekLoad ?? []) load.set(b.teacher_id as string, (load.get(b.teacher_id as string) ?? 0) + 1);
  const teachersByCourse: Record<string, { id: string; name: string | null; classesNext7Days: number }[]> = {};
  for (const a of assignments ?? []) {
    const title = courseTitleOf(a.track as string, a.level as string);
    const list = teachersByCourse[title] ?? (teachersByCourse[title] = []);
    if (!list.some((t) => t.id === a.teacher_id)) list.push({ id: a.teacher_id as string, name: teacherName.get(a.teacher_id as string) ?? null, classesNext7Days: load.get(a.teacher_id as string) ?? 0 });
  }

  /* ── Children waiting for a batch ────────────────────────────────────── */
  const { data: loose } = await admin.from('enrollments')
    .select('id, user_id, track, level, ratio, status, cohort_id, updated_at')
    .or('and(status.eq.active,cohort_id.is.null),status.eq.dropped')
    .order('updated_at', { ascending: false }).limit(200);
  const { data: placed } = await admin.from('enrollments').select('user_id, track, level').eq('status', 'active').not('cohort_id', 'is', null);
  const placedKey = new Set((placed ?? []).map((p) => `${p.user_id}::${p.track}::${p.level}`));
  const waitingRows = (loose ?? []).filter((e) => e.track && e.level && !placedKey.has(`${e.user_id}::${e.track}::${e.level}`));
  const seen = new Set<string>();
  const waitingUnique = waitingRows.filter((e) => { const k = `${e.user_id}::${e.track}::${e.level}`; if (seen.has(k)) return false; seen.add(k); return true; });

  const progressFor = async (enrolmentIds: string[]) => {
    if (!enrolmentIds.length) return new Map<string, number>();
    const { data } = await admin.from('lesson_progress').select('enrollment_id').in('enrollment_id', enrolmentIds);
    const m = new Map<string, number>();
    for (const r of data ?? []) m.set(r.enrollment_id as string, (m.get(r.enrollment_id as string) ?? 0) + 1);
    return m;
  };

  const waitIds = [...new Set(waitingUnique.map((e) => e.user_id as string))];
  const [waitProgress, { data: waitPeople }, { data: waitCredits }] = await Promise.all([
    progressFor(waitingRows.map((e) => e.id as string)),
    waitIds.length ? admin.from('profiles').select('id, full_name, email, grade').in('id', waitIds) : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null; grade: number | null }[] }),
    waitIds.length ? admin.from('credits').select('user_id, balance').in('user_id', waitIds) : Promise.resolve({ data: [] as { user_id: string; balance: number | null }[] }),
  ]);
  const waitPerson = new Map((waitPeople ?? []).map((p) => [p.id as string, p]));
  const credit = new Map((waitCredits ?? []).map((c) => [c.user_id as string, (c.balance as number | null) ?? 0]));
  const waiting = waitingUnique.map((e) => {
    const same = waitingRows.filter((r) => r.user_id === e.user_id && r.track === e.track && r.level === e.level);
    const person = waitPerson.get(e.user_id as string);
    return {
      studentId: e.user_id as string,
      name: person?.full_name ?? null,
      email: person?.email ?? null,
      grade: person?.grade ?? null,
      track: e.track as string,
      level: e.level as string,
      ratio: (e.ratio as string | null) ?? null,
      courseTitle: courseTitleOf(e.track as string, e.level as string),
      reason: e.status === 'dropped' ? 'removed from a batch' : 'paid, not placed',
      lessonsDone: Math.max(0, ...same.map((r) => waitProgress.get(r.id as string) ?? 0)),
      credits: credit.get(e.user_id as string) ?? 0,
      since: e.updated_at as string,
    };
  });

  /* ── One child: where they are, and what clashes ───────────────────────── */
  let student = null as null | {
    id: string; name: string | null; email: string | null; grade: number | null; credits: number;
    courses: { track: string; level: string; courseTitle: string; lessonsDone: number; cohortId: string | null }[];
  };
  if (studentId && UUID.test(studentId)) {
    const [{ data: person }, { data: theirs }, { data: cred }] = await Promise.all([
      admin.from('profiles').select('id, full_name, email, grade').eq('id', studentId).maybeSingle(),
      admin.from('enrollments').select('id, track, level, status, cohort_id').eq('user_id', studentId),
      admin.from('credits').select('balance').eq('user_id', studentId).maybeSingle(),
    ]);
    const rows = (theirs ?? []).filter((r) => r.track && r.level);
    const prog = await progressFor(rows.map((r) => r.id as string));
    const byCourse = new Map<string, { track: string; level: string; courseTitle: string; lessonsDone: number; cohortId: string | null }>();
    for (const r of rows) {
      const k = `${r.track}::${r.level}`;
      const cur = byCourse.get(k) ?? { track: r.track as string, level: r.level as string, courseTitle: courseTitleOf(r.track as string, r.level as string), lessonsDone: 0, cohortId: null };
      cur.lessonsDone = Math.max(cur.lessonsDone, prog.get(r.id as string) ?? 0);
      if (r.status === 'active' && r.cohort_id) cur.cohortId = r.cohort_id as string;
      byCourse.set(k, cur);
    }
    student = {
      id: studentId,
      name: (person?.full_name as string | null) ?? null,
      email: (person?.email as string | null) ?? null,
      grade: (person?.grade as number | null) ?? null,
      credits: (cred?.balance as number | null) ?? 0,
      courses: [...byCourse.values()],
    };

    /* Their timetable: every upcoming class in a batch they are in now. */
    const theirCohorts = rows.filter((r) => r.status === 'active' && r.cohort_id).map((r) => r.cohort_id as string);
    if (theirCohorts.length) {
      const { data: busy } = await admin.from('bookings').select('slot_start, slot_end')
        .in('cohort_id', theirCohorts).eq('status', 'scheduled').gt('slot_end', new Date(now).toISOString());
      for (const b of batches) {
        if (theirCohorts.includes(b.cohortId)) continue;
        const upcoming = bookings.filter((x) => x.cohort_id === b.cohortId && x.status === 'scheduled' && Date.parse(x.slot_end) > now).slice(0, CLASH_LOOKAHEAD);
        const hit = upcoming.find((x) => (busy ?? []).some((y) => overlaps(x.slot_start, x.slot_end, y.slot_start as string, y.slot_end as string)));
        b.clashAt = hit?.slot_start ?? null;
      }
    }
  }

  return { batches, teachersByCourse, waiting, student };
}
