import { DEFAULT_SITE_PRICES, type SitePrices } from '@/lib/school/pricing';

/**
 * SARIRO — the website's live prices
 * ============================================================================
 * The four numbers the public price list is built from (see SitePrices in
 * lib/school/pricing.ts), stored as app_settings rows so HR or the super admin
 * can change them from the pricing calculator without a deploy.
 *
 * app_settings is readable by anyone, which is right for these — they are on
 * the website. The rupee floors and costs are NOT here; they live in the
 * private price book (lib/pricing/price-book.ts).
 *
 * Still dollars, still one price worldwide. Changing a number here changes
 * what the site shows AND what checkout charges, because create-order prices
 * from the same four numbers.
 */

export const SITE_PRICE_KEYS: Record<keyof SitePrices, string> = {
  groupMonthly: 'site_price_group_monthly',
  oneToOneMonthly: 'site_price_1on1_monthly',
  quarterlyDiscount: 'site_discount_quarterly',
  fullDiscount: 'site_discount_full',
};

/** Guard rails, so a slipped digit cannot put a $3,999 month on the site. */
export const SITE_PRICE_LIMITS: Record<keyof SitePrices, { min: number; max: number }> = {
  groupMonthly: { min: 1, max: 999 },
  oneToOneMonthly: { min: 1, max: 999 },
  quarterlyDiscount: { min: 0, max: 50 },
  fullDiscount: { min: 0, max: 60 },
};

const FIELDS = Object.keys(SITE_PRICE_KEYS) as (keyof SitePrices)[];

/** To cents for prices, to a tenth for discounts. */
function tidy(field: keyof SitePrices, n: number): number {
  return field.endsWith('Discount') ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100;
}

/**
 * Read the rows back. A missing, blank or out-of-range row falls back to the
 * default for that one number rather than breaking the whole price list.
 */
export function sitePricesFromRows(rows: { key: string; value: string | null }[] | null | undefined): SitePrices {
  const byKey = new Map((rows ?? []).map((r) => [r.key, r.value]));
  const out = { ...DEFAULT_SITE_PRICES };
  for (const f of FIELDS) {
    const raw = byKey.get(SITE_PRICE_KEYS[f]);
    const n = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
    const { min, max } = SITE_PRICE_LIMITS[f];
    if (Number.isFinite(n) && n >= min && n <= max) out[f] = tidy(f, n);
  }
  return out;
}

export type SitePriceCheck = { ok: true; prices: SitePrices } | { ok: false; error: string };

/** For a save: every number present, in range, and 1:1 never cheaper than a group seat. */
export function validateSitePrices(input: unknown): SitePriceCheck {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Send all four prices.' };
  const r = input as Record<string, unknown>;
  const out = {} as SitePrices;
  for (const f of FIELDS) {
    const v = r[f];
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    const { min, max } = SITE_PRICE_LIMITS[f];
    if (typeof n !== 'number' || !Number.isFinite(n)) return { ok: false, error: `${LABEL[f]} is missing.` };
    if (n < min || n > max) return { ok: false, error: `${LABEL[f]} must be between ${min} and ${max}.` };
    out[f] = tidy(f, n);
  }
  if (out.oneToOneMonthly < out.groupMonthly) {
    return { ok: false, error: 'One to one cannot cost less than a group seat.' };
  }
  if (out.fullDiscount < out.quarterlyDiscount) {
    return { ok: false, error: 'Paying for the year should save at least as much as paying by the quarter.' };
  }
  return { ok: true, prices: out };
}

export const LABEL: Record<keyof SitePrices, string> = {
  groupMonthly: '1:4 group, per month',
  oneToOneMonthly: '1:1, per month',
  quarterlyDiscount: '3-month plan discount',
  fullDiscount: 'Full-year plan discount',
};

export function sitePriceRows(prices: SitePrices): { key: string; value: string }[] {
  return FIELDS.map((f) => ({ key: SITE_PRICE_KEYS[f], value: String(prices[f]) }));
}

/** The cache tag every page reading these prices carries. */
export const SITE_PRICES_TAG = 'site-prices';
