import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { resolveActor } from '@/lib/dashboard/schedule-ops-server';

/**
 * SARIRO — POST /api/doubt-session
 *
 * Doubt-session lifecycle. Used both for "teacher runs an HR-approved doubt
 * session instead of a class (full pay)" and for a teacher claiming the withheld
 * HALF after a 1:1 student no-show by conducting a recorded doubt session.
 *
 * Actions:
 *   { action: 'request', bookingId?, cohortId?, notes? }   (teacher)
 *   { action: 'approve', sessionId }                        (hr/admin)
 *   { action: 'reject',  sessionId }                        (hr/admin)
 *   { action: 'conduct', sessionId, recordingUrl }          (teacher — pays the
 *          withheld half back onto the linked booking's earning)
 */
export const runtime = 'nodejs';

interface Body {
  action?: 'request' | 'approve' | 'reject' | 'conduct';
  sessionId?: string;
  bookingId?: string;
  cohortId?: string;
  recordingUrl?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const rl = rateLimit({ key: `doubt:${actor.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }

  const admin = createServiceClient();
  const nowIso = new Date().toISOString();

  switch (body.action) {
    case 'request': {
      if (!actor.isTeacher && !actor.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
      let cohortId = body.cohortId ?? null;
      if (body.bookingId && !cohortId) {
        const { data: bk } = await admin.from('bookings').select('cohort_id, teacher_id').eq('id', body.bookingId).maybeSingle();
        if (bk && actor.isTeacher && bk.teacher_id !== actor.userId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
        cohortId = bk?.cohort_id ?? null;
      }
      const { data, error } = await admin.from('doubt_sessions').insert({
        cohort_id: cohortId, booking_id: body.bookingId ?? null,
        teacher_id: actor.userId, requested_by: actor.userId,
        status: 'requested', notes: body.notes?.slice(0, 500) ?? null,
      }).select('id').single();
      if (error) return NextResponse.json({ ok: false, error: 'request_failed', message: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, sessionId: data.id });
    }

    case 'approve':
    case 'reject': {
      if (!actor.isHr && !actor.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
      if (!body.sessionId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
      const patch = body.action === 'approve'
        ? { status: 'hr_approved', hr_approved_by: actor.userId, hr_approved_at: nowIso }
        : { status: 'rejected', hr_approved_by: actor.userId, hr_approved_at: nowIso };
      const { error } = await admin.from('doubt_sessions').update(patch).eq('id', body.sessionId);
      if (error) return NextResponse.json({ ok: false, error: 'update_failed', message: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    case 'conduct': {
      if (!body.sessionId || !body.recordingUrl) return NextResponse.json({ ok: false, error: 'recording_required', message: 'A recording link is required to conduct a doubt session.' }, { status: 400 });
      const { data: ds } = await admin.from('doubt_sessions')
        .select('id, teacher_id, booking_id, status').eq('id', body.sessionId).maybeSingle();
      if (!ds) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
      if (actor.isTeacher && ds.teacher_id !== actor.userId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
      if (ds.status !== 'hr_approved') return NextResponse.json({ ok: false, error: 'not_approved', message: 'HR must approve the doubt session first.' }, { status: 409 });

      await admin.from('doubt_sessions').update({
        status: 'conducted', conducted_at: nowIso, notes: body.recordingUrl.slice(0, 500),
      }).eq('id', ds.id);

      // Top up the linked booking's earning: pay back the withheld half.
      if (ds.booking_id) {
        const { data: earning } = await admin.from('teacher_earnings')
          .select('id, base_amount, net_amount, amount, penalty_amount, penalty_reason')
          .eq('booking_id', ds.booking_id).maybeSingle();
        const reason = earning?.penalty_reason ?? '';
        // Only top up when pay was ACTUALLY withheld for a no-show and hasn't
        // already been repaid — never add half-pay to a normally-paid class.
        if (earning && reason.includes('half withheld') && !reason.includes('remainder paid')) {
          const half = Math.round(Number(earning.base_amount) * 0.5);
          await admin.from('teacher_earnings').update({
            net_amount: Number(earning.net_amount) + half,
            amount: Number(earning.amount) + half,
            penalty_amount: Math.max(Number(earning.penalty_amount) - half, 0),
            penalty_reason: `${earning.penalty_reason ?? ''}; doubt session conducted — remainder paid`,
          }).eq('id', earning.id);
        }
      }
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
  }
}

/**
 * GET /api/doubt-session — list the caller's relevant doubt sessions.
 *   Teacher → their own. HR/Admin → all active (requested + hr_approved).
 * Enriched with teacher name, course (track/level), and class date.
 */
export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const admin = createServiceClient();

  let q = admin.from('doubt_sessions')
    .select('id, cohort_id, booking_id, teacher_id, status, hr_approved_at, conducted_at, notes, created_at')
    .order('created_at', { ascending: false });
  if (actor.isHr || actor.isAdmin) {
    q = q.in('status', ['requested', 'hr_approved', 'conducted', 'rejected']);
  } else if (actor.isTeacher) {
    q = q.eq('teacher_id', actor.userId);
  } else {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const { data: rows } = await q;
  const sessions = rows ?? [];

  // Enrich (batch lookups).
  const teacherIds = [...new Set(sessions.map((s) => s.teacher_id).filter(Boolean))];
  const cohortIds = [...new Set(sessions.map((s) => s.cohort_id).filter(Boolean))] as string[];
  const bookingIds = [...new Set(sessions.map((s) => s.booking_id).filter(Boolean))] as string[];

  const [profs, cohorts, bookings] = await Promise.all([
    teacherIds.length ? admin.from('profiles').select('id, full_name').in('id', teacherIds) : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    cohortIds.length ? admin.from('cohorts').select('id, track, level').in('id', cohortIds) : Promise.resolve({ data: [] as { id: string; track: string; level: string }[] }),
    bookingIds.length ? admin.from('bookings').select('id, slot_start').in('id', bookingIds) : Promise.resolve({ data: [] as { id: string; slot_start: string }[] }),
  ]);
  const nameById = new Map(((profs.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name]));
  const cohortById = new Map(((cohorts.data ?? []) as { id: string; track: string; level: string }[]).map((c) => [c.id, c]));
  const slotById = new Map(((bookings.data ?? []) as { id: string; slot_start: string }[]).map((b) => [b.id, b.slot_start]));

  return NextResponse.json({
    ok: true,
    role: actor.role,
    sessions: sessions.map((s) => ({
      ...s,
      teacher_name: nameById.get(s.teacher_id) ?? null,
      track: s.cohort_id ? cohortById.get(s.cohort_id)?.track ?? null : null,
      level: s.cohort_id ? cohortById.get(s.cohort_id)?.level ?? null : null,
      class_date: s.booking_id ? slotById.get(s.booking_id) ?? null : null,
    })),
  });
}
