import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';

/**
 * SARIRO — GET /api/admin/unresolved-classes
 *
 * Classes that are over, still marked 'scheduled', and that the teacher never
 * pressed Start on.
 *
 * ── Why a person has to look at these ───────────────────────────────────────
 * There are two completely different things this can mean, worth ₹1,250 apart:
 *
 *   the class HAPPENED and nobody touched the button    → pay in full
 *   the teacher never turned up                         → −₹1,000
 *
 * No timestamp distinguishes them, because the missing timestamp IS the
 * problem. The stale-class cron deliberately refuses to guess: deciding
 * wrongly either pays for a class that never happened or fines a teacher a
 * thousand rupees for a class they taught, and the second one costs their
 * trust in every other rule we have.
 *
 * So the cron closes what it can prove and this route hands the rest to a
 * human, with everything they need to make the call in one place: who was
 * teaching, who was expected, whether anybody was marked present, and whether
 * the students turned up to a room with nobody in it.
 *
 * ── Attendance is the tell ──────────────────────────────────────────────────
 * A class with students marked present almost certainly happened. A class with
 * nothing recorded at all, hours later, usually did not. Neither is proof, so
 * both are shown rather than acted on.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Long enough that a teacher marking the register over dinner is never chased. */
const STALE_AFTER_HOURS = 6;
const MAX_ROWS = 100;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const rl = rateLimit({ key: `unresolved:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let supa;
  try { supa = await createServerClientHelper(); } catch {
    return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 });
  }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  const admin = createServiceClient();
  const { data: me } = await admin
    .from('profiles').select('role, is_admin, is_super_admin').eq('id', user.id).maybeSingle();
  const role = me?.role ?? (me?.is_super_admin ? 'super_admin' : me?.is_admin ? 'admin' : 'student');
  if (!['admin', 'super_admin'].includes(role as string)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - STALE_AFTER_HOURS * 3_600_000).toISOString();
  const { data: rows, error } = await admin
    .from('bookings')
    .select('id, slot_start, slot_end, teacher_id, cohort_id, is_trial, lesson_name, trial_student_id')
    .eq('status', 'scheduled')
    .is('teacher_started_at', null)
    .lt('slot_end', cutoff)
    .order('slot_start', { ascending: true })
    .limit(MAX_ROWS);

  if (error) {
    return NextResponse.json({ ok: false, error: 'query_failed', message: error.message }, { status: 500 });
  }

  const bookings = rows ?? [];
  if (bookings.length === 0) return NextResponse.json({ ok: true, classes: [] });

  const ids = bookings.map((b) => b.id as string);
  const teacherIds = [...new Set(bookings.map((b) => b.teacher_id as string).filter(Boolean))];
  const cohortIds = [...new Set(bookings.map((b) => b.cohort_id as string).filter(Boolean))];

  const [att, teachers, cohorts, seats] = await Promise.all([
    admin.from('session_attendance').select('booking_id, status').in('booking_id', ids),
    teacherIds.length
      ? admin.from('profiles').select('id, full_name').in('id', teacherIds)
      : Promise.resolve({ data: [] }),
    cohortIds.length
      ? admin.from('cohorts').select('id, batch_code, track, level').in('id', cohortIds)
      : Promise.resolve({ data: [] }),
    admin.from('trial_participants').select('booking_id, student_id').in('booking_id', ids),
  ]);

  const teacherName = new Map<string, string | null>(
    ((teachers.data ?? []) as { id: string; full_name: string | null }[]).map((t) => [t.id, t.full_name])
  );
  const cohortOf = new Map<string, { batch_code: string | null; track: string | null; level: string | null }>(
    ((cohorts.data ?? []) as { id: string; batch_code: string | null; track: string | null; level: string | null }[])
      .map((c) => [c.id, c])
  );

  /* Attendance per class, split by what it says. "Somebody was marked present"
     is the strongest signal available that the class actually happened. */
  const marks = new Map<string, { present: number; absent: number; total: number }>();
  for (const a of (att.data ?? []) as { booking_id: string; status: string }[]) {
    const m = marks.get(a.booking_id) ?? { present: 0, absent: 0, total: 0 };
    m.total++;
    if (a.status === 'present' || a.status === 'late') m.present++;
    if (a.status === 'absent') m.absent++;
    marks.set(a.booking_id, m);
  }

  const seatCount = new Map<string, number>();
  for (const s of (seats.data ?? []) as { booking_id: string }[]) {
    seatCount.set(s.booking_id, (seatCount.get(s.booking_id) ?? 0) + 1);
  }

  const classes = bookings.map((b) => {
    const id = b.id as string;
    const m = marks.get(id) ?? { present: 0, absent: 0, total: 0 };
    const c = b.cohort_id ? cohortOf.get(b.cohort_id as string) : null;
    return {
      bookingId: id,
      slotStart: b.slot_start as string,
      isTrial: !!b.is_trial,
      lessonName: (b.lesson_name as string | null) ?? null,
      teacherId: (b.teacher_id as string | null) ?? null,
      teacherName: b.teacher_id ? teacherName.get(b.teacher_id as string) ?? null : null,
      batch: c?.batch_code ?? null,
      course: c ? [c.track, c.level].filter(Boolean).join(' · ') : null,
      seats: b.is_trial ? (seatCount.get(id) ?? (b.trial_student_id ? 1 : 0)) : null,
      attendance: m,
      /* Stated, not decided. A class with somebody marked present very
         probably happened; one with nothing recorded hours later probably did
         not. Both are shown so the person choosing can see why. */
      hint: m.present > 0
        ? 'Students were marked present — this class most likely happened.'
        : m.total === 0
          ? 'No attendance was ever recorded.'
          : 'Attendance was recorded, but nobody was marked present.',
      hoursAgo: Math.floor((Date.now() - Date.parse(b.slot_end as string)) / 3_600_000),
    };
  });

  return NextResponse.json({ ok: true, classes, staleAfterHours: STALE_AFTER_HOURS });
}
