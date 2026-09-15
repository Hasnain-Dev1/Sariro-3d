import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, rateLimitedResponse, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { playbookFor, cleanIntake, type TrialIntake } from '@/lib/trial/playbooks';
import { mergeIntake } from '@/lib/trial/intake';

/**
 * SARIRO — /api/trial/intake
 *
 *   POST { bookingId, intake }            a family saves a step of trial prep
 *   GET  ?bookingId=&studentId=           the answers, for that child or their teacher
 *
 * ── Who may do what ─────────────────────────────────────────────────────────
 * Write: only a child who is IN that trial (a seat in trial_participants, or
 * the booking's own trial_student_id for a trial booked before seats existed),
 * and only for themselves — the id written is the session's, never the body's.
 *
 * Read: the child themselves; the teacher of that booking; and staff (admin,
 * super admin, HR). Another family in the same group trial may not read a
 * classmate's answers.
 *
 * ── Before the table exists ─────────────────────────────────────────────────
 * scripts/trial-intake.sql creates it. Until it is run, GET answers
 * `configured: false` and POST answers 503 with that reason, and /my-class keeps
 * the answers on the device and says so — rather than claiming the teacher can
 * see something they cannot.
 */
export const runtime = 'nodejs';

const STAFF = new Set(['admin', 'super_admin', 'hr']);
const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const tableMissing = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || /trial_intakes/.test(e.message ?? ''));

async function caller(): Promise<string | null> {
  try {
    const supa = await createServerClientHelper();
    const { data: { user } } = await supa.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

type Admin = ReturnType<typeof createServiceClient>;

async function loadBooking(admin: Admin, bookingId: string) {
  const { data } = await admin
    .from('bookings')
    .select('id, is_trial, status, slot_end, teacher_id, trial_student_id, trial_subject')
    .eq('id', bookingId)
    .maybeSingle();
  return data && data.is_trial ? data : null;
}

async function isInTrial(admin: Admin, booking: { id: string; trial_student_id: string | null }, studentId: string) {
  if (booking.trial_student_id === studentId) return true;
  const { data } = await admin
    .from('trial_participants').select('id').eq('booking_id', booking.id).eq('student_id', studentId).maybeSingle();
  return !!data;
}

async function isStaff(admin: Admin, userId: string) {
  const { data } = await admin.from('profiles').select('role, is_admin, is_super_admin').eq('id', userId).maybeSingle();
  return !!data && (STAFF.has(data.role as string) || data.is_admin === true || data.is_super_admin === true);
}

export async function GET(req: NextRequest) {
  const userId = await caller();
  if (!userId) return json({ ok: false, error: 'unauthorized' }, 401);

  const url = new URL(req.url);
  const bookingId = url.searchParams.get('bookingId') ?? '';
  const studentId = url.searchParams.get('studentId') || userId;
  if (!/^[0-9a-f-]{36}$/i.test(bookingId) || !/^[0-9a-f-]{36}$/i.test(studentId)) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const admin = createServiceClient();
  const booking = await loadBooking(admin, bookingId);
  if (!booking) return json({ ok: false, error: 'not_found' }, 404);

  const self = studentId === userId;
  const allowed = self
    ? await isInTrial(admin, booking, userId)
    : booking.teacher_id === userId || (await isStaff(admin, userId));
  if (!allowed) return json({ ok: false, error: 'forbidden' }, 403);
  if (!self && !(await isInTrial(admin, booking, studentId))) return json({ ok: false, error: 'not_found' }, 404);

  const { data, error } = await admin
    .from('trial_intakes').select('intake, updated_at').eq('booking_id', bookingId).eq('student_id', studentId).maybeSingle();
  if (tableMissing(error)) return json({ ok: true, configured: false, intake: null });
  if (error) {
    console.warn('[trial-intake] read failed:', error.code, error.message);
    return json({ ok: false, error: 'read_failed' }, 500);
  }
  return json({ ok: true, configured: true, intake: (data?.intake as TrialIntake | undefined) ?? null, updatedAt: data?.updated_at ?? null });
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return json({ ok: false, error: 'forbidden' }, 403);

  const userId = await caller();
  if (!userId) return json({ ok: false, error: 'unauthorized' }, 401);

  const rl = rateLimit({ key: `trial-intake:${userId}`, limit: 30, windowMs: 10 * 60_000, ip });
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterMs, 'Too many saves. Try again shortly.');

  let body: { bookingId?: string; intake?: unknown };
  try { body = await req.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  const bookingId = body.bookingId ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return json({ ok: false, error: 'bad_request' }, 400);

  const admin = createServiceClient();
  const booking = await loadBooking(admin, bookingId);
  if (!booking) return json({ ok: false, error: 'not_found' }, 404);
  if (!(await isInTrial(admin, booking, userId))) return json({ ok: false, error: 'forbidden' }, 403);
  if (booking.status === 'cancelled' || Date.parse(booking.slot_end as string) < Date.now()) {
    return json({ ok: false, error: 'closed', message: 'This class has already happened.' }, 409);
  }

  // Cleaned against the subject's own options: an id the playbook does not know is dropped.
  const patch = cleanIntake(playbookFor(booking.trial_subject as string | null), body.intake);

  const { data: existing, error: readErr } = await admin
    .from('trial_intakes').select('intake').eq('booking_id', bookingId).eq('student_id', userId).maybeSingle();
  if (tableMissing(readErr)) {
    return json({ ok: false, error: 'not_configured', message: 'Saved on this device — your teacher will ask you in class.' }, 503);
  }

  const now = new Date().toISOString();
  const intake = { ...mergeIntake((existing?.intake as TrialIntake | undefined) ?? null, patch), updatedAt: now };
  const { error } = await admin
    .from('trial_intakes')
    .upsert({ booking_id: bookingId, student_id: userId, intake, updated_at: now }, { onConflict: 'booking_id,student_id' });
  if (tableMissing(error)) {
    return json({ ok: false, error: 'not_configured', message: 'Saved on this device — your teacher will ask you in class.' }, 503);
  }
  if (error) {
    console.warn('[trial-intake] write failed:', error.code, error.message);
    return json({ ok: false, error: 'save_failed', message: 'We could not save that. Please try again.' }, 500);
  }
  return json({ ok: true, intake });
}
