import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import {
  validateProjectUrl,
  calculateSpeedPoints,
} from '@/lib/dashboard/submissions-data';
import { findEnrichedLessonByName } from '@/lib/capstones';

/**
 * SARIRO — POST /api/student/submission
 *
 * Body: {
 *   enrollment_id, booking_id?, module_num, lesson_name, capstone_step_title,
 *   title, description?, project_url, demo_url?,
 *   reflection_tricky?, reflection_proud?, website? (honeypot)
 * }
 *
 * Flow:
 *   1. CSRF check (must come from same origin)
 *   2. IP blocklist check
 *   3. Rate limit: 10 submissions/min/user
 *   4. Auth gate (must be signed in as student)
 *   5. Honeypot check (silently 200 + don't insert if filled)
 *   6. Validate payload (required fields, length limits, URL allowlist)
 *   7. Verify the student owns the enrollment
 *   8. Verify the booking exists + student is in the cohort
 *   9. Verify the student was NOT marked absent for this booking
 *  10. Verify the class is completed (booking.status = 'completed')
 *  11. Check for existing submission (unique constraint on enrollment+module)
 *  12. Calculate speed_points from booking.slot_end vs now
 *  13. Insert the submission row (RLS allows student to insert own)
 *  14. Return { ok, submission }
 *
 * Security:
 *   - CSRF on every POST
 *   - Honeypot field (silently rejects bots)
 *   - Rate limited (10/min/user)
 *   - URL allowlist (15 trusted hosts, HTTPS required)
 *   - RLS enforced (student can only insert own rows)
 *   - Speed points captured at submit time (immune to reschedules)
 *   - Unique constraint prevents duplicate submissions per lesson
 */

export const runtime = 'nodejs';

interface SubmissionBody {
  enrollment_id?: string;
  booking_id?: string | null;
  module_num?: number;
  lesson_name?: string;
  capstone_step_title?: string;
  title?: string;
  description?: string;
  project_url?: string;
  demo_url?: string;
  reflection_tricky?: string;
  reflection_proud?: string;
  website?: string; // honeypot
}

export async function POST(req: NextRequest) {
  // ── 1. CSRF check ─────────────────────────────────────────────────────
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  // ── 2. IP blocklist ───────────────────────────────────────────────────
  const requestIp = getClientIp(req);
  if (isIpBlocked(requestIp)) {
    return NextResponse.json(
      { ok: false, error: 'forbidden' },
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 3. Rate limit: 10 submissions/min/user ────────────────────────────
  // We rate-limit by IP for now (auth-gate happens next). Once we know the
  // user, we could rate-limit by user ID, but IP is sufficient for v1.
  const ipKey = `submission:${requestIp}`;
  const rl = rateLimit({ key: ipKey, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Too many submissions. Please slow down.');
  }

  // ── 4. Parse body ─────────────────────────────────────────────────────
  let body: SubmissionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 5. Honeypot check — silently succeed (don't tell bot why) ─────────
  if (body.website) {
    // Pretend it worked so the bot doesn't know it was caught
    return NextResponse.json(
      { ok: true, submission: { id: 'rejected' } },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 6. Validate required fields ───────────────────────────────────────
  const errors: string[] = [];
  if (!body.enrollment_id) errors.push('Enrollment is required');
  if (!body.module_num || body.module_num < 1) errors.push('Module number is required');
  if (!body.lesson_name || body.lesson_name.trim().length < 2) errors.push('Lesson name is required');
  if (!body.capstone_step_title) errors.push('Capstone step title is required');
  if (!body.title || body.title.trim().length < 3) errors.push('Project title must be at least 3 characters');
  if (body.title && body.title.length > 200) errors.push('Project title must be under 200 characters');
  if (body.description && body.description.length > 5000) errors.push('Description must be under 5000 characters');
  if (body.reflection_tricky && body.reflection_tricky.length > 2000) errors.push('Reflection must be under 2000 characters');
  if (body.reflection_proud && body.reflection_proud.length > 2000) errors.push('Reflection must be under 2000 characters');

  if (!body.project_url) {
    errors.push('Project URL is required');
  } else {
    const urlCheck = validateProjectUrl(body.project_url);
    if (!urlCheck.ok) errors.push(urlCheck.error!);
    body.project_url = urlCheck.normalized;
  }

  if (body.demo_url) {
    const demoCheck = validateProjectUrl(body.demo_url);
    if (!demoCheck.ok) errors.push(`Demo URL: ${demoCheck.error!}`);
    body.demo_url = demoCheck.normalized;
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', errors },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 7. Auth gate ──────────────────────────────────────────────────────
  let supabase;
  let userId: string;
  try {
    supabase = await createServerClientHelper();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'supabase_not_configured' },
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'unauthenticated' },
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  userId = user.id;

  // ── 8. Verify the student owns the enrollment ─────────────────────────
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, user_id, cohort_id, track, level, status')
    .eq('id', body.enrollment_id!)
    .maybeSingle();

  if (enrollErr) {
    console.warn('[submission] enrollment lookup error:', enrollErr.message);
    return NextResponse.json(
      { ok: false, error: 'enrollment_lookup_failed' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!enrollment) {
    return NextResponse.json(
      { ok: false, error: 'enrollment_not_found' },
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (enrollment.user_id !== userId) {
    // Don't leak that the enrollment exists — just say not found
    return NextResponse.json(
      { ok: false, error: 'enrollment_not_found' },
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (enrollment.status === 'dropped') {
    return NextResponse.json(
      { ok: false, error: 'enrollment_dropped' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 9. Verify the booking (if provided) + check attendance ────────────
  let bookingSlotEnd: Date | null = null;
  let bookingStatus: string | null = null;
  if (body.booking_id) {
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, cohort_id, slot_end, status')
      .eq('id', body.booking_id)
      .maybeSingle();

    if (bookingErr) {
      console.warn('[submission] booking lookup error:', bookingErr.message);
      return NextResponse.json(
        { ok: false, error: 'booking_lookup_failed' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'booking_not_found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the booking belongs to the student's cohort
    if (enrollment.cohort_id && booking.cohort_id !== enrollment.cohort_id) {
      return NextResponse.json(
        { ok: false, error: 'booking_cohort_mismatch' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    bookingSlotEnd = new Date(booking.slot_end);
    bookingStatus = booking.status;

    // Check if the student was marked ABSENT for this booking
    // If absent, they cannot submit (per product decision)
    const { data: attendance } = await supabase
      .from('session_attendance')
      .select('status')
      .eq('booking_id', body.booking_id)
      .eq('student_id', userId)
      .maybeSingle();

    if (attendance?.status === 'absent') {
      return NextResponse.json(
        {
          ok: false,
          error: 'absent_no_submission',
          message: 'You were marked absent for this class. Submit your project after the rescheduled class.',
        },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the class is completed (form is locked until class ends)
    if (booking.status !== 'completed') {
      return NextResponse.json(
        {
          ok: false,
          error: 'class_not_completed',
          message: 'You can submit your project after the class ends.',
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 10. Check for existing submission (unique constraint) ─────────────
  const { data: existing } = await supabase
    .from('project_submissions')
    .select('id, status')
    .eq('enrollment_id', body.enrollment_id!)
    .eq('module_num', body.module_num!)
    .maybeSingle();

  if (existing) {
    // If existing submission is 'approved', don't allow overwrite
    if (existing.status === 'approved') {
      return NextResponse.json(
        {
          ok: false,
          error: 'already_approved',
          message: 'This project was already approved. You cannot resubmit.',
        },
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // If existing is 'submitted' or 'resubmit', UPDATE it (allow editing)
    const speedPts = calculateSpeedPoints(new Date(), bookingSlotEnd);
    const { data: updated, error: updateErr } = await supabase
      .from('project_submissions')
      .update({
        title: body.title!.trim(),
        description: body.description?.trim() || null,
        project_url: body.project_url!,
        demo_url: body.demo_url || null,
        reflection_tricky: body.reflection_tricky?.trim() || null,
        reflection_proud: body.reflection_proud?.trim() || null,
        status: 'submitted', // reset to submitted on edit
        reviewed_at: null,    // clear previous review
        reviewed_by: null,
        speed_points: speedPts, // recalculate based on new submit time
        submitted_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (updateErr) {
      console.warn('[submission] update error:', updateErr.message);
      return NextResponse.json(
        { ok: false, error: 'update_failed', message: updateErr.message },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return NextResponse.json(
      { ok: true, submission: updated },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 11. Calculate speed points ────────────────────────────────────────
  const speedPts = calculateSpeedPoints(new Date(), bookingSlotEnd);

  // ── 12. Insert the submission (RLS allows student to insert own) ──────
  const { data: submission, error: insertErr } = await supabase
    .from('project_submissions')
    .insert({
      enrollment_id: body.enrollment_id!,
      booking_id: body.booking_id ?? null,
      user_id: userId,
      module_num: body.module_num!,
      lesson_name: body.lesson_name!.trim(),
      capstone_step_title: body.capstone_step_title!,
      title: body.title!.trim(),
      description: body.description?.trim() || null,
      project_url: body.project_url!,
      demo_url: body.demo_url || null,
      reflection_tricky: body.reflection_tricky?.trim() || null,
      reflection_proud: body.reflection_proud?.trim() || null,
      status: 'submitted',
      speed_points: speedPts,
    })
    .select('*')
    .single();

  if (insertErr) {
    console.warn('[submission] insert error:', insertErr.message);
    // Handle unique constraint violation (race condition — two submits at same time)
    if (insertErr.code === '23505') {
      return NextResponse.json(
        { ok: false, error: 'duplicate_submission', message: 'You already submitted for this lesson.' },
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.json(
      { ok: false, error: 'insert_failed', message: insertErr.message },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 13. Return success ────────────────────────────────────────────────
  return NextResponse.json(
    { ok: true, submission },
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
}
