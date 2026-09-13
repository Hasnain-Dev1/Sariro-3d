'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X, Loader2, RefreshCw, AlertCircle, FileText, Wallet, Clock, RotateCcw, TrendingUp, Receipt,
} from 'lucide-react';
import { fetchSales, type SaleWithNames } from '@/lib/dashboard/sales-ledger';
import DateRangeFilter from '@/components/dashboard/date-range-filter';
import { resolveRange, dateInRange, inRange, type DateRange, type RangePreset } from '@/lib/dashboard/date-ranges';
import { summarise, outstandingPlans, dueOnSale, type CurrencySummary } from '@/lib/finance/sales-report';

/* ════════════════════════════════════════════════════════════════════════
   SalesEarningsReport — the company's money, for HR and super-admins.

   Sales come from the ledger (the invoice the customer holds), through the
   same fetchSales() as the Sales panel, and are added up by
   lib/finance/sales-report.ts — so this report and that panel cannot give two
   answers. It used to read hand-typed figures on leads that nothing had filled
   in for months, which is why every total showed ₹0.

   Everything follows the date range at the top: today, the last 7 days, this
   month, last month, the last 12 months, or lifetime.
   ════════════════════════════════════════════════════════════════════════ */

interface EarningRow { teacher_id: string; name: string; net: number; status: string; class_date: string | null }

const money = (symbol: string, v: number) =>
  `${symbol}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function SalesEarningsReport({
  open, onClose,
}: { open: boolean; onClose: () => void; onToast?: (msg: string, kind?: 'success' | 'error') => void }) {
  const [sales, setSales] = useState<SaleWithNames[] | null>(null);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [failed, setFailed] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>(() => resolveRange('month'));

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(null);
    try {
      const [ledger, res] = await Promise.all([
        fetchSales(10_000),
        fetch('/api/admin/earnings-report').then((r) => r.json()).catch(() => null),
      ]);
      setSales(ledger);
      setEarnings(res?.ok ? (res.earnings as EarningRow[]) : []);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not load the report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) Promise.resolve().then(load); }, [open, load]);

  const inView = useMemo(() => (sales ?? []).filter((s) => dateInRange(s.sold_on, range)), [sales, range]);
  // Due is worked out across the WHOLE ledger — an earlier payment still counts.
  const plans = useMemo(() => outstandingPlans(sales ?? []), [sales]);
  const summaries = useMemo(() => summarise(inView, sales ?? []), [inView, sales]);

  const teachers = useMemo(() => {
    const map = new Map<string, { name: string; pending: number; settled: number; net: number }>();
    for (const e of earnings) {
      if (!inRange(e.class_date, range)) continue;
      const row = map.get(e.teacher_id) ?? { name: e.name, pending: 0, settled: 0, net: 0 };
      if (e.status === 'pending') row.pending += e.net;
      if (e.status === 'settled') row.settled += e.net;
      row.net += e.net;
      map.set(e.teacher_id, row);
    }
    return [...map.values()].sort((a, b) => b.net - a.net);
  }, [earnings, range]);
  const earningsTotal = teachers.reduce((s, t) => s + t.net, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Earnings &amp; Sales</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <DateRangeFilter value={range} onChange={(preset: RangePreset, custom) => setRange(resolveRange(preset, custom))} />

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
        ) : failed ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {failed}
          </div>
        ) : (
          <>
            {/* ── The figures, per currency ─────────────────────────────── */}
            {summaries.length === 0 ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
                No sales in {range.label.toLowerCase()}.
              </div>
            ) : (
              summaries.map((c) => <Figures key={c.currency} c={c} rangeLabel={range.label} multi={summaries.length > 1} />)
            )}

            {/* ── Enrolled sales ────────────────────────────────────────── */}
            <h4 className="mt-6 text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <Receipt className="w-4 h-4 text-slate-400" /> Enrolled sales · {range.label}
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-[10.5px] uppercase tracking-wider text-slate-400 bg-slate-50">
                    <th className="py-2 px-3 font-bold">Date</th>
                    <th className="py-2 px-3 font-bold">Student</th>
                    <th className="py-2 px-3 font-bold">Course</th>
                    <th className="py-2 px-3 font-bold">Seller</th>
                    <th className="py-2 px-3 font-bold">Type</th>
                    <th className="py-2 px-3 font-bold">Payment</th>
                    <th className="py-2 px-3 font-bold">GST</th>
                    <th className="py-2 px-3 font-bold text-right">Collected</th>
                    <th className="py-2 px-3 font-bold text-right">Refunded</th>
                    <th className="py-2 px-3 font-bold text-right">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {inView.length === 0 && (
                    <tr><td colSpan={10} className="py-6 px-3 text-center text-slate-400">No sales in this period.</td></tr>
                  )}
                  {inView.map((s) => {
                    const due = dueOnSale(s, plans);
                    const refunded = Number(s.refund_amount ?? 0);
                    return (
                      <tr key={s.invoice_number} className="border-t border-slate-100" style={{ opacity: s.refunded_at ? 0.65 : 1 }}>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{s.sold_on}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.student_name}</td>
                        <td className="py-2 px-3 text-slate-600">{s.course_name}</td>
                        <td className="py-2 px-3 text-slate-600">{s.seller_name ?? '—'}</td>
                        <td className="py-2 px-3">
                          <Badge tone={s.sale_type === 'renewal' ? 'violet' : 'blue'}>{s.sale_type === 'renewal' ? 'Renewal' : 'New'}</Badge>
                          {s.refunded_at && <Badge tone="red">Refund</Badge>}
                        </td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                          {s.payment_type === 'installment'
                            ? `Installment of ${money(s.currency_symbol, Number(s.course_total ?? 0))}`
                            : 'Full'}
                        </td>
                        <td className="py-2 px-3"><Badge tone={s.gst_included ? 'green' : 'slate'}>{s.gst_included ? 'Opted' : 'Not opted'}</Badge></td>
                        <td className="py-2 px-3 text-right tabular-nums text-slate-800">{money(s.currency_symbol, Number(s.amount))}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-red-600">{refunded ? money(s.currency_symbol, refunded) : '—'}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-amber-700">{due ? money(s.currency_symbol, due) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Teacher earnings ──────────────────────────────────────── */}
            <h4 className="mt-6 text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <Wallet className="w-4 h-4 text-slate-400" /> Teacher earnings · {range.label}
              <span className="ml-auto text-[12px] font-bold text-slate-500">Total {money('₹', earningsTotal)}</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="text-left text-[10.5px] uppercase tracking-wider text-slate-400 bg-slate-50">
                    <th className="py-2 px-3 font-bold">Teacher</th>
                    <th className="py-2 px-3 font-bold text-right">Pending</th>
                    <th className="py-2 px-3 font-bold text-right">Settled</th>
                    <th className="py-2 px-3 font-bold text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 && (
                    <tr><td colSpan={4} className="py-5 px-3 text-center text-slate-400">No teacher earnings in this period.</td></tr>
                  )}
                  {teachers.map((t) => (
                    <tr key={t.name} className="border-t border-slate-100">
                      <td className="py-2 px-3 font-semibold text-slate-800">{t.name}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-amber-700">{money('₹', t.pending)}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-green-700">{money('₹', t.settled)}</td>
                      <td className="py-2 px-3 text-right tabular-nums font-bold text-slate-900">{money('₹', t.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The five figures and the counts, for one currency. */
function Figures({ c, rangeLabel, multi }: { c: CurrencySummary; rangeLabel: string; multi: boolean }) {
  const cards = [
    { icon: FileText, label: 'Invoiced', value: c.invoiced, hint: 'Value sold — a plan counts its full fee', tint: 'text-slate-900', bg: 'bg-slate-50' },
    { icon: Wallet, label: 'Collected', value: c.collected, hint: 'Payments received', tint: 'text-green-700', bg: 'bg-green-50' },
    { icon: Clock, label: 'Due', value: c.due, hint: 'Still owed on installment plans', tint: 'text-amber-700', bg: 'bg-amber-50' },
    { icon: RotateCcw, label: 'Refunded', value: c.refunded, hint: `${c.refunds} ${c.refunds === 1 ? 'refund' : 'refunds'}`, tint: 'text-red-600', bg: 'bg-red-50' },
    { icon: TrendingUp, label: 'Net', value: c.net, hint: 'Collected less refunds', tint: 'text-blue-700', bg: 'bg-blue-50' },
  ];

  return (
    <div className="mt-5">
      {multi && (
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
          {c.currency} · {rangeLabel}
        </p>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {cards.map((k) => (
          <div key={k.label} className={`rounded-xl ${k.bg} p-3.5`}>
            <p className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <k.icon className="w-3.5 h-3.5" /> {k.label}
            </p>
            <p className={`mt-1 text-xl font-extrabold tabular-nums ${k.tint}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
              {money(c.symbol, k.value)}
            </p>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11.5px]">
        <Chip>{c.sales} {c.sales === 1 ? 'sale' : 'sales'}</Chip>
        <Chip>{c.newSales} new</Chip>
        <Chip>{c.renewals} {c.renewals === 1 ? 'renewal' : 'renewals'}</Chip>
        <Chip>{c.installments} on installments</Chip>
        <Chip>GST opted {c.gstOpted}</Chip>
        <Chip>GST not opted {c.gstNotOpted}</Chip>
        {c.gatewayFees > 0 && <Chip>Gateway fees {money(c.symbol, c.gatewayFees)}</Chip>}
        <Chip>In the bank {money(c.symbol, c.realised)}</Chip>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold">{children}</span>;
}

function Badge({ tone, children }: { tone: 'blue' | 'violet' | 'green' | 'slate' | 'red'; children: React.ReactNode }) {
  const tones = {
    blue: 'bg-blue-100 text-blue-700', violet: 'bg-violet-100 text-violet-700', green: 'bg-green-100 text-green-700',
    slate: 'bg-slate-100 text-slate-600', red: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-block mr-1 px-1.5 py-0.5 rounded text-[10px] font-black ${tones[tone]}`}>{children}</span>;
}
