import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { sellerMetrics, type MetricLead, type MetricSale } from '@/lib/seller/metrics';
import { readIncentiveConfig, baseSalary, describeTiers } from '@/lib/seller/incentives';
import { syncSellerIncentive } from '@/lib/seller/incentive-sync';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — HR's half of the sales pipeline
 * ============================================================================
 * GET  /api/hr/pipeline    what is waiting: invoices to raise, incentives to
 *                          approve, and how every seller is doing
 * POST /api/hr/pipeline    { action: 'set_base_salary' | 'decide_incentive' }
 *
 * ── One request, because it is one screen ───────────────────────────────────
 * HR's question in the morning is "what needs me today", and the answer spans
 * three tables. Three endpoints would render the page in three stages and let
 * a badge disagree with the list under it.
 *
 * ── Everything HR needs to invoice, without opening the lead ────────────────
 * The seller has already had the conversation. What HR needs is the family's
 * name, how to reach them, what they agreed to buy, who sold it and what the
 * trial said — and having to click through to assemble that is how an invoice
 * ends up raised against the wrong course.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'hr-pipeline',
    limit: 120,
    allow: ['super_admin', 'admin', 'hr'],
    skipOriginCheck: true,
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const [
    { data: waiting },
    { data: incentives },
    { data: sellers },
    { data: settings },
  ] = await Promise.all([
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
      .select('id, seller_id, month_key, sales_count, tier_sales, amount, status, breakdown, decided_at, notes, created_at, seller:seller_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(200),
    actor.admin
      .from('profiles')
      .select('id, full_name, email, seller_base_salary, role, is_seller')
      .or('role.eq.seller,is_seller.eq.true')
      .limit(100),
    actor.admin.from('app_settings').select('key, value').like('key', 'seller_%'),
  ]);

  const sellerIds = (sellers ?? []).map((s) => s.id as string);

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

  const config = readIncentiveConfig(settings ?? []);

  const sellerRows = (sellers ?? []).map((s) => {
    const id = s.id as string;
    const metrics = sellerMetrics(leadsBySeller.get(id) ?? [], salesBySeller.get(id) ?? []);
    const base = baseSalary(s.seller_base_salary as number | null, settings ?? []);
    return {
      id,
      name: (s.full_name as string | null) ?? (s.email as string | null) ?? 'Unnamed',
      email: s.email as string | null,
      baseSalary: base,
      /* Null means "on the company default". Shown differently from a seller
         who has been deliberately set to the same figure, because raising the
         default should move the first and not the second. */
      ownSalarySet: s.seller_base_salary != null,
      metrics,
    };
  });

  return NextResponse.json({
    ok: true,
    waitingForInvoice: waiting ?? [],
    incentives: incentives ?? [],
    sellers: sellerRows,
    config,
    tiersDescription: describeTiers(config),
  });
}

interface Body {
  action?: 'set_base_salary' | 'decide_incentive' | 'resync_incentive';
  sellerId?: string;
  amount?: number;
  requestId?: string;
  decision?: 'approved' | 'rejected';
  notes?: string;
  monthKey?: string;
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
        {
          ok: false,
          error: 'save_failed',
          message: /column|schema cache/i.test(error.message)
            ? 'Seller pay is not set up on the database yet — run scripts/seller-pipeline-and-sale.sql.'
            : error.message,
        },
        { status: 500 }
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
          from: before?.seller_base_salary ?? null,
          to: clearing ? null : amount,
          seller: before?.full_name ?? null,
        },
      })
    );

    return NextResponse.json({ ok: true, sellerId, baseSalary: clearing ? null : amount });
  }

  /* ── Approve or reject an incentive ─────────────────────────────────────── */
  if (body.action === 'decide_incentive') {
    const requestId = (body.requestId ?? '').trim();
    const decision = body.decision;
    if (!requestId || (decision !== 'approved' && decision !== 'rejected')) {
      return NextResponse.json({ ok: false, error: 'invalid_decision' }, { status: 400 });
    }

    const { data: request } = await actor.admin
      .from('seller_incentive_requests')
      .select('id, seller_id, month_key, amount, status')
      .eq('id', requestId)
      .maybeSingle();
    if (!request) return NextResponse.json({ ok: false, error: 'request_not_found' }, { status: 404 });

    if (request.status !== 'pending') {
      return NextResponse.json(
        { ok: true, already: request.status, message: `That was already ${request.status}.` }
      );
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
      payload: { monthKey: decided.month_key, amount: Number(decided.amount), decision },
    });

    await bestEffort(
      'hr-pipeline: tell the seller',
      actor.admin.from('notifications').insert({
        user_id: decided.seller_id as string,
        type: 'incentive_decided',
        title: decision === 'approved' ? 'Your incentive is approved' : 'Your incentive was not approved',
        message:
          decision === 'approved'
            ? `₹${Number(decided.amount).toLocaleString('en-IN')} for ${decided.month_key} will be in your payroll.`
            : `HR did not approve the ${decided.month_key} incentive.${(body.notes ?? '').trim() ? ` Reason: ${(body.notes ?? '').trim()}` : ''}`,
        link: '/dashboard/seller',
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

  return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
}
