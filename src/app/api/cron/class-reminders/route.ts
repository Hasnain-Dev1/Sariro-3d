import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notifyUsers } from '@/lib/notify';

/**
 * SARIRO — GET/POST /api/cron/class-reminders
 * =========================================================
 * "Your class starts in 30 minutes."
 *
 * The highest-value message this product can send, and until now it sent
 * nothing: every other notification is triggered by a human doing something, so
 * a learner's only defence against forgetting a class was remembering it.
 *
 * ── Called by a scheduler, not a person ──────────────────────────────────────
 * There is no session here, so the usual auth chain (cookie -> profile -> role)
 * has nothing to check. Instead it takes a shared secret in `Authorization:
 * Bearer <CRON_SECRET>` or `?key=`. **Without CRON_SECRET set, the route
 * refuses to run** rather than defaulting open — an unauthenticated endpoint
 * that writes notifications to arbitrary users is a spam vector, and a reminder
 * sent at 3am destroys more trust than a missed one.
 *
 * ── Why it cannot double-send ────────────────────────────────────────────────
 * It CLAIMS each booking by stamping `reminder_sent_at` (see
 * `scripts/class-reminders.sql`) and only claims rows where it is still null.
 * The update is the lock: two overlapping runs cannot both claim the same row,
 * so the second finds nothing and sends nothing. Claiming happens BEFORE the
 * notification is written, which is the safe direction to fail — a reminder
 * that was claimed but not delivered is one missed message; a reminder
 * delivered but not claimed is the same message every ten minutes.
 *
 * ── The window ───────────────────────────────────────────────────────────────
 * Looks for classes starting within the next `windowMin` (default 35). The
 * window only needs to be LARGER than the cron interval — anything caught early
 * is simply reminded slightly sooner, and `reminder_sent_at` guarantees it is
 * reminded once. A window smaller than the interval silently drops classes,
 * which is the failure mode worth engineering against.
 *
 * ── Email is deliberately OFF by default ─────────────────────────────────────
 * Decision D4 (WhatsApp vs email for reminders) is the founder's and is still
 * open, and `lib/notify` is explicit that an email which did not need to be sent
 * trains people to ignore the next one. In-app plus the existing desktop chime
 * covers anyone with the dashboard open, which is who these are for. Pass
 * `?email=1` to turn it on once that decision is made.
 *
 * Set up (Hostinger cron, every 10 minutes):
 *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
 *     https://sariro.com/api/cron/class-reminders
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_WINDOW_MIN = 35;
const MAX_WINDOW_MIN = 180;
/** Safety cap: one run should never fan out to an unbounded number of writes. */
const MAX_BOOKINGS_PER_RUN = 200;

interface DueBooking {
  id: string;
  cohort_id: string;
  teacher_id: string | null;
  slot_start: string;
  module_num: string | null;
  lesson_name: string | null;
}

function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Fail closed. An open endpoint here can spam every user in the database.
  if (!secret) return false;

  const header = req.headers.get('authorization') ?? '';
  if (header === `Bearer ${secret}`) return true;

  // Query-param fallback: some cron runners cannot set headers. Same secret,
  // and it never appears in a user-facing URL.
  return new URL(req.url).searchParams.get('key') === secret;
}

/** "in 28 minutes" / "in a minute" — never "in 0 minutes". */
function minutesUntil(iso: string): string {
  const mins = Math.max(1, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
  return mins === 1 ? 'in a minute' : `in ${mins} minutes`;
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

  const params = new URL(req.url).searchParams;
  const windowMin = Math.min(
    MAX_WINDOW_MIN,
    Math.max(1, Number(params.get('windowMin')) || DEFAULT_WINDOW_MIN)
  );
  const sendEmail = params.get('email') === '1';
  const dryRun = params.get('dryRun') === '1';

  const admin = createServiceClient();
  const now = new Date();
  const until = new Date(now.getTime() + windowMin * 60_000);

  const { data: due, error: dueErr } = await admin
    .from('bookings')
    .select('id, cohort_id, teacher_id, slot_start, module_num, lesson_name')
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null)
    .gt('slot_start', now.toISOString())
    .lte('slot_start', until.toISOString())
    .order('slot_start', { ascending: true })
    .limit(MAX_BOOKINGS_PER_RUN);

  if (dueErr) {
    return NextResponse.json({ ok: false, error: 'query_failed', message: dueErr.message }, { status: 500 });
  }

  const bookings = (due ?? []) as DueBooking[];
  if (bookings.length === 0) {
    return NextResponse.json({ ok: true, windowMin, due: 0, reminded: 0, notified: 0 });
  }
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      windowMin,
      due: bookings.length,
      bookings: bookings.map((b) => ({ id: b.id, slotStart: b.slot_start })),
    });
  }

  let reminded = 0;
  let notified = 0;

  for (const booking of bookings) {
    // CLAIM FIRST. `.is('reminder_sent_at', null)` in the update is what makes
    // this a lock: if a concurrent run already claimed it, zero rows match and
    // we skip. Selecting the id back tells us whether we won the claim.
    const { data: claimed } = await admin
      .from('bookings')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', booking.id)
      .is('reminder_sent_at', null)
      .select('id');

    if (!claimed || claimed.length === 0) continue;
    reminded++;

    const { data: roster } = await admin
      .from('enrollments')
      .select('user_id')
      .eq('cohort_id', booking.cohort_id)
      .eq('status', 'active');

    const studentIds = [
      ...new Set<string>(
        (roster ?? [])
          .map((r: { user_id: string | null }) => r.user_id)
          .filter((id): id is string => !!id)
      ),
    ];

    const when = minutesUntil(booking.slot_start);
    const lesson = booking.lesson_name?.trim();
    const detail = lesson ? `Today: ${lesson}.` : null;

    const inputs = [
      ...studentIds.map((userId) => ({
        userId,
        type: 'session_reminder' as const,
        title: `Your class starts ${when}`,
        message: detail,
        link: '/dashboard/student/next-class',
        email: sendEmail,
      })),
      // The teacher too. A teacher who forgets costs more than a student who
      // does — the whole batch sits in an empty room.
      ...(booking.teacher_id
        ? [
            {
              userId: booking.teacher_id,
              type: 'session_reminder' as const,
              title: `You are teaching ${when}`,
              message: detail,
              link: '/dashboard/teacher',
              email: sendEmail,
            },
          ]
        : []),
    ];

    if (inputs.length > 0) {
      const results = await notifyUsers(inputs);
      notified += results.filter((r) => r.inApp).length;
    }
  }

  return NextResponse.json({
    ok: true,
    windowMin,
    emailed: sendEmail,
    due: bookings.length,
    reminded,
    notified,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

// POST as well, because some cron runners only issue POST.
export async function POST(req: NextRequest) {
  return run(req);
}
