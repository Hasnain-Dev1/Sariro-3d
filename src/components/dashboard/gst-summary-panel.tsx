'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Download, Landmark, Loader2, Scale } from 'lucide-react';
import { fetchInvoices } from '@/lib/invoice/records';
import { fetchSales, downloadCsv } from '@/lib/dashboard/sales-ledger';
import { fetchExpenses } from '@/lib/dashboard/expenses';
import { gstCsv, gstSummary, type GstExpense, type GstInvoice, type GstRefund } from '@/lib/finance/gst-summary';
import DateRangeFilter from '@/components/dashboard/date-range-filter';
import { dateInRange, resolveRange, type DateRange, type RangePreset } from '@/lib/dashboard/date-ranges';

/**
 * SARIRO — GST for a period: output, input, and what is left to pay
 * ============================================================================
 * Output GST from the invoices we issue, less refunds; input GST from the
 * bills we paid that can be claimed back; the difference is payable (or credit
 * carried forward). One download holds every line for the accountant.
 * The arithmetic is lib/finance/gst-summary.ts, tested.
 *
 * `range` controlled by the parent (the Earnings & Sales report), or its own
 * filter when used as a section.
 */

const rupees = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GstSummaryPanel({ range: controlled }: { range?: DateRange }) {
  const [own, setOwn] = useState<DateRange>(() => resolveRange('month'));
  const range = controlled ?? own;
  const [data, setData] = useState<{ invoices: GstInvoice[]; refunds: GstRefund[]; expenses: GstExpense[] } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [expenseNote, setExpenseNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFailed(null);
    try {
      const [invoices, sales, expenses] = await Promise.all([
        fetchInvoices(5_000),
        fetchSales(10_000).catch(() => []),
        fetchExpenses(5_000).then((x) => x.expenses).catch(() => null),
      ]);
      setExpenseNote(expenses === null ? 'Expenses could not be read, so input GST shows as zero.' : null);
      setData({
        invoices: invoices.map((i) => ({
          invoice_number: i.invoice_number, invoice_date: i.invoice_date, customer_name: i.customer_name,
          customer_state: i.customer_state, taxable: Number(i.taxable), total_tax: Number(i.total_tax), total: Number(i.total),
          tax_treatment: i.tax_treatment, currency_code: i.currency_code,
        })),
        refunds: sales.map((s) => ({ invoice_number: s.invoice_number, refunded_at: s.refunded_at, refund_amount: s.refund_amount })),
        expenses: (expenses ?? []) as GstExpense[],
      });
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not load GST.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const inPeriod = useCallback((ymd: string | null | undefined) => dateInRange(ymd, range), [range]);
  const summary = useMemo(() => (data ? gstSummary({ ...data, allInvoices: data.invoices, inPeriod }) : null), [data, inPeriod]);
  const expensesMissingGst = !!data && data.expenses.length > 0 && data.expenses.every((e) => e.gst_amount === undefined);

  return (
    <div className="space-y-3">
      {!controlled && (
        <DateRangeFilter value={own} onChange={(preset: RangePreset, custom) => setOwn(resolveRange(preset, custom))} />
      )}

      {failed && (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {failed}
        </p>
      )}
      {!failed && !summary && (
        <div className="flex items-center gap-2 py-6 text-[13px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Adding up GST…</div>
      )}

      {summary && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-rose-50 p-3.5">
              <p className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-rose-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                <ArrowUpRight className="w-3.5 h-3.5" /> Output GST
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{rupees(summary.outputNet)}</p>
              <p className="text-[11.5px] text-slate-600 leading-snug mt-0.5">
                On {summary.output.invoices} {summary.output.invoices === 1 ? 'invoice' : 'invoices'} ({rupees(summary.output.total)})
                {summary.creditNotes.total > 0 && <>, less {rupees(summary.creditNotes.total)} on {summary.creditNotes.refunds} {summary.creditNotes.refunds === 1 ? 'refund' : 'refunds'}</>}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3.5">
              <p className="flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-emerald-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                <ArrowDownLeft className="w-3.5 h-3.5" /> Input GST
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{rupees(summary.input.total)}</p>
              <p className="text-[11.5px] text-slate-600 leading-snug mt-0.5">
                Claimable on {summary.input.bills} approved {summary.input.bills === 1 ? 'bill' : 'bills'}
                {summary.notClaimable.total > 0 && <> · {rupees(summary.notClaimable.total)} not claimable</>}
              </p>
            </div>
            <div className={`rounded-xl p-3.5 ${summary.net >= 0 ? 'bg-slate-900 text-white' : 'bg-blue-50'}`}>
              <p className={`flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider ${summary.net >= 0 ? 'text-white/70' : 'text-blue-700'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                <Scale className="w-3.5 h-3.5" /> {summary.net >= 0 ? 'Net GST payable' : 'Credit carried forward'}
              </p>
              <p className={`mt-1 text-xl font-extrabold tabular-nums ${summary.net >= 0 ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
                {rupees(Math.abs(summary.net))}
              </p>
              <p className={`text-[11.5px] leading-snug mt-0.5 ${summary.net >= 0 ? 'text-white/70' : 'text-slate-600'}`}>Output GST less input GST</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-slate-400 bg-slate-50">
                  <th className="py-2 px-3 font-bold">Output GST by head</th>
                  <th className="py-2 px-3 font-bold text-right">Taxable value</th>
                  <th className="py-2 px-3 font-bold text-right">CGST</th>
                  <th className="py-2 px-3 font-bold text-right">SGST</th>
                  <th className="py-2 px-3 font-bold text-right">IGST</th>
                  <th className="py-2 px-3 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                <tr className="border-t border-slate-100">
                  <td className="py-2 px-3 font-semibold text-slate-800">Invoices</td>
                  <td className="py-2 px-3 text-right">{rupees(summary.output.taxable)}</td>
                  <td className="py-2 px-3 text-right">{rupees(summary.output.cgst)}</td>
                  <td className="py-2 px-3 text-right">{rupees(summary.output.sgst)}</td>
                  <td className="py-2 px-3 text-right">{rupees(summary.output.igst)}</td>
                  <td className="py-2 px-3 text-right font-bold">{rupees(summary.output.total)}</td>
                </tr>
                {summary.creditNotes.total > 0 && (
                  <tr className="border-t border-slate-100 text-red-700">
                    <td className="py-2 px-3 font-semibold">Less refunds</td>
                    <td className="py-2 px-3 text-right">−{rupees(summary.creditNotes.taxable)}</td>
                    <td className="py-2 px-3 text-right">−{rupees(summary.creditNotes.cgst)}</td>
                    <td className="py-2 px-3 text-right">−{rupees(summary.creditNotes.sgst)}</td>
                    <td className="py-2 px-3 text-right">−{rupees(summary.creditNotes.igst)}</td>
                    <td className="py-2 px-3 text-right font-bold">−{rupees(summary.creditNotes.total)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            {summary.exports.invoices > 0 && (
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                Exports, no GST: {summary.exports.invoices} · {summary.exports.byCurrency.map((c) => `${c.currency} ${c.value.toLocaleString('en-IN')}`).join(' + ')}
              </span>
            )}
            {summary.noGstInIndia.invoices > 0 && (
              <span className="rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                Indian invoices without GST: {summary.noGstInIndia.invoices} · {rupees(summary.noGstInIndia.value)}
              </span>
            )}
            <button
              type="button"
              onClick={() => downloadCsv(`sariro-gst-${range.label.toLowerCase().replace(/\s+/g, '-')}.csv`, gstCsv({ ...data, allInvoices: data.invoices, inPeriod }))}
              className="ml-auto inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg border border-slate-300 bg-white text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-4 h-4 text-slate-400" /> Download GST lines for filing
            </button>
          </div>

          {(expenseNote || expensesMissingGst) && (
            <p className="flex items-start gap-2 text-[12px] text-amber-800">
              <Landmark className="w-4 h-4 shrink-0" />
              {expenseNote ?? 'Input GST is not being recorded yet — run scripts/expense-gst.sql in Supabase, then add GST when you record an expense.'}
            </p>
          )}
          <p className="text-[11.5px] text-slate-400">A working summary for the accountant — the return is filed from their records.</p>
        </>
      )}
    </div>
  );
}
