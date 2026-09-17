import { PLAN_LABEL, isPlanMonths, type PlanMonths, type Ratio } from '@/lib/pricing/economics';
import { formatInr } from '@/lib/pricing/inr-site';

/**
 * SARIRO — a rupee payment link for a family
 * ============================================================================
 * The founder, 15 Sep 2026: families in India pay in rupees so they can use
 * UPI. On the website that is checkout; on a call, a seller agrees a price and
 * needs to send something the parent can pay from their phone in a minute.
 * That is a Razorpay payment link — ₹ amount, UPI / card / net banking — made
 * from the dashboard and sent on WhatsApp.
 *
 * The rules a link must pass before Razorpay is asked for one live here, pure
 * and tested; the route (api/payments/links) adds the ones that need the
 * database — the seller floor, that the lead is theirs, and that the person
 * making it has verified their own phone.
 *
 * ── Autopay (17 Sep 2026) ───────────────────────────────────────────────────
 * The same form can make an autopay link instead: the family approves once and
 * Razorpay charges them automatically — an amount, how often, and how many
 * payments. Each payment is one plan's worth (monthly = the 1 month plan,
 * yearly = the 1 year plan), so the seller floor applies to every payment.
 */

export type AutopayFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export const AUTOPAY_FREQUENCIES: readonly AutopayFrequency[] = ['monthly', 'quarterly', 'half_yearly', 'yearly'];

export const isAutopayFrequency = (v: unknown): v is AutopayFrequency =>
  typeof v === 'string' && (AUTOPAY_FREQUENCIES as readonly string[]).includes(v);

export const FREQUENCY_LABEL: Record<AutopayFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Every 3 months',
  half_yearly: 'Every 6 months',
  yearly: 'Yearly',
};

/** The plan one payment buys — and so the floor each payment is held to. */
export const FREQUENCY_MONTHS: Record<AutopayFrequency, PlanMonths> = { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 };

/** How Razorpay spells each frequency on a plan. */
export const RAZORPAY_PERIOD: Record<AutopayFrequency, { period: 'monthly' | 'yearly'; interval: number }> = {
  monthly: { period: 'monthly', interval: 1 },
  quarterly: { period: 'monthly', interval: 3 },
  half_yearly: { period: 'monthly', interval: 6 },
  yearly: { period: 'yearly', interval: 1 },
};

/** One payment is a one-time link; five years of monthly payments is the most anybody sells. */
export const MIN_AUTOPAY_PAYMENTS = 2;
export const MAX_AUTOPAY_PAYMENTS = 60;
/** The whole of an autopay, every payment added up. */
export const MAX_AUTOPAY_TOTAL_RUPEES = 10_00_000;

export interface AutopayTerms {
  frequency: AutopayFrequency;
  /** How many payments Razorpay collects before the autopay ends by itself. */
  count: number;
}

export interface LinkRequest {
  ratio: Ratio;
  months: PlanMonths;
  /** Rupees, GST included — what the family pays. */
  amount: number;
  customerName: string;
  /** E.164, e.g. +919876543210. Razorpay uses it for the UPI/SMS contact. */
  phone: string;
  email: string | null;
  leadId: string | null;
  /** Null for a one-time link. For autopay, `amount` is each payment and `months` is FREQUENCY_MONTHS. */
  autopay: AutopayTerms | null;
}

export type LinkCheck = { ok: true; value: LinkRequest } | { ok: false; error: string };

/** A link above this is almost certainly a typo, not a 3-year 1:1 plan. */
export const MAX_LINK_RUPEES = 2_00_000;

/** Long enough for a family to talk it over; short enough not to be paid a month later at an old price. */
export const LINK_EXPIRY_DAYS = 7;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function checkLinkRequest(raw: unknown): LinkCheck {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const ratio = r.ratio === '1:1' ? '1:1' : r.ratio === '1:4' ? '1:4' : null;
  if (!ratio) return { ok: false, error: 'Pick 1:4 or 1:1.' };

  let autopay: AutopayTerms | null = null;
  if (r.autopay === true) {
    if (!isAutopayFrequency(r.frequency)) return { ok: false, error: 'Pick how often the autopay charges.' };
    const count = Number(r.count);
    if (!Number.isInteger(count) || count < MIN_AUTOPAY_PAYMENTS || count > MAX_AUTOPAY_PAYMENTS) {
      return { ok: false, error: `Autopay needs between ${MIN_AUTOPAY_PAYMENTS} and ${MAX_AUTOPAY_PAYMENTS} payments.` };
    }
    autopay = { frequency: r.frequency, count };
  }
  const months = autopay ? FREQUENCY_MONTHS[autopay.frequency] : Number(r.months);
  if (!isPlanMonths(months)) return { ok: false, error: 'Pick a plan.' };

  const amount = Number(r.amount);
  if (!Number.isFinite(amount) || amount < 1) return { ok: false, error: 'Enter the amount the family agreed.' };
  if (amount > MAX_LINK_RUPEES) return { ok: false, error: `That is more than ${formatInr(MAX_LINK_RUPEES)} — check the amount.` };
  if (Math.round(amount * 100) !== amount * 100) return { ok: false, error: 'Rupees and paise only — no more than two decimals.' };
  if (autopay && amount * autopay.count > MAX_AUTOPAY_TOTAL_RUPEES) {
    return { ok: false, error: `The autopay adds up to more than ${formatInr(MAX_AUTOPAY_TOTAL_RUPEES)} — check the amount and the number of payments.` };
  }

  const customerName = String(r.customerName ?? '').trim().replace(/\s+/g, ' ');
  if (customerName.length < 2 || customerName.length > 80) return { ok: false, error: 'Enter the parent’s name.' };

  const phone = String(r.phone ?? '').replace(/[\s()-]/g, '');
  if (!/^\+\d{8,15}$/.test(phone)) return { ok: false, error: 'Enter the phone number with its country code, e.g. +91 98765 43210.' };

  const emailRaw = String(r.email ?? '').trim();
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) return { ok: false, error: 'That email address does not look right.' };

  const leadRaw = r.leadId ? String(r.leadId) : '';
  if (leadRaw && !UUID.test(leadRaw)) return { ok: false, error: 'Unknown lead.' };

  return { ok: true, value: { ratio, months, amount, customerName, phone, email: emailRaw || null, leadId: leadRaw || null, autopay } };
}

/** What the family reads on the Razorpay page. */
export function linkDescription(ratio: Ratio, months: PlanMonths): string {
  return `Sariro — ${ratio === '1:1' ? 'one to one (1:1)' : 'small batch (1:4)'} — ${PLAN_LABEL[months]}`;
}

/** What the family reads on the autopay approval page: "…— autopay, monthly, 12 payments". */
export function autopayDescription(ratio: Ratio, terms: AutopayTerms): string {
  return `Sariro — ${ratio === '1:1' ? 'one to one (1:1)' : 'small batch (1:4)'} — autopay, ${FREQUENCY_LABEL[terms.frequency].toLowerCase()}, ${terms.count} payments`;
}

/** "₹3,000 monthly × 12 payments (₹36,000 in all)". */
export function autopaySummary(amount: number, terms: AutopayTerms): string {
  return `${formatInr(amount)} ${FREQUENCY_LABEL[terms.frequency].toLowerCase()} × ${terms.count} payments (${formatInr(amount * terms.count)} in all)`;
}

/** Razorpay wants a unique reference of at most 40 characters. */
export function referenceId(now: number, random: string): string {
  return `SR-${now.toString(36).toUpperCase()}-${random.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`.slice(0, 40);
}

/** A WhatsApp message with the link in it, ready to send to the parent. */
export function whatsappShareUrl(phone: string, name: string, amount: number, url: string, ratio: Ratio, months: PlanMonths, autopay: AutopayTerms | null = null): string {
  const first = name.trim().split(/\s+/)[0] || 'there';
  const plan = ratio === '1:1' ? 'one to one' : 'small batch';
  const text = autopay
    ? `Hi ${first}, here is the autopay link for Sariro — ${plan}: ${autopaySummary(amount, autopay)}, GST included. ` +
      `Approve it once by UPI Autopay, card or your bank, and each payment is collected automatically: ${url}`
    : `Hi ${first}, here is the payment link for Sariro — ${plan}, ` +
      `${PLAN_LABEL[months]}, ${formatInr(amount)} (GST included). You can pay by UPI, card or net banking: ${url}`;
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
