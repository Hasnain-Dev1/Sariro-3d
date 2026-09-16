'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchAdminActionQueue } from '@/lib/dashboard/admin-data';
import { fetchCreditRequests } from '@/lib/dashboard/credit-requests';
import { fetchPolicyFlags } from '@/lib/dashboard/messaging';
import { fetchReconciliation } from '@/lib/dashboard/invoice-reconciliation';
import { fetchExpenses } from '@/lib/dashboard/expenses';
import { fetchTeacherBookings } from '@/lib/dashboard/teacher-data';
import { fetchPendingSubmissionsForTeacher } from '@/lib/dashboard/submissions-data';
import { fetchHeldTrialPay } from '@/lib/dashboard/held-trial-pay';
import { fetchAttempts } from '@/lib/speaking/practice-log';
import { canPractise } from '@/lib/speaking/access';
import {
  catchupsToArrange, classesToday, planState, registersToMark, speakingWaiting, trialsAhead,
} from '@/lib/ops/queue-counts';
import {
  sourcesFor, summariseAttention, type AttentionKey, type AttentionSummary, type QueueRole,
} from '@/lib/ops/attention';

/**
 * SARIRO — counting what is waiting, once per page
 * ============================================================================
 * Each count is read from the SAME fetcher or route the panel on the page uses
 * — never a second query written to look similar. A queue that says "3" above
 * a panel that lists four is worse than no queue: it teaches people to scroll
 * and check anyway.
 *
 * Counts arrive one by one as each source answers, so the fast ones show at
 * once. A source that fails is reported as failed, not as nothing waiting.
 * Refreshed when the tab comes back into focus and every three minutes, and
 * whenever a panel calls refresh() after changing something.
 */

interface AttentionState extends AttentionSummary {
  role: QueueRole;
  refresh: () => void;
  lastUpdated: number | null;
}

const Ctx = createContext<AttentionState | null>(null);

async function apiJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
  return json;
}

async function apiList(url: string, field: string, init?: RequestInit): Promise<number> {
  const json = await apiJson(url, init);
  if (!Array.isArray(json[field])) throw new Error(`${url}: no ${field}`);
  return (json[field] as unknown[]).length;
}

async function headCount(table: string, column: string, value: string): Promise<number> {
  const { count, error } = await createClient().from(table).select('id', { count: 'exact', head: true }).eq(column, value);
  if (error) throw error;
  return count ?? 0;
}

async function signedInId(): Promise<string> {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error('signed out');
  return user.id;
}

/* Several sources read one answer — the admin action queue, a teacher's week of
   bookings, the seller's dashboard, a learner's plan. Each is asked once per
   refresh and shared. */
type Once = <T>(name: string, load: () => Promise<T>) => Promise<T>;
type Fetcher = (once: Once) => Promise<number>;

const adminQueue = (once: Once) =>
  once('admin-queue', () => fetchAdminActionQueue().then((items) => Object.fromEntries(items.map((i) => [i.key, i.count])) as Record<string, number>));

const teacherBookings = (once: Once) => once('teacher-bookings', () => fetchTeacherBookings('all'));

const sellerCounts = (once: Once) =>
  once('seller', async () => ((await apiJson('/api/seller/dashboard')).counts ?? {}) as Record<string, number>);

interface Learner {
  id: string;
  grade: number | null;
  status: string | null;
  balance: number;
  enrolments: { track: string; status: string; cohort_id: string | null; level: string | null; created_at: string | null }[];
}

const learner = (once: Once) =>
  once<Learner>('learner', async () => {
    const id = await signedInId();
    const sb = createClient();
    const [enr, cr, me] = await Promise.all([
      sb.from('enrollments').select('track, status, cohort_id, level, created_at').eq('user_id', id),
      sb.from('credits').select('balance').eq('user_id', id).maybeSingle(),
      sb.from('profiles').select('grade, student_status').eq('id', id).maybeSingle(),
    ]);
    if (enr.error) throw enr.error;
    return {
      id,
      grade: (me.data?.grade as number | null | undefined) ?? null,
      status: (me.data?.student_status as string | null | undefined) ?? null,
      balance: Number(cr.data?.balance ?? 0),
      enrolments: (enr.data ?? []) as Learner['enrolments'],
    };
  });

const activeCourses = (l: Learner) => l.enrolments.filter((e) => e.status === 'active').length;

const FETCHERS: Record<AttentionKey, Fetcher> = {
  /* staff */
  unresolved_classes: () => apiList('/api/admin/unresolved-classes', 'classes'),
  catchup_overdue: () => apiList('/api/admin/catchup-overdue', 'cases'),
  trial_grades: () => apiList('/api/admin/trial-grades', 'seats'),
  /* The route scopes by role: everyone for staff, their own batches for a teacher. */
  low_credits: () =>
    apiList('/api/credits/at-risk', 'students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    }),
  approvals: async (once) => (await adminQueue(once)).approvals ?? 0,
  unassigned_batches: async (once) => (await adminQueue(once)).unassigned_batches ?? 0,
  credit_requests: async () => (await fetchCreditRequests('pending')).requests.length,
  policy_flags: async () => (await fetchPolicyFlags()).filter((f) => !f.reviewed_at).length,
  unrecorded_invoices: async () => (await fetchReconciliation()).overdue,
  expenses_pending: async () => (await fetchExpenses()).pendingCount,
  leave_requests: () => headCount('teacher_leaves', 'status', 'pending'),
  incentive_requests: () => headCount('teacher_incentives', 'status', 'requested'),
  unsettled_payouts: () => headCount('teacher_earnings', 'status', 'pending'),

  /* teacher — the calendar's bookings, the write-up panel's loader, the
     catch-up panel's route, the review list's fetcher, the room banner's route */
  registers_to_mark: async (once) => registersToMark(await teacherBookings(once)).length,
  trials_soon: async (once) => trialsAhead(await teacherBookings(once), Date.now(), 24).length,
  trial_writeups: async () => (await fetchHeldTrialPay(await signedInId())).length,
  rooms_missing: async () => Number((await apiJson('/api/teacher/room')).doorless ?? 0),
  catchups_to_arrange: async () =>
    catchupsToArrange(((await apiJson('/api/teacher/catchup')).students ?? []) as { summary: { unscheduled: number } }[]),
  projects_to_review: async () => (await fetchPendingSubmissionsForTeacher()).length,

  /* seller — the six queues come back bucketed and counted in one call */
  followups_overdue: async (once) => (await sellerCounts(once)).overdue_followup ?? 0,
  trials_missed: async (once) => (await sellerCounts(once)).missed_trial ?? 0,
  slots_needed: async (once) => (await sellerCounts(once)).slot_assistance ?? 0,
  final_calls: async (once) => (await sellerCounts(once)).final_conversation ?? 0,
  followups_today: async (once) => (await sellerCounts(once)).today_followup ?? 0,

  /* student */
  classes_paused: async (once) => {
    const l = await learner(once);
    return planState({ balance: l.balance, studentStatus: l.status, activeCourses: activeCourses(l) }).paused;
  },
  plan_low: async (once) => {
    const l = await learner(once);
    return planState({ balance: l.balance, studentStatus: l.status, activeCourses: activeCourses(l) }).low;
  },
  class_today: async (once) => {
    const l = await learner(once);
    const cohortIds = [...new Set(l.enrolments.filter((e) => e.status === 'active' && e.cohort_id).map((e) => e.cohort_id as string))];
    if (cohortIds.length === 0) return 0;
    const now = new Date();
    const { data, error } = await createClient()
      .from('bookings')
      .select('slot_start, slot_end, status')
      .in('cohort_id', cohortIds)
      .eq('status', 'scheduled')
      .gte('slot_end', now.toISOString())
      .order('slot_start', { ascending: true })
      .limit(10);
    if (error) throw error;
    return classesToday((data ?? []) as { slot_start: string; slot_end: string; status: string }[], now);
  },
  /* Public Speaking learners only — the same gate as the practice room. The
     course content loads only when it is needed, so no other dashboard carries
     forty-six lessons it never reads. */
  speaking_missions: async (once) => {
    const l = await learner(once);
    if (!canPractise(l.enrolments)) return 0;
    const [{ allSpeakingLessons }, { questState }, { activeSpeakingBand }, attempts] = await Promise.all([
      import('@/lib/speaking/modules'),
      import('@/lib/speaking/quest/engine'),
      import('@/lib/speaking/access'),
      fetchAttempts(l.id, { limit: 3000, sounds: true }),
    ]);
    // The band of their current Public Speaking course, not only their grade.
    const state = questState(attempts, allSpeakingLessons(), {
      now: Date.now(), offsetMinutes: new Date().getTimezoneOffset(), stage: activeSpeakingBand(l.enrolments, l.grade) ?? 'middle',
    });
    return speakingWaiting(state);
  },
};

const REFRESH_MS = 3 * 60_000;

export function AttentionProvider({ role, children }: { role: QueueRole; children: ReactNode }) {
  const [counts, setCounts] = useState<Partial<Record<AttentionKey, number | null>>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const generation = useRef(0);
  const lastRun = useRef(0);

  const run = useCallback(() => {
    const gen = ++generation.current;
    lastRun.current = Date.now();
    const cache = new Map<string, Promise<unknown>>();
    const once: Once = (name, load) => {
      if (!cache.has(name)) cache.set(name, load());
      return cache.get(name) as ReturnType<typeof load>;
    };

    const keys = sourcesFor(role);
    let remaining = keys.length;
    for (const key of keys) {
      FETCHERS[key](once)
        .then((n) => ({ key, n: n as number | null }))
        .catch((err) => {
          console.warn(`[attention] ${key} could not be counted:`, err instanceof Error ? err.message : err);
          return { key, n: null };
        })
        .then(({ key: k, n }) => {
          if (gen !== generation.current) return;
          setCounts((prev) => ({ ...prev, [k]: n }));
          remaining -= 1;
          if (remaining === 0) setLastUpdated(Date.now());
        });
    }
  }, [role]);

  useEffect(() => {
    run();
    const interval = window.setInterval(run, REFRESH_MS);
    const onFocus = () => { if (Date.now() - lastRun.current > 30_000) run(); };
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      generation.current += 1;
    };
  }, [run]);

  const value = useMemo<AttentionState>(
    () => ({ ...summariseAttention(role, counts), role, refresh: run, lastUpdated }),
    [role, counts, run, lastUpdated]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** null outside a dashboard with a queue — callers render nothing then. */
export function useAttention(): AttentionState | null {
  return useContext(Ctx);
}
