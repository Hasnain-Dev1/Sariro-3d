import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { generateOccurrences, requiredDayCount } from '@/lib/dashboard/schedule-generation';

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
}

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
  const classesPerWeek = body.classesPerWeek === 2 ? 2 : 1;
  const daysOfWeek = Array.isArray(body.daysOfWeek) ? body.daysOfWeek.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [];
  const durationMin = Number(body.durationMin) > 0 ? Number(body.durationMin) : 60;
  const count = Number.isInteger(body.count) && body.count! > 0 && body.count! <= 52 ? body.count! : HORIZON_DEFAULT;

  if (!body.cohortId) errors.push('cohortId is required');
  if (!body.teacherId) errors.push('teacherId is required');
  if (!body.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.startDate)) errors.push('startDate must be YYYY-MM-DD');
  if (!body.timeLocal || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(body.timeLocal)) errors.push('timeLocal must be HH:MM');
  if (!body.timezone) errors.push('timezone is required');
  if (daysOfWeek.length !== requiredDayCount(classesPerWeek)) {
    errors.push(`${classesPerWeek === 2 ? 'Two weekdays' : 'One weekday'} required for ${classesPerWeek} class(es)/week`);
  }
  if (errors.length) {
    return NextResponse.json({ ok: false, error: 'validation_failed', errors }, { status: 400 });
  }

  const admin = createServiceClient();

  // ── 1. Create the schedule rule ──
  const { data: schedule, error: sErr } = await admin
    .from('cohort_schedules')
    .insert({
      cohort_id: body.cohortId,
      teacher_id: body.teacherId,
      start_date: body.startDate,
      days_of_week: daysOfWeek,
      time_local: body.timeLocal,
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

  // ── 2. Generate the first horizon of bookings ──
  const slots = generateOccurrences(
    {
      startDate: body.startDate!,
      daysOfWeek,
      timeLocal: body.timeLocal!,
      durationMin,
      timezone: body.timezone!,
    },
    count
  );

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
