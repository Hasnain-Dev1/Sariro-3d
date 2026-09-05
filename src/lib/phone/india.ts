/**
 * SARIRO — Indian mobile numbers, in one shape
 * =========================================================
 * A number typed by a parent arrives in a dozen forms: `98765 43210`,
 * `09876543210`, `+91 98765-43210`, `919876543210`. They are all the same
 * phone. Stored as typed, they are four different rows, and "has this number
 * verified?" answers no for three of them.
 *
 * So every number is reduced to one canonical E.164 string — `+919876543210` —
 * before it is stored, compared, or sent to.
 *
 * ── Why India only, for now ─────────────────────────────────────────────────
 * The SMS provider (apitxt.com) delivers to Indian numbers. Rather than send
 * to a number that will silently never arrive, anything that is not a valid
 * Indian mobile is rejected here with a reason the form can show. What the
 * product does about a foreign number is the caller's decision — see
 * /api/phone — but it is made knowingly rather than by a message vanishing.
 *
 * ── What makes a mobile number Indian ───────────────────────────────────────
 * Country code 91, then exactly ten digits, the first of which is 6, 7, 8 or 9.
 * That first digit is the part people miss: 2-5 are landline trunk codes, and a
 * landline will accept an SMS request and deliver nothing.
 */

export interface PhoneOk {
  ok: true;
  /** `+919876543210` — what gets stored and compared. */
  e164: string;
  /** `9876543210` — the ten digits, for display. */
  national: string;
  /** `919876543210` — what apitxt.com wants, no plus. */
  wire: string;
}

export interface PhoneBad {
  ok: false;
  /** Shown to the person typing. Says what is wrong, not that it is invalid. */
  reason: string;
}

export type PhoneResult = PhoneOk | PhoneBad;

/** Digits only. Everything a person might type between them is noise. */
const digitsOf = (raw: string) => raw.replace(/\D/g, '');

export function normalizeIndianMobile(raw: string): PhoneResult {
  const input = (raw ?? '').trim();
  if (!input) return { ok: false, reason: 'Enter your mobile number.' };

  let digits = digitsOf(input);

  // 00 is the international prefix dialled from a landline: 0091… is +91….
  if (digits.startsWith('00')) digits = digits.slice(2);

  // A leading 91 is the country code — but only when what follows is a full
  // ten-digit mobile. `9198765432` is ten digits beginning 91 and is itself a
  // valid number starting 9; stripping the 91 there would corrupt it.
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith('091')) {
    digits = digits.slice(3);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // The domestic trunk prefix. 09876543210 is dialled inside India.
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    // The two mistakes worth naming separately, because the fix differs.
    if (digits.length < 10) {
      return { ok: false, reason: 'That is too short for an Indian mobile number — it needs 10 digits.' };
    }
    return {
      ok: false,
      reason: 'That looks like a number outside India. We can only send a code to Indian mobile numbers at the moment.',
    };
  }

  if (!/^[6-9]/.test(digits)) {
    return {
      ok: false,
      reason: 'Indian mobile numbers start with 6, 7, 8 or 9. Check the first digit.',
    };
  }

  return { ok: true, e164: `+91${digits}`, national: digits, wire: `91${digits}` };
}

/** Whether a number can be sent an OTP at all. */
export const isIndianMobile = (raw: string) => normalizeIndianMobile(raw).ok;

/**
 * `+91 98765 4••••` — enough for the person to recognise their own number,
 * not enough for a screenshot to give it away.
 *
 * Used in "we sent a code to …", which is a message that gets read aloud, put
 * in a support ticket, and photographed.
 */
export function maskIndianMobile(e164: string): string {
  const parsed = normalizeIndianMobile(e164);
  if (!parsed.ok) return '';
  const n = parsed.national;
  return `+91 ${n.slice(0, 5)} ${n.slice(5, 6)}••••`;
}
