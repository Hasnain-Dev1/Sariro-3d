'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * SARIRO — invoices that were issued and never reached the books
 * =========================================================
 * A sale can only be recorded from an invoice, which is what makes the ledger
 * trustworthy. The gap it leaves is the other direction: an invoice can be
 * issued and then nobody logs the sale, and nothing anywhere says so.
 *
 * The customer has been billed. The money may well have arrived. The books do
 * not know about any of it, and the only way anyone would find out is by
 * comparing two screens by hand.
 *
 * ── Why a day ───────────────────────────────────────────────────────────────
 * HR generates the invoice and a seller records the sale, sometimes minutes
 * later and sometimes the next morning. Flagging immediately would cry wolf at
 * every normal handover. A day is long enough that the handover has certainly
 * happened and short enough that the person who did it still remembers.
 *
 * So there are three states, not two: recorded, waiting (issued today, nothing
 * wrong), and overdue. Only the third asks anybody to do something.
 */

export interface IssuedInvoice {
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  course_name: string;
  total: number;
  currency_symbol: string;
  invoice_date: string;
  created_at: string;
  payment_status: string;
}

export interface PendingInvoice extends IssuedInvoice {
  /** Whole hours since it was issued. */
  ageHours: number;
  /** Past the grace period, so it needs somebody. */
  overdue: boolean;
}

export interface Reconciliation {
  issued: number;
  recorded: number;
  /** Issued within the grace period. Not a problem yet. */
  waiting: number;
  /** Issued longer ago than that and still not in the ledger. */
  overdue: number;
  /** Everything not yet recorded, oldest first. Overdue ones come first. */
  pending: PendingInvoice[];
}

/** An invoice is expected in the ledger within a day of being issued. */
export const GRACE_HOURS = 24;

/**
 * Compare what was billed against what was booked.
 *
 * Pure, so the arithmetic behind a number that says "three invoices are
 * missing from the books" can be checked without a database.
 */
export function reconcileInvoices(
  invoices: IssuedInvoice[],
  recordedNumbers: Iterable<string>,
  now: number = Date.now(),
  graceHours: number = GRACE_HOURS
): Reconciliation {
  const recorded = new Set(recordedNumbers);

  const pending: PendingInvoice[] = [];
  let recordedCount = 0;

  for (const inv of invoices) {
    if (recorded.has(inv.invoice_number)) {
      recordedCount++;
      continue;
    }
    const issuedAt = Date.parse(inv.created_at);
    // An unparseable timestamp must not silently become "issued in 1970" and
    // scream overdue, nor "issued now" and hide. Treated as just issued, and
    // it will age into the list on its own if the row is real.
    const ageHours = Number.isFinite(issuedAt)
      ? Math.max(0, Math.floor((now - issuedAt) / 3_600_000))
      : 0;
    pending.push({ ...inv, ageHours, overdue: ageHours >= graceHours });
  }

  // Oldest first, and overdue above waiting — the list is a work queue, so the
  // thing that has been ignored longest is the thing at the top.
  pending.sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.ageHours - a.ageHours);

  return {
    issued: invoices.length,
    recorded: recordedCount,
    waiting: pending.filter((p) => !p.overdue).length,
    overdue: pending.filter((p) => p.overdue).length,
    pending,
  };
}

/**
 * Both sides of the comparison, from the database.
 *
 * Two plain reads and a diff in memory rather than a join: the tables are small,
 * RLS already restricts both to HR and above, and doing it here means the rule
 * for what counts as overdue lives in one tested function instead of in SQL
 * that nobody can run locally.
 */
export async function fetchReconciliation(limit = 1000): Promise<Reconciliation> {
  const supabase = createClient();

  const [invoicesRes, salesRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('invoice_number, customer_name, customer_email, course_name, total, currency_symbol, invoice_date, created_at, payment_status')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('sales').select('invoice_number').limit(limit),
  ]);

  if (invoicesRes.error) throw new Error(humanise(invoicesRes.error.message));
  if (salesRes.error) throw new Error(humanise(salesRes.error.message));

  return reconcileInvoices(
    (invoicesRes.data ?? []) as IssuedInvoice[],
    ((salesRes.data ?? []) as { invoice_number: string }[]).map((s) => s.invoice_number)
  );
}

function humanise(message: string): string {
  if (/does not exist|schema cache/i.test(message)) {
    return 'Invoices or the sales ledger are not set up yet — run scripts/invoices.sql and scripts/sales-ledger.sql.';
  }
  return message;
}
