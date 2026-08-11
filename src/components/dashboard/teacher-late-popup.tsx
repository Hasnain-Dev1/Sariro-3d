'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle, CalendarClock, Video } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { useRealtime } from '@/lib/dashboard/use-realtime';

/* ════════════════════════════════════════════════════════════════════════
   TeacherLatePopup — student-facing live status when a class is starting.
   Watches the student's imminent class in real time:
     • 0–10 min past start, teacher hasn't joined → "hang tight" (countdown)
     • >10 min → "unexpected emergency, moved to next class, no credit lost"
       and triggers server-verified no-show finalisation (once).
   Purely client-derived from the booking clock — no cron needed.
   ════════════════════════════════════════════════════════════════════════ */

const THRESHOLD_MIN = 10;

interface ImminentBooking {
  id: string;
  slot_start: string;
  status: string;
  teacher_started_at: string | null;
  google_meet_url: string | null;
  cohort_id: string | null;
}

// Grace before the "your teacher is joining…" notice appears (teachers often
// click Start Class a minute into the call).
const GRACE_MIN = 2;

export default function TeacherLatePopup() {
  const { user } = useAuth();
  const [booking, setBooking] = useState<ImminentBooking | null>(null);
  const [meetUrl, setMeetUrl] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState<string | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    const sb = createClient();
    const { data: enrs } = await sb.from('enrollments').select('cohort_id').eq('user_id', user.id).eq('status', 'active');
    const cohortIds = (enrs ?? []).map((e: { cohort_id: string }) => e.cohort_id).filter(Boolean);
    if (cohortIds.length === 0) { setBooking(null); setMeetUrl(null); return; }
    // A class whose start is within [-2h, +15min] and still scheduled.
    const from = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { data } = await sb.from('bookings')
      .select('id, slot_start, status, teacher_started_at, google_meet_url, cohort_id')
      .in('cohort_id', cohortIds).eq('status', 'scheduled')
      .gte('slot_start', from).lte('slot_start', to)
      .order('slot_start', { ascending: false }).limit(1);
    const b = (data && data[0]) ? (data[0] as ImminentBooking) : null;
    setBooking(b);
    // Resolve a join link: booking's own, else the cohort's shared Meet URL.
    if (b) {
      let url = b.google_meet_url ?? null;
      if (!url && b.cohort_id) {
        const { data: c } = await sb.from('cohorts').select('google_meet_url').eq('id', b.cohort_id).maybeSingle();
        url = (c?.google_meet_url as string | null) ?? null;
      }
      setMeetUrl(url);
    } else {
      setMeetUrl(null);
    }
  }, [user]);

  useEffect(() => { Promise.resolve().then(load); }, [load]);
  // Re-poll every 20s (catches new imminent classes) + tick clock every second.
  useEffect(() => {
    const poll = setInterval(load, 20_000);
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [load]);

  useRealtime({ tables: ['bookings'], onRefresh: load, enabled: !!user });

  // Nothing to show unless a class has started and the teacher hasn't joined.
  if (!booking || booking.teacher_started_at || booking.status !== 'scheduled') return null;
  if (dismissed === booking.id) return null;

  const startMs = new Date(booking.slot_start).getTime();
  const elapsedMin = (nowMs - startMs) / 60000;
  if (elapsedMin < 0) return null; // not started yet

  const isEmergency = elapsedMin >= THRESHOLD_MIN;
  // Short grace so we don't nag the instant the class starts.
  if (!isEmergency && elapsedMin < GRACE_MIN) return null;

  // Fire the server-verified no-show finalisation once when we cross 10 min.
  if (isEmergency && !firedRef.current.has(booking.id)) {
    firedRef.current.add(booking.id);
    fetch('/api/booking/finalize-noshow', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id }),
    }).catch(() => { /* server re-verifies; safe to ignore transient errors */ });
  }

  const remaining = Math.max(0, Math.ceil(THRESHOLD_MIN - elapsedMin));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
        {isEmergency ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <CalendarClock className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Today&apos;s class has been moved
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              Your teacher had an unexpected emergency and can&apos;t take today&apos;s class.
              <strong className="text-slate-900"> No credit is deducted</strong> — this class has been
              shifted to your next class date. Sorry for the trouble!
            </p>
            <button onClick={() => setDismissed(booking.id)} className="min-h-[44px] px-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold w-full">
              Got it
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Your teacher is joining…
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              They may be facing a tech or internet issue. Our team is trying to reach them —
              please hang tight for up to <strong>10 minutes</strong>.
            </p>
            <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-sm font-bold mb-4">
              <AlertTriangle className="w-4 h-4" /> ~{remaining} min left
            </div>
            <div className="flex flex-col gap-2">
              {meetUrl && (
                <a
                  href={meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold w-full flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" /> Join class now
                </a>
              )}
              <button onClick={() => setDismissed(booking.id)} className="min-h-[44px] px-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold w-full">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
