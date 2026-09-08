'use client';

/**
 * SARIRO — writing an attempt down, and reading the history back
 * ============================================================================
 * The one rule this file follows: logging must never be able to interrupt
 * practice.
 *
 * A child has just finished speaking and wants their result. If the network is
 * down, or the table has not been created yet, or they are not signed in, the
 * report still appears — the row simply is not written. Every function here
 * swallows its own failures for that reason, which is a thing worth doing
 * deliberately and almost never worth doing anywhere else.
 */

import { createClient } from '@/lib/supabase/client';
import type { PracticeAttempt, PracticeKind } from './progress';

export interface LogInput {
  kind: PracticeKind;
  drillId?: string | null;
  score: number;
  durationMs?: number | null;
  metrics: Record<string, number>;
}

/**
 * Record one attempt. Returns whether it was stored, for callers that want to
 * say "saved to your progress" honestly rather than optimistically.
 */
export async function logAttempt(input: LogInput): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Practice works signed out — the analysis is all local. There is just
    // nobody to attribute the row to.
    if (!user) return false;

    const score = Math.max(0, Math.min(100, Math.round(input.score)));
    const { error } = await supabase.from('practice_attempts').insert({
      user_id: user.id,
      kind: input.kind,
      drill_id: input.drillId ?? null,
      score,
      duration_ms: input.durationMs != null ? Math.max(0, Math.round(input.durationMs)) : null,
      metrics: input.metrics ?? {},
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * One learner's history, newest last so the trend maths reads naturally.
 *
 * `userId` is for a teacher or parent looking at somebody else; omitted, it
 * means the signed-in learner. RLS decides whether that is allowed, not this.
 */
export async function fetchAttempts(
  userId?: string,
  opts: { kind?: PracticeKind; limit?: number } = {}
): Promise<PracticeAttempt[]> {
  try {
    const supabase = createClient();
    let id = userId;
    if (!id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      id = user.id;
    }

    let q = supabase
      .from('practice_attempts')
      .select('id, kind, drill_id, score, metrics, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(opts.limit ?? 300);
    if (opts.kind) q = q.eq('kind', opts.kind);

    const { data, error } = await q;
    if (error) return [];

    return (data ?? []).map((r) => ({
      id: r.id as string,
      kind: r.kind as PracticeKind,
      drillId: (r.drill_id as string | null) ?? null,
      score: r.score as number,
      metrics: (r.metrics as Record<string, number>) ?? {},
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}
