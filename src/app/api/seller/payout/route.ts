import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { describeSettlement, isAutoSettleDue } from '@/lib/dashboard/settlement-period';
import { monthWindow } from '@/lib/leads/seller-assignment';
import { computeIncentive, readIncentiveConfig, baseSalary, saleBonus } from '@/lib/seller/incentives';
import { previewSettlement, isBeforeStart, monthLabel, type PayoutRequest } from '@/lib/seller/payout';
import { settleMonthForSeller, hrRecipientsFor } from '@/lib/seller/settle';
import { isMissingRelation, SELLER_SETUP_MESSAGE } from '@/lib/supabase/schema-gaps';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — a seller's pay, shown the way it is worked out
 * ============================================================================
 * GET  /api/seller/payout[?sellerId=…]   base, this month's incentive, every
 *                                        request and settlement, and what
 *                                        pressing Settle would produce
 * POST /api/seller/payout                { action: 'settle' | 'request_incentive' }
 *
 * ── Why the whole breakdown, not a total ────────────────────────────────────
 * A seller told "₹17,200" cannot check it. A seller shown fifteen sales, the
 * tier they reached, which two sales carried a value bonus and which request
 * HR has not approved yet can — and can say exactly which line they disagree
 * with. The incentive rules here have one deliberately asymmetric boundary and
 * two traps that cost real money; showing the working is how either gets
 * caught by the person it would cost.
 *
 * ── The 5th is honoured here too ────────────────────────────────────────────
 * The schedule settles every seller at 10:00 IST on the 5th. If it did not run
 * — a paused project, a disabled extension — opening this screen settles the
 * seller's closed month instead, through the same idempotent function. Two
 * independent paths to one operation, the same arrangement teacher earnings
 * already rely on.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SellerProfile { id: string; full_name: string | null; role: string | null; is_seller: boolean | null }
const isSellerProfile = (p: SellerProfile | null): p is SellerProfile =>
  !!p && (p.role === 'seller' || p.is_seller === true);

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'seller-payout',
    limit: 120,
    allow: ['super_admin', 'admin', 'hr', 'seller'],
    skipOriginCheck: true,
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  /* A seller sees their own. HR and staff may open anybody's, which is what
     lets HR answer "why was I paid this" with the same screen the seller sees. */
  const requested = req.nextUrl.searchParams.get('sellerId');
  const canViewOthers = actor.isStaff || actor.isHR;
  if (requested && requested !== actor.id && !canViewOthers) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const sellerId = requested && canViewOthers ? requested : actor.id;

  const { data: person } = await actor.admin
    .from('profiles')
    .select('id, full_name, role, is_seller')
    .eq('id', sellerId)
    .maybeSingle();
  /* Refused rather than settled. An admin opening this for themselves would
     otherwise be handed a base salary nobody agreed to pay them. */
  if (!isSellerProfile(person as SellerProfile | null)) {
    return NextResponse.json(
      { ok: false, error: 'not_a_seller', message: 'Payouts are for sellers — this account is not one.' },
      { status: 404 }
    );
  }

  const cycle = describeSettlement();

  /* The backup path for the 5th. Before the reads, so the screen shows the
     settlement it just made rather than the state from a moment earlier. */
  let autoSettled: { month: string; total: number } | null = null;
  if (isAutoSettleDue(cycle.settling)) {
    const r = await settleMonthForSeller(actor.admin, sellerId, cycle.settling, { type: 'auto' });
    if (r.ok && r.outcome === 'settled') autoSettled = { month: cycle.settling.label, total: r.total ?? 0 };
  }

  const [salaryRes, settingsRes, salesRes, requestsRes, settlementsRes] = await Promise.all([
    /* Asked on its own. If the column does not exist yet, folding it into the
       profile read above would make every seller look like a non-seller. */
    actor.admin.from('profiles').select('seller_base_salary').eq('id', sellerId).maybeSingle(),
    actor.admin.from('app_settings').select('key, value').like('key', 'seller_%'),
    actor.admin
      .from('sales')
      .select('id, invoice_number, student_name, amount, punched_at, refunded_at')
      .eq('seller_id', sellerId)
      .not('punched_at', 'is', null)
      .order('punched_at', { ascending: false })
      .limit(500),
    actor.admin
      .from('seller_incentive_requests')
      .select('id, kind, month_key, amount, status, reason, notes, sales_count, tier_sales, created_at, decided_at, settlement_id')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(100),
    actor.admin
      .from('seller_settlements')
      .select('id, period_month, base_amount, incentive_amount, total_amount, incentive_count, settlement_type, auto_reason, payment_status, settled_at, paid_at')
      .eq('seller_id', sellerId)
      .order('period_month', { ascending: false })
      .limit(24),
  ]);

  const setupMissing = [salaryRes.error, salesRes.error, requestsRes.error, settlementsRes.error].some(isMissingRelation);

  const settings = (settingsRes.data ?? []) as { key: string; value: string | null }[];
  const config = readIncentiveConfig(settings);
  const own = (salaryRes.data as { seller_base_salary?: number | string | null } | null)?.seller_base_salary ?? null;
  const base = baseSalary(own == null ? null : Number(own), settings);

  /* ── This month, sale by sale ───────────────────────────────────────────── */
  type SaleDb = {
    id: string; invoice_number: string | null; student_name: string | null;
    amount: number | string | null; punched_at: string | null; refunded_at: string | null;
  };
  const from = Date.parse(cycle.accruing.periodStart);
  const to = Date.parse(cycle.accruing.periodEnd);
  const thisMonth = ((salesRes.data ?? []) as SaleDb[]).filter((s) => {
    if (!s.punched_at || s.refunded_at) return false;
    const t = Date.parse(s.punched_at);
    return Number.isFinite(t) && t >= from && t < to;
  });

  const breakdown = computeIncentive(
    thisMonth.map((s) => ({ id: s.id, amount: Number(s.amount) || 0 })),
    config
  );
  const sales = thisMonth.map((s) => {
    const amount = Number(s.amount) || 0;
    /* The same function the total used, so a row can never show a bonus the
       total did not count. */
    const bonus = saleBonus(amount, config);
    return {
      id: s.id,
      invoiceNumber: s.invoice_number,
      studentName: s.student_name,
      amount,
      punchedAt: s.punched_at,
      bonus: bonus.amount,
      bonusBand: bonus.band,
    };
  });

  const requests = (requestsRes.data ?? []) as (PayoutRequest & Record<string, unknown>)[];
  const settlements = (settlementsRes.data ?? []) as { period_month: string }[];
  const startMonth = settings.find((s) => s.key === 'seller_settlement_start_month')?.value ?? null;
  const preview = previewSettlement({ month: cycle.settling.month, base, requests, startMonth });

  return NextResponse.json({
    ok: true,
    setupMissing,
    setupMessage: setupMissing ? SELLER_SETUP_MESSAGE : null,
    sellerName: (person as SellerProfile).full_name ?? null,
    cycle: {
      state: cycle.state,
      headline: cycle.headline,
      daysUntilAuto: cycle.daysUntilAuto,
      settling: {
        month: cycle.settling.month,
        label: cycle.settling.label,
        opensAt: cycle.settling.opensAt,
        autoSettlesAt: cycle.settling.autoSettlesAt,
      },
      accruing: { month: cycle.accruing.month, label: cycle.accruing.label },
    },
    base,
    ownSalarySet: own != null,
    current: { monthKey: cycle.accruing.month, label: cycle.accruing.label, sales, breakdown },
    tiers: config,
    requests,
    settlements,
    settleable: {
      ...preview,
      label: cycle.settling.label,
      alreadySettled: settlements.some((s) => s.period_month === cycle.settling.month),
      startMonth,
      startLabel: startMonth ? monthLabel(startMonth) : null,
    },
    autoSettled,
  });
}

interface Body {
  action?: 'settle' | 'request_incentive';
  amount?: number;
  reason?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'seller-payout-write',
    limit: 20,
    allow: ['super_admin', 'admin', 'hr', 'seller'],
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  /* Checked as a flag, not a role: somebody who is both an admin and a seller
     is labelled 'admin' by requireActor, and is still owed a seller's pay. */
  if (!actor.isSeller) {
    return NextResponse.json(
      { ok: false, error: 'not_a_seller', message: 'Only a seller can settle or request an incentive for themselves.' },
      { status: 403 }
    );
  }

  const parsed = await readJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  /* ── Settle the month that has closed ───────────────────────────────────── */
  if (body.action === 'settle') {
    const cycle = describeSettlement();

    if (cycle.state === 'waiting') {
      return NextResponse.json(
        { ok: false, error: 'not_open', month: cycle.settling.label, message: `${cycle.settling.label} opens for settlement on the 1st.` },
        { status: 400 }
      );
    }

    const { data: startRow } = await actor.admin
      .from('app_settings').select('value').eq('key', 'seller_settlement_start_month').maybeSingle();
    const startMonth = (startRow as { value?: string | null } | null)?.value ?? null;
    if (isBeforeStart(cycle.settling.month, startMonth)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'before_start',
          message: `Seller payouts began in ${monthLabel(startMonth)}. ${cycle.settling.label} was paid outside this system.`,
        },
        { status: 400 }
      );
    }

    const res = await settleMonthForSeller(actor.admin, actor.id, cycle.settling, { type: 'manual' });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: 'settle_failed', message: res.message },
        { status: res.setupMissing ? 503 : 500 }
      );
    }
    if (res.outcome === 'already_settled') {
      return NextResponse.json(
        { ok: false, error: 'already_settled', month: cycle.settling.label, message: `${cycle.settling.label} has already been settled.` },
        { status: 409 }
      );
    }
    if (res.outcome === 'nothing_to_settle') {
      return NextResponse.json(
        { ok: false, error: 'nothing_to_settle', month: cycle.settling.label, message: `Nothing to settle for ${cycle.settling.label}.` },
        { status: 400 }
      );
    }

    for (const hr of await hrRecipientsFor(actor.admin, actor.id)) {
      await bestEffort(
        'seller-payout: tell HR a month was settled',
        actor.admin.from('notifications').insert({
          user_id: hr,
          type: 'seller_settlement',
          title: 'A seller settled their month',
          message: `${actor.fullName ?? 'A seller'} settled ${cycle.settling.label} — ₹${(res.total ?? 0).toLocaleString('en-IN')}. Approve it and mark it paid.`,
          link: '/dashboard/hr',
        })
      );
    }

    return NextResponse.json({
      ok: true,
      month: cycle.settling.label,
      total: res.total,
      base: res.base,
      incentives: res.incentives,
    });
  }

  /* ── Ask HR for an incentive ─────────────────────────────────────────────
     For the things the tiers cannot see: a school deal that took three weeks,
     a family the seller rescued from a refund. The tier entitlement is
     computed and requested automatically; this is the seller's own ask, and
     HR decides it the same way. */
  if (body.action === 'request_incentive') {
    const amount = Number(body.amount);
    const reason = (body.reason ?? '').trim();
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json(
        { ok: false, error: 'invalid_amount', message: 'Enter an amount in rupees, above zero.' },
        { status: 400 }
      );
    }
    if (reason.length < 3 || reason.length > 500) {
      return NextResponse.json(
        { ok: false, error: 'invalid_reason', message: 'Say what it is for — HR decides on the reason.' },
        { status: 400 }
      );
    }

    const { data, error } = await actor.admin
      .from('seller_incentive_requests')
      .insert({
        seller_id: actor.id,
        kind: 'manual',
        month_key: monthWindow().key,
        amount,
        reason,
        requested_by: actor.id,
        status: 'pending',
        sales_count: 0,
        tier_sales: 0,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('[seller-payout] request insert failed:', error.code, error.message);
      const missing = isMissingRelation(error);
      return NextResponse.json(
        { ok: false, error: missing ? 'setup_missing' : 'request_failed', message: missing ? SELLER_SETUP_MESSAGE : error.message },
        { status: missing ? 503 : 500 }
      );
    }

    for (const hr of await hrRecipientsFor(actor.admin, actor.id)) {
      await bestEffort(
        'seller-payout: tell HR about an incentive request',
        actor.admin.from('notifications').insert({
          user_id: hr,
          type: 'incentive_approval',
          title: 'A seller asked for an incentive',
          message: `${actor.fullName ?? 'A seller'} asked for ₹${amount.toLocaleString('en-IN')}: ${reason.slice(0, 140)}`,
          link: '/dashboard/hr',
        })
      );
    }

    return NextResponse.json({ ok: true, requestId: (data as { id?: string } | null)?.id ?? null });
  }

  return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
}
