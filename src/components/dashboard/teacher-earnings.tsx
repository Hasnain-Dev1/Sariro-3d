'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, CheckCircle2, TrendingDown, TrendingUp, Calendar, Loader2,
  ArrowRight, Gift, Receipt, X, IndianRupee,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRealtime } from '@/lib/dashboard/use-realtime';

/* ════════════════════════════════════════════════════════════════════════
   TeacherEarnings — the teacher's work + finance portal.
   Reads /api/teacher/earnings (server-scoped to the signed-in teacher) and
   lets them Settle pending earnings + Request an incentive. Live-updates via
   Supabase Realtime the moment HR advances anything.
   ════════════════════════════════════════════════════════════════════════ */

interface Earning {
  id: string;
  class_date: string;
  lesson_name: string | null;
  ratio: string | null;
  base_amount: number | string;
  bonus_amount: number | string;
  penalty_amount: number | string;
  penalty_reason: string | null;
  net_amount: number | string;
  amount: number | string;
  status: 'pending' | 'settled';
}
interface Settlement {
  id: string;
  total_classes: number;
  total_amount: number | string;
  status: string;
  payment_status: string | null;
  requested_at: string;
  paid_at: string | null;
}
interface Incentive {
  id: string;
  amount: number | string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'deleted';
  requested_at: string;
}

const PAY_PIPELINE = ['not_settled', 'teacher_settled', 'admin_settled', 'processing', 'paid'];
const n = (v: number | string | null | undefined) => Number(v ?? 0);
const inr = (v: number | string | null | undefined) => `₹${n(v).toFixed(0)}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function TeacherEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'earnings' | 'settlements' | 'incentives'>('earnings');
  const [showSettle, setShowSettle] = useState(false);
  const [showIncentive, setShowIncentive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: 'success' | 'error' } | null>(null);

  const flash = (msg: string, kind: 'success' | 'error' = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/earnings');
      const json = await res.json();
      if (json.ok) {
        setEarnings(json.earnings ?? []);
        setSettlements(json.settlements ?? []);
        setIncentives(json.incentives ?? []);
      }
    } catch {
      /* keep last state on transient error */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadAll);
  }, [loadAll]);

  useRealtime({
    tables: ['teacher_earnings', 'teacher_settlements', 'teacher_incentives'],
    onRefresh: loadAll,
    enabled: !!user,
  });

  /* ── Derived totals ── */
  const {
    pendingTotal, settledTotal, totalPenalties, totalBonuses, monthTotal, monthClasses, pendingCount,
  } = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    let pendingTotal = 0, settledTotal = 0, totalPenalties = 0, totalBonuses = 0, monthTotal = 0, monthClasses = 0, pendingCount = 0;
    for (const e of earnings) {
      const net = n(e.net_amount ?? e.amount);
      if (e.status === 'pending') { pendingTotal += net; pendingCount += 1; }
      if (e.status === 'settled') settledTotal += net;
      totalPenalties += n(e.penalty_amount);
      totalBonuses += n(e.bonus_amount);
      const d = new Date(e.class_date);
      if (d.getMonth() === m && d.getFullYear() === y) { monthTotal += net; monthClasses += 1; }
    }
    return { pendingTotal, settledTotal, totalPenalties, totalBonuses, monthTotal, monthClasses, pendingCount };
  }, [earnings]);

  /* ── Actions ── */
  const doSettle = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/teacher/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settle' }),
      });
      const json = await res.json();
      if (json.ok) { flash(`Settlement requested — ${inr(json.total)} across ${json.classes} classes.`); setShowSettle(false); loadAll(); }
      else flash(json.error === 'nothing_to_settle' ? 'No pending earnings to settle.' : 'Could not create settlement.', 'error');
    } catch { flash('Network error. Try again.', 'error'); }
    finally { setBusy(false); }
  };

  const doIncentive = async (amount: number, reason: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/teacher/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_incentive', amount, reason }),
      });
      const json = await res.json();
      if (json.ok) { flash('Incentive request sent to HR.'); setShowIncentive(false); loadAll(); }
      else flash('Could not submit incentive request.', 'error');
    } catch { flash('Network error. Try again.', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-green-600" />
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          Earnings &amp; Payouts
        </h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <SummaryCard icon={<Wallet className="w-5 h-5" />} color="amber" label="Pending Payout" value={inr(pendingTotal)} />
        <SummaryCard icon={<CheckCircle2 className="w-5 h-5" />} color="green" label="Settled" value={inr(settledTotal)} />
        <SummaryCard icon={<TrendingDown className="w-5 h-5" />} color="red" label="Total Penalties" value={inr(totalPenalties)} />
        <SummaryCard icon={<TrendingUp className="w-5 h-5" />} color="violet" label="Total Bonuses" value={inr(totalBonuses)} />
      </div>

      {/* This month banner */}
      <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-600/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-green-700" style={{ fontFamily: 'var(--font-grotesk)' }}>This Month</p>
            <p className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {inr(monthTotal)} <span className="text-sm font-semibold text-slate-500">· {monthClasses} classes</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIncentive(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold transition-colors min-h-[40px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Gift className="w-4 h-4" /> Request Incentive
          </button>
          <button
            onClick={() => {
              // Settlement cycle closes on the 30th (teacher's local date).
              if (new Date().getDate() < 30) {
                flash("Settlement opens on the 30th — this cycle hasn't ended yet.", 'error');
                return;
              }
              setShowSettle(true);
            }}
            disabled={pendingCount === 0}
            title={new Date().getDate() < 30 ? 'Available from the 30th' : undefined}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors min-h-[40px] disabled:cursor-not-allowed text-white ${
              new Date().getDate() < 30 ? 'bg-slate-400 hover:bg-slate-400' : 'bg-green-600 hover:bg-green-700'
            } disabled:bg-slate-300`}
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Receipt className="w-4 h-4" /> Settle{pendingCount > 0 ? ` (${inr(pendingTotal)})` : ''}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
        {([['earnings', 'Earnings History'], ['settlements', 'Settlements'], ['incentives', 'Incentives']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors border-b-2 -mb-px min-h-[40px] ${
              tab === key ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {tab === 'earnings' && <EarningsTable earnings={earnings} />}
          {tab === 'settlements' && <SettlementsList settlements={settlements} />}
          {tab === 'incentives' && <IncentivesList incentives={incentives} />}
        </motion.div>
      )}

      {/* Settle modal */}
      {showSettle && (
        <Modal title="Settle pending earnings" onClose={() => !busy && setShowSettle(false)}>
          <p className="text-sm text-slate-600 mb-4">
            This bundles your <strong>{pendingCount}</strong> pending {pendingCount === 1 ? 'class' : 'classes'} into one settlement request and sends it to HR for payout.
          </p>
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-green-700" style={{ fontFamily: 'var(--font-grotesk)' }}>Total to settle</p>
            <p className="text-3xl font-extrabold text-green-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{inr(pendingTotal)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettle(false)} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50">Cancel</button>
            <button onClick={doSettle} disabled={busy || pendingCount === 0} className="flex-1 min-h-[44px] rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Requesting…</> : <>Confirm settlement</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Incentive modal */}
      {showIncentive && (
        <IncentiveModal busy={busy} onClose={() => !busy && setShowIncentive(false)} onSubmit={doIncentive} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg ${toast.kind === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
          {toast.msg}
        </div>
      )}
    </section>
  );
}

/* ─────────────────── sub-components ─────────────────── */

const COLORS: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700', green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-600', violet: 'bg-violet-50 text-violet-700',
};

function SummaryCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`w-9 h-9 rounded-xl ${COLORS[color]} flex items-center justify-center mb-2`}>{icon}</div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>{label}</p>
      <p className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{value}</p>
    </div>
  );
}

function EarningsTable({ earnings }: { earnings: Earning[] }) {
  if (earnings.length === 0) return <Empty label="No earnings yet — they appear here after you complete a class." />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <th className="py-2.5 px-3 font-bold">Date</th>
            <th className="py-2.5 px-3 font-bold">Lesson</th>
            <th className="py-2.5 px-3 font-bold text-center">Ratio</th>
            <th className="py-2.5 px-3 font-bold text-right">Base</th>
            <th className="py-2.5 px-3 font-bold text-right">Penalty</th>
            <th className="py-2.5 px-3 font-bold text-right">Net</th>
            <th className="py-2.5 px-3 font-bold text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((e) => (
            <tr key={e.id} className="border-b border-slate-50 last:border-0">
              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{fmtDate(e.class_date)}</td>
              <td className="py-2.5 px-3 text-slate-800 font-semibold">{e.lesson_name || '—'}</td>
              <td className="py-2.5 px-3 text-center text-slate-500">{e.ratio || '—'}</td>
              <td className="py-2.5 px-3 text-right text-slate-600">{inr(n(e.base_amount) + n(e.bonus_amount))}</td>
              <td className="py-2.5 px-3 text-right">
                {n(e.penalty_amount) !== 0 ? (
                  <span className="text-red-600 font-bold" title={e.penalty_reason || ''}>−{inr(e.penalty_amount)}</span>
                ) : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">{inr(e.net_amount ?? e.amount)}</td>
              <td className="py-2.5 px-3 text-center">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${e.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {e.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettlementsList({ settlements }: { settlements: Settlement[] }) {
  if (settlements.length === 0) return <Empty label="No settlement requests yet. Hit “Settle” to bundle your pending earnings." />;
  return (
    <div className="space-y-3">
      {settlements.map((s) => {
        const ps = s.payment_status || 'not_settled';
        const idx = PAY_PIPELINE.indexOf(ps);
        return (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{inr(s.total_amount)}</p>
                <p className="text-xs text-slate-500">{s.total_classes} classes · requested {fmtDate(s.requested_at)}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                ps === 'paid' ? 'bg-green-100 text-green-700' : ps === 'processing' ? 'bg-blue-100 text-blue-700' :
                ps === 'admin_settled' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
              }`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                {ps.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-0.5">
              {PAY_PIPELINE.map((stage, i) => (
                <span key={stage} className="flex items-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${i <= idx ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {stage.replace(/_/g, ' ')}
                  </span>
                  {i < PAY_PIPELINE.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IncentivesList({ incentives }: { incentives: Incentive[] }) {
  const visible = incentives.filter((i) => i.status !== 'deleted');
  if (visible.length === 0) return <Empty label="No incentive requests yet. Think you earned a bonus? Request one." />;
  return (
    <div className="space-y-3">
      {visible.map((i) => (
        <div key={i.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{inr(i.amount)}</p>
            <p className="text-xs text-slate-500 truncate">{i.reason}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Requested {fmtDate(i.requested_at)}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase ${
            i.status === 'approved' ? 'bg-green-100 text-green-700' : i.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`} style={{ fontFamily: 'var(--font-grotesk)' }}>
            {i.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function IncentiveModal({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (amount: number, reason: string) => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const valid = Number(amount) > 0 && reason.trim().length >= 3;
  return (
    <Modal title="Request an incentive" onClose={onClose}>
      <p className="text-sm text-slate-600 mb-4">Tell HR why you deserve a bonus (e.g. extra classes, perfect attendance). They can approve, reject, or adjust it.</p>
      <label className="block text-xs font-bold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Amount (₹)</label>
      <div className="relative mb-4">
        <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy}
          className="w-full min-h-[44px] pl-9 pr-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 text-sm" placeholder="500" />
      </div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Reason</label>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} rows={3} maxLength={500}
        className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 text-sm mb-5 resize-none" placeholder="Taught 10 extra classes this month with perfect attendance." />
      <div className="flex gap-2">
        <button onClick={onClose} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50">Cancel</button>
        <button onClick={() => onSubmit(Number(amount), reason.trim())} disabled={busy || !valid}
          className="flex-1 min-h-[44px] rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Send request</>}
        </button>
      </div>
    </Modal>
  );
}
