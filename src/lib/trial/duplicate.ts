import type { SupabaseClient } from '@supabase/supabase-js';
import { cityOf } from '@/lib/time/timezones';

/**
 * SARIRO — the free class they already have.
 *
 * A family may hold ONE free class per course. Booking the same course twice
 * puts two teachers in front of the same child and holds two seats out of a
 * very small number, and the second booking is almost always a person who
 * forgot, or a second tab.
 *
 * A DIFFERENT course is not a repeat — it is a second thing they want to try,
 * and they are welcome to it. So this asks a narrow question: is there an
 * upcoming trial for THIS course?
 *
 * A trial reaches a student two ways — `bookings.trial_student_id` for the
 * child the class was opened for, and `trial_participants` for anybody who
 * joined it — so both are asked. Asking only the first is how a child who
 * joined somebody else's slot books a second seat in the same lesson.
 */
export interface HeldTrial {
  bookingId: string;
  slotStart: string;
  /** Already in their own time zone, ready to show. */
  when: string;
}

export async function upcomingTrialFor(
  admin: SupabaseClient,
  studentId: string,
  subject: string,
  timezone: string | null
): Promise<HeldTrial | null> {
  const nowIso = new Date().toISOString();

  const { data: seats } = await admin
    .from('trial_participants').select('booking_id').eq('student_id', studentId);
  const joinedIds = (seats ?? []).map((s) => (s as { booking_id: string }).booking_id);

  let query = admin
    .from('bookings')
    .select('id, slot_start, trial_subject')
    .eq('is_trial', true)
    .eq('status', 'scheduled')
    .eq('trial_subject', subject)
    .gt('slot_start', nowIso)
    .order('slot_start', { ascending: true })
    .limit(1);

  query = joinedIds.length
    ? query.or(`trial_student_id.eq.${studentId},id.in.(${joinedIds.join(',')})`)
    : query.eq('trial_student_id', studentId);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  const row = data as { id: string; slot_start: string };
  const zone = timezone || 'Asia/Kolkata';
  let when: string;
  try {
    when = new Date(row.slot_start).toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: zone,
    }) + ` (${cityOf(zone)} time)`;
  } catch {
    when = new Date(row.slot_start).toUTCString();
  }
  return { bookingId: row.id, slotStart: row.slot_start, when };
}
