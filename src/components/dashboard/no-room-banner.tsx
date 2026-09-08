'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * SARIRO — "there are children booked in with you and no door"
 * ============================================================================
 * A normal class inherits its link from its cohort. A trial has no cohort, so
 * every trial ever booked had google_meet_url = NULL and the student's join
 * button never appeared. The teacher had no idea: their own calendar shows the
 * class either way.
 *
 * Setting a room is one field in Settings, and nobody goes looking in Settings
 * for a field they have never heard of. So the count comes and finds them, on
 * the page they open before every class, and it says how many children it is
 * about rather than "action required".
 */
export default function NoRoomBanner() {
  const [state, setState] = useState<{ meetUrl: string | null; doorless: number } | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/teacher/room')
      .then((r) => r.json())
      .then((j) => { if (live && j?.ok) setState({ meetUrl: j.meetUrl ?? null, doorless: j.doorless ?? 0 }); })
      .catch(() => { /* A dashboard must not break over a banner. */ });
    return () => { live = false; };
  }, []);

  // Nothing to say to a teacher whose classes all have a link.
  if (!state || state.doorless === 0) return null;

  const n = state.doorless;

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {n} upcoming {n === 1 ? 'class has' : 'classes have'} no join link
        </p>
        <p className="text-xs text-slate-700 mt-1 leading-relaxed">
          {state.meetUrl
            ? 'Your room is set, but these were booked before that. Open Settings and save it again to put the link on all of them.'
            : 'Trial classes have no link of their own. Until you save your class room, the students booked in with you have no button to press.'}
        </p>
      </div>
      <Link
        href="/settings"
        className="shrink-0 btn-tactile btn-tactile-primary px-5 py-3 text-sm inline-flex items-center justify-center gap-2"
      >
        {state.meetUrl ? 'Fix it' : 'Set your room'} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
