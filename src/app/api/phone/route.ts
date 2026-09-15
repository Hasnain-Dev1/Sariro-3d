import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { loadPhoneTrust, TRUST_COPY } from '@/lib/phone/trust';
import { sendPhoneCode, checkPhoneCode, parseOtpPhone, type OtpPhone } from '@/lib/phone/otp-flow';
import { applyAccountPhone } from '@/lib/phone/account-phone';

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
 *
 * ── And a code is never spent on a number we already trust ──────────────────
 * Every code is ₹1. `check` answers "does this number need one?" for free, and
 * `send` asks the same question before spending — so even a form that forgot to
 * check cannot pay to prove a number twice. Both need the email: see
 * lib/phone/trust.ts for the rule and why it is behind a proved address.
 */
export const runtime = 'nodejs';

/**
 * Give the signed-in account the number it just proved.
 *
 * Only ever touches the caller's OWN profile. Matching by number instead would
 * mean an unauthenticated request could stamp a stranger's account simply by
 * verifying a number it had already verified — and the booking form is public.
 * So an anonymous verification still counts for the booking (the demo-class
 * route asks the database directly) and just does not write to anybody.
 *
 * Through applyAccountPhone, like every other proved number: the weekly limit
 * on changing a verified number holds here too, and the sales records follow.
 */
async function stampVerifiedProfile(
  admin: ReturnType<typeof createServiceClient>,
  phone: OtpPhone
): Promise<void> {
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return;
    const result = await applyAccountPhone(admin, user.id, { phone: phone.e164, countryCode: phone.countryCode, verified: true });
    if (!result.ok) console.warn('[phone] profile kept its number:', result.error);
  } catch (err) {
    /* Never fails the verification. The person typed the right code; whether
       we managed to write a flag afterwards is our problem, not theirs. */
    console.warn('[phone] could not stamp profile:', err instanceof Error ? err.message : err);
  }
}

interface Body {
  action?: 'send' | 'verify' | 'check';
  phone?: string;
  /** ISO country picked on the form. Optional: a number with its dial code says it. */
  country?: string;
  code?: string;
  /** The address proved earlier in the form. Lets a known number skip the code. */
  email?: string;
}

/**
 * Whether this number needs a code, for this proved email. A failed read is
 * "needs one" — the worst a failure may cost is a code, never a skipped check.
 */
async function trustFor(admin: ReturnType<typeof createServiceClient>, phone: string, email: string | undefined) {
  if (!email?.trim()) return { trusted: false as const };
  try {
    return await loadPhoneTrust(admin, { phone, email });
  } catch (err) {
    console.warn('[phone] trust check failed:', err instanceof Error ? err.message : err);
    return { trusted: false as const };
  }
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

  /* Any country: codes go on WhatsApp. The reason says what is wrong with the
     number rather than that it is invalid. */
  const read = parseOtpPhone(body.phone, body.country);
  if (!read.ok) {
    return NextResponse.json({ ok: false, error: 'bad_phone', message: read.problem }, { status: 400 });
  }
  const parsed = read.phone;

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  /* ── Check: does this number need a code at all? ─────────────────────── */
  if (body.action === 'check') {
    // Free to answer, so limited like a lookup: nobody types thirty numbers.
    const rl = rateLimit({ key: `otp-check:${ip}`, limit: 30, windowMs: 10 * 60_000 });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests. Please wait a moment.');

    const trust = await trustFor(admin, parsed.e164, body.email);
    return NextResponse.json(
      trust.trusted
        ? { ok: true, needsCode: false, why: trust.why, message: TRUST_COPY[trust.why] }
        : { ok: true, needsCode: true }
    );
  }

  /* ── Send ────────────────────────────────────────────────────────────── */
  if (body.action === 'send') {
    // Ten sends a minute from one address is already far beyond any real
    // person; the per-number rules below are the ones that actually bite.
    const rl = rateLimit({ key: `otp-send:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests. Please wait a moment.');

    /* Asked before a single rupee is spent. A number this proved email already
       vouches for — its own account's number, or one verified with us before —
       is answered "no code needed", and nothing is sent. */
    const trust = await trustFor(admin, parsed.e164, body.email);
    if (trust.trusted) {
      return NextResponse.json({ ok: true, needsCode: false, why: trust.why, message: TRUST_COPY[trust.why] });
    }

    /* The database's per-number rules, the SMS, and the words for each
       refusal are shared with /api/account/phone (lib/phone/otp-flow.ts). A
       missing SMS key comes back with `canProceed`: the form stops requiring
       verification it cannot offer, and the booking route makes the same
       judgement independently, so the two cannot disagree. */
    const sent = await sendPhoneCode(admin, parsed, ip);
    if (!sent.ok) {
      const { status, ...refusal } = sent;
      return NextResponse.json(refusal, { status });
    }
    return NextResponse.json({ ok: true, needsCode: true, sentTo: sent.sentTo });
  }

  /* ── Verify ──────────────────────────────────────────────────────────── */
  if (body.action === 'verify') {
    const rl = rateLimit({ key: `otp-verify:${ip}`, limit: 20, windowMs: 60_000 });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many attempts. Please wait a moment.');

    const checked = await checkPhoneCode(admin, parsed.e164, body.code);

    if (checked.ok) {
      /* The profile learns about it. `phone_verified` had been declared on the
         Profile type since the column was added and written by precisely
         nothing — every one of the twenty-two accounts said false, including
         the two numbers that had genuinely been through this route. A column
         that always answers the same thing is worse than an absent one,
         because code gets written against it.

         The number is stored canonically at the same time. The live table has
         one human's number under `9709123454`, `+91 6296914378` and
         `+916296914378`; three spellings of one phone is three people as far
         as any lookup is concerned. */
      await stampVerifiedProfile(admin, parsed);
      return NextResponse.json({ ok: true, verified: true });
    }

    const { status, ...refusal } = checked;
    return NextResponse.json(refusal, { status });
  }

  return NextResponse.json({ ok: false, error: 'bad_action' }, { status: 400 });
}
