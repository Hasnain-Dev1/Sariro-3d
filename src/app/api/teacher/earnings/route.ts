import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — /api/teacher/earnings
 *
 * GET  → the authenticated teacher's earnings + settlements + incentives.
 * POST → teacher-initiated actions:
 *          { action: 'settle' }                       — bundle all PENDING earnings
 *                                                        into a settlement request.
 *          { action: 'request_incentive', amount, reason }
 *
 * Security:
 *   - Auth-gate: must be signed in; every query is scoped to user.id, so a
 *     teacher can only ever see/act on their OWN rows.
 *   - Reads/writes use the service-role client (bypasses RLS) but are always
 *     filtered by the authenticated user's id — never by client-supplied id.
 *   - POST: same-origin (CSRF) + IP blocklist + rate limit.
 */

export const runtime = 'nodejs';

// Settlement payment pipeline — must match the HR dashboard.
// not_settled → teacher_settled → admin_settled → processing → paid
const TEACHER_SETTLED = 'teacher_settled';

async function getAuthedUserId(): Promise<string | null> {
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/* ─────────────────────────── GET ─────────────────────────── */
export async function GET() {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }

  const [earningsRes, settlementsRes, incentivesRes] = await Promise.all([
    admin.from('teacher_earnings').select('*').eq('teacher_id', userId).order('class_date', { ascending: false }),
    admin.from('teacher_settlements').select('*').eq('teacher_id', userId).order('requested_at', { ascending: false }),
    admin.from('teacher_incentives').select('*').eq('teacher_id', userId).order('requested_at', { ascending: false }),
  ]);

  if (earningsRes.error || settlementsRes.error || incentivesRes.error) {
    const msg = earningsRes.error?.message || settlementsRes.error?.message || incentivesRes.error?.message;
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: msg }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    earnings: earningsRes.data ?? [],
    settlements: settlementsRes.data ?? [],
    incentives: incentivesRes.data ?? [],
  });
}

/* ─────────────────────────── POST ────────────────────────── */
interface PostBody {
  action?: 'settle' | 'request_incentive';
  amount?: number;
  reason?: string;
}

export async function POST(req: NextRequest) {
  // CSRF
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }
  // IP blocklist
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  // Rate limit per teacher (20 finance actions / min).
  const rl = rateLimit({ key: `teacher-earnings:${userId}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests. Please wait a moment.');

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }

  /* ── action: settle ── */
  if (body.action === 'settle') {
    // Gather this teacher's PENDING, not-yet-settled earnings.
    const { data: pending, error: pErr } = await admin
      .from('teacher_earnings')
      .select('id, net_amount, amount, class_date')
      .eq('teacher_id', userId)
      .eq('status', 'pending')
      .is('settlement_id', null);

    if (pErr) {
      return NextResponse.json({ ok: false, error: 'fetch_failed', message: pErr.message }, { status: 500 });
    }
    if (!pending || pending.length === 0) {
      return NextResponse.json({ ok: false, error: 'nothing_to_settle' }, { status: 400 });
    }

    const total = pending.reduce((sum, e) => sum + Number(e.net_amount ?? e.amount ?? 0), 0);
    const dates = pending.map((e) => new Date(e.class_date).getTime()).filter((t) => !isNaN(t));
    const periodStart = dates.length ? new Date(Math.min(...dates)).toISOString() : new Date().toISOString();
    const periodEnd = dates.length ? new Date(Math.max(...dates)).toISOString() : new Date().toISOString();

    // 1. Create the settlement request.
    const { data: settlement, error: sErr } = await admin
      .from('teacher_settlements')
      .insert({
        teacher_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        total_classes: pending.length,
        total_amount: total,
        status: 'requested',
        payment_status: TEACHER_SETTLED,
        requested_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (sErr || !settlement) {
      return NextResponse.json({ ok: false, error: 'settle_failed', message: sErr?.message }, { status: 500 });
    }

    // 2. Attach those earnings to the settlement + flip to 'settled'.
    const { error: uErr } = await admin
      .from('teacher_earnings')
      .update({ status: 'settled', settlement_id: settlement.id, settled_at: new Date().toISOString() })
      .in('id', pending.map((e) => e.id));

    if (uErr) {
      // Best-effort rollback of the settlement row so we don't strand it.
      await admin.from('teacher_settlements').delete().eq('id', settlement.id);
      return NextResponse.json({ ok: false, error: 'settle_link_failed', message: uErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, settlement_id: settlement.id, total, classes: pending.length });
  }

  /* ── action: request_incentive ── */
  if (body.action === 'request_incentive') {
    const amount = Number(body.amount);
    const reason = (body.reason ?? '').trim();
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ ok: false, error: 'invalid_amount' }, { status: 400 });
    }
    if (reason.length < 3 || reason.length > 500) {
      return NextResponse.json({ ok: false, error: 'invalid_reason' }, { status: 400 });
    }

    const { data: incentive, error: iErr } = await admin
      .from('teacher_incentives')
      .insert({
        teacher_id: userId,
        amount,
        reason,
        status: 'requested',
        requested_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (iErr) {
      return NextResponse.json({ ok: false, error: 'incentive_failed', message: iErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, incentive_id: incentive?.id });
  }

  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
}
