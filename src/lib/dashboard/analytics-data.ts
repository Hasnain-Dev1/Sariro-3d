'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — the funnel, from data that already exists
 * =========================================================
 * The site was rebuilt to convert and then shipped with no way to tell whether
 * it does. Every decision after this one — is the sticky bar earning its place,
 * does the exit popup save leavers or annoy them — is a guess until something
 * counts.
 *
 * ── Why there is no tracking table ──────────────────────────────────────────
 * The obvious move is a `site_events` table and a client that pings it on every
 * page view. That is a migration, an endpoint, a consent question, and a new
 * thing to keep working — before answering a single question.
 *
 * Sariro already records the whole *money* funnel:
 *
 *   demo_class_requests   someone asked for a free class
 *   purchase_intents      pending   = reached checkout, order created
 *                         confirmed = paid
 *                         expired   = abandoned
 *   enrollments           active    = actually learning
 *
 * That is the part worth knowing. "How many people saw the homepage" is a
 * vanity number; "how many reached checkout and how many of those paid" decides
 * what to build next. This reads what is already there, so it works today and
 * has nothing to maintain.
 *
 * ── What it deliberately cannot tell you ────────────────────────────────────
 * Traffic and page-level drop-off. Nothing counts a visitor who reads the
 * homepage and leaves, so the top of the funnel is invisible. That needs
 * page-view tracking and is a separate decision, with its own privacy
 * consequences. Everything below is honest about starting at "asked for
 * something", not at "arrived".
 */

export interface DayPoint {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  demoRequests: number;
  checkoutsStarted: number;
  paid: number;
}

export interface FunnelStep {
  label: string;
  value: number;
  /** Share of the widest step, 0..1 — what the bar length encodes. */
  share: number;
  /** Conversion from the previous step, null for the first. */
  fromPrevious: number | null;
  hint: string;
}

export interface TopProduct {
  label: string;
  intents: number;
  paid: number;
}

export interface AnalyticsSnapshot {
  windowDays: number;
  daily: DayPoint[];
  funnel: FunnelStep[];
  topProducts: TopProduct[];
  totals: {
    demoRequests: number;
    checkoutsStarted: number;
    paid: number;
    /** paid / checkoutsStarted, 0..1. Null when nothing reached checkout. */
    checkoutConversion: number | null;
    activeEnrolments: number;
  };
  /** True when every source returned zero — a real state, not an error. */
  empty: boolean;
}

const DAY_MS = 86_400_000;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Every day in the window, so a quiet day is a zero rather than a gap. */
function emptyDays(windowDays: number): Map<string, DayPoint> {
  const days = new Map<string, DayPoint>();
  const today = new Date();
  for (let i = windowDays - 1; i >= 0; i--) {
    const key = isoDay(new Date(today.getTime() - i * DAY_MS));
    days.set(key, { date: key, demoRequests: 0, checkoutsStarted: 0, paid: 0 });
  }
  return days;
}

function bump(days: Map<string, DayPoint>, createdAt: string | null, field: keyof Omit<DayPoint, 'date'>) {
  if (!createdAt) return;
  const key = createdAt.slice(0, 10);
  const point = days.get(key);
  // Rows outside the window are simply not plotted — they are still counted in
  // the totals query, which is scoped separately.
  if (point) point[field] += 1;
}

export async function fetchAnalytics(windowDays = 30): Promise<AnalyticsSnapshot> {
  const supabase = createClient();
  const since = new Date(Date.now() - (windowDays - 1) * DAY_MS);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [demoRes, intentRes, enrolRes] = await Promise.all([
    supabase
      .from('demo_class_requests')
      .select('created_at')
      .gte('created_at', sinceIso),
    supabase
      .from('purchase_intents')
      .select('created_at, status, track, level')
      .gte('created_at', sinceIso),
    supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ]);

  const days = emptyDays(windowDays);

  const demos = (demoRes.data ?? []) as { created_at: string | null }[];
  for (const row of demos) bump(days, row.created_at, 'demoRequests');

  const intents = (intentRes.data ?? []) as {
    created_at: string | null;
    status: string | null;
    track: string | null;
    level: string | null;
  }[];

  // Every intent reached checkout — that is what creating one means. Only some
  // were then paid. Counting "confirmed" as a separate funnel stage rather than
  // a separate event is what keeps the two comparable.
  for (const row of intents) {
    bump(days, row.created_at, 'checkoutsStarted');
    if (row.status === 'confirmed') bump(days, row.created_at, 'paid');
  }

  const demoRequests = demos.length;
  const checkoutsStarted = intents.length;
  const paid = intents.filter((i) => i.status === 'confirmed').length;

  // Product interest, by what people actually tried to buy.
  const byProduct = new Map<string, { intents: number; paid: number }>();
  for (const row of intents) {
    const label = [row.track, row.level].filter(Boolean).join(' · ') || 'unknown';
    const entry = byProduct.get(label) ?? { intents: 0, paid: 0 };
    entry.intents += 1;
    if (row.status === 'confirmed') entry.paid += 1;
    byProduct.set(label, entry);
  }
  const topProducts: TopProduct[] = [...byProduct.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.intents - a.intents)
    .slice(0, 6);

  const widest = Math.max(demoRequests, checkoutsStarted, paid, 1);
  const pct = (n: number, of: number) => (of > 0 ? n / of : null);

  const funnel: FunnelStep[] = [
    {
      label: 'Asked for a free class',
      value: demoRequests,
      share: demoRequests / widest,
      fromPrevious: null,
      hint: 'Someone requested a demo class',
    },
    {
      label: 'Reached checkout',
      value: checkoutsStarted,
      share: checkoutsStarted / widest,
      // Deliberately NOT a percentage of the step above: a free class and a
      // purchase are two different doors, not two stages of one path. Somebody
      // can buy without ever booking a demo, so a "conversion" between them
      // would be a number that means nothing.
      fromPrevious: null,
      hint: 'An order was created — they saw the payment screen',
    },
    {
      label: 'Paid',
      value: paid,
      share: paid / widest,
      fromPrevious: pct(paid, checkoutsStarted),
      hint: 'Payment confirmed',
    },
  ];

  return {
    windowDays,
    daily: [...days.values()],
    funnel,
    topProducts,
    totals: {
      demoRequests,
      checkoutsStarted,
      paid,
      checkoutConversion: pct(paid, checkoutsStarted),
      activeEnrolments: enrolRes.count ?? 0,
    },
    empty: demoRequests === 0 && checkoutsStarted === 0,
  };
}
