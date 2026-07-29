import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';

/**
 * SARIRO — POST /api/student/complete-enrollment
 *
 * Body: { enrollment_id }
 *
 * Flow:
 *   1. CSRF check
 *   2. Rate limit: 5/min/user
 *   3. Auth gate
 *   4. Verify the student owns the enrollment
 *   5. Verify enrollment is currently 'active' (don't re-complete)
 *   6. Fetch all lesson_progress rows for this enrollment
 *   7. Compare against the course syllabus (from code) — all lessons done?
 *   8. If yes → use SERVICE ROLE to update enrollment.status = 'completed' + completed_at
 *   9. Return { ok, completed: true }
 *
 * Why service role? RLS only allows students to update completion_shown_at,
 * not status. Only admins can update status. So we use service role for the
 * final update — but ONLY after server-side verification that all lessons
 * are genuinely done (can't be bypassed by client).
 */

export const runtime = 'nodejs';

interface CompleteBody {
  enrollment_id?: string;
  website?: string; // honeypot
}

export async function POST(req: NextRequest) {
  // 1. CSRF check
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  // 2. Rate limit
  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const rl = rateLimit({ key: `complete-enrollment:${requestIp}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  // 3. Parse body
  let body: CompleteBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  // Honeypot
  if (body.website) {
    return NextResponse.json({ ok: true, completed: false });
  }

  if (!body.enrollment_id) {
    return NextResponse.json({ ok: false, error: 'missing_enrollment_id' }, { status: 400 });
  }

  // 4. Auth gate
  let supabase;
  try {
    supabase = await createServerClientHelper();
  } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  // 5. Verify ownership + current status
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, user_id, track, level, status')
    .eq('id', body.enrollment_id)
    .maybeSingle();

  if (enrollErr || !enrollment) {
    return NextResponse.json({ ok: false, error: 'enrollment_not_found' }, { status: 404 });
  }
  if (enrollment.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'enrollment_not_found' }, { status: 404 });
  }
  // Already completed or dropped — nothing to do
  if (enrollment.status !== 'active') {
    return NextResponse.json({ ok: true, completed: false, reason: `already_${enrollment.status}` });
  }

  // 6. Fetch lesson_progress rows
  const { data: progressRows, error: progressErr } = await supabase
    .from('lesson_progress')
    .select('module_num, lesson_name')
    .eq('enrollment_id', body.enrollment_id);

  if (progressErr) {
    console.warn('[complete-enrollment] progress fetch error:', progressErr.message);
    return NextResponse.json({ ok: false, error: 'progress_fetch_failed' }, { status: 500 });
  }

  // 7. Compare against syllabus
  const syllabus = getCourseSyllabus(enrollment.track, enrollment.level);
  if (syllabus.totalLessons === 0) {
    return NextResponse.json({ ok: true, completed: false, reason: 'no_syllabus' });
  }

  // Build a set of completed lesson keys: `${moduleNum}::${lessonName}`
  const completedKeys = new Set(
    (progressRows ?? []).map((r) => `${r.module_num}::${r.lesson_name}`)
  );

  // Check every lesson in the syllabus is in the completed set
  let allDone = true;
  for (const mod of syllabus.modules) {
    for (const lesson of mod.lessons) {
      const lessonNameStr = typeof lesson === 'string' ? lesson : lesson.name;
      if (!completedKeys.has(`${mod.num}::${lessonNameStr}`)) {
        allDone = false;
        break;
      }
    }
    if (!allDone) break;
  }

  if (!allDone) {
    return NextResponse.json({ ok: true, completed: false, reason: 'not_all_lessons_done' });
  }

  // 8. All lessons done → use service role to mark enrollment completed
  try {
    const admin = createServiceClient();
    const { error: updateErr } = await admin
      .from('enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', body.enrollment_id);

    if (updateErr) {
      console.warn('[complete-enrollment] update error:', updateErr.message);
      return NextResponse.json({ ok: false, error: 'update_failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, completed: true });
  } catch (err) {
    console.warn('[complete-enrollment] service role error:', err);
    return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 });
  }
}