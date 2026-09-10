import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — POST /api/seller/confirm-sale
 *
 * "They are buying. HR, please invoice it."
 *
 * ── What this deliberately does NOT do ──────────────────────────────────────
 * It does not mark the lead enrolled, it does not touch the sales ledger, and
 * it does not count towards anybody's commission. A seller saying a family has
 * agreed is not the same event as money arriving, and collapsing the two is
 * how a pipeline reports sales that never happened.
 *
 * What it does is put the lead in front of HR with everything they need to
 * raise the invoice, and record that the seller has done their part.
 *
 * ── The stage is a third column, not an overload ────────────────────────────
 * `stage` is about the family, `trial_status` is about the class, and this is
 * about the money. Three questions with three answers; reusing one of the
 * existing columns would mean a lead could not simultaneously be "trial
 * attended" and "waiting for an invoice", which is exactly the state every
 * closing lead is in.
 */
export const runtime = 'nodejs';

interface Body {
  leadId?: string;
  /** What the family agreed to buy, in the seller's words. */
  packageNote?: string;
  /** The figure quoted. HR raises the invoice from it, and may change it. */
  proposedAmount?: number;
  website?: string;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'confirm-sale',
    limit: 30,
    allow: ['super_admin', 'admin', 'seller'],
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const { leadId } = parsed.body;
  if (!leadId) return NextResponse.json({ ok: false, error: 'missing_lead' }, { status: 400 });

  const packageNote = (parsed.body.packageNote ?? '').trim();
  const proposed = Number(parsed.body.proposedAmount);
  const proposedAmount = Number.isFinite(proposed) && proposed > 0 ? proposed : null;

  const { data: lead } = await actor.admin
    .from('student_leads')
    .select('id, assigned_seller, stage, sale_stage, student_name, email, phone, subject, grade')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });

  /* A seller may only close their own. Admins may close anybody's, because
     somebody has to be able to act when a seller is away. */
  if (!actor.isStaff && lead.assigned_seller !== actor.id) {
    return NextResponse.json(
      { ok: false, error: 'forbidden', message: 'That lead is not on your desk.' },
      { status: 403 }
    );
  }

  if (lead.sale_stage === 'punched' || lead.stage === 'enrolled') {
    return NextResponse.json(
      { ok: false, error: 'already_sold', message: 'That sale has already been punched by HR.' },
      { status: 409 }
    );
  }
  if (lead.sale_stage === 'ready_for_hr') {
    return NextResponse.json({ ok: true, already: true, message: 'Already with HR.' });
  }

  const now = new Date().toISOString();

  const { data: moved, error } = await actor.admin
    .from('student_leads')
    .update({
      sale_stage: 'ready_for_hr',
      /* The lead's own stage goes to `final` if it is not already past it —
         a sale being closed IS the final conversation, however the family
         arrived here. Never dragged backwards from `enrolled`. */
      stage: lead.stage === 'enrolled' ? 'enrolled' : 'final',
      /* Spread rather than `?? undefined`. An explicit undefined relies on
         JSON.stringify dropping the key, which is true today and is not a
         thing to depend on when the alternative is wiping a quoted figure. */
      ...(proposedAmount !== null ? { sale_value: proposedAmount } : {}),
      last_updated: now,
      updated_at: now,
    })
    .eq('id', leadId)
    /* Guarded, so two sellers on one lead cannot both hand it to HR. */
    .is('sale_stage', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.warn('[confirm-sale] update failed:', error.code, error.message);
    return NextResponse.json(
      {
        ok: false,
        error: 'save_failed',
        message: /sale_stage|column/i.test(error.message)
          ? 'The sale pipeline is not set up on the database yet — run scripts/seller-pipeline-and-sale.sql.'
          : error.message,
      },
      { status: 500 }
    );
  }
  if (!moved) return NextResponse.json({ ok: true, already: true, message: 'Already with HR.' });

  /* Everything HR will want, written where it cannot be overwritten. This is
     the handoff note, and the seller is the only person who has it. */
  await bestEffort(
    'confirm-sale: handoff note',
    actor.admin.from('lead_notes').insert({
      lead_id: leadId,
      author_id: actor.id,
      author_role: actor.role,
      priority: 'high',
      category: 'sale_confirmed',
      note:
        `Sale confirmed — ready for HR.` +
        (packageNote ? `\nPackage: ${packageNote}` : '') +
        (proposedAmount ? `\nQuoted: ₹${proposedAmount.toLocaleString('en-IN')}` : ''),
    })
  );

  await bestEffort(
    'confirm-sale: lead_history',
    actor.admin.from('lead_history').insert({
      lead_id: leadId,
      action: 'stage_changed',
      old_value: lead.stage,
      new_value: 'final (ready for HR)',
      performed_by: actor.id,
      performed_by_role: actor.role,
      notes: packageNote || 'Sale confirmed by seller',
    })
  );

  await recordEvent(actor.admin, {
    event: 'sale.confirmed',
    subjectType: 'lead',
    subjectId: leadId,
    actorId: actor.id,
    payload: { proposedAmount, packageNote: packageNote || null },
  });

  /* Tell HR now. An invoice queue nobody is told about is a queue that is
     read once a week, and the family is waiting to pay. */
  const { data: hrPeople } = await actor.admin
    .from('profiles')
    .select('id')
    .or('role.eq.hr,is_hr.eq.true')
    .limit(20);

  for (const hr of hrPeople ?? []) {
    await bestEffort(
      'confirm-sale: notify HR',
      actor.admin.from('notifications').insert({
        user_id: hr.id,
        type: 'invoice_pending',
        title: 'A sale needs invoicing',
        message: `${lead.student_name ?? 'A family'} has agreed to buy. Raise the invoice and punch the sale.`,
        link: '/dashboard/hr',
      })
    );
  }

  return NextResponse.json({ ok: true, leadId, notifiedHR: (hrPeople ?? []).length });
}
