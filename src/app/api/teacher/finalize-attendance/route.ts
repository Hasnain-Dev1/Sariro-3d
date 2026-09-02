import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/teacher/finalize-attendance
 * =========================================================
 * Body: { bookingId, recordingUrl }
 *
 * Closes a class: stores the recording link and stamps
 * `attendance_finalized_at`. That stamp is what makes the recording visible to
 * the students in the class — nothing else does.
 *
 * ── Why this is separate from marking attendance ────────────────────────────
 * `/api/teacher/attendance` marks ONE student, and a roster of four produces
 * four calls over several seconds. "This class is done" is a different event
 * from "this student was present", and conflating them would reveal a recording
 * to the first student while the teacher was still marking the fourth.
 *
 * ── The rule this exists to enforce ─────────────────────────────────────────
 * V2 §18: a teacher must not be able to finalise without submitting the
 * recording. Enforced here AND as a CHECK constraint in the database, because
 * an API rule only binds callers who go through the API.
 *
 * ── What it deliberately does not do ────────────────────────────────────────
 * It does not mark anybody present. A teacher who finalises without marking a
 * roster has simply finalised an empty roster — which is a real situation (a
 * class where nobody came) and not this endpoint's business to police.
 */

export const runtime = 'nodejs';

interface Body {
  bookingId?: string;
  recordingUrl?: string;
}

/**
 * Accepts any http(s) URL.
 *
 * Deliberately not an allowlist of Meet/Drive/Zoom hosts: the team changes
 * tools, and a validator that rejects the link a teacher actually has produces
 * a class that can never be finalised — which is a worse failure than a link
 * pointing somewhere unexpected.
 */
function isPlausibleUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const supabase = await createServerClientHelper();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'not_authenticated' }, { status: 401 });
  }

  const rl = rateLimit({ key: `finalize-attendance:${user.id}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests. Please wait a moment.');

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const bookingId = (body.bookingId ?? '').trim();
  const recordingUrl = (body.recordingUrl ?? '').trim();

  if (!bookingId) {
    return NextResponse.json({ ok: false, error: 'booking_required' }, { status: 400 });
  }
  if (!recordingUrl) {
    // The message a teacher actually sees, so it says what to do.
    return NextResponse.json(
      {
        ok: false,
        error: 'recording_required',
        message: 'Please submit the class recording link before finalizing attendance.',
      },
      { status: 400 }
    );
  }
  if (recordingUrl.length > 1000 || !isPlausibleUrl(recordingUrl)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_recording_url',
        message: 'That does not look like a link. Paste the full URL, starting with https://',
      },
      { status: 400 }
    );
  }

  // Ownership: the teacher on the booking, and nobody else. RLS backs this up,
  // but checking here gives a real message instead of an empty update.
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, teacher_id, attendance_finalized_at')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingErr || !booking) {
    return NextResponse.json({ ok: false, error: 'booking_not_found' }, { status: 404 });
  }
  if (booking.teacher_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'not_your_class' }, { status: 403 });
  }

  // Re-finalising is allowed — a teacher who pasted the wrong link must be able
  // to correct it — but the original timestamp stands, because it is what the
  // late-marking penalty is measured against.
  const alreadyFinal = !!booking.attendance_finalized_at;

  const { error: updateErr } = await supabase
    .from('bookings')
    .update({
      recording_url: recordingUrl,
      attendance_finalized_at: booking.attendance_finalized_at ?? new Date().toISOString(),
      attendance_finalized_by: user.id,
    })
    .eq('id', bookingId);

  if (updateErr) {
    console.warn('[finalize-attendance] update error:', updateErr.message);
    return NextResponse.json(
      { ok: false, error: 'finalize_failed', message: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, updated: alreadyFinal });
}
