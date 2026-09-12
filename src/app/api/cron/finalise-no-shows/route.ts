import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notifyUsers } from '@/lib/notify';
import { TRIAL_HOME } from '@/lib/dashboard/trial-only';
import { bestEffort } from '@/lib/supabase/best-effort';
import {
  finaliseNoShow, isNoShowDue, NO_SHOW_COLUMNS, NO_SHOW_THRESHOLD_MIN, NO_SHOW_PENALTY,
  type NoShowBooking,
} from '@/lib/classes/finalise-no-show';

/**
 * SARIRO — GET/POST /api/cron/finalise-no-shows
 *
 * The teacher never pressed Start, and nobody was sitting in front of a screen
 * to say so.
 *
 * Until this existed, a no-show was only ever recorded when a student, teacher
 * or admin had the page open and clicked. On the live database that left NINE
 * trials in a row stuck as 'scheduled' — no penalty, nobody excused, no lead
 * moving, and a family with no idea what happened. close-stale-classes sees
 * the same rows and deliberately refuses to judge them; this route is the
 * judgement, made on the founder's instruction to apply it automatically.
 *
 * ── The backlog is left alone on purpose ────────────────────────────────────
 * Only classes from the last couple of days are decided. Reaching back weeks
 * and charging a teacher ₹1,000 each for classes nobody ever queried is not
 * automation, it is a surprise invoice. Older rows are counted and reported,
 * and `?backlog=1` will sweep them when a person decides to.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** How far back the sweep will decide anything without being asked. */
const MAX_AGE_HOURS = 48;

/** One run should never touch an unbounded number of rows. */
const MAX_PER_RUN = 100;

function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed. This route writes booking statuses, and it moves money.
  if (!secret) return false;
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get('key') === secret;
}

async function run(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'unauthorised',
        message: process.env.CRON_SECRET
          ? 'Bad or missing cron secret.'
          : 'CRON_SECRET is not set on the server, so this route is disabled.',
      },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const includeBacklog = url.searchParams.get('backlog') === '1';

  const admin = createServiceClient();
  const now = Date.now();
  const dueBefore = new Date(now - NO_SHOW_THRESHOLD_MIN * 60_000).toISOString();
  const floor = new Date(now - MAX_AGE_HOURS * 3_600_000).toISOString();

  let query = admin
    .from('bookings')
    .select(NO_SHOW_COLUMNS)
    .eq('status', 'scheduled')
    .is('teacher_started_at', null)
    .lt('slot_start', dueBefore)
    .order('slot_start', { ascending: true })
    .limit(MAX_PER_RUN);
  if (!includeBacklog) query = query.gte('slot_start', floor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: 'query_failed', message: error.message }, { status: 500 });
  }

  const candidates = ((data ?? []) as unknown as NoShowBooking[]).filter((b) => isNoShowDue(b, now));

  /* What is being left alone, so the number is visible rather than forgotten.
     A head count, not a read of the rows. */
  let backlog = 0;
  if (!includeBacklog) {
    const { count } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .is('teacher_started_at', null)
      .lt('slot_start', floor);
    backlog = count ?? 0;
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true, dryRun: true, wouldFinalise: candidates.length, backlogLeftAlone: backlog,
      classes: candidates.map((b) => ({ id: b.id, slotStart: b.slot_start, isTrial: !!b.is_trial })),
    });
  }

  let finalised = 0;
  let already = 0;
  const failures: string[] = [];

  for (const booking of candidates) {
    const outcome = await finaliseNoShow(admin, booking, now);
    if (!outcome.ok) { failures.push(`${booking.id}: ${outcome.reason}`); continue; }
    if (outcome.already) { already++; continue; }
    finalised++;

    /* The teacher is told, because money moved. Emailed: a penalty found weeks
       later in a payout is how trust goes. */
    if (booking.teacher_id) {
      await notifyUsers([{
        userId: booking.teacher_id,
        type: 'penalty_generated' as const,
        title: 'A class was marked as a no-show',
        message: `The class on ${new Date(booking.slot_start).toUTCString()} was never started, so it has been closed as a no-show and ₹${NO_SHOW_PENALTY} withheld. If that is wrong, tell an admin — it can be reversed.`,
        link: '/dashboard/teacher',
        email: true,
      }]);
    }

    /* The family, and — for a trial — the counsellor, because somebody now has
       to find them another time. A free class nobody turned up to teach is the
       worst possible first impression, and silence afterwards is worse. */
    const families = new Set<string>();
    if (booking.is_trial) {
      if (booking.trial_student_id) families.add(booking.trial_student_id);
      const { data: seats } = await admin
        .from('trial_participants').select('student_id').eq('booking_id', booking.id);
      for (const s of seats ?? []) families.add((s as { student_id: string }).student_id);
    }
    for (const studentId of families) {
      await notifyUsers([{
        userId: studentId,
        type: 'session_cancelled' as const,
        title: 'Your free class did not go ahead',
        message: 'We are very sorry — the teacher could not make it. Somebody from Sariro will call you to arrange another time.',
        link: TRIAL_HOME,
        email: true,
      }]);
      const nowIso = new Date().toISOString();
      await bestEffort(
        'no-show sweep: lead back to slot assistance',
        admin.from('student_leads')
          .update({ trial_status: 'slot_assistance', last_updated: nowIso, updated_at: nowIso })
          .eq('student_id', studentId)
      );
    }
  }

  return NextResponse.json({
    ok: true,
    considered: candidates.length,
    finalised,
    already,
    backlogLeftAlone: backlog,
    failures: failures.length ? failures : undefined,
  });
}

export async function GET(req: NextRequest) { return run(req); }
export async function POST(req: NextRequest) { return run(req); }
