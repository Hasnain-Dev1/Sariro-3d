'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Video, Clock } from 'lucide-react';
import type { TrialClass } from '@/components/dashboard/trial-journey';

/**
 * SARIRO — the trial, for a student who already has a dashboard
 * ============================================================================
 * TrialJourney takes over the whole page for somebody with nothing else on
 * their account. A student who is already enrolled has a real dashboard, and
 * replacing it would hide their actual classes behind a trial for a second
 * course — so they get this instead: a card, at the top, with the time and the
 * join button.
 *
 * Without it a booked trial was invisible to anybody already enrolled. The
 * class existed, the teacher was expecting them, and nothing on their screen
 * said so.
 *
 * ── The clock waits for the browser ─────────────────────────────────────────
 * Date.now() during render is a hydration mismatch: the server decides whether
 * the join button shows, the browser decides differently a moment later, and
 * React throws the subtree away. Same lesson as TrialJourney — `now` is null
 * until an effect fills it in.
 */
export default function TrialCard({
  trial,
  timezone,
}: {
  trial: TrialClass;
  timezone?: string | null;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const start = Date.parse(trial.slot_start);
  const end = Date.parse(trial.slot_end);

  // Finished trials belong in the feedback flow, not on the dashboard.
  if (trial.status === 'completed' || (now !== null && now > end)) return null;

  const joinable = now !== null && now >= start - 10 * 60_000;

  const when = new Date(start).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    ...(timezone ? { timeZone: timezone } : {}),
  });

  return (
    <div className="rounded-2xl border-2 border-blue-300 bg-blue-50/60 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-blue-700" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Free trial class
          </p>
          <p className="text-base font-extrabold text-slate-900 mt-0.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {when}
          </p>
          {trial.teacher_name && (
            <p className="text-xs text-slate-600 mt-0.5">with {trial.teacher_name}</p>
          )}
        </div>

        <div className="shrink-0">
          {joinable ? (
            trial.google_meet_url ? (
              <a
                href={trial.google_meet_url}
                target="_blank"
                rel="noreferrer"
                className="btn-tactile btn-tactile-primary px-5 py-3 text-sm flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" /> Join now
              </a>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Your mentor is setting up the link.
              </p>
            )
          ) : (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Join opens ten minutes before
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
