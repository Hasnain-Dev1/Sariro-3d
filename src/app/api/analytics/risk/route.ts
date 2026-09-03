import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import {
  studentChurnRisk, teacherRisk, batchHealth,
  type RiskAssessment, type BatchHealth,
} from '@/lib/dashboard/risk-signals';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';

/**
 * SARIRO — POST /api/analytics/risk
 * =========================================================
 * V2 §60-63, §64, §66, §67. Who is drifting away, which teacher is slipping,
 * and which batch is in trouble.
 *
 * ── One pass over the data, scored in memory ────────────────────────────────
 * Every table here is small and every signal needs several of them, so this
 * loads each once and joins in memory rather than issuing a query per student.
 * At a few hundred learners that is the cheaper shape by a wide margin; if the
 * roster reaches thousands this becomes a materialised view, not more queries.
 *
 * ── The scoring is not here ─────────────────────────────────────────────────
 * It lives in lib/dashboard/risk-signals.ts, which is pure and tested. This
 * route's whole job is gathering facts. Keeping the two apart is what lets the
 * rules that decide who gets called be argued with and changed without touching
 * a database query.
 *
 * HR, admin and super-admin only.
 */

export const runtime = 'nodejs';

export interface StudentRisk {
  student_id: string;
  student_name: string;
  batch_code: string | null;
  course: string | null;
  credits: number;
  risk: RiskAssessment;
}

export interface TeacherRiskRow {
  teacher_id: string;
  teacher_name: string;
  scheduled: number;
  risk: RiskAssessment;
}

export interface BatchHealthRow {
  cohort_id: string;
  batch_code: string | null;
  course: string;
  teacher_name: string | null;
  health: BatchHealth;
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `risk:${ip}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  const { data: profile } = await admin
    .from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role
    ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : 'student');
  if (!['hr', 'admin', 'super_admin'].includes(role as string)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  try {
    const now = Date.now();
    const nowIso = new Date().toISOString();

    const [
      { data: cohortsRaw }, { data: enrolRaw }, { data: bookingsRaw },
      { data: attRaw }, { data: creditsRaw }, { data: earningsRaw },
      { data: monitoringRaw }, { data: progressRaw },
    ] = await Promise.all([
      admin.from('cohorts').select('id, track, level, batch_code, ratio, status'),
      admin.from('enrollments').select('id, user_id, cohort_id, status, course_title, track, level'),
      admin.from('bookings').select('id, cohort_id, teacher_id, slot_start, status, attendance_finalized_at'),
      admin.from('session_attendance').select('booking_id, student_id, status'),
      admin.from('credits').select('user_id, balance'),
      admin.from('teacher_earnings').select('teacher_id, penalty_reason, penalty_amount'),
      admin.from('teacher_monitoring').select('teacher_id, overall_score'),
      admin.from('lesson_progress').select('enrollment_id'),
    ]);

    type Row = Record<string, unknown>;
    const cohorts = (cohortsRaw ?? []) as Row[];
    const enrolments = (enrolRaw ?? []) as Row[];
    const bookings = (bookingsRaw ?? []) as Row[];
    const attendance = (attRaw ?? []) as Row[];
    const credits = (creditsRaw ?? []) as Row[];
    const earnings = (earningsRaw ?? []) as Row[];
    const monitoring = (monitoringRaw ?? []) as Row[];
    const progress = (progressRaw ?? []) as Row[];

    const peopleIds = [
      ...new Set([
        ...enrolments.map((e) => e.user_id),
        ...bookings.map((b) => b.teacher_id),
      ].filter(Boolean) as string[]),
    ];
    const { data: peopleRaw } = peopleIds.length
      ? await admin.from('profiles').select('id, full_name, email').in('id', peopleIds)
      : { data: [] };
    const nameById = new Map(
      ((peopleRaw ?? []) as { id: string; full_name: string | null; email: string | null }[])
        .map((p) => [p.id, (p.full_name || p.email || 'Someone').trim()])
    );

    const cohortById = new Map(cohorts.map((c) => [c.id as string, c]));
    const balanceById = new Map(credits.map((c) => [c.user_id as string, Number(c.balance ?? 0)]));
    const bookingById = new Map(bookings.map((b) => [b.id as string, b]));

    const isPast = (b: Row) => Date.parse(b.slot_start as string) < now;
    const notCancelled = (b: Row) => b.status !== 'cancelled';

    /* ── Students ─────────────────────────────────────────────────────── */
    const attendedByStudent = new Map<string, Row[]>();
    for (const a of attendance) {
      const list = attendedByStudent.get(a.student_id as string) ?? [];
      list.push(a);
      attendedByStudent.set(a.student_id as string, list);
    }

    const progressByEnrolment = new Map<string, number>();
    for (const p of progress) {
      const k = p.enrollment_id as string;
      progressByEnrolment.set(k, (progressByEnrolment.get(k) ?? 0) + 1);
    }

    const students: StudentRisk[] = [];
    for (const e of enrolments) {
      if (e.status === 'dropped') continue;
      const studentId = e.user_id as string;
      const cohort = e.cohort_id ? cohortById.get(e.cohort_id as string) : null;

      const cohortBookings = bookings.filter(
        (b) => b.cohort_id === e.cohort_id && notCancelled(b)
      );
      const held = cohortBookings.filter(isPast);
      const ahead = cohortBookings.filter((b) => !isPast(b));

      const mine = (attendedByStudent.get(studentId) ?? []).filter((a) =>
        held.some((b) => b.id === a.booking_id)
      );
      const attended = mine.filter((a) => a.status === 'present' || a.status === 'late');

      // The most recent class they actually turned up to.
      const lastAt = attended
        .map((a) => bookingById.get(a.booking_id as string))
        .map((b) => (b ? Date.parse(b.slot_start as string) : NaN))
        .filter((t) => Number.isFinite(t))
        .sort((a, b) => b - a)[0];
      const daysSince = lastAt ? Math.floor((now - lastAt) / 86_400_000) : null;

      const syllabus = cohort
        ? getCourseSyllabus(cohort.track as string, cohort.level as string)
        : null;
      const lessonsTotal = syllabus
        ? syllabus.modules.reduce((s, m) => s + m.lessons.length, 0)
        : 0;

      const risk = studentChurnRisk({
        credits: balanceById.get(studentId) ?? 0,
        scheduledAhead: ahead.length,
        classesHeld: held.length,
        classesAttended: attended.length,
        daysSinceLastClass: daysSince,
        lessonsCompleted: progressByEnrolment.get(e.id as string) ?? 0,
        lessonsTotal,
      });

      students.push({
        student_id: studentId,
        student_name: nameById.get(studentId) ?? 'A student',
        batch_code: (cohort?.batch_code as string) ?? null,
        course: (e.course_title as string) ?? (cohort?.track as string) ?? null,
        credits: balanceById.get(studentId) ?? 0,
        risk,
      });
    }

    /* ── Teachers ─────────────────────────────────────────────────────── */
    const teacherIds = [...new Set(bookings.map((b) => b.teacher_id).filter(Boolean) as string[])];
    const teachers: TeacherRiskRow[] = teacherIds.map((teacherId) => {
      const mine = bookings.filter((b) => b.teacher_id === teacherId && notCancelled(b));
      const myEarnings = earnings.filter((e) => e.teacher_id === teacherId);
      const reason = (e: Row) => String(e.penalty_reason ?? '').toLowerCase();

      const scores = monitoring
        .filter((m) => m.teacher_id === teacherId && m.overall_score !== null)
        .map((m) => Number(m.overall_score));

      const risk = teacherRisk({
        scheduled: mine.length,
        lateJoins: myEarnings.filter((e) => reason(e).includes('late join')).length,
        // "Student no-show" is a withholding, not the teacher failing to appear.
        noShows: myEarnings.filter((e) => reason(e).includes('no show') && !reason(e).includes('student')).length,
        attendanceOutstanding: mine.filter((b) => isPast(b) && !b.attendance_finalized_at).length,
        monitoringScore: scores.length
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null,
      });

      return {
        teacher_id: teacherId,
        teacher_name: nameById.get(teacherId) ?? 'A teacher',
        scheduled: mine.length,
        risk,
      };
    });

    const teacherScoreById = new Map(teachers.map((t) => [t.teacher_id, t.risk.score]));

    /* ── Batches ──────────────────────────────────────────────────────── */
    const batches: BatchHealthRow[] = cohorts.map((c) => {
      const cohortId = c.id as string;
      const mineEnrol = enrolments.filter((e) => e.cohort_id === cohortId);
      const active = mineEnrol.filter((e) => e.status === 'active');
      const cohortBookings = bookings.filter((b) => b.cohort_id === cohortId && notCancelled(b));
      const held = cohortBookings.filter(isPast);
      const heldIds = new Set(held.map((b) => b.id));

      const attendedTotal = attendance.filter(
        (a) => heldIds.has(a.booking_id as string) && (a.status === 'present' || a.status === 'late')
      ).length;

      const lowOnCredits = mineEnrol.filter(
        (e) => (balanceById.get(e.user_id as string) ?? 0) < 4
      ).length;

      const teacherId = cohortBookings[0]?.teacher_id as string | undefined;

      return {
        cohort_id: cohortId,
        batch_code: (c.batch_code as string) ?? null,
        course: `${c.track ?? ''} ${c.level ?? ''}`.trim(),
        teacher_name: teacherId ? (nameById.get(teacherId) ?? null) : null,
        health: batchHealth({
          studentsEnrolled: mineEnrol.length,
          studentsActive: active.length,
          classesHeld: held.length,
          classesAttendedTotal: attendedTotal,
          attendancePossible: held.length * Math.max(mineEnrol.length, 1),
          studentsLowOnCredits: lowOnCredits,
          teacherRiskScore: teacherId ? (teacherScoreById.get(teacherId) ?? null) : null,
          classesFinalised: held.filter((b) => b.attendance_finalized_at).length,
        }),
      };
    });

    // Worst first — the order somebody would work the list in. "Unknown" sorts
    // last rather than as zero, because a batch with no data is not a crisis.
    const bandRank = { high: 0, medium: 1, low: 2, unknown: 3 } as const;

    return NextResponse.json({
      ok: true,
      generatedAt: nowIso,
      students: students.sort((a, b) => bandRank[a.risk.band] - bandRank[b.risk.band] || (b.risk.score ?? -1) - (a.risk.score ?? -1)),
      teachers: teachers.sort((a, b) => bandRank[a.risk.band] - bandRank[b.risk.band] || (b.risk.score ?? -1) - (a.risk.score ?? -1)),
      batches: batches.sort((a, b) => (a.health.score ?? 999) - (b.health.score ?? 999)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: 'server_error', message }, { status: 500 });
  }
}
