import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { freeSlots, localWeekdayMinutes, byWeekday, type Window } from '@/lib/scheduling/availability';
import { slotState, blockingIntervals, TRIAL_MINUTES, type SlotBooking } from '@/lib/scheduling/trial-capacity';
import { chooseSlots, type Candidate } from '@/lib/trial/public-slots';
import { bandOf, joinable, MIN_GRADE, MAX_GRADE, type GradeBand } from '@/lib/trial/grade-band';

/**
 * SARIRO — GET /api/trial/slots?seats=1
 *
 * Every time a parent could book a free class, across every teacher, as one
 * list. Public: no session, because the visitor arrived from an advert and
 * does not have one yet.
 *
 * ── Why the service role reads this and not the browser ─────────────────────
 * The seller's picker queries teacher_availability and bookings directly with
 * the visitor's own credentials. Doing that on a public page would mean
 * granting anonymous read on the staff rota and the class diary — which is the
 * shape of the business, published. A competitor would know how many teachers
 * there are, when they work, and how full they are.
 *
 * So the reading happens here and only the answer leaves: a list of times, a
 * seat count, and an opaque teacher id the booking request hands straight back.
 * No names, no totals, no empty evenings.
 *
 * ── Teachers with no room are not offered ───────────────────────────────────
 * A trial has no cohort to inherit a join link from, so a teacher who has not
 * set theirs would take the booking and leave the child with no way in. They
 * are filtered out here for the same reason /api/trial/book refuses them.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Two weeks. Far enough to find a time, near enough that people still turn up. */
const HORIZON_DAYS = 14;
/** Nothing sooner than this — a teacher needs to see it coming. */
const LEAD_MINUTES = 90;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  // Generous: the page re-reads this when the family size changes, and a
  // slow connection retries. Tight enough that it is not a scraping tool.
  const rl = rateLimit({ key: `trial-slots:${ip}`, limit: 40, windowMs: 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'One moment — too many requests.');

  const params = new URL(req.url).searchParams;
  const seats = Math.max(1, Math.min(4, Number(params.get('seats')) || 1));
  /* The child's grade. Without it every banded class is offered and the
     refusal happens at the click — see lib/trial/grade-band.ts for why a
     grade 1 and a grade 10 cannot share the half hour. */
  const rawGrade = Number(params.get('grade'));
  const grade = Number.isFinite(rawGrade) && rawGrade >= MIN_GRADE && rawGrade <= MAX_GRADE
    ? Math.round(rawGrade)
    : null;

  const admin = createServiceClient();

  const { data: teachers } = await admin
    .from('profiles')
    .select('id, timezone, meet_url')
    .or('role.eq.teacher,is_teacher.eq.true');

  // Only teachers who can actually take a trial: a timezone (or their 5pm is
  // unknowable) and a room (or the child cannot get in).
  const bookable = (teachers ?? []).filter((t) => t.timezone && t.meet_url);
  if (bookable.length === 0) {
    return NextResponse.json({ ok: true, slots: [], reason: 'no_bookable_teachers' });
  }
  const ids = bookable.map((t) => t.id as string);

  const now = new Date();
  const horizonEnd = new Date(now.getTime() + (HORIZON_DAYS + 2) * 86_400_000);

  const [availRes, bookingRes] = await Promise.all([
    admin.from('teacher_availability')
      .select('teacher_id, weekday, start_minute, end_minute')
      .in('teacher_id', ids),
    admin.from('bookings')
      .select('id, teacher_id, slot_start, slot_end, is_trial')
      .in('teacher_id', ids)
      .gte('slot_start', new Date(now.getTime() - 86_400_000).toISOString())
      .lte('slot_start', horizonEnd.toISOString())
      .not('status', 'in', '("cancelled","no_show")'),
  ]);

  /* Seats already taken in each trial. Without this a trial holding one child
     reads as a full class, its slot disappears, and the other three seats are
     never sold — the same bug the seller's picker had. */
  const rows = (bookingRes.data ?? []) as {
    id: string; teacher_id: string; slot_start: string; slot_end: string; is_trial: boolean | null;
  }[];
  const seatsBy = new Map<string, number>();
  /* And the band each class is already fixed at, read from the children in it
     in the order they joined — the first one anchors it. */
  const bandBy = new Map<string, GradeBand | null>();
  /* And whether we know that band at all. A class booked before grades were
     collected has children in it and nothing that says what level they are. */
  const knownBy = new Map<string, boolean>();
  const trialIds = rows.filter((r) => r.is_trial).map((r) => r.id);
  if (trialIds.length > 0) {
    const { data: parts } = await admin
      .from('trial_participants')
      .select('booking_id, grade, created_at')
      .in('booking_id', trialIds)
      .order('created_at', { ascending: true });
    const gradesBy = new Map<string, (number | null)[]>();
    for (const p of parts ?? []) {
      const k = p.booking_id as string;
      seatsBy.set(k, (seatsBy.get(k) ?? 0) + 1);
      const list = gradesBy.get(k) ?? [];
      list.push((p.grade as number | null) ?? null);
      gradesBy.set(k, list);
    }
    for (const [k, grades] of gradesBy) {
      bandBy.set(k, bandOf(grades));
      knownBy.set(k, joinable(grades.length, grades).ok);
    }
  }

  const windowsBy = new Map<string, Window[]>();
  for (const a of availRes.data ?? []) {
    const list = windowsBy.get(a.teacher_id as string) ?? [];
    list.push({ weekday: a.weekday as number, start: a.start_minute as number, end: a.end_minute as number });
    windowsBy.set(a.teacher_id as string, list);
  }

  const bookingsBy = new Map<string, SlotBooking[]>();
  for (const r of rows) {
    const list = bookingsBy.get(r.teacher_id) ?? [];
    list.push({
      bookingId: r.id,
      slotStart: r.slot_start,
      slotEnd: r.slot_end,
      isTrial: !!r.is_trial,
      // A trial row with no participants pre-dates that table and holds one
      // child on trial_student_id. Counting it empty would seat a fifth.
      seatsTaken: r.is_trial ? Math.max(1, seatsBy.get(r.id) ?? 0) : undefined,
    });
    bookingsBy.set(r.teacher_id, list);
  }

  const candidates: Candidate[] = [];

  for (const t of bookable) {
    const teacherId = t.id as string;
    const tz = t.timezone as string;
    const windows = windowsBy.get(teacherId) ?? [];
    if (windows.length === 0) continue;

    const mine = bookingsBy.get(teacherId) ?? [];
    const blocking = blockingIntervals(mine);
    const perDay = byWeekday(windows);

    for (let i = 0; i < HORIZON_DAYS; i++) {
      const dayStart = new Date(now.getTime() + i * 86_400_000);
      const probe = localWeekdayMinutes(dayStart.toISOString(), tz);
      if (!probe) continue;
      const dayWindows = perDay[probe.weekday];
      if (!dayWindows || dayWindows.length === 0) continue;

      const localDate = dayStart.toLocaleDateString('en-CA', { timeZone: tz });
      const busy: { start: number; end: number }[] = [];
      for (const b of blocking) {
        if (new Date(b.slotStart).toLocaleDateString('en-CA', { timeZone: tz }) !== localDate) continue;
        const s = localWeekdayMinutes(b.slotStart, tz);
        if (!s) continue;
        const len = Math.max(1, Math.round((Date.parse(b.slotEnd) - Date.parse(b.slotStart)) / 60_000));
        busy.push({ start: s.minutes, end: s.minutes + len });
      }

      /* The lead time applies to today only. Offering a class that starts in
         four minutes reads as available and is not: nobody has told the
         teacher, and the parent has to find a quiet room. */
      const earliestStart = i === 0 ? probe.minutes + LEAD_MINUTES : null;

      const starts = freeSlots({
        windows: dayWindows,
        busy,
        slotMinutes: TRIAL_MINUTES,
        stepMinutes: TRIAL_MINUTES,
        earliestStart,
      });

      for (const m of starts) {
        const iso = localMinutesToIso(localDate, m, tz);
        const state = slotState(iso, mine);
        candidates.push({
          teacherId,
          iso,
          state,
          band: state.joinBookingId ? bandBy.get(state.joinBookingId) ?? null : null,
          bandKnown: state.joinBookingId ? knownBy.get(state.joinBookingId) ?? false : true,
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    durationMinutes: TRIAL_MINUTES,
    slots: chooseSlots(candidates, seats, grade),
  });
}

/**
 * A local date plus minutes-from-midnight, back to a UTC instant.
 *
 * Solved by iteration rather than by assuming an offset, because a zone's
 * offset depends on the instant being solved for. Same approach as the
 * seller's picker; see lib/dashboard/trial-booking-data.ts.
 */
function localMinutesToIso(localDate: string, minutes: number, timeZone: string): string {
  const [y, m, d] = localDate.split('-').map(Number);
  let guess = Date.UTC(y, (m ?? 1) - 1, d ?? 1, Math.floor(minutes / 60), minutes % 60);
  for (let i = 0; i < 3; i++) {
    const seen = localWeekdayMinutes(new Date(guess).toISOString(), timeZone);
    if (!seen) break;
    let diff = minutes - seen.minutes;
    if (diff > 720) diff -= 1440;
    if (diff < -720) diff += 1440;
    if (diff === 0) break;
    guess += diff * 60_000;
  }
  return new Date(guess).toISOString();
}
