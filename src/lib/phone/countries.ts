/**
 * SARIRO — the country a number belongs to, kept separately from the number
 * ============================================================================
 * We had been reading a country OFF a phone number, and it does not work.
 *
 * The Rakhecha family are in India and carry a Nepali number. Four accounts,
 * `+977 9709123454`, and for a while one of them said `+91` because somebody
 * (me) reasoned "they're in India, so the number starts +91". Those same ten
 * digits under +91 belong to a stranger in India, and that is where the class
 * reminders would have gone.
 *
 * So: the dialling code says which network to ring. It does not say where the
 * person lives, where they are billed, or which timezone their class is in.
 * Those are separate facts and they are now stored separately.
 *
 * ── What this file is ───────────────────────────────────────────────────────
 * The list, and the pure functions over it. No component, no fetch — so the
 * rules can be tested without a browser and reused by the booking form, the
 * profile modal and the admin tables without drifting apart.
 *
 * ── Why the list is short and ordered the way it is ────────────────────────
 * India first because most customers are there. Then the countries we have
 * actually taken money from or sent a class to — Nepal and Pakistan are on
 * this list because they are on the live database today, not because somebody
 * guessed at a market. Then the diaspora. A picker of 250 countries is a
 * picker nobody scrolls; every entry here is one we can point at a row for or
 * genuinely expect.
 *
 * `dial` never carries the leading +. It is added at the point of display, so
 * a value can never end up with two of them.
 */

export interface Country {
  /** ISO 3166-1 alpha-2. The stable key — store THIS, never the dial code. */
  code: string;
  name: string;
  /** Digits only, no plus. */
  dial: string;
  flag: string;
  /** Length of the national number, for the shapes we can check. */
  nationalDigits?: number[];
}

export const COUNTRY_LIST: Country[] = [
  { code: 'IN', name: 'India', dial: '91', flag: '🇮🇳', nationalDigits: [10] },

  // On the live database today.
  { code: 'NP', name: 'Nepal', dial: '977', flag: '🇳🇵', nationalDigits: [10] },
  { code: 'PK', name: 'Pakistan', dial: '92', flag: '🇵🇰', nationalDigits: [10] },
  { code: 'CD', name: 'DR Congo', dial: '243', flag: '🇨🇩', nationalDigits: [9] },

  // The diaspora.
  { code: 'US', name: 'United States', dial: '1', flag: '🇺🇸', nationalDigits: [10] },
  { code: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦', nationalDigits: [10] },
  { code: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧', nationalDigits: [10] },
  { code: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪', nationalDigits: [9] },
  { code: 'SA', name: 'Saudi Arabia', dial: '966', flag: '🇸🇦', nationalDigits: [9] },
  { code: 'QA', name: 'Qatar', dial: '974', flag: '🇶🇦', nationalDigits: [8] },
  { code: 'KW', name: 'Kuwait', dial: '965', flag: '🇰🇼', nationalDigits: [8] },
  { code: 'OM', name: 'Oman', dial: '968', flag: '🇴🇲', nationalDigits: [8] },
  { code: 'BH', name: 'Bahrain', dial: '973', flag: '🇧🇭', nationalDigits: [8] },
  { code: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬', nationalDigits: [8] },
  { code: 'MY', name: 'Malaysia', dial: '60', flag: '🇲🇾', nationalDigits: [9, 10] },
  { code: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺', nationalDigits: [9] },
  { code: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿', nationalDigits: [8, 9, 10] },
  { code: 'BD', name: 'Bangladesh', dial: '880', flag: '🇧🇩', nationalDigits: [10] },
  { code: 'LK', name: 'Sri Lanka', dial: '94', flag: '🇱🇰', nationalDigits: [9] },
  { code: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '33', flag: '🇫🇷', nationalDigits: [9] },
  { code: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦', nationalDigits: [9] },
  { code: 'NG', name: 'Nigeria', dial: '234', flag: '🇳🇬', nationalDigits: [10] },
  { code: 'KE', name: 'Kenya', dial: '254', flag: '🇰🇪', nationalDigits: [9] },
];

export const DEFAULT_COUNTRY = 'IN';

const BY_CODE = new Map(COUNTRY_LIST.map((c) => [c.code, c]));

export const countryByCode = (code: string | null | undefined): Country | null =>
  BY_CODE.get((code ?? '').trim().toUpperCase()) ?? null;

/**
 * Which country a dial code belongs to.
 *
 * +1 is both the US and Canada, so this cannot be one-to-one. It returns every
 * match, longest dial code first, and the caller decides — which is the honest
 * shape, because guessing between the US and Canada from a number is not
 * something anybody can do.
 */
export function countriesForDial(dial: string): Country[] {
  const d = (dial ?? '').replace(/\D/g, '');
  if (!d) return [];
  return COUNTRY_LIST.filter((c) => c.dial === d);
}

const digitsOf = (raw: string) => (raw ?? '').replace(/\D/g, '');

export interface SplitNumber {
  country: Country | null;
  /** Digits after the dial code. */
  national: string;
  /** `+919876543210`, or null when the input cannot be split. */
  e164: string | null;
}

/**
 * Pull a stored `+CC…` number apart into a country and a national number, so a
 * picker can be shown with the right country already selected.
 *
 * Longest dial code wins: `+1` and `+91` both start with a 1 at some reading,
 * and `+977` must not be read as `+9` plus a stray 77. Sorting by length and
 * taking the first match is the whole of the rule, and it is why the list
 * stores dial codes as digits rather than as display strings.
 */
export function splitE164(raw: string | null | undefined): SplitNumber {
  const input = (raw ?? '').trim();
  if (!input.startsWith('+')) return { country: null, national: digitsOf(input), e164: null };

  const digits = digitsOf(input);
  const byLength = [...COUNTRY_LIST].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of byLength) {
    if (digits.startsWith(c.dial) && digits.length > c.dial.length) {
      return { country: c, national: digits.slice(c.dial.length), e164: `+${digits}` };
    }
  }
  return { country: null, national: digits, e164: `+${digits}` };
}

/** Build the stored value from a picked country and a typed national number. */
export function toE164(countryCode: string, national: string): string | null {
  const c = countryByCode(countryCode);
  const n = digitsOf(national);
  if (!c || !n) return null;
  return `+${c.dial}${n}`;
}

export interface NationalCheck {
  ok: boolean;
  /** Shown under the field. Empty when it is fine. */
  problem: string;
}

/**
 * Is this a plausible national number for the chosen country?
 *
 * Deliberately shallow. A full numbering plan per country is a library and a
 * maintenance burden, and getting it slightly wrong rejects real customers —
 * which is a worse failure than accepting a number that turns out to be dead.
 * India is checked properly because that is where the SMS goes and where a
 * landline silently swallows a class reminder; everywhere else is a length
 * check and a leading-zero strip.
 */
export function checkNational(countryCode: string, national: string): NationalCheck {
  const c = countryByCode(countryCode);
  if (!c) return { ok: false, problem: 'Choose a country.' };

  const n = digitsOf(national);
  if (!n) return { ok: false, problem: 'Enter your phone number.' };

  if (c.code === 'IN') {
    if (n.length !== 10) {
      return {
        ok: false,
        problem: n.length < 10
          ? `That is ${10 - n.length} digit${10 - n.length === 1 ? '' : 's'} short for an Indian mobile.`
          : 'An Indian mobile is 10 digits.',
      };
    }
    if (!/^[6-9]/.test(n)) {
      // 2-5 are landline trunk codes. A landline accepts an SMS and delivers
      // nothing, which is the failure this check exists to stop.
      return { ok: false, problem: 'Indian mobile numbers start with 6, 7, 8 or 9.' };
    }
    return { ok: true, problem: '' };
  }

  if (c.nationalDigits && !c.nationalDigits.includes(n.length)) {
    const expected = c.nationalDigits.join(' or ');
    return { ok: false, problem: `A ${c.name} number is ${expected} digits — you have ${n.length}.` };
  }

  if (n.length < 6 || n.length > 14) {
    return { ok: false, problem: 'That does not look like a phone number.' };
  }

  return { ok: true, problem: '' };
}

/**
 * The trunk prefix people type out of habit — 0 in India, the UK and much of
 * the world — is not part of the international number and must come off before
 * the dial code goes on, or `+91 09876543210` is stored and rings nothing.
 */
export const stripTrunkPrefix = (national: string) => digitsOf(national).replace(/^0+/, '');

/** `+91 98765 43210` — for reading aloud and putting in a table. */
export function formatE164(raw: string | null | undefined): string {
  const s = splitE164(raw);
  if (!s.country || !s.national) return (raw ?? '').trim();
  const n = s.national;
  const grouped = n.length === 10 ? `${n.slice(0, 5)} ${n.slice(5)}` : n;
  return `+${s.country.dial} ${grouped}`;
}

/**
 * Can we send this country an SMS?
 *
 * apitxt.com delivers to India. Everywhere else the code is generated, the
 * request is accepted and nothing ever arrives — so the product must know the
 * difference rather than showing a foreign customer a code box that can never
 * be satisfied. Seven of the sixteen numbers on the live database are outside
 * India today, including a family with an active enrolment.
 */
export const smsReachable = (countryCode: string | null | undefined) =>
  (countryCode ?? '').trim().toUpperCase() === 'IN';

/**
 * A guess at the visitor's country, for the picker's initial value only.
 *
 * A default is a convenience, never a record: whatever this returns is
 * overwritten the moment the person touches the picker, and nothing is stored
 * until they submit. Deriving a STORED country from a timezone is how the bug
 * at the top of this file happened in the first place.
 */
export function guessCountry(timeZone: string | null | undefined): string {
  const tz = (timeZone ?? '').trim();
  const map: Record<string, string> = {
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
    'Asia/Kathmandu': 'NP', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK',
    'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW',
    'Asia/Muscat': 'OM', 'Asia/Bahrain': 'BH', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY',
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Pacific/Auckland': 'NZ',
    'Europe/London': 'GB', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR',
    'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
    'Africa/Kinshasa': 'CD',
  };
  if (map[tz]) return map[tz];
  if (tz.startsWith('America/')) return 'US';
  return DEFAULT_COUNTRY;
}
