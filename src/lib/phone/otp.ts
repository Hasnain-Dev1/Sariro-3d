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
 * Every code goes on WhatsApp — the founder's decision (15 Sep 2026). One
 * channel that reaches a family in any country, rather than SMS that only
 * ever reached India. Fixed here, not configurable, so a stray environment
 * variable cannot quietly switch families back to a channel they never get.
 */
export const OTP_CHANNEL = 'whatsapp' as const;

/**
 * The query apitxt.com is sent.
 *
 * `wireNumber` is the full international number without the plus —
 * `919876543210`, `9779801234567` — and `dialCode` is its country's dialling
 * code, digits only: `91`, `977`.
 *
 * ── `country` (17 Sep 2026) ─────────────────────────────────────────────────
 * apitxt started refusing every WhatsApp code without it — HTTP 400, "Missing
 * parameter: country (required for WhatsApp OTP — used for per-country
 * billing)" — before a code was even created. Nothing on our side changed, so
 * every number in every country got "We could not send the code on WhatsApp".
 * It takes the dialling code: `country=91` was checked against the live API and
 * delivered; the ISO code `IN` is refused as missing.
 */
export function providerQuery(wireNumber: string, otp: string, dialCode: string, authkey: string): URLSearchParams {
  const q = new URLSearchParams();
  q.set('authkey', authkey);
  q.set('mobile', (wireNumber ?? '').replace(/\D/g, ''));
  q.set('otp', otp);
  q.set('channel', OTP_CHANNEL);
  q.set('country', (dialCode ?? '').replace(/\D/g, ''));
  return q;
}

/**
 * Whether apitxt actually accepted the code.
 *
 * It answers JSON with a `status`: "success" when the message went, "error"
 * otherwise — sometimes with HTTP 200 (`{"status":"error","message":"Missing
 * mobile"}`). A 2xx alone used to count as sent, which would tell a parent a
 * code was on its way when none was. A reply that is not JSON is judged by its
 * HTTP status, as before.
 */
export function providerAccepted(httpOk: boolean, body: string): boolean {
  if (!httpOk) return false;
  try {
    const json = JSON.parse(body) as { status?: unknown } | null;
    if (json && typeof json === 'object' && 'status' in json) return String(json.status).toLowerCase() === 'success';
  } catch { /* not JSON: the HTTP status is all we have */ }
  return true;
}

/** Hand the code to apitxt.com, to be delivered on WhatsApp. */
export async function sendOtpWhatsApp(wireNumber: string, otp: string, dialCode: string): Promise<SendResult> {
  const authkey = process.env.APITXT_AUTHKEY;
  if (!authkey) {
    return { sent: false, reason: 'not_configured', detail: 'APITXT_AUTHKEY is not set' };
  }
  if (!(dialCode ?? '').replace(/\D/g, '')) {
    return { sent: false, reason: 'failed', detail: 'no dialling code for this number' };
  }

  const url = new URL('https://apitxt.com/api/sendOTP');
  url.search = providerQuery(wireNumber, otp, dialCode, authkey).toString();

  try {
    // A hung provider must not hold the request open: the person is staring at
    // a spinner, and they will hit the button again.
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    const body = (await res.text()).slice(0, 300);
    if (!providerAccepted(res.ok, body)) return { sent: false, reason: 'failed', detail: `HTTP ${res.status}: ${body}` };
    return { sent: true, detail: body };
  } catch (err) {
    return { sent: false, reason: 'failed', detail: err instanceof Error ? err.message : String(err) };
  }
}
