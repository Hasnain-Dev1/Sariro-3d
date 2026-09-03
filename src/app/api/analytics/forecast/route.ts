import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { buildForecast, type ScheduledClass } from '@/lib/dashboard/forecast';
import { accruingWindow, currentSettlementWindow } from '@/lib/dashboard/settlement-period';

/**
 * SARIRO — POST /api/analytics/forecast
 * =========================================================
 * V2 §68-69. Next month's committed costs, and what is merely expected.
 *
 * Gathers facts; the arithmetic and the committed/projected split live in
 * lib/dashboard/forecast.ts, which is pure and tested.
 *
 * Super-admin and HR only — this is the company's financial position.
 */

export const runtime = 'nodejs';

/** §57-ish operational assumption, stated here rather than buried in a sum. */
const TYPICAL_RENEWAL_CREDITS = 12;

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `forecast:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  const { data: profile } = await admin
    .from('profiles').select('role, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role ?? (profile?.is_super_admin ? 'super_admin' : 'student');
  if (!['hr', 'super_admin'].includes(role as string)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  try {
    // The month being forecast is the one now running.
    const window = accruingWindow();

    const [
      { data: bookingsRaw }, { data: creditsRaw }, { data: expensesRaw },
      { data: ratesRaw }, { data: settingsRaw }, { data: cohortsRaw },
      { data: profilesRaw },
    ] = await Promise.all([
      admin.from('bookings')
        .select('id, cohort_id, teacher_id, slot_start, status')
        .gte('slot_start', window.periodStart)
        .lt('slot_start', window.periodEnd)
        .not('status', 'eq', 'cancelled'),
      admin.from('credits').select('user_id, balance'),
      admin.from('expenses').select('amount, spent_on, status').eq('status', 'approved'),
      admin.rpc('teacher_pay_rates'),
      admin.from('app_settings').select('key, value'),
      admin.from('cohorts').select('id, ratio'),
      admin.from('profiles').select('id, teacher_tier'),
    ]);

    type Row = Record<string, unknown>;
    const bookings = (bookingsRaw ?? []) as Row[];
    const cohortRatio = new Map(((cohortsRaw ?? []) as Row[]).map((c) => [c.id as string, (c.ratio as string) ?? '1:1']));
    const tierById = new Map(((profilesRaw ?? []) as Row[]).map((p) => [p.id as string, Number(p.teacher_tier ?? 3)]));
    const rates = (ratesRaw ?? []) as { tier: number; rate_1on1: number; rate_group: number; group_bonus: number }[];
    const rateFor = (tier: number) => rates.find((r) => r.tier === tier) ?? rates.find((r) => r.tier === 3) ?? null;

    const scheduled: ScheduledClass[] = bookings.map((b) => {
      const ratio = cohortRatio.get(b.cohort_id as string) ?? '1:1';
      const tier = b.teacher_id ? (tierById.get(b.teacher_id as string) ?? 3) : 3;
      const r = rateFor(tier);
      const isGroup = ratio !== '1:1';
      return {
        ratio,
        rate: r ? (isGroup ? Number(r.rate_group) : Number(r.rate_1on1)) : 0,
        // The group bonus only applies at four students; not knowing the roster
        // per class here, it is deliberately left out rather than assumed on.
        bonus: 0,
      };
    });

    const outstandingCredits = ((creditsRaw ?? []) as Row[])
      .reduce((s, c) => s + Math.max(0, Number(c.balance ?? 0)), 0);

    // Whole months of approved expenses, most recent first, excluding the month
    // still running — a half-finished month drags the average down.
    const byMonth = new Map<string, number>();
    for (const e of (expensesRaw ?? []) as Row[]) {
      const key = String(e.spent_on ?? '').slice(0, 7);
      if (!key) continue;
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(e.amount ?? 0));
    }
    byMonth.delete(window.month);
    const recentMonthlyExpenses = [...byMonth.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 3)
      .map(([, total]) => total);

    const settings = new Map(((settingsRaw ?? []) as Row[]).map((s) => [s.key as string, s.value as string]));
    const num = (key: string): number | null => {
      const raw = settings.get(key);
      const n = raw ? Number(raw) : NaN;
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    const learnersNeedingRenewal = ((creditsRaw ?? []) as Row[])
      .filter((c) => Number(c.balance ?? 0) < 4).length;

    const forecast = buildForecast({
      scheduled,
      outstandingCredits,
      pricePerCreditUsd: num('price_per_credit_usd'),
      recentMonthlyExpenses,
      learnersNeedingRenewal,
      typicalRenewalCredits: TYPICAL_RENEWAL_CREDITS,
      usdToInr: num('usd_to_inr'),
    });

    return NextResponse.json({
      ok: true,
      month: window.month,
      monthLabel: window.label,
      /** The month whose settlement is currently open, for context. */
      settlingLabel: currentSettlementWindow().label,
      classesScheduled: scheduled.length,
      forecast,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: 'server_error', message }, { status: 500 });
  }
}
