import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';
import { lessonsOf } from '@/lib/dashboard/lesson-plan';
import { fillCourseSchedule } from '@/lib/dashboard/course-fill';
import { recordAdminAction } from '@/lib/audit/log';
import { canAssignCourse } from '@/lib/contact/reachability';
import { seatCapacity } from '@/lib/scheduling/batch-finder';
import { clashesAtCurrentTimes } from '@/lib/scheduling/batch-ops';
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
  const lessons = lessonsOf(opts.track, opts.level).map((l) => ({ module_num: l.moduleNum, lesson_name: l.name }));
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

/**
 * The first upcoming class of this batch that overlaps a class the child already
 * has in another batch — or null. Checked over the batch's next twelve classes.
 */
async function firstClash(admin: ReturnType<typeof createServiceClient>, studentId: string, cohortId: string): Promise<string | null> {
  const nowIso = new Date().toISOString();
  const { data: theirs } = await admin.from('enrollments').select('cohort_id').eq('user_id', studentId).eq('status', 'active').not('cohort_id', 'is', null);
  const others = [...new Set((theirs ?? []).map((e) => e.cohort_id as string).filter((c) => c !== cohortId))];
  if (!others.length) return null;
  const [{ data: upcoming }, { data: busy }] = await Promise.all([
    admin.from('bookings').select('slot_start, slot_end').eq('cohort_id', cohortId).eq('status', 'scheduled').gt('slot_end', nowIso).order('slot_start', { ascending: true }).limit(12),
    admin.from('bookings').select('slot_start, slot_end').in('cohort_id', others).eq('status', 'scheduled').gt('slot_end', nowIso),
  ]);
  const t = (v: unknown) => Date.parse(String(v));
  const hit = (upcoming ?? []).find((u) => (busy ?? []).some((b) => t(u.slot_start) < t(b.slot_end) && t(b.slot_start) < t(u.slot_end)));
  return hit ? String(hit.slot_start) : null;
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
      // The new teacher has to be free at the batch's times (lib/scheduling/batch-ops.ts).
      const { clashes } = await clashesAtCurrentTimes(admin, body.scheduleId, body.teacherId);
      if (clashes.length) {
        return NextResponse.json({
          ok: false, error: 'teacher_conflict', clashes,
          message: `This teacher is not free for ${clashes.length} of the batch's upcoming classes. Use Change teacher in Classes → Batch control to move the days and times with the teacher.`,
        }, { status: 409 });
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
      // And the rest of the course, labelled.
      await fillCourseSchedule(admin, body.scheduleId);

      await recordAdminAction(admin, {
        adminId, action: 'batch_teacher_changed',
        targetType: 'cohort_schedule', targetId: body.scheduleId,
        metadata: { new_teacher_id: body.teacherId },
      });

      return NextResponse.json({ ok: true });
    }

    case 'fill_course': {
      /* A batch made before 17 Sep 2026 has eight classes, not its course.
         Fills it: every missing class on its own days, each with its lesson. */
      if (!body.scheduleId) return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
      const filled = await fillCourseSchedule(admin, body.scheduleId);
      if (!filled.ok) {
        const why: Record<string, string> = {
          schedule_not_active: 'This batch is paused or has no teacher. Assign a teacher first.',
          no_teacher: 'This batch has no teacher. Assign one first.',
          no_days: 'This batch has no class days set. Use Change schedule first.',
        };
        return NextResponse.json({ ok: false, error: filled.reason, message: why[filled.reason ?? ''] ?? 'The course could not be scheduled.' }, { status: 409 });
      }
      await recordAdminAction(admin, {
        adminId, action: 'batch_course_filled',
        targetType: 'cohort_schedule', targetId: body.scheduleId,
        metadata: { added: filled.added, stamped: filled.stamped, total: filled.total, skipped: filled.skipped.length },
      });
      const { ok: _ok, ...result } = filled;
      return NextResponse.json({ ok: true, ...result });
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

      const { data: cohort } = await admin.from('cohorts').select('track, level, ratio, max_capacity, batch_code').eq('id', body.cohortId).maybeSingle();
      if (!cohort) return NextResponse.json({ ok: false, error: 'no_such_batch', message: 'That batch no longer exists.' }, { status: 404 });
      const { data: existing } = await admin.from('enrollments').select('id, status').eq('cohort_id', body.cohortId).eq('user_id', body.studentId).maybeSingle();

      /* ── A seat, one batch per course, and no clash (17 Sep 2026) ─────────
         Adding a child checked none of these: a 1:4 batch could take a fifth
         child, a child could sit in two batches of the same course, and a
         batch meeting when they already had another class went unnoticed. */
      if (!existing || existing.status !== 'active') {
        const { count: seated } = await admin.from('enrollments').select('id', { count: 'exact', head: true })
          .eq('cohort_id', body.cohortId).eq('status', 'active');
        const capacity = seatCapacity(cohort.ratio as string, cohort.max_capacity as number | null);
        if ((seated ?? 0) >= capacity) {
          return NextResponse.json({ ok: false, error: 'batch_full', message: `This batch is full (${seated}/${capacity}). Pick a batch with a free seat.` }, { status: 409 });
        }
        const { data: elsewhere } = await admin.from('enrollments').select('cohort_id')
          .eq('user_id', body.studentId).eq('status', 'active').eq('track', cohort.track).eq('level', cohort.level)
          .not('cohort_id', 'is', null).neq('cohort_id', body.cohortId).limit(1).maybeSingle();
        if (elsewhere) {
          const { data: other } = await admin.from('cohorts').select('batch_code').eq('id', elsewhere.cohort_id).maybeSingle();
          return NextResponse.json({ ok: false, error: 'already_in_course', message: `${kid.full_name || 'This child'} is already in batch ${other?.batch_code ?? 'another batch'} of this course. Remove them there first.` }, { status: 409 });
        }
        const clash = await firstClash(admin, body.studentId, body.cohortId);
        if (clash) {
          return NextResponse.json({ ok: false, error: 'student_clash', message: `${kid.full_name || 'This child'} already has another class at ${new Date(clash).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST, when this batch meets.` }, { status: 409 });
        }
      }

      /* A course paid for but not yet placed is this same seat — attach it rather than enrolling twice. */
      if (!existing) {
        const { data: unplaced } = await admin.from('enrollments').select('id')
          .eq('user_id', body.studentId).eq('status', 'active').is('cohort_id', null)
          .eq('track', cohort.track).eq('level', cohort.level).limit(1).maybeSingle();
        if (unplaced) {
          const { error: attachErr } = await admin.from('enrollments').update({ cohort_id: body.cohortId, ratio: cohort.ratio }).eq('id', unplaced.id);
          if (attachErr) return NextResponse.json({ ok: false, error: 'enroll_failed', message: attachErr.message }, { status: 500 });
          await backfillLessonProgressToBatch(admin, { cohortId: body.cohortId, enrollmentId: unplaced.id, track: cohort.track ?? null, level: cohort.level ?? null });
          await recordAdminAction(admin, {
            adminId, action: 'student_added_to_batch',
            targetType: 'user', targetId: body.studentId,
            metadata: { cohort_id: body.cohortId, enrollment_id: unplaced.id, placed_existing_enrollment: true },
          });
          return NextResponse.json({ ok: true, placed: true });
        }
      }
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
