'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Printer, X, FileText } from 'lucide-react';
import InvoiceDocument from '@/components/dashboard/invoice-document';
import {
  fetchInvoices, setInvoicePaymentStatus, recordToInvoiceData, invoiceFileName,
  type InvoiceRecord,
} from '@/lib/invoice/records';
import { formatMoney } from '@/lib/invoice/calculate';

/**
 * SARIRO — invoices already issued
 * =========================================================
 * §12. What was sent, to whom, for how much.
 *
 * ── The PDF is regenerated, never retrieved ─────────────────────────────────
 * Opening an invoice redraws it from the stored fields using the same component
 * that printed it originally, so it comes out identical without a hundred
 * kilobytes having been kept for every sale. The record is the invoice; the PDF
 * is a view of it.
 *
 * That also means an old invoice keeps the figures it was issued with — the
 * taxable amount and tax are stored, not recomputed, so a change to the GST
 * rate cannot rewrite history.
 *
 * ── Only the payment status can change ──────────────────────────────────────
 * Everything else is frozen. A wrong invoice is corrected with a credit note,
 * not by editing the one the customer already has.
 */

type StatusFilter = 'all' | 'Paid' | 'Pending';

export default function InvoiceHistory() {
  const [rows, setRows] = useState<InvoiceRecord[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [country, setCountry] = useState('all');
  const [open, setOpen] = useState<InvoiceRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await fetchInvoices());
      setFailed(null);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not load invoices.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const countries = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.customer_country))].sort(),
    [rows]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (status !== 'all' && r.payment_status !== status) return false;
      if (country !== 'all' && r.customer_country !== country) return false;
      if (!q) return true;
      // One box across the fields somebody would actually search by, rather
      // than four boxes they have to choose between.
      return [r.invoice_number, r.customer_name, r.course_name, r.customer_email ?? '']
        .some((f) => f.toLowerCase().includes(q));
    });
  }, [rows, query, status, country]);

  const togglePaid = async (r: InvoiceRecord) => {
    setBusyId(r.id);
    const next = r.payment_status === 'Paid' ? 'Pending' : 'Paid';
    const res = await setInvoicePaymentStatus(r.id, next);
    setBusyId(null);
    if (res.success) void load();
    else setFailed(res.error ?? 'Could not update.');
  };

  const printOpen = () => {
    if (!open) return;
    const previous = document.title;
    document.title = invoiceFileName(open);
    window.print();
    setTimeout(() => { document.title = previous; }, 1000);
  };

  if (failed) {
    return (
      <div className="card card--feature">
        <p className="font-semibold text-slate-900 mb-1">Could not load invoices.</p>
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">{failed}</p>
      </div>
    );
  }
  if (!rows) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 invoice-history-controls">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Invoice number, student, course or email…"
            aria-label="Search invoices"
            className="w-full min-h-[40px] rounded-lg border border-slate-300 pl-9 pr-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            style={{ fontSize: '16px' }}
          />
        </div>
        <select
          value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Payment status"
          className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-[13px] bg-white"
        >
          <option value="all">Any status</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
        <select
          value={country} onChange={(e) => setCountry(e.target.value)}
          aria-label="Country"
          className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-[13px] bg-white"
        >
          <option value="all">Any country</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {shown.length === 0 ? (
        <div className="card card--feature text-center py-10">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-[14px] text-slate-600">
            {rows.length === 0 ? 'No invoices issued yet.' : 'Nothing matches those filters.'}
          </p>
        </div>
      ) : (
        <div className="card card--compact !p-0 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="px-3.5 py-2.5">Invoice</th>
                <th className="px-3.5 py-2.5">Student</th>
                <th className="px-3.5 py-2.5">Course</th>
                <th className="px-3.5 py-2.5">Country</th>
                <th className="px-3.5 py-2.5 text-right">Amount</th>
                <th className="px-3.5 py-2.5">Date</th>
                <th className="px-3.5 py-2.5">Status</th>
                <th className="px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                  <td className="px-3.5 py-2.5 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">
                    {r.invoice_number}
                  </td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{r.customer_name}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 max-w-[220px] truncate">{r.course_name}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{r.customer_country}</td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                    {formatMoney(Number(r.total), r.currency_code, r.currency_symbol)}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">{r.invoice_date}</td>
                  <td className="px-3.5 py-2.5">
                    <button
                      type="button"
                      onClick={() => togglePaid(r)}
                      disabled={busyId === r.id}
                      title="Click to change"
                      className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase disabled:opacity-50"
                      style={r.payment_status === 'Paid'
                        ? { color: '#15803D', background: '#15803D14' }
                        : { color: '#B45309', background: '#B4530914' }}
                    >
                      {r.payment_status}
                    </button>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setOpen(r)}
                      className="text-[12.5px] font-bold text-blue-600 hover:text-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11.5px] text-slate-400 leading-[1.55]">
        Invoices are stored as text, not PDFs — each one is redrawn from its
        record when you open it, identical to the day it was issued.
      </p>

      {/* ── Viewing one ──────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-4"
          onClick={() => setOpen(null)}
          role="presentation"
        >
          <div
            className="max-w-4xl mx-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label={`Invoice ${open.invoice_number}`}
          >
            <div className="flex items-center justify-between gap-3 mb-3 invoice-history-controls">
              <p className="text-white font-bold text-[15px]">{open.invoice_number}</p>
              <div className="flex gap-2">
                <button
                  type="button" onClick={printOpen}
                  className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-[13px] font-bold"
                >
                  <Printer className="w-4 h-4" /> Download / Print
                </button>
                <button
                  type="button" onClick={() => setOpen(null)} aria-label="Close"
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-white p-8 sm:p-10 rounded-xl" style={{ maxWidth: '210mm', margin: '0 auto' }}>
              <InvoiceDocument data={recordToInvoiceData(open)} />
            </div>
          </div>
        </div>
      )}

      <style>{`@media print { .invoice-history-controls { display: none !important; } }`}</style>
    </div>
  );
}
