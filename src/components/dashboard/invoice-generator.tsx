'use client';

import { useMemo, useState } from 'react';
import { Printer, AlertCircle, Info, FileCheck, Loader2 } from 'lucide-react';
import InvoiceDocument, { type InvoiceData } from '@/components/dashboard/invoice-document';
import { CURRENCIES, COUNTRIES, INDIAN_STATES, OTHER_COUNTRY } from '@/lib/invoice/company';
import {
  gstAvailable, paymentSummary, gatewayFee, formatMoney,
  type PaymentType, type FeeMode,
} from '@/lib/invoice/calculate';
import { issueInvoice, type SaleType } from '@/lib/invoice/records';

/**
 * SARIRO — Generate Invoice
 * =========================================================
 * Details on the left, the finished document on the right, updating as it is
 * typed. What is previewed is what prints — one component renders both.
 *
 * ── The number comes from the database, at the moment of issue ──────────────
 * GST rules require a consecutive series, unique within a financial year, in
 * no more than sixteen characters. The preview shows a provisional number so
 * the document does not have a hole in it; pressing Issue calls
 * issue_invoice(), which takes the real serial and writes the row in one locked
 * statement. Two people clicking at the same second get 0007 and 0008, never
 * 0007 twice.
 *
 * The serial carries a four-character check code derived from a key only the
 * database holds — SR2627-0042-K7XQ — so a number somebody invents can be
 * caught without looking it up. See scripts/invoice-v2.sql.
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
const PROVISIONAL_NUMBER = 'SR####-####-••••';

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
  /* The state in words. The code drives the tax treatment; this is what
     the invoice prints, because a tax invoice names the place of supply. */
  const [customerState, setCustomerState] = useState('');
  /* Somewhere not on either list. No list is complete, and the one place a
     missing entry hurts most is the document the customer keeps. */
  const [otherCountry, setOtherCountry] = useState('');
  const [otherState, setOtherState] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [includeGst, setIncludeGst] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [paymentReference, setPaymentReference] = useState('');
  /* A parent pays half now and half later. `price` stays "what is being paid
     on this invoice" — which is the taxable base — and these two are the
     context printed beside it. */
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [courseTotal, setCourseTotal] = useState('');
  const [previouslyPaid, setPreviouslyPaid] = useState('');
  /* The UTR / Razorpay id / cheque number. Unique across every invoice, so the
     same payment cannot be billed twice. */
  const [transactionId, setTransactionId] = useState('');
  /* Internal only — never printed. A renewal skips the trial, and counting it
     as new business makes growth look like whatever churn happens to be. */
  const [saleType, setSaleType] = useState<SaleType>('new');
  /* What Razorpay keeps. A cost Sariro bears, not a charge to the customer —
     so it never reaches InvoiceData and never reaches the printed document.
     Mandatory, because a fee left at a default of zero is a fee nobody
     noticed; zero is a real answer for a bank transfer, but it has to be
     given. */
  const [feeMode, setFeeMode] = useState<FeeMode>('percent');
  const [feeValue, setFeeValue] = useState('');

  /* What actually goes on the invoice: the typed value when Other is
     chosen, otherwise the picked one. Resolved once here so the preview,
     the tax calculation and the stored record cannot disagree. */
  const effectiveCountry =
    customerCountry === OTHER_COUNTRY ? otherCountry.trim() : customerCountry;
  const effectiveState =
    customerStateCode === 'other' ? otherState.trim() : customerState;

  const isIndia = gstAvailable(effectiveCountry);
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  const data: InvoiceData = useMemo(() => ({
    invoiceNumber: issuedNumber ?? PROVISIONAL_NUMBER,
    invoiceDate: formatDate(invoiceDate),
    customerName,
    customerAddress,
    customerCountry: effectiveCountry,
    customerState: effectiveState,
    // A state only means something for an Indian customer.
    // 'other' is a UI sentinel, never a GST state code.
    customerStateCode: isIndia && customerStateCode !== 'other' ? customerStateCode : '',
    customerEmail,
    customerPhone,
    courseName,
    courseDescription,
    paymentType,
    courseTotal: Number(courseTotal) || 0,
    previouslyPaid: Number(previouslyPaid) || 0,
    transactionId: transactionId.trim(),
    price: Number(price) || 0,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    // The calculation ignores this outside India, but keeping the flag honest
    // means the preview and the print can never disagree.
    includeGst: isIndia && includeGst,
    paymentStatus,
    paymentReference,
  }), [
    issuedNumber, invoiceDate, customerName, customerAddress, effectiveCountry,
    effectiveState, customerStateCode, customerEmail, customerPhone, courseName,
    courseDescription, price, currency, includeGst, paymentStatus, paymentReference,
    paymentType, courseTotal, previouslyPaid, transactionId,
    isIndia,
  ]);

  /* Shown under the amount so the person raising it can see the arithmetic
     before the parent does. */
  const schedule = paymentSummary({
    paymentType,
    courseTotal: Number(courseTotal) || 0,
    previouslyPaid: Number(previouslyPaid) || 0,
    amountNow: Number(price) || 0,
  });

  const fee = gatewayFee({
    total: Number(price) || 0,
    mode: feeMode,
    value: Number(feeValue) || 0,
  });
  const asMoney = (n: number) => formatMoney(n, currency.code, currency.symbol);

  const problems = useMemo(() => {
    const list: string[] = [];
    if (!customerName.trim()) list.push('Student name');
    if (!courseName.trim()) list.push('Course name');
    if (!(Number(price) > 0)) list.push('A price above zero');
    if (!effectiveCountry) list.push('Country');
    // An installment with no course total is a receipt, not an installment —
    // there is nothing for "balance due" to be measured against.
    if (paymentType === 'installment' && !(Number(courseTotal) > 0)) {
      list.push('The full course fees');
    }
    // Blank is missing; '0' is an answer. Distinguished on the string rather
    // than the number, because Number('') is 0 and that is the whole trap.
    if (feeValue.trim() === '') list.push('The gateway fee (enter 0 if there was none)');
    return list;
  }, [customerName, courseName, price, effectiveCountry, paymentType, courseTotal, feeValue]);

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
    const res = await issueInvoice(
      { ...data, invoiceDateISO: invoiceDate },
      { saleType, fee: { mode: feeMode, value: Number(feeValue) || 0 } }
    );
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
    setPaymentType('full'); setCourseTotal(''); setPreviouslyPaid('');
    // Cleared deliberately: carrying a transaction id into the next invoice is
    // how the same payment gets billed twice.
    setTransactionId(''); setSaleType('new');
    setFeeMode('percent'); setFeeValue('');
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
            {/* Somewhere not on the list. Typed rather than guessed at, because
                the country is printed on a document the customer keeps. */}
            {customerCountry === OTHER_COUNTRY && (
              <Field label="Which country" required>
                <input value={otherCountry} onChange={(e) => setOtherCountry(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="Type the country" />
              </Field>
            )}
            {isIndia ? (
              <>
                <Field label="State" hint="Decides CGST + SGST versus IGST. Unset is treated as IGST.">
                  <select
                    value={customerStateCode}
                    onChange={(e) => {
                      setCustomerStateCode(e.target.value);
                      const found = INDIAN_STATES.find((s) => s.code === e.target.value);
                      setCustomerState(found ? found.name : '');
                    }}
                    className={inputCls} style={inputStyle}
                  >
                    <option value="">Not specified</option>
                    {INDIAN_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                    <option value="other">Other — type it</option>
                  </select>
                </Field>
                {customerStateCode === 'other' && (
                  <Field label="Which state" hint="Taxed as inter-state (IGST), since the code is unknown.">
                    <input value={otherState} onChange={(e) => setOtherState(e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="Type the state" />
                  </Field>
                )}
              </>
            ) : (
              <Field label="State or region" hint="Optional. Printed on the invoice.">
                <input value={customerState} onChange={(e) => setCustomerState(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="e.g. California, Selangor" />
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
            {/* Full or in parts. Chosen before the amount, because it changes
                what the amount below MEANS. */}
            <Field label="Payment">
              <div className="grid grid-cols-2 gap-2">
                {([['full', 'Full payment'], ['installment', 'Installment']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentType(value)}
                    className={`min-h-[42px] rounded-lg border text-[13px] font-semibold transition-colors ${
                      paymentType === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            {paymentType === 'installment' && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Full course fees" required>
                  <input type="number" min={0} step="0.01" value={courseTotal}
                    onChange={(e) => setCourseTotal(e.target.value)}
                    className={inputCls} style={inputStyle} placeholder="35400" />
                </Field>
                <Field label="Already paid">
                  <input type="number" min={0} step="0.01" value={previouslyPaid}
                    onChange={(e) => setPreviouslyPaid(e.target.value)}
                    className={inputCls} style={inputStyle} placeholder="0" />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-[1fr_110px] gap-2">
              <Field
                label={paymentType === 'installment' ? 'Paying now' : 'Price the customer pays'}
                required
              >
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

            {/* The arithmetic, before the parent sees it. */}
            {paymentType === 'installment' && Number(courseTotal) > 0 && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-[12.5px] text-slate-600 leading-[1.7]">
                <div className="flex justify-between">
                  <span>Paid to date</span>
                  <span className="tabular-nums font-semibold text-slate-900">
                    {currency.symbol}{schedule.paidToDate.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{schedule.overpaid > 0 ? 'Paid in excess' : 'Balance due'}</span>
                  <span className={`tabular-nums font-semibold ${schedule.overpaid > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                    {currency.symbol}{(schedule.overpaid > 0 ? schedule.overpaid : schedule.balance).toFixed(2)}
                  </span>
                </div>
                {schedule.overpaid > 0 && (
                  <p className="text-[11.5px] text-amber-700 mt-1 leading-[1.5]">
                    More than the course costs. Check the figures — an overpayment
                    is corrected with a credit note, not by editing this later.
                  </p>
                )}
                {isIndia && includeGst && (
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-[1.5]">
                    GST is charged on the {currency.symbol}{(Number(price) || 0).toFixed(2)} being paid
                    now — not on the course total.
                  </p>
                )}
              </div>
            )}
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

          {/* ── What the gateway keeps ─────────────────────────────────
              Not on the customer's document, and not part of the tax. The
              customer paid the price above and GST is charged on that; this is
              what Sariro loses on the way to the bank. Netting it off before
              the tax would under-declare output GST on every card payment. */}
          <Section title="Settlement">
            <Field
              label="Gateway fee"
              required
              hint="Razorpay's cut on this payment. It changes with the instrument, so it is asked every time. Enter 0 for a bank transfer or cash."
            >
              <div className="flex gap-2">
                <input
                  type="number" min={0} step="0.001" value={feeValue}
                  onChange={(e) => setFeeValue(e.target.value)}
                  className={inputCls} style={inputStyle}
                  placeholder={feeMode === 'percent' ? '2.36' : '278.48'}
                />
                <div className="flex rounded-lg border border-slate-300 overflow-hidden shrink-0">
                  {([['percent', '%'], ['amount', currency.symbol]] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFeeMode(mode)}
                      className={`w-11 text-[13px] font-bold transition-colors ${
                        feeMode === mode ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </Field>

            {/* The common rates, so nobody has to remember that Razorpay's
                card rate is 2.36% once GST on the fee is counted. */}
            {feeMode === 'percent' && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  ['0', 'Bank / cash'],
                  ['2', 'UPI 2%'],
                  ['2.36', 'Card 2.36%'],
                  ['3.54', 'Intl 3.54%'],
                ].map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFeeValue(value)}
                    className={`px-2.5 py-1 rounded-lg border text-[11.5px] font-semibold transition-colors ${
                      feeValue === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {Number(price) > 0 && feeValue.trim() !== '' && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-[12.5px] leading-[1.7]">
                <div className="flex justify-between text-slate-600">
                  <span>Customer pays</span>
                  <span className="tabular-nums font-semibold text-slate-900">{asMoney(Number(price) || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gateway keeps ({fee.percent}%)</span>
                  <span className="tabular-nums font-semibold text-red-600">− {asMoney(fee.fee)}</span>
                </div>
                <div className="flex justify-between pt-1.5 mt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Lands in the bank</span>
                  <span className="tabular-nums font-extrabold text-slate-900">{asMoney(fee.netReceived)}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-[1.5]">
                  Kept off the customer&rsquo;s invoice — they paid {asMoney(Number(price) || 0)}, and
                  GST is charged on that.
                </p>
              </div>
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
            {/* The proof the money moved. Unique across every invoice ever
                issued, so the same payment cannot be billed twice — the
                database refuses it, which is why nobody has to remember. */}
            <Field
              label="Transaction ID"
              hint="UTR, Razorpay id or cheque number. Can only ever be used on one invoice."
            >
              <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                className={`${inputCls} font-mono`} style={inputStyle} placeholder="pay_XXXXXXXXXXXX" />
            </Field>
            <Field label="Payment reference" hint="Optional — an order number, for example.">
              <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="ORD-2291" />
            </Field>
            {/* Not printed. It is here because HR knows the answer at this
                moment and the ledger should not have to ask again. */}
            <Field label="Business" hint="Internal only — never appears on the invoice.">
              <div className="grid grid-cols-2 gap-2">
                {([['new', 'New sale'], ['renewal', 'Renewal']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSaleType(value)}
                    className={`min-h-[40px] rounded-lg border text-[13px] font-semibold transition-colors ${
                      saleType === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field
              label="Invoice number"
              hint={issuedNumber
                ? `Financial year ${financialYearOf(invoiceDate)}–${String(financialYearOf(invoiceDate) + 1).slice(2)}. The last four characters are a check code — a made-up number fails it.`
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
