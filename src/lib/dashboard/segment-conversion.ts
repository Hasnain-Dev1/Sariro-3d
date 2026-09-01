'use client';

import { createClient } from '@/lib/supabase/client';
import type { LearnerStage } from '@/lib/demo/learner-choice';

/**
 * SARIRO — does who they are predict whether they pay?
 * =========================================================
 * The demand panel says who is asking. This says which of them buy, which is
 * the number that decides where the next month of effort goes: if working
 * professionals convert at four times the rate of school parents, the site is
 * arguing with the wrong person on every page.
 *
 * ── The join, and exactly what it misses ────────────────────────────────────
 * There is no direct link between an enquiry and a payment. `purchase_intents`
 * identifies a buyer by `user_id`; `demo_class_requests` mostly has no user at
 * all, because a visitor books a free class before they ever sign up. What both
 * do carry is an email address, so:
 *
 *     demo.email  ->  profiles.email  ->  profiles.id = purchase_intents.user_id
 *
 * That works, and it undercounts. It finds nobody who booked with one address
 * and paid with another, and nobody who paid without an account. So every
 * figure here is a FLOOR — the true rate is this or better, never worse.
 *
 * That is stated on the panel rather than buried here. A conversion rate a
 * reader believes is exact, when it is actually a lower bound, is worse than no
 * rate at all: it gets used to kill a segment that was performing fine.
 *
 * ── Why the purchase must come after the enquiry ────────────────────────────
 * Someone who bought in June and booked a free class in September did not
 * convert from that enquiry — they were already a customer looking at a second
 * subject. Counting them would flatter every segment they appear in, and would
 * flatter the segments with the most existing customers the most.
 */

export interface SegmentRow {
  key: LearnerStage | 'unknown';
  label: string;
  /** Enquiries from this segment in the window. */
  enquiries: number;
  /** Of those, how many we can prove later paid. */
  paid: number;
  /** paid / enquiries, or null when the segment is too small to mean anything. */
  rate: number | null;
}

export interface SegmentConversion {
  windowDays: number;
  rows: SegmentRow[];
  /** Enquiries whose email we could match to an account at all. */
  matchable: number;
  /** Total enquiries with an email address in the window. */
  withEmail: number;
  /** True when nothing can be said yet. */
  empty: boolean;
}

const DAY_MS = 86_400_000;

const LABEL: Record<SegmentRow['key'], string> = {
  school: 'At school',
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  professional: 'Working professional',
  unknown: 'Did not say',
};

const ORDER: SegmentRow['key'][] = [
  'school',
  'undergraduate',
  'postgraduate',
  'professional',
  'unknown',
];

/**
 * Below this, a percentage is noise dressed as a finding.
 *
 * One enquiry that converted is "100%", and somebody will act on it. Segments
 * under this threshold show their counts and no rate.
 */
const MIN_FOR_RATE = 5;

const norm = (e: string | null) => (e ?? '').trim().toLowerCase();

export async function fetchSegmentConversion(windowDays = 90): Promise<SegmentConversion> {
  const supabase = createClient();
  const since = new Date(Date.now() - (windowDays - 1) * DAY_MS);
  since.setHours(0, 0, 0, 0);

  const { data: demoData, error: demoErr } = await supabase
    .from('demo_class_requests')
    .select('email, learner_stage, created_at')
    .gte('created_at', since.toISOString());
  if (demoErr) throw demoErr;

  const demos = (demoData ?? []) as {
    email: string | null;
    learner_stage: string | null;
    created_at: string | null;
  }[];

  const withEmail = demos.filter((d) => norm(d.email).length > 0);
  const emails = [...new Set(withEmail.map((d) => norm(d.email)))];

  // Nothing to join against.
  if (emails.length === 0) {
    return {
      windowDays,
      rows: [],
      matchable: 0,
      withEmail: 0,
      empty: true,
    };
  }

  // Chunked: `in` is a URL filter, and a few hundred addresses in one query
  // string is how a dashboard starts returning 414s in a year's time.
  const CHUNK = 100;
  const profiles: { id: string; email: string | null }[] = [];
  for (let i = 0; i < emails.length; i += CHUNK) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', emails.slice(i, i + CHUNK));
    if (error) throw error;
    profiles.push(...((data ?? []) as { id: string; email: string | null }[]));
  }

  const idByEmail = new Map<string, string>();
  for (const p of profiles) {
    const e = norm(p.email);
    if (e) idByEmail.set(e, p.id);
  }

  const userIds = [...new Set([...idByEmail.values()])];
  const paidAtByUser = new Map<string, string[]>();
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const { data, error } = await supabase
      .from('purchase_intents')
      .select('user_id, status, created_at')
      .eq('status', 'confirmed')
      .in('user_id', userIds.slice(i, i + CHUNK));
    if (error) throw error;
    for (const row of (data ?? []) as { user_id: string; created_at: string | null }[]) {
      if (!row.created_at) continue;
      const list = paidAtByUser.get(row.user_id) ?? [];
      list.push(row.created_at);
      paidAtByUser.set(row.user_id, list);
    }
  }

  const tally = new Map<SegmentRow['key'], { enquiries: number; paid: number }>();
  let matchable = 0;

  for (const d of withEmail) {
    const key = (
      d.learner_stage === 'school' ||
      d.learner_stage === 'undergraduate' ||
      d.learner_stage === 'postgraduate' ||
      d.learner_stage === 'professional'
        ? d.learner_stage
        : 'unknown'
    ) as SegmentRow['key'];

    const entry = tally.get(key) ?? { enquiries: 0, paid: 0 };
    entry.enquiries++;

    const userId = idByEmail.get(norm(d.email));
    if (userId) {
      matchable++;
      const payments = paidAtByUser.get(userId) ?? [];
      // Only a payment at or after the enquiry counts as coming FROM it.
      const askedAt = d.created_at ?? '';
      if (payments.some((p) => p >= askedAt)) entry.paid++;
    }
    tally.set(key, entry);
  }

  const rows: SegmentRow[] = ORDER.filter((k) => tally.has(k)).map((k) => {
    const t = tally.get(k)!;
    return {
      key: k,
      label: LABEL[k],
      enquiries: t.enquiries,
      paid: t.paid,
      rate: t.enquiries >= MIN_FOR_RATE ? t.paid / t.enquiries : null,
    };
  });

  return {
    windowDays,
    rows,
    matchable,
    withEmail: withEmail.length,
    empty: withEmail.length === 0,
  };
}

export { MIN_FOR_RATE };
