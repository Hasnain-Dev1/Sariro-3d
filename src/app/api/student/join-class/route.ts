import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/student/join-class
 *
 * Body: { booking_id }
 *
 * Lets an enrolled student join their own scheduled class. Unlike the
 * teacher's start-class route, there is NO time-window restriction here —
 * penalties (late-join, no-show) only ever apply to the teacher, so a
 * student is free to join a class whenever they like: early, on time, or
 * after it's technically started. This route only:
 *   1. Verifies the student is actively enrolled in the booking's cohort.
 *   2. Verifies the booking is still 'scheduled' (not cancelled/completed).
 *   3. Verifies the student has a positive credit balance (mirrors the
 *      dashboard's disabled-button guard, enforced again server-side).
 *   4. Records the student as 'present' in session_attendance — but only if
 *      no attendance row exists yet, so it never overwrites a status the
 *      teacher already set (e.g. 'absent' from a no-show sweep).
 *   5. Returns the meet URL to open.
 *
 * Credit deduction itself is NOT done here — it happens automatically via
 * the deduct_credits_on_class_complete DB trigger once the class is marked
 * completed, same as always.
 */
export const runtime = 'nodejs';

interface Body {
  booking_id?: string;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  let userId: string | null = null;
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* 401 below */ }
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const rl = rateLimit({ key: `join-class:${userId}`, limit: 30, windowMs: 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (!body.booking_id) return NextResponse.json({ ok: false, error: 'missing_booking' }, { status: 400 });

  const admin = createServiceClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id, cohort_id, status, google_meet_url')
    .eq('id', body.booking_id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ ok: false, error: 'not_found', message: 'Class not found.' }, { status: 404 });

  if (booking.status !== 'scheduled') {
    return NextResponse.json(
      { ok: false, error: 'not_joinable', message: `This class is ${booking.status} and can't be joined.` },
      { status: 409 }
    );
  }

  // Ownership: must be an active student in this booking's cohort.
  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('cohort_id', booking.cohort_id)
    .eq('status', 'active')
    .maybeSingle();
  if (!enrollment) {
    return NextResponse.json(
      { ok: false, error: 'forbidden', message: 'You are not enrolled in this class.' },
      { status: 403 }
    );
  }

  // Credits: mirrors the dashboard's disabled-button guard, checked again server-side.
  const { data: creditRow } = await admin
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();
  if (!creditRow || (creditRow.balance ?? 0) <= 0) {
    return NextResponse.json(
      { ok: false, error: 'no_credits', message: 'No credits remaining — contact admin to top up.' },
      { status: 409 }
    );
  }

  // Get the cohort's meet URL as a fallback if the booking itself has none.
  let meetUrl = booking.google_meet_url;
  if (!meetUrl) {
    const { data: cohort } = await admin.from('cohorts').select('google_meet_url').eq('id', booking.cohort_id).maybeSingle();
    meetUrl = cohort?.google_meet_url ?? null;
  }

  // Record presence — but never downgrade a status the teacher already set.
  const { data: existing } = await admin
    .from('session_attendance')
    .select('status')
    .eq('booking_id', booking.id)
    .eq('student_id', userId)
    .maybeSingle();
  if (!existing) {
    await admin.from('session_attendance').insert({
      booking_id: booking.id,
      student_id: userId,
      status: 'present',
      marked_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, meet_url: meetUrl, balance: creditRow.balance });
}
