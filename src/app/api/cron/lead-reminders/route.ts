import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { recordEvent } from '@/lib/events/log';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — GET/POST /api/cron/lead-reminders
 * ============================================================================
 * "You said you would ring the Sharmas at four."
 *
 * ── The same lock as the class reminders, for the same reason ───────────────
 * Each reminder is CLAIMED by stamping `notified_at` before the notification
 * is written, and only rows where it is still null are claimed. The update is
 * the lock: two overlapping runs cannot both take the same row. Claiming
 * first is the safe direction to fail — a claimed-but-undelivered reminder is
 * one missed nudge, whereas delivered-but-unclaimed is the same nudge every
 * ten minutes until somebody turns notifications off entirely.
 *
 * ── Fails closed, deliberately ──────────────────────────────────────────────
 * Without CRON_SECRET this route refuses to run. It writes notifications to
 * named users; open to the internet, that is a spam vector with somebody
 * else's name on it.
 *
 * ── Overdue reminders are NOT re-sent ───────────────────────────────────────
 * A reminder fires once. Chasing a seller every ten minutes about the same
 * lead trains them to dismiss the bell, which costs every future reminder too.
 * The Overdue Follow-Ups queue on their dashboard is the persistent version,
 * and it is quiet.
 *
 * Set up (Hostinger cron, every 10 minutes):
 *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
 *     https://sariro.com/api/cron/lead-reminders
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One run should never fan out to an unbounded number of writes. */
const MAX_PER_RUN = 200;

function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  if (header === `Bearer ${secret}`) return true;
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

  const params = new URL(req.url).searchParams;
  const dryRun = params.get('dryRun') === '1';

  let admin;
  try { admin = createServiceClient(); } catch {
    return NextResponse.json({ ok: false, error: 'service_unavailable' }, { status: 503 });
  }

  const now = new Date().toISOString();

  const { data: due, error } = await admin
    .from('lead_reminders')
    .select('id, lead_id, seller_id, due_at, body')
    .eq('status', 'pending')
    .is('notified_at', null)
    .lte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    /* Named, not swallowed. If lead_reminders does not exist yet the migration
       has not been run, and that is the whole answer — not "0 reminders". */
    console.warn('[lead-reminders] read failed:', error.code, error.message);
    return NextResponse.json(
      { ok: false, error: 'read_failed', message: error.message, hint: 'Has scripts/seller-pipeline-and-sale.sql been run?' },
      { status: 500 }
    );
  }

  const rows = due ?? [];
  if (rows.length === 0) return NextResponse.json({ ok: true, due: 0, sent: 0, dryRun });

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      due: rows.length,
      sent: 0,
      reminders: rows.map((r) => ({ id: r.id, leadId: r.lead_id, sellerId: r.seller_id, dueAt: r.due_at })),
    });
  }

  /* The names, in one read rather than one per reminder. A seller told to ring
     "lead 9f2c…" will not ring anybody. */
  const leadIds = [...new Set(rows.map((r) => r.lead_id as string))];
  const { data: leads } = await admin
    .from('student_leads')
    .select('id, student_name, phone, assigned_seller')
    .in('id', leadIds);
  const leadById = new Map(
    ((leads ?? []) as { id: string; student_name: string | null; assigned_seller: string | null }[])
      .map((l) => [l.id, l] as const)
  );

  let sent = 0;
  let skipped = 0;

  for (const r of rows) {
    /* ── Claim first ─────────────────────────────────────────────────────────
       Guarded on notified_at still being null, so a second run that read the
       same row before this one wrote finds nothing to update and moves on. */
    const { data: claimed, error: claimErr } = await admin
      .from('lead_reminders')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', r.id)
      .is('notified_at', null)
      .select('id')
      .maybeSingle();

    if (claimErr) {
      console.warn('[lead-reminders] claim failed:', r.id, claimErr.message);
      continue;
    }
    if (!claimed) { skipped += 1; continue; }

    const lead = leadById.get(r.lead_id as string);
    /* The reminder's own seller, not the lead's current one, unless the
       reminder has nobody. A transfer moves pending reminders across; one that
       somehow did not move still belongs to whoever it was set for. */
    const recipient = (r.seller_id as string | null) ?? (lead?.assigned_seller as string | null) ?? null;
    if (!recipient) { skipped += 1; continue; }

    const name = (lead?.student_name as string | null) ?? 'a lead';
    const ok = await bestEffort(
      'lead-reminders: notification',
      admin.from('notifications').insert({
        user_id: recipient,
        type: 'lead_followup_due',
        title: `Follow up: ${name}`,
        message: (r.body as string | null) || `Your follow-up on ${name} is due now.`,
        /* Deep-links to the lead itself. A reminder that lands on a dashboard
           and makes the seller search for the family is half a reminder. */
        link: `/dashboard/seller?lead=${r.lead_id}`,
      })
    );
    if (ok) sent += 1;

    await recordEvent(admin, {
      event: 'seller.reminder_due',
      subjectType: 'lead',
      subjectId: r.lead_id as string,
      actorId: recipient,
      payload: { reminderId: r.id, dueAt: r.due_at },
    });
  }

  return NextResponse.json({ ok: true, due: rows.length, sent, skipped });
}

export async function GET(req: NextRequest) { return run(req); }
export async function POST(req: NextRequest) { return run(req); }
