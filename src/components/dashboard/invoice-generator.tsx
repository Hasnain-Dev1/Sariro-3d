'use client';

import { useMemo, useState } from 'react';
import { Printer, AlertCircle, Info } from 'lucide-react';
import InvoiceDocument, { type InvoiceData } from '@/components/dashboard/invoice-document';
import { CURRENCIES, COUNTRIES, INDIAN_STATES } from '@/lib/invoice/company';
import { gstAvailable } from '@/lib/invoice/calculate';

/**
 * SARIRO — Generate Invoice
 * =========================================================
 * Details on the left, the finished document on the right, updating as it is
 * typed. What is previewed is what prints — one component renders both.
 *
 * ── Nothing is stored ───────────────────────────────────────────────────────
 * By decision: the invoice is generated, printed and gone. That keeps this
 * feature free of a table, a migration and a retention question.
 *
 * It has one consequence worth stating plainly, because it is a legal one
 * rather than a technical one. GST rules require invoice numbers to be a
 * consecutive series, unique within a financial year, and require the issuer to
 * keep the records. With nothing stored, a number cannot be proven sequential —
 * two people generating at the same moment would otherwise produce the same
 * one. So the number here is unique by construction (date and time to the
 * second) rather than sequential.
 *
 * That is the honest trade and it is written on the screen, not buried. When
 * the accountant asks for a serial series, the fix is a one-row counter table.
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
 * A number that cannot collide without a database behind it.
 *
 * SARIRO-INV-2026-0904-1432 — year, then the date and time it was raised. Two
 * invoices in the same second are the only collision, and one person cannot
 * type two sets of details that fast.
 */
function generateInvoiceNumber(): string {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `SARIRO-INV-${now.getFullYear()}-${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

/** customer_course_date — safe on every filesystem. */
function fileNameFor(data: InvoiceData): string {
  const clean = (s: string) =>
    s.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'invoice';
  return `${clean(data.customerName)}_${clean(data.courseName)}_${data.invoiceDate}`;
}

export default function InvoiceGenerator() {
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber);
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
    invoiceNumber,
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
    invoiceNumber, invoiceDate, customerName, customerAddress, customerCountry,
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
            <Field label="Invoice number" hint="Generated. Regenerate for a fresh one.">
              <div className="flex gap-2">
                <input value={invoiceNumber} readOnly
                  className={`${inputCls} bg-slate-50 text-slate-600`} style={inputStyle} />
                <button type="button" onClick={() => setInvoiceNumber(generateInvoiceNumber())}
                  className="px-3 min-h-[42px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12.5px] font-bold shrink-0">
                  New
                </button>
              </div>
            </Field>
          </Section>

          {problems.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Still needed: {problems.join(', ')}.</span>
            </div>
          )}

          <button
            type="button"
            onClick={print}
            disabled={problems.length > 0}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:bg-slate-300"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Printer className="w-4 h-4" />
            Download PDF / Print
          </button>

          <p className="text-[11.5px] text-slate-400 leading-[1.55]">
            Choose <span className="font-semibold">Save as PDF</span> as the destination.
            The file is named{' '}
            <code className="text-[11px] bg-slate-100 px-1 rounded">{fileNameFor(data)}</code>.
          </p>
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
