'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2, AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { normaliseCode, codeLooksComplete, codeErrorMessage, recallResetEmail, CODE_LENGTH } from '@/lib/auth/password';

/**
 * SARIRO — the code in the email, finally accepted somewhere
 * ============================================================================
 * The reset email has carried six digits next to the button since the day the
 * templates were written, and nothing on the site would take them. Anybody
 * whose link failed read a number they could not use anywhere.
 *
 * ── Why the link fails, when it fails ───────────────────────────────────────
 * Two ordinary situations, neither of them the person's fault:
 *
 *   · They ask for the reset on a laptop and open the email on their phone.
 *     The browser client uses PKCE, so the secret half of the exchange sits in
 *     the laptop's storage. The phone arrives with half a handshake.
 *
 *   · A mail scanner — Outlook, a school filter, some antivirus suites —
 *     fetches every link in the message to check it is safe. A reset link
 *     works exactly once, so by the time a human clicks it, it is spent.
 *
 * A typed code has neither problem. No browser state to match, and nothing an
 * automated fetch can consume in advance.
 *
 * ── Why this is not hidden behind "having trouble?" ─────────────────────────
 * It is shown in place of the old dead end, which said "this link has expired"
 * and offered nothing but a request for another link that would fail the same
 * way. Somebody standing at that screen is already locked out of an account
 * they paid for; the reliable route belongs in front of them, not one click
 * further away.
 */

export default function RecoveryCodeForm({
  presetEmail,
  onVerified,
}: {
  /** Carried from the forgot-password screen when we know it. */
  presetEmail?: string | null;
  /** A recovery session now exists. The password form takes over. */
  onVerified: () => void;
}) {
  const supabase = createClient();
  const [email, setEmail] = useState(presetEmail ?? '');
  const [known, setKnown] = useState(!!presetEmail);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Same device as the request: we already know the address. Read in an effect
     rather than during render, because localStorage does not exist on the
     server and reading it while rendering is a hydration mismatch. */
  useEffect(() => {
    if (email) return;
    const remembered = recallResetEmail();
    if (remembered) { setEmail(remembered); setKnown(true); }
  }, [email]);

  const clean = normaliseCode(code);
  const ready = codeLooksComplete(code) && email.includes('@') && !busy;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!ready) {
      setError(
        email.includes('@')
          ? `The code is ${CODE_LENGTH} digits — check the email again.`
          : 'We need the email address you asked the reset for.'
      );
      return;
    }

    setBusy(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: clean,
        type: 'recovery',
      });
      if (err) {
        setError(codeErrorMessage(err.message));
        setBusy(false);
        return;
      }
      /* There is a real recovery session now — the same one the link would
         have produced. The parent flips to the password form. */
      onVerified();
    } catch (err) {
      setError(codeErrorMessage(err instanceof Error ? err.message : null));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
            That link did not open a session
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">
            It happens when the email is opened on a different device from the one you asked on, or when a
            mail scanner has already used the link. The six-digit code in the same email works either way.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {!known && (
          <div>
            <label
              htmlFor="recovery-email"
              className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Your email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="recovery-code"
            className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            The {CODE_LENGTH}-digit code from the email
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="recovery-code"
              /* Not type="number": it brings a spinner, drops leading zeros and
                 lets people type "1e5". inputMode gets the phone keypad
                 without any of that. */
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={16}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder="000000"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-lg font-bold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Codes last an hour. If you asked more than once, it is the newest email that counts.
          </p>
        </div>

        {error && (
          <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 leading-relaxed">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!ready}
          className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Use this code
          {!busy && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <Link
        href="/auth/forgot-password"
        className="block text-center text-xs font-bold text-slate-500 hover:text-slate-800"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        Send me a new email instead
      </Link>
    </div>
  );
}
