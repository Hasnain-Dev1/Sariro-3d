import type { SupabaseClient } from '@supabase/supabase-js';
import { acceptPhone, type AcceptedPhone } from '@/lib/phone/accept';
import { splitE164 } from '@/lib/phone/countries';
import { generateOtp, isOtpShaped, sendOtpWhatsApp } from '@/lib/phone/otp';

/**
 * SARIRO — sending a code and checking one, for every route that does
 * ============================================================================
 * The booking form (/api/phone) and the account's own number
 * (/api/account/phone) both send codes. Codes go on WhatsApp, to a number in
 * any country (lib/phone/otp.ts). The rules that protect the balance — 30
 * seconds between codes, 5 a day, 5 guesses a code — are in the database
 * (scripts/phone-otp.sql); what is here is the order of asking and the words a
 * person is shown, so the two routes cannot drift into saying different
 * things about the same refusal.
 *
 * Results rather than responses: each route wraps its own status codes, and
 * this file stays testable without Next.
 */

export interface OtpPhone {
  /** '+9779801234567' — what is stored and compared. */
  e164: string;
  /** '9779801234567' — what the provider wants: the full number, no plus. */
  wire: string;
  countryCode: string;
}

export const otpPhoneFrom = (p: AcceptedPhone): OtpPhone => ({
  e164: p.e164,
  wire: p.e164.replace(/\D/g, ''),
  countryCode: p.countryCode,
});

/**
 * A number from a form, however it arrived: a picked country and what was
 * typed, or one string already carrying its dial code. With no country and no
 * dial code it is read as Indian, as the booking form always sent it.
 */
export function parseOtpPhone(
  raw: string | null | undefined,
  country?: string | null
): { ok: true; phone: OtpPhone } | { ok: false; problem: string } {
  const picked = (country ?? '').trim();
  const dialled = picked ? null : splitE164(raw).country?.code ?? null;
  const accepted = acceptPhone(raw, picked || dialled || 'IN');
  return accepted.ok ? { ok: true, phone: otpPhoneFrom(accepted) } : { ok: false, problem: accepted.problem };
}

/** "+91 98765 4••••" / "+977 98••••••67" — enough to recognise, not enough to copy. */
export function maskPhone(e164: string): string {
  const s = splitE164(e164);
  if (!s.country || !s.national) return '';
  const n = s.national;
  if (s.country.code === 'IN' && n.length === 10) return `+91 ${n.slice(0, 5)} ${n.slice(5, 6)}••••`;
  return `+${s.country.dial} ${n.slice(0, 2)}${'•'.repeat(Math.max(2, n.length - 4))}${n.slice(-2)}`;
}

export type SendResult =
  | { ok: true; sentTo: string }
  | { ok: false; status: number; error: string; message: string; retryAfter?: number; canProceed?: boolean };

export async function sendPhoneCode(admin: SupabaseClient, phone: OtpPhone, ip: string): Promise<SendResult> {
  const code = generateOtp();

  // Asked BEFORE the message: the database decides whether this number may be
  // sent to, so a refusal costs nothing.
  const { data, error } = await admin.rpc('request_phone_otp', { p_phone: phone.e164, p_otp: code, p_ip: ip });
  if (error) {
    const missing = /does not exist|schema cache/i.test(error.message);
    console.warn('[phone] request_phone_otp:', error.message);
    return {
      ok: false,
      status: missing ? 503 : 500,
      error: 'not_ready',
      message: missing
        ? 'Phone verification is not set up yet — run scripts/phone-otp.sql in Supabase.'
        : 'Could not send a code right now. Please try again.',
    };
  }

  const decision = (Array.isArray(data) ? data[0] : data) as
    | { allowed: boolean; retry_after: number; reason: string }
    | undefined;

  if (!decision?.allowed) {
    if (decision?.reason === 'daily_cap') {
      return {
        ok: false,
        status: 429,
        error: 'daily_cap',
        message: 'That number has had several codes today. Please try again tomorrow, or contact us and we will help.',
      };
    }
    const wait = decision?.retry_after ?? 30;
    return { ok: false, status: 429, error: 'cooldown', retryAfter: wait, message: `Please wait ${wait} seconds before asking for another code.` };
  }

  const result = await sendOtpWhatsApp(phone.wire, code);
  if (!result.sent) {
    // The provider's own error belongs in the log, not in front of a parent.
    console.warn('[phone] sendOTP failed:', result.detail);
    if (result.reason === 'not_configured') {
      /* Our mistake, not theirs — and it must not become a wall. `canProceed`
         tells the caller to stop requiring a check it cannot offer. */
      return {
        ok: false,
        status: 503,
        error: 'not_configured',
        canProceed: true,
        message: 'Verification is unavailable right now — you can carry on, and we will confirm your number later.',
      };
    }
    return {
      ok: false,
      status: 502,
      error: 'send_failed',
      message: 'We could not send the code on WhatsApp. Check that this number has a WhatsApp account and try again.',
    };
  }

  return { ok: true, sentTo: maskPhone(phone.e164) };
}

export type CheckResult =
  | { ok: true }
  | { ok: false; status: number; error: string; message: string; attemptsLeft?: number };

export async function checkPhoneCode(admin: SupabaseClient, e164: string, rawCode: string | undefined): Promise<CheckResult> {
  const code = (rawCode ?? '').trim();
  if (!isOtpShaped(code)) {
    // Not counted as an attempt: a half-typed code is not a guess.
    return { ok: false, status: 400, error: 'bad_code', message: 'Enter the 6-digit code.' };
  }

  const { data, error } = await admin.rpc('verify_phone_otp', { p_phone: e164, p_otp: code });
  if (error) {
    console.warn('[phone] verify_phone_otp:', error.message);
    return { ok: false, status: 500, error: 'verify_failed', message: 'Could not check that code. Please try again.' };
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    | { verified: boolean; reason: string; attempts_left: number }
    | undefined;
  if (result?.verified) return { ok: true };

  return {
    ok: false,
    status: 400,
    error: result?.reason ?? 'wrong',
    attemptsLeft: result?.attempts_left ?? 0,
    message: codeRefusal(result?.reason, result?.attempts_left),
  };
}

export function codeRefusal(reason: string | undefined, attemptsLeft: number | undefined): string {
  if (reason === 'expired') return 'That code has expired. Ask for a new one.';
  if (reason === 'too_many_attempts') return 'Too many wrong codes. Ask for a new one.';
  if (reason === 'no_code') return 'Ask for a code first.';
  if (attemptsLeft) return `That code is not right. ${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left.`;
  return 'That code is not right.';
}
