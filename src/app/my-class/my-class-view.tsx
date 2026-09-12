'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, LogOut, Sparkles, CalendarX } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import TrialJourney, { type TrialClass } from '@/components/dashboard/trial-journey';

/**
 * SARIRO — what /my-class shows, once the server has already found it.
 *
 * ── Why the data arrives as a prop ──────────────────────────────────────────
 * This page used to find its own class in the browser: wait for the auth
 * provider, ask for the child's seats, ask for the booking, then ask for the
 * teacher's name — four waits before a countdown could appear, and the moment
 * a family most wants to see that countdown is the second after they book it.
 *
 * The server knows all of it before the page is sent, so the class is in the
 * HTML and the countdown is on screen in the first paint. This component keeps
 * only what genuinely needs a browser: the ticking clock, signing out, and
 * calling the class off.
 */
export default function MyClassView({
  trial,
  firstName,
  timezone,
  welcomeEmail,
}: {
  trial: TrialClass | null;
  firstName: string;
  timezone: string | null;
  /** Set only on arrival from the booking form, to say where the email went. */
  welcomeEmail: string | null;
}) {
  const { signOut } = useAuth();
  const router = useRouter();

  const cancellable =
    trial !== null && trial.status === 'scheduled' && Date.parse(trial.slot_start) > Date.now();

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
        {trial ? (
          <>
            {/* Said here rather than on a receipt screen they had to sit
                through before being allowed to see their class. */}
            {welcomeEmail && (
              <div className="max-w-xl mx-auto mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center">
                <p className="text-sm text-green-900">
                  You’re booked in. We’ve emailed the details — and your password for next time — to{' '}
                  <strong>{welcomeEmail}</strong>.
                </p>
              </div>
            )}
            <TrialJourney trial={trial} firstName={firstName} timezone={timezone} />
            {/* Only while the class is still ahead of them. The booking form
                refuses a second free class in the same course until this one is
                gone, so the way out has to be somewhere they can find it. */}
            {cancellable && (
              <CancelTrial bookingId={trial.id} onCancelled={() => router.refresh()} />
            )}
          </>
        ) : (
          /* Signed in, no trial. Either it was cancelled or they arrived
             before a seller booked one. Say which is true rather than showing
             an empty countdown. */
          <div className="max-w-xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
              We’re arranging your free class, {firstName}.
            </h1>
            {/* Most people who land here with no class carried on past "all
                slots are filled" — the booking form lets them, and a seller
                now has them in their Needs Slot Assistance queue. Say what is
                actually happening, and what they will see when it has. */}
            <p className="text-[15px] text-slate-600 leading-[1.75] mb-6">
              Your account is ready. A Sariro counsellor will call you on your phone number to arrange
              the class at a time that suits you — usually within a day. As soon as it is booked, it
              appears right here with a countdown and a join button.
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

/* ══════════════════════════════════════════════════════════════════════════
   Calling off a free class
   ══════════════════════════════════════════════════════════════════════════
   Deliberately quiet — a small line under the class, not a button competing
   with "Join". It asks once before doing it, because the seat goes back to a
   very small pool and a mis-tap costs them their place.
   ══════════════════════════════════════════════════════════════════════════ */

function CancelTrial({ bookingId, onCancelled }: { bookingId: string; onCancelled: () => void }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cancel = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/trial/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setErr(j?.message ?? 'We could not cancel that. Please try again.');
        return;
      }
      onCancelled();
    } catch {
      setErr('Could not reach us just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 text-center">
      {asking ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            Cancel this free class? Your seat goes back, and a counsellor will call to arrange
            another time. You can book a different course straight away.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={cancel}
              disabled={busy}
              className="min-h-[40px] px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold disabled:opacity-40 inline-flex items-center gap-2"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarX className="w-4 h-4" />}
              Yes, cancel it
            </button>
            <button
              onClick={() => { setAsking(false); setErr(null); }}
              disabled={busy}
              className="min-h-[40px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-40"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Keep my class
            </button>
          </div>
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </div>
      ) : (
        <button
          onClick={() => setAsking(true)}
          className="text-[13px] font-semibold text-slate-400 hover:text-slate-700 inline-flex items-center gap-1.5"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <CalendarX className="w-3.5 h-3.5" /> Cancel this class
        </button>
      )}
    </div>
  );
}
