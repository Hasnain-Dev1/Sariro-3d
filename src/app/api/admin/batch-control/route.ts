import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { courseTitleOf } from '@/lib/dashboard/class-lesson';
import { recordAdminAction } from '@/lib/audit/log';
import { seatCapacity } from '@/lib/scheduling/batch-finder';
import { changeTeacher, clashesAtCurrentTimes, normaliseDays, rescheduleBatch, teacherTrainedFor } from '@/lib/scheduling/batch-ops';

/**
 * SARIRO — /api/admin/batch-control
 * ============================================================================
 * One batch, everything an admin changes about it, in one place (founder,
 * 17 Sep 2026): its teacher, its days and times, and its roster.
 *
 *   GET  ?cohortId=   the batch, its schedule, its roster, and every teacher
 *                     with whether they are trained for its course and how
 *                     busy their next week is
 *   POST { action: 'check_teacher', scheduleId, teacherId }
 *            is this teacher trained, and free for every upcoming class?
 *   POST { action: 'change_teacher', scheduleId, teacherId, days?, effectiveFrom? }
 *            every upcoming class to the new teacher — at the same times, or,
 *            with `days`, on new days and times from a date
 *   POST { action: 'reschedule', scheduleId, days, effectiveFrom? }
 *            new days and times, same teacher
 *
 * Roster changes go through api/admin/schedule/manage (add_kid / remove_kid),
 * which carries the seat, clash and credit checks. Admins and the super admin.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'batch-control-read', limit: 90, allow: ['admin', 'super_admin'], skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { admin } = gate.actor;
  const cohortId = req.nextUrl.searchParams.get('cohortId') ?? '';
  if (!UUID.test(cohortId)) return NextResponse.json({ ok: false, error: 'bad_request', message: 'Pick a batch.' }, { status: 400 });

  const { data: cohort } = await admin.from('cohorts').select('id, track, level, ratio, status, max_capacity, batch_code, country').eq('id', cohortId).maybeSingle();
  if (!cohort) return NextResponse.json({ ok: false, error: 'not_found', message: 'That batch no longer exists.' }, { status: 404 });

  const [{ data: sched }, { data: roster }, { data: teacherRows }, { data: trainedRows }] = await Promise.all([
    admin.from('cohort_schedules').select('id, teacher_id, days_of_week, time_local, timezone, duration_min, start_date, status')
      .eq('cohort_id', cohortId).in('status', ['active', 'paused']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('enrollments').select('user_id').eq('cohort_id', cohortId).eq('status', 'active'),
    admin.from('profiles').select('id, full_name, email, timezone').or('role.eq.teacher,is_teacher.eq.true').order('full_name'),
    admin.from('teacher_course_assignments').select('teacher_id').ilike('track', cohort.track as string).ilike('level', cohort.level as string).not('training_completed_at', 'is', null),
  ]);

  const studentIds = (roster ?? []).map((r) => r.user_id as string);
  const teacherIds = (teacherRows ?? []).map((t) => t.id as string);
  const nowIso = new Date().toISOString();
  const weekIso = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const [{ data: students }, { data: days }, { data: load }, { data: nextClasses }] = await Promise.all([
    studentIds.length ? admin.from('profiles').select('id, full_name, email, grade').in('id', studentIds) : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null; grade: number | null }[] }),
    sched ? admin.from('cohort_schedule_days').select('day_of_week, time_local, duration_min').eq('schedule_id', sched.id) : Promise.resolve({ data: [] as { day_of_week: number; time_local: string; duration_min: number | null }[] }),
    teacherIds.length ? admin.from('bookings').select('teacher_id').in('teacher_id', teacherIds).eq('status', 'scheduled').gte('slot_start', nowIso).lt('slot_start', weekIso) : Promise.resolve({ data: [] as { teacher_id: string }[] }),
    sched ? admin.from('bookings').select('slot_start').eq('schedule_id', sched.id).eq('status', 'scheduled').gt('slot_start', nowIso).order('slot_start', { ascending: true }) : Promise.resolve({ data: [] as { slot_start: string }[] }),
  ]);

  const trained = new Set((trainedRows ?? []).map((r) => r.teacher_id as string));
  const busy = new Map<string, number>();
  for (const b of load ?? []) busy.set(b.teacher_id as string, (busy.get(b.teacher_id as string) ?? 0) + 1);

  return NextResponse.json({
    ok: true,
    batch: {
      cohortId,
      batchCode: (cohort.batch_code as string | null) ?? null,
      courseTitle: courseTitleOf(cohort.track as string, cohort.level as string),
      ratio: cohort.ratio as string,
      status: cohort.status as string,
      capacity: seatCapacity(cohort.ratio as string, cohort.max_capacity as number | null),
    },
    schedule: sched ? {
      id: sched.id as string,
      status: sched.status as string,
      teacherId: (sched.teacher_id as string | null) ?? null,
      timezone: (sched.timezone as string | null) ?? 'Asia/Kolkata',
      durationMin: (sched.duration_min as number | null) ?? 60,
      startDate: (sched.start_date as string | null) ?? null,
      days: (days ?? []).length
        ? (days ?? []).map((d) => ({ day: d.day_of_week as number, time: String(d.time_local).slice(0, 5) }))
        : ((sched.days_of_week as number[] | null) ?? []).map((d) => ({ day: d, time: String(sched.time_local ?? '17:00').slice(0, 5) })),
      upcoming: (nextClasses ?? []).length,
      nextClassAt: (nextClasses ?? [])[0]?.slot_start ?? null,
    } : null,
    roster: (students ?? []).map((s) => ({ id: s.id as string, name: (s.full_name as string | null) ?? null, email: (s.email as string | null) ?? null, grade: (s.grade as number | null) ?? null })),
    teachers: (teacherRows ?? []).map((t) => ({
      id: t.id as string,
      name: (t.full_name as string | null) ?? null,
      email: (t.email as string | null) ?? null,
      timezone: (t.timezone as string | null) ?? null,
      trained: trained.has(t.id as string),
      classesNext7Days: busy.get(t.id as string) ?? 0,
    })),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'batch-control-write', limit: 30, allow: ['admin', 'super_admin'] });
  if (!gate.ok) return gate.response;
  const { actor } = gate;
  const { admin } = actor;

  const parsed = await readJson<{ action?: string; scheduleId?: string; teacherId?: string; days?: unknown; effectiveFrom?: string; website?: string }>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  if (!body.scheduleId || !UUID.test(body.scheduleId)) return NextResponse.json({ ok: false, error: 'bad_request', message: 'Pick a scheduled batch.' }, { status: 400 });

  const { data: sched } = await admin.from('cohort_schedules').select('id, cohort_id, teacher_id').eq('id', body.scheduleId).maybeSingle();
  if (!sched) return NextResponse.json({ ok: false, error: 'not_found', message: 'That batch schedule no longer exists.' }, { status: 404 });

  const needTeacher = body.action === 'check_teacher' || body.action === 'change_teacher';
  if (needTeacher) {
    if (!body.teacherId || !UUID.test(body.teacherId)) return NextResponse.json({ ok: false, error: 'bad_request', message: 'Pick a teacher.' }, { status: 400 });
    const trained = await teacherTrainedFor(admin, body.teacherId, sched.cohort_id as string);
    if (body.action === 'check_teacher') {
      const { upcoming, clashes } = await clashesAtCurrentTimes(admin, body.scheduleId, body.teacherId);
      return NextResponse.json({ ok: true, trained, upcoming, clashes });
    }
    if (!trained) {
      return NextResponse.json({ ok: false, error: 'teacher_not_trained', message: "That teacher's training for this course isn't marked complete." }, { status: 409 });
    }
  }

  if (body.action === 'change_teacher') {
    const teacherId = body.teacherId as string;
    if (body.days !== undefined && body.days !== null) {
      const days = normaliseDays(body.days);
      if (!days.ok) return NextResponse.json({ ok: false, error: 'validation_failed', message: days.message }, { status: 400 });
      const result = await rescheduleBatch(admin, { scheduleId: body.scheduleId, days: days.days, effectiveFrom: body.effectiveFrom ?? null, teacherId, actor: { userId: actor.id, isAdmin: true } });
      if (!result.ok) { const { status, ...refusal } = result; return NextResponse.json(refusal, { status }); }
      await recordAdminAction(admin, {
        adminId: actor.id, action: 'batch_teacher_changed', targetType: 'cohort_schedule', targetId: body.scheduleId,
        metadata: { new_teacher_id: teacherId, previous_teacher_id: sched.teacher_id ?? null, rescheduled: true, days: days.days, effective_from: result.effectiveFrom, classes: result.regenerated },
      });
      return NextResponse.json({ ok: true, rescheduled: true, classes: result.regenerated, cancelled: result.cancelled, effectiveFrom: result.effectiveFrom, skipped: result.skipped });
    }
    const result = await changeTeacher(admin, { scheduleId: body.scheduleId, teacherId });
    if (!result.ok) { const { status, ...refusal } = result; return NextResponse.json(refusal, { status }); }
    await recordAdminAction(admin, {
      adminId: actor.id, action: 'batch_teacher_changed', targetType: 'cohort_schedule', targetId: body.scheduleId,
      metadata: { new_teacher_id: teacherId, previous_teacher_id: result.previousTeacherId, rescheduled: false, classes_moved: result.moved },
    });
    return NextResponse.json({ ok: true, rescheduled: false, moved: result.moved });
  }

  if (body.action === 'reschedule') {
    const days = normaliseDays(body.days);
    if (!days.ok) return NextResponse.json({ ok: false, error: 'validation_failed', message: days.message }, { status: 400 });
    const result = await rescheduleBatch(admin, { scheduleId: body.scheduleId, days: days.days, effectiveFrom: body.effectiveFrom ?? null, actor: { userId: actor.id, isAdmin: true } });
    if (!result.ok) { const { status, ...refusal } = result; return NextResponse.json(refusal, { status }); }
    return NextResponse.json({ ok: true, classes: result.regenerated, cancelled: result.cancelled, effectiveFrom: result.effectiveFrom, skipped: result.skipped });
  }

  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
}
