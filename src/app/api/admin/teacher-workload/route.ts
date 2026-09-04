import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/admin/teacher-workload
 * =========================================================
 * V2 §10: "Before assignment, show teacher, subject expertise, existing
 * workload, existing classes, existing students, schedule, potential
 * scheduling conflicts."
 *
 * ── What was already there, and what was not ────────────────────────────────
 * Conflict ENFORCEMENT works: /api/admin/schedule refuses to create a class
 * that collides with another of the teacher's, and it checks before creating
 * anything so a clash rejects cleanly.
 *
 * What was missing is everything §10 asks for BEFORE that point. An admin
 * picked a name from a dropdown with no idea whether that teacher already had
 * two classes a week or eleven, built a whole schedule, submitted it, and only
 * then found out. The rejection was correct and arrived far too late.
 *
 * This is the number that should have been beside the name all along.
 *
 * Admin and super-admin only.
 */

export const runtime = 'nodejs';

export interface TeacherWorkload {
  teacher_id: string;
  /** Classes still to come. */
  upcoming: number;
  /** Distinct batches they are currently teaching. */
  batches: number;
  /** Distinct active students across those batches. */
  students: number;
  /** Upcoming classes in the next seven days — the number that bites. */
  nextSevenDays: number;
  /** Their busiest weekday, for spotting somebody already stacked. */
  busiestDay: string | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `workload:${ip}`, limit: 60, windowMs: 60_000 });
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
  if (!['admin', 'super_admin'].includes(role as string)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  try {
    const now = Date.now();
    const weekAhead = now + 7 * 86_400_000;

    const { data: bookingsRaw } = await admin
      .from('bookings')
      .select('teacher_id, cohort_id, slot_start, status')
      .gte('slot_start', new Date(now).toISOString())
      .not('status', 'eq', 'cancelled')
      .limit(5000);

    const bookings = (bookingsRaw ?? []) as {
      teacher_id: string | null; cohort_id: string; slot_start: string; status: string;
    }[];

    const cohortIds = [...new Set(bookings.map((b) => b.cohort_id).filter(Boolean))];
    const { data: enrolRaw } = cohortIds.length
      ? await admin.from('enrollments').select('user_id, cohort_id').in('cohort_id', cohortIds).neq('status', 'dropped')
      : { data: [] };
    const enrolments = (enrolRaw ?? []) as { user_id: string; cohort_id: string }[];

    const byTeacher = new Map<string, TeacherWorkload & { _days: Map<number, number> }>();

    for (const b of bookings) {
      if (!b.teacher_id) continue;
      const t = Date.parse(b.slot_start);
      if (!Number.isFinite(t)) continue;

      const row = byTeacher.get(b.teacher_id) ?? {
        teacher_id: b.teacher_id, upcoming: 0, batches: 0, students: 0,
        nextSevenDays: 0, busiestDay: null, _days: new Map<number, number>(),
      };

      row.upcoming += 1;
      if (t <= weekAhead) row.nextSevenDays += 1;
      const day = new Date(t).getUTCDay();
      row._days.set(day, (row._days.get(day) ?? 0) + 1);

      byTeacher.set(b.teacher_id, row);
    }

    // Batches and students, counted distinctly rather than per booking — a
    // teacher with twelve classes in one batch of four is not teaching twelve
    // batches or forty-eight children.
    for (const [teacherId, row] of byTeacher) {
      const theirCohorts = new Set(
        bookings.filter((b) => b.teacher_id === teacherId).map((b) => b.cohort_id)
      );
      row.batches = theirCohorts.size;
      row.students = new Set(
        enrolments.filter((e) => theirCohorts.has(e.cohort_id)).map((e) => e.user_id)
      ).size;

      let best: [number, number] | null = null;
      for (const entry of row._days) if (!best || entry[1] > best[1]) best = entry;
      row.busiestDay = best ? DAYS[best[0]] : null;
    }

    const workload: TeacherWorkload[] = [...byTeacher.values()].map(({ _days, ...rest }) => {
      void _days;
      return rest;
    });

    return NextResponse.json({ ok: true, workload });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: 'server_error', message }, { status: 500 });
  }
}
