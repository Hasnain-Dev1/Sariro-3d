import { DISPLAY_CURRENCY } from '@/lib/pricing/currency';

/**
 * SARIRO — Regional pricing
 * =========================================================
 * A family in Lahore, a family in Lucknow and a family in London cannot be shown
 * the same number. $35/month is a bargain in one of those places, a month's
 * groceries in another. Showing one global price silently prices out the two
 * markets we are actually selling into.
 *
 * ── This is regional PRICING, not currency conversion ──────────────────────
 * The prices below are **not** the USD price converted. They are separate,
 * pinned numbers per market, chosen for what a family there can actually pay.
 * INR 3,000 ≈ $35, but PKR 3,000 ≈ $11 — the same digits are three different
 * businesses, and pretending otherwise is how you either lose Pakistan or give
 * away India.
 *
 * Pinned, never converted at runtime, for the same reasons the USD price is
 * pinned: a price that drifts with the exchange rate looks unstable, and a raw
 * conversion is never a clean number.
 *
 * ── The honest bit about charging ──────────────────────────────────────────
 * The gateway settles in ONE currency (see `DISPLAY_CURRENCY`). So a family in
 * India sees INR 3,000 and is charged the USD equivalent, which their bank
 * converts back. That is normal and fine — but it MUST be said on the page.
 * A parent who is quoted rupees and sees dollars leave their account files a
 * chargeback, and they are right to.
 *
 * `billingNote()` produces that line. Do not render a regional price without it.
 */

export interface Region {
  /** ISO 3166-1 alpha-2, or 'INTL' for everywhere else. */
  code: string;
  name: string;
  /** ISO 4217, for display only — charging happens in DISPLAY_CURRENCY. */
  currency: string;
  symbol: string;
  locale: string;
  listPerClass: number;
  perClass: number;
  listPerMonth: number;
  perMonth: number;
  /**
   * False until the founder has set a real number for this market.
   * Unconfirmed regions are never shown — `activeRegions()` excludes them, so a
   * placeholder cannot leak onto a pricing page and become a promise.
   */
  confirmed: boolean;
}

export const REGIONS: Region[] = [
  {
    code: 'INTL',
    name: 'International',
    currency: 'USD',
    symbol: '$',
    locale: 'en-US',
    listPerClass: 12,
    perClass: 9,
    listPerMonth: 59,
    perMonth: 35,
    confirmed: true,
  },
  {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    listPerClass: 999,
    perClass: 750,
    listPerMonth: 5000,
    perMonth: 3000,
    confirmed: true,
  },
  {
    // PLACEHOLDER — not shown to anyone until `confirmed` is true.
    // PKR 3,000 would be roughly $11, a third of the India price in real terms.
    // Whether that is right is a business call about what a family in Pakistan
    // can pay, not a conversion, so it stays dark until the number is set.
    code: 'PK',
    name: 'Pakistan',
    currency: 'PKR',
    symbol: 'Rs',
    locale: 'en-PK',
    listPerClass: 0,
    perClass: 0,
    listPerMonth: 0,
    perMonth: 0,
    confirmed: false,
  },
];

export const DEFAULT_REGION = REGIONS[0];

/** Only regions with real, confirmed prices. Everything else falls back. */
export function activeRegions(): Region[] {
  return REGIONS.filter((r) => r.confirmed && r.perMonth > 0);
}

/**
 * Which region a visitor should be *shown*.
 *
 * Display only. What a customer is CHARGED must follow their payment method's
 * country, never this — otherwise a US parent behind a VPN buys at Pakistani
 * prices, and geolocation is wrong often enough (VPNs, roaming, carrier routing)
 * that it cannot be trusted with money.
 */
export function regionForCountry(countryCode: string | null | undefined): Region {
  if (!countryCode) return DEFAULT_REGION;
  const code = countryCode.trim().toUpperCase();
  return activeRegions().find((r) => r.code === code) ?? DEFAULT_REGION;
}

export function formatRegional(amount: number, region: Region): string {
  return `${region.symbol}${Math.round(amount).toLocaleString(region.locale)}`;
}

/**
 * The disclosure that must appear beside any non-USD price.
 * Returns null for the region we actually charge in — no note needed there.
 */
export function billingNote(region: Region): string | null {
  if (region.currency === DISPLAY_CURRENCY) return null;
  return `Billed in ${DISPLAY_CURRENCY}. Your bank converts at their rate.`;
}

export interface RegionalPlan {
  key: 'monthly' | 'grade' | 'group';
  label: string;
  amount: number;
  listAmount: number;
  discountPercent: number;
  classes: number;
  formatted: string;
  formattedList: string;
}

function pct(list: number, actual: number): number {
  if (list <= 0 || actual >= list) return 0;
  return Math.round(((list - actual) / list) * 100);
}

/**
 * The three plans priced for one region, at one ratio.
 * `ratioMultiplier` is 2 for 1:1 — a mentor's whole hour goes to one learner.
 */
export function regionalPlans(region: Region, ratioMultiplier = 1): RegionalPlan[] {
  const perClass = region.perClass * ratioMultiplier;
  const listPerClass = region.listPerClass * ratioMultiplier;
  const perMonth = region.perMonth * ratioMultiplier;
  const listPerMonth = region.listPerMonth * ratioMultiplier;

  const build = (
    key: RegionalPlan['key'],
    label: string,
    classes: number,
    amount: number,
    listAmount: number
  ): RegionalPlan => ({
    key,
    label,
    amount,
    listAmount,
    discountPercent: pct(listAmount, amount),
    classes,
    formatted: formatRegional(amount, region),
    formattedList: formatRegional(listAmount, region),
  });

  return [
    build('monthly', 'Pay as you go', 4, perMonth, listPerMonth),
    build('grade', 'Full grade', 48, perClass * 48, listPerClass * 48),
    build('group', 'Full grade group', 144, perClass * 144, listPerClass * 144),
  ];
}

/** The headline. Always the smallest true number for that market. */
export function startingAtFor(region: Region, ratioMultiplier = 1): string {
  return `Starts at just ${formatRegional(region.perMonth * ratioMultiplier, region)} a month`;
}
