/**
 * SARIRO — the six lists a seller should not have to assemble
 * ============================================================================
 * A seller opens their dashboard and sees every lead assigned to them, ordered
 * by when it arrived. That ordering is the one thing that does not matter: a
 * lead from three weeks ago whose trial finished yesterday needs a call today,
 * and a lead from this morning that has not had its class yet does not.
 *
 * So the day's work is buried in a list, and working out which four of the
 * forty need ringing is a job the seller does by reading — every morning,
 * from scratch, and differently each time.
 *
 * Every one of these six answers is already in the database. None of them is
 * on a screen.
 *
 * ── Why this is a pure function and not a query ─────────────────────────────
 * Six queries would be six chances for the definitions to drift — and they
 * WOULD drift, because "final conversation pending" is a phrase, not a column.
 * Bucketing in one place means a lead is in exactly one queue by construction,
 * and the tests can prove that without a database.
 *
 * It also makes the counts and the lists the same computation. A badge saying
 * 3 above a list showing 2 is the kind of thing nobody reports and everybody
 * stops trusting.
 */

import type { LeadStage } from '@/lib/dashboard/leads-data';
import { isToday, isOverdue, type ReminderRow } from '@/lib/seller/reminders';

/** The six, in the order they appear on the dashboard. */
export type QueueKey =
  | 'slot_assistance'
  | 'missed_trial'
  | 'final_conversation'
  | 'today_followup'
  | 'overdue_followup'
  | 'converted';

/** The lead fields these definitions actually read. */
export interface QueueLead {
  id: string;
  student_name?: string | null;
  stage: LeadStage | string;
  trial_status?: string | null;
  assigned_seller?: string | null;
  created_at?: string;
  last_updated?: string;
}

export interface QueueDefinition {
  key: QueueKey;
  label: string;
  /** What the seller is supposed to DO — a queue with no verb is a report. */
  action: string;
  /** Tailwind chip classes, matching STAGE_COLORS' vocabulary. */
  tone: { chip: string; ring: string };
  /** True when an empty version of this queue is still worth showing. */
  alwaysShow: boolean;
}

export const QUEUES: QueueDefinition[] = [
  {
    key: 'slot_assistance',
    label: 'Needs slot assistance',
    action: 'Find them a time',
    tone: { chip: 'bg-amber-100 text-amber-800', ring: 'ring-amber-200' },
    alwaysShow: false,
  },
  {
    key: 'missed_trial',
    label: 'Missed trials',
    action: 'Rebook the class',
    tone: { chip: 'bg-rose-100 text-rose-800', ring: 'ring-rose-200' },
    alwaysShow: false,
  },
  {
    key: 'final_conversation',
    label: 'Final conversation pending',
    action: 'Close the sale',
    tone: { chip: 'bg-orange-100 text-orange-800', ring: 'ring-orange-200' },
    alwaysShow: true,
  },
  {
    key: 'today_followup',
    label: "Today's follow-ups",
    action: 'Ring them today',
    tone: { chip: 'bg-blue-100 text-blue-800', ring: 'ring-blue-200' },
    alwaysShow: true,
  },
  {
    key: 'overdue_followup',
    label: 'Overdue follow-ups',
    action: 'Late — ring now',
    tone: { chip: 'bg-red-100 text-red-800', ring: 'ring-red-200' },
    alwaysShow: false,
  },
  {
    key: 'converted',
    label: 'Converted',
    action: 'Sale done',
    tone: { chip: 'bg-green-100 text-green-800', ring: 'ring-green-200' },
    alwaysShow: true,
  },
];

export type QueueBuckets = Record<QueueKey, QueueLead[]>;

/** Every queue empty. The single place the six are enumerated. */
export function emptyQueues(): QueueBuckets {
  return {
    slot_assistance: [], missed_trial: [], final_conversation: [],
    today_followup: [], overdue_followup: [], converted: [],
  };
}

/**
 * Sort every lead into the queue it belongs in.
 *
 * ── One lead, one queue ─────────────────────────────────────────────────────
 * A lead with an overdue reminder AND a finished trial is one job, not two.
 * Putting it in both lists means the seller rings once and one of the two
 * counts stays stubbornly non-zero — which is how people learn to ignore a
 * badge.
 *
 * The order below IS the priority order, and it is not arbitrary:
 *
 *   1. converted        — finished. Never chase somebody who has already paid.
 *   2. overdue          — a promise to a parent that has already been broken.
 *   3. missed trial     — the family turned up to nothing, or did not turn up.
 *      slot assistance  — they asked for a time and got none.
 *   4. final            — the class went well; this is the money conversation.
 *   5. today            — scheduled work, not yet late.
 *
 * Converted first is the one that looks wrong and is not: `enrolled` is a
 * terminal stage, and a stale reminder left on a lead that has since bought
 * must not put them back in the chase list.
 */
export function bucketLeads(
  leads: readonly QueueLead[],
  reminders: readonly ReminderRow[] = [],
  now: number | Date = Date.now(),
  timeZone = 'Asia/Kolkata'
): QueueBuckets {
  const out = emptyQueues();

  /* Which leads have a reminder in each state. A lead with several pending
     reminders appears once — the seller is ringing the person, not the row. */
  const overdueLeads = new Set<string>();
  const todayLeads = new Set<string>();
  for (const r of reminders) {
    if (!r?.lead_id) continue;
    if (isOverdue(r, now, timeZone)) overdueLeads.add(r.lead_id);
    else if (isToday(r, now, timeZone)) todayLeads.add(r.lead_id);
  }

  for (const lead of leads) {
    if (!lead?.id) continue;
    const stage = String(lead.stage ?? '');
    const trial = String(lead.trial_status ?? '');

    if (stage === 'enrolled') { out.converted.push(lead); continue; }
    if (overdueLeads.has(lead.id)) { out.overdue_followup.push(lead); continue; }
    if (trial === 'no_show') { out.missed_trial.push(lead); continue; }
    if (trial === 'slot_assistance') { out.slot_assistance.push(lead); continue; }
    if (stage === 'final') { out.final_conversation.push(lead); continue; }
    if (todayLeads.has(lead.id)) { out.today_followup.push(lead); continue; }
  }

  /* Oldest first inside every queue. A family kept waiting longest is the one
     most likely to have gone elsewhere, and is therefore the next call. */
  for (const key of Object.keys(out) as QueueKey[]) {
    out[key].sort((a, b) => stamp(a) - stamp(b));
  }
  /* Except the finished list, which reads newest-first like any receipt. */
  out.converted.reverse();

  return out;
}

function stamp(l: QueueLead): number {
  const t = Date.parse(l.last_updated ?? l.created_at ?? '');
  return Number.isFinite(t) ? t : 0;
}

/** Just the numbers, for the badges. Same computation as the lists. */
export function queueCounts(b: QueueBuckets): Record<QueueKey, number> {
  return {
    slot_assistance: b.slot_assistance.length,
    missed_trial: b.missed_trial.length,
    final_conversation: b.final_conversation.length,
    today_followup: b.today_followup.length,
    overdue_followup: b.overdue_followup.length,
    converted: b.converted.length,
  };
}

/**
 * Which queues to draw.
 *
 * An empty "Overdue follow-ups" is good news and takes up the space the seller
 * needs for the work they do have — so it disappears. An empty "Today's
 * follow-ups" stays, because zero there means something different: nothing is
 * planned, which is itself worth seeing.
 */
export function visibleQueues(counts: Record<QueueKey, number>): QueueDefinition[] {
  return QUEUES.filter((q) => q.alwaysShow || counts[q.key] > 0);
}
