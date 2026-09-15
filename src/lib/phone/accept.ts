/**
 * SARIRO — a number we can take, and whether we could prove it
 * ============================================================================
 * The booking routes call `normalizeIndianMobile()` and refuse anything it
 * rejects. That is a stricter rule than the business actually has, and it is
 * costing real families: seven of the sixteen numbers on the live database are
 * outside India, one of them with an active enrolment. Every one of those
 * people would be turned away by the public booking form today with "We need
 * an Indian mobile number we can reach you on."
 *
 * ── Every country is verified ───────────────────────────────────────────────
 * Codes go on WhatsApp (lib/phone/otp.ts), which reaches a family anywhere, so
 * since 15 Sep 2026 every accepted number must be proved — not India alone, as
 * when codes went by SMS and nothing sent abroad arrived. `codeReachable()` is
 * the one place that decision lives.
 *
 * ── Why not just accept everything ──────────────────────────────────────────
 * An unverified number is an account-takeover vector: type somebody else's
 * mobile, and the routes that sign a caller in would hand over their session.
 * A code read back is what closes that.
 */

import { checkNational, toE164, codeReachable, countryByCode, stripTrunkPrefix, DEFAULT_COUNTRY } from '@/lib/phone/countries';

export interface AcceptedPhone {
  ok: true;
  /** '+919876543210'. What everything downstream compares. */
  e164: string;
  /** 'IN'. Stored on the lead and the profile. */
  countryCode: string;
  /** The number without the dial code, the way student_leads has always held it. */
  national: string;
  /** Whether a code could reach them at all. False means "do not ask". */
  canVerify: boolean;
}

export interface RejectedPhone {
  ok: false;
  problem: string;
}

export type PhoneAcceptance = AcceptedPhone | RejectedPhone;

/**
 * Take a phone number the way the form offers it: a country and a national
 * number, or a single string that may already carry a dial code.
 *
 * `countryCode` is what the person PICKED. It is trusted over anything guessed
 * from a timezone — deriving a stored country from a timezone is a bug this
 * codebase has already had.
 */
export function acceptPhone(
  raw: string | null | undefined,
  countryCode: string | null | undefined
): PhoneAcceptance {
  const code = (countryCode ?? '').trim().toUpperCase() || DEFAULT_COUNTRY;
  const country = countryByCode(code);
  if (!country) return { ok: false, problem: 'Choose a country.' };

  let national = (raw ?? '').trim();
  if (!national) return { ok: false, problem: 'Enter your phone number.' };

  /* A number pasted with its own dial code — "+91 98765 43210" — must not end
     up as +91 91 98765 43210. The picked country's dial code comes off first
     when it is there. */
  const digitsOnly = national.replace(/\D/g, '');
  if (national.trim().startsWith('+') && digitsOnly.startsWith(country.dial)) {
    national = digitsOnly.slice(country.dial.length);
  } else {
    national = digitsOnly;
  }

  /* The trunk prefix people type out of habit is not part of the international
     number: `+91 09876543210` rings nothing. */
  national = stripTrunkPrefix(national);

  const check = checkNational(code, national);
  if (!check.ok) return { ok: false, problem: check.problem };

  const e164 = toE164(code, national);
  if (!e164) return { ok: false, problem: 'That does not look like a phone number.' };

  return { ok: true, e164, countryCode: code, national, canVerify: codeReachable(code) };
}

/**
 * Whether this number has to be proved before it can be used.
 *
 * Separated from acceptPhone so a route reads as the two decisions it is
 * actually making — "is this a number" and "must they prove it" — rather than
 * as one boolean whose meaning depends on where you are standing.
 */
export function verificationRequired(phone: AcceptedPhone): boolean {
  return phone.canVerify;
}

/** What a number field says about where the code goes. */
export const WHATSAPP_CODE_NOTICE =
  'We send your verification code on WhatsApp, so enter the number your WhatsApp account uses.';
