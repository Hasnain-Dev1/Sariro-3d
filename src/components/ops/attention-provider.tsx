'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchAdminActionQueue } from '@/lib/dashboard/admin-data';
import { fetchCreditRequests } from '@/lib/dashboard/credit-requests';
import { fetchPolicyFlags } from '@/lib/dashboard/messaging';
import { fetchReconciliation } from '@/lib/dashboard/invoice-reconciliation';
import { fetchExpenses } from '@/lib/dashboard/expenses';
import {
  sourcesFor, summariseAttention, type AttentionKey, type AttentionSummary, type StaffRole,
} from '@/lib/ops/attention';

/**
 * SARIRO — counting what is waiting, once per page
 * ============================================================================
 * Each count is read from the SAME fetcher or route the panel on the page uses
 * — never a second query written to look similar. A queue that says "3" above
 * a panel that lists four is worse than no queue: it teaches staff to scroll
 * and check anyway.
 *
 * Counts arrive one by one as each source answers, so the fast ones show at
 * once. A source that fails is reported as failed, not as nothing waiting.
 * Refreshed when the tab comes back into focus and every three minutes.
 */

interface AttentionState extends AttentionSummary {
  role: StaffRole;
  refresh: () => void;
  lastUpdated: number | null;
}

const Ctx = createContext<AttentionState | null>(null);

async function apiList(url: string, field: string, init?: RequestInit): Promise<number> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok || !Array.isArray(json[field])) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json[field].length;
}

async function headCount(table: string, column: string, value: string): Promise<number> {
  const { count, error } = await createClient().from(table).select('id', { count: 'exact', head: true }).eq(column, value);
  if (error) throw error;
  return count ?? 0;
}

/* The admin action queue answers three sources in one call, so it is shared. */
function adminQueueCounts(): Promise<Record<string, number>> {
  return fetchAdminActionQueue().then((items) => Object.fromEntries(items.map((i) => [i.key, i.count])));
}

type Fetcher = (shared: { adminQueue: () => Promise<Record<string, number>> }) => Promise<number>;

const FETCHERS: Record<AttentionKey, Fetcher> = {
  unresolved_classes: () => apiList('/api/admin/unresolved-classes', 'classes'),
  catchup_overdue: () => apiList('/api/admin/catchup-overdue', 'cases'),
  trial_grades: () => apiList('/api/admin/trial-grades', 'seats'),
  low_credits: () =>
    apiList('/api/credits/at-risk', 'students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    }),
  approvals: async ({ adminQueue }) => (await adminQueue()).approvals ?? 0,
  unassigned_batches: async ({ adminQueue }) => (await adminQueue()).unassigned_batches ?? 0,
  credit_requests: async () => (await fetchCreditRequests('pending')).requests.length,
  policy_flags: async () => (await fetchPolicyFlags()).filter((f) => !f.reviewed_at).length,
  unrecorded_invoices: async () => (await fetchReconciliation()).overdue,
  expenses_pending: async () => (await fetchExpenses()).pendingCount,
  leave_requests: () => headCount('teacher_leaves', 'status', 'pending'),
  incentive_requests: () => headCount('teacher_incentives', 'status', 'requested'),
  unsettled_payouts: () => headCount('teacher_earnings', 'status', 'pending'),
};

const REFRESH_MS = 3 * 60_000;

export function AttentionProvider({ role, children }: { role: StaffRole; children: ReactNode }) {
  const [counts, setCounts] = useState<Partial<Record<AttentionKey, number | null>>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const generation = useRef(0);
  const lastRun = useRef(0);

  const run = useCallback(() => {
    const gen = ++generation.current;
    lastRun.current = Date.now();
    let adminQueue: Promise<Record<string, number>> | null = null;
    const shared = { adminQueue: () => (adminQueue ??= adminQueueCounts()) };

    const keys = sourcesFor(role);
    let remaining = keys.length;
    for (const key of keys) {
      FETCHERS[key](shared)
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

/** null outside a staff dashboard — callers render nothing then. */
export function useAttention(): AttentionState | null {
  return useContext(Ctx);
}
