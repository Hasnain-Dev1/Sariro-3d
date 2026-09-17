import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { resolveActor } from '@/lib/dashboard/schedule-ops-server';
import { normaliseDays, rescheduleBatch } from '@/lib/scheduling/batch-ops';

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
 * The work itself lives in lib/scheduling/batch-ops.ts, shared with the admin's
 * batch control (which can change the teacher at the same time).
 *
 * Body: { scheduleId, days: [{day, time, durationMin?}], effectiveFrom? (YYYY-MM-DD) }
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const rl = rateLimit({ key: `reschedule-batch:${actor.userId}`, limit: 15, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: { scheduleId?: string; days?: unknown; effectiveFrom?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (!body.scheduleId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const days = normaliseDays(body.days);
  if (!days.ok) return NextResponse.json({ ok: false, error: 'validation_failed', errors: [days.message], message: days.message }, { status: 400 });

  const admin = createServiceClient();
  const { data: sched } = await admin.from('cohort_schedules').select('id, teacher_id').eq('id', body.scheduleId).maybeSingle();
  if (!sched) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  if (!actor.isAdmin && !(actor.isTeacher && sched.teacher_id === actor.userId)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const result = await rescheduleBatch(admin, {
    scheduleId: body.scheduleId,
    days: days.days,
    effectiveFrom: body.effectiveFrom ?? null,
    actor: { userId: actor.userId, isAdmin: actor.isAdmin },
  });
  if (!result.ok) {
    const { status, ...refusal } = result;
    return NextResponse.json(refusal, { status });
  }
  return NextResponse.json({
    ok: true,
    regenerated: result.regenerated,
    cancelled: result.cancelled,
    effectiveFrom: result.effectiveFrom,
    ...(result.skipped.length ? { skipped: result.skipped } : {}),
  });
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
