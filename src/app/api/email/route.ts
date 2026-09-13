import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { generateOtp, isOtpShaped } from '@/lib/phone/otp';
import { sendEmail } from '@/lib/email/hostinger';
import { isBlockedEmail, BLOCKED_EMAIL_MESSAGE } from '@/lib/email/disposable';

/**
 * SARIRO — POST /api/email   { action: 'send' | 'verify', email, code? }
 *
 * Email verification for the free class booking, and deliberately the same
 * shape as /api/phone: same code generator, same layered limits, same refusal
 * to let the browser near anything that matters.
 *
 * ── Why the email has to be proved at all ───────────────────────────────────
 * It stopped being decoration. The address is now how a family signs in after
 * the trial, so an unverified one is an account nobody can get into, and a
 * typo is an account belonging to somebody else — including, occasionally, a
 * real stranger who then receives somebody's child's class links.
 *
 * ── Layers, and what each is for ────────────────────────────────────────────
 *   IP rate limit     a script hammering the route from one place
 *   per-address rules 30s between codes, 5 a day  (scripts/email-verification.sql)
 *   attempt cap       5 guesses per code           (same file)
 *
 * The per-address rules live in the database rather than here, so a second
 * code path added later inherits them instead of having to remember them.
 *
 * ── What comes back from `send` ─────────────────────────────────────────────
 * Whether a message went out. Never the code. We generate it, we hash it, and
 * the only way to learn it is to read the inbox it was sent to.
 */
export const runtime = 'nodejs';

/** Trimmed and lowercased — the same normalisation the database function uses. */
const clean = (raw: string | undefined) => (raw ?? '').trim().toLowerCase();
const looksLikeEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e);

interface Body {
  action?: 'send' | 'verify';
  email?: string;
  code?: string;
  /** Honeypot. */
  website?: string;
}

/**
 * Mark the signed-in account's email as verified.
 *
 * Only ever the caller's OWN profile — matching by address instead would let
 * an unauthenticated request stamp a stranger's account by verifying an
 * address it had already verified, and this form is public. An anonymous
 * verification still counts for the booking, because the booking route asks
 * the database rather than trusting anybody.
 */
async function stampVerifiedProfile(
  admin: ReturnType<typeof createServiceClient>,
  email: string
): Promise<void> {
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return;
    await admin.from('profiles').update({ email, email_verified: true }).eq('id', user.id);
  } catch (err) {
    // Never fails the verification: they typed the right code, and whether we
    // managed to write a flag afterwards is our problem, not theirs.
    console.warn('[email] could not stamp profile:', err instanceof Error ? err.message : err);
  }
}

function codeEmail(code: string): { subject: string; html: string; text: string } {
  return {
    subject: `${code} is your Sariro code`,
    text:
      `Your Sariro verification code is ${code}.\n\n` +
      `It expires in 10 minutes. If you did not ask for it, you can ignore this email.`,
    html:
      `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:420px;margin:0 auto;padding:28px 4px;color:#0f172a">` +
      `<p style="font-size:15px;line-height:1.6;margin:0 0 20px">Here is your code for booking a free class.</p>` +
      `<p style="font-size:34px;font-weight:800;letter-spacing:.22em;margin:0 0 20px;font-variant-numeric:tabular-nums">${code}</p>` +
      `<p style="font-size:13px;line-height:1.6;color:#475569;margin:0">It expires in 10 minutes. ` +
      `If you did not ask for it, you can ignore this email — nothing has been booked.</p>` +
      `</div>`,
  };
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const rl = rateLimit({ key: `email-otp:${ip}`, limit: 20, windowMs: 10 * 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many attempts. Try again shortly.');

  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  // A bot filling every field. Answered plausibly so it does not learn.
  if (body.website) return NextResponse.json({ ok: true, sent: true });

  const email = clean(body.email);
  if (!looksLikeEmail(email)) {
    return NextResponse.json(
      { ok: false, error: 'bad_email', message: 'That does not look like an email address.' },
      { status: 400 }
    );
  }
  /* Stopped at the door rather than at the booking: there is no point sending
     a code to an inbox we will refuse to open an account for. */
  if (isBlockedEmail(email)) {
    return NextResponse.json(
      { ok: false, error: 'blocked_email', message: BLOCKED_EMAIL_MESSAGE },
      { status: 400 }
    );
  }

  let admin;
  try { admin = createServiceClient(); } catch {
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 503 });
  }

  /* ── Send ────────────────────────────────────────────────────────────── */
  if (body.action === 'send') {
    const code = generateOtp();

    const { data, error } = await admin.rpc('request_email_otp', {
      p_email: email, p_otp: code, p_ip: ip,
    });
    if (error) {
      /* The migration has not been applied. Said plainly rather than as a
         generic failure: this is a deployment problem and the person in front
         of it can do nothing about it. */
      console.warn('[email] request_email_otp failed:', error.message);
      return NextResponse.json(
        { ok: false, error: 'not_configured', message: 'Email verification is not set up yet. Please try again shortly.' },
        { status: 503 }
      );
    }

    const verdict = (Array.isArray(data) ? data[0] : data) as
      { allowed: boolean; retry_after: number; reason: string } | undefined;

    if (!verdict?.allowed) {
      if (verdict?.reason === 'cooldown') {
        return NextResponse.json(
          { ok: false, error: 'cooldown', retryAfter: verdict.retry_after,
            message: `Give it ${verdict.retry_after} more second${verdict.retry_after === 1 ? '' : 's'} before asking for another code.` },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { ok: false, error: 'daily_cap',
          message: 'That address has had several codes today. Try again tomorrow, or use a different one.' },
        { status: 429 }
      );
    }

    const mail = codeEmail(code);
    const sent = await sendEmail({ to: email, ...mail });
    if (!sent.success) {
      console.warn('[email] send failed:', sent.error);
      return NextResponse.json(
        { ok: false, error: 'send_failed', message: 'We could not send a code to that address. Check it and try again.' },
        { status: 502 }
      );
    }

    // Only ever whether it went. Never the code.
    return NextResponse.json({ ok: true, sent: true });
  }

  /* ── Verify ──────────────────────────────────────────────────────────── */
  if (body.action === 'verify') {
    const code = (body.code ?? '').trim();
    if (!isOtpShaped(code)) {
      return NextResponse.json(
        { ok: false, error: 'bad_code', message: 'That code should be six digits.' },
        { status: 400 }
      );
    }

    const { data, error } = await admin.rpc('verify_email_otp', { p_email: email, p_otp: code });
    if (error) {
      console.warn('[email] verify_email_otp failed:', error.message);
      return NextResponse.json(
        { ok: false, error: 'not_configured', message: 'Email verification is not set up yet.' },
        { status: 503 }
      );
    }

    const verdict = (Array.isArray(data) ? data[0] : data) as
      { verified: boolean; reason: string; attempts_left: number } | undefined;

    if (verdict?.verified) {
      await stampVerifiedProfile(admin, email);

      /* ── What the booking form needs next ────────────────────────────────
         Every account is keyed on the email, so once the email is proved we
         can say two useful things: whether this person already has an account,
         and whether the number on it was ever checked.

         If it was, the form skips the SMS step entirely. Every skipped code is
         a message we do not pay for, and a step a returning family does not
         repeat for a number we already trust.

         Deliberately AFTER verification. Answering "does this address have an
         account?" before the code is confirmed would let anybody type an
         address and learn whether it is one of our customers. */
      const { data: account } = await admin
        .from('profiles')
        .select('phone, phone_verified, phone_country_code')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        ok: true,
        verified: true,
        account: {
          exists: !!account,
          phone: (account?.phone as string | null) ?? null,
          phoneVerified: account?.phone_verified === true,
          phoneCountryCode: (account?.phone_country_code as string | null) ?? null,
        },
      });
    }

    const message =
      verdict?.reason === 'expired' ? 'That code has expired. Ask for a new one.'
        : verdict?.reason === 'no_code' ? 'Ask for a code first.'
          : verdict?.reason === 'too_many_attempts' ? 'Too many wrong tries. Ask for a new code.'
            : verdict?.attempts_left && verdict.attempts_left > 0
              ? `That code did not match — ${verdict.attempts_left} ${verdict.attempts_left === 1 ? 'try' : 'tries'} left.`
              : 'That code did not match.';

    return NextResponse.json(
      { ok: false, error: verdict?.reason ?? 'wrong', message, attemptsLeft: verdict?.attempts_left ?? 0 },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
}
