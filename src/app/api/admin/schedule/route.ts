import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';
import { teacherHasConflict, cohortStudentConflicts, studentNamesFor } from '@/lib/dashboard/schedule-ops-server';

/**
 * SARIRO — POST /api/admin/schedule
 *
 * Admin/super-admin only. Creates a recurring cohort_schedules rule and
 * generates the first horizon of concrete bookings (exact UTC instants,
 * DST-correct) for that cohort + teacher.
 *
 * Body: {
 *   cohortId, teacherId, startDate ('YYYY-MM-DD'),
 *   daysOfWeek (int[] 0..6), timeLocal ('HH:MM'), durationMin,
 *   timezone (IANA), classesPerWeek (1|2), count? (default 8)
 * }
 */

export const runtime = 'nodejs';

const HORIZON_DEFAULT = 8; // generate ~8 upcoming classes; topped up later.

interface DayTime {
  day: number;          // 0=Sun..6=Sat
  time: string;         // 'HH:MM'
  durationMin?: number; // optional per-day override
}

interface Body {
  cohortId?: string;
  teacherId?: string;
  startDate?: string;
  daysOfWeek?: number[];
  timeLocal?: string;
  durationMin?: number;
  timezone?: string;
  classesPerWeek?: number;
  count?: number;
  /** New: per-weekday times. When present, wins over daysOfWeek/timeLocal. */
  days?: DayTime[];
}

const HM_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;

async function requireAdmin(): Promise<{ userId: string } | null> {
  let supa;
  try {
    supa = await createServerClientHelper();
  } catch {
    return null;
  }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, is_admin, is_super_admin')
    .eq('id', user.id)
    .single();
  const ok =
    profile?.role === 'admin' || profile?.role === 'super_admin' ||
    profile?.is_admin === true || profile?.is_super_admin === true;
  return ok ? { userId: user.id } : null;
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const rl = rateLimit({ key: `admin-schedule:${auth.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  // ── Validate ──
  const errors: string[] = [];
  const durationMin = Number(body.durationMin) > 0 ? Number(body.durationMin) : 60;
  const count = Number.isInteger(body.count) && body.count! > 0 && body.count! <= 52 ? body.count! : HORIZON_DEFAULT;

  // Normalize into a canonical list of {day, time, durationMin}. Prefer the new
  // per-day `days` array; fall back to legacy daysOfWeek + single timeLocal.
  let dayTimes: DayTime[] = [];
  if (Array.isArray(body.days) && body.days.length > 0) {
    const seen = new Set<number>();
    for (const d of body.days) {
      const day = Number(d?.day);
      const time = String(d?.time ?? '');
      if (!Number.isInteger(day) || day < 0 || day > 6) { errors.push(`invalid day: ${d?.day}`); continue; }
      if (!HM_RE.test(time)) { errors.push(`invalid time for day ${day}`); continue; }
      if (seen.has(day)) { errors.push(`duplicate day: ${day}`); continue; }
      seen.add(day);
      const perDur = Number(d?.durationMin);
      dayTimes.push({ day, time, durationMin: perDur > 0 ? perDur : undefined });
    }
  } else {
    const legacyDays = Array.isArray(body.daysOfWeek) ? body.daysOfWeek.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [];
    if (!body.timeLocal || !HM_RE.test(body.timeLocal)) errors.push('timeLocal must be HH:MM');
    dayTimes = legacyDays.map((day) => ({ day, time: body.timeLocal! }));
  }

  // Cadence is derived from the number of distinct days (1 or 2 classes/week).
  const classesPerWeek = dayTimes.length === 2 ? 2 : 1;
  dayTimes.sort((a, b) => a.day - b.day);
  const daysOfWeek = dayTimes.map((d) => d.day);
  const timeLocalFallback = dayTimes[0]?.time ?? body.timeLocal ?? '';

  if (!body.cohortId) errors.push('cohortId is required');
  if (!body.teacherId) errors.push('teacherId is required');
  if (!body.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) errors.push('startDate must be YYYY-MM-DD');
  if (!body.timezone) errors.push('timezone is required');
  if (dayTimes.length < 1 || dayTimes.length > 2) {
    errors.push('Pick one or two weekdays (with a time each).');
  }
  if (errors.length) {
    return NextResponse.json({ ok: false, error: 'validation_failed', errors }, { status: 400 });
  }

  // Build the per-day map the generator understands.
  const perDay: Record<number, { time: string; durationMin?: number }> = {};
  for (const d of dayTimes) perDay[d.day] = { time: d.time, durationMin: d.durationMin };

  const admin = createServiceClient();

  // ── 0. Training gate — teacher must have super-admin-marked training
  //       completion for this cohort's course before they can be scheduled. ──
  const { data: cohortRow } = await admin.from('cohorts').select('track, level').eq('id', body.cohortId!).maybeSingle();
  if (cohortRow) {
    const { data: trained } = await admin.from('teacher_course_assignments')
      .select('id').eq('teacher_id', body.teacherId!)
      .ilike('track', cohortRow.track).ilike('level', cohortRow.level)
      .not('training_completed_at', 'is', null).maybeSingle();
    if (!trained) {
      return NextResponse.json({ ok: false, error: 'teacher_not_trained', message: "This teacher's course training isn't marked complete yet." }, { status: 409 });
    }
  }

  // ── 0b. Generate the horizon FIRST and check for teacher double-booking
  //        before creating anything, so a conflict rejects cleanly. ──
  const slots = generateOccurrences(
    {
      startDate: body.startDate!,
      daysOfWeek,
      timeLocal: timeLocalFallback,
      durationMin,
      timezone: body.timezone!,
      perDay,
    },
    count
  );
  for (const s of slots) {
    if (await teacherHasConflict(admin, body.teacherId!, s.slotStart, s.slotEnd)) {
      return NextResponse.json(
        { ok: false, error: 'teacher_conflict', message: `This teacher already has another class scheduled at ${new Date(s.slotStart).toLocaleString()}.` },
        { status: 409 }
      );
    }
    // The learner side of the same question. A child taking maths, physics and
    // coding has three enrolments and three schedulers, none of which used to
    // know about the others — so they could be booked into two classes at once
    // and only find out by missing one.
    const clashes = await cohortStudentConflicts(admin, body.cohortId!, s.slotStart, s.slotEnd);
    if (clashes.length > 0) {
      const names = await studentNamesFor(admin, clashes.map((c) => c.studentId));
      return NextResponse.json(
        {
          ok: false,
          error: 'student_conflict',
          message:
            `${names} already ${clashes.length === 1 ? 'has' : 'have'} another class at ` +
            `${new Date(s.slotStart).toLocaleString()}. Pick a different time, or remove them from this batch.`,
          students: clashes,
        },
        { status: 409 }
      );
    }
  }

  // ── 1. Create the schedule rule ──
  const { data: schedule, error: sErr } = await admin
    .from('cohort_schedules')
    .insert({
      cohort_id: body.cohortId,
      teacher_id: body.teacherId,
      start_date: body.startDate,
      days_of_week: daysOfWeek,
      time_local: timeLocalFallback,
      duration_min: durationMin,
      timezone: body.timezone,
      classes_per_week: classesPerWeek,
      status: 'active',
    })
    .select('id')
    .single();

  if (sErr || !schedule) {
    return NextResponse.json({ ok: false, error: 'schedule_create_failed', message: sErr?.message }, { status: 500 });
  }

  // ── 1b. Persist per-day time rows (best-effort; generation still works
  //         from the default time_local if this table is absent). ──
  const dayRows = dayTimes.map((d) => ({
    schedule_id: schedule.id,
    day_of_week: d.day,
    time_local: d.time,
    duration_min: d.durationMin ?? null,
  }));
  const { error: dErr } = await admin.from('cohort_schedule_days').insert(dayRows);
  if (dErr) {
    // Non-fatal: the schedule + default time still generate correct slots.
    console.warn('[admin/schedule] cohort_schedule_days insert failed:', dErr.message);
  }

  // ── 2. Insert the (already-generated + conflict-checked) horizon ──
  if (slots.length > 0) {
    const rows = slots.map((s) => ({
      cohort_id: body.cohortId,
      teacher_id: body.teacherId,
      schedule_id: schedule.id,
      slot_start: s.slotStart,
      slot_end: s.slotEnd,
      status: 'scheduled',
    }));
    const { error: bErr } = await admin.from('bookings').insert(rows);
    if (bErr) {
      // Roll back the schedule so we don't strand an empty rule.
      await admin.from('cohort_schedules').delete().eq('id', schedule.id);
      return NextResponse.json({ ok: false, error: 'booking_generate_failed', message: bErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, schedule_id: schedule.id, generated: slots.length });
}
