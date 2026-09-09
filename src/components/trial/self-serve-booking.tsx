'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Phone, Users, CalendarCheck,
} from 'lucide-react';
import { HoneypotField } from '@/components/security/honeypot';
import { groupByDay, slotLabel, type PublicSlot } from '@/lib/trial/public-slots';

/**
 * SARIRO — booking your own free class, from an advert
 * ============================================================================
 * The whole trial used to need a seller: the parent left their details, a
 * human rang them, agreed a time, and typed it into a picker. That is a person
 * per booking, and it caps how many trials a day the company can run at
 * however many calls somebody can make.
 *
 * This is the same booking without the call.
 *
 * ── Three steps, and the order matters ──────────────────────────────────────
 * Details, then a time, then done. The time comes SECOND on purpose: the slot
 * list depends on how many children are coming, and a parent who picks 5pm and
 * is then told their two children do not fit has been made to do the work
 * twice. Asking first costs one screen and never wastes their choice.
 *
 * ── Why the phone is verified before a time is even shown ───────────────────
 * A trial costs a teacher half an hour. An account nobody can ring is an
 * account nobody can chase when the child does not appear — the founder's rule,
 * and the same one that gates assigning a course. Doing it at step one means
 * nobody picks a slot they will not be allowed to keep.
 *
 * ── What it never shows ─────────────────────────────────────────────────────
 * No teacher names, no "3 of our 4 teachers are free", no empty evenings. A
 * public page that publishes your staff rota and its occupancy is a
 * competitor's research done for them. Times and seats, nothing else.
 */

type Step = 'details' | 'time' | 'done';

interface Booked {
  slotStart: string;
  teacherName: string | null;
  signInUrl: string | null;
  existingAccount: boolean;
}

const localZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'; }
  catch { return 'Asia/Kolkata'; }
};

export default function SelfServeBooking() {
  const [step, setStep] = useState<Step>('details');
  const [tz, setTz] = useState('Asia/Kolkata');
  useEffect(() => { setTz(localZone()); }, []);

  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [children, setChildren] = useState(1);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);

  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  const [chosen, setChosen] = useState<PublicSlot | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Booked | null>(null);

  const detailsReady =
    childName.trim().length > 1 &&
    parentName.trim().length > 1 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) &&
    phoneVerified;

  /* ── The phone, proved ─────────────────────────────────────────────────── */
  const sendCode = async () => {
    setOtpBusy(true); setError(null);
    try {
      const r = await fetch('/api/phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) { setError(j?.message ?? 'We could not send a code to that number.'); return; }
      setCodeSent(true);
    } catch {
      setError('Could not reach us just now. Check your connection and try again.');
    } finally { setOtpBusy(false); }
  };

  const verifyCode = async () => {
    setOtpBusy(true); setError(null);
    try {
      const r = await fetch('/api/phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phone, code }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) { setError(j?.message ?? 'That code did not match.'); return; }
      setPhoneVerified(true);
    } catch {
      setError('Could not reach us just now. Try again in a moment.');
    } finally { setOtpBusy(false); }
  };

  /* ── The times ─────────────────────────────────────────────────────────── */
  const loadSlots = useCallback(async (seats: number) => {
    setSlots(null); setChosen(null); setError(null);
    try {
      const r = await fetch(`/api/trial/slots?seats=${seats}`);
      const j = await r.json().catch(() => null);
      setSlots(j?.ok ? (j.slots as PublicSlot[]) : []);
    } catch {
      setSlots([]);
    }
  }, []);

  const goToTimes = async () => {
    if (!detailsReady) { setError('Fill in the details above first.'); return; }
    setStep('time');
    await loadSlots(children);
  };

  const days = useMemo(() => (slots ? groupByDay(slots, tz) : []), [slots, tz]);

  /* ── Book it ───────────────────────────────────────────────────────────── */
  const confirm = async () => {
    if (!chosen) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/trial/self-book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName, childName, email, phone, interest,
          children, timezone: tz,
          teacherId: chosen.teacherId, slotStart: chosen.iso,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setError(j?.message ?? 'We could not complete that booking. Please try again.');
        // Somebody took the seat while they were deciding. Refresh rather than
        // leave them staring at a time that no longer exists.
        if (j?.error === 'slot_full' || j?.error === 'slot_gone') await loadSlots(children);
        return;
      }
      setBooked({
        slotStart: j.slotStart, teacherName: j.teacherName,
        signInUrl: j.signInUrl ?? null, existingAccount: !!j.existingAccount,
      });
      setStep('done');
    } catch {
      setError('Could not reach us just now. Your class is not booked — please try again.');
    } finally { setBusy(false); }
  };

  /* ══ Done ═══════════════════════════════════════════════════════════════ */
  if (step === 'done' && booked) {
    const when = new Date(booked.slotStart).toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit', timeZone: tz,
    });
    return (
      <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-700" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          Booked. See you {when.split(',')[0]}.
        </h2>
        <p className="mt-2 text-[15px] text-slate-700">
          <span className="font-bold">{when}</span>
          {booked.teacherName ? <> · with {booked.teacherName}</> : null}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Thirty minutes, nothing to pay, and no card anywhere.
        </p>

        {booked.signInUrl ? (
          <a href={booked.signInUrl} className="btn-tactile btn-tactile-primary mt-6 px-6 py-3 text-sm inline-flex items-center justify-center gap-2">
            Go to your class page <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          /* They typed an email that already has an account. We will not hand
             out a session for an address nobody proved — they sign in as
             normal and the class is waiting. */
          <div className="mt-6">
            <a href="/auth/sign-in?next=/my-class" className="btn-tactile btn-tactile-primary px-6 py-3 text-sm inline-flex items-center justify-center gap-2">
              Sign in to see it <ArrowRight className="w-4 h-4" />
            </a>
            <p className="mt-2 text-xs text-slate-500">
              You already have a Sariro account on that email, so sign in as usual.
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ══ Pick a time ════════════════════════════════════════════════════════ */
  if (step === 'time') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <button
          onClick={() => { setStep('details'); setError(null); }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <h2 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          Pick a time
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Thirty minutes. Times are shown in your own timezone.
        </p>

        {slots === null ? (
          <div className="flex items-center gap-2 py-10 justify-center text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Finding times…
          </div>
        ) : days.length === 0 ? (
          <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Nothing free in the next two weeks{children > 1 ? ` for ${children} children together` : ''}. We will
            ring you on {phone} and find a time — usually within a day.
          </p>
        ) : (
          <div className="mt-4 space-y-4 max-h-[22rem] overflow-y-auto pr-1">
            {days.map((day) => (
              <div key={day.date}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {day.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((s) => {
                    const active = chosen?.iso === s.iso;
                    return (
                      <button
                        key={s.iso}
                        onClick={() => { setChosen(s); setError(null); }}
                        className={`px-3 py-2 rounded-xl border-2 text-left transition-colors ${
                          active
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        <span className="block text-sm font-bold">{slotLabel(s.iso, tz)}</span>
                        {/* Scarcity, but only where it is true. A slot with all
                            four seats says nothing rather than inventing urgency. */}
                        {s.seatsLeft < 4 && (
                          <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {s.seatsLeft} {s.seatsLeft === 1 ? 'seat' : 'seats'} left
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </p>
        )}

        <button
          onClick={confirm}
          disabled={!chosen || busy}
          className="btn-tactile btn-tactile-primary mt-5 w-full px-6 py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarCheck className="w-5 h-5" />}
          {chosen ? `Book ${slotLabel(chosen.iso, tz)}` : 'Choose a time'}
        </button>
      </div>
    );
  }

  /* ══ Details ════════════════════════════════════════════════════════════ */
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
        Book a free class
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Thirty minutes with a real teacher. No card, no commitment.
      </p>

      <div className="mt-4 space-y-3">
        <Field label="Your child's name" value={childName} onChange={setChildName} autoComplete="off" />
        <Field label="Your name" value={parentName} onChange={setParentName} autoComplete="name" />
        <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        <Field label="What would they like to learn?" value={interest} onChange={setInterest} placeholder="Maths, coding, public speaking…" autoComplete="off" />

        {/* How many children, asked BEFORE the times — the slot list depends on
            it, and a parent told at the click that two do not fit has been made
            to choose twice. */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            How many children?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setChildren(n)}
                className={`h-11 flex-1 rounded-xl border-2 text-sm font-bold transition-colors ${
                  children === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {n}
              </button>
            ))}
          </div>
          {children > 1 && (
            <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> They will be in the same class together.
            </p>
          )}
        </div>

        {/* ── Phone, and proving it ── */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Mobile number
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneVerified(false); setCodeSent(false); setError(null); }}
                inputMode="tel"
                autoComplete="tel"
                disabled={phoneVerified}
                placeholder="98765 43210"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-50"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>
            {!phoneVerified && (
              <button
                onClick={sendCode}
                disabled={otpBusy || phone.replace(/\D/g, '').length < 10}
                className="h-11 px-4 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 disabled:opacity-40"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {otpBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : codeSent ? 'Resend' : 'Send code'}
              </button>
            )}
          </div>

          {phoneVerified ? (
            <p className="mt-1.5 text-[11px] font-bold text-green-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Number confirmed
            </p>
          ) : codeSent ? (
            <div className="mt-2 flex gap-2">
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(null); }}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm tracking-[0.3em] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              />
              <button
                onClick={verifyCode}
                disabled={otpBusy || code.replace(/\D/g, '').length < 4}
                className="h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-40"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {otpBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-500">
              So we can reach you if anything changes on the day.
            </p>
          )}
        </div>

        <HoneypotField />
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </p>
      )}

      <button
        onClick={goToTimes}
        disabled={!detailsReady}
        className="btn-tactile btn-tactile-primary mt-5 w-full px-6 py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40"
      >
        Choose a time <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        style={{ fontFamily: 'var(--font-inter)' }}
      />
    </div>
  );
}
