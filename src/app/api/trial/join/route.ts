import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { lateByMinutes, ON_TIME_GRACE_MIN } from '@/lib/trial/certificate';

/**
 * SARIRO — POST /api/trial/join  { bookingId }
 *
 * The moment a trial student presses Join.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * The class page promises a completion certificate to learners who join on
 * time, and nothing knew when a trial student joined: /api/student/join-class
 * needs a cohort and credits, and a trial has neither. So the Join button was a
 * plain link, and "on time" was unknowable.
 *
 * The button still IS a plain link — it opens the meeting no matter what this
 * route does, and fires this request alongside with keepalive. A slow or broken
 * request must never be the reason a child misses their first class.
 *
 * Records once. The first press is the one that counts; pressing again later,
 * after dropping out, cannot make an on-time join look late.
 */
export const runtime = 'nodejs';

/** The same window the button uses: ten minutes before, until the end. */
const OPENS_BEFORE_MS = 10 * 60_000;

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
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const rl = rateLimit({ key: `trial-join:${userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let bookingId: string | undefined;
  try { bookingId = (await req.json())?.bookingId; } catch { /* handled */ }
  if (!bookingId) return NextResponse.json({ ok: false, error: 'missing_booking' }, { status: 400 });

  const admin = createServiceClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, slot_start, slot_end, status, is_trial, trial_student_id')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking || !booking.is_trial) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  const { data: seat } = await admin
    .from('trial_participants').select('id')
    .eq('booking_id', bookingId).eq('student_id', userId).maybeSingle();
  if (booking.trial_student_id !== userId && !seat) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const now = Date.now();
  const start = Date.parse(booking.slot_start);
  const end = Date.parse(booking.slot_end);
  if (booking.status !== 'scheduled' || now < start - OPENS_BEFORE_MS || now > end) {
    // Nothing to record — and the meeting link still opened, so no harm done.
    return NextResponse.json({ ok: true, recorded: false });
  }

  const { data: existing } = await admin
    .from('session_attendance').select('status')
    .eq('booking_id', bookingId).eq('student_id', userId).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, recorded: false, already: true });

  const delay = lateByMinutes(booking.slot_start, now);
  const { error } = await admin.from('session_attendance').insert({
    booking_id: bookingId,
    student_id: userId,
    status: delay > ON_TIME_GRACE_MIN ? 'late' : 'present',
    join_delay_minutes: delay,
    marked_at: new Date(now).toISOString(),
  });
  if (error) {
    console.warn('[trial-join] could not record the join:', error.code, error.message);
    return NextResponse.json({ ok: false, error: 'record_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, recorded: true, joinDelayMinutes: delay });
}
