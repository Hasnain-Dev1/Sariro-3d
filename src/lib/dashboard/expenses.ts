'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — company expenses
 * =========================================================
 * V2 §53-54. One module for both sides: HR records and approves, Super Admin
 * reads the totals. Sharing it is what stops the two disagreeing about what
 * "this month" or "approved" means.
 *
 * ── Amounts are rupees ──────────────────────────────────────────────────────
 * Same as teacher pay, penalties, incentives and settlements. Student fees are
 * dollars and live elsewhere; nothing here may be added to one of those without
 * converting first. See lib/pricing/currency.ts for what happens when the two
 * are confused — a customer was once charged INR 199 for a $199 course.
 */

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  spent_on: string;
  category: string | null;
  description: string | null;
  reason: string | null;
  vendor: string | null;
  payment_method: string | null;
  document_url: string | null;
  notes: string | null;
  /** GST inside the bill, ₹. Absent until scripts/expense-gst.sql has run. */
  gst_amount?: number | null;
  gst_rate?: number | null;
  vendor_gstin?: string | null;
  bill_number?: string | null;
  /** False for a blocked credit — recorded, never claimed. */
  itc_claimable?: boolean | null;
  status: ExpenseStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface ExpenseSummary {
  expenses: Expense[];
  /** Approved only — pending money has not been spent as far as the books go. */
  approvedTotal: number;
  pendingTotal: number;
  pendingCount: number;
  /** Approved spend for the current calendar month. */
  thisMonthTotal: number;
  /** Approved spend by category, largest first. */
  byCategory: { category: string; total: number }[];
  /** GST on approved, claimable bills this calendar month — the input tax credit. */
  inputGstThisMonth: number;
}

/** ₹, grouped Indian-style — 1,20,000 rather than 120,000. */
export function formatRupees(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export async function fetchExpenses(limit = 200): Promise<ExpenseSummary> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('spent_on', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const expenses = (data ?? []) as Expense[];

  const approved = expenses.filter((e) => e.status === 'approved');
  const pending = expenses.filter((e) => e.status === 'pending');

  const monthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = approved.filter((e) => (e.spent_on ?? '').startsWith(monthKey));

  const cat = new Map<string, number>();
  for (const e of approved) {
    const k = e.category?.trim() || 'Uncategorised';
    cat.set(k, (cat.get(k) ?? 0) + Number(e.amount));
  }

  const sum = (rows: Expense[]) => rows.reduce((t, e) => t + Number(e.amount), 0);
  const inputGstThisMonth = thisMonth
    .filter((e) => e.itc_claimable !== false)
    .reduce((t, e) => t + Number(e.gst_amount ?? 0), 0);

  return {
    expenses,
    approvedTotal: sum(approved),
    pendingTotal: sum(pending),
    pendingCount: pending.length,
    thisMonthTotal: sum(thisMonth),
    inputGstThisMonth: Math.round(inputGstThisMonth * 100) / 100,
    byCategory: [...cat.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
  };
}

export interface ExpenseDraft {
  title: string;
  amount: number;
  spentOn?: string;
  category?: string;
  description?: string;
  reason?: string;
  vendor?: string;
  paymentMethod?: string;
  documentUrl?: string;
  notes?: string;
  /** GST inside `amount`, ₹. */
  gstAmount?: number;
  gstRate?: number | null;
  vendorGstin?: string;
  billNumber?: string;
  itcClaimable?: boolean;
}

export async function createExpense(
  draft: ExpenseDraft
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not signed in' };

  if (!draft.title.trim()) return { success: false, error: 'Give the expense a title' };
  if (!Number.isFinite(draft.amount) || draft.amount < 0) {
    return { success: false, error: 'Enter an amount' };
  }

  const bill = draft.documentUrl?.trim() || '';
  if (bill && !isSafeBillLink(bill)) {
    return {
      success: false,
      error: 'The bill link must be a full https:// address — paste the Google Drive share link.',
    };
  }

  const gst = Number(draft.gstAmount ?? 0);
  if (!Number.isFinite(gst) || gst < 0 || gst > draft.amount) {
    return { success: false, error: 'The GST on a bill cannot be more than the bill itself.' };
  }

  const base = {
    title: draft.title.trim().slice(0, 200),
    amount: draft.amount,
    spent_on: draft.spentOn || new Date().toISOString().slice(0, 10),
    category: draft.category?.trim() || null,
    description: draft.description?.trim() || null,
    reason: draft.reason?.trim() || null,
    vendor: draft.vendor?.trim() || null,
    payment_method: draft.paymentMethod?.trim() || null,
    document_url: bill || null,
    notes: draft.notes?.trim() || null,
    created_by: user.id,
  };
  const gstFields = {
    gst_amount: Math.round(gst * 100) / 100,
    gst_rate: draft.gstRate ?? null,
    vendor_gstin: draft.vendorGstin?.trim().toUpperCase() || null,
    bill_number: draft.billNumber?.trim() || null,
    itc_claimable: draft.itcClaimable ?? true,
  };

  const { error } = await supabase.from('expenses').insert({ ...base, ...gstFields });
  if (!error) return { success: true };

  /* Before scripts/expense-gst.sql has run the GST columns do not exist. The
     expense itself still matters more than its GST, so it is saved without
     them — and the person is told, rather than left believing the GST is in. */
  if (/gst_amount|gst_rate|vendor_gstin|bill_number|itc_claimable|schema cache/i.test(error.message)) {
    const retry = await supabase.from('expenses').insert(base);
    if (retry.error) return { success: false, error: retry.error.message };
    return {
      success: true,
      warning: gst > 0 ? 'The expense is saved, but its GST was not — run scripts/expense-gst.sql in Supabase so GST can be recorded.' : undefined,
    };
  }
  return { success: false, error: error.message };
}

/**
 * Approve or reject. The trigger stamps who and when — doing it here as well
 * would let the two disagree if this call is ever made from somewhere else.
 */
export async function setExpenseStatus(
  id: string,
  status: Exclude<ExpenseStatus, 'pending'>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/* ══════════════════════════════════════════════════════════════════════════
   The bill itself
   ══════════════════════════════════════════════════════════════════════════
   Sariro does not host the scans — a Drive link costs nothing to store and the
   accountant already has access to the folder. What matters is that the link
   is a link: `document_url` is rendered as an anchor, so a javascript: or
   data: value pasted into that box would be a click away from running in
   somebody's session. Only http(s) is accepted, and it is checked here rather
   than in the input so a value arriving from anywhere else is checked too.
   ══════════════════════════════════════════════════════════════════════════ */

export function isSafeBillLink(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    // Not a URL at all — a bare "drive.google.com/..." included, because an
    // anchor without a scheme resolves against our own domain and 404s.
    return false;
  }
}

/**
 * Everything the accountant needs, in one file.
 *
 * The bill link is a column rather than an attachment: at filing time the
 * spreadsheet is opened, the links are clicked, and the documents come down in
 * the order the rows are in. That is the whole reason the link is captured at
 * the moment the expense is recorded rather than hunted for in March.
 */
export function expensesToCsv(rows: Expense[]): string {
  const headers = [
    'Date', 'Title', 'Category', 'Paid to', 'Vendor GSTIN', 'Bill no.', 'Amount (INR)', 'GST (INR)', 'GST rate',
    'Input credit', 'Status', 'Payment method', 'Why', 'Bill link', 'Notes',
  ];

  const cell = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.spent_on, r.title, r.category ?? '', r.vendor ?? '', r.vendor_gstin ?? '', r.bill_number ?? '',
      Number(r.amount).toFixed(2), Number(r.gst_amount ?? 0).toFixed(2), r.gst_rate != null ? `${r.gst_rate}%` : '',
      Number(r.gst_amount ?? 0) > 0 ? (r.itc_claimable === false ? 'Not claimable' : 'Claimable') : '', r.status,
      r.payment_method ?? '', r.reason ?? r.description ?? '',
      r.document_url ?? '', r.notes ?? '',
    ].map(cell).join(','));
  }
  return lines.join('\r\n');
}
