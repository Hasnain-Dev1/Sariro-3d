'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, Mail, Loader2, Phone, Check, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — the inbox that did not exist
 * =========================================================
 * /contact accepted messages and threw them away — its submit handler waited
 * 900ms, said "we'll reply within 24 hours", and wrote nothing anywhere. The
 * worst of those losses were the bank-transfer requests, because checkout
 * linked into that same form: people at the payment step, choosing the one
 * method that needs a human, were the most reliably lost.
 *
 * This is where they land now. It is deliberately plain — a list, a filter,
 * and one button that marks a row done — because the failure mode being fixed
 * is "nobody saw it", not "the view was not pretty enough".
 *
 * ── Money first ─────────────────────────────────────────────────────────────
 * Bank-transfer rows sort above general contact messages regardless of age. A
 * three-day-old press enquiry can wait; a buyer holding a bank app cannot.
 */

interface PaymentRequestRow {
  id: string;
  kind: 'bank_transfer' | 'contact';
  full_name: string | null;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  product_slug: string | null;
  scope_label: string | null;
  cadence: string | null;
  ratio: string | null;
  status: 'new' | 'in_progress' | 'done';
  created_at: string;
}

type Filter = 'open' | 'bank_transfer' | 'all';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function PaymentRequestsPanel() {
  const [rows, setRows] = useState<PaymentRequestRow[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      // Almost always means the migration has not been run yet. Say which,
      // rather than showing an empty list that looks like "no enquiries".
      setFailed(error.message);
      return;
    }
    setRows((data ?? []) as PaymentRequestRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const picked =
      filter === 'open'
        ? rows.filter((r) => r.status !== 'done')
        : filter === 'bank_transfer'
          ? rows.filter((r) => r.kind === 'bank_transfer')
          : rows;
    // Money first, then newest.
    return [...picked].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'bank_transfer' ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [rows, filter]);

  const markDone = async (id: string) => {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from('payment_requests')
      .update({ status: 'done' })
      .eq('id', id);
    if (!error) {
      setRows((prev) =>
        prev ? prev.map((r) => (r.id === id ? { ...r, status: 'done' } : r)) : prev
      );
    }
    setBusyId(null);
  };

  if (failed) {
    return (
      <div className="card-3d p-6">
        <p className="font-bold text-slate-900 mb-1">Could not load enquiries.</p>
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">
          If this is the first time you are opening this tab, the{' '}
          <code className="px-1 rounded bg-slate-100">payment_requests</code> table probably does
          not exist yet — run <code className="px-1 rounded bg-slate-100">scripts/payment-requests.sql</code>{' '}
          in Supabase.
        </p>
        <p className="text-[12px] text-slate-400 mt-2">{failed}</p>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="card-3d p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    );
  }

  const openBank = rows.filter((r) => r.kind === 'bank_transfer' && r.status !== 'done').length;

  return (
    <div className="space-y-4">
      {/* Money waiting is the one number worth putting at the top. */}
      {openBank > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <Landmark className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 text-sm">
              {openBank} {openBank === 1 ? 'person is' : 'people are'} waiting for bank details
            </p>
            <p className="text-[13px] text-amber-800 mt-0.5 leading-[1.55]">
              They chose bank transfer at checkout. Until someone sends the account details and a
              reference, the sale cannot complete.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {(
          [
            { key: 'open', label: 'Open' },
            { key: 'bank_transfer', label: 'Bank transfers' },
            { key: 'all', label: 'All' },
          ] as { key: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors ${
              filter === f.key
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card-3d p-8 text-center">
          <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">
            {filter === 'open' ? 'Nothing waiting. Everything has been handled.' : 'Nothing here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const isMoney = r.kind === 'bank_transfer';
            return (
              <div
                key={r.id}
                className="card-3d p-4"
                style={isMoney ? { borderLeft: '3px solid #B45309' } : undefined}
              >
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${
                          isMoney ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isMoney ? <Landmark className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {isMoney ? 'BANK TRANSFER' : (r.subject ?? 'CONTACT').toUpperCase()}
                      </span>
                      {r.status === 'done' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-700">
                          DONE
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {timeAgo(r.created_at)}
                      </span>
                    </div>
                    <p className="font-extrabold text-slate-900 text-[15px] leading-tight">
                      {r.full_name ?? 'Someone'}
                    </p>
                    {/* Contact details are the point of the row — make them
                        one tap, not something to copy out by hand. */}
                    <div className="flex items-center gap-3 flex-wrap mt-1">
                      <a
                        href={`mailto:${r.email}`}
                        className="text-[12.5px] font-semibold text-blue-600 hover:underline break-all"
                      >
                        {r.email}
                      </a>
                      {r.phone && (
                        <a
                          href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}
                          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-blue-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {r.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {r.status !== 'done' && (
                    <button
                      onClick={() => markDone(r.id)}
                      disabled={busyId === r.id}
                      className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
                      style={{ fontFamily: 'var(--font-grotesk)' }}
                    >
                      {busyId === r.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Mark done
                    </button>
                  )}
                </div>

                {/* What they were buying — so the amount can be quoted without asking. */}
                {(r.scope_label || r.product_slug) && (
                  <p className="text-[12.5px] text-slate-600 mb-1.5">
                    <span className="font-bold text-slate-800">Wants:</span>{' '}
                    {r.scope_label ?? r.product_slug}
                    {r.cadence && ` · ${r.cadence}`}
                    {r.ratio && ` · ${r.ratio}`}
                  </p>
                )}

                {r.message && (
                  <p className="text-[13px] text-slate-600 leading-[1.6] whitespace-pre-wrap">
                    {r.message}
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
