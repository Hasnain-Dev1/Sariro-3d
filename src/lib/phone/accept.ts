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
 * ── Verified and allowed are two different questions ────────────────────────
 * apitxt.com delivers SMS to India and nowhere else. Everywhere else a code is
 * generated, the request is accepted, and nothing ever arrives — so demanding
 * verification abroad is demanding something impossible.
 *
 * The rule is therefore:
 *
 *   India        — verification REQUIRED. The code reaches them, so a number
 *                  nobody proved is a number somebody else typed.
 *   Elsewhere    — accepted UNVERIFIED, and recorded as such. A seller ringing
 *                  them will find out soon enough, and a family we cannot text
 *                  is still a family who wants a class.
 *
 * `smsReachable()` is the one place that distinction lives, so the day a
 * second country becomes reachable this rule follows automatically.
 *
 * ── Why not just accept everything ──────────────────────────────────────────
 * An unverified Indian number is an account-takeover vector: type somebody
 * else's mobile, and the routes that sign a caller in would hand over their
 * session. Abroad there is no code to skip, so there is no gate to defeat —
 * the risk is different in kind, not merely in degree.
 */

import { checkNational, toE164, smsReachable, countryByCode, stripTrunkPrefix, DEFAULT_COUNTRY } from '@/lib/phone/countries';

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

  return { ok: true, e164, countryCode: code, national, canVerify: smsReachable(code) };
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

/** What to tell somebody we cannot text. Warm, and honest about why. */
export const UNVERIFIABLE_NOTICE =
  'We can only send verification codes to Indian numbers at the moment, so we will confirm yours when we ring you.';
