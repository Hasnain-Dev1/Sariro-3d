import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { assignLessonIdentity } from '@/lib/dashboard/lesson-identity';

/**
 * SARIRO — POST /api/admin/assign-lessons
 * =========================================================
 * Stamps module_num and lesson_name onto every scheduled class, derived from
 * its position in its cohort's syllabus.
 *
 * ── Why this is needed ──────────────────────────────────────────────────────
 * Bookings made through createBooking() have carried lesson identity for a
 * while. Bookings made by the batch scheduler never did, so classes in
 * production had module_num and lesson_name NULL — the teacher's panel could
 * not say which lesson a class was, and the student's Class Notes list had no
 * name to print and said "Review session" against every entry.
 *
 * Safe to run repeatedly. It derives identity from current position, so it also
 * repairs cohorts whose classes have been rescheduled or cancelled since.
 *
 * Body: { cohortId? } — one cohort, or every cohort when omitted.
 */

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `assign-lessons:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: { cohortId?: string };
  try { body = await req.json(); } catch { body = {}; }

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  const { data: profile } = await admin
    .from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role
    ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (!['admin', 'super_admin'].includes(role as string)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const ids: string[] = [];
  if (body.cohortId) {
    ids.push(body.cohortId);
  } else {
    const { data: cohorts } = await admin.from('cohorts').select('id').limit(500);
    ids.push(...((cohorts ?? []) as { id: string }[]).map((c) => c.id));
  }

  const results: { cohortId: string; updated: number; classes: number; reason?: string }[] = [];
  for (const cohortId of ids) {
    const r = await assignLessonIdentity(admin, cohortId);
    results.push({ cohortId, updated: r.updated, classes: r.lessons.length, reason: r.reason });
  }

  return NextResponse.json({
    ok: true,
    cohorts: results.length,
    stamped: results.reduce((s, r) => s + r.updated, 0),
    results,
  });
}
