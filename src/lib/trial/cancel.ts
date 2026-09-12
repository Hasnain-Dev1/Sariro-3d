import type { SupabaseClient } from '@supabase/supabase-js';
import { bestEffort } from '@/lib/supabase/best-effort';

/**
 * SARIRO — taking one child out of a trial class.
 *
 * Two things do this: a family cancelling from their class page, and a new
 * booking superseding an older one for the same course and grade. They must
 * behave identically, so there is one implementation rather than two.
 *
 * ── The rule that makes this more than an UPDATE ────────────────────────────
 * A trial seats up to four children. Cancelling is per CHILD: their seat goes,
 * and the class stays for everybody else. Only when the room is empty is the
 * class itself called off — cancelling a lesson three other families are
 * waiting for, because one of them dropped out, would be the worse bug.
 */

export interface ReleaseSeat {
  bookingId: string;
  studentId: string;
  /** Who did it: the family themselves, or whoever acted for them. */
  actorId: string | null;
  /** Shown to staff in the booking history. */
  reason: string;
  /** 'trial_cancelled' | 'trial_superseded'. */
  cancelType: string;
}

export interface SeatReleased {
  /** The whole class was called off, because nobody was left in it. */
  classCancelled: boolean;
  /** The booking was not open to cancel (already gone, or already started). */
  skipped?: 'not_found' | 'not_scheduled';
}

export async function releaseTrialSeat(
  admin: SupabaseClient,
  input: ReleaseSeat
): Promise<SeatReleased> {
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, trial_student_id')
    .eq('id', input.bookingId)
    .maybeSingle();
  if (!booking) return { classCancelled: false, skipped: 'not_found' };
  if (booking.status !== 'scheduled') return { classCancelled: false, skipped: 'not_scheduled' };

  const { data: seats } = await admin
    .from('trial_participants').select('id, student_id').eq('booking_id', input.bookingId);
  const roster = (seats ?? []) as { id: string; student_id: string }[];

  await bestEffort(
    'trial-cancel: release the seat',
    admin.from('trial_participants')
      .delete().eq('booking_id', input.bookingId).eq('student_id', input.studentId)
  );

  const others = roster.filter((r) => r.student_id !== input.studentId);
  /* A child named on the booking who is not the one leaving still counts as
     somebody in the room. */
  const ownerElsewhere =
    booking.trial_student_id !== null && booking.trial_student_id !== input.studentId;
  const classCancelled = others.length === 0 && !ownerElsewhere;

  if (classCancelled) {
    const row = {
      status: 'cancelled',
      cancelled_by: input.actorId,
      cancelled_at: new Date().toISOString(),
      cancel_reason: input.reason,
      cancel_actor_role: 'student',
    };
    let { error } = await admin
      .from('bookings')
      .update({ ...row, cancel_type: input.cancelType })
      .eq('id', input.bookingId).eq('status', 'scheduled');

    /* ── Why the second attempt ──────────────────────────────────────────
       bookings.cancel_type has a CHECK listing the five reasons a paid class
       is ever called off, and a trial is none of them. The whole UPDATE was
       refused — silently, because nobody read the error — so the seat went
       and the class stayed in the diary, on the teacher's calendar, with
       nobody in it.

       scripts/trial-cancel-reasons.sql adds the two trial reasons. Until it
       is run, the cancellation still happens; it simply goes unlabelled,
       which is far better than not happening at all. */
    if (error?.code === '23514') {
      console.warn('[trial-cancel] cancel_type refused, cancelling without it — run scripts/trial-cancel-reasons.sql');
      ({ error } = await admin
        .from('bookings').update(row).eq('id', input.bookingId).eq('status', 'scheduled'));
    }
    if (error) {
      console.error(`[trial-cancel] could not cancel booking ${input.bookingId}:`, error.code, error.message);
      return { classCancelled: false, skipped: 'not_scheduled' };
    }
  } else if (booking.trial_student_id === input.studentId && others.length > 0) {
    /* The named child left a room that still has children in it. Somebody has
       to own the booking, or it reads as nobody's class. */
    await bestEffort(
      'trial-cancel: hand the booking to a child who stayed',
      admin.from('bookings')
        .update({ trial_student_id: others[0].student_id }).eq('id', input.bookingId)
    );
  }

  return { classCancelled };
}
