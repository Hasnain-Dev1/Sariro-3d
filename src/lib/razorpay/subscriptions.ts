import { RAZORPAY_CONFIGURED, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from './server';
import { LINK_SOURCE, type LinkResult } from './payment-links';

/**
 * SARIRO — autopay links: Razorpay subscriptions (server only)
 * ============================================================================
 * https://razorpay.com/docs/api/payments/subscriptions/
 *
 * An autopay link is a Razorpay subscription: a plan (how much, how often) and
 * a subscription on it (how many payments). The family opens the link once and
 * approves a mandate — UPI Autopay, a card or an e-mandate from their bank —
 * and Razorpay charges them on schedule until the count is reached or an admin
 * ends it. As with one-time links, Razorpay does not message the family
 * (customer_notify off): the seller sends the link on WhatsApp.
 *
 * Needs Subscriptions switched on for the Razorpay account.
 */

const auth = () => 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
const API = 'https://api.razorpay.com/v1';

export interface RazorpayPeriod {
  period: 'monthly' | 'yearly';
  interval: number;
}

export interface CreatedSubscription {
  id: string;
  planId: string;
  url: string;
  status: string;
  totalCount: number;
  paidCount: number;
}

async function call(method: 'GET' | 'POST', path: string, body?: unknown): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; error: string }> {
  if (!RAZORPAY_CONFIGURED) return { ok: false, error: 'Razorpay is not configured on the server.' };
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: auth(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err = json.error as { description?: string } | undefined;
      console.warn('[subscriptions]', method, path.split('?')[0], 'failed:', res.status, err?.description);
      return { ok: false, error: err?.description || `Razorpay refused the request (${res.status}).` };
    }
    return { ok: true, json };
  } catch (err) {
    console.warn('[subscriptions]', method, path.split('?')[0], 'exception:', err);
    return { ok: false, error: 'Could not reach Razorpay. Try again in a moment.' };
  }
}

/** A plan: this much, this often. Plans cannot be edited or deleted, so identical ones are reused by the caller. */
export async function createPlan(input: { amountRupees: number; name: string; description: string } & RazorpayPeriod): Promise<LinkResult<string>> {
  const r = await call('POST', '/plans', {
    period: input.period,
    interval: input.interval,
    item: { name: input.name.slice(0, 250), amount: Math.round(input.amountRupees * 100), currency: 'INR', description: input.description.slice(0, 250) },
    notes: { source: LINK_SOURCE },
  });
  return r.ok ? { ok: true, value: String(r.json.id) } : r;
}

export async function createSubscription(input: {
  planId: string;
  totalCount: number;
  expireBy: number;
  notes: Record<string, string>;
}): Promise<LinkResult<CreatedSubscription>> {
  const r = await call('POST', '/subscriptions', {
    plan_id: input.planId,
    total_count: input.totalCount,
    quantity: 1,
    customer_notify: 0,
    expire_by: input.expireBy,
    notes: { ...input.notes, source: LINK_SOURCE },
  });
  if (!r.ok) return r;
  if (!r.json.short_url) return { ok: false, error: 'Razorpay made the subscription but returned no link to send.' };
  return { ok: true, value: toCreated(r.json) };
}

/** Ends an autopay now: no further charges. Payments already taken are not refunded. */
export async function cancelSubscription(id: string): Promise<LinkResult<{ status: string; paidCount: number }>> {
  if (!/^sub_[A-Za-z0-9]+$/.test(id)) return { ok: false, error: 'Not a Razorpay subscription.' };
  const r = await call('POST', `/subscriptions/${id}/cancel`, { cancel_at_cycle_end: 0 });
  if (!r.ok) return r;
  return { ok: true, value: { status: String(r.json.status), paidCount: Number(r.json.paid_count ?? 0) } };
}

export interface ListedSubscription extends CreatedSubscription {
  createdAt: number;
  notes: Record<string, string>;
}

/** The subscriptions Sariro created, newest first (up to a hundred). */
export async function listSubscriptions(): Promise<LinkResult<ListedSubscription[]>> {
  const r = await call('GET', '/subscriptions?count=100');
  if (!r.ok) return r;
  const items = (r.json.items as Record<string, unknown>[] | undefined) ?? [];
  return {
    ok: true,
    value: items
      .filter((s) => (s.notes as Record<string, string> | undefined)?.source === LINK_SOURCE)
      .map((s) => ({ ...toCreated(s), createdAt: Number(s.created_at ?? 0), notes: (s.notes ?? {}) as Record<string, string> }))
      .sort((a, b) => b.createdAt - a.createdAt),
  };
}

function toCreated(s: Record<string, unknown>): CreatedSubscription {
  return {
    id: String(s.id),
    planId: String(s.plan_id ?? ''),
    url: String(s.short_url ?? ''),
    status: String(s.status ?? 'created'),
    totalCount: Number(s.total_count ?? 0),
    paidCount: Number(s.paid_count ?? 0),
  };
}
