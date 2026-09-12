import { redirect } from 'next/navigation';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { loadTrialPageState } from '@/lib/trial/page-state';
import MyClassView from './my-class-view';

/**
 * SARIRO — /my-class
 * ============================================================================
 * Everything a trial student gets, and nothing else.
 *
 * ── Why this is not a dashboard page ────────────────────────────────────────
 * A free trial creates a real account. When the trial page lived inside the
 * dashboard shell, that account arrived with the sidebar attached — Practice
 * Room, Leaderboard, My Lessons, Messages, Browse Courses, Settings. Anybody
 * could see the whole product by giving us a phone number, and a competitor
 * only has to book a free class and take a screenshot.
 *
 * So this route is outside /dashboard entirely, has no navigation into it, and
 * renders one thing: when their class starts and how to join it.
 *
 * ── Why the work happens here rather than in the browser ────────────────────
 * It used to be a client page that found its own class: wait for the auth
 * provider, ask for the child's seats, ask for the booking, then ask for the
 * teacher's name. The countdown could not appear until the last of them came
 * back — measured at 3.3 seconds, at the exact moment a family finishes
 * booking and most wants to see it.
 *
 * Now the answer is found here, before a byte is sent, so the class is inside
 * the HTML and the countdown is in the first paint. lib/trial/page-state.ts
 * gets all of it in one query where the database supports it.
 *
 * ── Why it does not sell ────────────────────────────────────────────────────
 * The class has not happened yet. A page pushing them to buy before a teacher
 * has taught them anything is the behaviour of somebody who does not expect
 * the class to do the work. The class does the selling.
 */
export const dynamic = 'force-dynamic';

export default async function MyClassPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supa = await createServerClientHelper();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/auth/sign-in?next=/my-class');

  /* Read with the service role, always filtered by this user's own id. The
     session above is what proves who they are; this is only how their rows are
     fetched, and it cannot be tripped up by an RLS policy written later. */
  const { profile, enrolled, trial } = await loadTrialPageState(createServiceClient(), user.id);

  /* A student who has since enrolled belongs on the real dashboard. Without
     this they would be stranded here after paying, which is the worst possible
     moment to look broken. */
  if (enrolled > 0) redirect('/dashboard/student');

  const firstName = (profile?.full_name || user.email?.split('@')[0] || 'there').split(' ')[0];

  // ?welcome=1 is set by the booking form, and only by it.
  const params = await searchParams;
  const welcomeEmail = params?.welcome === '1' ? (profile?.email ?? user.email ?? null) : null;

  return (
    <MyClassView
      trial={trial}
      firstName={firstName}
      timezone={profile?.timezone ?? null}
      welcomeEmail={welcomeEmail}
    />
  );
}
