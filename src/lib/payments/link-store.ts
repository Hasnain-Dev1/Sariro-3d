import { FREQUENCY_LABEL, isAutopayFrequency, type AutopayFrequency } from './link-request';

/**
 * SARIRO — the payment links table, and what the dashboard reads from it
 * ============================================================================
 * scripts/payment-links.sql. One row per link made from the dashboard, one-time
 * or autopay, with who made it. Razorpay stays the truth for whether money
 * moved; this table is how Sariro remembers what it sent, to whom, by whom —
 * which Razorpay alone could not answer ("who made this link?") and could not
 * be searched by (the creator's email or phone).
 *
 * Pure: the routes do the reading and writing.
 */

export type LinkKind = 'one_time' | 'autopay';

export interface LinkRow {
  id: string;
  kind: LinkKind;
  razorpay_id: string;
  razorpay_plan_id: string | null;
  short_url: string;
  status: string;
  amount_inr: number | string;
  frequency: AutopayFrequency | null;
  total_count: number | null;
  paid_count: number;
  amount_paid_inr: number | string;
  ratio: string | null;
  months: number | null;
  description: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  lead_id: string | null;
  below_floor: boolean;
  created_by: string | null;
  created_by_role: string | null;
  created_at: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
}

export interface Creator {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

/**
 * An autopay that can still charge the family — the ones an admin can end,
 * and the ones a student is told how to pause or cancel. `created` is included:
 * the family may approve the link at any moment until it expires.
 */
export const AUTOPAY_LIVE_STATUSES = ['created', 'authenticated', 'active', 'pending', 'halted', 'paused', 'resumed'] as const;

export const isLiveAutopay = (row: Pick<LinkRow, 'kind' | 'status'>) =>
  row.kind === 'autopay' && (AUTOPAY_LIVE_STATUSES as readonly string[]).includes(row.status);

/** What the list shows for one link. */
export interface LinkView {
  id: string;
  kind: LinkKind;
  status: string;
  url: string;
  /** Per payment for autopay; the whole amount for a one-time link. */
  amount: number;
  frequency: AutopayFrequency | null;
  frequencyLabel: string | null;
  totalCount: number | null;
  paidCount: number;
  /** Everything the link would collect: amount × payments for autopay. */
  total: number;
  amountPaid: number;
  description: string;
  customer: { name: string; phone: string; email: string | null };
  createdAt: string;
  createdBy: Creator | null;
  belowFloor: boolean;
  cancelledAt: string | null;
  mine: boolean;
  /** An admin may end it now. */
  cancellable: boolean;
}

const num = (v: number | string | null | undefined) => (v === null || v === undefined || v === '' ? 0 : Number(v));

export function toView(row: LinkRow, creators: ReadonlyMap<string, Creator>, viewerId: string): LinkView {
  const amount = num(row.amount_inr);
  const autopay = row.kind === 'autopay';
  const paidCount = row.paid_count ?? 0;
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    url: row.short_url,
    amount,
    frequency: autopay ? row.frequency : null,
    frequencyLabel: autopay && row.frequency ? FREQUENCY_LABEL[row.frequency] : null,
    totalCount: autopay ? row.total_count : null,
    paidCount,
    total: autopay ? amount * (row.total_count ?? 0) : amount,
    amountPaid: autopay ? Math.max(num(row.amount_paid_inr), amount * paidCount) : num(row.amount_paid_inr),
    description: row.description,
    customer: { name: row.customer_name, phone: row.customer_phone, email: row.customer_email },
    createdAt: row.created_at,
    createdBy: row.created_by ? creators.get(row.created_by) ?? { id: row.created_by, name: null, email: null, phone: null, role: row.created_by_role } : null,
    belowFloor: row.below_floor,
    cancelledAt: row.cancelled_at,
    mine: !!row.created_by && row.created_by === viewerId,
    cancellable: isLiveAutopay(row),
  };
}

const digits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

/**
 * The list's search box: who made it, by email, phone or name. A phone matches
 * on its digits, however it was typed — "+91 98765", "98765 43210".
 */
export function matchesCreator(view: Pick<LinkView, 'createdBy'>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const c = view.createdBy;
  if (!c) return false;
  const qDigits = digits(q);
  if (qDigits.length >= 4 && qDigits.length === q.replace(/[\s+()-]/g, '').length) return digits(c.phone).includes(qDigits);
  return (c.email ?? '').toLowerCase().includes(q) || (c.name ?? '').toLowerCase().includes(q);
}

/** The last ten digits — enough to say two numbers are the same phone, whatever prefix was typed. */
export const phoneKey = (phone: string | null | undefined) => digits(phone).slice(-10);

/** A student's own live autopays: made for their email, or for their phone. */
export function autopaysForAccount(rows: readonly LinkRow[], account: { email: string | null; phone: string | null }): LinkRow[] {
  const email = (account.email ?? '').trim().toLowerCase();
  const phone = phoneKey(account.phone);
  return rows.filter((r) => {
    if (!isLiveAutopay(r)) return false;
    const byEmail = !!email && (r.customer_email ?? '').trim().toLowerCase() === email;
    const byPhone = phone.length === 10 && phoneKey(r.customer_phone) === phone;
    return byEmail || byPhone;
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidOrNull = (v: string | null | undefined) => (v && UUID.test(v) ? v : null);
const iso = (unix: number) => new Date((unix > 0 ? unix : Date.now() / 1000) * 1000).toISOString();

/** A one-time link Razorpay knows about and the table does not (made before the table existed). */
export function rowFromRazorpayLink(l: {
  id: string; url: string; status: string; amount: number; paid: number; description: string;
  customerName: string | null; createdAt: number; createdBy: string | null; leadId: string | null;
  notes?: Record<string, string>;
}): Omit<LinkRow, 'id' | 'cancelled_at' | 'cancelled_by'> {
  const n = l.notes ?? {};
  return {
    kind: 'one_time',
    razorpay_id: l.id,
    razorpay_plan_id: null,
    short_url: l.url,
    status: l.status,
    amount_inr: l.amount,
    frequency: null,
    total_count: null,
    paid_count: l.status === 'paid' ? 1 : 0,
    amount_paid_inr: l.paid,
    ratio: n.ratio === '1:1' || n.ratio === '1:4' ? n.ratio : null,
    months: n.months ? Number(n.months) || null : null,
    description: l.description,
    customer_name: l.customerName ?? n.customer_name ?? '',
    customer_phone: n.customer_phone ?? '',
    customer_email: n.customer_email || null,
    lead_id: uuidOrNull(l.leadId),
    below_floor: n.below_floor === 'yes',
    created_by: uuidOrNull(l.createdBy),
    created_by_role: n.created_by_role ?? null,
    created_at: iso(l.createdAt),
  };
}

/** An autopay Razorpay knows about and the table does not (the insert after creating it failed). */
export function rowFromSubscription(s: {
  id: string; planId: string; url: string; status: string; totalCount: number; paidCount: number;
  createdAt: number; notes: Record<string, string>;
}): Omit<LinkRow, 'id' | 'cancelled_at' | 'cancelled_by'> | null {
  const n = s.notes;
  const amount = Number(n.amount_inr);
  const frequency = isAutopayFrequency(n.frequency) ? n.frequency : null;
  // Without the amount and frequency written on it, it is not one of ours to show.
  if (!Number.isFinite(amount) || amount <= 0 || !frequency) return null;
  return {
    kind: 'autopay',
    razorpay_id: s.id,
    razorpay_plan_id: s.planId || null,
    short_url: s.url,
    status: s.status,
    amount_inr: amount,
    frequency,
    total_count: s.totalCount || null,
    paid_count: s.paidCount,
    amount_paid_inr: amount * s.paidCount,
    ratio: n.ratio === '1:1' || n.ratio === '1:4' ? n.ratio : null,
    months: n.months ? Number(n.months) || null : null,
    description: n.description ?? '',
    customer_name: n.customer_name ?? '',
    customer_phone: n.customer_phone ?? '',
    customer_email: n.customer_email || null,
    lead_id: uuidOrNull(n.lead_id),
    below_floor: n.below_floor === 'yes',
    created_by: uuidOrNull(n.created_by),
    created_by_role: n.created_by_role ?? null,
    created_at: iso(s.createdAt),
  };
}
