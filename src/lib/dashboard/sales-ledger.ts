'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — the sales ledger
 * =========================================================
 * A sale is recorded by giving it an invoice number. Everything else —
 * student, course, amount, currency, country, GST treatment — is taken from the
 * invoice we already generated. Nobody retypes a figure, so nobody can mistype
 * one, and the books cannot disagree with the document the customer holds.
 *
 * ── Why the invoice number is the key ───────────────────────────────────────
 * Sellers, HR and super-admins can all record a sale, and the same sale will
 * sometimes be pushed twice by two people who each think it is theirs to log.
 * The invoice number is the primary key, so the second attempt is refused by
 * the database rather than by a check somebody might forget to write.
 *
 * ── A refund is a state, not a second row ───────────────────────────────────
 * A negative row reads well in a list and badly everywhere else: the sale then
 * appears twice, counting sales needs a filter to be right, and nothing stops a
 * refund existing without a sale. The refund lives on the row it reverses, so
 * net is amount − refund and cannot be computed wrongly.
 */

export interface SaleRow {
  invoice_number: string;
  invoice_id: string | null;
  student_name: string;
  student_email: string | null;
  course_name: string;
  country: string | null;
  state: string | null;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  /** §GST column — opted in or out, so the books filter on it. */
  gst_included: boolean;
  /** 'full' | 'installment' — what `amount` is a part of. */
  payment_type: string | null;
  /** 'new' | 'renewal' — a renewal skips the trial, so it is not new business. */
  sale_type: string | null;
  /** The UTR / Razorpay id the invoice carried. */
  transaction_id: string | null;
  /** The whole course fee, when this was an installment. */
  course_total: number | null;
  /** What the payment gateway kept before the money reached the bank. */
  gateway_fee: number;
  /** amount - gateway_fee. What reconciles against the bank statement. */
  net_received: number | null;
  taxable: number | null;
  total_tax: number | null;
  sold_on: string;
  seller_id: string | null;
  recorded_by: string | null;
  notes: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
  created_at: string;
}

export interface SaleWithNames extends SaleRow {
  seller_name: string | null;
  recorded_by_name: string | null;
}

function humanise(message: string): string {
  if (/already in the sales ledger/i.test(message)) {
    return 'That invoice is already recorded. Every sale is logged once — this one is already in the books.';
  }
  if (/No invoice numbered/i.test(message)) {
    return 'No invoice with that number. HR must generate the invoice first — a sale cannot be recorded without one.';
  }
  if (/already been refunded/i.test(message)) return 'That sale has already been refunded.';
  if (/not in the sales ledger/i.test(message)) return 'That invoice is not in the ledger, so there is nothing to refund.';
  if (/more than zero and no more/i.test(message)) return 'A refund cannot be more than what was charged.';
  if (/does not exist|schema cache/i.test(message)) {
    return 'The sales ledger is not set up yet — run scripts/sales-ledger.sql in Supabase.';
  }
  return message;
}

/** Record a sale from an invoice number. Everything else comes from the invoice. */
export async function recordSale(
  invoiceNumber: string,
  sellerId?: string | null,
  notes?: string
): Promise<{ sale?: SaleRow; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('record_sale', {
    p_invoice_number: invoiceNumber.trim(),
    p_seller_id: sellerId || null,
    p_notes: notes ?? null,
  });
  if (error) return { error: humanise(error.message) };
  return { sale: data as SaleRow };
}

export async function recordRefund(
  invoiceNumber: string,
  amount?: number,
  reason?: string
): Promise<{ sale?: SaleRow; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('record_refund', {
    p_invoice_number: invoiceNumber.trim(),
    p_amount: amount ?? null,
    p_reason: reason ?? null,
  });
  if (error) return { error: humanise(error.message) };
  return { sale: data as SaleRow };
}

/** The ledger, with the seller's name resolved. */
export async function fetchSales(limit = 1000): Promise<SaleWithNames[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('sold_on', { ascending: false })
    .limit(limit);
  if (error) throw new Error(humanise(error.message));

  const rows = (data ?? []) as SaleRow[];
  const ids = [...new Set(rows.flatMap((r) => [r.seller_id, r.recorded_by]).filter(Boolean) as string[])];
  const { data: people } = ids.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', ids)
    : { data: [] };
  const name = new Map(((people ?? []) as { id: string; full_name: string | null; email: string | null }[])
    .map((p) => [p.id, (p.full_name || p.email || 'Someone').trim()]));

  return rows.map((r) => ({
    ...r,
    seller_name: r.seller_id ? (name.get(r.seller_id) ?? null) : null,
    recorded_by_name: r.recorded_by ? (name.get(r.recorded_by) ?? null) : null,
  }));
}

/** Anyone who could be credited with a sale. */
export async function fetchSellers(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .or('role.eq.seller,role.eq.hr,role.eq.admin,role.eq.super_admin')
    .order('full_name', { ascending: true, nullsFirst: false });
  return ((data ?? []) as { id: string; full_name: string | null; email: string | null }[])
    .map((p) => ({ id: p.id, name: (p.full_name || p.email || 'Someone').trim() }));
}

/**
 * Two decimal places, without the drift of repeated floating-point subtraction.
 *
 * Not decoration: 11521.52 − 11800 evaluates to −278.47999999999956, and these
 * two figures are rendered straight to the screen with toLocaleString(). The
 * CSV hides it behind toFixed(2); the ledger would not.
 */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Net of any refund. The revenue figure — what the customer was charged, less what went back. */
export const netOf = (s: SaleRow) => round2(Number(s.amount) - Number(s.refund_amount ?? 0));

/**
 * What Sariro actually kept.
 *
 * Different from netOf by the gateway's cut, and the difference is not small:
 * 2.36% of everything taken on a card. Revenue and money-in-the-bank are two
 * facts and quoting one for the other is how a company thinks it is 2% more
 * profitable than it is.
 *
 * A refund does not return the gateway fee — the processor keeps its cut on the
 * original capture — so the fee is subtracted first and the refund after.
 */
export const realisedOf = (s: SaleRow) =>
  round2(
    Number(s.net_received ?? Number(s.amount) - Number(s.gateway_fee ?? 0))
    - Number(s.refund_amount ?? 0)
  );

/**
 * The ledger as CSV, for the report a super-admin downloads.
 *
 * Written by hand rather than with a library: a CSV is a small, well-understood
 * format, and the only part that is easy to get wrong is quoting — which is
 * handled below. Excel opens this directly.
 */
export function salesToCsv(rows: SaleWithNames[]): string {
  const headers = [
    'Invoice number', 'Date', 'Student', 'Email', 'Course', 'Country', 'State',
    'Currency', 'Amount', 'GST', 'Taxable', 'Tax', 'Payment', 'Course total',
    'Business', 'Transaction ID', 'Gateway fee', 'Net received',
    'Refunded', 'Refund amount', 'Net', 'Realised', 'Seller', 'Recorded by', 'Notes',
  ];

  // A field containing a comma, a quote or a newline must be quoted, and inner
  // quotes doubled. Without this a student's name with a comma in it silently
  // shifts every column after it.
  const cell = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.invoice_number, r.sold_on, r.student_name, r.student_email ?? '',
      r.course_name, r.country ?? '', r.state ?? '',
      r.currency_code, Number(r.amount).toFixed(2),
      // The column asked for, in words rather than true/false so a spreadsheet
      // filter reads as a person would say it.
      r.gst_included ? 'Opted in' : 'Opted out',
      r.taxable != null ? Number(r.taxable).toFixed(2) : '',
      r.total_tax != null ? Number(r.total_tax).toFixed(2) : '',
      // In words for the same reason as the GST column: a spreadsheet filter
      // should read the way a person would say it.
      r.payment_type === 'installment' ? 'Installment' : 'Full',
      r.course_total != null ? Number(r.course_total).toFixed(2) : '',
      r.sale_type === 'renewal' ? 'Renewal' : 'New',
      r.transaction_id ?? '',
      Number(r.gateway_fee ?? 0).toFixed(2),
      Number(r.net_received ?? Number(r.amount) - Number(r.gateway_fee ?? 0)).toFixed(2),
      r.refunded_at ? r.refunded_at.slice(0, 10) : '',
      r.refund_amount != null ? Number(r.refund_amount).toFixed(2) : '',
      netOf(r).toFixed(2),
      realisedOf(r).toFixed(2),
      r.seller_name ?? '', r.recorded_by_name ?? '', r.notes ?? '',
    ].map(cell).join(','));
  }
  return lines.join('\r\n');
}

/** Hands the browser a file. Nothing leaves the machine. */
export function downloadCsv(filename: string, csv: string): void {
  // The BOM is what makes Excel read UTF-8 rather than mangling ₹ and accented
  // names into rubbish.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface InvoicePreview {
  invoice_number: string;
  customer_name: string;
  course_name: string;
  total: number;
  currency_code: string;
  currency_symbol: string;
  include_gst: boolean;
  invoice_date: string;
  /** 'full' | 'installment' — what `total` is a part of. */
  payment_type: string | null;
  /** The whole course fee, when this is an installment. */
  course_total: number | null;
  /** Received before this invoice. */
  previously_paid: number | null;
  already_recorded: boolean;
}

/**
 * What an invoice number refers to, shown before a sale is confirmed.
 *
 * A seller cannot read the invoices table — it holds addresses and phone
 * numbers. This asks the database the narrow question instead: who, what, how
 * much, and is it already in the books. Returns null when the number is not a
 * real invoice, which is the answer the form needs.
 */
export async function previewInvoice(invoiceNumber: string): Promise<InvoicePreview | null> {
  const trimmed = invoiceNumber.trim();
  if (!trimmed) return null;
  const supabase = createClient();
  const { data, error } = await supabase.rpc('invoice_preview', { p_invoice_number: trimmed });
  if (error) return null;
  const rows = (data ?? []) as InvoicePreview[];
  return rows[0] ?? null;
}
