import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { describeSettlement, isAutoSettleDue } from '@/lib/dashboard/settlement-period';
import { settleMonthForTeacher } from '@/lib/dashboard/settle-month';

/**
 * SARIRO — POST /api/cron/auto-settle
 * =========================================================
 * V2 §42: "If teacher does not manually settle, automatically settle on the 5th
 * of the month at 10:00 AM IST."
 *
 * ── This is the backup, not the primary ────────────────────────────────────
 * Settlement is scheduled by pg_cron inside Supabase — see
 * scripts/auto-settle-in-db.sql. That needs no web host, no scheduler on the
 * server, and no secret travelling over the network, so it is the mechanism
 * that actually carries the §42 promise.
 *
 * This endpoint stays for the cases that one cannot cover: a manual "settle
 * everyone now" from a terminal, and any external scheduler somebody wires up
 * later. Both paths call the same database function, so neither can disagree
 * with the other.
 *
 * ── It is safe to call this whenever ────────────────────────────────────────
 * Every day, several times a day, or twice in the same second. It settles only
 * what is due, only once per teacher per month, and the unique index in
 * scripts/settlement-cycle.sql is what makes the last part true rather than
 * merely likely. Running it early does nothing; running it late catches up.
 *
 * That matters because the 5th at 10:00 is a promise about somebody's pay. A
 * scheduler that missed its window must still settle when it comes back, not
 * skip the month — which is also why /api/teacher/earnings runs the same check
 * on read. Two independent paths to the same idempotent operation.
 *
 * ── Authorisation ───────────────────────────────────────────────────────────
 * A shared secret in CRON_SECRET, sent as `Authorization: Bearer …` or
 * `x-cron-secret`. Without the variable set the endpoint refuses everything:
 * an unauthenticated endpoint that moves money is worse than one that is
 * switched off, and an unset secret is far more likely to be an oversight than
 * a decision.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = req.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  return bearer === secret || req.headers.get('x-cron-secret') === secret;
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const cycle = describeSettlement();
  if (!isAutoSettleDue(cycle.settling)) {
    // Not the 5th yet. Reported rather than errored — a daily cron hitting this
    // on the 3rd is working correctly.
    return NextResponse.json({
      ok: true,
      ran: false,
      reason: 'not_due',
      month: cycle.settling.month,
      dueAt: cycle.settling.autoSettlesAt,
    });
  }

  let admin;
  try { admin = createServiceClient(); } catch {
    return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 });
  }

  // Everyone who could be owed for the closed month.
  const { data: teachers, error } = await admin
    .from('teacher_earnings')
    .select('teacher_id')
    .eq('status', 'pending')
    .is('settlement_id', null)
    .gte('class_date', cycle.settling.periodStart)
    .lt('class_date', cycle.settling.periodEnd);

  if (error) {
    return NextResponse.json({ ok: false, error: 'fetch_failed', message: error.message }, { status: 500 });
  }

  const ids = [
    ...new Set(
      ((teachers ?? []) as { teacher_id: string | null }[])
        .map((t) => t.teacher_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ),
  ];

  const results = { settled: 0, alreadySettled: 0, nothing: 0, failed: [] as string[] };
  for (const teacherId of ids) {
    const res = await settleMonthForTeacher(admin, teacherId, cycle.settling, { type: 'auto' });
    if (!res.ok) results.failed.push(teacherId);
    else if (res.outcome === 'settled') results.settled += 1;
    else if (res.outcome === 'already_settled') results.alreadySettled += 1;
    else results.nothing += 1;
  }

  return NextResponse.json({
    ok: true,
    ran: true,
    month: cycle.settling.month,
    teachersConsidered: ids.length,
    ...results,
  });
}
