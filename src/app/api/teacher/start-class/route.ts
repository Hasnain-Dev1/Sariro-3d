import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/teacher/start-class  { bookingId }
 *
 * The teacher clicks "Start Class" when they join. Records
 * bookings.teacher_started_at (source of truth for lateness). The completion
 * trigger later reads it to apply the 3–10 min −₹100 penalty.
 *
 * Safety: only the booking's own teacher can start it; only while the booking
 * is still 'scheduled' (a booking already finalised as no_show cannot be
 * "started"); idempotent (a second click keeps the first timestamp).
 */
export const runtime = 'nodejs';

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
  } catch { /* 401 below */ }
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const rl = rateLimit({ key: `start-class:${userId}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let bookingId: string | undefined;
  try { bookingId = (await req.json())?.bookingId; } catch { /* handled */ }
  if (!bookingId) return NextResponse.json({ ok: false, error: 'missing_booking' }, { status: 400 });

  const admin = createServiceClient();
  const { data: booking, error } = await admin
    .from('bookings')
    .select('id, teacher_id, status, slot_start, teacher_started_at')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: 'lookup_failed' }, { status: 500 });
  if (!booking) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  if (booking.teacher_id !== userId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (booking.status !== 'scheduled') {
    return NextResponse.json({ ok: false, error: 'not_startable', message: `Class is ${booking.status}.` }, { status: 409 });
  }

  const now = new Date();
  // Idempotent: keep the earliest recorded start.
  const startedAt = booking.teacher_started_at ? new Date(booking.teacher_started_at) : now;
  if (!booking.teacher_started_at) {
    const { error: uErr } = await admin
      .from('bookings')
      .update({ teacher_started_at: now.toISOString() })
      .eq('id', bookingId)
      .is('teacher_started_at', null);          // guard against races
    if (uErr) return NextResponse.json({ ok: false, error: 'update_failed', message: uErr.message }, { status: 500 });
  }

  const lateMin = Math.max(0, Math.round((startedAt.getTime() - new Date(booking.slot_start).getTime()) / 60000));
  return NextResponse.json({ ok: true, teacher_started_at: startedAt.toISOString(), late_minutes: lateMin });
}
