'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mail, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cooldownFor, recordSend, cooldownSeconds, SEND_COOLDOWN_MS } from '@/lib/auth/send-cooldown';
import { shouldAutoSubmit } from '@/lib/phone/india';

/**
 * SARIRO — signing in with a code sent to your email
 * ============================================================================
 * No password to remember, and nothing to reset. For most parents this is the
 * only sign-in that ever works first time: they created the account months ago
 * on a phone, chose a password they have never typed since, and the thing they
 * definitely still have is the inbox.
 *
 * ── Why this exists alongside the reset flow ────────────────────────────────
 * A reset is a repair — it assumes a password exists and something went wrong
 * with it. This is a route in that never had a password in the first place, so
 * it cannot be forgotten. Somebody who signed up with Google also lands here
 * fine: Supabase matches the address, not the original provider.
 *
 * ── The auto-submit guard is not optional ───────────────────────────────────
 * The box submits itself on the sixth digit, because the person is looking at
 * their phone rather than at the form. That convenience is one guard away from
 * a loop: verifying flips `busy` twice, the effect re-runs, and on a WRONG code
 * the box is still six digits — so it fires again as fast as the network
 * allows. We shipped exactly that bug on the phone OTP: the visible symptom was
 * "Checking…" forever, and the real damage was the attempt cap being spent in
 * a few hundred milliseconds, locking out somebody who would have typed it
 * right on the second go.
 *
 * shouldAutoSubmit is the rule, written once as a pure function in
 * lib/phone/india.ts and tested there. It is reused rather than re-derived
 * precisely so that fix cannot be lost twice.
 */

type Stage = 'idle' | 'sent';

export default function EmailCodeSignIn({
  redirectTo = '/dashboard',
  onSuccess,
}: {
  redirectTo?: string;
  onSuccess?: () => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitMs, setWaitMs] = useState(0);
  const lastAttempted = useRef('');
  const codeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const tick = () => setWaitMs(cooldownFor(email));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [email, open]);

  const send = async () => {
    const address = email.trim();
    if (!address) { setError('Enter your email address.'); return; }

    const wait = cooldownFor(address);
    if (wait > 0) {
      setError(`We just sent a code to ${address}. You can ask for another in ${cooldownSeconds(wait)}s.`);
      setWaitMs(wait);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: address,
        options: {
          /* False, deliberately. This is a sign-IN, and creating an account
             for a mistyped address would leave a stranded profile with no
             name, no phone and no way to reach anybody — which is exactly the
             account the contact rule now refuses to give a course to. */
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (err) throw err;
      recordSend(address);
      setWaitMs(SEND_COOLDOWN_MS);
      setStage('sent');
      lastAttempted.current = '';
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (err) {
      const m = err instanceof Error ? err.message : '';
      /* Same reasoning as the reset screen: never say whether the address has
         an account. A form that answers that is a way of testing a list of
         addresses for which ones are Sariro customers. So a missing user looks
         exactly like a sent code — and the code simply never arrives. */
      if (/signups not allowed|user not found|not found/i.test(m)) {
        recordSend(address);
        setWaitMs(SEND_COOLDOWN_MS);
        setStage('sent');
        lastAttempted.current = '';
      } else if (/security purposes|only request|rate|too many/i.test(m)) {
        setError('Too many requests just now. Wait a minute and try again.');
      } else {
        setError('We could not send that code. Check the address and try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  /* Whether a session exists right now, whatever the last call claimed. */
  const signedInAnyway = useMemo(
    () => async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return false;
        onSuccess?.();
        return true;
      } catch {
        return false;
      }
    },
    [supabase, onSuccess]
  );

  const verify = useMemo(
    () => async (value: string) => {
      lastAttempted.current = value;
      setBusy(true);
      setError(null);
      try {
        const { data, error: err } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: value,
          type: 'email',
        });
        if (err) throw err;
        if (data.session) { onSuccess?.(); return; }
        /* Verified, but no session came back with it. Rare, and the person is
           signed in regardless — ask the client rather than telling them it
           failed. */
        if (await signedInAnyway()) return;
      } catch (err) {
        /* ── "That code is not right", and then they refresh and they are in ──
           A code can only be spent once. If the same one is submitted twice —
           two effects, a double tap, a retried request — the first call creates
           the session and the second is told the token is invalid. Believing
           the second call is how somebody who IS signed in gets told they are
           not, which is exactly what the founder hit.

           So before showing any error: is there a session? If there is, they
           are in, and nothing went wrong from their side. */
        if (await signedInAnyway()) return;

        const m = err instanceof Error ? err.message : '';
        setError(
          /expired/i.test(m)
            ? 'That code has expired. Ask for a new one.'
            : 'That code is not right. Check it and try again.'
        );
      } finally {
        setBusy(false);
      }
    },
    [supabase, email, onSuccess, signedInAnyway]
  );

  // The guard that stops the loop. See the header.
  useEffect(() => {
    if (!shouldAutoSubmit({ stage: stage === 'sent' ? 'sent' : 'idle', code, busy, lastAttempted: lastAttempted.current })) {
      return;
    }
    void verify(code);
  }, [stage, code, busy, verify]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        <KeyRound className="w-4 h-4" />
        Email me a code instead
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
          {stage === 'idle' ? 'Sign in with a code' : 'Enter the code'}
        </p>
        <button
          type="button"
          onClick={() => { setOpen(false); setStage('idle'); setCode(''); setError(null); }}
          className="text-[11px] font-bold text-slate-400 hover:text-slate-700 inline-flex items-center gap-1"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <ArrowLeft className="w-3 h-3" />
          Use a password
        </button>
      </div>

      {stage === 'idle' ? (
        <>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void send(); } }}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
          </div>
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !email.trim() || waitMs > 0}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {waitMs > 0 ? `Send again in ${cooldownSeconds(waitMs)}s` : 'Send me a code'}
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-600 leading-relaxed">
            We sent a six-digit code to <strong className="text-slate-900">{email.trim()}</strong>. It expires in
            an hour and sometimes lands in spam.
          </p>
          <input
            ref={codeRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              // Typing a DIFFERENT code clears the guard, so a correction is
              // checked normally rather than being swallowed by it.
              if (v !== lastAttempted.current) lastAttempted.current = '';
              setCode(v);
              setError(null);
            }}
            placeholder="000000"
            className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-white text-center text-2xl font-bold tracking-[0.5em] indent-[0.5em] focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
            style={{ fontFamily: 'var(--font-mono, ui-monospace), monospace' }}
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setStage('idle'); setCode(''); setError(null); }}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Change email
            </button>
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || waitMs > 0}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {waitMs > 0 ? `Resend in ${cooldownSeconds(waitMs)}s` : 'Resend the code'}
            </button>
          </div>
          {busy && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Checking…
            </p>
          )}
        </>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
