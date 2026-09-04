import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';
import { recordAdminAction } from '@/lib/audit/log';

/**
 * Grant class credits for an enrollment (idempotent per enrollment). Credits are
 * consumed per completed class, so a manual enroll MUST grant them or the kid
 * can't join. Only tops up the difference so re-runs / DB grant-triggers don't
 * double-count.
 */
async function grantEnrollmentCredits(
  admin: ReturnType<typeof createServiceClient>,
  opts: { userId: string; enrollmentId: string; track: string; level: string; grantedBy: string }
) {
  const lessonCount = getCourseSyllabus(opts.track, opts.level).totalLessons;
  if (!lessonCount || lessonCount < 1) return;
  const { data: txns } = await admin.from('credit_transactions')
    .select('amount').eq('related_enrollment_id', opts.enrollmentId);
  const already = (txns ?? []).reduce((s: number, t: { amount: number }) => s + (t.amount > 0 ? t.amount : 0), 0);
  const topUp = lessonCount - already;
  if (topUp <= 0) return;
  const { data: cr } = await admin.from('credits').select('balance').eq('user_id', opts.userId).maybeSingle();
  const newBalance = (cr?.balance ?? 0) + topUp;
  await admin.from('credits').upsert({ user_id: opts.userId, balance: newBalance }, { onConflict: 'user_id' });
  await admin.from('credit_transactions').insert({
    user_id: opts.userId, amount: topUp, type: 'purchase',
    description: `Enrollment credits — ${opts.track} ${opts.level} (${lessonCount} lessons)`,
    related_enrollment_id: opts.enrollmentId, created_by: opts.grantedBy,
  });
}

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

  // Idempotent: reactivate or skip if already enrolled in this cohort.
  const { data: existing } = await admin.from('enrollments').select('id, status').eq('user_id', body.userId).eq('cohort_id', body.cohortId).maybeSingle();
  if (existing) {
    if (existing.status !== 'active') await admin.from('enrollments').update({ status: 'active' }).eq('id', existing.id);
    // Ensure credits exist even on reactivation (idempotent top-up).
    await grantEnrollmentCredits(admin, { userId: body.userId, enrollmentId: existing.id, track: body.track, level: body.level, grantedBy: userId });
    return NextResponse.json({ ok: true, enrollment_id: existing.id, reactivated: true });
  }

  const { data: enrollment, error } = await admin.from('enrollments').insert({
    user_id: body.userId, track: body.track, level: body.level, ratio: body.ratio,
    status: 'active', cohort_id: body.cohortId, started_at: new Date().toISOString(),
  }).select('id').single();
  if (error) return NextResponse.json({ ok: false, error: 'enroll_failed', message: error.message }, { status: 500 });

  // Grant class credits (idempotent) so the kid can actually join classes.
  if (enrollment) {
    await grantEnrollmentCredits(admin, { userId: body.userId, enrollmentId: enrollment.id, track: body.track, level: body.level, grantedBy: userId });
  }

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
