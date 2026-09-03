'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — points and rewards, client side
 * =========================================================
 * V2 §56-57.
 *
 * Reads go through RLS (a learner sees their own rows). Writes go through two
 * database functions, because a balance that any client can set is a balance
 * no child can be told is correct — see scripts/gamification.sql.
 *
 * ── Points are not currency ─────────────────────────────────────────────────
 * They cannot be bought and cannot become class credits. Everything in the
 * catalogue is cosmetic. Anything else would turn a child's attendance into a
 * discount mechanism, which is a different product and a worse one.
 */

export type RewardCategory = 'theme' | 'background' | 'avatar' | 'badge' | 'effect';

export interface Reward {
  key: string;
  name: string;
  description: string | null;
  category: RewardCategory;
  cost: number;
  sort_order: number;
}

export interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  kind: 'earn' | 'spend' | 'adjustment';
  created_at: string;
}

export interface GamificationState {
  balance: number;
  lifetimeEarned: number;
  rewards: Reward[];
  unlocked: Set<string>;
  equipped: Set<string>;
  history: PointTransaction[];
  /** Consecutive classes attended without a miss. Derived, never stored. */
  streak: number;
}

export const CATEGORY_LABEL: Record<RewardCategory, string> = {
  theme: 'Themes',
  background: 'Backgrounds',
  avatar: 'Avatars',
  badge: 'Badges',
  effect: 'Effects',
};

/**
 * The current streak: how many classes in a row they turned up to.
 *
 * Computed from attendance rather than stored. A stored counter is wrong the
 * moment a class is cancelled, rescheduled or marked late, and it goes wrong
 * without anyone noticing.
 */
export function streakFrom(rows: { status: string; slot_start: string }[]): number {
  const ordered = [...rows]
    .filter((r) => Number.isFinite(Date.parse(r.slot_start)))
    .sort((a, b) => Date.parse(b.slot_start) - Date.parse(a.slot_start));

  let streak = 0;
  for (const r of ordered) {
    // Late still counts — they came. Absent ends it.
    if (r.status === 'present' || r.status === 'late') streak += 1;
    else break;
  }
  return streak;
}

export async function fetchGamification(): Promise<GamificationState | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [pointsRes, rewardsRes, mineRes, historyRes, attendanceRes] = await Promise.all([
    supabase.from('student_points').select('balance, lifetime_earned').eq('user_id', user.id).maybeSingle(),
    supabase.from('rewards').select('key, name, description, category, cost, sort_order').eq('active', true).order('sort_order'),
    supabase.from('student_rewards').select('reward_key, equipped').eq('user_id', user.id),
    supabase.from('point_transactions').select('id, amount, reason, kind, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('session_attendance').select('status, booking_id').eq('student_id', user.id),
  ]);

  // The attendance rows carry no date, so pair them with their bookings to put
  // them in order — a streak read out of order is not a streak.
  const bookingIds = (attendanceRes.data ?? []).map((a) => a.booking_id as string).filter(Boolean);
  const { data: bookings } = bookingIds.length
    ? await supabase.from('bookings').select('id, slot_start').in('id', bookingIds)
    : { data: [] as { id: string; slot_start: string }[] };
  const startById = new Map(((bookings ?? []) as { id: string; slot_start: string }[]).map((b) => [b.id, b.slot_start]));

  const attendanceWithDates = (attendanceRes.data ?? [])
    .map((a) => ({ status: a.status as string, slot_start: startById.get(a.booking_id as string) ?? '' }))
    .filter((a) => a.slot_start);

  const mine = (mineRes.data ?? []) as { reward_key: string; equipped: boolean }[];

  return {
    balance: Number(pointsRes.data?.balance ?? 0),
    lifetimeEarned: Number(pointsRes.data?.lifetime_earned ?? 0),
    rewards: (rewardsRes.data ?? []) as Reward[],
    unlocked: new Set(mine.map((m) => m.reward_key)),
    equipped: new Set(mine.filter((m) => m.equipped).map((m) => m.reward_key)),
    history: (historyRes.data ?? []) as PointTransaction[],
    streak: streakFrom(attendanceWithDates),
  };
}

/** Spend points. The database checks the balance and does both halves at once. */
export async function redeemReward(key: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('redeem_reward', { p_reward_key: key });
  if (error) {
    // The function raises readable messages — "not enough points" is exactly
    // what the learner should be told.
    return { success: false, error: humanise(error.message) };
  }
  return { success: true, balance: Number(data ?? 0) };
}

export async function equipReward(key: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('equip_reward', { p_reward_key: key });
  if (error) return { success: false, error: humanise(error.message) };
  return { success: true };
}

function humanise(message: string): string {
  if (/not enough points/i.test(message)) return 'Not enough points yet — keep going.';
  if (/already have/i.test(message)) return 'You already have that one.';
  if (/not available/i.test(message)) return 'That reward is not available.';
  if (/does not exist|schema cache/i.test(message)) {
    return 'Rewards are not set up yet — run scripts/gamification.sql.';
  }
  return 'Something went wrong. Try again in a moment.';
}
