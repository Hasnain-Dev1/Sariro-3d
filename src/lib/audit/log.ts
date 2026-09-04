import type { createServiceClient } from '@/lib/supabase/server';

/**
 * SARIRO — writing down who did what
 * =========================================================
 * SERVER ONLY. Takes an already-created service-role client.
 *
 * V2 §9: "Every addition/removal/change should be logged." §76 lists the
 * actions a system-wide audit trail must capture, and student enrolment,
 * removal and teacher reassignment are all on it.
 *
 * ── What was missing ────────────────────────────────────────────────────────
 * admin_audit_logs existed and impersonation wrote to it. Nothing else did.
 * Adding a child to a batch, removing them, changing a batch's teacher and
 * pausing a student all happened with no record of who did it or when.
 *
 * That is not a compliance checkbox. When a parent asks why their child was
 * moved out of a batch — and they do ask — the answer currently has to be
 * reconstructed from memory. With this, it is a row.
 *
 * ── Never breaks the thing it is recording ──────────────────────────────────
 * Every call swallows its own errors. Failing a student's enrolment because an
 * audit insert failed would be strictly worse than the missing line: the child
 * would be shut out of a class their parent paid for, to protect a log.
 */

type Admin = ReturnType<typeof createServiceClient>;

/**
 * The actions worth recording. A closed set rather than free text, so the log
 * can be filtered and counted rather than only read.
 */
export type AuditAction =
  | 'student_enrolled'
  | 'student_removed_from_batch'
  | 'student_added_to_batch'
  | 'student_paused'
  | 'batch_teacher_changed'
  | 'batch_paused'
  | 'credit_adjusted'
  | 'invoice_issued'
  | 'impersonate_user';

export interface AuditEntry {
  adminId: string;
  action: AuditAction;
  /** What kind of thing was acted on — 'user', 'cohort', 'enrollment'. */
  targetType: string;
  targetId: string | null;
  /**
   * Everything needed to understand the entry later without joining to tables
   * whose rows may since have changed. §76 asks for previous and new values;
   * where an action has them, put them here.
   */
  metadata?: Record<string, unknown>;
}

export async function recordAdminAction(admin: Admin, entry: AuditEntry): Promise<void> {
  try {
    await admin.from('admin_audit_logs').insert({
      admin_id: entry.adminId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      metadata: entry.metadata ?? {},
    });
  } catch {
    // Deliberately swallowed. See the note at the top of this file.
  }
}
