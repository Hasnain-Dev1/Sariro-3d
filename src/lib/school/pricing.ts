/**
 * SARIRO — Pricing
 * =========================================================
 * One price worldwide. Regional pricing was built and then reversed, and the
 * reversal is right: a single price is simpler to quote on a call, simpler to
 * support, impossible to arbitrage with a VPN, and it removes an entire class of
 * currency bug — the kind that once had a $199 course charging INR 199.
 *
 * ── The two numbers everything derives from ────────────────────────────────
 *   $6.99 per class   1:4 group
 *   $9.99 per class   1:1
 *
 * ── How totals are formed ──────────────────────────────────────────────────
 * Bundle totals are the per-class rate x the class count, then rounded **DOWN**
 * to the nearest figure ending in 9.
 *
 *    30 x $9.99 = $299.70  ->  $299
 *    48 x $6.99 = $335.52  ->  $329
 *   144 x $6.99 = $1006.56 ->  $999
 *
 * Always down, never up. A customer cannot object to a number smaller than the
 * arithmetic, and the giveaway is under 1% — the $999 case, the largest, gives
 * up $7.56. Worth paying for a number that reads like a price and not a receipt.
 *
 * ── Pitch the month, not the total ─────────────────────────────────────────
 * A parent shown $999 leaves. A parent shown "$27.99 a month" listens. Both are
 * true; only one gets read. `startingAtLine()` is what belongs on a card, and
 * the total belongs further down, next to what paying it saves.
 */

export const CURRENCY = '$';

/** The two rates everything else derives from. */
export const PRICE_PER_CLASS_GROUP = 6.99;
export const PRICE_PER_CLASS_ONE_TO_ONE = 9.99;

/** 4 classes a month, one a week. */
export const CLASSES_PER_MONTH = 4;

/**
 * Monthly is quoted at a clean .99 rather than the exact multiple:
 * 4 x $6.99 = $27.96 -> $27.99, and 4 x $9.99 = $39.96 -> $39.99.
 * Three cents, and the only upward rounding in this file — a price ending in
 * .96 looks like a mistake, which costs more than three cents.
 */
export const PRICE_PER_MONTH_GROUP = 27.99;
export const PRICE_PER_MONTH_ONE_TO_ONE = 39.99;

export type Ratio = '1:4' | '1:1';

export function perClassFor(ratio: Ratio): number {
  return ratio === '1:1' ? PRICE_PER_CLASS_ONE_TO_ONE : PRICE_PER_CLASS_GROUP;
}

export function perMonthFor(ratio: Ratio): number {
  return ratio === '1:1' ? PRICE_PER_MONTH_ONE_TO_ONE : PRICE_PER_MONTH_GROUP;
}

/**
 * Largest whole number <= n whose last digit is 9.
 * 299.70 -> 299 · 335.52 -> 329 · 1006.56 -> 999
 */
export function roundDownTo9(n: number): number {
  const floored = Math.floor(n);
  if (floored < 9) return 0;
  return floored - (((floored % 10) + 1) % 10);
}

export interface Bundle {
  classes: number;
  ratio: Ratio;
  /** per-class x classes, before rounding. The honest arithmetic. */
  rawTotal: number;
  /** What we advertise — rounded down to end in 9. */
  total: number;
  /** rawTotal - total. What the rounding gives away. */
  roundingDiscount: number;
  perClass: number;
  /** What the same classes cost paying month by month. */
  monthlyEquivalent: number;
  /** Saving from paying upfront instead. The reason bulk is worth selling. */
  upfrontSaving: number;
  months: number;
}

/**
 * Price a bundle of classes.
 *
 * `upfrontSaving` is the number that makes bulk real. Without it, "pay in full
 * and save" is a claim that dies to a calculator — and a parent weighing a $999
 * cheque against $27.99 a month will absolutely do that arithmetic.
 */
export function priceBundle(classes: number, ratio: Ratio = '1:4'): Bundle {
  const perClass = perClassFor(ratio);
  const rawTotal = perClass * classes;
  const total = roundDownTo9(rawTotal);
  const months = classes / CLASSES_PER_MONTH;
  const monthlyEquivalent = Math.round(perMonthFor(ratio) * months * 100) / 100;

  return {
    classes,
    ratio,
    rawTotal: Math.round(rawTotal * 100) / 100,
    total,
    roundingDiscount: Math.round((rawTotal - total) * 100) / 100,
    perClass,
    monthlyEquivalent,
    upfrontSaving: Math.round((monthlyEquivalent - total) * 100) / 100,
    months,
  };
}

/** `$999` whole, `$27.99` when there are cents. Never `$27.00`. */
export function formatPrice(amount: number): string {
  const whole = Number.isInteger(amount);
  return `${CURRENCY}${amount.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** The line for a card, an ad, or a seller's opening sentence. */
export function startingAtLine(ratio: Ratio = '1:4'): string {
  return `Starts at just ${formatPrice(perMonthFor(ratio))} a month`;
}

export type Cadence = 'monthly' | 'quarterly' | 'full';

/**
 * What each commitment level earns.
 *
 * Monthly is the reference price — no discount, maximum flexibility, stop any
 * time. Every step up trades flexibility for a lower total, which is the only
 * honest reason a discount should exist.
 *
 * 15% for paying in full is deliberately large. The earlier 2% (rounding alone)
 * was not a reason to write a cheque, and a discount nobody takes is just a line
 * of copy. At 15% the saving is a real sentence: "save $56".
 */
export const CADENCE_DISCOUNT: Record<Cadence, number> = {
  monthly: 0,
  quarterly: 0.05,
  full: 0.15,
};

export const MONTHS_PER_QUARTER = 3;

export interface CadencePlan {
  cadence: Cadence;
  label: string;
  blurb: string;
  /** What they hand over each time. */
  perPayment: number;
  perPaymentFormatted: string;
  /** How many times they pay. */
  payments: number;
  /** Everything they will have paid by the end. */
  lifetimeTotal: number;
  lifetimeFormatted: string;
  /** Versus paying monthly. Zero for the monthly plan itself. */
  saving: number;
  savingLabel: string | null;
  discountPercent: number;
}

/**
 * The three ways to pay for a course, in commitment order.
 *
 * Savings are quoted against the MONTHLY total, not against an invented list
 * price. That comparison is one a parent can verify with a calculator, which is
 * the only kind worth printing.
 */
export function cadencePlans(classes: number, ratio: Ratio = '1:4'): CadencePlan[] {
  const months = classes / CLASSES_PER_MONTH;
  const monthly = perMonthFor(ratio);
  const monthlyLifetime = Math.round(monthly * months * 100) / 100;

  // Quarterly: 5% off the whole course, collected three months at a time.
  const quarters = Math.ceil(months / MONTHS_PER_QUARTER);
  const quarterlyLifetimeRaw = monthlyLifetime * (1 - CADENCE_DISCOUNT.quarterly);
  const perQuarter = roundDownTo9(quarterlyLifetimeRaw / quarters);
  const quarterlyLifetime = perQuarter * quarters;

  // Full: 15% off, one payment, rounded down to land on a 9.
  const fullTotal = roundDownTo9(monthlyLifetime * (1 - CADENCE_DISCOUNT.full));

  const saving = (total: number) => Math.round((monthlyLifetime - total) * 100) / 100;

  return [
    {
      cadence: 'monthly',
      label: 'Monthly',
      blurb: `${CLASSES_PER_MONTH} classes a month. Stop any time.`,
      perPayment: monthly,
      perPaymentFormatted: `${formatPrice(monthly)}/mo`,
      payments: months,
      lifetimeTotal: monthlyLifetime,
      lifetimeFormatted: formatPrice(monthlyLifetime),
      saving: 0,
      savingLabel: null,
      discountPercent: 0,
    },
    {
      cadence: 'quarterly',
      label: 'Every 3 months',
      blurb: 'Pay a term at a time.',
      perPayment: perQuarter,
      perPaymentFormatted: `${formatPrice(perQuarter)} / 3 months`,
      payments: quarters,
      lifetimeTotal: quarterlyLifetime,
      lifetimeFormatted: formatPrice(quarterlyLifetime),
      saving: saving(quarterlyLifetime),
      savingLabel: `Save ${formatPrice(saving(quarterlyLifetime))}`,
      discountPercent: 5,
    },
    {
      cadence: 'full',
      label: 'Pay in full',
      blurb: `All ${classes} classes, one payment.`,
      perPayment: fullTotal,
      perPaymentFormatted: formatPrice(fullTotal),
      payments: 1,
      lifetimeTotal: fullTotal,
      lifetimeFormatted: formatPrice(fullTotal),
      saving: saving(fullTotal),
      savingLabel: `Save ${formatPrice(saving(fullTotal))}`,
      discountPercent: 15,
    },
  ];
}

export interface PaymentPlan {
  key: 'monthly' | 'bundle';
  label: string;
  blurb: string;
  amount: number;
  formatted: string;
  /** A real comparison, or none. */
  compareAt: number | null;
  savingLabel: string | null;
}

/**
 * The two ways to pay, smallest commitment first.
 *
 * There is no invented "list price" here. The only comparison shown is one the
 * customer can verify: what the same classes cost month by month. An anchor
 * they can check beats one they might catch.
 */
export function paymentPlans(classes: number, ratio: Ratio = '1:4'): PaymentPlan[] {
  const bundle = priceBundle(classes, ratio);
  const monthly = perMonthFor(ratio);

  return [
    {
      key: 'monthly',
      label: 'Pay monthly',
      blurb: `${CLASSES_PER_MONTH} classes a month. Stop any time.`,
      amount: monthly,
      formatted: `${formatPrice(monthly)}/mo`,
      compareAt: null,
      savingLabel: null,
    },
    {
      key: 'bundle',
      label: 'Pay in full',
      blurb: `All ${classes} classes, one payment.`,
      amount: bundle.total,
      formatted: formatPrice(bundle.total),
      compareAt: bundle.upfrontSaving > 0 ? bundle.monthlyEquivalent : null,
      savingLabel: bundle.upfrontSaving > 0 ? `Save ${formatPrice(bundle.upfrontSaving)}` : null,
    },
  ];
}
