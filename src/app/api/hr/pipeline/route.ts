import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { sellerMetrics, type MetricLead, type MetricSale } from '@/lib/seller/metrics';
import { readIncentiveConfig, baseSalary, describeTiers } from '@/lib/seller/incentives';
import { syncSellerIncentive } from '@/lib/seller/incentive-sync';
import { SELLER_PAYMENT_STATUSES, monthLabel } from '@/lib/seller/payout';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';
import { isMissingRelation, SELLER_SETUP_MESSAGE } from '@/lib/supabase/schema-gaps';

/**
 * SARIRO — HR's half of the sales pipeline
 * ============================================================================
 * GET  /api/hr/pipeline    what is waiting: invoices to raise, incentives to
 *                          decide, seller settlements to approve and pay, and
 *                          how every seller is doing
 * POST /api/hr/pipeline    { action: 'set_base_salary' | 'decide_incentive'
 *                                    | 'resync_incentive' | 'mark_settlement' }
 *
 * ── One request, because it is one screen ───────────────────────────────────
 * HR's question in the morning is "what needs me today", and the answer spans
 * four tables. Four endpoints would render the page in four stages and let a
 * badge disagree with the list under it.
 *
 * ── Everything HR needs to invoice, without opening the lead ────────────────
 * The seller has already had the conversation. What HR needs is the family's
 * name, how to reach them, what they agreed to buy, who sold it and what the
 * trial said — and having to click through to assemble that is how an invoice
 * ends up raised against the wrong course.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

const SELLER_COLS =
  'id, full_name, email, role, is_seller, reporting_admin_id, reporting_hr_id, ' +
  'admin:reporting_admin_id(full_name), hr:reporting_hr_id(full_name)';

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'hr-pipeline',
    limit: 120,
    allow: ['super_admin', 'admin', 'hr'],
    skipOriginCheck: true,
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const [waitingRes, incentivesRes, sellersRes, settingsRes, settlementsRes] = await Promise.all([
    /* Sales the seller has closed and HR has not yet invoiced. */
    actor.admin
      .from('student_leads')
      .select(
        'id, student_name, parent_name, email, phone, phone_country_code, country, ' +
        'subject, grade, sale_value, assigned_seller, stage, sale_stage, trial_status, ' +
        'booking_id, student_id, last_updated, created_at, seller:assigned_seller(full_name, email)'
      )
      .eq('sale_stage', 'ready_for_hr')
      .order('last_updated', { ascending: true })
      .limit(200),
    actor.admin
      .from('seller_incentive_requests')
      .select(
        'id, seller_id, kind, month_key, sales_count, tier_sales, amount, status, reason, breakdown, ' +
        'decided_at, notes, created_at, settlement_id, seller:seller_id(full_name, email)'
      )
      .order('created_at', { ascending: false })
      .limit(200),
    actor.admin
      .from('profiles')
      .select(`${SELLER_COLS}, seller_base_salary`)
      .or('role.eq.seller,is_seller.eq.true')
      .limit(100),
    actor.admin.from('app_settings').select('key, value').like('key', 'seller_%'),
    actor.admin
      .from('seller_settlements')
      .select(
        'id, seller_id, period_month, base_amount, incentive_amount, incentive_count, total_amount, ' +
        'settlement_type, auto_reason, payment_status, settled_at, approved_at, paid_at, seller:seller_id(full_name)'
      )
      .order('period_month', { ascending: false })
      .order('settled_at', { ascending: false })
      .limit(100),
  ]);

  /* The base-salary column arrives with the migration. Until then the seller
     list is still worth showing — without the column rather than without the
     sellers. */
  let sellers = (sellersRes.data ?? []) as unknown as Row[];
  if (sellersRes.error && isMissingRelation(sellersRes.error)) {
    const fallback = await actor.admin
      .from('profiles').select(SELLER_COLS).or('role.eq.seller,is_seller.eq.true').limit(100);
    sellers = (fallback.data ?? []) as unknown as Row[];
  }

  const setupMissing = [waitingRes.error, incentivesRes.error, settlementsRes.error].some(isMissingRelation);
  const settings = (settingsRes.data ?? []) as { key: string; value: string | null }[];
  const sellerIds = sellers.map((s) => s.id as string);

  /* Metrics for every seller in one pair of reads rather than one pair each.
     With one seller today that is a nicety; with ten it is the difference
     between a screen that opens and one that times out. */
  const [{ data: allLeads }, { data: allSales }] = await Promise.all([
    sellerIds.length
      ? actor.admin
          .from('student_leads')
          .select('id, assigned_seller, stage, trial_status, created_at, booking_id')
          .in('assigned_seller', sellerIds)
          .limit(5000)
      : Promise.resolve({ data: [] as MetricLead[] }),
    sellerIds.length
      ? actor.admin
          .from('sales')
          .select('id, seller_id, amount, punched_at, refunded_at')
          .in('seller_id', sellerIds)
          .limit(5000)
      : Promise.resolve({ data: [] as MetricSale[] }),
  ]);

  const groupBy = <T,>(rows: readonly T[], keyOf: (row: T) => string | null | undefined) => {
    const out = new Map<string, T[]>();
    for (const row of rows) {
      const key = keyOf(row);
      if (!key) continue;
      const list = out.get(key);
      if (list) list.push(row);
      else out.set(key, [row]);
    }
    return out;
  };

  const leadsBySeller = groupBy((allLeads ?? []) as MetricLead[], (l) => l.assigned_seller);
  const salesBySeller = groupBy((allSales ?? []) as MetricSale[], (s) => s.seller_id);
  const config = readIncentiveConfig(settings);

  const sellerRows = sellers.map((s) => {
    const id = s.id as string;
    const own = s.seller_base_salary;
    return {
      id,
      name: (s.full_name as string | null) ?? (s.email as string | null) ?? 'Unnamed',
      email: (s.email as string | null) ?? null,
      baseSalary: baseSalary(own == null ? null : Number(own), settings),
      /* Null means "on the company default". Shown differently from a seller
         who has been deliberately set to the same figure, because raising the
         default should move the first and not the second. */
      ownSalarySet: own != null,
      /* Who this seller reports to — the HR named here is the one their payout
         and incentive notifications go to. */
      adminName: (s.admin as { full_name?: string | null } | null)?.full_name ?? null,
      hrName: (s.hr as { full_name?: string | null } | null)?.full_name ?? null,
      metrics: sellerMetrics(leadsBySeller.get(id) ?? [], salesBySeller.get(id) ?? []),
    };
  });

  return NextResponse.json({
    ok: true,
    setupMissing,
    setupMessage: setupMissing ? SELLER_SETUP_MESSAGE : null,
    waitingForInvoice: waitingRes.data ?? [],
    incentives: incentivesRes.data ?? [],
    settlements: settlementsRes.data ?? [],
    sellers: sellerRows,
    config,
    tiersDescription: describeTiers(config),
  });
}

interface Body {
  action?: 'set_base_salary' | 'decide_incentive' | 'resync_incentive' | 'mark_settlement';
  sellerId?: string;
  amount?: number | null;
  requestId?: string;
  decision?: 'approved' | 'rejected';
  notes?: string;
  monthKey?: string;
  settlementId?: string;
  paymentStatus?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'hr-pipeline-write',
    limit: 40,
    allow: ['super_admin', 'admin', 'hr'],
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  /* ── A seller's base pay ────────────────────────────────────────────────── */
  if (body.action === 'set_base_salary') {
    const sellerId = (body.sellerId ?? '').trim();
    if (!sellerId) return NextResponse.json({ ok: false, error: 'missing_seller' }, { status: 400 });

    const amount = Number(body.amount);
    /* Null clears it back to the company default, which is a real intention
       and not the same as setting it to the default's current value. */
    const clearing = body.amount === null || body.amount === undefined;
    if (!clearing && (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000)) {
      return NextResponse.json(
        { ok: false, error: 'bad_amount', message: 'Enter a monthly figure in rupees, or clear it to use the company default.' },
        { status: 400 }
      );
    }

    const { data: before } = await actor.admin
      .from('profiles').select('seller_base_salary, full_name').eq('id', sellerId).maybeSingle();

    const { error } = await actor.admin
      .from('profiles')
      .update({ seller_base_salary: clearing ? null : amount })
      .eq('id', sellerId);

    if (error) {
      console.warn('[hr-pipeline] base salary update failed:', error.code, error.message);
      return NextResponse.json(
        { ok: false, error: 'save_failed', message: isMissingRelation(error) ? SELLER_SETUP_MESSAGE : error.message },
        { status: isMissingRelation(error) ? 503 : 500 }
      );
    }

    /* Somebody's pay changed. That belongs in the admin audit log, which is
       where "a person with power did something" already lives. */
    await bestEffort(
      'hr-pipeline: audit base salary',
      actor.admin.from('admin_audit_logs').insert({
        admin_id: actor.id,
        action: 'seller_base_salary_changed',
        target_type: 'profile',
        target_id: sellerId,
        metadata: {
          from: (before as { seller_base_salary?: number | null } | null)?.seller_base_salary ?? null,
          to: clearing ? null : amount,
          seller: (before as { full_name?: string | null } | null)?.full_name ?? null,
        },
      })
    );

    return NextResponse.json({ ok: true, sellerId, baseSalary: clearing ? null : amount });
  }

  /* ── Approve or reject an incentive — earned or asked for ───────────────── */
  if (body.action === 'decide_incentive') {
    const requestId = (body.requestId ?? '').trim();
    const decision = body.decision;
    if (!requestId || (decision !== 'approved' && decision !== 'rejected')) {
      return NextResponse.json({ ok: false, error: 'invalid_decision' }, { status: 400 });
    }

    const { data: request } = await actor.admin
      .from('seller_incentive_requests')
      .select('id, seller_id, month_key, amount, status, kind')
      .eq('id', requestId)
      .maybeSingle();
    if (!request) return NextResponse.json({ ok: false, error: 'request_not_found' }, { status: 404 });

    if (request.status !== 'pending') {
      return NextResponse.json({ ok: true, already: request.status, message: `That was already ${request.status}.` });
    }

    /* Guarded on still being pending, so two HR users cannot both decide it
       and disagree about the answer. */
    const { data: decided, error } = await actor.admin
      .from('seller_incentive_requests')
      .update({
        status: decision,
        decided_by: actor.id,
        decided_at: new Date().toISOString(),
        notes: (body.notes ?? '').trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'pending')
      .select('id, seller_id, month_key, amount')
      .maybeSingle();

    if (error) {
      console.warn('[hr-pipeline] incentive decision failed:', error.code, error.message);
      return NextResponse.json({ ok: false, error: 'save_failed', message: error.message }, { status: 500 });
    }
    if (!decided) return NextResponse.json({ ok: true, already: 'raced' });

    await recordEvent(actor.admin, {
      event: 'incentive.decided',
      subjectType: 'seller_month',
      subjectId: decided.seller_id as string,
      actorId: actor.id,
      payload: { monthKey: decided.month_key, amount: Number(decided.amount), decision, kind: request.kind ?? 'tier' },
    });

    const note = (body.notes ?? '').trim();
    await bestEffort(
      'hr-pipeline: tell the seller',
      actor.admin.from('notifications').insert({
        user_id: decided.seller_id as string,
        type: 'incentive_decided',
        title: decision === 'approved' ? 'Your incentive is approved' : 'Your incentive was not approved',
        message:
          decision === 'approved'
            ? `₹${Number(decided.amount).toLocaleString('en-IN')} for ${monthLabel(decided.month_key as string)} joins your next settlement.`
            : `HR did not approve the ${monthLabel(decided.month_key as string)} incentive.${note ? ` Reason: ${note}` : ''}`,
        link: '/dashboard/seller?tab=payout',
      })
    );

    return NextResponse.json({ ok: true, requestId, decision, amount: Number(decided.amount) });
  }

  /* ── Recompute, for a month HR wants to be sure about ───────────────────── */
  if (body.action === 'resync_incentive') {
    const sellerId = (body.sellerId ?? '').trim();
    if (!sellerId) return NextResponse.json({ ok: false, error: 'missing_seller' }, { status: 400 });

    /* "2026-08" → an instant inside that month. Mid-month on purpose, so no
       timezone boundary can push it into a neighbour. */
    const at = /^\d{4}-\d{2}$/.test(body.monthKey ?? '')
      ? Date.parse(`${body.monthKey}-15T12:00:00Z`)
      : Date.now();

    const result = await syncSellerIncentive(actor.admin, sellerId, at);
    return NextResponse.json({ ok: true, ...result });
  }

  /* ── Move a seller's settlement towards paid ─────────────────────────────
     Forward only. A settlement marked paid that then drifts back to
     "approved" is a payment that happened in the bank and un-happened on the
     screen, and the seller is the one who notices. */
  if (body.action === 'mark_settlement') {
    const settlementId = (body.settlementId ?? '').trim();
    const next = body.paymentStatus ?? '';
    const order = SELLER_PAYMENT_STATUSES as readonly string[];
    if (!settlementId || !order.includes(next) || next === 'seller_settled') {
      return NextResponse.json({ ok: false, error: 'invalid_status' }, { status: 400 });
    }

    const { data: current, error: readErr } = await actor.admin
      .from('seller_settlements')
      .select('id, seller_id, period_month, total_amount, payment_status')
      .eq('id', settlementId)
      .maybeSingle();
    if (readErr) {
      return NextResponse.json(
        { ok: false, error: 'read_failed', message: isMissingRelation(readErr) ? SELLER_SETUP_MESSAGE : readErr.message },
        { status: isMissingRelation(readErr) ? 503 : 500 }
      );
    }
    if (!current) return NextResponse.json({ ok: false, error: 'settlement_not_found' }, { status: 404 });

    if (order.indexOf(next) <= order.indexOf(current.payment_status as string)) {
      return NextResponse.json({ ok: true, already: current.payment_status });
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { payment_status: next, updated_at: now };
    if (next === 'admin_settled' || next === 'processing' || next === 'paid') {
      patch.approved_by = actor.id;
      patch.approved_at = now;
    }
    if (next === 'paid') patch.paid_at = now;

    const { error } = await actor.admin
      .from('seller_settlements')
      .update(patch)
      .eq('id', settlementId)
      .eq('payment_status', current.payment_status as string);
    if (error) {
      console.warn('[hr-pipeline] settlement update failed:', error.code, error.message);
      return NextResponse.json({ ok: false, error: 'save_failed', message: error.message }, { status: 500 });
    }

    await bestEffort(
      'hr-pipeline: audit settlement',
      actor.admin.from('admin_audit_logs').insert({
        admin_id: actor.id,
        action: `seller_settlement_${next}`,
        target_type: 'seller_settlement',
        target_id: settlementId,
        metadata: { from: current.payment_status, to: next, month: current.period_month, total: Number(current.total_amount) },
      })
    );

    const month = monthLabel(current.period_month as string);
    const total = `₹${Number(current.total_amount).toLocaleString('en-IN')}`;
    await bestEffort(
      'hr-pipeline: tell the seller about their settlement',
      actor.admin.from('notifications').insert({
        user_id: current.seller_id as string,
        type: 'seller_settlement',
        title: next === 'paid' ? `Your ${month} pay has been sent` : `HR approved your ${month} settlement`,
        message: next === 'paid'
          ? `${total} for ${month} is marked paid.`
          : `${total} for ${month} is approved${next === 'processing' ? ' and the payment is on its way' : ''}.`,
        link: '/dashboard/seller?tab=payout',
      })
    );

    return NextResponse.json({ ok: true, settlementId, paymentStatus: next });
  }

  return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
}
