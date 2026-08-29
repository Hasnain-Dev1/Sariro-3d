'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — System health
 * =========================================================
 * What a super-admin is actually for.
 *
 * The dashboard could create almost anything and see almost nothing. Its stat
 * cards reported totals — users, enrolments, revenue — which say how big the
 * system is, never whether it is working. A batch with no teacher, a class
 * nobody marked, a learner about to be locked out over credits: none of those
 * appeared anywhere until somebody complained.
 *
 * Every check here answers the same question: **what is quietly broken right
 * now?** Anything that is merely a number belongs on a stat card, not here.
 *
 * ── Severity ───────────────────────────────────────────────────────────────
 *   critical  someone is blocked, or money/pay is wrong
 *   warning   it will become critical if ignored
 *
 * Nothing is listed at zero. An oversight screen that always shows ten rows,
 * eight of them saying "0", teaches the reader to skim past the two that matter.
 */

export type HealthSeverity = 'critical' | 'warning';

export interface HealthCheck {
  key: string;
  severity: HealthSeverity;
  label: string;
  detail: string;
  count: number;
}

/** Classes older than this that are still 'scheduled' were never dealt with. */
const STALE_CLASS_HOURS = 3;

export async function fetchSystemHealth(): Promise<HealthCheck[]> {
  const supabase = createClient();
  const checks: HealthCheck[] = [];

  try {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_CLASS_HOURS * 3600_000).toISOString();

    const [unassigned, stale, pendingIntents, activeEnrolments] = await Promise.all([
      supabase
        .from('cohorts')
        .select('id', { count: 'exact', head: true })
        .is('teacher_id', null)
        .neq('status', 'completed'),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .lt('slot_start', staleBefore),
      supabase
        .from('purchase_intents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      // Needed to find learners who are enrolled but out of credits — the ones
      // who will hit a wall at their next class without warning anybody.
      supabase.from('enrollments').select('user_id').eq('status', 'active'),
    ]);

    if ((unassigned.count ?? 0) > 0) {
      checks.push({
        key: 'unassigned_batches',
        severity: 'critical',
        label: `${unassigned.count} ${unassigned.count === 1 ? 'batch has' : 'batches have'} no teacher`,
        detail: 'These cannot run. Nothing else in the product will surface them until a class is due to start.',
        count: unassigned.count ?? 0,
      });
    }

    if ((stale.count ?? 0) > 0) {
      checks.push({
        key: 'unmarked_classes',
        severity: 'critical',
        label: `${stale.count} past ${stale.count === 1 ? 'class was' : 'classes were'} never marked`,
        detail: 'Credits are not consumed and teachers are not paid until a class is completed.',
        count: stale.count ?? 0,
      });
    }

    // Learners enrolled and active but with an empty balance.
    const learnerIds = [...new Set((activeEnrolments.data ?? []).map((e) => e.user_id as string))];
    if (learnerIds.length > 0) {
      const { data: balances } = await supabase
        .from('credits')
        .select('user_id, balance')
        .in('user_id', learnerIds);

      const withBalance = new Map(
        (balances ?? []).map((c) => [c.user_id as string, Number(c.balance ?? 0)])
      );
      // A learner with no credits row at all counts as zero — that is exactly
      // the case that slips through a query filtering on `balance = 0`.
      const empty = learnerIds.filter((id) => (withBalance.get(id) ?? 0) <= 0).length;

      if (empty > 0) {
        checks.push({
          key: 'out_of_credits',
          severity: 'warning',
          label: `${empty} active ${empty === 1 ? 'learner has' : 'learners have'} no credits left`,
          detail: 'They will be blocked at their next class. Better to top up before they find out.',
          count: empty,
        });
      }
    }

    if ((pendingIntents.count ?? 0) > 0) {
      checks.push({
        key: 'pending_approvals',
        severity: 'warning',
        label: `${pendingIntents.count} ${pendingIntents.count === 1 ? 'enrolment is' : 'enrolments are'} waiting for approval`,
        detail: 'Someone has paid or asked to join and is waiting on a person.',
        count: pendingIntents.count ?? 0,
      });
    }
  } catch (err) {
    console.warn('[system-health] check failed:', err instanceof Error ? err.message : String(err));
  }

  // Critical first — an oversight screen should be readable top to bottom in
  // priority order without anyone having to compare severities themselves.
  return checks.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
}
