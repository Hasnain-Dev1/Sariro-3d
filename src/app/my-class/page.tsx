'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, LogOut, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import TrialJourney, { type TrialClass } from '@/components/dashboard/trial-journey';

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
 * ── What it deliberately does not have ──────────────────────────────────────
 * No sidebar. No links to courses, lessons, the leaderboard or the practice
 * room. No "explore tracks". The only two ways out are the marketing site and
 * signing out — both of which are places they can already reach.
 *
 * ── Why it does not sell ────────────────────────────────────────────────────
 * The class has not happened yet. A page pushing them to buy before a teacher
 * has taught them anything is the behaviour of somebody who does not expect
 * the class to do the work. The class does the selling.
 */

export default function MyClassPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  const [trial, setTrial] = useState<TrialClass | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const sb = createClient();
    try {
      /* A trial can hold four children and only the first is named on
         bookings.trial_student_id, so the join table has to be asked too —
         otherwise the second and third child see "nothing booked" while their
         class sits in the diary. */
      let alsoIn: string[] = [];
      try {
        const { data: mine } = await sb
          .from('trial_participants')
          .select('booking_id')
          .eq('student_id', user.id);
        alsoIn = (mine ?? []).map((r) => r.booking_id as string);
      } catch { /* the column below still works on its own */ }

      let q = sb
        .from('bookings')
        /* No `teacher:profiles!teacher_id(...)` embed: bookings.teacher_id has
           no foreign key the API can follow, so the embed failed this whole
           query — returned as an error, not thrown, so the catch never saw it.
           Every family who booked their own class landed here and was told
           nothing was booked. The teacher is read separately below. */
        .select('id, slot_start, slot_end, status, google_meet_url, teacher_id')
        .eq('is_trial', true)
        .not('status', 'in', '("cancelled")');
      q = alsoIn.length
        ? q.or(`trial_student_id.eq.${user.id},id.in.(${alsoIn.join(',')})`)
        : q.eq('trial_student_id', user.id);

      const { data } = await q.order('slot_start', { ascending: false }).limit(1);
      const row = (data ?? [])[0] as unknown as {
        id: string; slot_start: string; slot_end: string; status: string;
        google_meet_url: string | null;
        teacher_id: string | null;
      } | undefined;

      /* Best effort. A teacher profile that cannot be read leaves the name
         blank; it must never again hide the class itself. */
      let teacher: { full_name: string | null; meet_url: string | null } | null = null;
      if (row?.teacher_id) {
        const { data: t } = await sb
          .from('profiles')
          .select('full_name, meet_url')
          .eq('id', row.teacher_id)
          .maybeSingle();
        teacher = (t as { full_name: string | null; meet_url: string | null } | null) ?? null;
      }

      setTrial(
        row
          ? {
              id: row.id,
              slot_start: row.slot_start,
              slot_end: row.slot_end,
              status: row.status,
              // Trials booked before their teacher set a room have no link of
              // their own; theirs works the moment the teacher fills it in.
              google_meet_url: row.google_meet_url ?? teacher?.meet_url ?? null,
              teacher_name: teacher?.full_name ?? null,
            }
          : null
      );
    } catch {
      setTrial(null);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/sign-in?next=/my-class');
      return;
    }
    load();
  }, [user, loading, router, load]);

  /* A student who has since enrolled belongs on the real dashboard. Without
     this they would be stranded here after paying, which is the worst possible
     moment to look broken. */
  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      const { count } = await createClient()
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (live && (count ?? 0) > 0) router.replace('/dashboard/student');
    })();
    return () => { live = false; };
  }, [user, router]);

  const firstName =
    (profile?.full_name || user?.email?.split('@')[0] || 'there').split(' ')[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* A bar, not a nav. The logo goes to the public site; there is nothing
          else on it to click into. */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Sariro" width={28} height={28} priority />
            <span className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Sariro
            </span>
          </Link>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-10">
        {loading || !ready ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" aria-label="Loading" />
          </div>
        ) : trial ? (
          <TrialJourney trial={trial} firstName={firstName} timezone={profile?.timezone ?? null} />
        ) : (
          /* Signed in, no trial. Either it was cancelled or they arrived
             before a seller booked one. Say which is true rather than showing
             an empty countdown. */
          <div className="max-w-xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Nothing booked yet, {firstName}.
            </h1>
            <p className="text-[15px] text-slate-600 leading-[1.75] mb-6">
              Your account is ready and there is no class on it. If you asked for a free class, somebody is
              arranging a time and it will appear here — usually within a day.
            </p>
            <Link
              href="/free-class"
              className="btn-tactile btn-tactile-primary px-6 py-3 text-sm inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Book a free class
            </Link>
            <p className="text-[13px] text-slate-400 mt-8 leading-[1.7]">
              Expected something here?{' '}
              <a href="mailto:support@sariro.com" className="font-semibold text-slate-600 hover:text-slate-900">
                support@sariro.com
              </a>{' '}
              and we will sort it out.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
