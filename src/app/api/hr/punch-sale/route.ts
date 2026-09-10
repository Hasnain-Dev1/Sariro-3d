import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { syncSellerIncentive } from '@/lib/seller/incentive-sync';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — POST /api/hr/punch-sale
 *
 * The moment a sale becomes real: the ledger, the enrolment, and who gets paid
 * for it, all settled at once.
 *
 * ── Why the work happens in the database ────────────────────────────────────
 * The spec's word is "atomically", and every partial outcome here is a real
 * business failure:
 *
 *   ledger written, lead not moved   → the seller chases a family who has paid
 *   lead moved, ledger not written   → nobody is ever paid commission for it
 *   attribution not locked           → the sale can be moved to someone else
 *   punched twice                    → the commission is paid twice
 *
 * Four PostgREST calls in a row have four chances to stop half way — a
 * timeout, a deploy, a closed laptop. So they are one plpgsql function,
 * `punch_sale()`, and this route's job is to decide WHO may call it and to do
 * the things that are genuinely allowed to fail afterwards.
 *
 * ── Correcting the seller: now or never ─────────────────────────────────────
 * HR may name a different seller in this call, and that is the last moment
 * anybody can. `punch_sale` sets `seller_locked`, and after that neither a
 * seller nor an ordinary HR user can move the attribution — only a super-admin
 * can, and it is written down when they do.
 *
 * That asymmetry is the point. Before the punch, arguing about who worked the
 * family is a normal conversation. After it, somebody has been paid.
 */
export const runtime = 'nodejs';

interface Body {
  invoiceNumber?: string;
  leadId?: string;
  /** HR's last chance to correct who is credited. */
  sellerId?: string;
  notes?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'punch-sale',
    limit: 30,
    allow: ['super_admin', 'admin', 'hr'],
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<Body>(req);
  if (!parsed.ok) return parsed.response;

  const invoiceNumber = (parsed.body.invoiceNumber ?? '').trim();
  if (!invoiceNumber) {
    return NextResponse.json(
      { ok: false, error: 'missing_invoice', message: 'Raise the invoice first — a sale cannot be punched without one.' },
      { status: 400 }
    );
  }
  const leadId = (parsed.body.leadId ?? '').trim() || null;
  const sellerId = (parsed.body.sellerId ?? '').trim() || null;

  /* If HR is naming a seller, they must be somebody who can hold a sale.
     Crediting a student would put the commission somewhere nobody looks. */
  if (sellerId) {
    const { data: dest } = await actor.admin
      .from('profiles')
      .select('id, role, is_seller, is_admin, is_super_admin')
      .eq('id', sellerId)
      .maybeSingle();
    const canOwn = dest && (
      dest.role === 'seller' || dest.role === 'admin' || dest.role === 'super_admin' ||
      dest.is_seller === true || dest.is_admin === true || dest.is_super_admin === true
    );
    if (!canOwn) {
      return NextResponse.json(
        { ok: false, error: 'not_a_seller', message: 'That person cannot be credited with a sale.' },
        { status: 400 }
      );
    }
  }

  /* ── All of it, or none of it ─────────────────────────────────────────── */
  const { data: sale, error } = await actor.admin.rpc('punch_sale', {
    p_invoice_number: invoiceNumber,
    p_lead_id: leadId,
    p_seller_id: sellerId,
    p_notes: (parsed.body.notes ?? '').trim() || null,
  });

  if (error) {
    console.warn('[punch-sale] rpc failed:', error.code, error.message);
    const missing = /does not exist|schema cache|function/i.test(error.message);
    return NextResponse.json(
      {
        ok: false,
        error: 'punch_failed',
        message: missing
          ? 'The sale pipeline is not set up on the database yet — run scripts/seller-pipeline-and-sale.sql.'
          : error.message,
      },
      { status: missing ? 503 : 409 }
    );
  }

  const row = sale as {
    id: string; invoice_number: string; seller_id: string | null;
    amount: number | null; punched_at: string | null; lead_id: string | null;
    student_name: string | null;
  };

  /* ── Everything that is allowed to fail, after the money is settled ────── */

  await recordEvent(actor.admin, {
    event: 'sale.punched',
    subjectType: 'sale',
    subjectId: row.id,
    actorId: actor.id,
    payload: {
      invoiceNumber: row.invoice_number,
      sellerId: row.seller_id,
      amount: Number(row.amount) || 0,
      leadId: row.lead_id,
    },
  });

  /* The entitlement, recomputed from scratch against the month the sale was
     PUNCHED into — not necessarily this one, if HR is clearing a backlog. */
  let incentive: Awaited<ReturnType<typeof syncSellerIncentive>> | null = null;
  if (row.seller_id) {
    incentive = await syncSellerIncentive(
      actor.admin,
      row.seller_id,
      row.punched_at ? Date.parse(row.punched_at) : Date.now()
    );

    await bestEffort(
      'punch-sale: tell the seller',
      actor.admin.from('notifications').insert({
        user_id: row.seller_id,
        type: 'sale_punched',
        title: 'Your sale is confirmed',
        message: `${row.student_name ?? 'A family'} — ${row.invoice_number}. It is on your month's count.`,
        link: '/dashboard/seller',
      })
    );
  }

  /* Any follow-up still pending on a family who has now bought is noise. Left
     alone, the seller is reminded to chase somebody who has already paid. */
  if (row.lead_id) {
    await bestEffort(
      'punch-sale: close outstanding reminders',
      actor.admin
        .from('lead_reminders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: actor.id,
        })
        .eq('lead_id', row.lead_id)
        .eq('status', 'pending')
    );

    await bestEffort(
      'punch-sale: logbook',
      actor.admin.from('lead_notes').insert({
        lead_id: row.lead_id,
        author_id: actor.id,
        author_role: actor.role,
        priority: 'normal',
        category: 'sale_punched',
        note: `Sale punched by HR · ${row.invoice_number} · ₹${Number(row.amount ?? 0).toLocaleString('en-IN')}. Seller attribution is now locked.`,
      })
    );
  }

  return NextResponse.json({
    ok: true,
    sale: {
      id: row.id,
      invoiceNumber: row.invoice_number,
      sellerId: row.seller_id,
      amount: Number(row.amount) || 0,
      punchedAt: row.punched_at,
      leadId: row.lead_id,
    },
    incentive,
  });
}
