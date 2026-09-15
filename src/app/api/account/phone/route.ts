import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { rateLimit, rateLimitedResponse, getClientIp } from '@/lib/rate-limit';
import { acceptPhone } from '@/lib/phone/accept';

import { smsConfigured } from '@/lib/phone/otp';
import { loadPhoneTrust } from '@/lib/phone/trust';
import { sendPhoneCode, checkPhoneCode, otpPhoneFrom } from '@/lib/phone/otp-flow';
import {
  applyAccountPhone, decidePhoneWrite, nextChangeAt, readAccountPhone, tooSoonMessage, type ApplyResult,
} from '@/lib/phone/account-phone';
import { isVerifiedImpersonation, IMPERSONATOR_COOKIE } from '@/lib/auth/impersonation';

/**
 * SARIRO — the signed-in account's own phone number
 * ============================================================================
 * GET   { phone, verified, countryCode, nextChangeAt, impersonating, smsAvailable }
 * POST  { action: 'send',   phone, country }         a code, or saved without one
 *       { action: 'verify', phone, country, code }   the code, then saved
 *
 * The only way an account's number changes (scripts/phone-change-guard.sql
 * refuses a browser writing it directly). The rules are the founder's, and
 * live in lib/phone/account-phone.ts: prove the number once; prove a new one to
 * change it; change it at most once a week; and every sales record follows.
 *
 * ── Codes cost ₹1, so one is sent only when nothing else will do ────────────
 *   the same number, already verified        nothing to do
 *   a code verified for it within the hour   saved, no new code
 *   the account's FIRST proof, of a number
 *     verified with us before                saved, no code (lib/phone/trust.ts)
 *   anything else, in any country            a code, on WhatsApp
 * A CHANGE of a verified number always takes a code on the new one.
 * The week is checked before a code is sent, so a refusal costs nothing.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function applied(result: ApplyResult) {
  if (result.ok) {
    return NextResponse.json({ ok: true, done: true, phone: result.phone, verified: result.verified }, { headers: NO_STORE });
  }
  const status = result.error === 'too_soon' ? 429 : result.error === 'needs_proof' ? 400 : result.error === 'not_ready' ? 503 : 500;
  return NextResponse.json(result, { status, headers: NO_STORE });
}

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'account-phone-status', limit: 60, skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const [row, impersonating] = await Promise.all([
    readAccountPhone(actor.admin, actor.id),
    isVerifiedImpersonation(req.cookies.get(IMPERSONATOR_COOKIE)?.value, actor.admin, actor.id),
  ]);
  if (!row) return NextResponse.json({ ok: false, error: 'read_failed' }, { status: 500, headers: NO_STORE });

  return NextResponse.json(
    {
      ok: true,
      phone: row.phone,
      verified: row.verified,
      countryCode: row.countryCode,
      nextChangeAt: row.verified ? nextChangeAt(row.changedAt) : null,
      impersonating,
      smsAvailable: smsConfigured(),
    },
    { headers: NO_STORE }
  );
}

interface Body {
  action?: 'send' | 'verify';
  phone?: string;
  country?: string;
  code?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'account-phone', limit: 30 });
  if (!gate.ok) return gate.response;
  const { actor } = gate;
  const { admin } = actor;

  const parsed = await readJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  // The admin viewing as somebody is not the person whose phone this is.
  if (await isVerifiedImpersonation(req.cookies.get(IMPERSONATOR_COOKIE)?.value, admin, actor.id)) {
    return NextResponse.json(
      { ok: false, error: 'impersonating', message: 'You are viewing as this user. Only they can change their phone number.' },
      { status: 403 }
    );
  }

  const accepted = acceptPhone(body.phone, body.country);
  if (!accepted.ok) return NextResponse.json({ ok: false, error: 'bad_phone', message: accepted.problem }, { status: 400 });

  const current = await readAccountPhone(admin, actor.id);
  if (!current) {
    return NextResponse.json({ ok: false, error: 'read_failed', message: 'We could not read your account just now. Please try again.' }, { status: 500 });
  }

  const next = { phone: accepted.e164, countryCode: accepted.countryCode };
  // Every listed country can be sent a WhatsApp code (lib/phone/countries.ts).
  const reachable = accepted.canVerify ? otpPhoneFrom(accepted) : null;

  /* ── Send ──────────────────────────────────────────────────────────────── */
  if (body.action === 'send') {
    // What proving it would do, asked before anything is spent.
    const preview = decidePhoneWrite(current, { ...next, verified: accepted.canVerify });
    if (preview.kind === 'noop') {
      return NextResponse.json({ ok: true, done: true, phone: current.phone, verified: current.verified }, { headers: NO_STORE });
    }
    if (preview.kind === 'too_soon') {
      return NextResponse.json(
        { ok: false, error: 'too_soon', nextChangeAt: preview.nextChangeAt, message: tooSoonMessage(preview.nextChangeAt) },
        { status: 429 }
      );
    }
    if (preview.kind === 'write' && preview.isChange && !current.columnReady) {
      return applied({ ok: false, error: 'not_ready', message: 'Changing a number is not switched on yet. Please contact support to change it.' });
    }

    // Codes switched off (or a country no code reaches): saved as it is, unverified.
    if (!reachable || !smsConfigured()) {
      return applied(await applyAccountPhone(admin, actor.id, { ...next, verified: false }));
    }

    /* A code already verified for this number within the hour — or, for the
       account's first proof, a number verified with us before. A change of a
       verified number is not given that second shortcut: the founder's rule
       is that the new number is proved. */
    try {
      const firstProof = !current.verified;
      const trust = await loadPhoneTrust(admin, { phone: accepted.e164, email: current.email ?? '', emailProved: true });
      if (trust.trusted && (trust.why === 'fresh_code' || firstProof)) {
        return applied(await applyAccountPhone(admin, actor.id, { ...next, verified: true }));
      }
    } catch (err) {
      // Unanswered is "send a code as usual" — never a skipped check.
      console.warn('[account-phone] trust check failed:', err instanceof Error ? err.message : err);
    }

    // Per account as well as per number: nobody proves six numbers in an hour.
    const perUser = rateLimit({ key: `account-phone-send:${actor.id}`, limit: 6, windowMs: 60 * 60_000 });
    if (!perUser.ok) return rateLimitedResponse(perUser.retryAfterMs, 'Too many codes for this account. Please try again later.');

    const sent = await sendPhoneCode(admin, reachable, getClientIp(req));
    if (!sent.ok) {
      if (sent.canProceed) return applied(await applyAccountPhone(admin, actor.id, { ...next, verified: false }));
      const { status, ...refusal } = sent;
      return NextResponse.json(refusal, { status });
    }
    return NextResponse.json({ ok: true, done: false, sentTo: sent.sentTo }, { headers: NO_STORE });
  }

  /* ── Verify ────────────────────────────────────────────────────────────── */
  if (body.action === 'verify') {
    if (!reachable) {
      return NextResponse.json({ ok: false, error: 'bad_phone', message: 'We cannot send a code to that number.' }, { status: 400 });
    }
    const rl = rateLimit({ key: `account-phone-verify:${actor.id}`, limit: 20, windowMs: 10 * 60_000 });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many attempts. Please wait a moment.');

    const checked = await checkPhoneCode(admin, accepted.e164, body.code);
    if (!checked.ok) {
      const { status, ...refusal } = checked;
      return NextResponse.json(refusal, { status });
    }
    return applied(await applyAccountPhone(admin, actor.id, { ...next, verified: true }));
  }

  return NextResponse.json({ ok: false, error: 'bad_action' }, { status: 400 });
}
