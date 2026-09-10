/**
 * SARIRO — the events that had nowhere to be written down
 * ============================================================================
 * Two logs already exist and each owns its story:
 *
 *   lead_history      — a lead's stage changed, and who changed it
 *   admin_audit_logs  — somebody with power did something
 *
 * Neither can hold "this student's main credit hit zero" or "this catch-up
 * went overdue", because no lead and no admin was involved. Today those
 * moments exist only as a MUTATED COLUMN: `student_status` went from 'active'
 * to 'paused_credit_issue' and the previous value is gone, along with when it
 * changed and what caused it. When a parent asks why their classes stopped on
 * the 3rd, there is nothing to read.
 *
 * ── This is not a third audit log ───────────────────────────────────────────
 * Nothing is double-written. A lead stage change goes to lead_history and NOT
 * here; an admin action goes to admin_audit_logs and NOT here. This table is
 * for the events with no other home, which is why the list below is short and
 * specific rather than a general-purpose firehose.
 *
 * ── Never fatal, never silent ───────────────────────────────────────────────
 * A missing event row must not fail the thing it was describing — refusing to
 * add credits because the log was full would be absurd. But "non-fatal" was
 * once implemented in this codebase as `.then(() => {}, () => {})`, which hid a
 * CHECK constraint that had been rejecting every lead for months. So it goes
 * through bestEffort(), which swallows the failure and names it in the log.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * The events this system records.
 *
 * A closed union rather than a string, because the whole value of an event log
 * is being able to ask it a question later — and `'credit_exhausted'` written
 * in one route and `'credits_exhausted'` in another makes half the answer
 * invisible with nothing to warn you. This codebase has already produced four
 * hand-written lists of lead stages, the fourth of which was stale.
 */
export type DomainEvent =
  // Trial
  | 'trial.booked'
  | 'trial.completed'
  | 'trial.no_show'
  | 'trial.slot_assistance'
  // Sales pipeline
  | 'lead.assigned'
  | 'lead.transferred'
  | 'seller.reminder_due'
  | 'sale.confirmed'
  | 'sale.punched'
  | 'incentive.earned'
  | 'incentive.decided'
  | 'incentive.changed_after_decision'
  // Credits
  | 'credit.exhausted'
  | 'credit.added'
  | 'student.auto_paused'
  | 'student.auto_resumed'
  // Catch-up
  | 'catchup.required'
  | 'catchup.scheduled'
  | 'catchup.overdue'
  | 'catchup.completed';

export interface EventInput {
  event: DomainEvent;
  /** 'student' | 'lead' | 'booking' | 'sale' | 'seller_month' | 'catchup' */
  subjectType?: string;
  subjectId?: string | null;
  actorId?: string | null;
  /** Anything a human would want when reading this back. Keep it small. */
  payload?: Record<string, unknown>;
}

/**
 * Write one event. Returns whether it landed, for callers that care.
 *
 * Most callers do not care and should not check — the point is that the thing
 * being described has already happened by the time this runs.
 */
export async function recordEvent(
  admin: SupabaseClient,
  input: EventInput
): Promise<boolean> {
  return bestEffort(
    `domain_events: ${input.event}`,
    admin.from('domain_events').insert({
      event: input.event,
      subject_type: input.subjectType ?? null,
      subject_id: input.subjectId ?? null,
      actor_id: input.actorId ?? null,
      payload: input.payload ?? null,
    })
  );
}

/**
 * Several at once, in one round trip.
 *
 * Used where one action genuinely causes several distinct events — a payment
 * that adds credits, resumes a student and creates three catch-up obligations
 * is four things that happened, not one thing with a long description.
 */
export async function recordEvents(
  admin: SupabaseClient,
  inputs: readonly EventInput[]
): Promise<boolean> {
  if (inputs.length === 0) return true;
  return bestEffort(
    `domain_events: ${inputs.map((i) => i.event).join(', ')}`,
    admin.from('domain_events').insert(
      inputs.map((i) => ({
        event: i.event,
        subject_type: i.subjectType ?? null,
        subject_id: i.subjectId ?? null,
        actor_id: i.actorId ?? null,
        payload: i.payload ?? null,
      }))
    )
  );
}

/** Human wording for a timeline. One place, so no screen invents its own. */
export const EVENT_LABELS: Record<DomainEvent, string> = {
  'trial.booked': 'Trial booked',
  'trial.completed': 'Trial completed',
  'trial.no_show': 'Student did not attend',
  'trial.slot_assistance': 'No offered time worked',
  'lead.assigned': 'Assigned to a seller',
  'lead.transferred': 'Moved to another seller',
  'seller.reminder_due': 'Follow-up reminder fired',
  'sale.confirmed': 'Seller confirmed the sale',
  'sale.punched': 'HR punched the sale',
  'incentive.earned': 'Incentive threshold reached',
  'incentive.decided': 'HR decided the incentive',
  'incentive.changed_after_decision': 'Entitlement changed after HR decided',
  'credit.exhausted': 'Main credits reached zero',
  'credit.added': 'Credits added',
  'student.auto_paused': 'Classes paused automatically',
  'student.auto_resumed': 'Classes resumed automatically',
  'catchup.required': 'Catch-up lesson owed',
  'catchup.scheduled': 'Catch-up scheduled',
  'catchup.overdue': 'Catch-up passed its deadline',
  'catchup.completed': 'Catch-up taught',
};
