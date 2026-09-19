import type { createServiceClient } from '@/lib/supabase/server';
import { pauseIfExhausted } from '@/lib/credits/apply';

/**
 * SARIRO — one class taught, one credit used
 * ============================================================================
 * Lifted out of /api/teacher/complete-class (19 Sep 2026) so that EVERY way a
 * class becomes 'completed' charges for it the same way. The stale-class
 * closer (/api/cron/close-stale-classes) completed classes a teacher had
 * started but never closed — and charged nobody for them, because this lived
 * only in the button's route.
 */

type Admin = ReturnType<typeof createServiceClient>;

/**
 * Deduct one class credit from each active student in the cohort, exactly once
 * per (booking, student). Guarded by a matching 'class_consumed' transaction so
 * it's safe to call again on a retry or re-completion.
 */
export async function deductClassCredits(
  admin: Admin,
  bookingId: string,
  cohortId: string
) {
  const { data: enrs } = await admin.from('enrollments')
    .select('user_id').eq('cohort_id', cohortId).eq('status', 'active');
  const studentIds = [...new Set((enrs ?? []).map((e: { user_id: string }) => e.user_id))];
  if (studentIds.length === 0) return;

  // Which students were already charged for THIS booking?
  const { data: charged } = await admin.from('credit_transactions')
    .select('user_id').eq('related_booking_id', bookingId).eq('type', 'class_consumed');
  const already = new Set((charged ?? []).map((c: { user_id: string }) => c.user_id));

  for (const sid of studentIds) {
    if (already.has(sid)) continue;
    const { data: cr } = await admin.from('credits').select('balance').eq('user_id', sid).maybeSingle();
    const balance = cr?.balance ?? 0;
    const newBalance = Math.max(0, balance - 1);
    // Record the consumption first (the idempotency guard), then apply it.
    const { error: txErr } = await admin.from('credit_transactions').insert({
      user_id: sid, amount: -1, type: 'class_consumed',
      description: 'Class attended', related_booking_id: bookingId,
    });
    if (txErr) continue; // a concurrent completion already charged this student
    await admin.from('credits').upsert({ user_id: sid, balance: newBalance }, { onConflict: 'user_id' });

    /* ── The class that used their last credit ─────────────────────────────
       Spending the last one pauses them, here, with no admin action and no
       button — the moment it happens rather than the next time somebody
       notices. Nothing about their teacher, group, schedule or place in the
       course is touched: holding all of that is what makes starting again
       automatic when they pay.

       Never fatal. A class was just taught and the teacher is owed for it;
       failing to pause must not undo marking it complete. */
    if (newBalance <= 0) await pauseIfExhausted(admin, String(sid));
  }
}
