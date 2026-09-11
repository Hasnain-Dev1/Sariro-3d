import { NextRequest, NextResponse } from 'next/server';
import { requireActor } from '@/lib/auth/actor';

/**
 * SARIRO — GET /api/admin/trials
 *
 * Every trial, with the whole chain attached: which child, which teacher,
 * which class, which seller, and how it went.
 *
 * ── Why this is one route and not a join ────────────────────────────────────
 * The relationship a super-admin is actually asking about spans five tables
 * and PostgREST cannot express it in one embed — `student_leads` joins to a
 * booking, but the ROSTER joins the other way through `trial_participants`,
 * and `class_feedback` has two rows per child meaning different things.
 *
 * Assembled here, once, so no screen has to know that. The alternative is
 * every panel doing its own five reads and disagreeing about the answer, which
 * is how a dashboard ends up showing nine trials on one card and ten on
 * another.
 *
 * ── It is deliberately read-only ────────────────────────────────────────────
 * Nothing here creates a lead. The spec's "no manual lead creation" is a
 * property of the booking routes — every trial already makes its own lead via
 * linkTrialToLead — and this is the screen that proves it, not another way to
 * make one.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A sane ceiling; the panel filters client-side from here. */
const MAX_TRIALS = 400;

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'admin-trials',
    limit: 60,
    allow: ['super_admin', 'admin'],
    skipOriginCheck: true,
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const { data: bookingRows, error } = await actor.admin
    .from('bookings')
    .select(
      'id, slot_start, slot_end, status, trial_subject, teacher_id, google_meet_url, ' +
      /* No `teacher:teacher_id(...)` embed: bookings.teacher_id has no foreign
         key the API can follow, and asking for one failed this whole read.
         Teacher names are fetched separately below. */
      'trial_student_id, booked_by, created_at, attendance_finalized_at'
    )
    .eq('is_trial', true)
    .order('slot_start', { ascending: false })
    .limit(MAX_TRIALS);

  if (error) {
    console.warn('[admin-trials] read failed:', error.code, error.message);
    return NextResponse.json({ ok: false, error: 'read_failed', message: error.message }, { status: 500 });
  }

  const bookings = (bookingRows ?? []) as unknown as Record<string, unknown>[];
  if (bookings.length === 0) return NextResponse.json({ ok: true, trials: [] });

  const bookingIds = bookings.map((b) => String(b.id));

  const teacherIds = [...new Set(
    bookings.map((b) => b.teacher_id).filter((t): t is string => typeof t === 'string')
  )];

  const [
    { data: participants },
    { data: leads },
    { data: feedback },
    { data: attendance },
    { data: teacherRows },
  ] = await Promise.all([
    actor.admin
      .from('trial_participants')
      .select('booking_id, student_id, grade, student:student_id(full_name, email, phone, student_status)')
      .in('booking_id', bookingIds)
      .limit(2000),
    actor.admin
      .from('student_leads')
      .select('id, booking_id, student_id, student_name, stage, trial_status, sale_stage, assigned_seller, sale_value, seller:assigned_seller(full_name)')
      .in('booking_id', bookingIds)
      .limit(2000),
    actor.admin
      .from('class_feedback')
      .select('booking_id, author_role, subject_student_id, rating, remarks, interest_level')
      .in('booking_id', bookingIds)
      .limit(2000),
    actor.admin
      .from('session_attendance')
      .select('booking_id, student_id, status, marked_at')
      .in('booking_id', bookingIds)
      .limit(2000),
    teacherIds.length
      ? actor.admin.from('profiles').select('id, full_name').in('id', teacherIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);

  const teacherName = new Map(
    ((teacherRows ?? []) as { id: string; full_name: string | null }[]).map((t) => [t.id, t.full_name])
  );

  const by = <T,>(rows: T[] | null | undefined, key: (r: T) => string) => {
    const map = new Map<string, T[]>();
    for (const r of rows ?? []) {
      const k = key(r);
      if (!k) continue;
      const list = map.get(k);
      if (list) list.push(r);
      else map.set(k, [r]);
    }
    return map;
  };

  type Row = Record<string, unknown>;
  const partsBy = by(participants as Row[] | null, (r) => String(r.booking_id));
  const leadsBy = by(leads as Row[] | null, (r) => String(r.booking_id));
  const feedbackBy = by(feedback as Row[] | null, (r) => String(r.booking_id));
  const attendanceBy = by(attendance as Row[] | null, (r) => String(r.booking_id));

  const trials = bookings.map((b) => {
    const id = String(b.id);
    const parts = partsBy.get(id) ?? [];
    const leadRows = leadsBy.get(id) ?? [];
    const fb = feedbackBy.get(id) ?? [];
    const att = attendanceBy.get(id) ?? [];

    /* One entry per child, because that is the unit everything downstream
       cares about: a rating, an attendance mark and a lead all belong to a
       child, not to the half hour. */
    const students = parts.map((p) => {
      const sid = String(p.student_id);
      const profile = (p.student as { full_name?: string; email?: string; phone?: string; student_status?: string } | null) ?? null;
      const lead = leadRows.find((l) => String(l.student_id) === sid) ?? leadRows[0] ?? null;
      const teacherSaid = fb.find((f) => f.author_role === 'teacher' && String(f.subject_student_id ?? '') === sid) ?? null;
      const theySaid = fb.find((f) => f.author_role === 'student' && String(f.subject_student_id ?? '') === sid) ?? null;
      const mark = att.find((a) => String(a.student_id) === sid) ?? null;

      return {
        id: sid,
        name: profile?.full_name ?? profile?.email ?? 'Unnamed',
        phone: profile?.phone ?? null,
        grade: p.grade == null ? null : Number(p.grade),
        paused: Boolean(profile?.student_status && profile.student_status !== 'active'),
        attendance: (mark?.status as string | null) ?? null,
        teacherRating: teacherSaid?.rating ?? null,
        teacherRemarks: teacherSaid?.remarks ?? null,
        interest: teacherSaid?.interest_level ?? null,
        studentRating: theySaid?.rating ?? null,
        lead: lead
          ? {
              id: String(lead.id),
              stage: lead.stage,
              trialStatus: lead.trial_status,
              saleStage: lead.sale_stage ?? null,
              sellerName: (lead.seller as { full_name?: string } | null)?.full_name ?? null,
              saleValue: lead.sale_value == null ? null : Number(lead.sale_value),
            }
          : null,
      };
    });

    return {
      id,
      slotStart: b.slot_start,
      slotEnd: b.slot_end,
      status: b.status,
      subject: b.trial_subject ?? null,
      joinUrl: b.google_meet_url ?? null,
      finalisedAt: b.attendance_finalized_at ?? null,
      teacherName: teacherName.get(String(b.teacher_id)) ?? null,
      students,
      /* The gap worth seeing at a glance: a trial with children in it and no
         lead behind any of them is the failure this whole spine exists to
         prevent, and it has happened in production for months at a time. */
      hasLead: students.some((s) => s.lead !== null),
      seats: students.length,
    };
  });

  return NextResponse.json({ ok: true, trials });
}
