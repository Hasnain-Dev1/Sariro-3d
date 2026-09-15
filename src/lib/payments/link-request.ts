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
 * database — the seller floor, and that the lead is theirs.
 */

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
  const months = Number(r.months);
  if (!isPlanMonths(months)) return { ok: false, error: 'Pick a plan.' };

  const amount = Number(r.amount);
  if (!Number.isFinite(amount) || amount < 1) return { ok: false, error: 'Enter the amount the family agreed.' };
  if (amount > MAX_LINK_RUPEES) return { ok: false, error: `That is more than ${formatInr(MAX_LINK_RUPEES)} — check the amount.` };
  if (Math.round(amount * 100) !== amount * 100) return { ok: false, error: 'Rupees and paise only — no more than two decimals.' };

  const customerName = String(r.customerName ?? '').trim().replace(/\s+/g, ' ');
  if (customerName.length < 2 || customerName.length > 80) return { ok: false, error: 'Enter the parent’s name.' };

  const phone = String(r.phone ?? '').replace(/[\s()-]/g, '');
  if (!/^\+\d{8,15}$/.test(phone)) return { ok: false, error: 'Enter the phone number with its country code, e.g. +91 98765 43210.' };

  const emailRaw = String(r.email ?? '').trim();
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) return { ok: false, error: 'That email address does not look right.' };

  const leadRaw = r.leadId ? String(r.leadId) : '';
  if (leadRaw && !UUID.test(leadRaw)) return { ok: false, error: 'Unknown lead.' };

  return { ok: true, value: { ratio, months, amount, customerName, phone, email: emailRaw || null, leadId: leadRaw || null } };
}

/** What the family reads on the Razorpay page. */
export function linkDescription(ratio: Ratio, months: PlanMonths): string {
  return `Sariro — ${ratio === '1:1' ? 'one to one (1:1)' : 'small batch (1:4)'} — ${PLAN_LABEL[months]}`;
}

/** Razorpay wants a unique reference of at most 40 characters. */
export function referenceId(now: number, random: string): string {
  return `SR-${now.toString(36).toUpperCase()}-${random.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`.slice(0, 40);
}

/** A WhatsApp message with the link in it, ready to send to the parent. */
export function whatsappShareUrl(phone: string, name: string, amount: number, url: string, ratio: Ratio, months: PlanMonths): string {
  const first = name.trim().split(/\s+/)[0] || 'there';
  const text =
    `Hi ${first}, here is the payment link for Sariro — ${ratio === '1:1' ? 'one to one' : 'small batch'}, ` +
    `${PLAN_LABEL[months]}, ${formatInr(amount)} (GST included). You can pay by UPI, card or net banking: ${url}`;
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
