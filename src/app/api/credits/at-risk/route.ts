import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';

/**
 * SARIRO — POST /api/credits/at-risk
 * =========================================================
 * V2 §26, §63 and the honest half of §65.
 *
 * Students whose credits are running out, with the teacher, batch and course
 * attached — and the date they run out on.
 *
 * ── Why the exhaustion date is counted, not forecast ────────────────────────
 * §65 asks when a student will reach zero credits. The tempting answer is a
 * consumption rate fitted to history. The better answer is already in the
 * database: their classes are scheduled. One credit is one class, so the class
 * they cannot pay for is the (balance + 1)th one on their calendar, and its
 * date is a fact rather than an estimate.
 *
 * This matters because the number gets shown to a parent eventually. "Your
 * credits cover you to the 14th" survives that conversation. "Our model
 * predicts roughly two weeks" does not.
 *
 * A rate-based forecast is the right fallback once there is enough history to
 * fit one — see the note where the date comes out null.
 *
 * ── Who can ask ────────────────────────────────────────────────────────────
 * A teacher gets the students in their own batches (§26). HR, admin and
 * super-admin get everybody (§63). Nobody else gets anything.
 */

export const runtime = 'nodejs';

/** §26, §63 — "If Credits < 4, show Low Credits." */
const LOW_CREDIT_THRESHOLD = 4;

interface Body { website?: string }

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `at-risk:${ip}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { body = {}; }
  if (body.website) return NextResponse.json({ ok: true });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  const { data: profile } = await admin
    .from('profiles').select('role, is_teacher, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = profile?.role
    ?? (profile?.is_super_admin ? 'super_admin' : profile?.is_admin ? 'admin' : profile?.is_teacher ? 'teacher' : 'student');

  const seesEveryone = ['hr', 'admin', 'super_admin'].includes(role as string);
  const isTeacher = role === 'teacher' || profile?.is_teacher === true;
  if (!seesEveryone && !isTeacher) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  try {
    const nowIso = new Date().toISOString();

    /* Every upcoming class, once. Used both to scope a teacher to their own
       batches and to date the credit that runs out. */
    const { data: upcomingRaw } = await admin
      .from('bookings')
      .select('id, cohort_id, teacher_id, slot_start, status')
      .gte('slot_start', nowIso)
      .not('status', 'in', '("cancelled","completed")')
      .order('slot_start', { ascending: true })
      .limit(2000);
    const upcoming = (upcomingRaw ?? []) as { cohort_id: string; teacher_id: string | null; slot_start: string }[];

    // A teacher sees only the batches they actually teach.
    const myCohorts = new Set(
      upcoming.filter((b) => b.teacher_id === user.id).map((b) => b.cohort_id)
    );

    const { data: lowRaw } = await admin
      .from('credits')
      .select('user_id, balance, updated_at')
      .lt('balance', LOW_CREDIT_THRESHOLD);
    const low = (lowRaw ?? []) as { user_id: string; balance: number; updated_at: string }[];
    if (low.length === 0) return NextResponse.json({ ok: true, students: [], threshold: LOW_CREDIT_THRESHOLD });

    const studentIds = low.map((c) => c.user_id);

    const { data: enrolRaw } = await admin
      .from('enrollments')
      .select('user_id, course_title, track, level, cohort_id, status')
      .in('user_id', studentIds);
    const enrolments = (enrolRaw ?? []) as {
      user_id: string; course_title: string | null; track: string | null;
      level: string | null; cohort_id: string | null; status: string | null;
    }[];

    const cohortIds = [...new Set(enrolments.map((e) => e.cohort_id).filter(Boolean) as string[])];
    const { data: cohortRaw } = cohortIds.length
      ? await admin.from('cohorts').select('id, batch_code, track, level, ratio').in('id', cohortIds)
      : { data: [] };
    const cohortById = new Map(
      ((cohortRaw ?? []) as { id: string }[]).map((c) => [c.id, c as Record<string, unknown>])
    );

    const teacherIds = [...new Set(upcoming.map((b) => b.teacher_id).filter(Boolean) as string[])];
    const { data: peopleRaw } = await admin
      .from('profiles').select('id, full_name, email').in('id', [...studentIds, ...teacherIds]);
    const nameById = new Map(
      ((peopleRaw ?? []) as { id: string; full_name: string | null; email: string | null }[])
        .map((p) => [p.id, (p.full_name || p.email || 'Someone').trim()])
    );

    const students = low
      .map((c) => {
        const mine = enrolments.filter((e) => e.user_id === c.user_id);
        const cohortsForStudent = mine.map((e) => e.cohort_id).filter(Boolean) as string[];

        if (!seesEveryone && !cohortsForStudent.some((id) => myCohorts.has(id))) return null;

        // Their scheduled classes, soonest first.
        const theirClasses = upcoming
          .filter((b) => cohortsForStudent.includes(b.cohort_id))
          .sort((a, b) => a.slot_start.localeCompare(b.slot_start));

        const balance = Number(c.balance ?? 0);
        // One credit, one class: the (balance + 1)th scheduled class is the
        // first one they cannot pay for. Null when nothing is scheduled that
        // far ahead — an honest "not enough scheduled to say" rather than a
        // number invented to fill the column.
        const runsOutAt = theirClasses[balance]?.slot_start ?? null;

        const primary = mine[0];
        const cohort = primary?.cohort_id ? cohortById.get(primary.cohort_id) : null;
        const teacherId = theirClasses[0]?.teacher_id ?? null;

        return {
          student_id: c.user_id,
          student_name: nameById.get(c.user_id) ?? 'A student',
          balance,
          updated_at: c.updated_at,
          course: primary?.course_title ?? (primary?.track ?? null),
          level: primary?.level ?? ((cohort?.level as string) ?? null),
          batch_code: (cohort?.batch_code as string) ?? null,
          teacher_name: teacherId ? (nameById.get(teacherId) ?? null) : null,
          scheduled_ahead: theirClasses.length,
          runs_out_at: runsOutAt,
        };
      })
      .filter(Boolean)
      // Emptiest first — that is the order somebody would work the list in.
      .sort((a, b) => (a!.balance - b!.balance));

    return NextResponse.json({ ok: true, students, threshold: LOW_CREDIT_THRESHOLD });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: 'server_error', message }, { status: 500 });
  }
}
