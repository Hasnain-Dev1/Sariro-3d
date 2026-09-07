'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle, KeyRound, ShieldCheck, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/auth/auth-shell';
import { HoneypotField } from '@/components/security/honeypot';
import { resetErrorMessage, resetRequestedMessage } from '@/lib/auth/password';
import { cooldownFor, recordSend, cooldownSeconds, SEND_COOLDOWN_MS } from '@/lib/auth/send-cooldown';

/**
 * SARIRO — /auth/forgot-password
 * ============================================================================
 * The button the FAQ has been promising.
 *
 *   "On the sign-in page, click 'Forgot password?' and enter your email.
 *    We'll send you a reset link valid for 1 hour."
 *
 * Every word of that was true except that the button did not exist and no such
 * email was ever sent. A parent who forgot their password was locked out of an
 * account they had paid for, with no route back that the product told them
 * about.
 *
 * ── Why the answer is the same either way ───────────────────────────────────
 * This screen never says whether an address has an account. "No account with
 * that email" turns the form into a way of testing a list of addresses for
 * which ones are Sariro customers — which is exactly what somebody writing a
 * phishing email to parents would want to know first. See resetRequestedMessage
 * in lib/auth/password.ts.
 *
 * ── The cooldown is the same one sign-up uses ───────────────────────────────
 * Same reason, same file: every email costs quota, and when the quota is gone
 * NOBODY's link arrives, including the parents who paid. Supabase's own limit
 * is the real protection (it applies to calls that never touch this page); this
 * stops the double-click and says how long to wait instead of appearing to do
 * nothing.
 */

function ForgotPasswordInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitMs, setWaitMs] = useState(0);

  // One interval for the life of the screen. It mostly sets 0 to 0, which React
  // discards, so the countdown is live with no bookkeeping about timers.
  useEffect(() => {
    const tick = () => setWaitMs(cooldownFor(email));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Honeypot: a bot filling the hidden field gets the same success message a
    // person gets, and no email is sent.
    const honeypot = (new FormData(e.currentTarget).get('website') as string | null)?.trim();
    if (honeypot) {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 700));
      setSubmitting(false);
      setSent(resetRequestedMessage(email));
      return;
    }

    const address = email.trim();
    if (!address) {
      setError('Enter the email address you sign in with.');
      return;
    }

    // Re-read rather than trusting the ticking state.
    const wait = cooldownFor(address);
    if (wait > 0) {
      setError(`We just sent a link to ${address}. Check your inbox and spam folder — you can ask for another in ${cooldownSeconds(wait)}s.`);
      setWaitMs(wait);
      return;
    }

    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/reset-password')}`,
      });
      /* A rate limit is worth showing — it tells them to wait. Anything else is
         swallowed on purpose: an error here would reveal whether the address
         exists, which is the one thing this screen must not do. */
      if (err && /security purposes|only request|rate|too many/i.test(err.message)) {
        setError(resetErrorMessage(err.message));
        setSubmitting(false);
        return;
      }
      recordSend(address);
      setWaitMs(SEND_COOLDOWN_MS);
      setSent(resetRequestedMessage(address));
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      accent={{
        from: '#14100C',
        to: '#7C2D12',
        glow: '#F59E0B',
        chipBg: 'rgba(245, 158, 11, 0.18)',
        chipText: '#FCD34D',
      }}
      eyebrow="Locked out"
      panelTitle={<>It happens.<br />Let&rsquo;s get you back in.</>}
      panelSubtitle="Give us the address you sign in with and we'll send a link that lets you set a new password. Nothing about your account changes until you do."
      highlights={[
        { icon: Clock, title: 'Valid for one hour', body: 'Long enough to find the email, short enough to be safe.' },
        { icon: KeyRound, title: 'Works once', body: 'The link stops working the moment you have used it.' },
        { icon: ShieldCheck, title: 'Nothing changes yet', body: 'Your current password keeps working until you pick a new one.' },
      ]}
      formTitle="Reset your password"
      formSubtitle="We'll email you a link."
      footer={
        <Link
          href="/auth/sign-in"
          className="font-bold text-slate-900 hover:text-blue-600 inline-flex items-center gap-1.5 transition-colors"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      }
      legalAction="resetting your password"
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-900 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Check your email
              </p>
              <p className="text-sm text-green-800 leading-relaxed">{sent}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nothing arrived? It can take a minute, and it often lands in spam. If you signed up with Google or
            GitHub you do not have a password at all — go back and use that button instead.
          </p>
          <button
            onClick={() => { setSent(null); setError(null); }}
            disabled={waitMs > 0}
            className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {waitMs > 0 ? `Send again in ${cooldownSeconds(waitMs)}s` : 'Send it again'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <HoneypotField />

          <div>
            <label
              htmlFor="reset-email"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com"
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>
          </div>

          {error && (
            <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send the reset link
          </button>

          <p className="text-xs text-slate-500 leading-relaxed">
            Signed up with Google or GitHub? You do not have a password —{' '}
            <Link href="/auth/sign-in" className="font-semibold text-blue-600 hover:underline">
              sign in with that instead
            </Link>
            .
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordInner />
    </Suspense>
  );
}
