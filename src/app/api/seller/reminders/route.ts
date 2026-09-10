import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson, type Actor } from '@/lib/auth/actor';
import { parseRelative, parseExact } from '@/lib/seller/reminders';

/**
 * SARIRO — a follow-up, marked done or called off
 * ============================================================================
 * POST /api/seller/reminders   { action: 'create' | 'complete' | 'cancel' }
 *
 * ── Only two states are stored ──────────────────────────────────────────────
 * Upcoming, Due and Overdue are not written here and cannot be set. They are
 * `due_at` compared with the clock — see lib/seller/reminders.ts. Storing them
 * would need a job walking every row at midnight, and between midnight and
 * that job running every screen in the business would be lying.
 *
 * Completed and cancelled are different: they are facts about what a person
 * did, so they are stored, with who did it and when.
 *
 * ── Completing is one-way ──────────────────────────────────────────────────
 * A reminder that has been dealt with cannot be re-opened. The follow-up
 * happened; if another one is needed that is a NEW reminder with its own date,
 * not a resurrection of the old one — which would lose the record that the
 * first call was made at all.
 */
export const runtime = 'nodejs';

interface Body {
  action?: 'create' | 'complete' | 'cancel';
  reminderId?: string;
  leadId?: string;
  remindIn?: string;
  remindAtExact?: string;
  body?: string;
  website?: string;
}

function canTouch(actor: Actor, assignedSeller: string | null, reminderSeller: string | null): boolean {
  if (actor.isStaff || actor.isHR) return true;
  return assignedSeller === actor.id || reminderSeller === actor.id;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'seller-reminders',
    limit: 60,
    allow: ['super_admin', 'admin', 'hr', 'seller'],
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<Body>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const now = new Date().toISOString();

  /* ── Create a standalone reminder ─────────────────────────────────────────
     "Ring back Tuesday" with nothing to say yet. A note is not required —
     forcing one produces "n/a" in the logbook, which is worse than nothing. */
  if (body.action === 'create') {
    const leadId = (body.leadId ?? '').trim();
    if (!leadId) return NextResponse.json({ ok: false, error: 'missing_lead' }, { status: 400 });

    const dueAt = body.remindAtExact
      ? parseExact(body.remindAtExact)
      : parseRelative(body.remindIn ?? '');
    if (!dueAt) {
      return NextResponse.json(
        { ok: false, error: 'bad_reminder_time', message: 'Try "3 hours", "1 day" or "4 days" — or pick a date.' },
        { status: 400 }
      );
    }

    const { data: lead } = await actor.admin
      .from('student_leads').select('id, assigned_seller').eq('id', leadId).maybeSingle();
    if (!lead) return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });
    if (!canTouch(actor, lead.assigned_seller as string | null, null)) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const { data, error } = await actor.admin
      .from('lead_reminders')
      .insert({
        lead_id: leadId,
        seller_id: (lead.assigned_seller as string | null) ?? actor.id,
        due_at: dueAt,
        body: (body.body ?? '').trim().slice(0, 300) || null,
        created_by: actor.id,
      })
      .select('id, due_at')
      .maybeSingle();

    if (error) {
      console.warn('[seller-reminders] create failed:', error.code, error.message);
      return NextResponse.json({ ok: false, error: 'save_failed', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, reminderId: data?.id ?? null, dueAt });
  }

  /* ── Complete or cancel an existing one ──────────────────────────────── */
  if (body.action !== 'complete' && body.action !== 'cancel') {
    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  }

  const reminderId = (body.reminderId ?? '').trim();
  if (!reminderId) return NextResponse.json({ ok: false, error: 'missing_reminder' }, { status: 400 });

  const { data: reminder } = await actor.admin
    .from('lead_reminders')
    .select('id, lead_id, seller_id, status')
    .eq('id', reminderId)
    .maybeSingle();
  if (!reminder) return NextResponse.json({ ok: false, error: 'reminder_not_found' }, { status: 404 });

  const { data: lead } = await actor.admin
    .from('student_leads').select('assigned_seller').eq('id', reminder.lead_id).maybeSingle();
  if (!canTouch(actor, (lead?.assigned_seller as string | null) ?? null, reminder.seller_id as string | null)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  if (reminder.status !== 'pending') {
    /* Already dealt with. Reported as success because the caller's intent —
       "this should not be outstanding" — is satisfied, and a double click on
       Done should not produce an error the seller has to think about. */
    return NextResponse.json({ ok: true, already: reminder.status });
  }

  const patch = body.action === 'complete'
    ? { status: 'completed', completed_at: now, completed_by: actor.id }
    : { status: 'cancelled', cancelled_at: now, cancelled_by: actor.id };

  /* Guarded on status, so two clicks or two open tabs cannot both claim it —
     the second update matches no row and falls through to `already`. */
  const { data: updated, error } = await actor.admin
    .from('lead_reminders')
    .update(patch)
    .eq('id', reminderId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    console.warn('[seller-reminders] update failed:', error.code, error.message);
    return NextResponse.json({ ok: false, error: 'save_failed', message: error.message }, { status: 500 });
  }
  if (!updated) return NextResponse.json({ ok: true, already: 'raced' });

  return NextResponse.json({ ok: true, status: patch.status });
}
