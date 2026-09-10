import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';
import { recordAdminAction } from '@/lib/audit/log';
import { canAssignCourse } from '@/lib/contact/reachability';
import {
  creditGate, creditBlockMessage, type LearnerCredit,
} from '@/lib/dashboard/schedule-credit-gate';

/**
 * SARIRO — POST /api/admin/schedule/manage  (admin/super-admin only)
 *
 * Batch management actions:
 *   { action: 'change_teacher', scheduleId, teacherId }
 *   { action: 'pause_batch',   scheduleId, pauseStart, pauseEnd, reason? }
 *   { action: 'pause_student', scheduleId, studentId, pauseStart, pauseEnd, reason? }
 *   { action: 'add_kid',       cohortId, studentId }
 *   { action: 'remove_kid',    cohortId, studentId }
 *
 * Each action is bounded and idempotent-safe: teacher/pauses touch only FUTURE
 * scheduled bookings; paused classes are cancelled and an equal number appended
 * to the end so the paid class count is preserved.
 */
export const runtime = 'nodejs';

interface Body {
  action?: string;
  scheduleId?: string;
  teacherId?: string;
  studentId?: string;
  cohortId?: string;
  pauseStart?: string;
  pauseEnd?: string;
  reason?: string;
}

async function requireAdmin(admin: ReturnType<typeof createServiceClient>): Promise<string | null> {
  let supa;
  try { supa = await createServerClientHelper(); } catch { return null; }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;
  const { data: p } = await admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).single();
  const ok = p?.role === 'admin' || p?.role === 'super_admin' || p?.is_admin === true || p?.is_super_admin === true;
  return ok ? user.id : null;
}

/* ── Adding a kid to a batch no longer mints credits ────────────────────────
   grantEnrollmentCredits() used to live here, granting one credit per lesson
   in the course — forty-two for a forty-two-lesson course, recorded as a
   'purchase' nobody made. Its own comment explained the reasoning: a kid can
   only join a class if they have credits, so adding them to a batch must grant
   them, or they enrol and can never join.

   That is true, and it is the wrong conclusion. It makes the credit balance a
   copy of the syllabus length and the whole system decorative. The right
   answer is the other one: a child with no credits should not be put into a
   batch at all until somebody has paid — which is what creditGate() below now
   enforces, early enough that an admin can fix it rather than a parent finding
   out at the join button.

   Credits are created only where money is: the grant and adjust screens. */

/** Balances and names for a set of learners. A missing row means nothing held. */
async function learnerCredits(
  admin: ReturnType<typeof createServiceClient>,
  ids: string[]
): Promise<LearnerCredit[]> {
  const [{ data: creds }, { data: people }] = await Promise.all([
    admin.from('credits').select('user_id, balance').in('user_id', ids),
    admin.from('profiles').select('id, full_name').in('id', ids),
  ]);
  const balance = new Map<string, number | null>(
    (creds ?? []).map((c) => [c.user_id as string, (c.balance as number | null) ?? null])
  );
  const name = new Map<string, string | null>(
    (people ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? null])
  );
  return ids.map((id) => ({
    studentId: id,
    name: name.get(id) ?? null,
    // Absent row and zero are the same thing. Reading absent as "unknown, so
    // allow" is exactly how a gate like this leaks.
    balance: balance.get(id) ?? null,
  }));
}

/**
 * When a kid is added to a batch that's already in progress, unlock every
 * lesson the batch has already covered so the new kid can continue from where
 * the group is — regardless of whether they personally did the earlier ones.
 *
 * "Already covered" = the number of COMPLETED classes the cohort has had. We
 * insert a lesson_progress row for each of the first N syllabus lessons (N =
 * completed-class count), which is exactly what makes those lessons show as
 * done/viewable (the unlock logic keys purely off lesson_progress). Idempotent:
 * we skip lessons the enrollment already has.
 */
async function backfillLessonProgressToBatch(
  admin: ReturnType<typeof createServiceClient>,
  opts: { cohortId: string; enrollmentId: string; track: string | null; level: string | null }
) {
  if (!opts.track || !opts.level) return;
  const syllabus = getCourseSyllabus(opts.track, opts.level);
  const lessons: { module_num: string; lesson_name: string }[] = [];
  for (const mod of syllabus.modules) {
    for (const l of mod.lessons) {
      lessons.push({ module_num: mod.num, lesson_name: typeof l === 'string' ? l : l.name });
    }
  }
  if (lessons.length === 0) return;

  const { count } = await admin.from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', opts.cohortId).eq('status', 'completed');
  const delivered = Math.min(count ?? 0, lessons.length);
  if (delivered <= 0) return;

  const { data: existing } = await admin.from('lesson_progress')
    .select('module_num, lesson_name').eq('enrollment_id', opts.enrollmentId);
  const have = new Set((existing ?? []).map((r: { module_num: string; lesson_name: string }) => `${r.module_num}::${r.lesson_name}`));

  const rows = lessons.slice(0, delivered)
    .filter((l) => !have.has(`${l.module_num}::${l.lesson_name}`))
    .map((l) => ({ enrollment_id: opts.enrollmentId, module_num: l.module_num, lesson_name: l.lesson_name }));
  if (rows.length) await admin.from('lesson_progress').insert(rows);
}

async function appendMakeups(admin: ReturnType<typeof createServiceClient>, scheduleId: string, n: number) {
  if (n <= 0) return;
  const { data: sched } = await admin.from('cohort_schedules').select('*').eq('id', scheduleId).maybeSingle();
  if (!sched) return;
  const { data: last } = await admin.from('bookings').select('slot_start')
    .eq('schedule_id', scheduleId).in('status', ['scheduled', 'completed'])
    .order('slot_start', { ascending: false }).limit(1).maybeSingle();
  const after = last ? new Date(last.slot_start) : new Date(sched.start_date + 'T00:00:00Z');
  const slots = generateOccurrences({
    startDate: sched.start_date, daysOfWeek: sched.days_of_week, timeLocal: sched.time_local,
    durationMin: sched.duration_min, timezone: sched.timezone,
  }, n, after);
  if (slots.length) {
    await admin.from('bookings').insert(slots.map((s) => ({
      cohort_id: sched.cohort_id, teacher_id: sched.teacher_id, schedule_id: scheduleId,
      slot_start: s.slotStart, slot_end: s.slotEnd, status: 'scheduled',
    })));
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('origin')) {
    const csrfFail = assertSameOrigin(req);
    if (csrfFail) return csrfFail;
  }
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const admin = createServiceClient();
  const userId = await requireAdmin(admin);
  if (!userId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  /** Who is doing this. §76 — every audit entry names a person. */
  const adminId = userId;

  const rl = rateLimit({ key: `schedule-manage:${userId}`, limit: 40, windowMs: 60_000 });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many requests.');

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  const nowIso = new Date().toISOString();

  switch (body.action) {
    case 'change_teacher': {
      if (!body.scheduleId || !body.teacherId) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
      // Training gate — the new teacher must be trained for this batch's course.
      const { data: sched } = await admin.from('cohort_schedules').select('cohort_id').eq('id', body.scheduleId).maybeSingle();
      if (sched) {
        const { data: cohort } = await admin.from('cohorts').select('track, level').eq('id', sched.cohort_id).maybeSingle();
        if (cohort) {
          const { data: trained } = await admin.from('teacher_course_assignments').select('id')
            .eq('teacher_id', body.teacherId).ilike('track', cohort.track).ilike('level', cohort.level)
            .not('training_completed_at', 'is', null).maybeSingle();
          if (!trained) return NextResponse.json({ ok: false, error: 'teacher_not_trained', message: "That teacher's training for this course isn't complete." }, { status: 409 });
        }
      }
      const { error: e1 } = await admin.from('cohort_schedules').update({ teacher_id: body.teacherId, status: 'active', updated_at: nowIso }).eq('id', body.scheduleId);
      if (e1) return NextResponse.json({ ok: false, error: 'update_failed', message: e1.message }, { status: 500 });
      // Point future scheduled bookings at the new teacher.
      await admin.from('bookings').update({ teacher_id: body.teacherId })
        .eq('schedule_id', body.scheduleId).eq('status', 'scheduled').gt('slot_start', nowIso);
      // If the batch had been paused (no future classes), regenerate a horizon.
      const { count } = await admin.from('bookings').select('id', { count: 'exact', head: true })
        .eq('schedule_id', body.scheduleId).eq('status', 'scheduled').gt('slot_start', nowIso);
      if ((count ?? 0) === 0) await appendMakeups(admin, body.scheduleId, 8);

      await recordAdminAction(admin, {
        adminId, action: 'batch_teacher_changed',
        targetType: 'cohort_schedule', targetId: body.scheduleId,
        metadata: { new_teacher_id: body.teacherId },
      });

      return NextResponse.json({ ok: true });
    }

    case 'remove_teacher': {
      if (!body.scheduleId) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
      // Pause the batch and cancel its future scheduled classes until a new
      // teacher is assigned (reassigning via change_teacher reactivates it).
      const { error: rErr } = await admin.from('cohort_schedules').update({ status: 'paused', updated_at: nowIso }).eq('id', body.scheduleId);
      if (rErr) return NextResponse.json({ ok: false, error: 'update_failed', message: rErr.message }, { status: 500 });
      const { data: toCancel } = await admin.from('bookings').select('id')
        .eq('schedule_id', body.scheduleId).eq('status', 'scheduled').gt('slot_start', nowIso);
      if (toCancel?.length) {
        await admin.from('bookings').update({ status: 'cancelled', cancel_actor_role: 'admin', cancel_type: 'admin', pay_status: 'zero', cancelled_at: nowIso }).in('id', toCancel.map((b) => b.id));
      }
      await recordAdminAction(admin, {
        adminId, action: 'batch_teacher_changed',
        targetType: 'cohort_schedule', targetId: body.scheduleId,
        metadata: { new_teacher_id: null, cancelled_classes: toCancel?.length ?? 0, note: 'teacher removed, batch paused' },
      });

      return NextResponse.json({ ok: true, cancelled: toCancel?.length ?? 0 });
    }

    case 'pause_batch': {
      if (!body.scheduleId || !body.pauseStart || !body.pauseEnd) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
      await admin.from('schedule_pauses').insert({
        schedule_id: body.scheduleId, scope: 'batch', student_id: null,
        pause_start: body.pauseStart, pause_end: body.pauseEnd, reason: body.reason ?? null,
      });
      // Cancel future scheduled bookings within the window.
      const startIso = new Date(body.pauseStart + 'T00:00:00Z').toISOString();
      const endIso = new Date(body.pauseEnd + 'T23:59:59Z').toISOString();
      const { data: toCancel } = await admin.from('bookings').select('id')
        .eq('schedule_id', body.scheduleId).eq('status', 'scheduled')
        .gte('slot_start', startIso).lte('slot_start', endIso);
      const n = toCancel?.length ?? 0;
      if (n > 0) {
        await admin.from('bookings').update({ status: 'cancelled' }).in('id', toCancel!.map((b) => b.id));
        await appendMakeups(admin, body.scheduleId, n);  // preserve paid count
      }
      await recordAdminAction(admin, {
        adminId, action: 'batch_paused',
        targetType: 'cohort_schedule', targetId: body.scheduleId,
        metadata: { pause_start: body.pauseStart, pause_end: body.pauseEnd, reason: body.reason ?? null, cancelled_classes: n },
      });

      return NextResponse.json({ ok: true, cancelled: n, appended: n });
    }

    case 'pause_student': {
      if (!body.scheduleId || !body.studentId || !body.pauseStart || !body.pauseEnd) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
      await admin.from('schedule_pauses').insert({
        schedule_id: body.scheduleId, scope: 'student', student_id: body.studentId,
        pause_start: body.pauseStart, pause_end: body.pauseEnd, reason: body.reason ?? null,
      });

      await recordAdminAction(admin, {
        adminId, action: 'student_paused',
        targetType: 'user', targetId: body.studentId,
        metadata: { schedule_id: body.scheduleId, pause_start: body.pauseStart, pause_end: body.pauseEnd, reason: body.reason ?? null },
      });

      return NextResponse.json({ ok: true });
    }

    case 'add_kid': {
      if (!body.cohortId || !body.studentId) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });

      /* The same gate as /api/admin/enroll, because this is the same act by a
         different door: a seat in a batch, credits granted, a teacher's hour
         committed. An account with no usable phone is Unknown and gets none of
         it. See lib/contact/reachability.ts. */
      const { data: kid } = await admin.from('profiles').select('full_name, email, phone').eq('id', body.studentId).maybeSingle();
      if (!kid) return NextResponse.json({ ok: false, error: 'no_such_user' }, { status: 404 });
      const verdict = canAssignCourse(kid);
      if (!verdict.ok) {
        return NextResponse.json({ ok: false, error: verdict.code, message: verdict.message }, { status: 409 });
      }

      /* ── And have they paid for any of it? ─────────────────────────────
         The batch this child is joining already has classes in the diary, so
         adding them here commits a seat in every one of them. Refused at the
         door rather than at the join button on the evening of the class —
         which is where it used to surface, and only because enrolling had
         quietly granted a full course of credits to stop it surfacing at all. */
      const joining = await learnerCredits(admin, [body.studentId]);
      const gate = creditGate(joining);
      if (!gate.ok) {
        return NextResponse.json(
          { ok: false, error: 'no_credits', message: creditBlockMessage(gate.blocked) },
          { status: 409 }
        );
      }

      const { data: cohort } = await admin.from('cohorts').select('track, level, ratio').eq('id', body.cohortId).maybeSingle();
      const { data: existing } = await admin.from('enrollments').select('id, status').eq('cohort_id', body.cohortId).eq('user_id', body.studentId).maybeSingle();
      if (existing) {
        if (existing.status !== 'active') await admin.from('enrollments').update({ status: 'active' }).eq('id', existing.id);
        // Catch the kid up to wherever the batch is (unlock prior lessons).
        await backfillLessonProgressToBatch(admin, { cohortId: body.cohortId, enrollmentId: existing.id, track: cohort?.track ?? null, level: cohort?.level ?? null });

        await recordAdminAction(admin, {
          adminId, action: 'student_added_to_batch',
          targetType: 'user', targetId: body.studentId,
          metadata: {
            cohort_id: body.cohortId, enrollment_id: existing.id,
            previous_status: existing.status, new_status: 'active', reactivated: true,
          },
        });

        return NextResponse.json({ ok: true, reactivated: true });
      }
      const { data: enrollment, error: e2 } = await admin.from('enrollments').insert({
        user_id: body.studentId, cohort_id: body.cohortId,
        track: cohort?.track ?? null, level: cohort?.level ?? null, ratio: cohort?.ratio ?? null,
        status: 'active',
      }).select('id').single();
      if (e2) return NextResponse.json({ ok: false, error: 'enroll_failed', message: e2.message }, { status: 500 });
      // Unlock every lesson the batch has already covered, so the new kid can
      // continue from where the group is.
      if (enrollment) {
        await backfillLessonProgressToBatch(admin, { cohortId: body.cohortId, enrollmentId: enrollment.id, track: cohort?.track ?? null, level: cohort?.level ?? null });
      }

      await recordAdminAction(admin, {
        adminId, action: 'student_added_to_batch',
        targetType: 'user', targetId: body.studentId,
        metadata: {
          cohort_id: body.cohortId, enrollment_id: enrollment?.id ?? null,
          track: cohort?.track ?? null, level: cohort?.level ?? null,
        },
      });

      return NextResponse.json({ ok: true });
    }

    case 'remove_kid': {
      if (!body.cohortId || !body.studentId) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
      const { error: e3 } = await admin.from('enrollments').update({ status: 'dropped' }).eq('cohort_id', body.cohortId).eq('user_id', body.studentId);
      if (e3) return NextResponse.json({ ok: false, error: 'remove_failed', message: e3.message }, { status: 500 });

      /* §9, §76. Taking a child out of a batch was previously silent. When a
         parent asks why it happened, the answer should be a row rather than
         somebody's recollection. */
      await recordAdminAction(admin, {
        adminId, action: 'student_removed_from_batch',
        targetType: 'user', targetId: body.studentId,
        metadata: { cohort_id: body.cohortId, previous_status: 'active', new_status: 'dropped' },
      });

      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
  }
}
