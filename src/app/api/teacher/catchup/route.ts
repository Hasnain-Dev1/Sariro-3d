import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { resolveActor } from '@/lib/dashboard/schedule-ops-server';
import {
  summariseCase, readEscalationConfig, type CatchUpObligation,
} from '@/lib/credits/catchup-escalation';

/**
 * SARIRO — GET/POST /api/teacher/catchup
 *
 * The lessons a teacher owes, and the two things they can do about them.
 *
 * A child paid for lessons their group covered while their classes were
 * paused. Each one is a separate half-hour session, and the only person who
 * can arrange it is their teacher. The Super Admin is deliberately not in this
 * loop — see lib/credits/catchup-escalation.ts for when they finally are.
 *
 *   GET                                 what I owe, grouped by student
 *   POST { action: 'schedule', ... }    book one, 30 minutes
 *   POST { action: 'complete', ... }    it happened: credit spent, ₹200 earned
 *
 * ── Why scheduling checks the balance again ─────────────────────────────────
 * The panel only offers lessons that are funded, but the panel is a courtesy.
 * A stale tab, two teachers on a shared batch, and a POST typed by hand all
 * arrive here, and a catch-up session that nobody paid for is a teacher's half
 * hour given away.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_MINUTES_DEFAULT = 30;
const INCENTIVE_DEFAULT = 200;

interface Body {
  action?: 'schedule' | 'complete';
  catchupLessonId?: string;
  /** ISO instant. Required to schedule. */
  slotStart?: string;
}

async function settings(admin: ReturnType<typeof createServiceClient>) {
  const { data } = await admin.from('app_settings').select('key, value');
  const map = Object.fromEntries(
    ((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value])
  );
  const num = (k: string, d: number) => {
    const n = Number(map[k]);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    escalation: readEscalationConfig(map),
    minutes: num('catchup_session_minutes', SESSION_MINUTES_DEFAULT),
    incentive: num('catchup_teacher_incentive', INCENTIVE_DEFAULT),
  };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const admin = createServiceClient();
  const cfg = await settings(admin);

  /* A teacher sees their own. An admin sees everything, because the compliance
     panels are built on this same shape. */
  let q = admin.from('catchup_lessons')
    .select('id, student_id, cohort_id, teacher_id, track, level, lesson_number, lesson_title, status, created_at, scheduling_deadline, scheduled_at, completed_at, booking_id')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true });
  if (!actor.isAdmin) q = q.eq('teacher_id', actor.userId);

  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: 'query_failed', message: error.message }, { status: 500 });

  const lessons = (rows ?? []) as Record<string, unknown>[];
  if (lessons.length === 0) {
    return NextResponse.json({ ok: true, students: [], incentive: cfg.incentive, minutes: cfg.minutes });
  }

  const studentIds = [...new Set(lessons.map((l) => String(l.student_id)))];
  const [{ data: people }, { data: creditRows }] = await Promise.all([
    admin.from('profiles').select('id, full_name, email').in('id', studentIds),
    admin.from('credits').select('user_id, catchup_balance').in('user_id', studentIds),
  ]);
  const who = new Map(
    ((people ?? []) as { id: string; full_name: string | null; email: string | null }[])
      .map((p) => [p.id, p])
  );
  const catchupBalance = new Map(
    ((creditRows ?? []) as { user_id: string; catchup_balance: number | null }[])
      .map((c) => [c.user_id, Number(c.catchup_balance ?? 0)])
  );

  const now = Date.now();
  const byStudent = new Map<string, Record<string, unknown>[]>();
  for (const l of lessons) {
    const k = String(l.student_id);
    byStudent.set(k, [...(byStudent.get(k) ?? []), l]);
  }

  const students = [...byStudent.entries()].map(([studentId, ls]) => {
    const obligations: CatchUpObligation[] = ls.map((l) => ({
      id: String(l.id),
      lessonNumber: Number(l.lesson_number),
      lessonTitle: (l.lesson_title as string | null) ?? null,
      createdAt: String(l.created_at),
      scheduledAt: (l.scheduled_at as string | null) ?? null,
      completedAt: (l.completed_at as string | null) ?? null,
    }));
    const summary = summariseCase(obligations, now, cfg.escalation);
    const p = who.get(studentId);
    return {
      studentId,
      studentName: p?.full_name ?? p?.email ?? 'Student',
      course: [ls[0].track, ls[0].level].filter(Boolean).join(' · ') || null,
      catchupCredits: catchupBalance.get(studentId) ?? 0,
      lessons: ls.map((l) => ({
        id: String(l.id),
        lessonNumber: Number(l.lesson_number),
        lessonTitle: (l.lesson_title as string | null) ?? null,
        status: String(l.status),
        deadline: (l.scheduling_deadline as string | null) ?? null,
        scheduledAt: (l.scheduled_at as string | null) ?? null,
        completedAt: (l.completed_at as string | null) ?? null,
        bookingId: (l.booking_id as string | null) ?? null,
      })),
      summary,
    };
  })
    // The most overdue first: this list exists to be worked through.
    .sort((a, b) => b.summary.daysOverdue - a.summary.daysOverdue || b.summary.unscheduled - a.summary.unscheduled);

  return NextResponse.json({ ok: true, students, incentive: cfg.incentive, minutes: cfg.minutes });
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  const rl = rateLimit({ key: `catchup:${actor.userId}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  if (!body.catchupLessonId) return NextResponse.json({ ok: false, error: 'missing_lesson' }, { status: 400 });

  const admin = createServiceClient();
  const cfg = await settings(admin);

  const { data: lesson } = await admin
    .from('catchup_lessons')
    .select('id, student_id, teacher_id, cohort_id, track, level, lesson_number, lesson_title, status, booking_id')
    .eq('id', body.catchupLessonId).maybeSingle();
  if (!lesson) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  // The teacher who owes it, or an admin.
  if (!actor.isAdmin && lesson.teacher_id !== actor.userId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  /* ── Schedule ────────────────────────────────────────────────────────────── */
  if (body.action === 'schedule') {
    if (lesson.status !== 'pending_scheduling') {
      return NextResponse.json(
        { ok: false, error: 'already_scheduled', message: 'That lesson already has a session.' },
        { status: 409 }
      );
    }
    const startMs = Date.parse(body.slotStart ?? '');
    if (!Number.isFinite(startMs)) {
      return NextResponse.json({ ok: false, error: 'bad_slot', message: 'Choose a time for the session.' }, { status: 400 });
    }
    if (startMs < Date.now()) {
      return NextResponse.json({ ok: false, error: 'slot_in_past', message: 'That time has already passed.' }, { status: 409 });
    }

    /* The balance, checked here and not only in the panel. A session nobody
       paid for is half an hour of a teacher's evening given away. */
    const { data: cr } = await admin
      .from('credits').select('catchup_balance').eq('user_id', lesson.student_id).maybeSingle();
    if (Number(cr?.catchup_balance ?? 0) <= 0) {
      return NextResponse.json(
        { ok: false, error: 'no_catchup_credits', message: 'This student has no catch-up credits left.' },
        { status: 409 }
      );
    }

    const { data: teacher } = await admin
      .from('profiles').select('meet_url, full_name').eq('id', lesson.teacher_id).maybeSingle();

    const endIso = new Date(startMs + cfg.minutes * 60_000).toISOString();
    const { data: booking, error: bErr } = await admin.from('bookings').insert({
      teacher_id: lesson.teacher_id,
      // A catch-up sits outside the batch's own diary: it is one child, and
      // counting it as a group class would spend everyone else's credit.
      cohort_id: null,
      slot_start: new Date(startMs).toISOString(),
      slot_end: endIso,
      status: 'scheduled',
      google_meet_url: teacher?.meet_url ?? null,
      module_num: lesson.lesson_number,
      lesson_name: lesson.lesson_title ?? `Catch-up — lesson ${lesson.lesson_number}`,
    }).select('id').single();
    if (bErr || !booking) {
      return NextResponse.json({ ok: false, error: 'book_failed', message: bErr?.message }, { status: 500 });
    }

    const { error: uErr } = await admin.from('catchup_lessons').update({
      status: 'scheduled',
      booking_id: booking.id,
      scheduled_at: new Date(startMs).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', lesson.id).eq('status', 'pending_scheduling'); // only once
    if (uErr) return NextResponse.json({ ok: false, error: 'update_failed', message: uErr.message }, { status: 500 });

    await admin.from('notifications').insert({
      user_id: lesson.student_id,
      type: 'catchup_scheduled',
      title: 'Your catch-up session is booked',
      message:
        `Lesson ${lesson.lesson_number}${lesson.lesson_title ? ` — ${lesson.lesson_title}` : ''} ` +
        `with ${teacher?.full_name ?? 'your teacher'}, ${cfg.minutes} minutes.`,
      link: '/dashboard/student',
    }).then(() => {}, () => {});

    return NextResponse.json({ ok: true, bookingId: booking.id, slotEnd: endIso });
  }

  /* ── Complete ────────────────────────────────────────────────────────────── */
  if (body.action === 'complete') {
    if (lesson.status === 'completed') return NextResponse.json({ ok: true, already: true });
    if (lesson.status !== 'scheduled') {
      return NextResponse.json(
        { ok: false, error: 'not_scheduled', message: 'Schedule the session before marking it done.' },
        { status: 409 }
      );
    }

    /* The ledger row first — it is the claim, and it is what stops a second
       click spending a second credit. Same order as an ordinary class. */
    const { error: txErr } = await admin.from('credit_transactions').insert({
      user_id: lesson.student_id,
      amount: -1,
      type: 'catchup_session_debit',
      balance_kind: 'catchup',
      description: `Catch-up session — lesson ${lesson.lesson_number}`,
      related_booking_id: lesson.booking_id,
      created_by: actor.userId,
    });
    if (txErr) {
      return NextResponse.json({ ok: false, error: 'debit_failed', message: txErr.message }, { status: 500 });
    }

    const { data: cr } = await admin
      .from('credits').select('catchup_balance').eq('user_id', lesson.student_id).maybeSingle();
    // §25 — the MAIN balance is never touched by a catch-up.
    await admin.from('credits').upsert(
      { user_id: lesson.student_id, catchup_balance: Math.max(0, Number(cr?.catchup_balance ?? 0) - 1) },
      { onConflict: 'user_id' }
    );

    const nowIso = new Date().toISOString();
    await admin.from('catchup_lessons').update({
      status: 'completed', completed_at: nowIso, updated_at: nowIso,
    }).eq('id', lesson.id);

    if (lesson.booking_id) {
      await admin.from('bookings').update({ status: 'completed' })
        .eq('id', lesson.booking_id).eq('status', 'scheduled');
    }

    /* §21 — the teacher is paid a flat fee for the session, separately from
       the ordinary class rate. Written directly rather than left to the
       completion trigger, which prices a class by its cohort and a catch-up
       has none. */
    const { data: paid } = await admin.from('teacher_earnings')
      .select('id').eq('booking_id', lesson.booking_id ?? '').maybeSingle();
    if (!paid) {
      await admin.from('teacher_earnings').insert({
        teacher_id: lesson.teacher_id,
        booking_id: lesson.booking_id,
        class_date: nowIso,
        lesson_name: `Catch-up — lesson ${lesson.lesson_number}`,
        track: lesson.track, level: lesson.level,
        ratio: '1:1', student_count: 1,
        base_amount: cfg.incentive, bonus_amount: 0,
        penalty_amount: 0, penalty_reason: null,
        net_amount: cfg.incentive, amount: cfg.incentive,
        status: 'pending',
      });
    }

    return NextResponse.json({ ok: true, incentive: cfg.incentive });
  }

  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
}
