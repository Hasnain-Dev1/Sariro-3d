'use client';

import { createClient } from '@/lib/supabase/client';
import type { TopicAttempt } from './mastery';
import type { RoomId } from './types';

/**
 * SARIRO — practice rooms: writing an attempt down, reading the history back
 * ============================================================================
 * The speaking room's rule (lib/speaking/practice-log.ts): logging must never
 * interrupt practice. A failed write — offline, signed out, or the table not yet
 * widened by scripts/practice-rooms.sql — returns false, and the room says
 * "not saved" instead of pretending.
 */

export interface PracticeLog {
  room: RoomId;
  topic: string;
  kind: 'problem' | 'quiz' | 'code';
  /** `<topic>#<seed>` of the first item, or the kata id. */
  drillId?: string | null;
  score: number;
  durationMs?: number | null;
  metrics?: Record<string, number>;
}

export async function logPractice(input: PracticeLog): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from('practice_attempts').insert({
      user_id: user.id,
      kind: input.kind,
      subject: input.room,
      topic: input.topic.slice(0, 80),
      drill_id: input.drillId ?? null,
      score: Math.max(0, Math.min(100, Math.round(input.score))),
      duration_ms: input.durationMs != null ? Math.max(0, Math.round(input.durationMs)) : null,
      metrics: input.metrics ?? {},
    });
    return !error;
  } catch {
    return false;
  }
}

/** This learner's attempts in one room, oldest first. Empty when anything fails. */
export async function fetchRoomAttempts(room: RoomId, limit = 500): Promise<TopicAttempt[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('practice_attempts')
      .select('topic, score, created_at')
      .eq('user_id', user.id)
      .eq('subject', room)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data
      .filter((r) => typeof r.topic === 'string')
      .map((r) => ({ topic: r.topic as string, score: r.score as number, createdAt: r.created_at as string }))
      .reverse();
  } catch {
    return [];
  }
}
