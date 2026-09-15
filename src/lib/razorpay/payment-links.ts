import { RAZORPAY_CONFIGURED, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from './server';

/**
 * SARIRO — Razorpay payment links (server only)
 * ============================================================================
 * https://razorpay.com/docs/api/payments/payment-links/
 *
 * Always rupees: a link is how a family in India pays by UPI. Razorpay itself
 * does not SMS or email the family (notify off) — the seller sends the link on
 * WhatsApp, from a conversation the family is already in.
 *
 * Every link we create carries notes.source = 'sariro_payment_link', which is
 * how the list below tells ours from any made by hand in the Razorpay dashboard.
 */

export const LINK_SOURCE = 'sariro_payment_link';

const auth = () => 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

export interface CreatedLink {
  id: string;
  url: string;
  status: string;
  amount: number;
  expireBy: number | null;
}

export type LinkResult<T> = { ok: true; value: T } | { ok: false; error: string };

export async function createPaymentLink(input: {
  amountRupees: number;
  description: string;
  referenceId: string;
  customer: { name: string; contact: string; email: string | null };
  notes: Record<string, string>;
  expireBy: number;
}): Promise<LinkResult<CreatedLink>> {
  if (!RAZORPAY_CONFIGURED) return { ok: false, error: 'Razorpay is not configured on the server.' };
  try {
    const res = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth() },
      body: JSON.stringify({
        amount: Math.round(input.amountRupees * 100),
        currency: 'INR',
        accept_partial: false,
        description: input.description,
        reference_id: input.referenceId,
        expire_by: input.expireBy,
        customer: {
          name: input.customer.name,
          contact: input.customer.contact,
          ...(input.customer.email ? { email: input.customer.email } : {}),
        },
        notify: { sms: false, email: false },
        reminder_enable: false,
        notes: { ...input.notes, source: LINK_SOURCE },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err = json.error as { description?: string } | undefined;
      console.warn('[payment-links] create failed:', res.status, err?.description);
      return { ok: false, error: err?.description || `Razorpay refused the link (${res.status}).` };
    }
    return {
      ok: true,
      value: {
        id: String(json.id),
        url: String(json.short_url),
        status: String(json.status),
        amount: Number(json.amount) / 100,
        expireBy: json.expire_by ? Number(json.expire_by) : null,
      },
    };
  } catch (err) {
    console.warn('[payment-links] create exception:', err);
    return { ok: false, error: 'Could not reach Razorpay. Try again in a moment.' };
  }
}

export interface ListedLink {
  id: string;
  url: string;
  status: string;
  amount: number;
  paid: number;
  description: string;
  customerName: string | null;
  createdAt: number;
  createdBy: string | null;
  leadId: string | null;
}

/** The links Sariro created, newest first. */
export async function listPaymentLinks(): Promise<LinkResult<ListedLink[]>> {
  if (!RAZORPAY_CONFIGURED) return { ok: false, error: 'Razorpay is not configured on the server.' };
  try {
    const res = await fetch('https://api.razorpay.com/v1/payment_links', {
      headers: { Authorization: auth() },
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json()) as { payment_links?: Record<string, unknown>[]; error?: { description?: string } };
    if (!res.ok) return { ok: false, error: json.error?.description || `Razorpay refused the list (${res.status}).` };
    const links = (json.payment_links ?? [])
      .filter((l) => (l.notes as Record<string, string> | undefined)?.source === LINK_SOURCE)
      .map((l) => {
        const notes = (l.notes ?? {}) as Record<string, string>;
        const customer = (l.customer ?? {}) as { name?: string };
        return {
          id: String(l.id),
          url: String(l.short_url),
          status: String(l.status),
          amount: Number(l.amount) / 100,
          paid: Number(l.amount_paid ?? 0) / 100,
          description: String(l.description ?? ''),
          customerName: customer.name ?? null,
          createdAt: Number(l.created_at ?? 0),
          createdBy: notes.created_by ?? null,
          leadId: notes.lead_id || null,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    return { ok: true, value: links };
  } catch (err) {
    console.warn('[payment-links] list exception:', err);
    return { ok: false, error: 'Could not reach Razorpay. Try again in a moment.' };
  }
}
