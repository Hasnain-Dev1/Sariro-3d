'use client';

/**
 * SARIRO — Realtime Sync hook
 *
 * Subscribes to Supabase Realtime Postgres Changes on the relevant tables
 * and triggers a refresh callback whenever any row is INSERTed / UPDATEd /
 * DELETEd. Used by all 4 dashboards so they auto-update without manual
 * page reloads.
 *
 * Tables already added to `supabase_realtime` publication:
 *   enrollments, bookings, cohorts, notifications, purchase_intents,
 *   session_attendance.
 *
 * The hook is SAFE to call when Supabase is unconfigured — it no-ops
 * silently. This lets the dev server run before creds are filled in.
 *
 * Throttle: a single admin action can fire several postgres_changes events
 * in quick succession (e.g. INSERT enrollment + INSERT notification). We
 * coalesce them into a single `onRefresh` call within `throttleMs`.
 *
 * RLS handles row-level scoping — students only receive events for rows
 * they can SELECT, so no client-side user_id filter is needed.
 */

import { useEffect, useRef } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export type RealtimeTable =
  | 'enrollments'
  | 'bookings'
  | 'cohorts'
  | 'notifications'
  | 'purchase_intents'
  | 'session_attendance'
  | 'lesson_progress'
  | 'session_notes'
  | 'project_submissions'
  | 'submission_feedback'
  | 'demo_class_requests'
  | 'credits'
  | 'credit_transactions'
  | 'student_leads'
  | 'lead_history';

interface UseRealtimeOptions {
  /** Tables to watch for Postgres Changes. */
  tables: RealtimeTable[];
  /** Refresh callback (typically `loadAll` from the dashboard). */
  onRefresh: () => void;
  /** Throttle window in ms — default 800ms. */
  throttleMs?: number;
  /** When false, the hook no-ops. Use to gate until auth is ready. */
  enabled?: boolean;
}

/**
 * Subscribe to Postgres Changes on the given tables. When any matching
 * event fires, `onRefresh` is invoked (throttled).
 */
export function useRealtime({
  tables,
  onRefresh,
  throttleMs = 800,
  enabled = true,
}: UseRealtimeOptions): void {
  // Keep latest `onRefresh` in a ref so the subscription doesn't need to
  // be torn down and re-created on every parent re-render. The assignment
  // happens in a layout effect (not during render) to satisfy the
  // react-hooks/refs rule.
  const refreshRef = useRef(onRefresh);
  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  // Pending throttle timer.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable string for the dependency array — the subscription should be
  // torn down + re-created only when the SET of tables changes, not when
  // the parent re-renders with the same tables array.
  const tablesKey = tables.slice().sort().join('|');

  useEffect(() => {
    if (!enabled) return;
    if (!isSupabaseConfigured) return;
    if (tables.length === 0) return;

    const supabase = createClient();

    // Unique channel name per table set — multiple dashboards with the
    // same table set will share a channel (which is fine; Supabase dedupes
    // by name within a single client).
    const channelName = `sariro-realtime-${tablesKey}`;

    const triggerRefresh = () => {
      if (timerRef.current) return; // already pending
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        try {
          refreshRef.current();
        } catch (err) {
          console.warn('[useRealtime] refresh callback threw:', err);
        }
      }, throttleMs);
    };

    // Start with an unconfigured channel, then attach one postgres_changes
    // listener per table.
    let channel = supabase.channel(channelName);
    for (const t of tables) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: t },
        () => triggerRefresh()
      );
    }

    channel.subscribe((status: string) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[useRealtime] channel ${channelName} status: ${status}`);
      }
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore — channel may already be removed during HMR
      }
    };
  }, [enabled, tablesKey, throttleMs]);
}
