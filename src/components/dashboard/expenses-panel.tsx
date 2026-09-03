'use client';

import { useCallback, useEffect, useState } from 'react';
import { Receipt, Loader2, Check, X, Plus, ExternalLink } from 'lucide-react';
import {
  fetchExpenses,
  createExpense,
  setExpenseStatus,
  formatRupees,
  type ExpenseSummary,
} from '@/lib/dashboard/expenses';

/**
 * SARIRO — the expense book
 * =========================================================
 * V2 §53-54. HR records what the company spent; Super Admin sees the same rows
 * and the totals. One component serves both, with `canApprove` deciding whether
 * the decision buttons appear — two components would drift on what "approved"
 * means, and the totals would eventually disagree.
 *
 * ── Totals count approved money only ────────────────────────────────────────
 * A pending expense is a claim, not a cost. Counting it in "spent this month"
 * would make the figure move when somebody clicks approve rather than when
 * money left the account. Pending is shown separately and loudly, because it is
 * work waiting for someone.
 *
 * ── Rejected rows stay ──────────────────────────────────────────────────────
 * A rejection is a decision somebody may have to defend later. It stays on the
 * page, greyed, rather than vanishing.
 */

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pending' }) {
  return (
    <div className="card card--compact">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className="text-2xl font-extrabold tabular-nums mt-1 leading-none"
        style={{ color: tone === 'pending' ? '#B45309' : undefined }}
      >
        {value}
      </p>
    </div>
  );
}

export default function ExpensesPanel({ canApprove = false }: { canApprove?: boolean }) {
  const [data, setData] = useState<ExpenseSummary | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10));
  const [documentUrl, setDocumentUrl] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await fetchExpenses());
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'unknown error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    const res = await createExpense({
      title,
      amount: Number(amount),
      spentOn,
      category,
      vendor,
      documentUrl,
      reason,
    });
    setSaving(false);
    if (res.success) {
      setTitle(''); setAmount(''); setCategory(''); setVendor(''); setDocumentUrl(''); setReason('');
      setAdding(false);
      setMsg(null);
      void load();
    } else {
      setMsg(res.error ?? 'Could not save');
    }
  };

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    const res = await setExpenseStatus(id, status);
    setBusyId(null);
    if (res.success) void load();
    else setMsg(res.error ?? 'Could not update');
  };

  if (failed) {
    return (
      <div className="card card--feature">
        <p className="font-semibold text-slate-900 mb-1">Could not load expenses.</p>
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">
          If this is the first time here, run{' '}
          <code className="px-1 rounded bg-slate-100">scripts/expenses.sql</code>.
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
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="This month" value={formatRupees(data.thisMonthTotal)} />
        <Stat label="Approved, all time" value={formatRupees(data.approvedTotal)} />
        <Stat label="Awaiting approval" value={formatRupees(data.pendingTotal)} tone="pending" />
        <Stat label="Pending items" value={String(data.pendingCount)} tone="pending" />
      </div>

      {msg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
          {msg}
        </div>
      )}

      {/* ── record one ─────────────────────────────────────────────────── */}
      {adding ? (
        <div className="card card--feature space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['What was it for', title, setTitle, 'Zoom subscription', 'text'],
                ['Amount (₹)', amount, setAmount, '2400', 'number'],
                ['Category', category, setCategory, 'Software', 'text'],
                ['Paid to', vendor, setVendor, 'Zoom', 'text'],
                ['Date', spentOn, setSpentOn, '', 'date'],
                ['Receipt link', documentUrl, setDocumentUrl, 'https://…', 'url'],
              ] as const
            ).map(([label, val, set, ph, type]) => (
              <div key={label}>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  className="w-full min-h-[40px] rounded-lg border border-slate-300 px-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  style={{ fontSize: '16px' }}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Why
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="What this was needed for."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Record it
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setMsg(null); }}
              className="px-4 min-h-[40px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Plus className="w-4 h-4" />
          Record an expense
        </button>
      )}

      {/* ── the book ───────────────────────────────────────────────────── */}
      {data.expenses.length === 0 ? (
        <div className="card card--feature text-center py-10">
          <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-[14px] text-slate-600">Nothing recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.expenses.map((e) => {
            const tone =
              e.status === 'approved'
                ? { fg: '#15803D', bg: '#15803D14' }
                : e.status === 'rejected'
                  ? { fg: '#64748B', bg: '#64748B14' }
                  : { fg: '#B45309', bg: '#B4530914' };
            return (
              <div
                key={e.id}
                className="card card--compact"
                style={{ opacity: e.status === 'rejected' ? 0.65 : 1 }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-slate-900 text-[14.5px]">{e.title}</span>
                      <span
                        className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
                        style={{ color: tone.fg, background: tone.bg }}
                      >
                        {e.status}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-slate-500">
                      {e.spent_on}
                      {e.category && ` · ${e.category}`}
                      {e.vendor && ` · ${e.vendor}`}
                    </p>
                    {e.reason && (
                      <p className="text-[13px] text-slate-600 mt-1 leading-[1.55]">{e.reason}</p>
                    )}
                    {e.document_url && (
                      <a
                        href={e.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-blue-600 hover:underline mt-1"
                      >
                        Receipt <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[15px] font-extrabold text-slate-900 tabular-nums">
                      {formatRupees(Number(e.amount))}
                    </span>
                    {canApprove && e.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => decide(e.id, 'approved')}
                          disabled={busyId === e.id}
                          aria-label="Approve"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 disabled:opacity-50"
                        >
                          {busyId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(e.id, 'rejected')}
                          disabled={busyId === e.id}
                          aria-label="Reject"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.byCategory.length > 0 && (
        <div className="card card--feature">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Approved spend by category
          </p>
          <div className="space-y-2">
            {data.byCategory.map((c) => {
              const widest = data.byCategory[0].total || 1;
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-[13px] text-slate-700 truncate">{c.category}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: '#2563EB14' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${Math.max((c.total / widest) * 100, 2)}%`, background: '#2563EB' }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[12.5px] font-semibold text-slate-700 tabular-nums">
                    {formatRupees(c.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
