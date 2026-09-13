import { NextRequest, NextResponse } from 'next/server';
import { requireActor, readJson } from '@/lib/auth/actor';
import {
  CERTIFICATE_STAFF, ENROLMENT_COLUMNS, applyCertificateAction, courseCertificateUrl, trackName,
  type CertificateAction, type EnrolmentRow,
} from '@/lib/certificates/course';
import { calculateProgress, type LessonProgressRow } from '@/lib/dashboard/student-data';
import { trialCertificateFor, REASON_COPY } from '@/lib/trial/certificate';
import { subjectLabel } from '@/lib/trial/subjects';
import type { StaffEnrolment, StaffStudent, StaffTrial } from '@/lib/certificates/staff-types';

/**
 * SARIRO — /api/staff/certificates
 *
 *   GET  ?q=name-or-email   students, their courses and trial certificates
 *   GET  (no q)             the certificates issued most recently
 *   POST { enrollmentId, action: 'issue' | 'withdraw' }
 *
 * Admin, super admin and HR only. The rule for what can be issued, and what
 * issuing changes, lives in lib/certificates/course.ts.
 */
export const runtime = 'nodejs';

/* PostgREST's or() filter is a comma-separated string, so anything that could
   break out of it goes before it is built. */
const searchable = (q: string) => q.replace(/[,()*%\\"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'staff-certificates', allow: [...CERTIFICATE_STAFF], skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { admin } = gate.actor;

  const q = searchable(req.nextUrl.searchParams.get('q') ?? '');

  /* ── Which students ─────────────────────────────────────────────────────── */
  let studentIds: string[] = [];
  let recentEnrolmentIds: string[] | null = null;

  if (q.length >= 2) {
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(15);
    if (error) return NextResponse.json({ ok: false, error: 'search_failed', message: error.message }, { status: 500 });
    studentIds = (data ?? []).map((r) => r.id as string);
  } else {
    const { data, error } = await admin
      .from('enrollments')
      .select('id, user_id')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(12);
    if (error) return NextResponse.json({ ok: false, error: 'read_failed', message: error.message }, { status: 500 });
    recentEnrolmentIds = (data ?? []).map((r) => r.id as string);
    studentIds = [...new Set((data ?? []).map((r) => r.user_id as string))];
  }

  if (studentIds.length === 0) return NextResponse.json({ ok: true, mode: q ? 'search' : 'recent', students: [] });

  /* ── Everything about them, in parallel ─────────────────────────────────── */
  const [profilesRes, enrolmentsRes, seatsRes, namedTrialsRes] = await Promise.all([
    admin.from('profiles').select('id, full_name, email').in('id', studentIds),
    recentEnrolmentIds
      ? admin.from('enrollments').select(ENROLMENT_COLUMNS).in('id', recentEnrolmentIds)
      : admin.from('enrollments').select(ENROLMENT_COLUMNS).in('user_id', studentIds).order('created_at', { ascending: false }),
    recentEnrolmentIds
      ? Promise.resolve({ data: [] as { booking_id: string; student_id: string }[] })
      : admin.from('trial_participants').select('booking_id, student_id').in('student_id', studentIds),
    recentEnrolmentIds
      ? Promise.resolve({ data: [] as { id: string; trial_student_id: string }[] })
      : admin.from('bookings').select('id, trial_student_id').eq('is_trial', true).in('trial_student_id', studentIds),
  ]);

  const enrolments = (enrolmentsRes.data ?? []) as EnrolmentRow[];
  const enrolmentIds = enrolments.map((e) => e.id);

  const [progressRes, auditRes] = await Promise.all([
    enrolmentIds.length
      ? admin.from('lesson_progress').select('id, enrollment_id, module_num, lesson_name, completed_at').in('enrollment_id', enrolmentIds)
      : Promise.resolve({ data: [] }),
    enrolmentIds.length
      ? admin.from('admin_audit_logs').select('admin_id, target_id, created_at')
          .eq('action', 'certificate_issued').in('target_id', enrolmentIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const audits = (auditRes.data ?? []) as { admin_id: string; target_id: string }[];
  const issuerIds = [...new Set(audits.map((a) => a.admin_id))];
  const { data: issuers } = issuerIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', issuerIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const issuerName = new Map((issuers ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? 'Staff']));
  const issuedBy = new Map<string, string>();
  for (const a of audits) if (!issuedBy.has(a.target_id)) issuedBy.set(a.target_id, issuerName.get(a.admin_id) ?? 'Staff');

  const progressRows = (progressRes.data ?? []) as LessonProgressRow[];

  const toEnrolment = (e: EnrolmentRow): StaffEnrolment => {
    const p = calculateProgress(e.track, e.level ?? 'beginner', progressRows.filter((r) => r.enrollment_id === e.id));
    return {
      id: e.id,
      track: e.track,
      trackName: trackName(e.track),
      level: e.level,
      status: e.status,
      startedAt: e.started_at,
      completedAt: e.completed_at,
      progress: { done: p.completedLessons, total: p.totalLessons },
      certificateUrl: e.status === 'completed' ? courseCertificateUrl(e.id) : null,
      issuedBy: e.status === 'completed' ? issuedBy.get(e.id) ?? null : null,
    };
  };

  /* ── Trial certificates: decided by the same rule the child's page uses ── */
  const trialPairs = new Map<string, Set<string>>();
  const addPair = (studentId: string, bookingId: string) => {
    const set = trialPairs.get(studentId) ?? new Set<string>();
    set.add(bookingId);
    trialPairs.set(studentId, set);
  };
  for (const s of (seatsRes.data ?? []) as { booking_id: string; student_id: string }[]) addPair(s.student_id, s.booking_id);
  for (const b of (namedTrialsRes.data ?? []) as { id: string; trial_student_id: string }[]) addPair(b.trial_student_id, b.id);

  const trialsByStudent = new Map<string, StaffTrial[]>();
  await Promise.all(
    [...trialPairs.entries()].flatMap(([studentId, bookings]) =>
      [...bookings].slice(0, 6).map(async (bookingId) => {
        const r = await trialCertificateFor(admin, bookingId, studentId);
        if (!r.ok && r.reason === 'not_found') return; // cancelled, or not really theirs
        const { data: b } = await admin.from('bookings').select('slot_start, trial_subject').eq('id', bookingId).maybeSingle();
        const list = trialsByStudent.get(studentId) ?? [];
        list.push({
          bookingId,
          subject: b?.trial_subject ? subjectLabel(b.trial_subject as string) : 'Trial class',
          classDate: (b?.slot_start as string | null) ?? null,
          eligible: r.ok,
          reason: r.ok ? null : REASON_COPY[r.reason],
          certificateUrl: r.ok ? `/certificate/trial/${bookingId}?student=${studentId}` : null,
        });
        trialsByStudent.set(studentId, list);
      })
    )
  );

  const byId = new Map((profilesRes.data ?? []).map((p) => [p.id as string, p]));
  const students: StaffStudent[] = studentIds
    .map((id) => {
      const p = byId.get(id);
      return {
        id,
        name: ((p?.full_name as string | null) ?? '').trim() || 'Unnamed',
        email: (p?.email as string | null) ?? null,
        enrolments: enrolments.filter((e) => e.user_id === id).map(toEnrolment),
        trials: (trialsByStudent.get(id) ?? []).sort((a, b) => (b.classDate ?? '').localeCompare(a.classDate ?? '')),
      };
    })
    // Somebody with a course or a trial first; a parent's own profile last.
    .sort((a, b) => Number(b.enrolments.length + b.trials.length > 0) - Number(a.enrolments.length + a.trials.length > 0));

  return NextResponse.json({ ok: true, mode: q ? 'search' : 'recent', students });
}

interface PostBody {
  enrollmentId?: string;
  action?: CertificateAction;
  website?: string;
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'staff-certificates-write', limit: 30, allow: [...CERTIFICATE_STAFF] });
  if (!gate.ok) return gate.response;

  const parsed = await readJson<PostBody>(req);
  if (!parsed.ok) return parsed.response;

  const enrollmentId = (parsed.body.enrollmentId ?? '').trim();
  const action = parsed.body.action;
  if (!enrollmentId) return NextResponse.json({ ok: false, error: 'missing_enrollment', message: 'Which enrolment?' }, { status: 400 });
  if (action !== 'issue' && action !== 'withdraw') {
    return NextResponse.json({ ok: false, error: 'bad_action', message: 'Issue or withdraw?' }, { status: 400 });
  }

  const result = await applyCertificateAction(gate.actor.admin, { enrollmentId, action, actorId: gate.actor.id });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error, message: result.message }, { status: result.status });

  return NextResponse.json({ ok: true, status: result.enrolment.status, certificateUrl: result.certificateUrl });
}
