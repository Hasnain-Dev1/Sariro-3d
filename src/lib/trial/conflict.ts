import type { SupabaseClient } from '@supabase/supabase-js';
import { cityOf } from '@/lib/time/timezones';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — one live trial per course AND grade.
 *
 * ── The rule ────────────────────────────────────────────────────────────────
 * The pair (course, grade) is what a trial is FOR. A child may hold one live
 * trial per pair and as many pairs as they like:
 *
 *   Mathematics + G5   one at a time
 *   Mathematics + G6   a separate thing entirely — allowed alongside it
 *   Science + G5       also separate
 *
 * Course alone was the old rule, and it was wrong: it stopped a child trying
 * Mathematics at the level above, which is a different class, taught by a
 * different teacher, answering a different question.
 *
 * ── What a conflict means, and what it does not ─────────────────────────────
 * Finding one never refuses the booking. It asks. A family who says yes gets
 * the older booking cancelled and the new one in its place — because two
 * trials for the same course at the same grade means two teachers preparing
 * for the same child and two seats held out of a very small number.
 *
 *   'active'    — an upcoming class they have not had yet. Superseded on
 *                 confirmation; the cancelled one stays in their history.
 *   'completed' — they have already sat this one. Not an obstacle, but worth
 *                 saying: the new booking is a retry, and becomes the primary.
 *
 * A cancelled booking is no conflict at all, which is what makes "cancel it
 * first, then rebook" work without any special case.
 */

export type ConflictKind = 'active' | 'completed';

export interface TrialConflict {
  kind: ConflictKind;
  bookingId: string;
  slotStart: string;
  /** Already in their own time zone, ready to show. */
  when: string;
}

/** A trial reaches a student through their seat; the grade lives there too. */
async function seatsAt(
  admin: SupabaseClient,
  studentId: string,
  grade: number
): Promise<string[]> {
  const { data } = await admin
    .from('trial_participants')
    .select('booking_id, grade')
    .eq('student_id', studentId)
    .eq('grade', grade);
  return ((data ?? []) as { booking_id: string }[]).map((r) => r.booking_id);
}

export function whenIn(iso: string, timezone: string | null): string {
  const zone = timezone || 'Asia/Kolkata';
  try {
    return (
      new Date(iso).toLocaleString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: zone,
      }) + ` (${cityOf(zone)} time)`
    );
  } catch {
    return new Date(iso).toUTCString();
  }
}

export async function findTrialConflict(
  admin: SupabaseClient,
  studentId: string,
  subject: string,
  grade: number,
  timezone: string | null,
  nowMs: number = Date.now()
): Promise<TrialConflict | null> {
  const ids = await seatsAt(admin, studentId, grade);
  if (ids.length === 0) return null;

  const { data, error } = await admin
    .from('bookings')
    .select('id, slot_start, status')
    .in('id', ids)
    .eq('is_trial', true)
    .eq('trial_subject', subject)
    .not('status', 'in', '("cancelled")')
    .order('slot_start', { ascending: false });
  if (error || !data) return null;

  const picked = pickConflict(data as TrialRow[], nowMs);
  if (!picked) return null;
  return {
    kind: picked.kind,
    bookingId: picked.row.id,
    slotStart: picked.row.slot_start,
    when: whenIn(picked.row.slot_start, timezone),
  };
}

export interface TrialRow {
  id: string;
  slot_start: string;
  status: string;
}

/**
 * Which of their existing bookings for this pair is the one to talk about.
 *
 * Rows arrive newest first and never include a cancelled booking — cancelling
 * is precisely how a family frees themselves to rebook, so a cancelled trial
 * must not be an obstacle to anything.
 */
export function pickConflict(
  rows: TrialRow[],
  nowMs: number
): { kind: ConflictKind; row: TrialRow } | null {
  /* An upcoming class outranks a finished one: it is the one that would be
     double-booked, and the one the family has to decide about. */
  const active = rows.find((r) => r.status === 'scheduled' && Date.parse(r.slot_start) > nowMs);
  if (active) return { kind: 'active', row: active };

  /* Anything else still standing: sat, missed, or scheduled and now in the
     past. Either way they have had their turn at this pair, and booking it
     again is a retry rather than a clash. */
  const past = rows.find((r) => r.status !== 'cancelled');
  return past ? { kind: 'completed', row: past } : null;
}

/**
 * The booking that counts, now, for this course and grade.
 *
 * Everything a family has ever booked stays in their history — the founder
 * asked for that explicitly — so something has to say which one is current.
 * A retry after a completed trial, and a replacement for a cancelled one,
 * both become the primary; the ones they replace stay exactly where they are.
 *
 * Needs `bookings.is_primary_trial` (scripts/trial-primary.sql). Without it
 * every write here fails and is logged, and nothing else breaks: the booking
 * itself is already made.
 */
export async function markPrimaryTrial(
  admin: SupabaseClient,
  input: { studentId: string; subject: string; grade: number; bookingId: string }
): Promise<void> {
  const ids = await seatsAt(admin, input.studentId, input.grade);
  const others = ids.filter((id) => id !== input.bookingId);

  if (others.length) {
    await bestEffort(
      'trial: demote the earlier bookings for this course and grade',
      admin.from('bookings')
        .update({ is_primary_trial: false })
        .in('id', others)
        .eq('trial_subject', input.subject)
    );
  }

  await bestEffort(
    'trial: mark the new booking primary',
    admin.from('bookings').update({ is_primary_trial: true }).eq('id', input.bookingId)
  );
}
