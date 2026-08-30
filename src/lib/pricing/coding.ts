import type { LearningRatio } from '@/lib/sariro-data';

/**
 * SARIRO — coding track prices, in one place
 * =========================================================
 * Before this file, the price of a coding track existed in THREE places that
 * could each disagree:
 *
 *   1. `DEFAULT_PRICES` inside `api/razorpay/create-order` — what is CHARGED
 *   2. `course.price` in `sariro-data.ts`                  — what is DISPLAYED
 *   3. the static Razorpay payment links                   — what Razorpay
 *                                                            actually billed
 *
 * Three numbers for one product is not a style problem. A parent reads (2),
 * clicks, and pays (3), while the server believes (1). They only have to drift
 * once for someone to be charged an amount they never agreed to.
 *
 * This is now the single table. `create-order` imports it as its fallback, and
 * the checkout page imports it to display. The static links are no longer used
 * for coding — everything goes through `create-order`, which prices server-side
 * from this table, so the client cannot influence the charge.
 *
 * ── app_settings still wins ─────────────────────────────────────────────────
 * An admin can override any of these in `app_settings` (keys `price_beginner`,
 * `price_beginner_1on1`, …) and the server will honour that. This table is the
 * fallback and the display default. If an override is set, the displayed price
 * can lag it — which is why `create-order` re-prices on the server and the
 * currency guard refuses rather than guesses. Better a blocked checkout than a
 * wrong charge.
 */

export type CodingLevel = 'Elementary' | 'Beginner' | 'Intermediate' | 'Advanced';

/** [1:4 group price, 1:1 premium price] in USD. */
const PRICES: Record<CodingLevel, { '1:4': number; '1:1': number }> = {
  Elementary: { '1:4': 248, '1:1': 348 },
  Beginner: { '1:4': 199, '1:1': 299 },
  Intermediate: { '1:4': 299, '1:1': 399 },
  Advanced: { '1:4': 699, '1:1': 899 },
};

export function normalizeCodingLevel(level: string): CodingLevel | null {
  if (!level) return null;
  const titled = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  return titled in PRICES ? (titled as CodingLevel) : null;
}

/** The price we would charge for this level at this ratio, before any override. */
export function codingPrice(level: string, ratio: LearningRatio = '1:4'): number | null {
  const normalized = normalizeCodingLevel(level);
  if (!normalized) return null;
  return PRICES[normalized][ratio === '1:1' ? '1:1' : '1:4'];
}

/**
 * The `app_settings` key an admin would override to change this price.
 * Kept here so the key format lives beside the numbers it overrides.
 */
export function codingPriceKey(level: string, ratio: LearningRatio = '1:4'): string | null {
  const normalized = normalizeCodingLevel(level);
  if (!normalized) return null;
  const lvl = normalized.toLowerCase();
  return ratio === '1:1' ? `price_${lvl}_1on1` : `price_${lvl}`;
}
