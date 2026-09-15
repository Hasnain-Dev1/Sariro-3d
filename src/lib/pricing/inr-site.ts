import type { CadencePlan, Cadence } from '@/lib/school/pricing';
import { CLASSES_PER_MONTH } from '@/lib/school/pricing';
import { DEFAULT_LADDER, PLAN_MONTHS, type Ladder, type PlanMonths, type Ratio } from './economics';

/**
 * SARIRO — rupee prices on the website, for families in India
 * ============================================================================
 * The founder, 15 Sep 2026: the world sees dollars, India sees rupees — and an
 * Indian family pays in rupees, so UPI, Indian cards and net banking all work
 * (Razorpay offers UPI only on rupee payments; a dollar charge needs an
 * international card).
 *
 * ── Which rupee prices ──────────────────────────────────────────────────────
 * The public prices HR sets in the pricing calculator — the same numbers the
 * sellers quote (lib/pricing/economics.ts, DEFAULT_LADDER). One place to change
 * a price, for the website and the sales team alike. They include GST.
 *
 * ── Who sees them, and who may pay them ─────────────────────────────────────
 *   See:  a device set to Indian time, or anybody who picks ₹ on the switch.
 *   Pay:  only an account whose phone number is Indian (+91). Anybody else who
 *         switched to ₹ is asked to pay in dollars — checked again on the server
 *         in create-order, because a switch is not a rule.
 *
 * ── How the site's plans map onto the price list ────────────────────────────
 *   Monthly          the 1-month price, each month
 *   Every 3 months   the 3-month price, each quarter
 *   Pay in full      the 1-year price for a grade (48 classes),
 *                    the 3-year price for a grade group (144 classes)
 *
 * Pure: no I/O. Tested beside this file.
 */

export type DisplayCurrency = 'USD' | 'INR';

/** Public rupee price per plan length, per class type. Null = not sold in rupees. */
export type InrPlanPrices = Record<Ratio, Record<PlanMonths, number | null>>;

export function inrPricesFromLadder(ladder: Ladder): InrPlanPrices {
  const pick = (ratio: Ratio) =>
    Object.fromEntries(PLAN_MONTHS.map((m) => [m, ladder[ratio][m].publicPrice ?? null])) as Record<PlanMonths, number | null>;
  return { '1:4': pick('1:4'), '1:1': pick('1:1') };
}

export const DEFAULT_INR_PRICES: InrPlanPrices = inrPricesFromLadder(DEFAULT_LADDER);

/** Both names India's clock has gone by. */
export function isIndianTimeZone(timeZone: string | null | undefined): boolean {
  return timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta';
}

/** A picked currency wins; otherwise the device clock decides. */
export function preferredCurrency(stored: string | null | undefined, timeZone: string | null | undefined): DisplayCurrency {
  if (stored === 'INR' || stored === 'USD') return stored;
  return isIndianTimeZone(timeZone) ? 'INR' : 'USD';
}

export const CURRENCY_STORAGE_KEY = 'sariro:currency';

/** Said at checkout, and by create-order, to somebody without an Indian number. */
export const INR_PHONE_MESSAGE =
  'Rupee prices are for families in India, so they need an Indian (+91) phone number on your account. ' +
  'Add it in Settings, or pay in dollars.';

/** An Indian phone number, however it was stored: +91 followed by ten digits. */
export function isIndianPhone(phone: string | null | undefined): boolean {
  const digits = (phone ?? '').replace(/[^\d+]/g, '');
  return /^\+91\d{10}$/.test(digits);
}

/** ₹3,000 — Indian grouping, whole rupees. */
export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * The site's three ways to pay, in rupees, for a course of `classes` classes.
 * Empty when the price list is missing a price the plans need — a course that
 * cannot be priced in rupees is simply not offered in rupees.
 */
export function inrCadencePlans(classes: number, ratio: Ratio, prices: InrPlanPrices): CadencePlan[] {
  const p = prices[ratio];
  const months = Math.round(classes / CLASSES_PER_MONTH);
  const fullPrice = months === 12 ? p[12] : months === 36 ? p[36] : null;
  if (!p[1] || !p[3] || !fullPrice || months <= 0) return [];

  const monthlyLifetime = p[1] * months;
  const quarters = Math.ceil(months / 3);
  const quarterlyLifetime = p[3] * quarters;
  const saving = (total: number) => Math.max(0, monthlyLifetime - total);
  const percent = (total: number) => (monthlyLifetime > 0 ? Math.round((saving(total) / monthlyLifetime) * 100) : 0);
  const label = (total: number) => (saving(total) > 0 ? `Save ${formatInr(saving(total))}` : null);

  const plan = (cadence: Cadence, fields: Omit<CadencePlan, 'cadence'>): CadencePlan => ({ cadence, ...fields });

  return [
    plan('monthly', {
      label: 'Monthly',
      blurb: `${CLASSES_PER_MONTH} classes a month. Stop any time.`,
      perPayment: p[1],
      perPaymentFormatted: `${formatInr(p[1])}/mo`,
      payments: months,
      lifetimeTotal: monthlyLifetime,
      lifetimeFormatted: formatInr(monthlyLifetime),
      saving: 0,
      savingLabel: null,
      discountPercent: 0,
    }),
    plan('quarterly', {
      label: 'Every 3 months',
      blurb: 'Pay a term at a time.',
      perPayment: p[3],
      perPaymentFormatted: `${formatInr(p[3])} / 3 months`,
      payments: quarters,
      lifetimeTotal: quarterlyLifetime,
      lifetimeFormatted: formatInr(quarterlyLifetime),
      saving: saving(quarterlyLifetime),
      savingLabel: label(quarterlyLifetime),
      discountPercent: percent(quarterlyLifetime),
    }),
    plan('full', {
      label: 'Pay in full',
      blurb: `All ${classes} classes, one payment.`,
      perPayment: fullPrice,
      perPaymentFormatted: formatInr(fullPrice),
      payments: 1,
      lifetimeTotal: fullPrice,
      lifetimeFormatted: formatInr(fullPrice),
      saving: saving(fullPrice),
      savingLabel: label(fullPrice),
      discountPercent: percent(fullPrice),
    }),
  ];
}
