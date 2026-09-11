import { NextRequest, NextResponse } from 'next/server';
import { requireActor } from '@/lib/auth/actor';
import { bucketLeads, queueCounts, type QueueLead } from '@/lib/seller/queues';
import { sellerMetrics, type MetricLead, type MetricSale } from '@/lib/seller/metrics';
import { computeIncentive, readIncentiveConfig, baseSalary } from '@/lib/seller/incentives';
import { monthWindow } from '@/lib/leads/seller-assignment';
import type { ReminderRow } from '@/lib/seller/reminders';
import { isMissingRelation, SELLER_SETUP_MESSAGE } from '@/lib/supabase/schema-gaps';

/**
 * SARIRO — everything a seller needs before their first call of the day
 * ============================================================================
 * GET /api/seller/dashboard[?sellerId=…]
 *
 * One request, because six were the alternative and six requests are six
 * chances for the screen to render half a picture — a queue with three leads
 * beside a badge that still says one, until the slowest of them lands.
 *
 * ── The bucketing happens on the server ─────────────────────────────────────
 * Not because it is expensive, but because the definitions must not be able to
 * differ between the dashboard, a future mobile view and whatever reports HR
 * asks for next. "Final conversation pending" is a phrase; it needs exactly
 * one implementation, and lib/seller/queues.ts is it.
 *
 * ── Feedback comes back with the lead, not on a second page ─────────────────
 * A seller ringing a family after a trial needs the teacher's rating, the
 * teacher's remark and the family's own rating in front of them. Today that is
 * three screens away, so the call gets made without it — which is the whole
 * reason the trial produced the feedback in the first place.
 *
 * ── It says when the database is not ready ──────────────────────────────────
 * The queues and leads come from tables that have always existed, so the page
 * works before the migration is run — but notes, reminders and sale punching
 * do not, and a seller whose notes silently vanish stops trusting all of it.
 * `setupMissing` says so, once, at the top of their screen.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'seller-dashboard',
    limit: 120,
    allow: ['super_admin', 'admin', 'hr', 'seller'],
    skipOriginCheck: true,
  });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  /* A seller only ever sees their own desk. Staff and HR may look at anybody's,
     which is what makes "how is Samaresh doing" answerable without a report. */
  const requested = req.nextUrl.searchParams.get('sellerId');
  const sellerId = (actor.isStaff || actor.isHR) && requested ? requested : actor.id;
  if (!(actor.isStaff || actor.isHR) && requested && requested !== actor.id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const { data: leadRows, error: leadErr } = await actor.admin
    .from('student_leads')
    .select(
      'id, student_name, parent_name, phone, phone_country_code, email, stage, trial_status, ' +
      'subject, grade, source, assigned_seller, booking_id, student_id, sale_value, ' +
      'created_at, last_updated, timezone'
    )
    .eq('assigned_seller', sellerId)
    .order('last_updated', { ascending: false })
    .limit(1000);

  if (leadErr) {
    console.warn('[seller-dashboard] leads read failed:', leadErr.code, leadErr.message);
    return NextResponse.json({ ok: false, error: 'read_failed', message: leadErr.message }, { status: 500 });
  }

  const leads = (leadRows ?? []) as unknown as (QueueLead & MetricLead & Record<string, unknown>)[];
  const leadIds = leads.map((l) => l.id);
  const bookingIds = leads.map((l) => l.booking_id).filter((b): b is string => typeof b === 'string');

  const [
    notesProbe,
    { data: reminderRows },
    { data: saleRows },
    { data: settingRows },
    { data: me },
    { data: salary },
    { data: saleStages },
    { data: feedbackRows },
    { data: bookingRows },
  ] = await Promise.all([
    /* Is the logbook there at all? Asked on its own, so the answer does not
       depend on whether this seller happens to have any leads. */
    actor.admin.from('lead_notes').select('id', { head: true, count: 'exact' }).limit(1),
    leadIds.length
      ? actor.admin
          .from('lead_reminders')
          .select('id, lead_id, due_at, status, body, seller_id, completed_at, cancelled_at, notified_at')
          .in('lead_id', leadIds)
          .limit(2000)
      : Promise.resolve({ data: [] as ReminderRow[] }),
    actor.admin
      .from('sales')
      .select('id, seller_id, amount, punched_at, refunded_at, lead_id, invoice_number, student_name, sold_on')
      .eq('seller_id', sellerId)
      .limit(2000),
    actor.admin.from('app_settings').select('key, value').like('key', 'seller_%'),
    actor.admin.from('profiles').select('id, full_name').eq('id', sellerId).maybeSingle(),
    /* Separate from the name, so a missing column cannot blank the whole row. */
    actor.admin.from('profiles').select('seller_base_salary').eq('id', sellerId).maybeSingle(),
    leadIds.length
      ? actor.admin.from('student_leads').select('id, sale_stage').in('id', leadIds)
      : Promise.resolve({ data: [] as { id: string; sale_stage: string | null }[] }),
    bookingIds.length
      ? actor.admin
          .from('class_feedback')
          .select('booking_id, author_role, subject_student_id, rating, remarks, interest_level, created_at')
          .in('booking_id', bookingIds)
          .limit(2000)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    bookingIds.length
      ? actor.admin
          .from('bookings')
          .select('id, slot_start, slot_end, status, trial_subject, teacher_id, google_meet_url, teacher:teacher_id(full_name)')
          .in('id', bookingIds)
          .limit(2000)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const setupMissing = isMissingRelation(notesProbe.error);
  const reminders = (reminderRows ?? []) as unknown as ReminderRow[];
  const sales = (saleRows ?? []) as unknown as MetricSale[];
  const saleStageById = new Map(
    ((saleStages ?? []) as { id: string; sale_stage: string | null }[]).map((r) => [r.id, r.sale_stage])
  );

  /* ── Stitch the trial and its two opinions onto each lead ───────────────── */
  const bookingById = new Map(
    ((bookingRows ?? []) as Record<string, unknown>[]).map((b) => [String(b.id), b])
  );
  const feedbackByBooking = new Map<string, Record<string, unknown>[]>();
  for (const f of (feedbackRows ?? []) as Record<string, unknown>[]) {
    const key = String(f.booking_id);
    const list = feedbackByBooking.get(key) ?? [];
    list.push(f);
    feedbackByBooking.set(key, list);
  }

  const enriched = leads.map((lead) => {
    const bookingId = typeof lead.booking_id === 'string' ? lead.booking_id : null;
    const booking = bookingId ? bookingById.get(bookingId) ?? null : null;
    const feedback = bookingId ? feedbackByBooking.get(bookingId) ?? [] : [];

    /* The teacher's write-up ABOUT THIS CHILD, not about the class. A trial can
       hold four children and "the class went well" is worthless to a seller
       with three families to ring. */
    const teacherFeedback = feedback.find(
      (f) => f.author_role === 'teacher' &&
        (!lead.student_id || f.subject_student_id === lead.student_id || f.subject_student_id === null)
    ) ?? null;

    /* The family's own rating of the trial. A different question with a
       different answer — never averaged with the one above. */
    const studentFeedback = feedback.find((f) => f.author_role === 'student') ?? null;

    return {
      ...lead,
      sale_stage: saleStageById.get(lead.id) ?? null,
      trial: booking
        ? {
            id: booking.id,
            slot_start: booking.slot_start,
            slot_end: booking.slot_end,
            status: booking.status,
            subject: booking.trial_subject ?? lead.subject ?? null,
            teacher_name: (booking.teacher as { full_name?: string } | null)?.full_name ?? null,
            join_url: booking.google_meet_url ?? null,
          }
        : null,
      teacher_rating: teacherFeedback?.rating ?? null,
      teacher_remarks: teacherFeedback?.remarks ?? null,
      interest_level: teacherFeedback?.interest_level ?? null,
      student_rating: studentFeedback?.rating ?? null,
      student_remarks: studentFeedback?.remarks ?? null,
    };
  });

  /* ── The six queues, and the numbers ─────────────────────────────────────
     Bucketed from the SAME array that is returned, so a badge can never
     disagree with the list beneath it. */
  const buckets = bucketLeads(enriched as QueueLead[], reminders);
  const counts = queueCounts(buckets);

  const metrics = sellerMetrics(enriched as MetricLead[], sales);

  /* Incentives are earned on PUNCHED sales in the current month, windowed by
     the same function the metrics used — a sale punched at 00:30 IST on the
     1st belongs to the new month, and a second implementation of that
     boundary is a second chance to put somebody's commission in the wrong one. */
  const config = readIncentiveConfig(settingRows ?? []);
  const { start, end } = monthWindow();
  const monthStart = Date.parse(start);
  const monthEnd = Date.parse(end);
  const punchedThisMonth = sales.filter((s) => {
    if (!s.punched_at || s.refunded_at) return false;
    const t = Date.parse(s.punched_at);
    return Number.isFinite(t) && t >= monthStart && t < monthEnd;
  });
  const incentive = computeIncentive(
    punchedThisMonth.map((s) => ({ id: s.id, amount: Number(s.amount) || 0 })),
    config
  );

  const own = (salary as { seller_base_salary?: number | string | null } | null)?.seller_base_salary ?? null;
  const base = baseSalary(own == null ? null : Number(own), settingRows ?? []);

  return NextResponse.json({
    ok: true,
    setupMissing,
    setupMessage: setupMissing ? SELLER_SETUP_MESSAGE : null,
    sellerId,
    sellerName: (me as { full_name?: string | null } | null)?.full_name ?? null,
    queues: buckets,
    counts,
    metrics,
    incentive,
    pay: { base, incentive: incentive.total, total: base + incentive.total },
    reminders,
    leads: enriched,
  });
}
