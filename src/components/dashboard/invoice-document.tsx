'use client';

import Image from 'next/image';
import { COMPANY } from '@/lib/invoice/company';
import { calculateInvoice, formatMoney } from '@/lib/invoice/calculate';

/**
 * SARIRO — the invoice itself
 * =========================================================
 * The document a customer receives. Rendered on screen as a live preview and
 * printed to PDF from the same markup, so what is previewed is exactly what is
 * sent — a second layout for printing is how a preview and a PDF drift.
 *
 * ── Why print-to-PDF rather than a PDF library ──────────────────────────────
 * The obvious alternative is html2canvas plus jsPDF. That takes a raster
 * screenshot and embeds it: text stops being selectable or searchable, the logo
 * softens, and it prints at screen resolution on an A4 page. The brief asked
 * for a PDF that is "not simply a screenshot of the webpage", and that library
 * pairing produces precisely a screenshot.
 *
 * The browser's own print engine keeps text as text and the SVG logo as
 * vectors, paginates properly, and adds no dependency to maintain. The @page
 * rules below set A4 with real margins.
 *
 * ── The tax section is absent, not empty ────────────────────────────────────
 * For an international customer there is no subtotal row, no zero line, no
 * "not applicable". The section does not render. See lib/invoice/calculate.ts.
 */

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerAddress: string;
  customerCountry: string;
  customerStateCode: string;
  customerEmail: string;
  customerPhone: string;
  courseName: string;
  courseDescription: string;
  price: number;
  currencyCode: string;
  currencySymbol: string;
  includeGst: boolean;
  paymentStatus: 'Paid' | 'Pending';
  paymentReference: string;
}

export default function InvoiceDocument({ data }: { data: InvoiceData }) {
  const totals = calculateInvoice({
    price: data.price,
    country: data.customerCountry,
    includeGst: data.includeGst,
    customerStateCode: data.customerStateCode,
  });

  const money = (n: number) => formatMoney(n, data.currencyCode, data.currencySymbol);
  const addressLines = data.customerAddress.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <div className="invoice-sheet bg-white text-slate-900" id="invoice-sheet">
      <style>{`
        /* A4 with real margins. The browser paginates; nothing is scaled to
           fit, so type stays the size it was designed at. */
        @page { size: A4; margin: 14mm 12mm; }
        @media print {
          body * { visibility: hidden; }
          #invoice-sheet, #invoice-sheet * { visibility: visible; }
          #invoice-sheet {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border: 0 !important;
          }
          /* Never split a row or the totals block across a page break. */
          .invoice-row, .invoice-totals, .invoice-footer { break-inside: avoid; }
          thead { display: table-header-group; }
        }
        .invoice-sheet { font-feature-settings: 'tnum' 1; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6 pb-5 border-b-2 border-slate-900">
        <div className="flex items-start gap-3 min-w-0">
          <Image
            src={COMPANY.logoSrc}
            alt=""
            width={52}
            height={52}
            className="rounded-lg shrink-0"
            unoptimized
          />
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold tracking-tight leading-tight">
              {COMPANY.legalName}
            </p>
            <p className="text-[10.5px] text-slate-500 mt-1 leading-[1.5]">
              {COMPANY.address.line1}<br />
              {COMPANY.address.line2}<br />
              {COMPANY.address.line3}
            </p>
            <p className="text-[10.5px] text-slate-600 mt-1.5 leading-[1.5]">
              {COMPANY.email} · {COMPANY.phone}
            </p>
            <p className="text-[10px] text-slate-500 mt-1 leading-[1.5]">
              CIN {COMPANY.cin} · GSTIN {COMPANY.gstin}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[22px] font-extrabold tracking-[0.14em] leading-none">
            {totals.showsTax ? 'TAX INVOICE' : 'INVOICE'}
          </p>
          <p className="text-[11px] text-slate-600 mt-2.5 leading-[1.7]">
            <span className="text-slate-400">No.</span>{' '}
            <span className="font-bold text-slate-900">{data.invoiceNumber}</span><br />
            <span className="text-slate-400">Date</span> {data.invoiceDate}
          </p>
          <span
            className="inline-block mt-2 text-[9.5px] font-black tracking-wider uppercase px-2 py-1 rounded"
            style={
              data.paymentStatus === 'Paid'
                ? { color: '#15803D', background: '#15803D14' }
                : { color: '#B45309', background: '#B4530914' }
            }
          >
            {data.paymentStatus}
          </span>
        </div>
      </div>

      {/* ── Bill to ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-8 py-5">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
            Bill to
          </p>
          <p className="text-[13.5px] font-bold text-slate-900">
            {data.customerName || '—'}
          </p>
          {/* An address that was not given is simply absent. No "N/A", no
              placeholder — a customer-facing document does not admit that a
              field was left blank, it just does not print it. */}
          {addressLines.length > 0 && (
            <p className="text-[11px] text-slate-600 mt-1 leading-[1.6]">
              {addressLines.map((line, i) => <span key={i}>{line}<br /></span>)}
            </p>
          )}
          {data.customerCountry && (
            <p className="text-[11px] text-slate-600 leading-[1.6]">{data.customerCountry}</p>
          )}
          {(data.customerEmail || data.customerPhone) && (
            <p className="text-[11px] text-slate-600 mt-1.5 leading-[1.6]">
              {data.customerEmail}
              {data.customerEmail && data.customerPhone ? <br /> : null}
              {data.customerPhone}
            </p>
          )}
        </div>

        <div className="text-right">
          {data.paymentReference && (
            <>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1.5">
                Reference
              </p>
              <p className="text-[11.5px] text-slate-700">{data.paymentReference}</p>
            </>
          )}
        </div>
      </div>

      {/* ── Lines ──────────────────────────────────────────────────────── */}
      <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="border-y border-slate-200">
            <th className="py-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500">Description</th>
            <th className="py-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500 text-center w-16">Qty</th>
            <th className="py-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500 text-right w-32">Unit price</th>
            <th className="py-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-500 text-right w-32">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="invoice-row border-b border-slate-100 align-top">
            <td className="py-3.5 pr-4">
              <p className="text-[12.5px] font-bold text-slate-900">{data.courseName || '—'}</p>
              {data.courseDescription && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-[1.55] whitespace-pre-wrap">
                  {data.courseDescription}
                </p>
              )}
            </td>
            <td className="py-3.5 text-[12px] text-slate-700 text-center tabular-nums">1</td>
            <td className="py-3.5 text-[12px] text-slate-700 text-right tabular-nums">
              {money(totals.showsTax ? totals.taxable : totals.total)}
            </td>
            <td className="py-3.5 text-[12px] text-slate-900 text-right tabular-nums font-semibold">
              {money(totals.showsTax ? totals.taxable : totals.total)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Totals ─────────────────────────────────────────────────────── */}
      <div className="invoice-totals flex justify-end pt-4">
        <div className="w-72">
          {totals.showsTax && (
            <>
              <Row label="Taxable amount" value={money(totals.taxable)} />
              {totals.taxLines.map((line) => (
                <Row
                  key={line.label}
                  label={`${line.label} @ ${line.rate}%`}
                  value={money(line.amount)}
                />
              ))}
            </>
          )}
          <div className="flex items-baseline justify-between gap-4 pt-2.5 mt-2 border-t-2 border-slate-900">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">Total</span>
            <span className="text-[17px] font-extrabold tabular-nums">{money(totals.total)}</span>
          </div>
          {totals.showsTax && (
            <p className="text-[9.5px] text-slate-400 mt-1.5 text-right leading-[1.5]">
              Amount is inclusive of GST.
            </p>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="invoice-footer mt-8 pt-4 border-t border-slate-200">
        <p className="text-[12px] font-semibold text-slate-800">
          Thank you for choosing Sariro.
        </p>
        <p className="text-[10px] text-slate-500 mt-1.5 leading-[1.6]">
          Questions about this invoice? Write to {COMPANY.email} or call {COMPANY.phone}.
        </p>
        <p className="text-[9.5px] text-slate-400 mt-3">
          {COMPANY.legalName} · CIN {COMPANY.cin} · GSTIN {COMPANY.gstin}
        </p>
        {/* An export invoice says why no tax was charged. Without this line the
            absence looks like an omission rather than the correct treatment. */}
        {!totals.showsTax && data.customerCountry.trim().toLowerCase() !== 'india' && (
          <p className="text-[9.5px] text-slate-400 mt-1">
            Supply of services to a recipient outside India. Indian GST is not applicable.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-[11.5px] text-slate-600">{label}</span>
      <span className="text-[12px] text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
