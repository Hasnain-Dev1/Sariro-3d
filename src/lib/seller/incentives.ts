/**
 * SARIRO — what a seller is owed at the end of a month
 * ============================================================================
 * This is the only module in the seller pipeline where a bug takes money from
 * a real person, so it is written the way lib/school/pricing.ts is: every rule
 * in one place, every threshold configurable, and the awkward boundaries
 * pinned by tests rather than left to whoever reads the code next.
 *
 * ── The tiers do not stack, and that is the whole trap ──────────────────────
 * Thirty sales is an entitlement of ₹12,000. NOT ₹5,000 + ₹12,000.
 *
 * That reads as obvious and is the single easiest thing to get wrong here,
 * because the natural way to write tiers is a loop that adds each one it has
 * passed. Written that way, the best month a seller ever has pays them ₹5,000
 * too much and nobody queries it. So the tiers are a LOOKUP of the highest one
 * reached, never a sum.
 *
 * ── Above the top tier the shape changes ────────────────────────────────────
 * Past thirty, each further sale is a flat ₹500 — the entitlement stops being
 * a step and becomes a rate. So 33 sales is 12,000 + 3 × 500.
 *
 * ── The value bonuses replace each other ────────────────────────────────────
 * A sale over ₹20,000 carries ₹200. A sale of ₹50,000 or more carries ₹2,000
 * INSTEAD — the founder's words were "it cancels the 20k sale incentive". So a
 * ₹60,000 sale is worth ₹2,000, not ₹2,200. Same trap as the tiers, one level
 * down, and the same fix: pick one band, never add them up.
 *
 * ── ⚠ One boundary is asymmetric, deliberately ─────────────────────────────
 * The rule as given is "more then 20k" and "50k+". Those are different
 * comparisons, so a sale of exactly ₹20,000 earns nothing and a sale of
 * exactly ₹50,000 earns ₹2,000. That asymmetry is preserved rather than
 * quietly tidied — it is somebody's money, and normalising it in either
 * direction would be a silent decision about how much. Both thresholds are
 * app_settings rows; changing the intent is a settings change, not a deploy.
 * `BONUS_20K_IS_EXCLUSIVE` below is the switch, and a test pins both sides.
 */

/** What the arithmetic needs. Every number is an app_settings row. */
export interface IncentiveConfig {
  tier1Sales: number;
  tier1Amount: number;
  tier2Sales: number;
  tier2Amount: number;
  /** Per sale beyond tier 2. */
  abovePerSale: number;
  bonus20kThreshold: number;
  bonus20kAmount: number;
  bonus50kThreshold: number;
  bonus50kAmount: number;
}

export const DEFAULT_INCENTIVES: IncentiveConfig = {
  tier1Sales: 15,
  tier1Amount: 5000,
  tier2Sales: 30,
  tier2Amount: 12000,
  abovePerSale: 500,
  bonus20kThreshold: 20000,
  bonus20kAmount: 200,
  bonus50kThreshold: 50000,
  bonus50kAmount: 2000,
};

/** The app_settings keys, so the reader and the migration cannot disagree. */
export const INCENTIVE_SETTING_KEYS = {
  tier1Sales: 'seller_incentive_tier1_sales',
  tier1Amount: 'seller_incentive_tier1_amount',
  tier2Sales: 'seller_incentive_tier2_sales',
  tier2Amount: 'seller_incentive_tier2_amount',
  abovePerSale: 'seller_incentive_above_per_sale',
  bonus20kThreshold: 'seller_bonus_sale_20k_threshold',
  bonus20kAmount: 'seller_bonus_sale_20k_amount',
  bonus50kThreshold: 'seller_bonus_sale_50k_threshold',
  bonus50kAmount: 'seller_bonus_sale_50k_amount',
  baseSalaryDefault: 'seller_base_salary_default',
} as const;

/**
 * "more THAN 20k" — a sale of exactly the threshold does not qualify.
 * The 50k band uses ">=" because it was given as "50k+". See the header.
 */
const BONUS_20K_IS_EXCLUSIVE = true;

/** Turn app_settings rows into the config, falling back per key. */
export function readIncentiveConfig(
  rows: readonly { key: string; value: string | null }[] | null | undefined
): IncentiveConfig {
  const map = new Map((rows ?? []).map((r) => [r.key, r.value]));
  const num = (key: string, fallback: number): number => {
    const raw = map.get(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    /* A malformed row falls back rather than becoming NaN. NaN propagates
       silently through every sum here and surfaces as a blank payslip. */
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    tier1Sales: num(INCENTIVE_SETTING_KEYS.tier1Sales, DEFAULT_INCENTIVES.tier1Sales),
    tier1Amount: num(INCENTIVE_SETTING_KEYS.tier1Amount, DEFAULT_INCENTIVES.tier1Amount),
    tier2Sales: num(INCENTIVE_SETTING_KEYS.tier2Sales, DEFAULT_INCENTIVES.tier2Sales),
    tier2Amount: num(INCENTIVE_SETTING_KEYS.tier2Amount, DEFAULT_INCENTIVES.tier2Amount),
    abovePerSale: num(INCENTIVE_SETTING_KEYS.abovePerSale, DEFAULT_INCENTIVES.abovePerSale),
    bonus20kThreshold: num(INCENTIVE_SETTING_KEYS.bonus20kThreshold, DEFAULT_INCENTIVES.bonus20kThreshold),
    bonus20kAmount: num(INCENTIVE_SETTING_KEYS.bonus20kAmount, DEFAULT_INCENTIVES.bonus20kAmount),
    bonus50kThreshold: num(INCENTIVE_SETTING_KEYS.bonus50kThreshold, DEFAULT_INCENTIVES.bonus50kThreshold),
    bonus50kAmount: num(INCENTIVE_SETTING_KEYS.bonus50kAmount, DEFAULT_INCENTIVES.bonus50kAmount),
  };
}

/** The base pay for one seller: their own figure, or the company default. */
export function baseSalary(
  ownSalary: number | null | undefined,
  rows: readonly { key: string; value: string | null }[] | null | undefined
): number {
  if (typeof ownSalary === 'number' && Number.isFinite(ownSalary) && ownSalary >= 0) {
    return ownSalary;
  }
  const raw = (rows ?? []).find((r) => r.key === INCENTIVE_SETTING_KEYS.baseSalaryDefault)?.value;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 10000;
}

/** One punched sale, as the arithmetic sees it. */
export interface SaleForIncentive {
  id?: string;
  /** What the family actually paid, in INR. */
  amount: number;
}

export interface IncentiveBreakdown {
  salesCount: number;
  /** The tier reached, in sales. 0 when below the first. */
  tierSales: number;
  /** The flat entitlement for that tier. */
  tierAmount: number;
  /** Sales beyond the top tier. */
  extraSales: number;
  extraAmount: number;
  /** Per-sale value bonuses, already de-duplicated between the two bands. */
  bonus20kCount: number;
  bonus50kCount: number;
  bonusAmount: number;
  /** tierAmount + extraAmount + bonusAmount. */
  total: number;
  /** What still has to happen for the next step up. Null at the top. */
  nextTier: { salesNeeded: number; amount: number } | null;
}

/**
 * Everything a seller has earned in incentives this month.
 *
 * `sales` must be the PUNCHED sales for one seller in one month. A sale that
 * HR has not confirmed is not a sale — counting it would pay a commission on
 * a transaction that can still be withdrawn.
 */
export function computeIncentive(
  sales: readonly SaleForIncentive[],
  config: IncentiveConfig = DEFAULT_INCENTIVES
): IncentiveBreakdown {
  const salesCount = sales.length;

  /* ── The tier: a lookup of the highest reached, never a sum ─────────────── */
  let tierSales = 0;
  let tierAmount = 0;
  if (salesCount >= config.tier2Sales) {
    tierSales = config.tier2Sales;
    tierAmount = config.tier2Amount;
  } else if (salesCount >= config.tier1Sales) {
    tierSales = config.tier1Sales;
    tierAmount = config.tier1Amount;
  }

  /* ── Past the top tier, each sale is a rate rather than a step ──────────── */
  const extraSales = salesCount > config.tier2Sales ? salesCount - config.tier2Sales : 0;
  const extraAmount = extraSales * config.abovePerSale;

  /* ── Value bonuses: one band per sale, the larger one winning ───────────── */
  let bonus20kCount = 0;
  let bonus50kCount = 0;
  for (const s of sales) {
    const amount = Number(s?.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    if (amount >= config.bonus50kThreshold) {
      bonus50kCount += 1;
      continue; // cancels the 20k band — never both
    }
    const qualifies = BONUS_20K_IS_EXCLUSIVE
      ? amount > config.bonus20kThreshold
      : amount >= config.bonus20kThreshold;
    if (qualifies) bonus20kCount += 1;
  }
  const bonusAmount = bonus20kCount * config.bonus20kAmount + bonus50kCount * config.bonus50kAmount;

  const nextTier =
    salesCount < config.tier1Sales
      ? { salesNeeded: config.tier1Sales - salesCount, amount: config.tier1Amount }
      : salesCount < config.tier2Sales
        ? { salesNeeded: config.tier2Sales - salesCount, amount: config.tier2Amount }
        : null;

  return {
    salesCount,
    tierSales,
    tierAmount,
    extraSales,
    extraAmount,
    bonus20kCount,
    bonus50kCount,
    bonusAmount,
    total: round2(tierAmount + extraAmount + bonusAmount),
    nextTier,
  };
}

/**
 * Whether this month's entitlement is worth asking HR to approve.
 *
 * Zero is not. An approval queue that fills up with ₹0 rows for every seller
 * every month is one nobody reads, and the ₹12,000 row is then approved by
 * the same reflex as the empty ones.
 */
export function needsApproval(b: IncentiveBreakdown): boolean {
  return b.total > 0;
}

/** "15 sales → ₹5,000 · 30 → ₹12,000 · then ₹500 each" — shown above the queue. */
export function describeTiers(config: IncentiveConfig = DEFAULT_INCENTIVES): string {
  return `${config.tier1Sales} sales → ${inr(config.tier1Amount)} · ` +
    `${config.tier2Sales} → ${inr(config.tier2Amount)} · ` +
    `then ${inr(config.abovePerSale)} per sale. Tiers do not stack.`;
}

/** ₹12,000 — grouped the Indian way, because that is who reads it. */
export function inr(n: number): string {
  const rounded = Math.round((Number(n) || 0) * 100) / 100;
  return `₹${rounded.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}
