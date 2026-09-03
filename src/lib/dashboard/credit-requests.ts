'use client';

/**
 * SARIRO — credit requests, client side
 * =========================================================
 * V2 §50-52. Raising a request does not change anybody's balance; only HR's
 * approval does, and it happens inside one database function so the balance and
 * its transaction can never disagree (§79).
 *
 * Everything here goes through POST /api/credits/requests.
 */

export type CreditRequestStatus = 'requested' | 'approved' | 'rejected';

export interface CreditRequest {
  id: string;
  student_id: string;
  student_name: string | null;
  requested_amount: number;
  /** The balance at the moment it was raised — what the decision was judged against. */
  balance_at_request: number | null;
  reason: string | null;
  enrollment_id: string | null;
  cohort_id: string | null;
  requested_by: string | null;
  requested_by_name: string | null;
  created_at: string;
  status: CreditRequestStatus;
  approved_amount: number | null;
  decided_by_name: string | null;
  decided_at: string | null;
  hr_notes: string | null;
}

type Ok<T> = T & { ok: true };
interface Fail { ok: false; error: string; message?: string }

async function call<T>(payload: Record<string, unknown>): Promise<Ok<T> | Fail> {
  try {
    const res = await fetch('/api/credits/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!json) return { ok: false, error: 'server_error' };
    return json as Ok<T> | Fail;
  } catch {
    return { ok: false, error: 'network_error' };
  }
}

export function explainCreditError(error: string, message?: string): string {
  switch (error) {
    case 'migration_missing':
      return 'Credit approvals are not set up yet — run scripts/credit-requests.sql in Supabase.';
    case 'forbidden':
      return 'You do not have permission to do that.';
    case 'bad_amount':
      return 'Enter a number of credits greater than zero.';
    case 'network_error':
      return 'No connection. Nothing was saved.';
    default:
      // The database raises readable messages for the races that matter —
      // "credit request … is already approved" is worth showing verbatim.
      return message ?? 'Something went wrong.';
  }
}

export interface CreditRequestDraft {
  studentId: string;
  amount: number;
  reason?: string;
  enrollmentId?: string;
  cohortId?: string;
}

export async function createCreditRequest(
  draft: CreditRequestDraft
): Promise<{ success: boolean; error?: string }> {
  const res = await call<{ id: string }>({
    action: 'create',
    studentId: draft.studentId,
    amount: draft.amount,
    reason: draft.reason,
    enrollmentId: draft.enrollmentId,
    cohortId: draft.cohortId,
  });
  if (!res.ok) return { success: false, error: explainCreditError(res.error, res.message) };
  return { success: true };
}

export interface CreditRequestList {
  requests: CreditRequest[];
  /** Only HR and super-admin decide. Everyone else is read-only here. */
  canDecide: boolean;
  role: string;
}

export async function fetchCreditRequests(scope: 'pending' | 'all' = 'pending'): Promise<CreditRequestList> {
  const res = await call<CreditRequestList>({ action: 'list', scope });
  if (!res.ok) throw new Error(explainCreditError(res.error, res.message));
  return { requests: res.requests, canDecide: res.canDecide, role: res.role };
}

/**
 * Approve or reject.
 *
 * `approvedAmount` is optional on approve — leaving it out approves exactly
 * what was asked for. HR changing it is a normal outcome, not an edge case.
 */
export async function decideCreditRequest(
  requestId: string,
  decision: 'approve' | 'reject',
  opts: { approvedAmount?: number; notes?: string } = {}
): Promise<{ success: boolean; balance?: number | null; error?: string }> {
  const res = await call<{ balance: number | null }>({
    action: 'decide',
    requestId,
    decision,
    approvedAmount: opts.approvedAmount,
    notes: opts.notes,
  });
  if (!res.ok) return { success: false, error: explainCreditError(res.error, res.message) };
  return { success: true, balance: res.balance };
}

/** Credits are whole classes; showing "4.00 credits" reads like money. */
export function formatCredits(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  const shown = Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '');
  return `${shown} credit${v === 1 ? '' : 's'}`;
}

/** §26, §63 — below this a student is one or two classes from stopping. */
export const LOW_CREDIT_THRESHOLD = 4;

export const isLowCredit = (balance: number | null | undefined) =>
  Number(balance ?? 0) < LOW_CREDIT_THRESHOLD;
