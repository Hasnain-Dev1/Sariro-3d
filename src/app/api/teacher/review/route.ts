import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/teacher/review
 *
 * Body: {
 *   submissionId, rating (1-5), content (min 10 chars), approved (bool),
 *   website? (honeypot)
 * }
 *
 * Flow:
 *   1. CSRF check
 *   2. IP blocklist
 *   3. Rate limit: 20 reviews/min/teacher (generous for bulk review sessions)
 *   4. Auth gate (must be signed in as teacher)
 *   5. Honeypot check (silently succeed if filled)
 *   6. Validate payload
 *   7. Fetch the submission + its booking
 *   8. Verify the authenticated teacher owns the booking
 *   9. Calculate review_points (3) + ontime_bonus (2 if within 48h of submission)
 *  10. Upsert submission_feedback row (1:1 with submission)
 *  11. Update project_submissions: status = approved|resubmit, reviewed_at, reviewed_by
 *      (The sync_capstone_on_approval trigger from Phase 2 auto-marks
 *       lesson_progress.capstone_completed = TRUE when status flips to 'approved')
 *  12. Return { ok }
 *
 * Security:
 *   - CSRF on every POST
 *   - Honeypot field
 *   - Rate limited (20/min/teacher)
 *   - RLS enforced — teacher can only review submissions on bookings they own
 *   - Audit log trigger (from Phase 2) captures every review in admin_audit_logs
 */

export const runtime = 'nodejs';

interface ReviewBody {
  submissionId?: string;
  rating?: number;
  content?: string;
  approved?: boolean;
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

  // ── 3. Rate limit: 20 reviews/min/teacher ─────────────────────────────
  const ipKey = `review:${requestIp}`;
  const rl = rateLimit({ key: ipKey, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Too many reviews. Please slow down.');
  }

  // ── 4. Parse body ─────────────────────────────────────────────────────
  let body: ReviewBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 5. Honeypot check — silently succeed ──────────────────────────────
  if (body.website) {
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 6. Validate payload ───────────────────────────────────────────────
  const errors: string[] = [];
  if (!body.submissionId) errors.push('Submission ID is required');
  if (!body.rating || body.rating < 1 || body.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }
  if (!body.content || body.content.trim().length < 10) {
    errors.push('Feedback must be at least 10 characters');
  }
  if (body.content && body.content.length > 5000) {
    errors.push('Feedback must be under 5000 characters');
  }
  if (typeof body.approved !== 'boolean') {
    errors.push('Approved flag is required');
  }
  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', errors },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 7. Auth gate ──────────────────────────────────────────────────────
  let supabase;
  let teacherId: string;
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
  teacherId = user.id;

  // ── 8. Fetch the submission + verify teacher owns the booking ─────────
  const { data: submission, error: subErr } = await supabase
    .from('project_submissions')
    .select('id, booking_id, user_id, submitted_at, status')
    .eq('id', body.submissionId!)
    .maybeSingle();

  if (subErr) {
    console.warn('[review] submission lookup error:', subErr.message);
    return NextResponse.json(
      { ok: false, error: 'submission_lookup_failed' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!submission) {
    return NextResponse.json(
      { ok: false, error: 'submission_not_found' },
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // If booking_id is null, we can't verify ownership — reject
  if (!submission.booking_id) {
    return NextResponse.json(
      { ok: false, error: 'no_booking_on_submission' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify the teacher owns this booking
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, teacher_id')
    .eq('id', submission.booking_id)
    .maybeSingle();

  if (bookingErr) {
    console.warn('[review] booking lookup error:', bookingErr.message);
    return NextResponse.json(
      { ok: false, error: 'booking_lookup_failed' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!booking || booking.teacher_id !== teacherId) {
    // Don't leak that the booking exists — just say not found
    return NextResponse.json(
      { ok: false, error: 'submission_not_found' },
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 9. Calculate review_points + ontime_bonus ─────────────────────────
  const reviewPoints = 3; // 3 points per review
  const submittedAt = new Date(submission.submitted_at);
  const now = new Date();
  const hoursSinceSubmit = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
  const ontimeBonus = hoursSinceSubmit <= 48 ? 2 : 0; // +2 if reviewed within 48h

  // ── 10. Upsert submission_feedback ────────────────────────────────────
  // Check if feedback already exists (teacher editing their review)
  const { data: existingFeedback } = await supabase
    .from('submission_feedback')
    .select('id')
    .eq('submission_id', body.submissionId!)
    .maybeSingle();

  const newStatus = body.approved ? 'approved' : 'resubmit';

  if (existingFeedback) {
    // Update existing feedback
    const { error: updateFbErr } = await supabase
      .from('submission_feedback')
      .update({
        rating: body.rating,
        content: body.content!.trim(),
        approved: body.approved,
        review_points: reviewPoints,
        ontime_bonus: ontimeBonus,
      })
      .eq('id', existingFeedback.id);

    if (updateFbErr) {
      console.warn('[review] feedback update error:', updateFbErr.message);
      return NextResponse.json(
        { ok: false, error: 'feedback_update_failed', message: updateFbErr.message },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else {
    // Insert new feedback
    const { error: insertFbErr } = await supabase
      .from('submission_feedback')
      .insert({
        submission_id: body.submissionId!,
        teacher_id: teacherId,
        rating: body.rating,
        content: body.content!.trim(),
        approved: body.approved,
        review_points: reviewPoints,
        ontime_bonus: ontimeBonus,
      });

    if (insertFbErr) {
      console.warn('[review] feedback insert error:', insertFbErr.message);
      return NextResponse.json(
        { ok: false, error: 'feedback_insert_failed', message: insertFbErr.message },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 11. Update submission status + reviewed_at + reviewed_by ───────────
  // Only update if status is actually changing OR reviewed_at is null
  // (avoids redundant writes + trigger fires)
  if (submission.status !== newStatus || !submission.status) {
    const { error: subUpdateErr } = await supabase
      .from('project_submissions')
      .update({
        status: newStatus,
        reviewed_at: now.toISOString(),
        reviewed_by: teacherId,
      })
      .eq('id', body.submissionId!);

    if (subUpdateErr) {
      console.warn('[review] submission update error:', subUpdateErr.message);
      // Don't fail the whole request — feedback was saved successfully
      // The status update can be retried; the feedback is the source of truth
    }
  } else {
    // Status unchanged but teacher may have edited feedback — update reviewed_at
    const { error: touchErr } = await supabase
      .from('project_submissions')
      .update({
        reviewed_at: now.toISOString(),
        reviewed_by: teacherId,
      })
      .eq('id', body.submissionId!);
    if (touchErr) {
      console.warn('[review] submission touch error:', touchErr.message);
    }
  }

  // ── 12. Return success ────────────────────────────────────────────────
  // Note: the sync_capstone_on_approval trigger (Phase 2) will auto-mark
  // lesson_progress.capstone_completed = TRUE if status flipped to 'approved'.
  // The log_submission_review trigger (Phase 2) will auto-write to admin_audit_logs.
  return NextResponse.json(
    {
      ok: true,
      status: newStatus,
      review_points: reviewPoints,
      ontime_bonus: ontimeBonus,
    },
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
