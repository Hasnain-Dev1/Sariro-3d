import { codeReachable, splitE164 } from '@/lib/phone/countries';
import { normalizeIndianMobile } from '@/lib/phone/india';

/**
 * SARIRO — no dashboard without a proved phone
 * ============================================================================
 * The founder's rule (15 Sep 2026): anybody may browse the website, but using
 * a dashboard — like booking a trial — needs a phone number that has been
 * proved, once. The number is how we know an account is a real person.
 *
 *   verified number on the account      in, and nothing is asked or fetched
 *   an admin viewing as this user       in — the admin is not the one to prove it
 *   codes switched off on the server    in, with a number on file — a check
 *                                       that cannot be done must not be a wall
 *   anything else, in any country       prove it here, once, with a WhatsApp code
 *
 * The status (impersonation, whether codes can be sent) is fetched only for an
 * account that is not already verified, so a verified account never waits.
 */

export type PhoneGate = 'allow' | 'wait' | 'verify';

export interface PhoneGateStatus {
  impersonating: boolean;
  smsAvailable: boolean;
}

export interface PhoneGateInput {
  profileLoaded: boolean;
  phone: string | null | undefined;
  phoneVerified: boolean | null | undefined;
  countryCode: string | null | undefined;
  /** Null until asked — and it is only asked when the answer matters. */
  status: PhoneGateStatus | null;
}

/**
 * The country a stored number belongs to: the one picked, else its dial code,
 * else — for the older rows stored as bare ten digits — India if it is shaped
 * like an Indian mobile. Null when nothing says.
 */
export function phoneCountry(phone: string | null | undefined, countryCode: string | null | undefined): string | null {
  const picked = (countryCode ?? '').trim().toUpperCase();
  if (picked) return picked;
  const dialled = splitE164(phone).country?.code;
  if (dialled) return dialled;
  return normalizeIndianMobile(phone ?? '').ok ? 'IN' : null;
}

/** Whether the gate needs the server's status to decide at all. */
export const gateNeedsStatus = (i: Omit<PhoneGateInput, 'status'>) =>
  i.profileLoaded && !(i.phoneVerified === true && !!i.phone?.trim());

export function phoneGate(i: PhoneGateInput): PhoneGate {
  if (!i.profileLoaded) return 'wait';
  const hasPhone = !!i.phone?.trim();
  if (hasPhone && i.phoneVerified === true) return 'allow';
  if (!i.status) return 'wait';
  if (i.status.impersonating) return 'allow';
  if (!hasPhone) return 'verify';
  const country = phoneCountry(i.phone, i.countryCode);
  // A number nothing places in a country is asked for again, properly.
  if (!country) return 'verify';
  if (!codeReachable(country)) return 'allow';
  if (!i.status.smsAvailable) return 'allow';
  return 'verify';
}
