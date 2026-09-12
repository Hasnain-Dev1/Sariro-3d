import type { SupabaseClient } from '@supabase/supabase-js';
import type { TrialClass } from '@/components/dashboard/trial-journey';

/**
 * SARIRO — everything /my-class needs, in as few round trips as possible.
 *
 * ── Why this is worth its own module ────────────────────────────────────────
 * Each call to Supabase costs 550–1250ms from the office, and the page needs
 * four answers: the profile, whether they have enrolled since, the class, and
 * the teacher's name. Asked one after another that is three waits — 2.4
 * seconds measured — and the family is staring at it the moment they finish
 * booking.
 *
 * `scripts/trial-page-state.sql` answers all four in one query. If that
 * function has not been run yet the old path still works, so the code can ship
 * before the migration: it is slower, never broken. The fallback is kept
 * honest by being the only other route to the same shape.
 */

export interface TrialPageState {
  profile: { full_name: string | null; email: string | null; timezone: string | null } | null;
  enrolled: number;
  trial: TrialClass | null;
  /** Which path answered — for logs, and for the test that they agree. */
  via: 'rpc' | 'queries';
}

interface RpcTrial {
  id: string;
  slot_start: string;
  slot_end: string;
  status: string;
  google_meet_url: string | null;
  trial_subject: string | null;
  seat_grade: number | null;
  teacher_name: string | null;
  teacher_meet_url: string | null;
}

export interface RpcShape {
  profile: { full_name: string | null; email: string | null; timezone: string | null } | null;
  enrolled: number | string | null;
  trial: RpcTrial | null;
}

/** The one place the database's answer becomes what the page renders. */
export function mapRpcState(raw: RpcShape): Omit<TrialPageState, 'via'> {
  const t = raw?.trial ?? null;
  return {
    profile: raw?.profile ?? null,
    enrolled: Number(raw?.enrolled ?? 0) || 0,
    trial: t
      ? {
          id: t.id,
          slot_start: t.slot_start,
          slot_end: t.slot_end,
          status: t.status,
          /* Trials booked before their teacher set a room have no link of
             their own; theirs works the moment the teacher fills it in. */
          google_meet_url: t.google_meet_url ?? t.teacher_meet_url ?? null,
          teacher_name: t.teacher_name ?? null,
          subject: t.trial_subject ?? null,
          grade: t.seat_grade ?? null,
        }
      : null,
  };
}

export async function loadTrialPageState(
  admin: SupabaseClient,
  userId: string
): Promise<TrialPageState> {
  const { data, error } = await admin.rpc('trial_page_state', { p_user: userId });
  if (!error && data) {
    return { ...mapRpcState(data as RpcShape), via: 'rpc' };
  }
  if (error) {
    /* Almost always "function does not exist" — scripts/trial-page-state.sql
       has not been run yet. Named rather than swallowed, because the slow path
       below is invisible from the outside and would otherwise stay for ever. */
    console.warn('[my-class] trial_page_state unavailable, falling back:', error.message);
  }
  return { ...(await loadTheSlowWay(admin, userId)), via: 'queries' };
}

/** The original three waits, kept only for a database without the function. */
async function loadTheSlowWay(
  admin: SupabaseClient,
  userId: string
): Promise<Omit<TrialPageState, 'via'>> {
  const [{ data: profile }, { count: enrolled }, seats] = await Promise.all([
    admin.from('profiles').select('full_name, email, timezone').eq('id', userId).maybeSingle(),
    admin.from('enrollments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('trial_participants').select('booking_id, grade').eq('student_id', userId),
  ]);

  const roster = (seats.data ?? []) as { booking_id: string; grade: number | null }[];
  const alsoIn = roster.map((r) => r.booking_id);

  let query = admin
    .from('bookings')
    /* No `teacher:profiles!teacher_id(...)` embed: bookings.teacher_id has no
       foreign key the API can follow, so the embed failed the whole query —
       returned as an error, not thrown. Every family who booked their own
       class was told nothing was booked. */
    .select('id, slot_start, slot_end, status, google_meet_url, teacher_id, trial_subject')
    .eq('is_trial', true)
    .not('status', 'in', '("cancelled")');
  query = alsoIn.length
    ? query.or(`trial_student_id.eq.${userId},id.in.(${alsoIn.join(',')})`)
    : query.eq('trial_student_id', userId);

  const { data: rows } = await query.order('slot_start', { ascending: false }).limit(1);
  const row = (rows ?? [])[0] as
    | {
        id: string; slot_start: string; slot_end: string; status: string;
        google_meet_url: string | null; teacher_id: string | null; trial_subject: string | null;
      }
    | undefined;

  let teacher: { full_name: string | null; meet_url: string | null } | null = null;
  if (row?.teacher_id) {
    const { data: t } = await admin
      .from('profiles').select('full_name, meet_url').eq('id', row.teacher_id).maybeSingle();
    teacher = (t as { full_name: string | null; meet_url: string | null } | null) ?? null;
  }

  return mapRpcState({
    profile: (profile as TrialPageState['profile']) ?? null,
    enrolled: enrolled ?? 0,
    trial: row
      ? {
          id: row.id,
          slot_start: row.slot_start,
          slot_end: row.slot_end,
          status: row.status,
          google_meet_url: row.google_meet_url,
          trial_subject: row.trial_subject,
          seat_grade: roster.find((r) => r.booking_id === row.id)?.grade ?? null,
          teacher_name: teacher?.full_name ?? null,
          teacher_meet_url: teacher?.meet_url ?? null,
        }
      : null,
  });
}
