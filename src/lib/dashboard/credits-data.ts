/**
 * SARIRO — Credit System data layer
 * =========================================================
 *
 * 1 credit = 1 class. Granted on enrollment (1 per lesson in the course).
 * Deducted automatically when teacher marks a class as 'completed'
 * (handled by the deduct_credits_on_class_complete DB trigger).
 *
 * This module provides:
 *   - fetchMyCredits() — current user's balance
 *   - fetchMyCreditTransactions() — transaction history (newest first)
 *   - fetchCreditsForStudent(userId) — teacher/admin view
 *   - grantCreditsOnEnrollment(enrollmentId, lessonCount) — called by admin
 *   - adjustCredits(userId, amount, reason) — admin manual adjustment
 *
 * SECURITY:
 *   - All reads use the browser client (RLS-enforced)
 *   - All writes go through API routes (CSRF + honeypot + rate-limit)
 *   - The grant/deduct triggers use SECURITY DEFINER (bypass RLS)
 *   - No service role in client code
 */

import { createClient } from '@/lib/supabase/client';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';

/* ════════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════════ */

export interface CreditRow {
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface CreditTransactionRow {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'class_consumed' | 'refund' | 'admin_adjustment' | 'bonus';
  description: string;
  related_booking_id: string | null;
  related_enrollment_id: string | null;
  created_at: string;
  created_by: string | null;
}

/* ════════════════════════════════════════════════════════════════════════
   Reads
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Fetch the current user's credit balance.
 * Returns null if the user has no credits row yet (never enrolled).
 */
export async function fetchMyCredits(): Promise<CreditRow | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return (data as CreditRow) ?? null;
  } catch (err) {
    console.warn('[credits] fetchMyCredits error:', err);
    return null;
  }
}

/**
 * Fetch the current user's credit transaction history.
 * Newest first. RLS enforces: student can only see own.
 */
export async function fetchMyCreditTransactions(
  limit = 50
): Promise<CreditTransactionRow[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as CreditTransactionRow[];
  } catch (err) {
    console.warn('[credits] fetchMyCreditTransactions error:', err);
    return [];
  }
}

/**
 * Fetch a specific student's credit balance.
 * Used by teachers (for cohort students) + admins.
 */
export async function fetchCreditsForStudent(
  userId: string
): Promise<CreditRow | null> {
  if (!userId) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data as CreditRow) ?? null;
  } catch (err) {
    console.warn('[credits] fetchCreditsForStudent error:', err);
    return null;
  }
}

/**
 * Fetch a specific student's transaction history.
 */
export async function fetchTransactionsForStudent(
  userId: string,
  limit = 50
): Promise<CreditTransactionRow[]> {
  if (!userId) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as CreditTransactionRow[];
  } catch (err) {
    console.warn('[credits] fetchTransactionsForStudent error:', err);
    return [];
  }
}

/* ════════════════════════════════════════════════════════════════════════
   Writes (via API routes — CSRF + honeypot + rate-limit)
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Grant credits when an enrollment is confirmed.
 * Called by the admin confirm-enrollment flow.
 */
export async function grantCreditsOnEnrollment(
  enrollmentId: string,
  track: string,
  level: string
): Promise<{ success: boolean; creditsGranted?: number; error?: string }> {
  try {
    if (!enrollmentId || !track || !level) {
      return { success: false, error: 'Missing required fields' };
    }

    const syllabus = getCourseSyllabus(track, level);
    const lessonCount = syllabus.totalLessons;

    if (lessonCount === 0) {
      return { success: false, error: 'No lessons found in syllabus' };
    }

    const res = await fetch('/api/admin/grant-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
        lesson_count: lessonCount,
      }),
    });
    const json = await res.json();

    if (!res.ok || !json.ok) {
      return { success: false, error: json.error || 'Grant failed' };
    }

    return { success: true, creditsGranted: json.credits_granted };
  } catch (err) {
    console.warn('[credits] grantCreditsOnEnrollment error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Admin manual credit adjustment.
 */
export async function adjustCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    if (!userId || !amount || !reason.trim()) {
      return { success: false, error: 'Missing required fields' };
    }
    if (reason.length > 500) {
      return { success: false, error: 'Reason must be under 500 characters' };
    }

    const res = await fetch('/api/admin/adjust-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        amount,
        reason: reason.trim(),
      }),
    });
    const json = await res.json();

    if (!res.ok || !json.ok) {
      return { success: false, error: json.error || 'Adjustment failed' };
    }

    return { success: true, newBalance: json.new_balance };
  } catch (err) {
    console.warn('[credits] adjustCredits error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/* ════════════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════════════ */

export function formatCreditAmount(amount: number): string {
  if (amount === 0) return '0 credits';
  const abs = Math.abs(amount);
  const label = abs === 1 ? 'credit' : 'credits';
  return `${amount > 0 ? '+' : ''}${amount} ${label}`;
}

export function formatTransactionType(type: CreditTransactionRow['type']): string {
  const labels: Record<CreditTransactionRow['type'], string> = {
    purchase: 'Enrollment',
    class_consumed: 'Class attended',
    refund: 'Refund',
    admin_adjustment: 'Admin adjustment',
    bonus: 'Bonus credits',
  };
  return labels[type] ?? type;
}

export function formatTransactionTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}