/**
 * SARIRO — Razorpay Standard API server-side helpers
 *
 * Used by:
 *   - /api/razorpay/create-order  (creates an order with Razorpay)
 *   - /api/razorpay/verify        (verifies payment signature + creates enrollment)
 *
 * Razorpay Standard API docs:
 *   https://razorpay.com/docs/api/orders/
 *   https://razorpay.com/docs/api/payments/payment-verification/
 *
 * Required env vars (server-only — NEVER expose to browser):
 *   RAZORPAY_KEY_ID       — e.g. "rzp_live_xxxxxxxxxxxx" or "rzp_test_xxxxxxxxxxxx"
 *   RAZORPAY_KEY_SECRET   — paired secret
 *
 * Optional env vars:
 *   RAZORPAY_WEBHOOK_SECRET  — shared secret for webhook signature verify
 *   RAZORPAY_CURRENCY        — default 'INR' (Razorpay supports INR primarily)
 *
 * When RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing, every function
 * degrades gracefully — the routes return a 503 informing the operator
 * that Razorpay isn't configured. This keeps the site compiling in dev
 * before creds are filled in.
 */

import { createHmac } from 'crypto';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

/* ─────────────────────── Config ─────────────────────── */

export const RAZORPAY_CONFIGURED =
  !!process.env.RAZORPAY_KEY_ID &&
  !!process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_ID !== 'PUT_YOUR_RAZORPAY_KEY_ID_HERE' &&
  process.env.RAZORPAY_KEY_SECRET !== 'PUT_YOUR_RAZORPAY_KEY_SECRET_HERE';

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';
export const RAZORPAY_CURRENCY = process.env.RAZORPAY_CURRENCY || 'INR';

/* ─────────────────────── Types ─────────────────────── */

export interface CreateOrderInput {
  /** Amount in the SMALLEST currency unit (paise for INR, cents for USD). */
  amount: number;
  currency?: string;
  /** Course / intent description shown on Razorpay dashboard. */
  description?: string;
  /** Internal notes — visible on Razorpay dashboard. */
  notes?: Record<string, string>;
  /** Receipt ID — typically the purchase_intent UUID. */
  receipt?: string;
}

export interface CreateOrderResult {
  ok: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  /** Razorpay raw response, for debugging. */
  raw?: unknown;
  error?: string;
}

export interface VerifySignatureInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/* ─────────────────────── Helpers ─────────────────────── */

function basicAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
}

/**
 * Creates a Razorpay order. Returns the order_id which the client uses to
 * open the checkout modal.
 *
 * Idempotency: Razorpay dedupes by `receipt` — passing the same receipt
 * twice returns the same order. We pass the purchase_intent UUID as the
 * receipt to make retries safe.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!RAZORPAY_CONFIGURED) {
    return { ok: false, error: 'razorpay_not_configured' };
  }
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: 'invalid_amount' };
  }

  const body = {
    amount: input.amount,
    currency: input.currency || RAZORPAY_CURRENCY,
    receipt: input.receipt,
    notes: input.notes,
    partial_payment: false,
  };

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': basicAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      console.warn('[razorpay] createOrder failed:', res.status, json);
      const errField = json.error as { description?: string; code?: string } | undefined;
      return {
        ok: false,
        error: errField?.description || `razorpay_http_${res.status}`,
        raw: json,
      };
    }

    return {
      ok: true,
      orderId: json.id as string,
      amount: json.amount as number,
      currency: json.currency as string,
      raw: json,
    };
  } catch (err) {
    console.warn('[razorpay] createOrder exception:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'network_error' };
  }
}

/**
 * Verifies a Razorpay payment signature.
 *
 * Formula: HMAC_SHA256(`<razorpay_order_id>|<razorpay_payment_id>`, key_secret)
 *          must equal `razorpay_signature`.
 *
 * Uses constant-time comparison to avoid timing attacks.
 */
export function verifyPaymentSignature(input: VerifySignatureInput): boolean {
  if (!RAZORPAY_CONFIGURED) return false;
  if (!input.razorpay_order_id || !input.razorpay_payment_id || !input.razorpay_signature) {
    return false;
  }
  try {
    const expected = createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
      .digest('hex');
    const sig = input.razorpay_signature;
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.warn('[razorpay] signature verify error:', err);
    return false;
  }
}

/**
 * Returns a Supabase admin client using the SERVICE ROLE key.
 * SERVER ONLY — never import this in client code.
 *
 * Returns null if env vars are missing.
 */
export function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_SERVICE_ROLE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !url.startsWith('http')) return null;
  return createSupabaseAdmin(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* ─────────────────────── Pricing ───────────────────────
   Razorpay amounts are in the smallest currency unit (paise for INR).
   The app stores display prices in whole units (e.g. $199 or ₹199). We
   multiply by 100 to convert to paise.

   `displayPrice` should already reflect the correct tier (beginner /
   intermediate / advanced) AND ratio (1:4 / 1:1). Caller is responsible
   for picking the right price from the settings table.

   `currency` defaults to 'INR' but can be overridden — if 'USD' is set,
   Razorpay requires an international merchant account. */
export function displayPriceToAmount(displayPrice: number, currency = RAZORPAY_CURRENCY): number {
  // DEPRECATED — do not use for new checkout paths.
  //
  // This multiplies by 100 and ignores `currency` entirely, which is how a $199
  // course came to be charged as INR 199. It survives only for any legacy caller;
  // new code must use `toMinorUnits` from '@/lib/pricing/currency', which takes
  // the currency explicitly and is guarded by `checkChargeCurrency`.
  void currency;
  return Math.round(displayPrice * 100);
}
