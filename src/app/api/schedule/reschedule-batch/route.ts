import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';
import { resolveActor } from '@/lib/dashboard/schedule-ops-server';

/**
 * SARIRO — POST /api/schedule/reschedule-batch
 *
 * Reschedule an ENTIRE batch going forward: change the recurring weekday(s)/time,
 * optionally starting from a chosen date. Upcoming scheduled classes are cancelled
 * and regenerated to the new cadence from `effectiveFrom` (default today); past and
 * completed classes are untouched. A FUTURE effectiveFrom leaves a gap between now
 * and that date — i.e. a break (e.g. the kid is away) — after which the new schedule
 * resumes. Teacher may reschedule their OWN batch; admins any.
 *
 * Body: { scheduleId, days: [{day, time, durationMin?}], effectiveFrom? (YYYY-MM-DD) }
 */
export const runtime = 'nodejs';

const HM_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORIZON = 8;

interface DayTime { day: number; time: string; durationMin?: number }

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const rl = rateLimit({ key: `reschedule-batch:${actor.userId}`, limit: 15, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: { scheduleId?: string; days?: DayTime[]; effectiveFrom?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (!body.scheduleId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  // "Apply from" date: new cadence starts here. Default = today. Cannot be in the
  // past. A future date leaves a break between now and then.
  const todayStr = new Date().toISOString().slice(0, 10);
  let effectiveFrom = todayStr;
  if (body.effectiveFrom) {
    if (!DATE_RE.test(body.effectiveFrom) || Number.isNaN(Date.parse(body.effectiveFrom))) {
      return NextResponse.json({ ok: false, error: 'bad_effective_from', message: 'Pick a valid start date.' }, { status: 400 });
    }
    effectiveFrom = body.effectiveFrom < todayStr ? todayStr : body.effectiveFrom;
  }

  // Normalize + validate the new per-day cadence (1 or 2 days).
  const errors: string[] = [];
  const seen = new Set<number>();
  const dayTimes: DayTime[] = [];
  for (const d of body.days ?? []) {
    const day = Number(d?.day); const time = String(d?.time ?? '');
    if (!Number.isInteger(day) || day < 0 || day > 6) { errors.push(`invalid day ${d?.day}`); continue; }
    if (!HM_RE.test(time)) { errors.push(`invalid time for day ${day}`); continue; }
    if (seen.has(day)) continue;
    seen.add(day);
    const dur = Number(d?.durationMin);
    dayTimes.push({ day, time, durationMin: dur > 0 ? dur : undefined });
  }
  if (dayTimes.length < 1 || dayTimes.length > 2) errors.push('Pick one or two weekdays with a time each.');
  if (errors.length) return NextResponse.json({ ok: false, error: 'validation_failed', errors }, { status: 400 });

  dayTimes.sort((a, b) => a.day - b.day);

  const admin = createServiceClient();
  const { data: sched } = await admin.from('cohort_schedules')
    .select('id, cohort_id, teacher_id, timezone, duration_min, start_date').eq('id', body.scheduleId).maybeSingle();
  if (!sched) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  if (!actor.isAdmin && !(actor.isTeacher && sched.teacher_id === actor.userId)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const daysOfWeek = dayTimes.map((d) => d.day);
  const timeLocalFallback = dayTimes[0].time;
  const perDay: Record<number, { time: string; durationMin?: number }> = {};
  for (const d of dayTimes) perDay[d.day] = { time: d.time, durationMin: d.durationMin };

  const nowIso = new Date().toISOString();

  // 1. Update the recurring rule.
  await admin.from('cohort_schedules').update({
    days_of_week: daysOfWeek, time_local: timeLocalFallback,
    classes_per_week: dayTimes.length, status: 'active', updated_at: nowIso,
  }).eq('id', sched.id);

  // 2. Replace the per-day time rows.
  await admin.from('cohort_schedule_days').delete().eq('schedule_id', sched.id);
  await admin.from('cohort_schedule_days').insert(dayTimes.map((d) => ({
    schedule_id: sched.id, day_of_week: d.day, time_local: d.time, duration_min: d.durationMin ?? null,
  })));

  // 3. Cancel FUTURE scheduled bookings (past/completed untouched).
  const { data: future } = await admin.from('bookings').select('id')
    .eq('schedule_id', sched.id).eq('status', 'scheduled').gt('slot_start', nowIso);
  if (future?.length) {
    await admin.from('bookings').update({ status: 'cancelled', cancel_actor_role: actor.isAdmin ? 'admin' : 'teacher', cancel_type: 'admin', pay_status: 'zero', cancelled_at: nowIso, cancelled_by: actor.userId }).in('id', future.map((b) => b.id));
  }

  // 4. Regenerate the horizon from the effective date with the new cadence.
  const slots = generateOccurrences({
    startDate: effectiveFrom, daysOfWeek, timeLocal: timeLocalFallback,
    durationMin: sched.duration_min ?? 60, timezone: sched.timezone, perDay,
  }, HORIZON);
  if (slots.length) {
    await admin.from('bookings').insert(slots.map((s) => ({
      cohort_id: sched.cohort_id, teacher_id: sched.teacher_id, schedule_id: sched.id,
      slot_start: s.slotStart, slot_end: s.slotEnd, status: 'scheduled',
    })));
  }

  return NextResponse.json({ ok: true, regenerated: slots.length, cancelled: future?.length ?? 0, effectiveFrom });
}

/** GET — list the caller's batches (teacher=own active schedules; admin=all active). */
export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const admin = createServiceClient();
  let q = admin.from('cohort_schedules')
    .select('id, cohort_id, teacher_id, days_of_week, time_local, timezone, classes_per_week, status, cohorts(track, level, ratio, batch_code)')
    .eq('status', 'active');
  if (!actor.isAdmin) {
    if (!actor.isTeacher) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    q = q.eq('teacher_id', actor.userId);
  }
  const { data } = await q.order('created_at', { ascending: false });
  return NextResponse.json({ ok: true, schedules: data ?? [] });
}
