/* Deliberately NOT 'use client'.
   This is called from two API routes. A server route importing a 'use client'
   module receives client REFERENCES rather than functions — calling one throws,
   the route dies before it can return anything, and the browser sees
   "Unexpected end of JSON input" from an empty body. That has happened twice in
   this project already (TRIAL_MINUTES, and the course-options validator), both
   times with no error anywhere to point at it. */

import type { SupabaseClient } from '@supabase/supabase-js';
import { matchLead, normalisePhone, normaliseEmail, type LeadIdentity } from './identity';
import { chooseSeller, monthWindow, type SellerLoad } from './seller-assignment';

/**
 * SARIRO — a booked trial becomes somebody's job
 * ============================================================================
 * Booking a free class used to insert a student_leads row with a name and a
 * phone number and then stop. No account attached, no booking attached, no
 * seller — five of the thirteen leads in production had nobody assigned at
 * all, which means five families booked a class and nobody was ever told to
 * ring them.
 *
 * This is the one place a trial turns into a lead, for both the public form
 * and the staff modal, so the two cannot drift into producing different
 * records for the same event.
 *
 * ── Update, don't accumulate ────────────────────────────────────────────────
 * A family who books a second trial is the same family. Inserting again would
 * split their history in two, hand the second half to a different seller, and
 * leave a seller ringing about a class that a colleague has already discussed.
 * So an existing lead is found and updated, and only a genuinely new family
 * creates a row.
 *
 * ── Never fatal ─────────────────────────────────────────────────────────────
 * Every failure here returns rather than throws. The class is booked by the
 * time this runs; a family who has a teacher and a time must not be told the
 * booking failed because an internal CRM write did not land. The caller logs
 * and carries on, and an unlinked lead is visible in the unassigned queue.
 */

export interface TrialLeadInput {
  /** The account. The only identity here that is a fact rather than a guess. */
  studentId: string | null;
  bookingId: string | null;
  name: string;
  email: string | null;
  /** Any shape — normalised before it is compared to anything. */
  phone: string | null;
  grade: number | null;
  /** Course/track slug, where the booking knows one. */
  subject: string | null;
  source: 'self_book' | 'staff' | 'demo_request' | 'manual';
  timezone?: string | null;
  country?: string | null;
  /** Who did this. Null for the public form, where there is no staff actor. */
  actorId?: string | null;
  /**
   * Where the lead should land. Defaults to a booked trial, which is what
   * every caller wanted until "none of these times work" existed.
   *
   * That family has NO booking — inventing one to represent a class that will
   * not happen puts a ghost in the teacher's calendar and in every trial
   * count. They are a real lead at `seller_assigned` whose class still has to
   * be arranged by a person, so the caller says so rather than this module
   * assuming a booking happened.
   */
  stage?: 'trial_booked' | 'seller_assigned';
  /** Where the CLASS stands. Not the same question as the seller stage. */
  trialStatus?: 'booked' | 'slot_assistance';
}

export interface TrialLeadResult {
  leadId: string | null;
  sellerId: string | null;
  /** True when a new family was recorded, false when an existing one was updated. */
  created: boolean;
  /** Set when nothing could be written. The class is still booked. */
  error?: string;
}

/** Bounded so one strange row cannot pull the whole table into memory. */
const CANDIDATE_LIMIT = 50;

/**
 * Postgres "column does not exist". PostgREST returns it as a 400 with this
 * code rather than failing quietly.
 *
 * It is checked for because the code and the migration deploy separately, and
 * this project has twice shipped a migration that was installed and did not
 * run. If scripts/trial-lead-spine.sql has not been applied yet, every write
 * here would be rejected and a family who booked a free class would produce no
 * lead at all — strictly worse than the bare row this replaced. So a rejection
 * on that specific ground falls back to the columns that have always existed.
 */
const UNDEFINED_COLUMN = '42703';
/**
 * Postgres "check constraint violated".
 *
 * Worth its own case because of how this was found. student_leads has a CHECK
 * on `stage` that does not list 'trial_booked' — and 'trial_booked' is exactly
 * what the self-booking route has been writing since it shipped. The insert
 * sat inside a swallowed promise, so the rejection went nowhere: the class was
 * booked, the route returned success, and NO LEAD ROW EVER EXISTED. Every
 * family who booked their own free class was invisible to the sales side.
 *
 * scripts/trial-lead-spine.sql widens the constraint. Until it is applied,
 * writing the honest stage loses the lead entirely — so a rejection on that
 * ground retries with a stage the old database will accept. A lead in roughly
 * the right column beats no lead at all.
 */
const CHECK_VIOLATION = '23514';
const isMissingColumn = (e: { code?: string } | null | undefined) => e?.code === UNDEFINED_COLUMN;
const isCheckViolation = (e: { code?: string } | null | undefined) => e?.code === CHECK_VIOLATION;

/** The columns student_leads had before the spine migration. */
const LEGACY_KEYS = [
  'student_name', 'parent_name', 'email', 'phone', 'phone_country_code',
  'country', 'timezone', 'lead_type', 'area_of_interest', 'stage',
  'assigned_seller', 'last_updated',
] as const;

/** The nearest stage a database without the widened constraint will accept. */
const LEGACY_STAGE = 'gathering_booked';

const legacyOnly = (row: Record<string, unknown>): Record<string, unknown> => ({
  ...Object.fromEntries(
    Object.entries(row).filter(([k]) => (LEGACY_KEYS as readonly string[]).includes(k))
  ),
  ...(row.stage === 'trial_booked' ? { stage: LEGACY_STAGE } : {}),
});

/**
 * Find or create the lead for a trial booking, and make sure it has a seller.
 */
export async function linkTrialToLead(
  admin: SupabaseClient,
  input: TrialLeadInput
): Promise<TrialLeadResult> {
  try {
    const phone10 = normalisePhone(input.phone);
    const email = normaliseEmail(input.email);

    /* ── Who might this already be? ──────────────────────────────────────────
       Three cheap filters rather than reading the table: the account, the last
       ten digits of the number, and the email. Ordered oldest-first because
       matchLead() takes the first of an equal set, and the oldest row is the
       one a seller has been working. */
    const ors: string[] = [];
    if (input.studentId) ors.push(`student_id.eq.${input.studentId}`);
    // Digits only, so there is nothing here that could be read as filter syntax.
    if (phone10) ors.push(`phone.like.*${phone10}`);
    // Anything unusual in an address is left out rather than escaped — an
    // email is the weakest of the three signals and not worth a parser.
    if (email && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
      ors.push(`email.eq.${email}`);
    }

    let candidates: LeadIdentity[] = [];
    let spineInstalled = true;
    if (ors.length > 0) {
      const read = (columns: string, filters: string[]) =>
        admin
          .from('student_leads')
          .select(columns)
          .or(filters.join(',') || 'id.is.null')
          .order('created_at', { ascending: true })
          .limit(CANDIDATE_LIMIT);

      let rows: Record<string, unknown>[] = [];
      const first = await read('id, student_id, phone, email', ors);

      if (isMissingColumn(first.error)) {
        // The migration has not been applied to this database yet. Match on
        // what does exist, and write the legacy shape below.
        spineInstalled = false;
        const fallback = await read('id, phone, email', ors.filter((o) => !o.startsWith('student_id')));
        rows = (fallback.data ?? []) as unknown as Record<string, unknown>[];
      } else {
        rows = (first.data ?? []) as unknown as Record<string, unknown>[];
      }

      candidates = rows.map((r) => ({
        id: r.id as string,
        studentId: (r.student_id as string | null) ?? null,
        phone: (r.phone as string | null) ?? null,
        email: (r.email as string | null) ?? null,
      }));
    }

    const existing = matchLead(candidates, {
      studentId: input.studentId, phone: input.phone, email: input.email,
    });

    /* What the trial itself tells us, on either path. Written on both so an
       existing lead is brought up to date rather than left describing an
       enquiry from three weeks ago. */
    const fromTrial = {
      student_id: input.studentId,
      booking_id: input.bookingId,
      subject: input.subject,
      grade: input.grade,
      source: input.source,
      trial_status: input.trialStatus ?? 'booked',
      stage: input.stage ?? 'trial_booked',
      last_updated: new Date().toISOString(),
    };

    if (existing) {
      const prior = (await admin
        .from('student_leads')
        .select('assigned_seller, stage')
        .eq('id', existing.id)
        .maybeSingle()).data as { assigned_seller: string | null; stage: string | null } | null;

      /* Their seller is kept. Re-running the distribution on a returning
         family would hand them to whoever is quietest this month and undo a
         deliberate transfer — §30's rule, that attribution follows the person
         actually working the family, starts here. */
      let sellerId = prior?.assigned_seller ?? null;
      if (!sellerId) sellerId = await assignSeller(admin);

      const patch = { ...fromTrial, assigned_seller: sellerId };
      let upd = await admin.from('student_leads')
        .update(spineInstalled ? patch : legacyOnly(patch)).eq('id', existing.id);
      if (isMissingColumn(upd.error) || isCheckViolation(upd.error)) {
        upd = await admin.from('student_leads').update(legacyOnly(patch)).eq('id', existing.id);
      }
      if (upd.error) return { leadId: existing.id, sellerId, created: false, error: upd.error.message };

      await note(admin, existing.id, {
        /* The history has to say which of the two actually happened. A family
           who could not be given a time, recorded as "trial_booked", is a
           trial nobody will ever find and a count that is quietly too high. */
        action: fromTrial.stage === 'trial_booked' ? 'trial_booked' : 'stage_changed',
        old_value: prior?.stage ?? null,
        new_value: `${fromTrial.stage} (matched on ${existing.on})`,
        performed_by: input.actorId ?? null,
      });

      return { leadId: existing.id, sellerId, created: false };
    }

    // ── A family we have not met ────────────────────────────────────────────
    const sellerId = await assignSeller(admin);

    const row: Record<string, unknown> = {
      ...fromTrial,
      student_name: input.name,
      parent_name: input.name,
      email: input.email || null,
      /* Stored the way this table has always stored it — without the country
         code — so existing screens keep working. Matching never reads it
         raw; see normalisePhone(). */
      phone: (input.phone ?? '').replace(/^\+91/, '') || null,
      phone_country_code: 'IN',
      country: input.country ?? null,
      timezone: input.timezone ?? null,
      lead_type: 'student',
      area_of_interest: input.subject,
      assigned_seller: sellerId,
    };

    let ins = await admin.from('student_leads')
      .insert(spineInstalled ? row : legacyOnly(row)).select('id').single();
    if (isMissingColumn(ins.error) || isCheckViolation(ins.error)) {
      ins = await admin.from('student_leads').insert(legacyOnly(row)).select('id').single();
    }
    const created = ins.data;

    if (ins.error || !created) {
      return { leadId: null, sellerId, created: false, error: ins.error?.message ?? 'insert failed' };
    }

    await note(admin, created.id as string, {
      action: 'created',
      old_value: null,
      new_value: `trial booked via ${input.source}`,
      performed_by: input.actorId ?? null,
    });
    if (sellerId) {
      await note(admin, created.id as string, {
        action: 'seller_assigned',
        old_value: null,
        new_value: sellerId,
        performed_by: null, // the system, not a person
      });
    }

    return { leadId: created.id as string, sellerId, created: true };
  } catch (err) {
    return {
      leadId: null, sellerId: null, created: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * The seller carrying the least this month, or null when there are none.
 *
 * Counts are read rather than stored — see seller-assignment.ts for why that
 * matters. The month is India's, not UTC's: a lead arriving at 2am on the 1st
 * belongs to the new month's fairness, and to the new month's target.
 */
async function assignSeller(admin: SupabaseClient): Promise<string | null> {
  const { data: sellers } = await admin
    .from('profiles')
    .select('id')
    .or('is_seller.eq.true,role.eq.seller');

  const ids = (sellers ?? []).map((s) => s.id as string);
  /* Nobody in the seat. The lead is still created, unassigned, and shows up in
     the unassigned queue — losing a free class booking over an internal
     staffing gap is the worst possible trade. */
  if (ids.length === 0) return null;

  const { start, end } = monthWindow();
  const { data: held } = await admin
    .from('student_leads')
    .select('assigned_seller')
    .in('assigned_seller', ids)
    .gte('created_at', start)
    .lt('created_at', end);

  const counts = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const row of held ?? []) {
    const id = row.assigned_seller as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const loads: SellerLoad[] = ids.map((id) => ({ id, assignedThisMonth: counts.get(id) ?? 0 }));
  return chooseSeller(loads);
}

/** One line in the lead's history. Best-effort: history must never block a booking. */
async function note(
  admin: SupabaseClient,
  leadId: string,
  row: { action: string; old_value: string | null; new_value: string | null; performed_by: string | null }
): Promise<void> {
  try {
    await admin.from('lead_history').insert({ lead_id: leadId, ...row });
  } catch {
    /* Deliberately swallowed. Losing an audit line is bad; refusing a booking
       because an audit line would not write is worse. */
  }
}
