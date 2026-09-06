'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, Clock, Copy, Check } from 'lucide-react';
import {
  fetchReconciliation, GRACE_HOURS, type Reconciliation,
} from '@/lib/dashboard/invoice-reconciliation';

/**
 * SARIRO — invoices that never reached the books
 * =========================================================
 * The sales ledger refuses a sale without an invoice, which is what makes it
 * trustworthy. This is the other direction: an invoice was issued, the customer
 * was billed, and nobody logged the sale.
 *
 * Three states rather than two. An invoice issued an hour ago is not a problem
 * — HR raises it and a seller records it, sometimes the next morning. Only the
 * ones past a day are asking for anything, and the panel says so rather than
 * showing a red number that is usually noise.
 */
export default function UnrecordedInvoicesPanel({
  onCount,
}: {
  /** So a tab can carry the overdue count without fetching twice. */
  onCount?: (overdue: number) => void;
}) {
  const [data, setData] = useState<Reconciliation | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetchReconciliation();
      setData(r);
      setFailed(null);
      onCount?.(r.overdue);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not check the invoices.');
    }
  }, [onCount]);

  useEffect(() => { void load(); }, [load]);

  if (failed) {
    return (
      <div className="card card--compact">
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">{failed}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const age = (h: number) => (h < 48 ? `${h}h` : `${Math.floor(h / 24)}d`);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Stat label="Invoices issued" value={data.issued} />
        <Stat label="In the ledger" value={data.recorded} tone="#15803D" />
        <Stat label="Waiting" value={data.waiting} tone="#64748B" note={`under ${GRACE_HOURS}h`} />
        <Stat
          label="Not recorded"
          value={data.overdue}
          tone={data.overdue > 0 ? '#B91C1C' : '#15803D'}
          note={`over ${GRACE_HOURS}h`}
        />
      </div>

      {data.overdue === 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-[13px] text-green-800 leading-[1.6]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Every invoice older than a day is in the books.
            {data.waiting > 0 && ` ${data.waiting} issued today ${data.waiting === 1 ? 'is' : 'are'} still within the handover window.`}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-800 leading-[1.6]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>{data.overdue}</strong>{' '}
            {data.overdue === 1 ? 'invoice was' : 'invoices were'} issued more than a day ago and
            {data.overdue === 1 ? ' has' : ' have'} no sale recorded. The customer has been billed
            and the books do not know about it.
          </span>
        </div>
      )}

      {data.pending.length > 0 && (
        <div className="card card--compact !p-0 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="px-3.5 py-2.5">Invoice</th>
                <th className="px-3.5 py-2.5">Customer</th>
                <th className="px-3.5 py-2.5">Course</th>
                <th className="px-3.5 py-2.5 text-right">Amount</th>
                <th className="px-3.5 py-2.5">Issued</th>
                <th className="px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data.pending.map((p) => (
                <tr
                  key={p.invoice_number}
                  className={`border-b border-slate-100 last:border-b-0 ${p.overdue ? 'bg-red-50/40' : ''}`}
                >
                  <td className="px-3.5 py-2.5 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                    {p.invoice_number}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-semibold text-slate-900">{p.customer_name}</span>
                    {p.customer_email && (
                      <span className="block text-[11.5px] text-slate-400 truncate max-w-[180px]">
                        {p.customer_email}
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 max-w-[180px] truncate">{p.course_name}</td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                    {p.currency_symbol}{Number(p.total).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${p.overdue ? 'text-red-700' : 'text-slate-500'}`}>
                      <Clock className="w-3.5 h-3.5" /> {age(p.ageHours)} ago
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {/* The number is what Record a sale asks for, so it is one
                        click away rather than something to retype from a table. */}
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(p.invoice_number);
                        setCopied(p.invoice_number);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                      className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                    >
                      {copied === p.invoice_number
                        ? <><Check className="w-3.5 h-3.5" /> Copied</>
                        : <><Copy className="w-3.5 h-3.5" /> Copy number</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11.5px] text-slate-400 leading-[1.55]">
        A sale cannot be recorded without an invoice, so this is the gap the other
        way round. Copy the number and use <strong>Record a sale</strong> — everything
        else is filled in from the invoice.
      </p>
    </div>
  );
}

function Stat({
  label, value, tone = '#0F172A', note,
}: { label: string; value: number; tone?: string; note?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-extrabold tabular-nums" style={{ color: tone, fontFamily: 'var(--font-jakarta)' }}>
        {value}
      </p>
      {note && <p className="text-[11px] text-slate-400">{note}</p>}
    </div>
  );
}
