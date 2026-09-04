'use client';

import { createClient } from '@/lib/supabase/client';
import { calculateInvoice } from './calculate';
import { gatewayFee, type PaymentType, type FeeMode } from './calculate';
import type { InvoiceData } from '@/components/dashboard/invoice-document';

/**
 * SARIRO — issued invoices, read and written
 * =========================================================
 * Text only. No PDF is ever stored: the document is a deterministic view of
 * these fields, so it is redrawn on demand rather than kept. A record is under
 * a kilobyte; the PDF it produces is a hundred times that and carries no
 * information the record does not.
 */

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  financial_year: number;
  serial: number;

  customer_name: string;
  customer_address: string | null;
  customer_country: string;
  customer_state_code: string | null;
  customer_state: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  course_name: string;
  course_description: string | null;

  price: number;
  currency_code: string;
  currency_symbol: string;
  include_gst: boolean;
  taxable: number;
  total_tax: number;
  total: number;
  tax_treatment: string;

  /** 'full' — one payment. 'installment' — one of several. */
  payment_type: PaymentType;
  /** What the whole course costs. Null on a full payment. */
  course_total: number | null;
  /** Received before this invoice. Zero on a full payment. */
  previously_paid: number;
  /** UTR / Razorpay id / cheque number. Unique across every invoice. */
  transaction_id: string | null;
  /** 'new' | 'renewal' — internal, never printed. */
  sale_type: SaleType;

  /** The gateway's effective rate on this payment. */
  gateway_fee_percent: number;
  /** What the gateway kept. A cost Sariro bears, never a charge to the customer. */
  gateway_fee: number;
  /** total − gateway_fee. What reconciles against the bank. */
  net_received: number | null;

  payment_status: 'Paid' | 'Pending';
  payment_reference: string | null;
  invoice_date: string;
  created_at: string;
}

export type SaleType = 'new' | 'renewal';

/**
 * Issue an invoice: take the next serial and write the row in one statement.
 *
 * The number is decided by the database, not here — that is what makes the
 * series unbroken when two people click at the same moment. Whatever the form
 * was showing as a provisional number is replaced by the real one.
 */
export interface IssueOptions {
  saleType: SaleType;
  /**
   * The gateway's cut, entered as a rate or as the exact figure off the
   * settlement report. Kept out of InvoiceData deliberately: it is a cost
   * Sariro bears, so it has no business on the document the customer receives.
   */
  fee: { mode: FeeMode; value: number };
}

export async function issueInvoice(
  data: Omit<InvoiceData, 'invoiceNumber' | 'invoiceDate'> & { invoiceDateISO: string },
  options: IssueOptions = { saleType: 'new', fee: { mode: 'percent', value: 0 } }
): Promise<{ record?: InvoiceRecord; error?: string }> {
  const supabase = createClient();

  // Computed here and stored, so the invoice keeps the figures it was issued
  // with even if the GST rate changes later.
  const totals = calculateInvoice({
    price: data.price,
    country: data.customerCountry,
    includeGst: data.includeGst,
    customerStateCode: data.customerStateCode,
  });

  const fee = gatewayFee({
    total: totals.total,
    mode: options.fee.mode,
    value: options.fee.value,
  });

  const { data: row, error } = await supabase.rpc('issue_invoice', {
    p_invoice: {
      customer_name: data.customerName,
      customer_address: data.customerAddress,
      customer_country: data.customerCountry,
      customer_state_code: data.customerStateCode,
      customer_state: data.customerState ?? null,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone,
      course_name: data.courseName,
      course_description: data.courseDescription,
      price: data.price,
      currency_code: data.currencyCode,
      currency_symbol: data.currencySymbol,
      include_gst: data.includeGst,
      taxable: totals.taxable,
      total_tax: totals.totalTax,
      total: totals.total,
      tax_treatment: totals.treatment,
      // The taxable base is the amount received on THIS invoice, so these
      // three ride alongside it as context rather than feeding the tax.
      payment_type: data.paymentType,
      course_total: data.paymentType === 'installment' ? data.courseTotal : null,
      previously_paid: data.paymentType === 'installment' ? data.previouslyPaid : 0,
      transaction_id: data.transactionId || null,
      sale_type: options.saleType,
      // Computed against the total, not the price — for an installment those
      // are the same number, but reading it off the totals is what keeps it
      // true if that ever stops being so.
      gateway_fee_percent: fee.percent,
      gateway_fee: fee.fee,
      payment_status: data.paymentStatus,
      payment_reference: data.paymentReference,
      invoice_date: data.invoiceDateISO,
    },
  });

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return { error: 'Invoices are not up to date — run scripts/invoice-v2.sql in Supabase.' };
    }
    // The one error a person can act on, so it is passed through as written:
    // issue_invoice() names the invoice the transaction id is already on.
    return { error: error.message };
  }
  return { record: row as InvoiceRecord };
}

export async function fetchInvoices(limit = 300): Promise<InvoiceRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(
    /does not exist|schema cache/i.test(error.message)
      ? 'Invoices are not set up yet — run scripts/invoices.sql in Supabase.'
      : error.message
  );
  return (data ?? []) as InvoiceRecord[];
}

/**
 * The one field that legitimately changes after issue.
 *
 * Everything else is frozen — a wrong invoice is corrected with a credit note,
 * not by editing the original, because the customer already has the original.
 */
export async function setInvoicePaymentStatus(
  id: string,
  status: 'Paid' | 'Pending'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('invoices').update({ payment_status: status }).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Turn a stored record back into the document's own shape. */
export function recordToInvoiceData(r: InvoiceRecord): InvoiceData {
  const d = new Date(`${r.invoice_date}T00:00:00`);
  return {
    invoiceNumber: r.invoice_number,
    invoiceDate: Number.isNaN(d.getTime())
      ? r.invoice_date
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    customerName: r.customer_name,
    customerAddress: r.customer_address ?? '',
    customerCountry: r.customer_country,
    customerStateCode: r.customer_state_code ?? '',
    customerState: r.customer_state ?? '',
    customerEmail: r.customer_email ?? '',
    customerPhone: r.customer_phone ?? '',
    courseName: r.course_name,
    courseDescription: r.course_description ?? '',
    // Older rows predate installments; 'full' with a zero already-paid is
    // exactly what they were, so they redraw unchanged.
    paymentType: r.payment_type ?? 'full',
    courseTotal: Number(r.course_total ?? 0),
    previouslyPaid: Number(r.previously_paid ?? 0),
    transactionId: r.transaction_id ?? '',
    price: Number(r.price),
    currencyCode: r.currency_code,
    currencySymbol: r.currency_symbol,
    includeGst: r.include_gst,
    paymentStatus: r.payment_status,
    paymentReference: r.payment_reference ?? '',
  };
}

/** customer_course_date — the filename the PDF is saved under. */
export function invoiceFileName(r: InvoiceRecord): string {
  const clean = (s: string) =>
    s.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'invoice';
  return `${clean(r.customer_name)}_${clean(r.course_name)}_${r.invoice_date}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   "A parent sent me this — is it ours?"
   ══════════════════════════════════════════════════════════════════════════ */

export interface NumberCheck {
  /** The check code matches, so the number was minted by us. */
  wellFormed: boolean;
  /** A row with that number exists. */
  issued: boolean;
  customerName: string | null;
  courseName: string | null;
  total: number | null;
  currencySymbol: string | null;
  invoiceDate: string | null;
}

/**
 * Two separate answers, because they mean different things.
 *
 * `wellFormed` false is a forgery: the last four characters of a real invoice
 * number are an HMAC of the year and serial under a key only the database
 * holds, so a number somebody invented cannot carry the right ones.
 * `wellFormed` true with `issued` false should be impossible and is worth
 * looking at rather than dismissing.
 */
export async function checkInvoiceNumber(numberText: string): Promise<NumberCheck | null> {
  const trimmed = numberText.trim();
  if (!trimmed) return null;
  const supabase = createClient();
  const { data, error } = await supabase.rpc('verify_invoice_number', { p_number: trimmed });
  if (error) return null;
  const row = ((data ?? []) as {
    well_formed: boolean; issued: boolean; customer_name: string | null;
    course_name: string | null; total: number | null;
    currency_symbol: string | null; invoice_date: string | null;
  }[])[0];
  if (!row) return null;
  return {
    wellFormed: !!row.well_formed,
    issued: !!row.issued,
    customerName: row.customer_name,
    courseName: row.course_name,
    total: row.total == null ? null : Number(row.total),
    currencySymbol: row.currency_symbol,
    invoiceDate: row.invoice_date,
  };
}

/** What actually landed, per invoice. Falls back for rows issued before fees were recorded. */
export const netReceivedOf = (r: InvoiceRecord): number =>
  Number(r.net_received ?? Number(r.total) - Number(r.gateway_fee ?? 0));
