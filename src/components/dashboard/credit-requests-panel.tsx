'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Coins, Loader2, Check, X, ArrowRight } from 'lucide-react';
import {
  fetchCreditRequests, decideCreditRequest, formatCredits,
  type CreditRequest,
} from '@/lib/dashboard/credit-requests';

/**
 * SARIRO — credit requests awaiting a decision
 * =========================================================
 * V2 §50-52. The queue HR works through, and the record everyone else reads.
 *
 * ── The balance shown is the one the decision is judged against ─────────────
 * Each row shows what the student had when the request was raised and what they
 * would have after approval. "Approve 8 credits" means nothing on its own;
 * "2 → 10" is a decision somebody can actually make.
 *
 * ── Approving a different number is normal ──────────────────────────────────
 * The amount is editable at the point of approval, because HR routinely grants
 * something other than what was asked. §52 lists requested and approved as
 * separate facts, and this is where they diverge.
 *
 * ── Rejections stay ─────────────────────────────────────────────────────────
 * Greyed, not gone. Somebody may have to explain one to a parent next month.
 */

const TONE: Record<CreditRequest['status'], { fg: string; bg: string; label: string }> = {
  requested: { fg: '#B45309', bg: '#B4530914', label: 'Awaiting HR' },
  approved: { fg: '#15803D', bg: '#15803D14', label: 'Approved' },
  rejected: { fg: '#64748B', bg: '#64748B14', label: 'Rejected' },
};

function when(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const mins = Math.floor((Date.now() - t) / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  const days = Math.floor(mins / 1440);
  if (days < 30) return `${days}d ago`;
  return new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function CreditRequestsPanel() {
  const [data, setData] = useState<{ requests: CreditRequest[]; canDecide: boolean } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [amount, setAmount] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(async (all: boolean) => {
    try {
      setData(await fetchCreditRequests(all ? 'all' : 'pending'));
      setFailed(null);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not load credit requests.');
    }
  }, []);

  useEffect(() => { void load(showAll); }, [load, showAll]);

  const decide = async (r: CreditRequest, decision: 'approve' | 'reject') => {
    setBusyId(r.id);
    const typed = amount[r.id];
    const res = await decideCreditRequest(r.id, decision, {
      approvedAmount: decision === 'approve' && typed ? Number(typed) : undefined,
      notes: note[r.id],
    });
    setBusyId(null);
    if (res.success) { setMsg(null); void load(showAll); }
    else setMsg(res.error ?? 'Could not save the decision.');
  };

  const pending = useMemo(
    () => (data?.requests ?? []).filter((r) => r.status === 'requested'),
    [data]
  );

  if (failed) {
    return (
      <div className="card card--feature">
        <p className="font-semibold text-slate-900 mb-1">Could not load credit requests.</p>
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">
          If this is the first time here, run{' '}
          <code className="px-1 rounded bg-slate-100">scripts/credit-requests.sql</code>.
        </p>
        <p className="text-[12px] text-slate-400 mt-2">{failed}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-[13px] text-slate-600 leading-[1.6] max-w-[64ch]">
          A request does not change anybody&rsquo;s balance. Credits move only when
          approved here, and the transaction is written in the same moment.
        </p>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-[12.5px] font-bold text-blue-600 hover:text-blue-700 min-h-[40px] px-3"
        >
          {showAll ? 'Show pending only' : 'Show decided too'}
        </button>
      </div>

      {msg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
          {msg}
        </div>
      )}

      {!showAll && pending.length > 0 && (
        <div className="card card--compact">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Awaiting approval</p>
          <p className="text-2xl font-extrabold tabular-nums mt-1 leading-none" style={{ color: '#B45309' }}>
            {pending.length}
          </p>
        </div>
      )}

      {data.requests.length === 0 ? (
        <div className="card card--feature text-center py-10">
          <Coins className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-[14px] text-slate-600">
            {showAll ? 'No credit requests yet.' : 'Nothing waiting for approval.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.requests.map((r) => {
            const tone = TONE[r.status];
            const before = Number(r.balance_at_request ?? 0);
            const grant = r.status === 'approved' ? Number(r.approved_amount ?? 0) : Number(r.requested_amount);
            return (
              <div
                key={r.id}
                className="card card--compact"
                style={{ opacity: r.status === 'rejected' ? 0.65 : 1 }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-[14.5px]">
                        {r.student_name ?? 'A student'}
                      </span>
                      <span
                        className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
                        style={{ color: tone.fg, background: tone.bg }}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-500 mt-0.5">
                      Raised by {r.requested_by_name ?? 'someone'} · {when(r.created_at)}
                      {r.decided_at && r.decided_by_name ? ` · decided by ${r.decided_by_name}` : ''}
                    </p>
                  </div>

                  {/* The whole decision in one line: what they have, what they'd have. */}
                  <div className="flex items-center gap-2 shrink-0 text-[14px] font-extrabold text-slate-900 tabular-nums">
                    <span className="text-slate-400">{before}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <span>{before + grant}</span>
                    <span className="text-[12px] font-semibold text-slate-400">
                      ({grant > 0 ? '+' : ''}{grant})
                    </span>
                  </div>
                </div>

                {r.reason && (
                  <p className="text-[13px] text-slate-600 leading-[1.55]">{r.reason}</p>
                )}
                {r.hr_notes && (
                  <p className="text-[12.5px] text-slate-500 mt-1 italic">HR: {r.hr_notes}</p>
                )}

                {data.canDecide && r.status === 'requested' && (
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <label className="sr-only" htmlFor={`amt-${r.id}`}>Credits to approve</label>
                    <input
                      id={`amt-${r.id}`}
                      type="number"
                      min={1}
                      value={amount[r.id] ?? String(r.requested_amount)}
                      onChange={(e) => setAmount((a) => ({ ...a, [r.id]: e.target.value }))}
                      className="w-24 min-h-[40px] rounded-lg border border-slate-300 px-3 text-[13.5px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      style={{ fontSize: '16px' }}
                    />
                    <input
                      value={note[r.id] ?? ''}
                      onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="Note (optional)"
                      className="flex-1 min-w-[160px] min-h-[40px] rounded-lg border border-slate-300 px-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      style={{ fontSize: '16px' }}
                    />
                    <button
                      type="button"
                      onClick={() => decide(r, 'approve')}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-lg bg-green-600 hover:bg-green-700 text-white text-[13px] font-bold disabled:opacity-50"
                    >
                      {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(r, 'reject')}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {r.status === 'approved' && (
                  <p className="text-[12.5px] text-green-700 font-semibold mt-1.5">
                    {formatCredits(Number(r.approved_amount ?? 0))} added
                    {Number(r.approved_amount) !== Number(r.requested_amount)
                      ? ` (${formatCredits(Number(r.requested_amount))} were requested)`
                      : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
