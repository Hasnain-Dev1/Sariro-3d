'use client';

import { createClient } from '@/lib/supabase/client';
import { calculateInvoice } from './calculate';
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

  payment_status: 'Paid' | 'Pending';
  payment_reference: string | null;
  invoice_date: string;
  created_at: string;
}

/**
 * Issue an invoice: take the next serial and write the row in one statement.
 *
 * The number is decided by the database, not here — that is what makes the
 * series unbroken when two people click at the same moment. Whatever the form
 * was showing as a provisional number is replaced by the real one.
 */
export async function issueInvoice(
  data: Omit<InvoiceData, 'invoiceNumber' | 'invoiceDate'> & { invoiceDateISO: string }
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

  const { data: row, error } = await supabase.rpc('issue_invoice', {
    p_invoice: {
      customer_name: data.customerName,
      customer_address: data.customerAddress,
      customer_country: data.customerCountry,
      customer_state_code: data.customerStateCode,
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
      payment_status: data.paymentStatus,
      payment_reference: data.paymentReference,
      invoice_date: data.invoiceDateISO,
    },
  });

  if (error) {
    const missing = /does not exist|schema cache/i.test(error.message);
    return {
      error: missing
        ? 'Invoices are not set up yet — run scripts/invoices.sql in Supabase.'
        : error.message,
    };
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
    customerEmail: r.customer_email ?? '',
    customerPhone: r.customer_phone ?? '',
    courseName: r.course_name,
    courseDescription: r.course_description ?? '',
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
