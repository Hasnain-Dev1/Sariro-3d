import {
  LESSONS_PER_GRADE,
  LESSONS_PER_GROUP,
  LESSONS_PER_MONTH,
  type EnrolmentOption,
} from '@/lib/school/curriculum';

/**
 * SARIRO — School pricing
 * =========================================================
 * These are DEFAULTS, not contracts. Final numbers are agreed by the team with
 * the family — the code exists so a seller has a consistent starting point and
 * a parent sees the same figure on the site that they hear on a call.
 *
 * ── How this is pitched ────────────────────────────────────────────────────
 * Never lead with the total. A parent shown "Rs 108,000" leaves before reading
 * what it buys. Lead with the smallest true number — "starts at Rs 3,000 a
 * month" — and let the totals be something they find once they already want it.
 *
 * That is not a trick: the monthly figure is what they will actually pay, month
 * to month. Pay-as-you-go is the default, and bulk is an option, not a wall.
 *
 * ── Note for whoever changes these ─────────────────────────────────────────
 * Prices live in code today because there are six subjects and four groups. Once
 * pricing varies per grade, per region or per campaign, move them to
 * `app_settings` (the table already exists) so the team can change a number
 * without a deploy.
 */

/**
 * ── Currency ───────────────────────────────────────────────────────────────
 * The team quotes in INR on calls; the site shows USD, matching the existing
 * courses ($199 / $299 / $699).
 *
 * These USD figures are PINNED, not converted at runtime. Two reasons:
 *
 *  1. A price that drifts with the exchange rate looks unstable, and a family
 *     who saw $35 last week and $37 today trusts us slightly less.
 *  2. A raw conversion is not a price. INR 3,000 at ~83/USD is $36.14 — nobody
 *     sells at $36.14.
 *
 * Pinned so that BOTH of the agreed discounts survive the conversion exactly:
 *   per class   $12 → $9    = 25% off   (INR 999 → 750)
 *   per month   $59 → $35   = 41% off   (INR 5,000 → 3,000)
 *
 * INR reference, for the team's own quoting — never rendered:
 *   per class   INR 999 list, INR 750 net
 *   per month   INR 5,000 list, INR 3,000 net
 * Revisit if the rate moves far enough that these stop being defensible.
 */
export const CURRENCY = '$';

/** INR figures the USD prices were pinned against. Reference only. */
export const INR_REFERENCE = {
  listPerClass: 999,
  perClass: 750,
  listPerMonth: 5000,
  perMonth: 3000,
} as const;

/** Anchor price per class, before the standing discount. */
export const LIST_PER_CLASS = 12;
/** What a family actually pays per class, 1:4 batch. */
export const PRICE_PER_CLASS = 9;

/** Anchor and effective monthly price (4 classes/month, pay-as-you-go). */
export const LIST_PER_MONTH = 59;
export const PRICE_PER_MONTH = 35;

/**
 * 1:1 is double the batch rate. A mentor's whole hour goes to one learner
 * instead of four, so the multiplier is the honest cost, not a premium tax.
 */
export const ONE_TO_ONE_MULTIPLIER = 2;

export type Ratio = '1:4' | '1:1';

export interface PriceBreakdown {
  /** What we charge. */
  amount: number;
  /** Struck-through anchor shown beside it. */
  listAmount: number;
  /** Whole-number percent off, for the badge. */
  discountPercent: number;
  perClass: number;
  listPerClass: number;
  classes: number;
  /** Monthly instalment if they pay as they go. */
  perMonth: number;
  listPerMonth: number;
  months: number;
}

function pct(list: number, actual: number): number {
  if (list <= 0 || actual >= list) return 0;
  return Math.round(((list - actual) / list) * 100);
}

/**
 * Price a number of classes at a given ratio.
 *
 * Bulk currently carries the SAME per-class rate as monthly — see the pricing
 * note in `scripts/audit-school-curriculum.ts`. If a real bulk discount is
 * wanted, change it here and every surface follows.
 */
export function priceForClasses(classes: number, ratio: Ratio = '1:4'): PriceBreakdown {
  const mult = ratio === '1:1' ? ONE_TO_ONE_MULTIPLIER : 1;

  const perClass = PRICE_PER_CLASS * mult;
  const listPerClass = LIST_PER_CLASS * mult;
  const perMonth = PRICE_PER_MONTH * mult;
  const listPerMonth = LIST_PER_MONTH * mult;

  return {
    amount: perClass * classes,
    listAmount: listPerClass * classes,
    discountPercent: pct(listPerClass, perClass),
    perClass,
    listPerClass,
    classes,
    perMonth,
    listPerMonth,
    months: classes / LESSONS_PER_MONTH,
  };
}

/**
 * The monthly plan uses its OWN anchor (LIST_PER_MONTH), not four times the
 * per-class anchor. That is a deliberate business choice, and it means the two
 * anchors imply different discounts — the audit prints a note about it, because
 * a parent with a calculator will notice before we do.
 */
export function priceForMonth(ratio: Ratio = '1:4'): PriceBreakdown {
  const mult = ratio === '1:1' ? ONE_TO_ONE_MULTIPLIER : 1;
  const amount = PRICE_PER_MONTH * mult;
  const listAmount = LIST_PER_MONTH * mult;

  return {
    amount,
    listAmount,
    discountPercent: pct(listAmount, amount),
    perClass: amount / LESSONS_PER_MONTH,
    listPerClass: LIST_PER_CLASS * mult,
    classes: LESSONS_PER_MONTH,
    perMonth: amount,
    listPerMonth: listAmount,
    months: 1,
  };
}

export function priceForOption(option: EnrolmentOption, ratio: Ratio = '1:4'): PriceBreakdown {
  return priceForClasses(option.lessonCount, ratio);
}

export function priceForGrade(ratio: Ratio = '1:4'): PriceBreakdown {
  return priceForClasses(LESSONS_PER_GRADE, ratio);
}

export function priceForGroup(ratio: Ratio = '1:4'): PriceBreakdown {
  return priceForClasses(LESSONS_PER_GROUP, ratio);
}

/**
 * The line that goes on a card, an ad, or out of a seller's mouth.
 * Always the monthly figure — the smallest true number we have.
 */
export function startingAtLine(ratio: Ratio = '1:4'): string {
  const { perMonth } = priceForClasses(LESSONS_PER_MONTH, ratio);
  return `Starts at just ${formatPrice(perMonth)} a month`;
}

/** `$432` — no decimals; whole-dollar prices read as prices, not as invoices. */
export function formatPrice(amount: number): string {
  return `${CURRENCY}${Math.round(amount).toLocaleString('en-US')}`;
}

export interface PaymentPlan {
  key: 'monthly' | 'grade' | 'group';
  label: string;
  blurb: string;
  price: PriceBreakdown;
  /** Pay-as-you-go is the default: the smallest commitment gets the first yes. */
  recommended: boolean;
}

/**
 * The three ways a family can pay, smallest commitment first.
 *
 * Order matters more than copy here. Leading with the cheapest option is what
 * makes the expensive one thinkable — a parent who sees Rs 108,000 first never
 * reaches the Rs 3,000 line underneath it.
 */
export function paymentPlans(ratio: Ratio = '1:4'): PaymentPlan[] {
  const monthly = priceForMonth(ratio);
  const grade = priceForGrade(ratio);
  const group = priceForGroup(ratio);

  return [
    {
      key: 'monthly',
      label: 'Pay as you go',
      blurb: `${LESSONS_PER_MONTH} classes a month. Stop any time, no notice period.`,
      price: monthly,
      recommended: true,
    },
    {
      key: 'grade',
      label: 'Full grade',
      blurb: `All ${LESSONS_PER_GRADE} classes for the year, paid together.`,
      price: grade,
      recommended: false,
    },
    {
      key: 'group',
      label: 'Full grade group',
      blurb: `All ${LESSONS_PER_GROUP} classes across three grades.`,
      price: group,
      recommended: false,
    },
  ];
}
