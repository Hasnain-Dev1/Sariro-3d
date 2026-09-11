'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2, RefreshCw, Wallet, Receipt, Gift, Database, CheckCircle2, Clock, TrendingUp, X, Send,
} from 'lucide-react';
import { inr, type IncentiveBreakdown, type IncentiveConfig } from '@/lib/seller/incentives';
import { PAYMENT_STATUS_LABELS, monthLabel } from '@/lib/seller/payout';

/**
 * SARIRO — a seller's pay, with the working shown
 * ============================================================================
 * A total a seller cannot check is a total they have to take on trust, and the
 * incentive rules here have two traps that cost real money — tiers that do not
 * stack, and value bonuses that replace each other — plus one deliberately
 * asymmetric boundary. So this shows every step: the sales that counted, the
 * tier they reached, which sales carried a bonus and which band, what HR has
 * approved, and what pressing Settle will produce before it is pressed.
 *
 * ── The same cycle a teacher sees ───────────────────────────────────────────
 * A month opens for settlement on the 1st and settles itself on the 5th at
 * 10:00 IST. The dates, the wording and the button behave the way the teacher
 * payout screen does, because both come from lib/dashboard/settlement-period.ts
 * — a seller and a teacher comparing notes should never find two calendars.
 */

interface SaleRow {
  id: string; invoiceNumber: string | null; studentName: string | null;
  amount: number; punchedAt: string | null; bonus: number; bonusBand: '50k' | '20k' | null;
}
interface RequestRow {
  id: string; kind: string | null; month_key: string; amount: number | string; status: string;
  reason: string | null; notes: string | null; sales_count: number | null; tier_sales: number | null;
  created_at: string; decided_at: string | null; settlement_id: string | null;
}
interface SettlementRow {
  id: string; period_month: string; base_amount: number | string; incentive_amount: number | string;
  total_amount: number | string; incentive_count: number; settlement_type: 'manual' | 'auto';
  auto_reason: string | null; payment_status: string; settled_at: string | null; paid_at: string | null;
}
interface Payload {
  ok: boolean;
  message?: string;
  setupMissing: boolean;
  setupMessage: string | null;
  cycle: {
    state: 'open' | 'auto_due' | 'waiting'; headline: string; daysUntilAuto: number;
    settling: { month: string; label: string; opensAt: string; autoSettlesAt: string };
    accruing: { month: string; label: string };
  };
  base: number;
  ownSalarySet: boolean;
  current: { monthKey: string; label: string; sales: SaleRow[]; breakdown: IncentiveBreakdown };
  tiers: IncentiveConfig;
  requests: RequestRow[];
  settlements: SettlementRow[];
  settleable: {
    month: string; label: string; base: number; incentives: number; incentiveCount: number; total: number;
    beforeStart: boolean; alreadySettled: boolean; startMonth: string | null; startLabel: string | null;
  };
  autoSettled: { month: string; total: number } | null;
}

const STATUS_TONE: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  processing: 'bg-amber-100 text-amber-800',
  admin_settled: 'bg-blue-100 text-blue-800',
  seller_settled: 'bg-slate-100 text-slate-700',
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-slate-100 text-slate-500',
};

const n = (v: number | string | null | undefined) => Number(v) || 0;

export default function SellerPayout({ sellerId }: { sellerId?: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  /* HR opening a seller's payout sees exactly this screen, minus the buttons —
     settling and asking are the seller's own acts. */
  const ownView = !sellerId;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(sellerId ? `/api/seller/payout?sellerId=${sellerId}` : '/api/seller/payout');
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || 'Could not load your payout.');
      setData(json as Payload);
      if (json.autoSettled) {
        setFlash({ text: `${json.autoSettled.month} was settled automatically — ${inr(json.autoSettled.total)}.`, ok: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your payout.');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { void load(); }, [load]);

  const settle = async () => {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch('/api/seller/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settle' }),
      });
      const json = await res.json();
      if (json?.ok) {
        setFlash({ text: `${json.month} settled — ${inr(json.total)}. HR has been told.`, ok: true });
        setConfirming(false);
        await load();
      } else {
        setFlash({ text: json?.message ?? 'That did not settle.', ok: false });
        if (json?.error === 'already_settled') await load();
      }
    } catch {
      setFlash({ text: 'Could not reach the server. Try again.', ok: false });
    } finally {
      setBusy(false);
    }
  };

  const requestIncentive = async () => {
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch('/api/seller/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_incentive', amount: Number(amount), reason: reason.trim() }),
      });
      const json = await res.json();
      if (json?.ok) {
        setFlash({ text: `Asked HR for ${inr(Number(amount))}. You will be told when they decide.`, ok: true });
        setAsking(false);
        setAmount('');
        setReason('');
        await load();
      } else {
        setFlash({ text: json?.message ?? 'That request did not go through.', ok: false });
      }
    } catch {
      setFlash({ text: 'Could not reach the server. Try again.', ok: false });
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="card card-md flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card-md">
        <p className="text-sm text-rose-700">{error}</p>
        <button onClick={() => void load()} className="mt-3 text-xs font-bold text-blue-700 hover:underline">Try again</button>
      </div>
    );
  }

  if (!data) return null;

  const { cycle, settleable, current, tiers: t } = data;
  const b = current.breakdown;
  const monthShort = settleable.label.split(' ')[0];
  const settleBlockedReason =
    settleable.beforeStart ? `Seller payouts start from ${settleable.startLabel ?? 'a later month'}.`
    : cycle.state === 'waiting' ? `${settleable.label} opens for settlement on the 1st.`
    : null;

  /* The bar runs to the top tier, or past it when somebody has sold more. */
  const barMax = Math.max(t.tier2Sales, b.salesCount, 1);
  const at = (count: number) => `${Math.min(100, (count / barMax) * 100)}%`;

  return (
    <div className="space-y-5">
      {data.setupMissing && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
          <Database className="w-4 h-4 mt-0.5 shrink-0" />
          <span><strong>Payouts aren’t switched on yet.</strong> {data.setupMessage}</span>
        </div>
      )}

      {flash && (
        <p className={`text-sm rounded-xl border px-3 py-2 ${flash.ok ? 'border-green-200 bg-green-50 text-green-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
          {flash.text}
        </p>
      )}

      {/* ── The month being settled, and the two things a seller can do ─────── */}
      <section className="card card-md">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Payout</h2>
              <p className="text-sm text-slate-600">{settleable.alreadySettled ? `${settleable.label} is settled.` : cycle.headline}</p>
            </div>
          </div>

          {ownView && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setAsking(!asking); setConfirming(false); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold min-h-[40px]"
              >
                <Gift className="w-4 h-4" /> Request incentive
              </button>
              {settleable.alreadySettled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-800 text-xs font-bold min-h-[40px]">
                  <CheckCircle2 className="w-4 h-4" /> {monthShort} settled
                </span>
              ) : (
                <button
                  onClick={() => { setConfirming(!confirming); setAsking(false); }}
                  disabled={!!settleBlockedReason}
                  title={settleBlockedReason ?? cycle.headline}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold min-h-[40px] text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Receipt className="w-4 h-4" /> Settle {monthShort}
                </button>
              )}
            </div>
          )}
        </div>

        {settleBlockedReason && !settleable.alreadySettled && (
          <p className="mt-3 text-[12px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {settleBlockedReason}
          </p>
        )}

        {/* What pressing Settle produces — shown before it is pressed. */}
        {confirming && ownView && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50/60 p-4">
            <p className="text-sm font-bold text-slate-900">Settle {settleable.label}</p>
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm tabular-nums">
              <dt className="text-slate-600">Base pay</dt><dd className="text-right">{inr(settleable.base)}</dd>
              <dt className="text-slate-600">
                Approved incentives{settleable.incentiveCount ? ` (${settleable.incentiveCount})` : ''}
              </dt>
              <dd className="text-right">{inr(settleable.incentives)}</dd>
              <dt className="font-bold text-slate-900 pt-1 border-t border-green-200">Total</dt>
              <dd className="font-bold text-slate-900 text-right pt-1 border-t border-green-200">{inr(settleable.total)}</dd>
            </dl>
            <p className="mt-2 text-[11px] text-slate-500">
              Only incentives HR has approved are included. Anything still pending joins your next settlement once approved.
              If you do not settle, {settleable.label} settles itself on the 5th at 10:00 IST.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => void settle()}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Settle {inr(settleable.total)}
              </button>
              <button onClick={() => setConfirming(false)} className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100">
                Not yet
              </button>
            </div>
          </div>
        )}

        {/* The seller's own ask — for what the tiers cannot see. */}
        {asking && ownView && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Ask HR for an incentive</p>
              <button onClick={() => setAsking(false)} aria-label="Close" className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              For something the tiers do not count — a school deal, a family you saved from a refund. Your tier incentive is requested for you automatically.
            </p>
            <div className="mt-3 grid sm:grid-cols-[10rem_1fr] gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                inputMode="decimal"
                placeholder="Amount (₹)"
                className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What it is for"
                className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <button
              onClick={() => void requestIncentive()}
              disabled={busy || !(Number(amount) > 0) || reason.trim().length < 3}
              className="mt-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to HR
            </button>
          </div>
        )}
      </section>

      {/* ── This month so far ─────────────────────────────────────────────── */}
      <section className="card card-md">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <TrendingUp className="w-4 h-4 text-slate-400" /> {current.label} so far
          </h3>
          <button onClick={() => void load()} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile label="Base pay" value={inr(data.base)} note={data.ownSalarySet ? 'Set for you by HR' : 'Company default'} />
          <Tile label="Incentive earned" value={inr(b.total)} note="Needs HR approval before it is paid" />
          <Tile label="Month total, if approved" value={inr(data.base + b.total)} strong />
        </div>

        {/* How far up the tiers — the markers are where the money changes. */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sales this month</p>
            <p className="text-sm font-extrabold text-slate-900 tabular-nums">{b.salesCount}</p>
          </div>
          <div className="relative h-2.5 rounded-full bg-slate-100">
            <div className="absolute inset-y-0 left-0 rounded-full bg-green-500 transition-[width]" style={{ width: at(b.salesCount) }} />
            {[t.tier1Sales, t.tier2Sales].map((mark) => (
              <div key={mark} className="absolute -top-1 -bottom-1 w-0.5 bg-slate-400" style={{ left: at(mark) }} />
            ))}
          </div>
          <div className="relative h-8 mt-1 text-[10px] text-slate-500">
            {[[t.tier1Sales, t.tier1Amount], [t.tier2Sales, t.tier2Amount]].map(([mark, pay]) => (
              <span key={mark} className="absolute -translate-x-1/2 whitespace-nowrap text-center leading-tight" style={{ left: at(mark) }}>
                {mark} sales<br /><strong className="text-slate-700">{inr(pay)}</strong>
              </span>
            ))}
          </div>
          {b.nextTier && (
            <p className="text-[12px] font-semibold text-amber-700">
              {b.nextTier.salesNeeded} more {b.nextTier.salesNeeded === 1 ? 'sale' : 'sales'} reaches {inr(b.nextTier.amount)}.
            </p>
          )}
        </div>

        {/* The working, line by line. */}
        <dl className="mt-4 divide-y divide-slate-100 text-sm">
          <Line
            label="Tier reached"
            detail={b.tierSales > 0 ? `${b.tierSales} sales` : 'Not yet'}
            value={inr(b.tierAmount)}
          />
          <Line
            label={`Sales above ${t.tier2Sales}`}
            detail={`${b.extraSales} × ${inr(t.abovePerSale)}`}
            value={inr(b.extraAmount)}
          />
          <Line
            label="Value bonuses"
            detail={`${b.bonus50kCount} × ${inr(t.bonus50kAmount)} (₹${(t.bonus50kThreshold / 1000).toFixed(0)}k+) · ${b.bonus20kCount} × ${inr(t.bonus20kAmount)} (over ₹${(t.bonus20kThreshold / 1000).toFixed(0)}k)`}
            value={inr(b.bonusAmount)}
          />
          <div className="flex items-center justify-between py-2.5">
            <dt className="font-extrabold text-slate-900">Incentive this month</dt>
            <dd className="font-extrabold text-slate-900 tabular-nums">{inr(b.total)}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-slate-500 mt-1">
          Tiers do not stack: {t.tier2Sales} sales is {inr(t.tier2Amount)}, not {inr(t.tier1Amount)} + {inr(t.tier2Amount)}.
          A ₹{(t.bonus50kThreshold / 1000).toFixed(0)}k+ sale earns {inr(t.bonus50kAmount)} instead of the {inr(t.bonus20kAmount)} bonus, never both.
          Only sales HR has punched count.
        </p>

        {current.sales.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left py-2">Invoice</th>
                  <th className="text-left py-2">Family</th>
                  <th className="text-right py-2">Sale</th>
                  <th className="text-right py-2">Bonus</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {current.sales.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-mono text-[11px] text-slate-600">{s.invoiceNumber ?? '—'}</td>
                    <td className="py-2 text-slate-800">{s.studentName ?? '—'}</td>
                    <td className="py-2 text-right text-slate-800">{inr(s.amount)}</td>
                    <td className="py-2 text-right">
                      {s.bonusBand ? (
                        <span className="text-[11px] font-bold text-green-700">+{inr(s.bonus)}</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Every incentive, earned or asked for ──────────────────────────── */}
      <section className="card card-md">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
          Incentive requests
        </h3>
        {data.requests.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            None yet. Reaching {t.tier1Sales} sales raises one for you automatically.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.requests.map((r) => (
              <li key={r.id} className="py-2.5 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    {inr(n(r.amount))}
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${r.kind === 'manual' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                      {r.kind === 'manual' ? 'Asked for' : 'Earned · tier'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{monthLabel(r.month_key)}</span>
                  </p>
                  <p className="text-[12px] text-slate-600 mt-0.5">
                    {r.kind === 'manual'
                      ? r.reason
                      : `${r.sales_count ?? 0} sales${r.tier_sales ? ` · tier ${r.tier_sales}` : ''}`}
                  </p>
                  {r.notes && <p className="text-[11px] text-slate-500 mt-0.5">HR: {r.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.settlement_id && <span className="text-[10px] font-bold text-green-700">In a settlement</span>}
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full ${STATUS_TONE[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {r.status === 'pending' ? 'Waiting for HR' : r.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── What has been settled, and whether it has been paid ───────────── */}
      <section className="card card-md">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
          Settlements
        </h3>
        {data.settlements.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">
            Nothing settled yet{settleable.startLabel ? ` — payouts start from ${settleable.startLabel}` : ''}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left py-2">Month</th>
                  <th className="text-right py-2">Base</th>
                  <th className="text-right py-2">Incentive</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-left py-2 pl-4">How</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data.settlements.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 font-bold text-slate-900">{monthLabel(s.period_month)}</td>
                    <td className="py-2.5 text-right text-slate-700">{inr(n(s.base_amount))}</td>
                    <td className="py-2.5 text-right text-slate-700">{inr(n(s.incentive_amount))}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{inr(n(s.total_amount))}</td>
                    <td className="py-2.5 pl-4 text-[12px] text-slate-600" title={s.auto_reason ?? undefined}>
                      {s.settlement_type === 'auto' ? 'Automatically, on the 5th' : 'You settled it'}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full ${STATUS_TONE[s.payment_status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {PAYMENT_STATUS_LABELS[s.payment_status] ?? s.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, note, strong = false }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 ${strong ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-extrabold tabular-nums ${strong ? 'text-green-800' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
        {value}
      </p>
      {note && <p className="text-[11px] text-slate-500 mt-0.5">{note}</p>}
    </div>
  );
}

function Line({ label, detail, value }: { label: string; detail: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="min-w-0">
        <span className="text-slate-800 font-semibold">{label}</span>
        <span className="block text-[11px] text-slate-500">{detail}</span>
      </dt>
      <dd className="text-slate-900 tabular-nums font-semibold shrink-0">{value}</dd>
    </div>
  );
}
