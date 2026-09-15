import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireActor, readJson } from '@/lib/auth/actor';
import { bestEffort } from '@/lib/supabase/best-effort';
import { loadPriceBook } from '@/lib/pricing/price-book-store';
import { NOT_APPROVED, PLAN_LABEL, isApproved, sellerFloor } from '@/lib/pricing/economics';
import { formatInr } from '@/lib/pricing/inr-site';
import { LINK_EXPIRY_DAYS, checkLinkRequest, linkDescription, referenceId } from '@/lib/payments/link-request';
import { createPaymentLink, listPaymentLinks } from '@/lib/razorpay/payment-links';

/**
 * SARIRO — rupee payment links, made from the dashboard
 * ============================================================================
 * POST /api/payments/links   { ratio, months, amount, customerName, phone, email?, leadId? }
 * GET  /api/payments/links   the links Sariro has made (a seller sees their own)
 *
 * For a family in India to pay by UPI from a WhatsApp message: sellers, HR,
 * admins and the super admin. A seller may not make a link below the floor
 * for that plan — the same rule as confirming a sale — and may only attach it
 * to a lead on their own desk. Staff can go below the floor, because somebody
 * has to be able to approve the exception.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOW = ['seller', 'hr', 'admin', 'super_admin'] as const;

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'payment-links-read', limit: 60, allow: [...ALLOW], skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const listed = await listPaymentLinks();
  if (!listed.ok) return NextResponse.json({ ok: false, error: 'razorpay', message: listed.error }, { status: 502 });

  const mineOnly = actor.role === 'seller';
  const links = listed.value
    .filter((l) => !mineOnly || l.createdBy === actor.id)
    .slice(0, 40)
    .map((l) => ({ ...l, mine: l.createdBy === actor.id }));
  return NextResponse.json({ ok: true, links }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'payment-links-create', limit: 20, allow: [...ALLOW] });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<Record<string, unknown> & { website?: string }>(req);
  if (!parsed.ok) return parsed.response;
  const check = checkLinkRequest(parsed.body);
  if (!check.ok) return NextResponse.json({ ok: false, error: 'invalid', message: check.error }, { status: 400 });
  const r = check.value;
  const isSeller = actor.role === 'seller';

  /* The floor, exactly as confirm-sale applies it. */
  const { book } = await loadPriceBook(actor.admin);
  const floor = sellerFloor(book.inputs, r.ratio, r.months, book.ladder[r.ratio][r.months]);
  if (isSeller && !isApproved(r.amount, floor)) {
    return NextResponse.json(
      { ok: false, error: 'below_floor', message: `${NOT_APPROVED}. The lowest for ${r.ratio} · ${PLAN_LABEL[r.months]} is ${formatInr(floor)}.` },
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
  const created = await createPaymentLink({
    amountRupees: r.amount,
    description: linkDescription(r.ratio, r.months),
    referenceId: referenceId(now, randomBytes(6).toString('hex')),
    customer: { name: r.customerName, contact: r.phone, email: r.email },
    expireBy: Math.floor(now / 1000) + LINK_EXPIRY_DAYS * 86_400,
    notes: {
      created_by: actor.id,
      created_by_role: actor.role,
      lead_id: r.leadId ?? '',
      ratio: r.ratio,
      months: String(r.months),
      below_floor: isApproved(r.amount, floor) ? 'no' : 'yes',
    },
  });
  if (!created.ok) return NextResponse.json({ ok: false, error: 'razorpay', message: created.error }, { status: 502 });

  /* On the lead's logbook, so whoever opens the family next sees what was sent. */
  if (r.leadId) {
    await bestEffort(
      'payment-links: lead note',
      actor.admin.from('lead_notes').insert({
        lead_id: r.leadId,
        author_id: actor.id,
        author_role: actor.role,
        priority: 'normal',
        category: 'payment_link',
        note: `Payment link sent — ${r.ratio} · ${PLAN_LABEL[r.months]} at ${formatInr(r.amount)}.\n${created.value.url}`,
      })
    );
  }

  return NextResponse.json({
    ok: true,
    link: { ...created.value, belowFloor: !isApproved(r.amount, floor), floor },
  });
}
