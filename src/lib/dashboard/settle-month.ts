import type { SettlementWindow } from '@/lib/dashboard/settlement-period';
import type { createServiceClient } from '@/lib/supabase/server';

/**
 * SARIRO — settling one month for one teacher
 * =========================================================
 * SERVER ONLY. Takes an already-created service-role client.
 *
 * V2 §40-45. This is a thin call onto settle_teacher_month() in
 * scripts/auto-settle-in-db.sql. The work is deliberately not done here.
 *
 * ── Why the logic moved into the database ───────────────────────────────────
 * Automatic settlement is scheduled by pg_cron, which runs inside Postgres and
 * cannot call TypeScript. So the choice was two implementations — one for the
 * schedule, one for the app — or one that both call. §78 requires the same
 * final figure in the teacher, HR and super-admin views, and two implementations
 * of "bundle the month" is exactly how that promise quietly stops holding.
 *
 * It also makes the whole operation one transaction: the settlement row and the
 * earnings it owns are written together or not at all. The previous version
 * inserted, then updated, then deleted the settlement by hand if the update
 * failed — a rollback that only works while the process is alive.
 *
 * The three callers are the teacher pressing Settle, this app noticing the 5th
 * has passed, and the hourly schedule. All three land on the same function.
 */

type Admin = ReturnType<typeof createServiceClient>;

export interface SettleResult {
  ok: boolean;
  outcome: 'settled' | 'nothing_to_settle' | 'already_settled' | 'failed';
  settlementId?: string;
  total?: number;
  classes?: number;
  message?: string;
}

export async function settleMonthForTeacher(
  admin: Admin,
  teacherId: string,
  window: SettlementWindow,
  opts: { type: 'manual' | 'auto'; reason?: string }
): Promise<SettleResult> {
  const { data, error } = await admin.rpc('settle_teacher_month', {
    p_teacher_id: teacherId,
    p_month: window.month,
    p_type: opts.type,
    p_reason: opts.reason ?? null,
  });

  if (error) {
    const missing = /does not exist|could not find|schema cache/i.test(error.message ?? '');
    return {
      ok: false,
      outcome: 'failed',
      message: missing
        ? 'Settlement is not set up yet — run scripts/auto-settle-in-db.sql in Supabase.'
        : error.message,
    };
  }

  // Null means either "already settled" or "nothing to settle". The function
  // returns no id for both because neither is an error and neither writes; one
  // read tells them apart, and only when somebody actually asks.
  if (!data) {
    const { data: existing } = await admin
      .from('teacher_settlements')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('period_month', window.month)
      .maybeSingle();

    return existing
      ? { ok: true, outcome: 'already_settled', settlementId: existing.id as string }
      : { ok: true, outcome: 'nothing_to_settle' };
  }

  const settlementId = data as string;

  const { data: row } = await admin
    .from('teacher_settlements')
    .select('total_amount, total_classes')
    .eq('id', settlementId)
    .maybeSingle();

  return {
    ok: true,
    outcome: 'settled',
    settlementId,
    total: Number(row?.total_amount ?? 0),
    classes: Number(row?.total_classes ?? 0),
  };
}
