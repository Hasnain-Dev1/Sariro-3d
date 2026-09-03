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

  return {
    expenses,
    approvedTotal: sum(approved),
    pendingTotal: sum(pending),
    pendingCount: pending.length,
    thisMonthTotal: sum(thisMonth),
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
}

export async function createExpense(
  draft: ExpenseDraft
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not signed in' };

  if (!draft.title.trim()) return { success: false, error: 'Give the expense a title' };
  if (!Number.isFinite(draft.amount) || draft.amount < 0) {
    return { success: false, error: 'Enter an amount' };
  }

  const { error } = await supabase.from('expenses').insert({
    title: draft.title.trim().slice(0, 200),
    amount: draft.amount,
    spent_on: draft.spentOn || new Date().toISOString().slice(0, 10),
    category: draft.category?.trim() || null,
    description: draft.description?.trim() || null,
    reason: draft.reason?.trim() || null,
    vendor: draft.vendor?.trim() || null,
    payment_method: draft.paymentMethod?.trim() || null,
    document_url: draft.documentUrl?.trim() || null,
    notes: draft.notes?.trim() || null,
    created_by: user.id,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
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
