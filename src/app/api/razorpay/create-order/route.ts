import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';
import {
  createOrder,
  displayPriceToAmount,
  RAZORPAY_CONFIGURED,
  RAZORPAY_CURRENCY,
  getSupabaseAdmin,
} from '@/lib/razorpay/server';
import { SETTING_KEYS } from '@/lib/dashboard/settings-data';
import { rateLimit, rateLimitedResponse, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * SARIRO — POST /api/razorpay/create-order
 *
 * Body: { track, level, ratio }
 *
 * Flow:
 *   1. Auth-gate: must be signed in (server reads auth cookies via SSR client).
 *   2. Load the live display price for (level, ratio) from app_settings.
 *   3. Look for an existing PENDING purchase_intent for this user +
 *      track + level + ratio. Reuse it (idempotent) — multiple "Reserve"
 *      clicks should NOT create duplicate intents.
 *   4. Create a Razorpay order with the converted amount (paise).
 *   5. Return { orderId, amount, currency, intentId, keyId } to the client.
 *
 * The client uses `keyId` to open the Razorpay checkout modal.
 *
 * Notes:
 *   - The RAZORPAY_KEY_ID is exposed to the client on purpose — it's the
 *     publishable key, safe to expose (the secret is NEVER sent).
 *   - The receipt is set to the purchase_intent UUID so Razorpay dedupes
 *     repeat calls.
 */

export const runtime = 'nodejs';

const DEFAULT_PRICES: Record<string, number> = {
  [SETTING_KEYS.beginnerPrice]: 199,
  [SETTING_KEYS.intermediatePrice]: 299,
  [SETTING_KEYS.advancedPrice]: 699,
  [SETTING_KEYS.beginnerPrice1on1]: 299,
  [SETTING_KEYS.intermediatePrice1on1]: 399,
  [SETTING_KEYS.advancedPrice1on1]: 899,
};

function normalizeLevel(level: string): string {
  if (!level) return '';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getPriceKey(level: string, ratio: string): string {
  const lvl = normalizeLevel(level).toLowerCase();
  return ratio === '1:1' ? `price_${lvl}_1on1` : `price_${lvl}`;
}

async function getDisplayPrice(
  supabase: SupabaseClient,
  level: string,
  ratio: string
): Promise<number | null> {
  const key = getPriceKey(level, ratio);
  if (!key) return null;
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) {
    console.warn('[create-order] app_settings error:', error.message);
  }
  if (data?.value) {
    const n = Number(data.value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DEFAULT_PRICES[key] ?? null;
}

export async function POST(req: NextRequest) {
  // ── CSRF check — must come from the same origin ────────────────────
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  // ── IP blocklist — instantly 403 known abusers ─────────────────────
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) {
    return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!RAZORPAY_CONFIGURED) {
    return NextResponse.json(
      { ok: false, error: 'razorpay_not_configured', message: 'Razorpay keys missing on server.' },
      { status: 503 }
    );
  }

  // ── Auth gate ────────────────────────────────────────────────────────
  let userId: string | null = null;
  try {
    const supaServer = await createServerClientHelper();
    const { data: { user } } = await supaServer.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* supabase not configured OR no session — falls through to 401 below */
  }
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: 'unauthenticated' },
      { status: 401 }
    );
  }

  // ── Rate limit: 10 orders / minute per user ─────────────────────────
  // Generous enough for legit retries (failed orders, page refreshes)
  // but blocks brute-force order creation.
  const rl = rateLimit({
    key: `create-order:${userId}`,
    limit: 10,
    windowMs: 60_000,
    ip,
  });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Too many checkout attempts — please slow down.');
  }

  // ── Parse body ──────────────────────────────────────────────────────
  let body: { track?: string; level?: string; ratio?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const track = (body.track || '').trim();
  const level = normalizeLevel(body.level || '');
  const ratio = body.ratio === '1:1' ? '1:1' : '1:4';
  if (!track || !level) {
    return NextResponse.json(
      { ok: false, error: 'missing_params', message: 'track and level are required' },
      { status: 400 }
    );
  }

  // ── Get display price (from app_settings or defaults) ───────────────
  const supaServer = await createServerClientHelper();
  const displayPrice = await getDisplayPrice(supaServer, level, ratio);
  if (!displayPrice) {
    return NextResponse.json(
      { ok: false, error: 'price_not_found', message: `No price configured for ${level} ${ratio}` },
      { status: 400 }
    );
  }
  const amount = displayPriceToAmount(displayPrice, RAZORPAY_CURRENCY);

  // ── Find or create a PENDING purchase_intent (idempotent) ───────────
  const { data: existing } = await supaServer
    .from('purchase_intents')
    .select('id, status')
    .eq('user_id', userId)
    .eq('track', track)
    .eq('level', level)
    .eq('ratio', ratio)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let intentId: string;
  if (existing?.id) {
    intentId = existing.id;
  } else {
    const { data: created, error: createErr } = await supaServer
      .from('purchase_intents')
      .insert({
        user_id: userId,
        track,
        level,
        ratio,
        // Standard API flow — no payment-link URL; will be updated post-verify
        razorpay_link: null,
        status: 'pending',
      })
      .select('id')
      .single();
    if (createErr || !created?.id) {
      console.warn('[create-order] insert intent error:', createErr?.message);
      return NextResponse.json(
        { ok: false, error: 'intent_create_failed' },
        { status: 500 }
      );
    }
    intentId = created.id;
  }

  // ── Create the Razorpay order ───────────────────────────────────────
  const order = await createOrder({
    amount,
    currency: RAZORPAY_CURRENCY,
    receipt: intentId,
    description: `Sariro ${level} ${track} (${ratio})`,
    notes: {
      intent_id: intentId,
      user_id: userId,
      track,
      level,
      ratio,
    },
  });

  if (!order.ok || !order.orderId) {
    return NextResponse.json(
      { ok: false, error: order.error || 'order_create_failed' },
      { status: 502 }
    );
  }

  // ── Persist the order_id onto the intent (for ops traceability) ─────
  // Razorpay order_id is stored on razorpay_link column (re-purposed for
  // Standard API) so the existing admin dashboard's "Razorpay link" cell
  // shows something useful. The webhook / verify route can match on it
  // too.
  try {
    await supaServer
      .from('purchase_intents')
      .update({ razorpay_link: order.orderId })
      .eq('id', intentId);
  } catch (err) {
    console.warn('[create-order] persist order_id failed:', err);
    // non-fatal
  }

  return NextResponse.json({
    ok: true,
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    intentId,
    keyId: process.env.RAZORPAY_KEY_ID,
    displayPrice,
  });
}

/* ─────────────────────── GET /api/razorpay/create-order ───────────────
   Status endpoint — lets ops verify the route is configured. */
export async function GET() {
  return NextResponse.json({
    name: 'Sariro Razorpay create-order',
    configured: RAZORPAY_CONFIGURED,
    currency: RAZORPAY_CURRENCY,
    hasServiceKey: !!getSupabaseAdmin(),
  });
}
