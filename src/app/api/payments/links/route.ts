import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireActor, readJson } from '@/lib/auth/actor';
import { bestEffort } from '@/lib/supabase/best-effort';
import { loadPriceBook } from '@/lib/pricing/price-book-store';
import { NOT_APPROVED, PLAN_LABEL, isApproved, sellerFloor } from '@/lib/pricing/economics';
import { formatInr } from '@/lib/pricing/inr-site';
import {
  FREQUENCY_LABEL, LINK_EXPIRY_DAYS, RAZORPAY_PERIOD, autopayDescription, autopaySummary, checkLinkRequest, linkDescription, referenceId,
} from '@/lib/payments/link-request';
import { rowFromRazorpayLink, rowFromSubscription, toView, type Creator, type LinkRow } from '@/lib/payments/link-store';
import { createPaymentLink, listPaymentLinks } from '@/lib/razorpay/payment-links';
import { createPlan, createSubscription, listSubscriptions } from '@/lib/razorpay/subscriptions';

/**
 * SARIRO — rupee payment links and autopay links, made from the dashboard
 * ============================================================================
 * POST /api/payments/links   { ratio, months, amount, customerName, phone, email?, leadId?,
 *                              autopay?, frequency?, count? }
 * GET  /api/payments/links   every link made (a seller sees their own), with who made it
 *
 * For a family in India to pay by UPI from a WhatsApp message: sellers, HR,
 * admins and the super admin. A seller may not make a link below the floor
 * for that plan — the same rule as confirming a sale — and may only attach it
 * to a lead on their own desk. Staff can go below the floor, because somebody
 * has to be able to approve the exception.
 *
 * Since 17 Sep 2026:
 *   • autopay — a Razorpay subscription: an amount, how often, how many payments
 *   • every link is recorded in payment_links with who made it
 *     (scripts/payment-links.sql), and the list reads from there
 *   • a seller or HR must have verified their own phone before making one
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOW = ['seller', 'hr', 'admin', 'super_admin'] as const;

/** The table's columns, spelled once. */
const COLUMNS = 'id, kind, razorpay_id, razorpay_plan_id, short_url, status, amount_inr, frequency, total_count, paid_count, amount_paid_inr, ratio, months, description, customer_name, customer_phone, customer_email, lead_id, below_floor, created_by, created_by_role, created_at, cancelled_at, cancelled_by';

const TABLE_MISSING = 'The payment_links table is not set up yet — run scripts/payment-links.sql.';
const isMissingTable = (e: { code?: string } | null) => e?.code === 'PGRST205' || e?.code === '42P01';

/**
 * Bring the table up to date with Razorpay: new statuses and payments for the
 * links it has, and any link Razorpay has that it does not (made before the
 * table, or recorded when a write failed). Best effort — the list still loads
 * from the table if Razorpay cannot be reached.
 */
async function syncFromRazorpay(admin: SupabaseClient): Promise<void> {
  const [links, subs] = await Promise.all([listPaymentLinks(), listSubscriptions()]);
  const { data: existing, error } = await admin.from('payment_links').select('id, razorpay_id, status, paid_count, amount_paid_inr');
  if (error) return;
  const known = new Map((existing ?? []).map((r) => [r.razorpay_id as string, r]));

  const inserts: Record<string, unknown>[] = [];
  const updates: { id: string; patch: Record<string, unknown> }[] = [];

  if (links.ok) {
    for (const l of links.value) {
      const have = known.get(l.id);
      if (!have) { inserts.push(rowFromRazorpayLink(l)); continue; }
      const paidCount = l.status === 'paid' ? 1 : 0;
      if (have.status !== l.status || Number(have.amount_paid_inr) !== l.paid) {
        updates.push({ id: have.id as string, patch: { status: l.status, amount_paid_inr: l.paid, paid_count: paidCount, updated_at: new Date().toISOString() } });
      }
    }
  }
  if (subs.ok) {
    for (const s of subs.value) {
      const have = known.get(s.id);
      if (!have) { const row = rowFromSubscription(s); if (row) inserts.push(row); continue; }
      if (have.status !== s.status || Number(have.paid_count) !== s.paidCount) {
        updates.push({ id: have.id as string, patch: { status: s.status, paid_count: s.paidCount, updated_at: new Date().toISOString() } });
      }
    }
  }

  if (inserts.length) {
    await bestEffort('payment-links: recover from razorpay', admin.from('payment_links').upsert(inserts, { onConflict: 'razorpay_id', ignoreDuplicates: true }));
  }
  await Promise.all(updates.slice(0, 50).map((u) => bestEffort('payment-links: status', admin.from('payment_links').update(u.patch).eq('id', u.id))));
}

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'payment-links-read', limit: 60, allow: [...ALLOW], skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  await syncFromRazorpay(actor.admin);

  let query = actor.admin.from('payment_links').select(COLUMNS).order('created_at', { ascending: false }).limit(300);
  if (actor.role === 'seller') query = query.eq('created_by', actor.id);
  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { ok: false, error: isMissingTable(error) ? 'not_set_up' : 'db', message: isMissingTable(error) ? TABLE_MISSING : 'Could not load the links.' },
      { status: isMissingTable(error) ? 503 : 500 }
    );
  }
  const rows = (data ?? []) as LinkRow[];

  /* Who made each one — name, email and phone from their profile. */
  const creatorIds = [...new Set(rows.map((r) => r.created_by).filter((x): x is string => !!x))];
  const creators = new Map<string, Creator>();
  if (creatorIds.length) {
    const { data: people } = await actor.admin.from('profiles').select('id, full_name, email, phone, role').in('id', creatorIds);
    for (const p of people ?? []) {
      creators.set(p.id as string, { id: p.id as string, name: (p.full_name as string | null) ?? null, email: (p.email as string | null) ?? null, phone: (p.phone as string | null) ?? null, role: (p.role as string | null) ?? null });
    }
  }

  const links = rows.map((r) => toView(r, creators, actor.id));
  return NextResponse.json(
    { ok: true, links, canCancel: actor.isStaff },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'payment-links-create', limit: 20, allow: [...ALLOW] });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  /* A seller or HR proves their own number first: every link carries who made it. */
  if (actor.role === 'seller' || actor.role === 'hr') {
    const { data: me } = await actor.admin.from('profiles').select('phone, phone_verified').eq('id', actor.id).maybeSingle();
    if (!me?.phone || me.phone_verified !== true) {
      return NextResponse.json(
        { ok: false, error: 'phone_not_verified', message: 'Verify your own WhatsApp number in Settings before making payment links.' },
        { status: 403 }
      );
    }
  }

  const parsed = await readJson<Record<string, unknown> & { website?: string }>(req);
  if (!parsed.ok) return parsed.response;
  const check = checkLinkRequest(parsed.body);
  if (!check.ok) return NextResponse.json({ ok: false, error: 'invalid', message: check.error }, { status: 400 });
  const r = check.value;
  const isSeller = actor.role === 'seller';

  /* The floor, exactly as confirm-sale applies it — for autopay, on every payment. */
  const { book } = await loadPriceBook(actor.admin);
  const floor = sellerFloor(book.inputs, r.ratio, r.months, book.ladder[r.ratio][r.months]);
  if (isSeller && !isApproved(r.amount, floor)) {
    const what = r.autopay ? `each ${FREQUENCY_LABEL[r.autopay.frequency].toLowerCase()} payment on ${r.ratio}` : `${r.ratio} · ${PLAN_LABEL[r.months]}`;
    return NextResponse.json(
      { ok: false, error: 'below_floor', message: `${NOT_APPROVED}. The lowest for ${what} is ${formatInr(floor)}.` },
      { status: 422 }
    );
  }

  if (r.leadId) {
    const { data: lead } = await actor.admin.from('student_leads').select('id, assigned_seller').eq('id', r.leadId).maybeSingle();
    if (!lead) return NextResponse.json({ ok: false, error: 'lead_not_found', message: 'That lead no longer exists.' }, { status: 404 });
    if (isSeller && lead.assigned_seller !== actor.id) {
      return NextResponse.json({ ok: false, error: 'forbidden', message: 'That lead is not on your desk.' }, { status: 403 });
    }
  }

  const now = Date.now();
  const expireBy = Math.floor(now / 1000) + LINK_EXPIRY_DAYS * 86_400;
  const belowFloor = !isApproved(r.amount, floor);
  const notes = {
    created_by: actor.id,
    created_by_role: actor.role,
    lead_id: r.leadId ?? '',
    ratio: r.ratio,
    months: String(r.months),
    below_floor: belowFloor ? 'yes' : 'no',
    customer_name: r.customerName,
    customer_phone: r.phone,
    customer_email: r.email ?? '',
  };

  let row: Omit<LinkRow, 'id' | 'cancelled_at' | 'cancelled_by' | 'created_at'>;
  if (r.autopay) {
    const description = autopayDescription(r.ratio, r.autopay);
    /* Plans cannot be deleted, so an identical one already made is reused. */
    const { data: samePlan } = await actor.admin
      .from('payment_links').select('razorpay_plan_id')
      .eq('kind', 'autopay').eq('frequency', r.autopay.frequency).eq('amount_inr', r.amount).eq('ratio', r.ratio)
      .not('razorpay_plan_id', 'is', null).limit(1).maybeSingle();
    let planId = (samePlan?.razorpay_plan_id as string | undefined) ?? null;
    if (!planId) {
      const plan = await createPlan({
        amountRupees: r.amount,
        name: `Sariro ${r.ratio} — ${FREQUENCY_LABEL[r.autopay.frequency].toLowerCase()}`,
        description: linkDescription(r.ratio, r.months),
        ...RAZORPAY_PERIOD[r.autopay.frequency],
      });
      if (!plan.ok) return NextResponse.json({ ok: false, error: 'razorpay', message: plan.error }, { status: 502 });
      planId = plan.value;
    }
    const sub = await createSubscription({
      planId,
      totalCount: r.autopay.count,
      expireBy,
      notes: { ...notes, amount_inr: String(r.amount), frequency: r.autopay.frequency, description: description.slice(0, 250) },
    });
    if (!sub.ok) return NextResponse.json({ ok: false, error: 'razorpay', message: sub.error }, { status: 502 });
    row = {
      kind: 'autopay', razorpay_id: sub.value.id, razorpay_plan_id: planId, short_url: sub.value.url, status: sub.value.status,
      amount_inr: r.amount, frequency: r.autopay.frequency, total_count: r.autopay.count, paid_count: 0, amount_paid_inr: 0,
      ratio: r.ratio, months: r.months, description, customer_name: r.customerName, customer_phone: r.phone, customer_email: r.email,
      lead_id: r.leadId, below_floor: belowFloor, created_by: actor.id, created_by_role: actor.role,
    };
  } else {
    const created = await createPaymentLink({
      amountRupees: r.amount,
      description: linkDescription(r.ratio, r.months),
      referenceId: referenceId(now, randomBytes(6).toString('hex')),
      customer: { name: r.customerName, contact: r.phone, email: r.email },
      expireBy,
      notes,
    });
    if (!created.ok) return NextResponse.json({ ok: false, error: 'razorpay', message: created.error }, { status: 502 });
    row = {
      kind: 'one_time', razorpay_id: created.value.id, razorpay_plan_id: null, short_url: created.value.url, status: created.value.status,
      amount_inr: r.amount, frequency: null, total_count: null, paid_count: 0, amount_paid_inr: 0,
      ratio: r.ratio, months: r.months, description: linkDescription(r.ratio, r.months), customer_name: r.customerName, customer_phone: r.phone,
      customer_email: r.email, lead_id: r.leadId, below_floor: belowFloor, created_by: actor.id, created_by_role: actor.role,
    };
  }

  /* Recorded — checked, not best effort. The link already exists at Razorpay, so
     a failed write does not fail the request: the next list load recovers it
     from Razorpay's notes. It is reported so it is not silently lost. */
  const { error: insertError } = await actor.admin.from('payment_links').insert(row);
  if (insertError) console.error('[payment-links] record failed:', insertError.code, insertError.message);

  /* On the lead's logbook, so whoever opens the family next sees what was sent. */
  if (r.leadId) {
    const what = r.autopay ? `Autopay link sent — ${r.ratio}: ${autopaySummary(r.amount, r.autopay)}.` : `Payment link sent — ${r.ratio} · ${PLAN_LABEL[r.months]} at ${formatInr(r.amount)}.`;
    await bestEffort(
      'payment-links: lead note',
      actor.admin.from('lead_notes').insert({
        lead_id: r.leadId,
        author_id: actor.id,
        author_role: actor.role,
        priority: 'normal',
        category: 'payment_link',
        note: `${what}\n${row.short_url}`,
      })
    );
  }

  return NextResponse.json({
    ok: true,
    link: {
      id: row.razorpay_id,
      url: row.short_url,
      status: row.status,
      amount: r.amount,
      autopay: r.autopay,
      belowFloor,
      floor,
      recorded: !insertError,
      ...(insertError && isMissingTable(insertError) ? { warning: TABLE_MISSING } : {}),
    },
  });
}
