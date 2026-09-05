import { randomInt } from 'node:crypto';

/**
 * SARIRO — the code itself
 * =========================================================
 * Server-only. This module generates the OTP and talks to the SMS provider,
 * which means it holds the API key — nothing here may ever be imported into a
 * client component.
 */

export const OTP_LENGTH = 6;

/**
 * Six digits, uniformly distributed, from the OS random source.
 *
 * `Math.random()` would be the obvious thing and would be wrong: it is a
 * predictable PRNG, so an attacker who observes a few codes can compute the
 * next one and verify a number they do not own. randomInt() draws from the same
 * pool as key material and rejects modulo bias rather than folding it in.
 *
 * Leading zeros are kept — `042318` is a perfectly good code, and padding it
 * back is what stops a one-in-ten code being five digits on the phone and six
 * in the box.
 */
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

/** What a person may type: six digits, nothing else. */
export const isOtpShaped = (value: string) =>
  new RegExp(`^\\d{${OTP_LENGTH}}$`).test((value ?? '').trim());

export interface SendResult {
  sent: boolean;
  /**
   * 'not_configured' means the key is absent — a deployment mistake, not a bad
   * number. It is kept distinct because the two need opposite responses: a bad
   * number should stop the booking, a missing key must not.
   */
  reason?: 'not_configured' | 'failed';
  /** For the server log. Never returned to the browser. */
  detail?: string;
}

/** Whether we are able to verify numbers at all right now. */
export const smsConfigured = () => !!process.env.APITXT_AUTHKEY;

/**
 * Hand the code to apitxt.com.
 *
 * ── Why the response is barely inspected ────────────────────────────────────
 * The provider documents three query parameters and an example, and nothing
 * about the response body. Rather than guess at a success shape and get it
 * wrong in a way that reports failures as sends, this treats a 2xx as accepted
 * and anything else as not, and records the body for the log.
 *
 * That is honest about what we actually know. If the provider later documents a
 * status field, this is the one place that changes.
 */
export async function sendOtpSms(wireNumber: string, otp: string): Promise<SendResult> {
  const authkey = process.env.APITXT_AUTHKEY;
  if (!authkey) {
    return { sent: false, reason: 'not_configured', detail: 'APITXT_AUTHKEY is not set' };
  }

  const url = new URL('https://apitxt.com/api/sendOTP');
  url.searchParams.set('authkey', authkey);
  url.searchParams.set('mobile', wireNumber);
  url.searchParams.set('otp', otp);

  try {
    // A hung provider must not hold the request open: the person is staring at
    // a spinner, and they will hit the button again.
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    const body = (await res.text()).slice(0, 300);
    if (!res.ok) return { sent: false, reason: 'failed', detail: `HTTP ${res.status}: ${body}` };
    return { sent: true, detail: body };
  } catch (err) {
    return { sent: false, reason: 'failed', detail: err instanceof Error ? err.message : String(err) };
  }
}
