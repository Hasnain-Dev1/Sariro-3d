import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson, type Actor } from '@/lib/auth/actor';
import { parseRelative, parseExact } from '@/lib/seller/reminders';
import { bestEffort } from '@/lib/supabase/best-effort';
import { isMissingRelation, SELLER_SETUP_MESSAGE } from '@/lib/supabase/schema-gaps';

/**
 * SARIRO — the seller's logbook
 * ============================================================================
 * GET  /api/seller/notes?leadId=…   every note and reminder on one lead
 * POST /api/seller/notes            add a note, and optionally a reminder
 *
 * ── Why a note can never be edited ──────────────────────────────────────────
 * `student_leads.notes` is one text column: every write replaces the last, so
 * a seller adding "called, no answer" erases "father asked us to ring after
 * 7pm" and there is no previous version to recover. That column is left alone
 * for legacy rows; everything new lands in lead_notes, one row per note.
 *
 * Append-only is enforced by a TRIGGER, not by this route. A route is one of
 * several ways a row can be written, and the guarantee has to survive the
 * others — including a well-meaning `.update()` written at 2am.
 *
 * ── The reminder rides along with the note ─────────────────────────────────
 * "Ring back on the 15th" is one thought, and making the seller type it twice —
 * once as a note, once as a reminder — means half of them will only do one.
 * The half that skip the note lose the reason; the half that skip the reminder
 * lose the call. The reminder carries the note's own words, so when it fires
 * it says which child and why, not merely "follow up".
 *
 * ── When the tables are not there yet ───────────────────────────────────────
 * Said as such. For the first days of this feature every save failed because
 * the migration had not been run, and the seller saw either a raw database
 * sentence or an empty logbook indistinguishable from a lead nobody had
 * written about. Both routes now name the missing update instead.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Who is allowed to look at somebody else's leads. */
function canSeeLead(actor: Actor, assignedSeller: string | null): boolean {
  if (actor.isStaff || actor.isHR) return true;
  return assignedSeller !== null && assignedSeller === actor.id;
}

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'seller-notes-read',
    limit: 120,
    allow: ['super_admin', 'admin', 'hr', 'seller'],
    skipOriginCheck: true,
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const leadId = req.nextUrl.searchParams.get('leadId');
  if (!leadId) return NextResponse.json({ ok: false, error: 'missing_lead' }, { status: 400 });

  const { data: lead } = await actor.admin
    .from('student_leads')
    .select('id, assigned_seller, student_name')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });
  if (!canSeeLead(actor, lead.assigned_seller as string | null)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const [notesRes, remindersRes, transfersRes] = await Promise.all([
    actor.admin
      .from('lead_notes')
      .select('id, note, priority, category, author_id, author_role, created_at, author:author_id(full_name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(200),
    actor.admin
      .from('lead_reminders')
      .select('id, lead_id, due_at, status, body, seller_id, completed_at, cancelled_at, notified_at, created_at')
      .eq('lead_id', leadId)
      .order('due_at', { ascending: true })
      .limit(100),
    actor.admin
      .from('lead_transfers')
      .select('id, reason, created_at, from_seller, to_seller, from:from_seller(full_name), to:to_seller(full_name), by:changed_by(full_name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const setupMissing = [notesRes.error, remindersRes.error, transfersRes.error].some(isMissingRelation);

  return NextResponse.json({
    ok: true,
    setupMissing,
    setupMessage: setupMissing ? SELLER_SETUP_MESSAGE : null,
    lead: { id: lead.id, student_name: lead.student_name },
    notes: notesRes.data ?? [],
    reminders: remindersRes.data ?? [],
    transfers: transfersRes.data ?? [],
  });
}

interface NoteBody {
  leadId?: string;
  note?: string;
  priority?: 'high' | 'medium' | 'normal';
  category?: string;
  /** "3 hours" / "1 day" / "4 days" — or omit and send `remindAtExact`. */
  remindIn?: string;
  /** "2026-09-15T16:00" from a datetime-local field, read as Indian time. */
  remindAtExact?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'seller-notes-write',
    limit: 60,
    allow: ['super_admin', 'admin', 'hr', 'seller'],
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<NoteBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const leadId = (body.leadId ?? '').trim();
  const note = (body.note ?? '').trim();
  if (!leadId) return NextResponse.json({ ok: false, error: 'missing_lead' }, { status: 400 });
  if (!note) {
    return NextResponse.json(
      { ok: false, error: 'empty_note', message: 'Write what happened before saving.' },
      { status: 400 }
    );
  }
  if (note.length > 4000) {
    return NextResponse.json(
      { ok: false, error: 'note_too_long', message: 'That is longer than a note should be — 4,000 characters is the limit.' },
      { status: 400 }
    );
  }

  const priority = body.priority === 'high' || body.priority === 'medium' ? body.priority : 'normal';

  const { data: lead } = await actor.admin
    .from('student_leads')
    .select('id, assigned_seller, student_name')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) return NextResponse.json({ ok: false, error: 'lead_not_found' }, { status: 404 });
  if (!canSeeLead(actor, lead.assigned_seller as string | null)) {
    return NextResponse.json(
      { ok: false, error: 'forbidden', message: 'That lead is not on your desk.' },
      { status: 403 }
    );
  }

  /* ── When, if a reminder was asked for ───────────────────────────────────
     Worked out BEFORE the note is written, so a phrase we cannot parse is
     refused while the seller still has the form in front of them. Writing the
     note first and failing on the reminder afterwards would leave the note
     saved, the reminder missing, and the seller believing both worked. */
  let dueAt: string | null = null;
  if (body.remindAtExact) {
    dueAt = parseExact(body.remindAtExact);
    if (!dueAt) {
      return NextResponse.json(
        { ok: false, error: 'bad_reminder_time', message: 'That date did not make sense. Pick it again.' },
        { status: 400 }
      );
    }
    /* A reminder in the past fires the moment it is saved, which reads as a
       glitch. Refused so the seller can correct the date they meant. */
    if (Date.parse(dueAt) < Date.now() - 60_000) {
      return NextResponse.json(
        { ok: false, error: 'reminder_in_past', message: 'That time has already passed. Pick a time still to come.' },
        { status: 400 }
      );
    }
  } else if (body.remindIn) {
    dueAt = parseRelative(body.remindIn);
    if (!dueAt) {
      return NextResponse.json(
        { ok: false, error: 'bad_reminder_time', message: 'Try "3 hours", "1 day" or "4 days" — or pick a date.' },
        { status: 400 }
      );
    }
  }

  const { data: inserted, error: noteErr } = await actor.admin
    .from('lead_notes')
    .insert({
      lead_id: leadId,
      author_id: actor.id,
      author_role: actor.role,
      note,
      priority,
      category: (body.category ?? '').trim() || null,
    })
    .select('id, created_at')
    .maybeSingle();

  if (noteErr || !inserted) {
    console.warn('[seller-notes] insert failed:', noteErr?.code, noteErr?.message);
    if (isMissingRelation(noteErr)) {
      return NextResponse.json({ ok: false, error: 'setup_missing', message: SELLER_SETUP_MESSAGE }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, error: 'save_failed', message: noteErr?.message ?? 'The note was not saved.' },
      { status: 500 }
    );
  }

  let reminderId: string | null = null;
  if (dueAt) {
    const { data: rem, error: remErr } = await actor.admin
      .from('lead_reminders')
      .insert({
        lead_id: leadId,
        note_id: inserted.id,
        /* The reminder belongs to whoever the lead is on, not to whoever typed
           it — an admin adding a note on a seller's lead is setting the
           SELLER'S alarm. Falls back to the author when nobody owns the lead. */
        seller_id: (lead.assigned_seller as string | null) ?? actor.id,
        due_at: dueAt,
        /* Which child, and the note itself, so the notification that fires on
           the 15th says what the call is about without opening anything. */
        body: `${(lead.student_name as string | null) ?? 'Lead'}: ${note}`.slice(0, 300),
        created_by: actor.id,
      })
      .select('id')
      .maybeSingle();

    if (remErr) {
      /* The note is already saved and is the more important half. Report the
         partial result honestly rather than pretending both worked. */
      console.warn('[seller-notes] reminder insert failed:', remErr.code, remErr.message);
      return NextResponse.json({
        ok: true,
        noteId: inserted.id,
        reminderId: null,
        warning: 'The note was saved but the reminder was not. Set it again.',
      });
    }
    reminderId = rem?.id ?? null;
  }

  /* The lead's own timestamp, so it sorts to the top of a queue ordered by
     "kept waiting longest". A note IS activity on the lead. */
  await bestEffort(
    'seller-notes: touch lead',
    actor.admin.from('student_leads').update({ last_updated: new Date().toISOString() }).eq('id', leadId)
  );

  await bestEffort(
    'seller-notes: lead_history',
    actor.admin.from('lead_history').insert({
      lead_id: leadId,
      action: 'note_added',
      new_value: priority,
      performed_by: actor.id,
      performed_by_role: actor.role,
      notes: note.slice(0, 500),
    })
  );

  return NextResponse.json({ ok: true, noteId: inserted.id, reminderId, dueAt });
}
