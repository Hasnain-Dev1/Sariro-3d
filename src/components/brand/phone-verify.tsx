'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Phone, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { normalizeIndianMobile } from '@/lib/phone/india';

/**
 * SARIRO — verify the number before the class is booked
 * =========================================================
 * A free class costs a mentor half an hour, and a wrong number costs the
 * booking anyway: the confirmation and the class details are sent to it.
 *
 * ── The number is owned by the parent, not this component ───────────────────
 * `value` / `onChange` stay with the form, because the number is a form field
 * that happens to need verifying — not a thing this component holds. What this
 * owns is the verification, and it reports that up through `onVerified`.
 *
 * ── Editing the number un-verifies it ───────────────────────────────────────
 * Verify 98765 43210, change the last digit, and the form must not still think
 * a number is verified. It cannot be "the verified number" once it is a
 * different number, so any edit clears the state and the code box comes back.
 *
 * ── India only, for now ─────────────────────────────────────────────────────
 * The provider delivers to Indian numbers. A foreign number is not treated as
 * an error here — it is a real number we cannot text yet, and the form decides
 * what to do about that rather than this component refusing to render.
 */

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** Called with the E.164 number when verified, and null the moment it is not. */
  onVerified: (e164: string | null) => void;
  /**
   * Called when verification is not available at all — the SMS provider is not
   * configured. The form stops requiring it, because a check that cannot be
   * performed must not become a wall.
   */
  onUnavailable?: () => void;
  disabled?: boolean;
}

export default function PhoneVerify({ value, onChange, onVerified, onUnavailable, disabled }: Props) {
  const [stage, setStage] = useState<'idle' | 'sent' | 'verified' | 'unavailable'>('idle');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  const parsed = normalizeIndianMobile(value);
  const indian = parsed.ok;

  // Counts the resend down. One interval while this is mounted, mostly setting
  // 0 to 0, which React discards.
  useEffect(() => {
    if (wait <= 0) return;
    const id = setInterval(() => setWait((w) => (w <= 1 ? 0 : w - 1)), 1000);
    return () => clearInterval(id);
  }, [wait]);

  /* Any edit to the number invalidates whatever was verified. Reported to the
     parent immediately so the submit button cannot be live for a stale
     verification even for one render. */
  const handleNumberChange = (next: string) => {
    onChange(next);
    if (stage !== 'idle') {
      setStage('idle');
      setCode('');
      setMessage(null);
      setError(null);
    }
    onVerified(null);
  };

  const send = useCallback(async () => {
    if (!parsed.ok || busy || wait > 0) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone: value }),
      });
      const json = await res.json();
      if (!json.ok) {
        if (json.canProceed) {
          // Not their problem and not their fault — said as information, not
          // as an error they are expected to fix.
          setStage('unavailable');
          setMessage(json.message ?? 'Verification is unavailable right now — you can still book.');
          onUnavailable?.();
          return;
        }
        setError(json.message ?? 'Could not send the code.');
        if (typeof json.retryAfter === 'number') setWait(json.retryAfter);
        return;
      }
      setStage('sent');
      setMessage(`Code sent to ${json.sentTo ?? 'your phone'}. It is valid for 10 minutes.`);
      setWait(30);
      // The keyboard should already be in the code box — the person is looking
      // at their phone, not at this form.
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [parsed.ok, busy, wait, value, onUnavailable]);

  const verify = useCallback(async () => {
    if (busy || code.trim().length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phone: value, code: code.trim() }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.message ?? 'That code is not right.');
        return;
      }
      setStage('verified');
      setMessage(null);
      onVerified(parsed.ok ? parsed.e164 : null);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [busy, code, value, parsed, onVerified]);

  // Six digits is the whole code, so there is nothing to press afterwards.
  useEffect(() => {
    if (stage === 'sent' && code.length === 6 && !busy) void verify();
  }, [code, stage, busy, verify]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="tel"
            value={value}
            onChange={(e) => handleNumberChange(e.target.value)}
            maxLength={20}
            disabled={disabled || stage === 'verified'}
            placeholder="98765 43210"
            aria-label="Mobile number"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:bg-slate-50 disabled:text-slate-500"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
          />
        </div>

        {stage === 'unavailable' ? (
          <span
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-slate-100 border border-slate-200 text-[13px] font-bold text-slate-500 whitespace-nowrap"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Skipped
          </span>
        ) : stage === 'verified' ? (
          <span
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl bg-green-50 border border-green-200 text-[13px] font-bold text-green-700 whitespace-nowrap"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <CheckCircle2 className="w-4 h-4" /> Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={disabled || busy || !indian || wait > 0}
            className="px-4 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold whitespace-nowrap disabled:bg-slate-300 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {busy && stage === 'idle' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : wait > 0 ? (
              `${wait}s`
            ) : stage === 'sent' ? (
              'Resend'
            ) : (
              'Send code'
            )}
          </button>
        )}
      </div>

      {/* A number that is real but not Indian. Said plainly rather than as a
          validation error, because there is nothing wrong with the number. */}
      {value.trim() && !indian && (
        <p className="flex items-start gap-1.5 text-[12px] text-amber-700 leading-[1.5]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          {parsed.ok ? '' : parsed.reason}
        </p>
      )}

      {stage === 'sent' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <label className="block text-[12px] font-bold text-slate-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Enter the 6-digit code
          </label>
          <input
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={disabled || busy}
            placeholder="000000"
            aria-label="Verification code"
            className="w-full min-h-[46px] rounded-xl border border-slate-300 px-3.5 text-center text-xl font-bold tracking-[0.4em] text-slate-900 placeholder:text-slate-300 placeholder:tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-60"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '20px' }}
          />
          {busy && (
            <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
            </p>
          )}
        </div>
      )}

      {message && !error && (
        <p className="flex items-start gap-1.5 text-[12px] text-green-700 leading-[1.5]">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px" />
          {message}
        </p>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-[12px] text-red-600 leading-[1.5]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          {error}
        </p>
      )}
    </div>
  );
}
