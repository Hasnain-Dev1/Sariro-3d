'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, RotateCcw, Download, AlertCircle, Receipt } from 'lucide-react';
import {
  fetchSales, fetchSellers, recordSale, recordRefund, netOf, realisedOf, salesToCsv, downloadCsv,
  type SaleWithNames,
} from '@/lib/dashboard/sales-ledger';
import DateRangeFilter from '@/components/dashboard/date-range-filter';
import { resolveRange, dateInRange, type RangePreset, type DateRange } from '@/lib/dashboard/date-ranges';

/**
 * SARIRO — sales and refunds
 * =========================================================
 * Recording a sale is typing one invoice number. Everything else is read from
 * the invoice: student, course, amount, currency, country, GST treatment.
 *
 * ── Why there is no amount field ────────────────────────────────────────────
 * There used to be one — sale_value, typed by hand on the lead. A typed figure
 * is a figure that can be typed wrongly, and when it is, the books and the
 * customer's invoice disagree with nobody able to say which is right.
 *
 * Deriving it from the invoice removes the question. It also enforces something
 * useful by accident: no sale can be recorded until HR has issued the invoice,
 * so the paperwork cannot lag behind the revenue.
 *
 * ── Duplicates ─────────────────────────────────────────────────────────────
 * The invoice number is the primary key. Three roles can push a sale and the
 * same one will sometimes be pushed twice; the second attempt is refused by the
 * database, not by a check in this file.
 */

type Mode = 'sale' | 'refund' | null;

export default function SalesLedgerPanel({ canRefund = true }: { canRefund?: boolean }) {
  const [rows, setRows] = useState<SaleWithNames[] | null>(null);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [failed, setFailed] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(() => resolveRange('month'));
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [notes, setNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await fetchSales());
      setFailed(null);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not load the ledger.');
    }
  }, []);

  useEffect(() => {
    void load();
    void fetchSellers().then(setSellers);
  }, [load]);

  const visible = useMemo(
    () => (rows ?? []).filter((r) => dateInRange(r.sold_on, range)),
    [rows, range]
  );

  /* Totals are per currency. Adding dollars to rupees would produce a number
     that looks like revenue and is not — the same defect the pricing guard
     exists to prevent elsewhere. */
  const totals = useMemo(() => {
    const map = new Map<string, { symbol: string; gross: number; refunded: number; net: number; count: number }>();
    for (const r of visible) {
      const cur = map.get(r.currency_code) ?? { symbol: r.currency_symbol, gross: 0, refunded: 0, net: 0, count: 0 };
      cur.gross += Number(r.amount);
      cur.refunded += Number(r.refund_amount ?? 0);
      cur.net += netOf(r);
      cur.count += 1;
      map.set(r.currency_code, cur);
    }
    return [...map.entries()];
  }, [visible]);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const res = mode === 'refund'
      ? await recordRefund(invoiceNumber, refundAmount ? Number(refundAmount) : undefined, refundReason)
      : await recordSale(invoiceNumber, sellerId || null, notes);
    setBusy(false);

    if (res.error) { setMsg({ text: res.error, ok: false }); return; }
    setMsg({
      text: mode === 'refund'
        ? `Refund recorded against ${res.sale?.invoice_number}.`
        : `${res.sale?.student_name} — ${res.sale?.currency_symbol}${Number(res.sale?.amount).toLocaleString()} recorded.`,
      ok: true,
    });
    setInvoiceNumber(''); setNotes(''); setRefundAmount(''); setRefundReason('');
    setMode(null);
    void load();
  };

  const exportCsv = () => {
    const name = `sariro-sales_${range.label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.csv`;
    downloadCsv(name, salesToCsv(visible));
  };

  if (failed) {
    return (
      <div className="card card--feature">
        <p className="font-semibold text-slate-900 mb-1">Could not load the sales ledger.</p>
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { setMode(mode === 'sale' ? null : 'sale'); setMsg(null); }}
          className="inline-flex items-center gap-2 px-4 min-h-[42px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Plus className="w-4 h-4" /> Record a sale
        </button>
        {canRefund && (
          <button
            type="button"
            onClick={() => { setMode(mode === 'refund' ? null : 'refund'); setMsg(null); }}
            className="inline-flex items-center gap-2 px-4 min-h-[42px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <RotateCcw className="w-4 h-4" /> Record a refund
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="inline-flex items-center gap-2 px-4 min-h-[42px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:bg-slate-300"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Download className="w-4 h-4" /> Download report
        </button>
      </div>

      <DateRangeFilter
        value={range}
        onChange={(preset: RangePreset, custom) => setRange(resolveRange(preset, custom))}
      />

      {msg && (
        <div
          className="flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] leading-[1.55]"
          style={msg.ok
            ? { borderColor: '#A7F3D0', background: '#ECFDF5', color: '#065F46' }
            : { borderColor: '#FCA5A5', background: '#FEF2F2', color: '#991B1B' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* ── Recording one ────────────────────────────────────────────────── */}
      {mode && (
        <div className="card card--feature space-y-3">
          <p className="text-[13px] text-slate-600 leading-[1.6]">
            {mode === 'sale'
              ? 'Enter the invoice number. The student, course, amount, currency, country and GST treatment all come from the invoice — nothing else to type.'
              : 'Enter the invoice number of the sale being refunded.'}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Invoice number
              </label>
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="SR2627-0042-K7XQ"
                className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 text-[13.5px] font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                style={{ fontSize: '16px' }}
              />
            </div>

            {mode === 'sale' ? (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Sold by
                  </label>
                  <select
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                    className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 text-[13.5px] bg-white"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">Not attributed</option>
                    {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Note <span className="text-slate-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 text-[13.5px]"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Amount <span className="text-slate-400 normal-case font-normal">(blank = full)</span>
                  </label>
                  <input
                    type="number" min={0} step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 text-[13.5px]"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Reason
                  </label>
                  <input
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full min-h-[42px] rounded-lg border border-slate-300 px-3 text-[13.5px]"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy || !invoiceNumber.trim()}
              className="inline-flex items-center gap-2 px-4 min-h-[42px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:bg-slate-300"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'sale' ? 'Record it' : 'Record refund'}
            </button>
            <button
              type="button"
              onClick={() => { setMode(null); setMsg(null); }}
              className="px-4 min-h-[42px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Totals, per currency ─────────────────────────────────────────── */}
      {totals.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totals.map(([code, t]) => (
            <div key={code} className="card card--compact">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {range.label} · {code}
              </p>
              <p className="text-2xl font-extrabold tabular-nums mt-1 leading-none text-slate-900">
                {t.symbol}{t.net.toLocaleString(code === 'INR' ? 'en-IN' : 'en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[12px] text-slate-500 mt-1">
                {t.count} {t.count === 1 ? 'sale' : 'sales'}
                {t.refunded > 0 && ` · ${t.symbol}${t.refunded.toLocaleString()} refunded`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── The ledger ───────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div className="card card--feature text-center py-10">
          <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-[14px] text-slate-600">
            {rows.length === 0 ? 'No sales recorded yet.' : `Nothing in ${range.label.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="card card--compact !p-0 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="px-3.5 py-2.5">Invoice</th>
                <th className="px-3.5 py-2.5">Date</th>
                <th className="px-3.5 py-2.5">Student</th>
                <th className="px-3.5 py-2.5">Course</th>
                <th className="px-3.5 py-2.5">Country</th>
                <th className="px-3.5 py-2.5">GST</th>
                <th className="px-3.5 py-2.5">Payment</th>
                <th className="px-3.5 py-2.5 text-right">Amount</th>
                <th className="px-3.5 py-2.5 text-right">Net</th>
                <th className="px-3.5 py-2.5 text-right">Realised</th>
                <th className="px-3.5 py-2.5">Seller</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.invoice_number}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  style={{ opacity: r.refunded_at ? 0.6 : 1 }}
                >
                  <td className="px-3.5 py-2.5 font-mono text-[11.5px] text-slate-600 whitespace-nowrap">{r.invoice_number}</td>
                  <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">{r.sold_on}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{r.student_name}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 max-w-[200px] truncate">{r.course_name}</td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{r.country ?? '—'}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase whitespace-nowrap"
                      style={r.gst_included
                        ? { color: '#15803D', background: '#15803D14' }
                        : { color: '#64748B', background: '#64748B14' }}
                    >
                      {r.gst_included ? 'Opted in' : 'Opted out'}
                    </span>
                  </td>
                  {/* What the amount beside it is a part of, and whether this
                      was new business or a renewal. A renewal skips the trial,
                      so counting the two together makes growth look like
                      whatever churn happens to be. */}
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className="text-slate-600">
                      {r.payment_type === 'installment' ? 'Installment' : 'Full'}
                    </span>
                    {r.sale_type === 'renewal' && (
                      <span
                        className="ml-1.5 text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
                        style={{ color: '#7C3AED', background: '#7C3AED14' }}
                      >
                        Renewal
                      </span>
                    )}
                    {r.payment_type === 'installment' && r.course_total != null && (
                      <span className="block text-[10.5px] text-slate-400">
                        of {r.currency_symbol}{Number(r.course_total).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-600 whitespace-nowrap">
                    {r.currency_symbol}{Number(r.amount).toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2.5 text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">
                    {r.currency_symbol}{netOf(r).toLocaleString()}
                    {r.refunded_at && <span className="block text-[10px] font-semibold" style={{ color: '#B91C1C' }}>refunded</span>}
                  </td>
                  {/* What actually reached the bank. Revenue and realised
                      differ by the gateway's cut on every card payment, and
                      quoting one for the other is how a company thinks it is
                      2% more profitable than it is. */}
                  <td className="px-3.5 py-2.5 text-right tabular-nums whitespace-nowrap">
                    <span className="font-bold text-slate-900">
                      {r.currency_symbol}{realisedOf(r).toLocaleString()}
                    </span>
                    {Number(r.gateway_fee ?? 0) > 0 && (
                      <span className="block text-[10.5px] text-slate-400">
                        less {r.currency_symbol}{Number(r.gateway_fee).toLocaleString()} fee
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">{r.seller_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11.5px] text-slate-400 leading-[1.55]">
        A sale is recorded from its invoice, so the figures here are the ones the
        customer was actually sent. <strong>Net</strong> is what was charged less
        any refund; <strong>Realised</strong> is what reached the bank after the
        payment gateway took its cut, which it keeps even when a payment is
        refunded. Totals are kept per currency — adding dollars to rupees would
        produce a number that looks like revenue and is not.
      </p>
    </div>
  );
}
