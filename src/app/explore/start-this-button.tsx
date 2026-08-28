'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Sparkles } from 'lucide-react';

/**
 * SARIRO — "Start this"
 * =========================================================
 * The first thing on the map a learner can actually press.
 *
 * It works identically on all 68 strands — including the 51 with no lessons
 * behind them. That is deliberate: a learner should never be told "we don't
 * offer that". They say what they want, we record it, and a mentor picks it up.
 * At current volume every goal can be fulfilled by hand, and the record of what
 * people asked for is the evidence that decides what gets built next.
 *
 * Signed out, we do not lose the intent — we send them to sign-up and bring them
 * straight back to the strand they were standing on.
 */

export default function StartThisButton({
  capabilitySlug,
  strandName,
  source = 'strand',
}: {
  capabilitySlug: string;
  strandName: string;
  source?: 'explore' | 'strand' | 'onboarding' | 'mentor' | 'course';
}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [alreadyStarted, setAlreadyStarted] = useState(false);

  // Show "You're on this" rather than inviting them to start something twice.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/learner/goals')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.ok) return;
        const mine = (j.goals ?? []) as { capability_slug: string }[];
        if (mine.some((g) => g.capability_slug === capabilitySlug)) setAlreadyStarted(true);
      })
      .catch(() => {
        /* a failed check just means we show the default button */
      });
    return () => {
      cancelled = true;
    };
  }, [capabilitySlug]);

  async function start() {
    setState('saving');
    try {
      const res = await fetch('/api/learner/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capabilitySlug, source }),
      });
      const json = await res.json();

      if (res.status === 401) {
        // Keep the intent: sign up, land back here, press once more.
        router.push(`/auth/sign-up?next=${encodeURIComponent(`/explore/${capabilitySlug}`)}`);
        return;
      }
      if (!json.ok) {
        setState('error');
        return;
      }
      setState('done');
      setAlreadyStarted(true);
    } catch {
      setState('error');
    }
  }

  if (alreadyStarted && state !== 'saving') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="flex items-center gap-2 font-semibold text-emerald-900 text-[15px]">
          <Check className="w-4 h-4" />
          {strandName} is on your journey
        </p>
        <p className="text-[13.5px] text-emerald-800/80 mt-1">
          A mentor will shape the next step with you. Nothing to buy yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={state === 'saving'}
        className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 disabled:opacity-60 transition"
      >
        {state === 'saving' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        Start this
      </button>
      <p className="text-[13px] text-slate-500 mt-2.5">
        Tells us you want to become capable of this. No payment, no commitment — a
        mentor takes it from there.
      </p>
      {state === 'error' && (
        <p className="text-[13px] text-red-600 mt-2">
          That did not save. Try again in a moment.
        </p>
      )}
    </div>
  );
}
