'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, KeyRound, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/auth/auth-shell';
import { checkPassword, passwordsMatch, resetErrorMessage } from '@/lib/auth/password';
import RecoveryCodeForm from '@/components/auth/recovery-code-form';

/**
 * SARIRO — /auth/reset-password
 * ============================================================================
 * Where the link in the reset email lands.
 *
 * ── How the session gets here ───────────────────────────────────────────────
 * Supabase's recovery link goes to /auth/callback, which exchanges the code for
 * a real — if short-lived and single-purpose — session, then redirects here.
 * So by the time this component mounts there is a signed-in user, and setting
 * the password is just `auth.updateUser`.
 *
 * That is also why this page checks for a session before showing the form. An
 * expired link, a link already used, or somebody who simply typed the URL will
 * otherwise fill in two password boxes, press the button, and be told
 * "Auth session missing!" — which reads as a broken product rather than as
 * "your link has expired, ask for another".
 *
 * ── Why it signs you out afterwards ─────────────────────────────────────────
 * A password reset is what somebody does when they think their account may
 * have been reached by another person. Leaving every other session alive would
 * make the reset cosmetic. `signOut({ scope: 'global' })` ends them all, and
 * then this page sends them to sign in with the password they just chose —
 * which also proves to them that it worked.
 */

function ResetPasswordInner() {
  const supabase = createClient();
  const router = useRouter();
  /* forgot-password carries the address across so the code form is one field
     rather than two. It is the address they just typed, not a secret. */
  const presetEmail = useSearchParams().get('email');

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [linkOk, setLinkOk] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* Is there a recovery session? Asked once, on mount. onAuthStateChange is
     also watched because the callback redirect and this component mounting can
     race on a slow connection — without it, a valid link occasionally showed
     the "expired" screen. */
  useEffect(() => {
    let cancelled = false;

    const settle = (session: { user?: { email?: string | null } } | null) => {
      if (cancelled) return;
      setLinkOk(!!session);
      setEmail(session?.user?.email ?? null);
      setChecking(false);
    };

    supabase.auth.getSession().then(({ data }) => settle(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) settle(session);
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [supabase]);

  const check = useMemo(() => checkPassword(password, email), [password, email]);
  const matches = passwordsMatch(password, confirm);
  const canSubmit = check.ok && matches && !submitting;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!check.ok) { setError(check.problem); return; }
    if (!matches) { setError('The two passwords do not match.'); return; }

    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) { setError(resetErrorMessage(err.message)); setSubmitting(false); return; }

      setDone(true);
      /* Every other session dies with the old password. See the header. */
      await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
      setTimeout(() => router.replace('/auth/sign-in?reset=1'), 2200);
    } catch (err) {
      setError(resetErrorMessage(err instanceof Error ? err.message : null));
      setSubmitting(false);
    }
  };

  const meter = ['#DC2626', '#F59E0B', '#F59E0B', '#16A34A', '#16A34A'][check.score] ?? '#DC2626';

  return (
    <AuthShell
      accent={{
        from: '#14100C',
        to: '#14532D',
        glow: '#16A34A',
        chipBg: 'rgba(22, 163, 74, 0.18)',
        chipText: '#86EFAC',
      }}
      eyebrow="Almost there"
      panelTitle={<>One new password<br />and you&rsquo;re back.</>}
      panelSubtitle="Pick something you'll remember. Length beats punctuation — a short sentence is both easier to recall and harder to guess than a word with symbols in it."
      highlights={[
        { icon: Sparkles, title: 'Length wins', body: 'Four ordinary words beat one clever one.' },
        { icon: KeyRound, title: 'No silly rules', body: 'No forced symbol, no forced capital, no expiry.' },
        { icon: ShieldCheck, title: 'Signs out everywhere', body: 'Every other device is logged out when you save.' },
      ]}
      formTitle="Choose a new password"
      formSubtitle={email ? `For ${email}` : 'Set it once and you are done.'}
      footer={
        <Link
          href="/auth/sign-in"
          className="font-bold text-slate-900 hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          Back to sign in
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      }
      legalAction="changing your password"
    >
      {checking ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : done ? (
        <div className="flex gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-green-900 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Password changed
            </p>
            <p className="text-sm text-green-800 leading-relaxed">
              Every other device has been signed out. Taking you to sign in…
            </p>
          </div>
        </div>
      ) : !linkOk ? (
        /* No recovery session — an expired link, one a mail scanner already
           used, or a link opened on a different device from the one it was
           asked on. This used to be a dead end offering another link that
           would fail the same way; the code in that same email does not. */
        <RecoveryCodeForm
          presetEmail={presetEmail}
          onVerified={() => { setLinkOk(true); setChecking(false); }}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="new-password"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              New password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="new-password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onBlur={() => setTouched(true)}
                className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* The meter is advice. A `fair` password still saves — see
                lib/auth/password.ts on why the rules are deliberately mild. */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i < check.score ? meter : '#E7E5E4' }}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs" style={{ color: check.ok ? '#78716C' : '#DC2626' }}>
                  {check.ok
                    ? `Strength: ${check.strength}${check.score < 3 ? ' — a longer one would be better' : ''}`
                    : check.problem}
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Type it again
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirm-password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>
            {touched && confirm && !matches && (
              <p className="mt-1.5 text-xs text-red-600">These two do not match.</p>
            )}
          </div>

          {error && (
            <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Save my new password
          </button>

          <p className="text-xs text-slate-500 leading-relaxed">
            Saving signs you out on every other device — which is the point, if you are here because somebody
            else may have had your old password.
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
