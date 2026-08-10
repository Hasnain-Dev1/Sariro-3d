import { NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';

/**
 * SARIRO — GET /api/admin/earnings-report  (admin / super_admin / hr)
 *
 * Company-wide finance snapshot:
 *   - every teacher's earnings totals (pending / settled / net)
 *   - total sale value / paid / due across enrolled leads (+ the lead list)
 */
export const runtime = 'nodejs';

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

  const [earnRes, leadRes] = await Promise.all([
    admin.from('teacher_earnings').select('teacher_id, net_amount, amount, status, teacher:profiles!teacher_id(full_name)'),
    admin.from('student_leads').select('id, student_name, sale_value, amount_paid, assigned_seller, seller:profiles!assigned_seller(full_name)').eq('stage', 'enrolled'),
  ]);

  // Aggregate earnings per teacher.
  const byTeacher = new Map<string, { teacher_id: string; name: string; pending: number; settled: number; net: number }>();
  for (const e of (earnRes.data ?? []) as Array<Record<string, unknown>>) {
    const id = String(e.teacher_id);
    const net = num(e.net_amount ?? e.amount);
    const t = e.teacher as { full_name?: string } | null;
    const row = byTeacher.get(id) ?? { teacher_id: id, name: t?.full_name ?? 'Unknown', pending: 0, settled: 0, net: 0 };
    if (e.status === 'pending') row.pending += net;
    if (e.status === 'settled') row.settled += net;
    row.net += net;
    byTeacher.set(id, row);
  }
  const teachers = [...byTeacher.values()].sort((a, b) => b.net - a.net);

  // Sales totals + list.
  const leads = ((leadRes.data ?? []) as Array<Record<string, unknown>>).map((l) => ({
    id: String(l.id),
    student_name: (l.student_name as string) ?? '—',
    seller_name: (l.seller as { full_name?: string } | null)?.full_name ?? '—',
    sale_value: num(l.sale_value),
    amount_paid: num(l.amount_paid),
    due: num(l.sale_value) - num(l.amount_paid),
  }));
  const salesTotal = leads.reduce((s, l) => s + l.sale_value, 0);
  const paidTotal = leads.reduce((s, l) => s + l.amount_paid, 0);

  return NextResponse.json({
    ok: true,
    teachers,
    earnings_total: teachers.reduce((s, t) => s + t.net, 0),
    sales: { total: salesTotal, paid: paidTotal, due: salesTotal - paidTotal, leads },
  });
}
