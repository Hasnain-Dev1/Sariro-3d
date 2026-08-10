'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, TrendingUp, Wallet, IndianRupee, AlertCircle, Loader2, RefreshCw, Save } from 'lucide-react';

/* ════════════════════════════════════════════════════════════════════════
   SalesEarningsReport — company finance snapshot (admin/super-admin/HR).
   All teachers' earnings + total sale value/paid/due, with inline editing of
   each enrolled lead's sale figures (HR/super-admin can fix miscalculations).
   Reads GET /api/admin/earnings-report; edits POST /api/leads/financials.
   ════════════════════════════════════════════════════════════════════════ */

interface TeacherAgg { teacher_id: string; name: string; pending: number; settled: number; net: number }
interface LeadRow { id: string; student_name: string; seller_name: string; sale_value: number; amount_paid: number; due: number }
interface Report {
  teachers: TeacherAgg[]; earnings_total: number;
  sales: { total: number; paid: number; due: number; leads: LeadRow[] };
}

const inr = (v: number) => `₹${Number(v || 0).toFixed(0)}`;

export default function SalesEarningsReport({
  open, onClose, onToast,
}: { open: boolean; onClose: () => void; onToast?: (msg: string, kind?: 'success' | 'error') => void }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, { sale: string; paid: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/earnings-report');
      const json = await res.json();
      if (json.ok) setReport(json as Report);
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (open) Promise.resolve().then(load); }, [open, load]);

  const saveRow = async (leadId: string, saleValue: number, amountPaid: number) => {
    setSavingId(leadId);
    try {
      const res = await fetch('/api/leads/financials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, saleValue, amountPaid }),
      });
      const json = await res.json();
      if (json.ok) { onToast?.('Sale figures updated'); setEdits((e) => { const n = { ...e }; delete n[leadId]; return n; }); await load(); }
      else onToast?.(json.error || 'Update failed', 'error');
    } catch { onToast?.('Network error', 'error'); }
    finally { setSavingId(null); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Earnings &amp; Sales</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {loading || !report ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <SummaryCard icon={<Wallet className="w-5 h-5" />} color="green" label="Teacher Earnings" value={inr(report.earnings_total)} />
              <SummaryCard icon={<IndianRupee className="w-5 h-5" />} color="blue" label="Total Sales" value={inr(report.sales.total)} />
              <SummaryCard icon={<TrendingUp className="w-5 h-5" />} color="violet" label="Collected" value={inr(report.sales.paid)} />
              <SummaryCard icon={<AlertCircle className="w-5 h-5" />} color="amber" label="Due" value={inr(report.sales.due)} />
            </div>

            {/* Teachers */}
            <h4 className="text-sm font-extrabold text-slate-700 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Teacher earnings</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 mb-6">
              <table className="w-full text-sm min-w-[420px]">
                <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 px-3 font-bold">Teacher</th><th className="py-2 px-3 font-bold text-right">Pending</th>
                  <th className="py-2 px-3 font-bold text-right">Settled</th><th className="py-2 px-3 font-bold text-right">Net</th>
                </tr></thead>
                <tbody>
                  {report.teachers.length === 0 && <tr><td colSpan={4} className="py-4 px-3 text-center text-slate-400">No earnings yet.</td></tr>}
                  {report.teachers.map((t) => (
                    <tr key={t.teacher_id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 px-3 font-semibold text-slate-800">{t.name}</td>
                      <td className="py-2 px-3 text-right text-amber-700">{inr(t.pending)}</td>
                      <td className="py-2 px-3 text-right text-green-700">{inr(t.settled)}</td>
                      <td className="py-2 px-3 text-right font-extrabold text-slate-900">{inr(t.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enrolled leads — editable sale figures */}
            <h4 className="text-sm font-extrabold text-slate-700 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Enrolled sales (editable)</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm min-w-[640px]">
                <thead><tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 px-3 font-bold">Student</th><th className="py-2 px-3 font-bold">Seller</th>
                  <th className="py-2 px-3 font-bold text-right">Sale ₹</th><th className="py-2 px-3 font-bold text-right">Paid ₹</th>
                  <th className="py-2 px-3 font-bold text-right">Due</th><th className="py-2 px-3 font-bold text-center">Save</th>
                </tr></thead>
                <tbody>
                  {report.sales.leads.length === 0 && <tr><td colSpan={6} className="py-4 px-3 text-center text-slate-400">No enrolled leads yet.</td></tr>}
                  {report.sales.leads.map((l) => {
                    const ed = edits[l.id] ?? { sale: String(l.sale_value), paid: String(l.amount_paid) };
                    const due = (Number(ed.sale) || 0) - (Number(ed.paid) || 0);
                    const dirty = Number(ed.sale) !== l.sale_value || Number(ed.paid) !== l.amount_paid;
                    return (
                      <tr key={l.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 px-3 font-semibold text-slate-800">{l.student_name}</td>
                        <td className="py-2 px-3 text-slate-500">{l.seller_name}</td>
                        <td className="py-2 px-3 text-right">
                          <input type="number" min={0} value={ed.sale} onChange={(e) => setEdits((s) => ({ ...s, [l.id]: { ...ed, sale: e.target.value } }))}
                            className="w-24 text-right min-h-[34px] px-2 rounded-lg border border-slate-200 text-sm" />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input type="number" min={0} value={ed.paid} onChange={(e) => setEdits((s) => ({ ...s, [l.id]: { ...ed, paid: e.target.value } }))}
                            className="w-24 text-right min-h-[34px] px-2 rounded-lg border border-slate-200 text-sm" />
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${due > 0 ? 'text-red-600' : 'text-green-700'}`}>{inr(due)}</td>
                        <td className="py-2 px-3 text-center">
                          <button disabled={!dirty || savingId === l.id} onClick={() => saveRow(l.id, Number(ed.sale) || 0, Number(ed.paid) || 0)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-200 disabled:text-slate-400">
                            {savingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const COLORS: Record<string, string> = {
  green: 'bg-green-50 text-green-700', blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700',
};
function SummaryCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`w-9 h-9 rounded-xl ${COLORS[color]} flex items-center justify-center mb-2`}>{icon}</div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>{label}</p>
      <p className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{value}</p>
    </div>
  );
}
