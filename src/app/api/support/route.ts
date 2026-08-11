import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { resolveActor } from '@/lib/dashboard/schedule-ops-server';

/**
 * SARIRO — POST /api/support
 *
 * Student support chat. On CREATE the query is routed to the student's teacher's
 * assigned admin (profiles.reporting_admin_id of the cohort's teacher), so
 * issues land with the right admin automatically.
 *
 * Actions:
 *   { action: 'create',  subject, body }              (student)
 *   { action: 'message', queryId, body }              (student owner or admin)
 *   { action: 'status',  queryId, status }            (admin)
 */
export const runtime = 'nodejs';

interface Body {
  action?: 'create' | 'message' | 'status';
  queryId?: string;
  subject?: string;
  body?: string;
  status?: 'open' | 'pending' | 'resolved' | 'closed';
}

/** Resolve the admin a student's issues should route to. */
async function resolveAssignedAdmin(admin: ReturnType<typeof createServiceClient>, studentId: string): Promise<{ adminId: string | null; cohortId: string | null }> {
  const { data: enr } = await admin.from('enrollments')
    .select('cohort_id, created_at').eq('user_id', studentId).eq('status', 'active')
    .not('cohort_id', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle();
  const cohortId = enr?.cohort_id ?? null;
  if (!cohortId) return { adminId: null, cohortId: null };
  // Teacher for this cohort (from the active schedule; fall back to a booking).
  const { data: sched } = await admin.from('cohort_schedules').select('teacher_id').eq('cohort_id', cohortId).limit(1).maybeSingle();
  let teacherId = sched?.teacher_id ?? null;
  if (!teacherId) {
    const { data: bk } = await admin.from('bookings').select('teacher_id').eq('cohort_id', cohortId).limit(1).maybeSingle();
    teacherId = bk?.teacher_id ?? null;
  }
  if (!teacherId) return { adminId: null, cohortId };
  const { data: teacher } = await admin.from('profiles').select('reporting_admin_id').eq('id', teacherId).maybeSingle();
  return { adminId: teacher?.reporting_admin_id ?? null, cohortId };
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const rl = rateLimit({ key: `support:${actor.userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const admin = createServiceClient();
  const nowIso = new Date().toISOString();

  switch (body.action) {
    case 'create': {
      const subject = (body.subject ?? '').trim();
      const text = (body.body ?? '').trim();
      if (!subject || !text) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
      const { adminId, cohortId } = await resolveAssignedAdmin(admin, actor.userId);
      const { data: q, error } = await admin.from('support_queries').insert({
        student_id: actor.userId, assigned_admin_id: adminId, cohort_id: cohortId,
        subject: subject.slice(0, 200), status: 'open', last_message_at: nowIso,
      }).select('id').single();
      if (error || !q) return NextResponse.json({ ok: false, error: 'create_failed', message: error?.message }, { status: 500 });
      await admin.from('support_messages').insert({ query_id: q.id, sender_id: actor.userId, body: text.slice(0, 2000) });
      return NextResponse.json({ ok: true, queryId: q.id, routedTo: adminId });
    }

    case 'message': {
      const text = (body.body ?? '').trim();
      if (!body.queryId || !text) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
      const { data: q } = await admin.from('support_queries').select('id, student_id, assigned_admin_id').eq('id', body.queryId).maybeSingle();
      if (!q) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
      const allowed = q.student_id === actor.userId || q.assigned_admin_id === actor.userId || actor.isAdmin;
      if (!allowed) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
      await admin.from('support_messages').insert({ query_id: q.id, sender_id: actor.userId, body: text.slice(0, 2000) });
      await admin.from('support_queries').update({ last_message_at: nowIso, status: actor.isAdmin ? 'pending' : 'open' }).eq('id', q.id);
      return NextResponse.json({ ok: true });
    }

    case 'status': {
      if (!actor.isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
      if (!body.queryId || !body.status) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
      await admin.from('support_queries').update({ status: body.status }).eq('id', body.queryId);
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
  }
}
