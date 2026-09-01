'use client';

import { createClient } from '@/lib/supabase/client';
import { describeChoice, type LearnerStage } from '@/lib/demo/learner-choice';

/**
 * SARIRO — who is asking, in aggregate
 * =========================================================
 * The booking form now records three things it never did: which subject, which
 * part of it, and where the learner is in their education. Every one of those
 * answers currently lands in a row that a human reads once and closes.
 *
 * This turns them into the three questions the business actually has:
 *
 *   Who is asking?     school children, undergraduates, or people in work
 *   What do they want? which subject is carrying the enquiries
 *   Which years?       where the school demand actually sits
 *
 * ── Read from one table, on purpose ─────────────────────────────────────────
 * Everything here comes from `demo_class_requests`. No joins, no new tables,
 * nothing to keep in step. Conversion by segment — does a professional pay more
 * readily than a parent — needs a join through `profiles` to `purchase_intents`
 * and is a separate piece of work with its own caveats; it is deliberately not
 * smuggled in here.
 *
 * ── What it cannot tell you yet ─────────────────────────────────────────────
 * The columns were added on 1 Sep 2026. Every booking before that has
 * `subject = null` and `learner_stage = null`, and those rows are counted
 * separately as "not asked" rather than silently dropped — otherwise the totals
 * would disagree with the request list on the same page, and a number that
 * contradicts the table above it is worse than no number.
 */

export interface Slice {
  key: string;
  label: string;
  count: number;
  /** Share of the total that HAS an answer, 0..1. */
  share: number;
}

export interface DemandSnapshot {
  windowDays: number;
  /** Every request in the window, answered or not. */
  total: number;
  /** Requests taken before the fields existed, or where the visitor skipped them. */
  unanswered: number;
  stages: Slice[];
  subjects: Slice[];
  /** School learners only, by year. Empty when nobody has said. */
  grades: Slice[];
  /** The most recent few, described in words, for a sanity check against the charts. */
  recent: { at: string; what: string }[];
  /** True when nothing in the window carries any of the new fields. */
  empty: boolean;
}

const DAY_MS = 86_400_000;

const STAGE_LABEL: Record<LearnerStage, string> = {
  school: 'At school',
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  professional: 'Working professional',
};

/** Fixed order, so a slice never changes colour because its rank changed. */
const STAGE_ORDER: LearnerStage[] = ['school', 'undergraduate', 'postgraduate', 'professional'];

interface Row {
  created_at: string | null;
  subject: string | null;
  focus: string | null;
  learner_stage: string | null;
  learner_grade: number | null;
}

function tally(
  rows: Row[],
  pick: (r: Row) => string | null,
  label: (key: string) => string,
  order?: string[]
): Slice[] {
  const counts = new Map<string, number>();
  let answered = 0;
  for (const r of rows) {
    const k = pick(r);
    if (!k) continue;
    answered++;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const entries = [...counts.entries()].map(([key, count]) => ({
    key,
    label: label(key),
    count,
    share: answered > 0 ? count / answered : 0,
  }));

  // A fixed order where one is given (stages), otherwise biggest first.
  return order
    ? entries.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
    : entries.sort((a, b) => b.count - a.count);
}

export async function fetchDemand(windowDays = 30): Promise<DemandSnapshot> {
  const supabase = createClient();
  const since = new Date(Date.now() - (windowDays - 1) * DAY_MS);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('demo_class_requests')
    .select('created_at, subject, focus, learner_stage, learner_grade')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as Row[];

  const stages = tally(
    rows,
    (r) => r.learner_stage,
    (k) => STAGE_LABEL[k as LearnerStage] ?? k,
    STAGE_ORDER
  );

  const subjects = tally(
    rows,
    (r) => r.subject,
    // describeChoice with only a subject returns just the subject's label.
    (k) => describeChoice(k, null, null, null)
  );

  const grades = tally(
    rows,
    (r) => (r.learner_stage === 'school' && r.learner_grade ? String(r.learner_grade) : null),
    (k) => `Grade ${k}`,
    // Numeric order, not popularity: a grade axis that jumps 8, 3, 11 is unreadable.
    Array.from({ length: 12 }, (_, i) => String(i + 1))
  );

  const unanswered = rows.filter((r) => !r.subject && !r.learner_stage).length;

  return {
    windowDays,
    total: rows.length,
    unanswered,
    stages,
    subjects,
    grades,
    recent: rows.slice(0, 5).map((r) => ({
      at: (r.created_at ?? '').slice(0, 10),
      what: describeChoice(r.subject, r.focus, r.learner_stage, r.learner_grade),
    })),
    empty: rows.length === 0 || rows.length === unanswered,
  };
}
