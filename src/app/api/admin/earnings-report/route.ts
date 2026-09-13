import { NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';

/**
 * SARIRO — GET /api/admin/earnings-report  (admin / super_admin / hr)
 *
 * Every teacher earning, one row each, with the date of the class it was for.
 *
 * ── What moved out of here ──────────────────────────────────────────────────
 * This route used to total the SALES too, from sale_value and amount_paid on
 * enrolled leads. Nothing has written those fields since sales moved to the
 * invoice-backed ledger, so every total it returned was ₹0 and the list of
 * enrolled sales was empty. The report now reads the ledger itself, through the
 * same fetchSales() the Sales panel uses — one source for the same numbers —
 * and adds it up with lib/finance/sales-report.ts.
 *
 * ── Why rows, not totals ────────────────────────────────────────────────────
 * The report filters by date (today, last 7 days … lifetime). Totals computed
 * here cannot be re-cut by a range chosen on the screen; dated rows can, and
 * switching range is then instant rather than a round trip per click.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One run should never return an unbounded number of rows. */
const MAX_ROWS = 10_000;

const num = (v: unknown) => Number(v ?? 0);

export async function GET() {
  let userId: string | null = null;
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* 401 */ }
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const admin = createServiceClient();
  const { data: p } = await admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', userId).single();
  const ok = p?.role === 'admin' || p?.role === 'super_admin' || p?.role === 'hr' || p?.is_admin === true || p?.is_super_admin === true;
  if (!ok) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const { data, error } = await admin
    .from('teacher_earnings')
    .select('teacher_id, net_amount, amount, status, class_date, teacher:profiles!teacher_id(full_name)')
    .order('class_date', { ascending: false })
    .limit(MAX_ROWS);

  if (error) {
    return NextResponse.json({ ok: false, error: 'query_failed', message: error.message }, { status: 500 });
  }

  const earnings = ((data ?? []) as Array<Record<string, unknown>>).map((e) => ({
    teacher_id: String(e.teacher_id),
    name: (e.teacher as { full_name?: string } | null)?.full_name ?? 'Unknown',
    net: num(e.net_amount ?? e.amount),
    status: String(e.status ?? ''),
    class_date: (e.class_date as string | null) ?? null,
  }));

  return NextResponse.json({ ok: true, earnings });
}
