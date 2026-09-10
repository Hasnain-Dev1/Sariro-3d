import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { MIN_GRADE, MAX_GRADE } from '@/lib/trial/grade-band';

/**
 * SARIRO — GET/POST /api/admin/trial-grades
 *
 * The children sitting in an upcoming trial whose grade nobody ever recorded.
 *
 * ── Why this is worth its own screen ────────────────────────────────────────
 * A trial holds four children within one year of each other, and the first
 * child to book fixes the band. A seat with no grade cannot be banded at all,
 * so joinable() correctly refuses everybody — which means the class stops
 * being offered as a class to join, and the next family who books opens a
 * brand new one instead of filling a seat.
 *
 * That is not theoretical. Every trial seat in production has grade NULL, so
 * all four upcoming classes are invisible as joining opportunities: twelve
 * empty seats, and a teacher's evening spent again for each new booking.
 *
 * The cause was a route that validated the grade and then dropped it on the
 * insert, fixed separately. This is the other half — the seats already written
 * that way, and the only place in the product that can repair them.
 *
 * Writing a grade here sets it on the profile AND on every seat that child
 * holds, because a band is read from the seat: the grade they were in when
 * they joined, not what their profile says today after a September rollover.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  let supa;
  try { supa = await createServerClientHelper(); } catch { return null; }
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return null;
  const admin = createServiceClient();
  const { data: me } = await admin
    .from('profiles').select('role, is_admin, is_super_admin, is_seller').eq('id', user.id).maybeSingle();
  const role = me?.role
    ?? (me?.is_super_admin ? 'super_admin' : me?.is_admin ? 'admin' : me?.is_seller ? 'seller' : 'student');
  // Sellers book trials, so sellers can record a grade.
  if (!['admin', 'super_admin', 'seller'].includes(role as string)) return null;
  return { admin, userId: user.id };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const { admin } = auth;

  /* Upcoming trials only. A class that has already happened cannot be joined,
     so its missing grade costs nothing and fixing it is busywork. */
  const { data: bookings } = await admin
    .from('bookings')
    .select('id, slot_start, teacher_id')
    .eq('is_trial', true)
    .not('status', 'in', '("cancelled","no_show","completed")')
    .gte('slot_end', new Date().toISOString())
    .order('slot_start', { ascending: true });

  const ids = (bookings ?? []).map((b) => b.id as string);
  if (ids.length === 0) return NextResponse.json({ ok: true, seats: [] });

  const { data: seats } = await admin
    .from('trial_participants')
    .select('id, booking_id, student_id, grade')
    .in('booking_id', ids);

  const missing = (seats ?? []).filter((s) => s.grade === null || s.grade === undefined);
  if (missing.length === 0) return NextResponse.json({ ok: true, seats: [] });

  const studentIds = [...new Set(missing.map((s) => String(s.student_id)))];
  const { data: people } = await admin
    .from('profiles').select('id, full_name, email, grade').in('id', studentIds);
  const who = new Map(
    ((people ?? []) as { id: string; full_name: string | null; email: string | null; grade: number | null }[])
      .map((p) => [p.id, p])
  );
  const slotOf = new Map((bookings ?? []).map((b) => [b.id as string, b.slot_start as string]));

  /* One row per CHILD, not per seat. A child booked into two upcoming trials
     is one question, asked once. */
  const byStudent = new Map<string, { seatIds: string[]; slots: string[] }>();
  for (const s of missing) {
    const k = String(s.student_id);
    const e = byStudent.get(k) ?? { seatIds: [], slots: [] };
    e.seatIds.push(String(s.id));
    const slot = slotOf.get(String(s.booking_id));
    if (slot) e.slots.push(String(slot));
    byStudent.set(k, e);
  }

  return NextResponse.json({
    ok: true,
    seats: [...byStudent.entries()].map(([studentId, e]) => {
      const p = who.get(studentId);
      return {
        studentId,
        name: p?.full_name ?? p?.email ?? 'Unnamed student',
        email: p?.email ?? null,
        /* Their profile may already know, even though the seat does not — the
           public form records it and the staff route used to drop it. Offered
           as the obvious answer rather than making somebody guess again. */
        profileGrade: p?.grade ?? null,
        seatCount: e.seatIds.length,
        nextTrial: e.slots.sort()[0] ?? null,
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;
  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const { admin } = auth;

  const rl = rateLimit({ key: `trial-grades:${auth.userId}`, limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: { studentId?: string; grade?: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  if (!body.studentId) return NextResponse.json({ ok: false, error: 'missing_student' }, { status: 400 });

  const grade = Math.round(Number(body.grade));
  if (!Number.isFinite(grade) || grade < MIN_GRADE || grade > MAX_GRADE) {
    return NextResponse.json(
      { ok: false, error: 'bad_grade', message: `A grade must be between ${MIN_GRADE} and ${MAX_GRADE}.` },
      { status: 400 }
    );
  }

  const { error: pErr } = await admin.from('profiles').update({ grade }).eq('id', body.studentId);
  if (pErr) return NextResponse.json({ ok: false, error: 'update_failed', message: pErr.message }, { status: 500 });

  /* Only seats that are still blank. Overwriting a recorded grade would
     re-band a class that has already been sold on the level it teaches at. */
  const { data: bookings } = await admin
    .from('bookings').select('id').eq('is_trial', true)
    .not('status', 'in', '("cancelled","no_show","completed")')
    .gte('slot_end', new Date().toISOString());
  const ids = (bookings ?? []).map((b) => b.id as string);

  let seatsFixed = 0;
  if (ids.length > 0) {
    const { data: updated } = await admin
      .from('trial_participants')
      .update({ grade })
      .eq('student_id', body.studentId)
      .in('booking_id', ids)
      .is('grade', null)
      .select('id');
    seatsFixed = (updated ?? []).length;
  }

  return NextResponse.json({ ok: true, grade, seatsFixed });
}
