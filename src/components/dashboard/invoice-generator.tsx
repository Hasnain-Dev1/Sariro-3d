'use client';

import { useMemo, useState } from 'react';
import { Printer, AlertCircle, Info, FileCheck, Loader2 } from 'lucide-react';
import InvoiceDocument, { type InvoiceData } from '@/components/dashboard/invoice-document';
import { CURRENCIES, COUNTRIES, INDIAN_STATES } from '@/lib/invoice/company';
import { gstAvailable } from '@/lib/invoice/calculate';
import { issueInvoice } from '@/lib/invoice/records';

/**
 * SARIRO — Generate Invoice
 * =========================================================
 * Details on the left, the finished document on the right, updating as it is
 * typed. What is previewed is what prints — one component renders both.
 *
 * ── The number comes from the database, at the moment of issue ──────────────
 * GST rules require a consecutive series, unique within a financial year. The
 * preview shows a provisional number so the document does not have a hole in
 * it; pressing Issue calls issue_invoice(), which takes the real serial and
 * writes the row in one locked statement. Two people clicking at the same
 * second get 0007 and 0008, never 0007 twice.
 *
 * ── Text is stored, never the PDF ───────────────────────────────────────────
 * The record is under a kilobyte; the PDF it produces is a hundred times that
 * and carries nothing the record does not. History redraws each invoice from
 * its fields using this same document component.
 *
 * ── Why the PDF comes from the browser ──────────────────────────────────────
 * See invoice-document.tsx. Print keeps text as text; a canvas library would
 * embed a screenshot.
 */

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * A placeholder, shown until the invoice is actually issued.
 *
 * The real number is allocated by the database so the series stays consecutive.
 * This exists so the preview does not have a blank where the number goes, and
 * it is visibly provisional rather than looking like a number that has been
 * assigned.
 */
const PROVISIONAL_NUMBER = 'SARIRO-INV-…-####';

/** India's financial year starts on 1 April — matches issue_invoice(). */
function financialYearOf(iso: string): number {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return new Date().getFullYear();
  return d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
}

/** customer_course_date — safe on every filesystem. */
function fileNameFor(data: InvoiceData): string {
  const clean = (s: string) =>
    s.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'invoice';
  return `${clean(data.customerName)}_${clean(data.courseName)}_${data.invoiceDate}`;
}

export default function InvoiceGenerator({ onIssued }: { onIssued?: () => void }) {
  /** Null until issued. The database decides the real one. */
  const [issuedNumber, setIssuedNumber] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(todayISO);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCountry, setCustomerCountry] = useState('India');
  const [customerStateCode, setCustomerStateCode] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [includeGst, setIncludeGst] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [paymentReference, setPaymentReference] = useState('');

  const isIndia = gstAvailable(customerCountry);
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  const data: InvoiceData = useMemo(() => ({
    invoiceNumber: issuedNumber ?? PROVISIONAL_NUMBER,
    invoiceDate: formatDate(invoiceDate),
    customerName,
    customerAddress,
    customerCountry,
    // A state only means something for an Indian customer.
    customerStateCode: isIndia ? customerStateCode : '',
    customerEmail,
    customerPhone,
    courseName,
    courseDescription,
    price: Number(price) || 0,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    // The calculation ignores this outside India, but keeping the flag honest
    // means the preview and the print can never disagree.
    includeGst: isIndia && includeGst,
    paymentStatus,
    paymentReference,
  }), [
    issuedNumber, invoiceDate, customerName, customerAddress, customerCountry,
    customerStateCode, customerEmail, customerPhone, courseName, courseDescription,
    price, currency, includeGst, paymentStatus, paymentReference, isIndia,
  ]);

  const problems = useMemo(() => {
    const list: string[] = [];
    if (!customerName.trim()) list.push('Student name');
    if (!courseName.trim()) list.push('Course name');
    if (!(Number(price) > 0)) list.push('A price above zero');
    if (!customerCountry) list.push('Country');
    return list;
  }, [customerName, courseName, price, customerCountry]);

  /** Print. The document title becomes the suggested PDF filename. */
  const print = () => {
    const previous = document.title;
    document.title = fileNameFor(data);
    window.print();
    // Restored on the next tick: the dialog is modal, and some browsers read
    // the title after it opens.
    setTimeout(() => { document.title = previous; }, 1000);
  };

  /**
   * Take a real invoice number and record the sale.
   *
   * Issuing is separate from printing on purpose: a number is consumed from the
   * series here, so it should happen once deliberately rather than every time
   * somebody reaches for the print dialog.
   */
  const issue = async () => {
    if (problems.length > 0 || issuing) return;
    setIssuing(true);
    setIssueError(null);
    const res = await issueInvoice({ ...data, invoiceDateISO: invoiceDate });
    setIssuing(false);
    if (res.error || !res.record) {
      setIssueError(res.error ?? 'Could not issue the invoice.');
      return;
    }
    setIssuedNumber(res.record.invoice_number);
    onIssued?.();
  };

  /** Clear the form for the next one, keeping nothing from the last. */
  const startAnother = () => {
    setIssuedNumber(null);
    setIssueError(null);
    setCustomerName(''); setCustomerAddress(''); setCustomerEmail(''); setCustomerPhone('');
    setCourseName(''); setCourseDescription(''); setPrice(''); setPaymentReference('');
    setInvoiceDate(todayISO());
  };

  const onCountryChange = (country: string) => {
    setCustomerCountry(country);
    if (!gstAvailable(country)) {
      // §14 — nobody should have to remember that GST is India-only.
      setIncludeGst(false);
      setCustomerStateCode('');
      if (currencyCode === 'INR') setCurrencyCode('USD');
    } else {
      setIncludeGst(true);
      setCurrencyCode('INR');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-5 items-start">
        {/* ── Details ──────────────────────────────────────────────────── */}
        <div className="space-y-4 invoice-form">
          <Section title="Customer">
            <Field label="Student name" required>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Rahul Sharma" />
            </Field>
            <Field label="Address" hint="Left blank if you don't have it — nothing is printed in its place.">
              <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)}
                rows={3} className={`${inputCls} py-2`} style={inputStyle} placeholder="Street&#10;City, State — PIN" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Email">
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="name@example.com" />
              </Field>
              <Field label="Phone">
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="+91 …" />
              </Field>
            </div>
            <Field label="Country" required>
              <select value={customerCountry} onChange={(e) => onCountryChange(e.target.value)}
                className={inputCls} style={inputStyle}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            {isIndia && (
              <Field label="State" hint="Decides CGST + SGST versus IGST. Unset is treated as IGST.">
                <select value={customerStateCode} onChange={(e) => setCustomerStateCode(e.target.value)}
                  className={inputCls} style={inputStyle}>
                  <option value="">Not specified</option>
                  {INDIAN_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </Field>
            )}
          </Section>

          <Section title="Course">
            <Field label="Course name" required>
              <input value={courseName} onChange={(e) => setCourseName(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Web Development — Beginner" />
            </Field>
            <Field label="Description" hint="Optional. Appears under the course name.">
              <textarea value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)}
                rows={2} className={`${inputCls} py-2`} style={inputStyle}
                placeholder="30 live one-to-one classes" />
            </Field>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Field label="Price the customer pays" required>
                <input type="number" min={0} step="0.01" value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="11800" />
              </Field>
              <Field label="Currency" required>
                <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}
                  className={inputCls} style={inputStyle}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Tax">
            {isIndia ? (
              <>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={includeGst}
                    onChange={(e) => setIncludeGst(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-blue-600" />
                  <span className="text-[13px] text-slate-700 leading-[1.5]">
                    <span className="font-semibold">Price includes 18% GST</span><br />
                    <span className="text-slate-500">
                      GST is taken out of the price you entered — never added on top.
                      The customer still pays exactly what you typed.
                    </span>
                  </span>
                </label>
              </>
            ) : (
              <p className="text-[12.5px] text-slate-500 leading-[1.6] flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                Customer is outside India, so no tax section appears on the
                invoice at all — not a zero row.
              </p>
            )}
          </Section>

          <Section title="Invoice">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date">
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </Field>
              <Field label="Status">
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as 'Paid' | 'Pending')}
                  className={inputCls} style={inputStyle}>
                  <option>Paid</option>
                  <option>Pending</option>
                </select>
              </Field>
            </div>
            <Field label="Payment reference" hint="Optional — a transaction id, for example.">
              <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="pay_XXXXXXXX" />
            </Field>
            <Field
              label="Invoice number"
              hint={issuedNumber
                ? `Financial year ${financialYearOf(invoiceDate)}–${String(financialYearOf(invoiceDate) + 1).slice(2)}.`
                : 'Allocated when you issue it, so the series stays consecutive.'}
            >
              <input
                value={issuedNumber ?? PROVISIONAL_NUMBER}
                readOnly
                className={`${inputCls} bg-slate-50 ${issuedNumber ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}
                style={inputStyle}
              />
            </Field>
          </Section>

          {problems.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Still needed: {problems.join(', ')}.</span>
            </div>
          )}

          {issueError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700 leading-[1.55]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{issueError}</span>
            </div>
          )}

          {/* Issuing consumes a number from the series, so it is a deliberate
              act rather than a side effect of opening the print dialog. */}
          {!issuedNumber ? (
            <button
              type="button"
              onClick={issue}
              disabled={problems.length > 0 || issuing}
              className="w-full inline-flex items-center justify-center gap-2 min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:bg-slate-300"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Issue invoice
            </button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-800 leading-[1.55]">
                Issued as <span className="font-bold">{issuedNumber}</span> and saved to history.
              </div>
              <button
                type="button"
                onClick={print}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <Printer className="w-4 h-4" />
                Download PDF / Print
              </button>
              <button
                type="button"
                onClick={startAnother}
                className="w-full min-h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold"
              >
                Start another invoice
              </button>
              <p className="text-[11.5px] text-slate-400 leading-[1.55]">
                Choose <span className="font-semibold">Save as PDF</span> as the destination.
                The file is named{' '}
                <code className="text-[11px] bg-slate-100 px-1 rounded">{fileNameFor(data)}</code>.
              </p>
            </div>
          )}
        </div>

        {/* ── The document ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-3 sm:p-5 overflow-x-auto">
          <div className="bg-white shadow-lg mx-auto p-8 sm:p-10" style={{ maxWidth: '210mm', minHeight: '260mm' }}>
            <InvoiceDocument data={data} />
          </div>
        </div>
      </div>

      {/* The form must not print — only the document does. */}
      <style>{`@media print { .invoice-form, .dashboard-chrome { display: none !important; } }`}</style>
    </div>
  );
}

const inputCls =
  'w-full min-h-[42px] rounded-lg border border-slate-300 px-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';
const inputStyle = { fontSize: '16px' } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card card--compact space-y-3">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1 leading-[1.5]">{hint}</p>}
    </div>
  );
}
