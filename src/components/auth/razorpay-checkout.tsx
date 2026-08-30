'use client';

/**
 * SARIRO — Razorpay Standard API checkout flow
 *
 * Used by ReserveSeatButton. Triggers:
 *   1. POST /api/razorpay/create-order → gets orderId, amount, keyId
 *   2. Loads Razorpay checkout script (https://checkout.razorpay.com/v1/checkout.js)
 *   3. Opens the Razorpay modal with the orderId
 *   4. On payment success: captures (payment_id, order_id, signature)
 *   5. POST /api/razorpay/verify → server verifies signature, creates enrollment
 *   6. On verify success: redirects to /payment-success
 *   7. On failure: redirects to /payment-failure with context
 *
 * Falls back to the legacy Payment Pages redirect if Razorpay keys are
 * not configured on the server (so the site keeps working in dev).
 */

import { useState, useCallback } from 'react';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { LoginGateModal } from '@/components/auth/login-gate-modal';

interface RazorpayCheckoutButtonProps {
  track: string;
  level: string;
  ratio: '1:4' | '1:1';
  /** Legacy Razorpay Payment Page URL — fallback when Standard API isn't configured. */
  paymentLink: string;
  courseName: string;
  accentColor: string;
  className?: string;
  /**
   * Override the create-order body. School products (subject + grade + scope +
   * cadence) price differently from coding tracks, but they must go through the
   * SAME order route — the currency guard, the purchase intent and the audit
   * trail all live there, and a second checkout would eventually disagree with
   * this one about money.
   *
   * `track`/`level` are still required above: they identify the product on the
   * success page and in the purchase intent.
   */
  orderBody?: Record<string, unknown>;
}

interface CreateOrderResponse {
  ok: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  intentId?: string;
  keyId?: string;
  displayPrice?: number;
  error?: string;
  message?: string;
}

interface VerifyResponse {
  ok: boolean;
  intentId?: string;
  enrollmentId?: string;
  cohortId?: string;
  idempotent?: boolean;
  error?: string;
  message?: string;
}

/* Razorpay checkout script URL — global, loaded once per page. */
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptLoadPromise: Promise<boolean> | null = null;

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  // Already loaded?
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
    return Promise.resolve(true);
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[razorpay] checkout script failed to load');
      scriptLoadPromise = null; // allow retry
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export function RazorpayCheckoutButton({
  track,
  level,
  ratio,
  orderBody,
  paymentLink,
  courseName,
  accentColor,
  className,
}: RazorpayCheckoutButtonProps) {
  const { user } = useAuth();
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackToLegacyLink = useCallback(() => {
    // Legacy path — still create a purchase_intent, then redirect to the
    // Razorpay Payment Page. Used when Standard API isn't configured.
    const successUrl = `${window.location.origin}/payment-success?track=${encodeURIComponent(
      track
    )}&level=${encodeURIComponent(level)}&ratio=${encodeURIComponent(ratio)}`;
    const finalLink = paymentLink.includes('?')
      ? `${paymentLink}&return_url=${encodeURIComponent(successUrl)}`
      : `${paymentLink}?return_url=${encodeURIComponent(successUrl)}`;
    window.location.href = finalLink;
  }, [paymentLink, track, level, ratio]);

  const handleClick = useCallback(async () => {
    if (!user) {
      setShowLoginGate(true);
      return;
    }
    setError(null);
    setProcessing(true);

    // ── 1. Create the order server-side ──────────────────────────────
    let orderRes: CreateOrderResponse;
    try {
      const r = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody ?? { track, level, ratio }),
      });
      orderRes = (await r.json()) as CreateOrderResponse;
    } catch (err) {
      console.warn('[razorpay] create-order network error:', err);
      setProcessing(false);
      setError('Network error — please try again.');
      return;
    }

    // ── Fallback: Standard API not configured → legacy flow ──────────
    if (!orderRes.ok && orderRes.error === 'razorpay_not_configured') {
      // Best-effort: still create a purchase_intent for tracking.
      try {
        const supabase = createClient();
        await supabase.from('purchase_intents').insert({
          user_id: user.id,
          track,
          level,
          ratio,
          razorpay_link: paymentLink,
          status: 'pending',
        });
      } catch (err) {
        console.warn('[reserve-seat] intent failed:', err);
      }
      setProcessing(false);
      fallbackToLegacyLink();
      return;
    }

    if (!orderRes.ok || !orderRes.orderId || !orderRes.keyId) {
      console.warn('[razorpay] create-order failed:', orderRes);
      setProcessing(false);
      setError(orderRes.message || 'Could not start checkout. Please try again.');
      return;
    }

    // ── 2. Load the Razorpay checkout script ─────────────────────────
    const scriptOk = await loadRazorpayScript();
    if (!scriptOk) {
      setProcessing(false);
      setError('Could not load Razorpay checkout. Check your connection and try again.');
      return;
    }

    // ── 3. Open the Razorpay modal ───────────────────────────────────
    const RazorpayCtor = (
      window as unknown as {
        Razorpay?: new (opts: Record<string, unknown>) => {
          open: () => void;
        };
      }
    ).Razorpay;

    if (!RazorpayCtor) {
      setProcessing(false);
      setError('Razorpay failed to initialize.');
      return;
    }

    // Modal options — see https://razorpay.com/docs/api/payments/payment-gateway/
    const options: Record<string, unknown> = {
      key: orderRes.keyId,
      amount: orderRes.amount,
      currency: orderRes.currency || 'INR',
      name: 'Sariro',
      description: `${courseName} · ${level} · ${ratio}`,
      order_id: orderRes.orderId,
      prefill: {
        // Prefill email + name if we have it from Supabase user
        email: user.email ?? '',
      },
      notes: {
        intent_id: orderRes.intentId ?? '',
        user_id: user.id,
        track,
        level,
        ratio,
      },
      theme: { color: accentColor },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        // ── 4. Verify signature server-side ─────────────────────────
        try {
          const vRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              intentId: orderRes.intentId,
            }),
          });
          const vJson = (await vRes.json()) as VerifyResponse;
          if (vJson.ok) {
            // ── 5. Redirect to payment-success ──────────────────────
            const params = new URLSearchParams({
              track,
              level,
              ratio,
              intent: orderRes.intentId ?? '',
              auto: '1',
            });
            window.location.href = `/payment-success?${params.toString()}`;
          } else {
            console.warn('[razorpay] verify failed:', vJson);
            const params = new URLSearchParams({
              track,
              level,
              ratio,
              reason: vJson.error || 'verify_failed',
            });
            window.location.href = `/payment-failure?${params.toString()}`;
          }
        } catch (err) {
          console.warn('[razorpay] verify exception:', err);
          const params = new URLSearchParams({
            track,
            level,
            ratio,
            reason: 'verify_exception',
          });
          window.location.href = `/payment-failure?${params.toString()}`;
        } finally {
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          // User closed the modal without paying.
          setProcessing(false);
          setError('Payment cancelled. You can try again anytime.');
        },
      },
    };

    const rzp = new RazorpayCtor(options);
    rzp.open();
  }, [user, track, level, ratio, courseName, accentColor, paymentLink, fallbackToLegacyLink]);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={processing}
        className={
          className ??
          'btn-tactile btn-tactile-primary w-full px-6 py-4 text-base'
        }
        style={{ background: accentColor }}
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ShieldCheck className="w-5 h-5" />
        )}
        Reserve your seat
        <ArrowRight className="w-5 h-5" />
      </button>

      {error && (
        <div className="mt-3 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <LoginGateModal
        open={showLoginGate}
        onClose={() => setShowLoginGate(false)}
        nextPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
        courseName={courseName}
      />
    </>
  );
}
