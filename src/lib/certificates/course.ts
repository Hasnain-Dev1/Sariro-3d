import type { SupabaseClient } from '@supabase/supabase-js';
import { TRACKS } from '@/lib/sariro-data';
import { subjectLabel } from '@/lib/trial/subjects';
import type { CertificateData } from '@/lib/dashboard/student-data';
import type { ActorRole } from '@/lib/auth/actor';

/**
 * SARIRO — course certificates, issued by a person
 * ============================================================================
 * The certificate page and the dashboard link have existed for a long time,
 * and nobody had ever received one. Both appear only once an enrolment is
 * `completed`, and the only thing that could set that — a route that checks
 * every lesson is ticked — was never called by any screen. Lessons are not
 * always ticked in the app either: a teacher finishes the course in class.
 *
 * So admin and HR issue it. One button on the enrolment: the status becomes
 * `completed`, the student's dashboard shows the certificate at once, and the
 * congratulations popup fires the next time they sign in. It can be undone,
 * because a button pressed on the wrong child should not be permanent.
 *
 * ── What "completed" also changes, said before anybody presses it ───────────
 * Completed enrolments are no longer charged class credits and are not marked
 * absent by a batch no-show — both only touch `active` enrolments. Lessons
 * and the practice room stay open. That is right for a finished course and
 * wrong for one still running, which is why the button asks first.
 */

/** Who may issue, withdraw, or open anybody's certificate. */
export const CERTIFICATE_STAFF: readonly ActorRole[] = ['super_admin', 'admin', 'hr'];

export const isCertificateStaff = (role: ActorRole | null | undefined) =>
  !!role && CERTIFICATE_STAFF.includes(role);

export type CertificateAction = 'issue' | 'withdraw';

export type ActionDecision =
  | { ok: true; from: string; to: 'completed' | 'active' }
  | { ok: false; error: string; message: string };

/**
 * Whether an enrolment in this state can be issued, or withdrawn.
 *
 * Only an active course is issued: a dropped one was abandoned, and quietly
 * turning it into a certificate is how a certificate stops meaning anything.
 * Only a completed one is withdrawn, back to active.
 */
export function decideCertificateAction(status: string | null | undefined, action: CertificateAction): ActionDecision {
  const s = String(status ?? '').trim().toLowerCase();
  if (action === 'issue') {
    if (s === 'active') return { ok: true, from: s, to: 'completed' };
    if (s === 'completed') return { ok: false, error: 'already_issued', message: 'This certificate has already been issued.' };
    if (s === 'dropped') {
      return { ok: false, error: 'dropped', message: 'This course was dropped. Re-activate the enrolment before issuing a certificate.' };
    }
    return { ok: false, error: 'not_active', message: `A ${s || 'unknown'} enrolment cannot be given a certificate.` };
  }
  if (s === 'completed') return { ok: true, from: s, to: 'active' };
  return { ok: false, error: 'not_issued', message: 'There is no certificate on this enrolment to withdraw.' };
}

/** SARIRO-2026-1A2B3C4D. The same enrolment always gets the same number. */
export function courseCertificateNumber(enrollmentId: string, completedAt: string | null | undefined): string {
  const year = completedAt ? new Date(completedAt).getFullYear() : new Date().getFullYear();
  const shortId = (enrollmentId || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  return `SARIRO-${year}-${shortId}`;
}

export const courseCertificateUrl = (enrollmentId: string) => `/certificate/${enrollmentId}`;

type Level = CertificateData['level'];
const normaliseLevel = (level: string | null | undefined): Level => {
  const l = String(level ?? '').toLowerCase();
  return l === 'intermediate' || l === 'advanced' ? l : 'beginner';
};

/* TRACKS only holds the coding tracks, so a Public Speaking certificate printed
   "public-speaking". The whole course catalogue has every name. */
export const trackName = (track: string | null | undefined) =>
  TRACKS.find((t) => t.id === track)?.name || (track ? subjectLabel(track) : '') || 'Course';

export interface EnrolmentRow {
  id: string;
  user_id: string;
  track: string;
  level: string | null;
  cohort_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
}

/** The printable certificate, from the enrolment and the student's name. Pure. */
export function buildCourseCertificate(
  enrolment: EnrolmentRow,
  student: { full_name: string | null; email: string | null } | null
): CertificateData | null {
  if (enrolment.status !== 'completed') return null;
  return {
    enrollment_id: enrolment.id,
    student_name: student?.full_name || 'Sariro Student',
    student_email: student?.email ?? null,
    track_id: enrolment.track,
    track_name: trackName(enrolment.track),
    level: normaliseLevel(enrolment.level),
    cohort_id: enrolment.cohort_id ?? null,
    started_at: enrolment.started_at ?? null,
    completed_at: enrolment.completed_at ?? new Date().toISOString(),
    certificate_number: courseCertificateNumber(enrolment.id, enrolment.completed_at),
    founder_name: 'Mimo Patra',
    brand_name: 'Sariro',
  };
}

/** Whoever is asking may open this certificate: its owner, or staff. */
export function canOpenCertificate(viewer: { id: string; role: ActorRole }, ownerId: string): boolean {
  return viewer.id === ownerId || isCertificateStaff(viewer.role);
}

export const ENROLMENT_COLUMNS = 'id, user_id, track, level, cohort_id, started_at, completed_at, status';

/** Read an enrolment and its student with the service client. */
export async function loadCourseCertificate(
  admin: SupabaseClient,
  enrollmentId: string
): Promise<{ enrolment: EnrolmentRow | null; certificate: CertificateData | null }> {
  const { data: enrolment } = await admin.from('enrollments').select(ENROLMENT_COLUMNS).eq('id', enrollmentId).maybeSingle();
  if (!enrolment) return { enrolment: null, certificate: null };
  const { data: student } = await admin.from('profiles').select('full_name, email').eq('id', enrolment.user_id).maybeSingle();
  return {
    enrolment: enrolment as EnrolmentRow,
    certificate: buildCourseCertificate(enrolment as EnrolmentRow, (student as { full_name: string | null; email: string | null }) ?? null),
  };
}

/**
 * Issue or withdraw, guarded so two people pressing at once cannot both win:
 * the update only lands if the status is still what the decision was made on.
 */
export async function applyCertificateAction(
  admin: SupabaseClient,
  input: { enrollmentId: string; action: CertificateAction; actorId: string; nowIso?: string }
): Promise<
  | { ok: true; enrolment: EnrolmentRow; certificateUrl: string | null }
  | { ok: false; status: number; error: string; message: string }
> {
  const { data: current, error: readErr } = await admin
    .from('enrollments').select(ENROLMENT_COLUMNS).eq('id', input.enrollmentId).maybeSingle();
  if (readErr) return { ok: false, status: 500, error: 'read_failed', message: 'Could not read that enrolment. Try again.' };
  if (!current) return { ok: false, status: 404, error: 'not_found', message: 'That enrolment no longer exists.' };

  const decision = decideCertificateAction(current.status as string, input.action);
  if (!decision.ok) return { ok: false, status: 409, error: decision.error, message: decision.message };

  const now = input.nowIso ?? new Date().toISOString();
  const patch = decision.to === 'completed'
    // completion_shown_at cleared so the student's congratulations appears once.
    ? { status: 'completed', completed_at: now, completion_shown_at: null, updated_at: now }
    : { status: 'active', completed_at: null, updated_at: now };

  const { data: updated, error: writeErr } = await admin
    .from('enrollments').update(patch)
    .eq('id', input.enrollmentId).eq('status', decision.from)
    .select(ENROLMENT_COLUMNS);
  if (writeErr) {
    return { ok: false, status: 500, error: 'write_failed', message: `The database refused the change: ${writeErr.message}` };
  }
  const row = (updated ?? [])[0] as EnrolmentRow | undefined;
  if (!row) {
    return { ok: false, status: 409, error: 'changed', message: 'Somebody else changed this enrolment a moment ago. Refresh and check.' };
  }

  const { error: auditErr } = await admin.from('admin_audit_logs').insert({
    admin_id: input.actorId,
    action: input.action === 'issue' ? 'certificate_issued' : 'certificate_withdrawn',
    target_type: 'enrollment',
    target_id: row.id,
    metadata: { student_id: row.user_id, track: row.track, level: row.level, from: decision.from, to: decision.to },
  });
  if (auditErr) console.warn('[certificates] audit log was rejected:', auditErr.message);

  return { ok: true, enrolment: row, certificateUrl: decision.to === 'completed' ? courseCertificateUrl(row.id) : null };
}
