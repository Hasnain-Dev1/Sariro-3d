import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper } from '@/lib/supabase/server';
import {
  verifyPaymentSignature,
  RAZORPAY_CONFIGURED,
  getSupabaseAdmin,
} from '@/lib/razorpay/server';
import { rateLimit, rateLimitedResponse, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/razorpay/verify
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, intentId }
 *
 * Flow:
 *   1. Auth-gate: must be signed in.
 *   2. Verify the payment signature using RAZORPAY_KEY_SECRET.
 *      → If invalid: return 400, no DB writes.
 *   3. Look up the purchase_intent by `intentId` (from body) OR by
 *      razorpay_link=razorpay_order_id (fallback).
 *      → If not found OR doesn't belong to this user: 404.
 *      → If already 'confirmed': idempotent success.
 *   4. Find or create a 'gathering' cohort for the intent's track+level+ratio.
 *   5. Insert an enrollment (status='active').
 *   6. Update the intent: status='confirmed', confirmed_at=now.
 *   7. Drop a notification for the student.
 *   8. Return { ok: true, enrollmentId } — client redirects to /payment-success.
 *
 * All DB writes go through the service-role admin client (bypasses RLS)
 * because RLS might block cross-user inserts in some configurations.
 *
 * IDEMPOTENCY: if the intent is already 'confirmed', returns success
 * without re-inserting. This handles the case where Razorpay's webhook
 * fires first (defense in depth) and the client verify call arrives later.
 */

export const runtime = 'nodejs';

interface VerifyBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  intentId?: string;
}

interface PurchaseIntentRow {
  id: string;
  user_id: string;
  track: string;
  level: string;
  ratio: string;
  status: string;
  razorpay_link: string | null;
}

async function findOrCreateGatheringCohort(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  track: string,
  level: string,
  ratio: string
): Promise<string | null> {
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

  const maxCapacity = ratio === '1:1' ? 1 : 4;
  const { data: created, error } = await supabase
    .from('cohorts')
    .insert({ track, level, ratio, max_capacity: maxCapacity, status: 'gathering' })
    .select('id')
    .single();
  if (error) {
    console.warn('[verify] createCohort error:', error.message);
    return null;
  }
  return created?.id ?? null;
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
      { ok: false, error: 'razorpay_not_configured' },
      { status: 503 }
    );
  }

  // ── Auth gate ───────────────────────────────────────────────────────
  let userId: string | null = null;
  try {
    const supaServer = await createServerClientHelper();
    const { data: { user } } = await supaServer.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* supabase not configured OR no session — falls through to 401 below */
  }
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  // ── Rate limit: 20 verify attempts / minute per user ───────────────
  // More generous than create-order because retries are common (modal
  // dismissal, network blip, double-click). Signature verify is cheap.
  const rl = rateLimit({
    key: `verify:${userId}`,
    limit: 20,
    windowMs: 60_000,
    ip,
  });
  if (!rl.ok) {
    return rateLimitedResponse(rl.retryAfterMs, 'Too many verify attempts — please slow down.');
  }

  // ── Parse + validate body ───────────────────────────────────────────
  let body: VerifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, intentId } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { ok: false, error: 'missing_signature_params' },
      { status: 400 }
    );
  }

  // ── Verify signature ────────────────────────────────────────────────
  const sigOk = verifyPaymentSignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  if (!sigOk) {
    console.warn('[verify] signature mismatch', {
      order: razorpay_order_id,
      payment: razorpay_payment_id,
      user: userId,
    });
    return NextResponse.json(
      { ok: false, error: 'signature_invalid' },
      { status: 400 }
    );
  }

  // ── Load the purchase_intent ────────────────────────────────────────
  const supaServer = await createServerClientHelper();
  let intent: PurchaseIntentRow | null = null;

  if (intentId) {
    const { data, error } = await supaServer
      .from('purchase_intents')
      .select('id, user_id, track, level, ratio, status, razorpay_link')
      .eq('id', intentId)
      .maybeSingle();
    if (!error && data) intent = data as PurchaseIntentRow;
  }
  if (!intent) {
    // Fallback: match by razorpay_link column (we stored order_id there)
    const { data, error } = await supaServer
      .from('purchase_intents')
      .select('id, user_id, track, level, ratio, status, razorpay_link')
      .eq('razorpay_link', razorpay_order_id)
      .maybeSingle();
    if (!error && data) intent = data as PurchaseIntentRow;
  }
  if (!intent) {
    return NextResponse.json({ ok: false, error: 'intent_not_found' }, { status: 404 });
  }

  // Ownership check — the intent must belong to the authenticated user.
  if (intent.user_id !== userId) {
    console.warn('[verify] intent ownership mismatch', {
      intent_user: intent.user_id,
      auth_user: userId,
    });
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  // Idempotency — already confirmed.
  if (intent.status === 'confirmed') {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      intentId: intent.id,
      message: 'Payment already verified',
    });
  }

  // ── Service-role admin client (bypasses RLS for cohort / enrollment writes) ──
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error('[verify] service-role client unavailable');
    return NextResponse.json(
      { ok: false, error: 'service_unavailable' },
      { status: 500 }
    );
  }

  // ── Find or create cohort ───────────────────────────────────────────
  const cohortId = await findOrCreateGatheringCohort(
    admin,
    intent.track,
    intent.level,
    intent.ratio
  );
  if (!cohortId) {
    return NextResponse.json(
      { ok: false, error: 'cohort_create_failed' },
      { status: 500 }
    );
  }

  // ── Insert enrollment (service-role) ────────────────────────────────
  // Idempotency: check if an enrollment already exists for this user +
  // cohort (e.g. webhook fired first). If so, skip the insert.
  const { data: existingEnrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', intent.user_id)
    .eq('cohort_id', cohortId)
    .neq('status', 'dropped')
    .limit(1)
    .maybeSingle();

  let enrollmentId: string | null = existingEnrollment?.id ?? null;

  if (!enrollmentId) {
    const { data: enrollRow, error: enrollErr } = await admin
      .from('enrollments')
      .insert({
        user_id: intent.user_id,
        track: intent.track,
        level: intent.level,
        ratio: intent.ratio,
        status: 'active',
        cohort_id: cohortId,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (enrollErr || !enrollRow?.id) {
      console.warn('[verify] insert enrollment error:', enrollErr?.message);
      return NextResponse.json(
        { ok: false, error: 'enrollment_create_failed' },
        { status: 500 }
      );
    }
    enrollmentId = enrollRow.id;
  }

  // ── Mark intent confirmed ───────────────────────────────────────────
  const { error: piErr } = await admin
    .from('purchase_intents')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', intent.id);
  if (piErr) {
    console.warn('[verify] update intent error:', piErr.message);
    // non-fatal — enrollment is created, ops can reconcile
  }

  // ── Drop a notification for the student (best-effort) ───────────────
  try {
    await admin.from('notifications').insert({
      user_id: intent.user_id,
      type: 'enrollment_confirmed',
      title: 'You’re in! 🎉',
      message: 'Your enrollment was confirmed. Visit your dashboard to see your cohort.',
      link: '/dashboard/student',
    });
  } catch {
    /* non-fatal */
  }

  return NextResponse.json({
    ok: true,
    intentId: intent.id,
    enrollmentId,
    cohortId,
  });
}

/* ─────────────────────── GET /api/razorpay/verify ────────────────────
   Status endpoint. */
export async function GET() {
  return NextResponse.json({
    name: 'Sariro Razorpay verify',
    configured: RAZORPAY_CONFIGURED,
    hasServiceKey: !!getSupabaseAdmin(),
  });
}
