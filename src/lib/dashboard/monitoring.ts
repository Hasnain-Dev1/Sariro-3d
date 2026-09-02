'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — teacher monitoring
 * =========================================================
 * V2 §29-32. One module, read by both the admin form that writes a score and
 * the teacher tab that reads it, so the two cannot drift on what a category is
 * called or how an average is reached.
 *
 * ── The categories are data, not markup ─────────────────────────────────────
 * Listing them once here means the form renders nine inputs from this array and
 * the teacher's breakdown renders nine rows from the same array. Adding a tenth
 * category is a migration plus one line, not a hunt through two components.
 *
 * ── The average is not computed here ────────────────────────────────────────
 * `overall_score` is a generated column in Postgres. Deliberately: a score
 * shown as 8.2 on the teacher's dashboard and 8.3 on the admin's, because two
 * places rounded differently, is exactly the kind of small wrongness that makes
 * people stop trusting a number they cannot check.
 */

export interface MonitoringCategory {
  /** Column name — also the form field key. */
  key: string;
  label: string;
  /** What the observer is actually judging. Shown under the label on the form. */
  hint: string;
}

/** §30, in the order they are scored. */
export const CATEGORIES: MonitoringCategory[] = [
  { key: 'concept_clarity', label: 'Concept clarity', hint: 'Was the idea itself explained correctly and clearly?' },
  { key: 'teaching_quality', label: 'Teaching quality', hint: 'Pacing, examples, and whether the method suited the topic.' },
  { key: 'student_engagement', label: 'Student engagement', hint: 'Were the learners actually with them, or just present?' },
  { key: 'communication', label: 'Communication', hint: 'Clarity of speech, language level, checking for understanding.' },
  { key: 'time_management', label: 'Time management', hint: 'Did the class start, move and finish as planned?' },
  { key: 'doubt_handling', label: 'Doubt handling', hint: 'How questions were received and answered.' },
  { key: 'classroom_management', label: 'Classroom management', hint: 'Attention, turn-taking, keeping four learners together.' },
  { key: 'technical_execution', label: 'Technical execution', hint: 'Audio, video, screen share, materials ready.' },
  { key: 'student_interaction', label: 'Student interaction', hint: 'Warmth, names used, individual attention.' },
];

export interface MonitoringRecord {
  id: string;
  teacher_id: string;
  booking_id: string | null;
  observed_on: string;
  observer_id: string | null;
  /** Null when nothing was scored — a record can be notes only. */
  overall_score: number | null;
  scores: Record<string, number | null>;
  strengths: string | null;
  improvements: string | null;
  action_items: string | null;
  notes: string | null;
  created_at: string;
}

export interface MonitoringSummary {
  count: number;
  /** Mean of the overall scores. Null until at least one has been scored. */
  average: number | null;
  highest: number | null;
  lowest: number | null;
  /** Newest first. */
  records: MonitoringRecord[];
}

type Row = Record<string, unknown>;

function toRecord(r: Row): MonitoringRecord {
  const scores: Record<string, number | null> = {};
  for (const c of CATEGORIES) scores[c.key] = (r[c.key] as number | null) ?? null;
  return {
    id: r.id as string,
    teacher_id: r.teacher_id as string,
    booking_id: (r.booking_id as string) ?? null,
    observed_on: (r.observed_on as string) ?? '',
    observer_id: (r.observer_id as string) ?? null,
    overall_score: r.overall_score === null || r.overall_score === undefined ? null : Number(r.overall_score),
    scores,
    strengths: (r.strengths as string) ?? null,
    improvements: (r.improvements as string) ?? null,
    action_items: (r.action_items as string) ?? null,
    notes: (r.notes as string) ?? null,
    created_at: (r.created_at as string) ?? '',
  };
}

/**
 * Every monitoring record for one teacher, newest first.
 *
 * RLS decides what comes back: a teacher sees their own, staff see anyone's.
 * The caller does not filter — asking the database to answer honestly is safer
 * than trusting a component to pass the right id.
 */
export async function fetchMonitoring(teacherId: string): Promise<MonitoringSummary> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('teacher_monitoring')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('observed_on', { ascending: false });

  if (error) throw error;

  const records = ((data ?? []) as Row[]).map(toRecord);
  const scored = records.map((r) => r.overall_score).filter((n): n is number => n !== null);

  return {
    count: records.length,
    average: scored.length
      ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10
      : null,
    highest: scored.length ? Math.max(...scored) : null,
    lowest: scored.length ? Math.min(...scored) : null,
    records,
  };
}

export interface MonitoringDraft {
  teacherId: string;
  bookingId?: string | null;
  cohortId?: string | null;
  observedOn?: string;
  scores: Record<string, number | null>;
  strengths?: string;
  improvements?: string;
  actionItems?: string;
  notes?: string;
}

/** Writes one observation. RLS refuses anyone below admin. */
export async function saveMonitoring(
  draft: MonitoringDraft
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not signed in' };

  const row: Row = {
    teacher_id: draft.teacherId,
    booking_id: draft.bookingId ?? null,
    cohort_id: draft.cohortId ?? null,
    observer_id: user.id,
    observed_on: draft.observedOn ?? new Date().toISOString().slice(0, 10),
    strengths: draft.strengths?.trim() || null,
    improvements: draft.improvements?.trim() || null,
    action_items: draft.actionItems?.trim() || null,
    notes: draft.notes?.trim() || null,
  };
  // Unscored categories go in as null rather than 0 — see the migration.
  for (const c of CATEGORIES) {
    const v = draft.scores[c.key];
    row[c.key] = typeof v === 'number' && v >= 1 && v <= 10 ? v : null;
  }

  const { error } = await supabase.from('teacher_monitoring').insert(row);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
