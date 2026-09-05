import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { normalizeIndianMobile, maskIndianMobile } from '@/lib/phone/india';
import { generateOtp, isOtpShaped, sendOtpSms } from '@/lib/phone/otp';

/**
 * SARIRO — POST /api/phone   { action: 'send' | 'verify', phone, code? }
 *
 * Phone verification for the free class booking. A free class costs a mentor
 * half an hour, and until now anyone could book one by typing ten digits.
 *
 * ── Why this is a server route at all ───────────────────────────────────────
 * The SMS key. `APITXT_AUTHKEY` buys real messages, and apitxt.com's sendOTP is
 * a plain GET with the key in the query string — so a key that reaches the
 * browser is a key anybody can read out of the network tab and spend. It lives
 * in the server environment and is used only here.
 *
 * It also means WE generate the code. The browser never sees it, never sends
 * it, and cannot ask for it: the only thing that comes back from `send` is
 * whether a message went out.
 *
 * ── Layers, and what each one is for ────────────────────────────────────────
 *   IP rate limit    a script hammering the route from one place
 *   per-number rules 30s between codes, 5 a day  (scripts/phone-otp.sql)
 *   attempt cap      5 guesses per code          (scripts/phone-otp.sql)
 *
 * The per-number rules are in the database rather than here on purpose: they
 * are what protect the SMS balance, and a second code path added later gets
 * them without having to remember them.
 */
export const runtime = 'nodejs';

interface Body {
  action?: 'send' | 'verify';
  phone?: string;
  code?: string;
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const parsed = normalizeIndianMobile(body.phone ?? '');
  if (!parsed.ok) {
    // The reason is the one from lib/phone/india.ts — it says what is wrong
    // with the number rather than that it is invalid.
    return NextResponse.json({ ok: false, error: 'bad_phone', message: parsed.reason }, { status: 400 });
  }

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  /* ── Send ────────────────────────────────────────────────────────────── */
  if (body.action === 'send') {
    // Ten sends a minute from one address is already far beyond any real
    // person; the per-number rules below are the ones that actually bite.
    const rl = rateLimit({ key: `otp-send:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests. Please wait a moment.');

    const code = generateOtp();

    // Asked BEFORE the SMS: the database decides whether this number may be
    // sent to, so a refusal costs nothing.
    const { data, error } = await admin.rpc('request_phone_otp', {
      p_phone: parsed.e164,
      p_otp: code,
      p_ip: ip,
    });

    if (error) {
      const missing = /does not exist|schema cache/i.test(error.message);
      console.warn('[phone] request_phone_otp:', error.message);
      return NextResponse.json(
        {
          ok: false,
          error: 'not_ready',
          message: missing
            ? 'Phone verification is not set up yet — run scripts/phone-otp.sql in Supabase.'
            : 'Could not send a code right now. Please try again.',
        },
        { status: missing ? 503 : 500 }
      );
    }

    const decision = (Array.isArray(data) ? data[0] : data) as
      | { allowed: boolean; retry_after: number; reason: string }
      | undefined;

    if (!decision?.allowed) {
      if (decision?.reason === 'daily_cap') {
        return NextResponse.json(
          {
            ok: false,
            error: 'daily_cap',
            message: 'That number has had several codes today. Please try again tomorrow, or call us and we will book it for you.',
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: 'cooldown',
          retryAfter: decision?.retry_after ?? 30,
          message: `Please wait ${decision?.retry_after ?? 30} seconds before asking for another code.`,
        },
        { status: 429 }
      );
    }

    const result = await sendOtpSms(parsed.wire, code);
    if (!result.sent) {
      // The detail names the provider's own error and belongs in the log, not
      // in a message to a parent who cannot act on it.
      console.warn('[phone] sendOTP failed:', result.detail);

      // A missing key is our mistake, not theirs, and it must not close the
      // top of the funnel. `canProceed` tells the form to stop requiring
      // verification it cannot offer — the booking route makes the same
      // judgement independently, so the two cannot disagree.
      if (result.reason === 'not_configured') {
        return NextResponse.json(
          {
            ok: false,
            error: 'not_configured',
            canProceed: true,
            message: 'Verification is unavailable right now — you can still book, and we will confirm by phone.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { ok: false, error: 'send_failed', message: 'We could not send the code. Please check the number and try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, sentTo: maskIndianMobile(parsed.e164) });
  }

  /* ── Verify ──────────────────────────────────────────────────────────── */
  if (body.action === 'verify') {
    const rl = rateLimit({ key: `otp-verify:${ip}`, limit: 20, windowMs: 60_000 });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many attempts. Please wait a moment.');

    const code = (body.code ?? '').trim();
    if (!isOtpShaped(code)) {
      // Not counted as an attempt: a half-typed code is not a guess, and
      // spending the cap on typing would lock people out mid-entry.
      return NextResponse.json({ ok: false, error: 'bad_code', message: 'Enter the 6-digit code.' }, { status: 400 });
    }

    const { data, error } = await admin.rpc('verify_phone_otp', {
      p_phone: parsed.e164,
      p_otp: code,
    });

    if (error) {
      console.warn('[phone] verify_phone_otp:', error.message);
      return NextResponse.json({ ok: false, error: 'verify_failed', message: 'Could not check that code. Please try again.' }, { status: 500 });
    }

    const result = (Array.isArray(data) ? data[0] : data) as
      | { verified: boolean; reason: string; attempts_left: number }
      | undefined;

    if (result?.verified) {
      return NextResponse.json({ ok: true, verified: true });
    }

    const message =
      result?.reason === 'expired'
        ? 'That code has expired. Ask for a new one.'
        : result?.reason === 'too_many_attempts'
          ? 'Too many wrong codes. Ask for a new one.'
          : result?.reason === 'no_code'
            ? 'Ask for a code first.'
            : result?.attempts_left
              ? `That code is not right. ${result.attempts_left} ${result.attempts_left === 1 ? 'try' : 'tries'} left.`
              : 'That code is not right.';

    return NextResponse.json(
      { ok: false, error: result?.reason ?? 'wrong', message, attemptsLeft: result?.attempts_left ?? 0 },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: false, error: 'bad_action' }, { status: 400 });
}
