'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Phone, CalendarCheck,
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
 * ── Two fields ──────────────────────────────────────────────────────────────
 * A name and a number, and that is the whole form. Everything else is
 * collected later: the email is offered on the confirmation screen once the
 * class is already booked, and anything else the seller asks when they ring.
 * Each field on an advert landing page costs people, and none of the ones
 * removed were needed to put a class in the diary.
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

  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  /* Asked AFTER the class is booked, not before. See the confirmation step. */
  const [email, setEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailDone, setEmailDone] = useState<string | null>(null);

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

  const detailsReady = name.trim().length > 1 && grade !== null && phoneVerified;

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
      const r = await fetch(`/api/trial/slots?seats=${seats}&grade=${grade ?? ''}`);
      const j = await r.json().catch(() => null);
      setSlots(j?.ok ? (j.slots as PublicSlot[]) : []);
    } catch {
      setSlots([]);
    }
  }, [grade]);

  const goToTimes = async () => {
    if (!detailsReady) { setError('Fill in the details above first.'); return; }
    setStep('time');
    await loadSlots(1);
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
          name, grade, phone, timezone: tz,
          teacherId: chosen.teacherId, slotStart: chosen.iso,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setError(j?.message ?? 'We could not complete that booking. Please try again.');
        // Somebody took the seat while they were deciding. Refresh rather than
        // leave them staring at a time that no longer exists.
        if (j?.error === 'slot_full' || j?.error === 'slot_gone') await loadSlots(1);
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

  /* ── The email, afterwards ─────────────────────────────────────────────── */
  const addEmail = async () => {
    setEmailBusy(true); setError(null);
    try {
      const r = await fetch('/api/trial/add-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email: email.trim() }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) { setError(j?.message ?? 'We could not save that.'); return; }
      // The class is booked either way; this only decides whether they can
      // walk straight into it.
      setEmailDone(j.signInUrl ?? '/auth/sign-in?next=/my-class');
    } catch {
      setError('Could not reach us just now. Try again in a moment.');
    } finally { setEmailBusy(false); }
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

        {/* "Later we can collect more information." This is later.
            A phone-only account has no way back in — there is no phone sign-in
            on this site — so without an email the parent can never reopen
            their own class page. Offered here, after the booking is safe, as
            something they can skip. */}
        {!booked.signInUrl && !booked.existingAccount && (
          <div className="mt-6 text-left rounded-xl border border-green-200 bg-white p-4">
            {emailDone ? (
              <a href={emailDone} className="btn-tactile btn-tactile-primary w-full px-6 py-3 text-sm inline-flex items-center justify-center gap-2">
                Go to your class page <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Want the joining link by email too?
                </p>
                <p className="text-xs text-slate-600 mt-0.5 mb-2.5">
                  Optional. We will message you on {phone} either way.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  />
                  <button
                    onClick={addEmail}
                    disabled={emailBusy || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())}
                    className="h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-40"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {emailBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
              </>
            )}
          </div>
        )}

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
            Nothing free in the next two weeks. We will ring you on {phone} and find a time —
            usually within a day.
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
                        {s.joining && (
                          <span className="block text-[10px] text-slate-400">{s.gradeLabel}</span>
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
        {/* A name and a number. Everything else — the email, what they want to
            learn, how many children — is collected afterwards or by the person
            who rings them. Five fields for a free class is four too many on a
            page somebody reached by tapping an advert. */}
        <Field label="Your name" value={name} onChange={setName} autoComplete="name" placeholder="" />

        {/* The grade, asked with the name and before any time is shown.
            A trial holds four children and one lesson cannot serve a grade 1
            and a grade 10 at once, so the first child to book a slot fixes it
            at their grade plus or minus one. Without this the times offered
            would include classes this child could never actually join. */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Which grade are they in?
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <button
                key={g}
                onClick={() => { setGrade(g); setError(null); }}
                className={`h-10 rounded-lg border-2 text-sm font-bold transition-colors ${
                  grade === g ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            So we put them with children at the same level.
          </p>
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
