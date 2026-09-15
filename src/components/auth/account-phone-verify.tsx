'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import PhoneField, { phoneFieldProblem, type PhoneFieldValue } from '@/components/forms/phone-field';
import { DEFAULT_COUNTRY, guessCountry, splitE164 } from '@/lib/phone/countries';
import { WHATSAPP_CODE_NOTICE } from '@/lib/phone/accept';

/**
 * SARIRO — prove the account's phone number
 * ============================================================================
 * One control for the two places an account's number is set: the dashboard's
 * once-only check (PhoneGate) and "Change number" in Settings. Both talk to
 * /api/account/phone, which holds every rule — a code only when one is needed,
 * a new number proved before it replaces a verified one, and at most one
 * change a week. This component only asks, and shows what it is told.
 */

export interface AccountPhoneDone {
  phone: string;
  verified: boolean;
}

interface Props {
  /** The number to start from, e.g. one typed on the account but never proved. */
  initialPhone?: string | null;
  initialCountry?: string | null;
  onDone: (result: AccountPhoneDone) => void;
  /** The button before a code is sent. */
  submitLabel?: string;
}

const RESEND_SECONDS = 30;

function seed(phone: string | null | undefined, country: string | null | undefined): PhoneFieldValue {
  const split = splitE164(phone);
  const picked = (country ?? '').trim().toUpperCase();
  let guessed = DEFAULT_COUNTRY;
  try {
    guessed = guessCountry(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch { /* the default stands */ }
  return { country: picked || split.country?.code || guessed, national: split.national || '' };
}

export default function AccountPhoneVerify({ initialPhone, initialCountry, onDone, submitLabel = 'Send code on WhatsApp' }: Props) {
  const [value, setValue] = useState<PhoneFieldValue>(() => seed(initialPhone, initialCountry));
  const [touched, setTouched] = useState(false);
  const [stage, setStage] = useState<'number' | 'code'>('number');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const attempted = useRef('');
  const codeRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (wait <= 0) return;
    const id = setInterval(() => setWait((w) => (w <= 1 ? 0 : w - 1)), 1000);
    return () => clearInterval(id);
  }, [wait]);

  const post = async (payload: Record<string, unknown>) => {
    const r = await fetch('/api/account/phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: value.national, country: value.country, ...payload }),
    });
    const j = await r.json().catch(() => null);
    return { r, j } as { r: Response; j: Record<string, unknown> | null };
  };

  const send = async () => {
    setTouched(true);
    const problem = phoneFieldProblem(value);
    if (problem) { setError(problem); return; }
    setBusy(true); setError(null);
    try {
      const { r, j } = await post({ action: 'send' });
      if (!r.ok || !j?.ok) {
        setError((j?.message as string) ?? 'We could not send a code just now. Please try again.');
        if (typeof j?.retryAfter === 'number') setWait(j.retryAfter);
        return;
      }
      if (j.done) {
        onDone({ phone: String(j.phone ?? ''), verified: j.verified === true });
        return;
      }
      setSentTo((j.sentTo as string) ?? null);
      setStage('code');
      setCode('');
      attempted.current = '';
      setWait(RESEND_SECONDS);
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch {
      setError('Could not reach us just now. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (typed: string) => {
    setBusy(true); setError(null);
    try {
      const { r, j } = await post({ action: 'verify', code: typed });
      if (!r.ok || !j?.ok) {
        setError((j?.message as string) ?? 'That code is not right.');
        return;
      }
      onDone({ phone: String(j.phone ?? ''), verified: j.verified === true });
    } catch {
      setError('Could not reach us just now. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  /* Six digits is the whole code — checked the moment it is typed, from the
     keystroke itself rather than an effect, so a render can never re-send it
     and spend the five-guess cap. A code with a digit changed is new, and is
     checked again. */
  const typeCode = (raw: string) => {
    const next = raw.replace(/\D/g, '').slice(0, 6);
    setCode(next);
    setError(null);
    if (next.length < 6) { attempted.current = ''; return; }
    if (busy || attempted.current === next) return;
    attempted.current = next;
    void verify(next);
  };

  return (
    <div className="space-y-4">
      {stage === 'number' ? (
        <>
          <PhoneField
            value={value}
            onChange={(next) => { setValue(next); setError(null); }}
            showProblem={touched}
            disabled={busy}
            required
            label="WhatsApp number"
            id="account-phone"
            placeholder="Your WhatsApp number"
            hint={WHATSAPP_CODE_NOTICE}
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || wait > 0}
            className="btn-tactile btn-tactile-primary w-full h-12 text-[15px] disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {wait > 0 ? `Try again in ${wait}s` : submitLabel}
            {!busy && wait === 0 && <ArrowRight className="w-4 h-4" />}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-[13.5px] text-slate-600 leading-relaxed">
            We sent a 6-digit code on WhatsApp to <span className="font-bold text-slate-900">{sentTo ?? 'your number'}</span>.
            It is valid for 10 minutes.
          </p>
          <label htmlFor="account-phone-code" className="sr-only">Verification code</label>
          <input
            id="account-phone-code"
            ref={codeRef}
            value={code}
            onChange={(e) => typeCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            readOnly={busy}
            placeholder="000000"
            className="w-full h-14 rounded-xl border border-slate-200 bg-white text-center text-2xl font-extrabold tracking-[0.45em] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          />
          <div className="flex items-center justify-between gap-3 text-[12.5px]">
            <button
              type="button"
              onClick={() => { setStage('number'); setCode(''); setError(null); }}
              className="font-bold text-slate-500 hover:text-slate-900"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Use a different number
            </button>
            <button
              type="button"
              onClick={send}
              disabled={busy || wait > 0}
              className="font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {busy ? 'Checking…' : wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
