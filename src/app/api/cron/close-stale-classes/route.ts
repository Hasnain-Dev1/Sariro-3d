import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * SARIRO — GET/POST /api/cron/close-stale-classes
 *
 * Classes that happened yesterday and are still marked 'scheduled'.
 *
 * Nothing closed them. auto-settle works on earnings that already exist;
 * finalize-noshow needs a human and a booking id. So a class nobody marked sat
 * as 'scheduled' for ever, and everything downstream waited with it: no
 * teacher_earnings row, no feedback prompt, no lead moving to its final stage.
 * Four trials were in that state when this was written.
 *
 * ── What it will and will not decide ────────────────────────────────────────
 * If the teacher pressed Start, the class demonstrably happened, and marking it
 * complete is bookkeeping. The earnings trigger then fires — including the
 * late-join penalty, which now actually runs.
 *
 * If they never pressed Start, this route does NOTHING but count it. It could
 * be a teacher no-show at −₹1,000, a class that ran while somebody forgot the
 * button, or a booking that was quietly abandoned. Those are three different
 * conversations and a cron job is not qualified to have any of them. Deciding
 * wrongly costs a teacher a thousand rupees and their trust in the system.
 *
 * So it reports them, and a person looks.
 *
 * Set up alongside the reminders (Hostinger cron, hourly is plenty):
 *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
 *     https://sariro.com/api/cron/close-stale-classes
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * How long after a class ends before it counts as abandoned.
 *
 * Long enough that a teacher finishing their evening and marking the register
 * over dinner is never overtaken by a robot.
 */
const STALE_AFTER_HOURS = 6;

/** One run should never touch an unbounded number of rows. */
const MAX_PER_RUN = 200;

function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed. This route writes booking statuses, which move money.
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

  const dryRun = new URL(req.url).searchParams.get('dryRun') === '1';
  const admin = createServiceClient();
  const cutoff = new Date(Date.now() - STALE_AFTER_HOURS * 3_600_000).toISOString();

  const { data, error } = await admin
    .from('bookings')
    .select('id, slot_start, slot_end, teacher_started_at, is_trial, teacher_id')
    .eq('status', 'scheduled')
    .lt('slot_end', cutoff)
    .order('slot_start', { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    return NextResponse.json({ ok: false, error: 'query_failed', message: error.message }, { status: 500 });
  }

  const stale = data ?? [];
  const started = stale.filter((b) => b.teacher_started_at);
  const neverStarted = stale.filter((b) => !b.teacher_started_at);

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      staleAfterHours: STALE_AFTER_HOURS,
      wouldComplete: started.length,
      needsAHuman: neverStarted.length,
      needsAHumanDetail: neverStarted.map((b) => ({
        id: b.id, slotStart: b.slot_start, isTrial: !!b.is_trial,
      })),
    });
  }

  /* One at a time on purpose. The completion trigger fires per row and writes
     a teacher_earnings row; a bulk update that half-succeeds would leave some
     classes closed and unpaid, which is the worst of both. */
  let completed = 0;
  for (const b of started) {
    const { error: upErr } = await admin
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', b.id)
      .eq('status', 'scheduled'); // still the lock: another run may have won
    if (!upErr) completed++;
  }

  return NextResponse.json({
    ok: true,
    staleAfterHours: STALE_AFTER_HOURS,
    found: stale.length,
    completed,
    /* Left alone deliberately. A teacher no-show is −₹1,000 and a forgotten
       button is nothing; a cron job cannot tell them apart. */
    needsAHuman: neverStarted.length,
    needsAHumanDetail: neverStarted.map((b) => ({
      id: b.id, slotStart: b.slot_start, isTrial: !!b.is_trial,
    })),
  });
}

export async function GET(req: NextRequest) { return run(req); }
export async function POST(req: NextRequest) { return run(req); }
