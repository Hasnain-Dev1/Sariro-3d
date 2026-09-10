import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { recordAdminAction } from '@/lib/audit/log';
import { canAssignCourse } from '@/lib/contact/reachability';

/* ── Enrolling no longer mints credits ──────────────────────────────────────
   There used to be a grantEnrollmentCredits() here. It gave a learner one
   credit per lesson in the course — forty-two for a forty-two-lesson course —
   and recorded them as type 'purchase' with nobody having purchased anything.

   The effect was that the credit system did nothing at all. Every child could
   join every class, because every child was handed a full course free at the
   moment they were enrolled; the balance on the screen was a copy of the
   syllabus length rather than a record of what a family had bought.

   Credits are now only ever created where money is: the grant and adjust
   screens. Enrolling puts a child in a batch; it does not pay for one. See
   lib/dashboard/schedule-credit-gate.ts, which is what now stands between a
   teacher's evening and an unpaid class. */

/**
 * SARIRO — POST /api/admin/enroll  (admin / super_admin)
 *
 * Manually enrols a student into a cohort — bypassing payment — using the
 * service role, because RLS blocks the browser client from inserting an
 * enrollment for ANOTHER user. Idempotent per (user, cohort).
 *
 * Body: { userId, track, level, ratio, cohortId }
 */
export const runtime = 'nodejs';

interface Body { userId?: string; track?: string; level?: string; ratio?: string; cohortId?: string }

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let userId: string | null = null;
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* 401 */ }
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const admin = createServiceClient();
  const { data: p } = await admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', userId).single();
  const isAdmin = p?.role === 'admin' || p?.role === 'super_admin' || p?.is_admin === true || p?.is_super_admin === true;
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `admin-enroll:${userId}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (!body.userId || !body.track || !body.level || !body.ratio || !body.cohortId) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
  }

  /* ── An account we cannot phone gets no course ────────────────────────────
     A disabled dropdown option is a courtesy. This is the boundary: the route
     runs as the service role and will happily enrol anybody it is told to, so
     the rule has to be asked here, of the database, rather than trusted from
     a client that could simply not have sent the request through the UI.
     See lib/contact/reachability.ts for why the phone and not the email. */
  const { data: target } = await admin
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', body.userId)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ ok: false, error: 'no_such_user' }, { status: 404 });
  }
  const verdict = canAssignCourse(target);
  if (!verdict.ok) {
    return NextResponse.json(
      { ok: false, error: verdict.code, message: verdict.message },
      { status: 409 }
    );
  }

  // Idempotent: reactivate or skip if already enrolled in this cohort.
  const { data: existing } = await admin.from('enrollments').select('id, status').eq('user_id', body.userId).eq('cohort_id', body.cohortId).maybeSingle();
  if (existing) {
    if (existing.status !== 'active') await admin.from('enrollments').update({ status: 'active' }).eq('id', existing.id);
    return NextResponse.json({ ok: true, enrollment_id: existing.id, reactivated: true });
  }

  const { data: enrollment, error } = await admin.from('enrollments').insert({
    user_id: body.userId, track: body.track, level: body.level, ratio: body.ratio,
    status: 'active', cohort_id: body.cohortId, started_at: new Date().toISOString(),
  }).select('id').single();
  if (error) return NextResponse.json({ ok: false, error: 'enroll_failed', message: error.message }, { status: 500 });

  // Best-effort notification.
  await admin.from('notifications').insert({
    user_id: body.userId, type: 'enrollment_confirmed', title: 'You have been enrolled!',
    message: `An admin enrolled you in ${body.track} (${body.level}, ${body.ratio}). Check your dashboard for your cohort.`,
    link: '/dashboard/student',
  }).then(() => {}, () => {});

  /* §9, §76. A manual enrolment bypasses payment, so of everything in the
     product this is the action most in need of a name attached to it. */
  await recordAdminAction(admin, {
    adminId: userId,
    action: 'student_enrolled',
    targetType: 'user',
    targetId: body.userId,
    metadata: {
      enrollment_id: enrollment?.id ?? null,
      cohort_id: body.cohortId,
      track: body.track,
      level: body.level,
      ratio: body.ratio,
      manual: true,
    },
  });

  return NextResponse.json({ ok: true, enrollment_id: enrollment?.id });
}
