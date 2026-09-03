import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { describeSettlement, isAutoSettleDue } from '@/lib/dashboard/settlement-period';
import { settleMonthForTeacher } from '@/lib/dashboard/settle-month';

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
// The stage a fresh settlement enters at lives in lib/dashboard/settle-month.ts,
// which is the single writer of these rows.

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

  /* §42 — settle the closed month if the 5th has passed and the teacher never
     did. Done on read as well as from the cron endpoint: a scheduler that is
     mis-configured, paused or simply not wired yet must not turn into a teacher
     who never gets paid. settleMonthForTeacher is idempotent, so the two paths
     racing is harmless. */
  const cycle = describeSettlement();
  if (isAutoSettleDue(cycle.settling)) {
    await settleMonthForTeacher(admin, userId, cycle.settling, { type: 'auto' });
  }

  const [earningsRes, settlementsRes, incentivesRes, ratesRes, profileRes] = await Promise.all([
    admin.from('teacher_earnings').select('*').eq('teacher_id', userId).order('class_date', { ascending: false }),
    admin.from('teacher_settlements').select('*').eq('teacher_id', userId).order('requested_at', { ascending: false }),
    admin.from('teacher_incentives').select('*').eq('teacher_id', userId).order('requested_at', { ascending: false }),
    // §35 — the rates come from the same function the earnings trigger reads,
    // so what a teacher is shown cannot drift from what they are paid.
    admin.rpc('teacher_pay_rates'),
    admin.from('profiles').select('teacher_tier').eq('id', userId).maybeSingle(),
  ]);

  if (earningsRes.error || settlementsRes.error || incentivesRes.error) {
    const msg = earningsRes.error?.message || settlementsRes.error?.message || incentivesRes.error?.message;
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: msg }, { status: 500 });
  }

  /* §23, §82 — "Never show only 'Penalty ₹300'. Show the exact source."
     An earning row knows its booking but not its batch, so a teacher looking at
     a deduction could not tell which class it came from. Joined here rather
     than in the client so every consumer of this endpoint gets the same. */
  const earningRows = (earningsRes.data ?? []) as Record<string, unknown>[];
  const bookingIds = [...new Set(earningRows.map((e) => e.booking_id).filter(Boolean) as string[])];

  let enriched = earningRows;
  if (bookingIds.length) {
    const { data: bookings } = await admin
      .from('bookings')
      .select('id, cohort_id, slot_start, module_num, lesson_name')
      .in('id', bookingIds);
    const bookingById = new Map(((bookings ?? []) as Record<string, unknown>[]).map((b) => [b.id as string, b]));

    const cohortIds = [...new Set(((bookings ?? []) as Record<string, unknown>[]).map((b) => b.cohort_id).filter(Boolean) as string[])];
    const { data: cohorts } = cohortIds.length
      ? await admin.from('cohorts').select('id, batch_code, track, level, ratio').in('id', cohortIds)
      : { data: [] };
    const cohortById = new Map(((cohorts ?? []) as Record<string, unknown>[]).map((c) => [c.id as string, c]));

    enriched = earningRows.map((e) => {
      const b = e.booking_id ? bookingById.get(e.booking_id as string) : null;
      const c = b?.cohort_id ? cohortById.get(b.cohort_id as string) : null;
      return {
        ...e,
        batch_code: (c?.batch_code as string) ?? null,
        cohort_id: (b?.cohort_id as string) ?? null,
        module_num: (b?.module_num as string) ?? null,
        // The earning carries its own lesson_name; the booking's is fresher
        // once lesson identity has been stamped, so it wins when present.
        lesson_name: (b?.lesson_name as string) ?? (e.lesson_name as string) ?? null,
      };
    });
  }

  return NextResponse.json({
    ok: true,
    earnings: enriched,
    settlements: settlementsRes.data ?? [],
    incentives: incentivesRes.data ?? [],
    // §40-42 — which month is being settled, when it opened, when it settles
    // itself. Decided on the server so the countdown a teacher sees does not
    // depend on the clock or timezone of the device they happen to be holding.
    cycle,
    // §34-35 — the tier ladder and what each rung actually pays. Null rates
    // mean scripts/payout-transparency.sql has not been run; the screen then
    // says so rather than inventing a number.
    tier: Number(profileRes.data?.teacher_tier ?? 3),
    rates: ratesRes.error ? null : (ratesRes.data ?? null),
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

  /* ── action: settle ──────────────────────────────────────────────────────
     §41. Settles the closed month only — never "everything pending". Classes
     taught this month belong to this month's settlement, which opens on the
     1st. The old behaviour swept them into the previous month's payout. */
  if (body.action === 'settle') {
    const { settling, state } = describeSettlement();

    if (state === 'waiting') {
      return NextResponse.json(
        { ok: false, error: 'not_open', month: settling.label, opensAt: settling.opensAt },
        { status: 400 }
      );
    }

    const res = await settleMonthForTeacher(admin, userId, settling, { type: 'manual' });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'settle_failed', message: res.message }, { status: 500 });
    }
    if (res.outcome === 'nothing_to_settle') {
      return NextResponse.json({ ok: false, error: 'nothing_to_settle', month: settling.label }, { status: 400 });
    }
    if (res.outcome === 'already_settled') {
      return NextResponse.json({ ok: false, error: 'already_settled', month: settling.label }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      settlement_id: res.settlementId,
      total: res.total,
      classes: res.classes,
      month: settling.label,
    });
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
