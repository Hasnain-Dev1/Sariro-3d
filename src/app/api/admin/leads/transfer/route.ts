import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — moving a lead from one desk to another
 * ============================================================================
 * POST /api/admin/leads/transfer   { leadId, toSeller, reason }
 *
 * ── Why this is separate from `assign_seller` ───────────────────────────────
 * `/api/admin/leads` already has an assign action, and it is the right thing
 * for a lead that has nobody. This is a different act: taking a family off
 * somebody who has been working them and giving them to somebody else. It
 * changes who gets paid, so it needs a reason and a record that a person can
 * be shown six weeks later.
 *
 * ── After the sale, this stops working ──────────────────────────────────────
 * Attribution is locked by `sales.seller_locked` the moment HR punches the
 * sale. Before that, moving a lead moves the commission with it, which is
 * correct — the seller who did the work should be paid. Afterwards it would
 * take money off somebody who has already earned it, so it is refused for
 * everyone except a super-admin, and even then it is written down.
 *
 * ── The monthly counts follow by themselves ─────────────────────────────────
 * Nothing is incremented or decremented here. `chooseSeller` derives its
 * counts from the leads each seller is holding, so a transfer changes the
 * distribution automatically and correctly — including for a correction made
 * long after the month it belongs to. A counter column would need decrementing
 * on the old seller and incrementing on the new one, and the first time either
 * was missed the fairness would quietly bias forever.
 */
export const runtime = 'nodejs';

interface Body {
  leadId?: string;
  toSeller?: string;
  reason?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'lead-transfer',
    limit: 30,
    /* Super-admins only, as specified. An admin can assign an UNOWNED lead
       through the existing route; taking one off a colleague is a different
       power and belongs with the person who answers for the commission. */
    allow: ['super_admin'],
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const { leadId, toSeller } = parsed.body;
  const reason = (parsed.body.reason ?? '').trim();

  if (!leadId || !toSeller) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }
  if (reason.length < 3) {
    return NextResponse.json(
      { ok: false, error: 'missing_reason', message: 'Say why this lead is moving — it decides who gets paid.' },
      { status: 400 }
    );
  }

  const { data: lead } = await actor.admin
    .from('student_leads')
    .select('id, assigned_seller, stage, student_name')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });

  const from = (lead.assigned_seller as string | null) ?? null;
  if (from === toSeller) {
    return NextResponse.json({ ok: true, message: 'That lead is already on their desk.' });
  }

  /* The destination must be somebody who can actually hold a lead. Assigning
     to a student would make the family invisible to every seller queue. */
  const { data: dest } = await actor.admin
    .from('profiles')
    .select('id, full_name, role, is_seller, is_admin, is_super_admin')
    .eq('id', toSeller)
    .maybeSingle();
  if (!dest) return NextResponse.json({ ok: false, error: 'seller_not_found' }, { status: 404 });

  const canOwn =
    dest.role === 'seller' || dest.role === 'admin' || dest.role === 'super_admin' ||
    dest.is_seller === true || dest.is_admin === true || dest.is_super_admin === true;
  if (!canOwn) {
    return NextResponse.json(
      { ok: false, error: 'not_a_seller', message: 'That person cannot hold leads.' },
      { status: 400 }
    );
  }

  /* ── Is the commission already settled? ─────────────────────────────────── */
  const { data: punched } = await actor.admin
    .from('sales')
    .select('id, invoice_number, seller_locked, punched_at')
    .eq('lead_id', leadId)
    .not('punched_at', 'is', null)
    .limit(1);

  if (punched && punched.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'attribution_locked',
        message:
          `That sale was already punched (${punched[0].invoice_number ?? 'no invoice number'}). ` +
          'Who is paid for it is settled — correct it on the sale, not on the lead.',
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();

  /* Guarded on the seller we read, so two super-admins on the same screen
     cannot both move it and disagree about where it ended up.

     `.eq(col, null)` is NOT that guard — PostgREST renders it as `col=eq.null`,
     which matches nothing, so an unassigned lead would silently fail to move
     and the route would report success. Null needs `.is()`. */
  const guarded = actor.admin
    .from('student_leads')
    .update({
      assigned_seller: toSeller,
      /* A lead that had nobody has now been assigned, which IS a step forward.
         One that was already further along keeps its stage — moving desks is
         not progress towards a sale. */
      stage: lead.stage === 'new' ? 'seller_assigned' : lead.stage,
      last_updated: now,
      updated_at: now,
    })
    .eq('id', leadId);

  const { data: moved, error: updErr } = await (
    from === null ? guarded.is('assigned_seller', null) : guarded.eq('assigned_seller', from)
  ).select('id');

  if (updErr) {
    console.warn('[lead-transfer] update failed:', updErr.code, updErr.message);
    return NextResponse.json({ ok: false, error: 'transfer_failed', message: updErr.message }, { status: 500 });
  }
  if (!moved || moved.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'raced',
        message: 'Somebody else moved that lead while this screen was open. Reload and check where it is now.',
      },
      { status: 409 }
    );
  }

  await bestEffort(
    'lead-transfer: history row',
    actor.admin.from('lead_transfers').insert({
      lead_id: leadId,
      from_seller: from,
      to_seller: toSeller,
      changed_by: actor.id,
      reason,
    })
  );

  /* Also in lead_history, which is what the lead's own timeline renders. The
     two are not duplicates: lead_transfers is the structured record a report
     can count, lead_history is the sentence a person reads. */
  await bestEffort(
    'lead-transfer: lead_history',
    actor.admin.from('lead_history').insert({
      lead_id: leadId,
      action: from ? 'seller_changed' : 'seller_assigned',
      old_value: from,
      new_value: toSeller,
      performed_by: actor.id,
      performed_by_role: actor.role,
      notes: reason,
    })
  );

  /* Pending reminders belong to the desk, not the person who set them. Left
     alone, the old seller keeps being told to ring a family who is no longer
     theirs, and the new one is told nothing. */
  await bestEffort(
    'lead-transfer: move pending reminders',
    actor.admin
      .from('lead_reminders')
      .update({ seller_id: toSeller })
      .eq('lead_id', leadId)
      .eq('status', 'pending')
  );

  await recordEvent(actor.admin, {
    event: 'lead.transferred',
    subjectType: 'lead',
    subjectId: leadId,
    actorId: actor.id,
    payload: { from, to: toSeller, reason },
  });

  await bestEffort(
    'lead-transfer: notify new seller',
    actor.admin.from('notifications').insert({
      user_id: toSeller,
      type: 'lead_transferred',
      title: 'A lead was moved to you',
      message: `${lead.student_name ?? 'A family'} is now yours. Reason: ${reason}`,
      link: '/dashboard/seller',
    })
  );

  return NextResponse.json({ ok: true, from, to: toSeller, movedBy: actor.fullName ?? actor.id });
}
