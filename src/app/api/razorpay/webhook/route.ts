import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';

/**
 * SARIRO — Razorpay Webhook Handler
 *
 * Receives Razorpay payment events and:
 *   - payment.captured  → confirms the matching purchase_intent + creates
 *                          an enrollment (assigned to a gathering cohort,
 *                          auto-creating one if needed).
 *   - payment.failed    → marks the matching purchase_intent as 'expired'.
 *
 * Uses the Supabase SERVICE-ROLE key — bypasses RLS so the webhook can
 * write enrollments on behalf of students. The service-role key must
 * NEVER be exposed to the browser.
 *
 * Gracefully no-ops if env vars are missing (preview/dev environments).
 *
 * Required env vars:
 *   RAZORPAY_WEBHOOK_SECRET  — shared secret configured in Razorpay dashboard
 *   SUPABASE_SERVICE_ROLE_URL — Supabase project URL (defaults to NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY — service role key
 */

export const runtime = 'nodejs';

/* ─────────────────────── Helpers ─────────────────────── */

function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_SERVICE_ROLE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !url.startsWith('http')) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    // Constant-time-ish comparison — both are hex strings of the same length.
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.warn('[razorpay-webhook] signature verify error:', err);
    return false;
  }
}

/** Finds a pending purchase_intent by Razorpay payment_link_id or payment_id. */
async function findPendingIntent(supabase: ReturnType<typeof getSupabaseAdmin>, payload: {
  paymentId?: string;
  paymentLinkId?: string;
  notes?: Record<string, string>;
}) {
  // 1. Try the intent_id from notes (most reliable — set when we created the PI)
  const intentIdFromNotes = payload.notes?.intent_id || payload.notes?.purchase_intent_id;
  if (intentIdFromNotes) {
    const { data, error } = await supabase!
      .from('purchase_intents')
      .select('*')
      .eq('id', intentIdFromNotes)
      .maybeSingle();
    if (!error && data) return data;
  }

  // 2. Try matching by razorpay_link (payment link reference)
  if (payload.paymentLinkId) {
    const { data, error } = await supabase!
      .from('purchase_intents')
      .select('*')
      .eq('razorpay_link', payload.paymentLinkId)
      .eq('status', 'pending')
      .maybeSingle();
    if (!error && data) return data;
  }

  return null;
}

async function findOrCreateGatheringCohort(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  track: string,
  level: string,
  ratio: string
): Promise<string | null> {
  // Find existing gathering cohort
  const { data: existing } = await supabase
    .from('cohorts')
    .select('id, max_capacity')
    .eq('track', track)
    .eq('level', level)
    .eq('ratio', ratio)
    .eq('status', 'gathering')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Otherwise create one
  const maxCapacity = ratio === '1:1' ? 1 : 4;
  const { data: created, error } = await supabase
    .from('cohorts')
    .insert({
      track,
      level,
      ratio,
      max_capacity: maxCapacity,
      status: 'gathering',
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[razorpay-webhook] createCohort error:', error.message);
    return null;
  }
  return created?.id ?? null;
}

async function handlePaymentCaptured(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  payload: { paymentId?: string; paymentLinkId?: string; notes?: Record<string, string> }
): Promise<{ ok: boolean; reason?: string }> {
  const intent = await findPendingIntent(supabase, payload);
  if (!intent) {
    return { ok: false, reason: 'No matching pending purchase intent' };
  }
  if (intent.status !== 'pending') {
    // Already processed — idempotent success
    return { ok: true, reason: 'Intent already processed' };
  }

  // Find or create gathering cohort
  const cohortId = await findOrCreateGatheringCohort(
    supabase,
    intent.track,
    intent.level,
    intent.ratio
  );
  if (!cohortId) {
    return { ok: false, reason: 'Failed to find or create cohort' };
  }

  // Create enrollment
  const { error: enrollErr } = await supabase.from('enrollments').insert({
    user_id: intent.user_id,
    track: intent.track,
    level: intent.level,
    ratio: intent.ratio,
    status: 'active',
    cohort_id: cohortId,
    started_at: new Date().toISOString(),
  });

  if (enrollErr) {
    console.warn('[razorpay-webhook] insert enrollment error:', enrollErr.message);
    return { ok: false, reason: enrollErr.message };
  }

  // Mark intent confirmed
  const { error: piErr } = await supabase
    .from('purchase_intents')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', intent.id);

  if (piErr) {
    console.warn('[razorpay-webhook] update intent error:', piErr.message);
    // Enrollment was created — leave intent as-is; ops can reconcile.
  }

  // Drop a notification for the student (best-effort)
  try {
    await supabase.from('notifications').insert({
      user_id: intent.user_id,
      type: 'enrollment_confirmed',
      title: 'You’re in! 🎉',
      message: 'Your enrollment was confirmed. Check your dashboard for cohort details.',
      link: '/dashboard/student',
    });
  } catch {
    /* non-fatal */
  }

  return { ok: true };
}

async function handlePaymentFailed(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  payload: { paymentId?: string; paymentLinkId?: string; notes?: Record<string, string> }
): Promise<{ ok: boolean; reason?: string }> {
  const intent = await findPendingIntent(supabase, payload);
  if (!intent) {
    return { ok: false, reason: 'No matching pending purchase intent' };
  }
  if (intent.status !== 'pending') {
    return { ok: true, reason: 'Intent already processed' };
  }

  const { error } = await supabase
    .from('purchase_intents')
    .update({ status: 'expired' })
    .eq('id', intent.id);

  if (error) {
    console.warn('[razorpay-webhook] mark expired error:', error.message);
    return { ok: false, reason: error.message };
  }

  // Best-effort notification
  try {
    await supabase.from('notifications').insert({
      user_id: intent.user_id,
      type: 'enrollment_rejected',
      title: 'Payment failed',
      message: 'Your payment could not be processed. Please try again or contact support.',
      link: '/pricing',
    });
  } catch {
    /* non-fatal */
  }

  return { ok: true };
}

/* ─────────────────────── POST /api/razorpay/webhook ─────────────────────── */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const supabase = getSupabaseAdmin();

  // Gracefully no-op if env vars missing
  if (!secret || !supabase) {
    console.warn(
      '[razorpay-webhook] Missing RAZORPAY_WEBHOOK_SECRET or SUPABASE_SERVICE_ROLE_KEY — no-op.'
    );
    return NextResponse.json({ received: true, ok: false, reason: 'not_configured' }, { status: 200 });
  }

  // ── IP blocklist — instantly 403 known abusers ────────────────────
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Rate limit: 60 webhook calls / minute per source IP ────────────
  // Razorpay retries on non-2xx responses, so we need some headroom.
  // Signature verification is the real trust anchor; this just blocks
  // outright flood attacks from a single IP.
  const rl = rateLimit({
    key: `webhook:${ip}`,
    limit: 60,
    windowMs: 60_000,
    ip,
  });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Webhook flood — retrying later.');
  }

  // Get raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  if (!verifyRazorpaySignature(rawBody, signature, secret)) {
    console.warn('[razorpay-webhook] Invalid signature — rejecting.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Parse the body
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.warn('[razorpay-webhook] Invalid JSON body:', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = (body as { event?: string })?.event ?? '';
  const payload = (body as { payload?: { payment?: { entity?: Record<string, unknown> } } })?.payload
    ?.payment?.entity ?? {};

  const paymentId = (payload as { id?: string })?.id ?? undefined;
  const paymentLinkId = (payload as { payment_link_id?: string })?.payment_link_id ?? undefined;
  const notes = (payload as { notes?: Record<string, string> })?.notes ?? undefined;

  try {
    if (event === 'payment.captured') {
      const result = await handlePaymentCaptured(supabase, { paymentId, paymentLinkId, notes });
      return NextResponse.json({ received: true, ok: result.ok, reason: result.reason }, { status: 200 });
    }

    if (event === 'payment.failed') {
      const result = await handlePaymentFailed(supabase, { paymentId, paymentLinkId, notes });
      return NextResponse.json({ received: true, ok: result.ok, reason: result.reason }, { status: 200 });
    }

    // Unhandled event — acknowledge so Razorpay doesn't retry forever
    return NextResponse.json({ received: true, ok: true, reason: `unhandled_event:${event}` }, { status: 200 });
  } catch (err) {
    console.error('[razorpay-webhook] handler exception:', err);
    return NextResponse.json({ received: true, ok: false, reason: 'exception' }, { status: 200 });
  }
}

/* ─────────────────────── GET /api/razorpay/webhook ───────────────────────
   Status endpoint — used by ops / super-admin dashboards to verify the
   webhook is reachable + correctly configured. */
export async function GET() {
  const hasSecret = !!process.env.RAZORPAY_WEBHOOK_SECRET;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({
    name: 'Sariro Razorpay Webhook',
    version: '1.0.0',
    configured: hasSecret && hasServiceKey,
    config: {
      webhookSecret: hasSecret ? 'set' : 'missing',
      serviceRoleKey: hasServiceKey ? 'set' : 'missing',
    },
    events: ['payment.captured', 'payment.failed'],
    endpoint: 'POST /api/razorpay/webhook',
  });
}
