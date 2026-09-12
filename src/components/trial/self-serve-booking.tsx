'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Phone, CalendarCheck,
  Mail, User, BookOpen, GraduationCap, Clock, ShieldCheck, Globe,
} from 'lucide-react';
import { HoneypotField } from '@/components/security/honeypot';
import { groupByDay, slotLabel, type PublicSlot } from '@/lib/trial/public-slots';
import { trialSubjects, type TrialSubject } from '@/lib/trial/subjects';
import { COUNTRY_LIST, guessCountry, smsReachable } from '@/lib/phone/countries';
import { acceptPhone } from '@/lib/phone/accept';
import { GRADE_CHOICES } from '@/lib/grade/tag';
import {
  DEFAULT_TIME_ZONE, detectTimeZone, timeZoneOptions, timeZoneLabel,
  cityOf, utcOffsetLabel, localTimeLabel,
} from '@/lib/time/timezones';

/**
 * SARIRO — booking a free class, from anywhere on the site
 * ============================================================================
 * The whole trial used to need a seller: the parent left their details, a
 * human rang them, agreed a time, and typed it into a picker. That is a person
 * per booking, and it caps how many trials a day the company can run at
 * however many calls somebody can make. This is the same booking without the
 * call — and it is now the ONLY booking form: /free-class and /welcome#book
 * both render it, so every "book a free class" link on the site lands here.
 *
 * ── The time zone comes first ───────────────────────────────────────────────
 * The page used to guess a family's zone from the browser and never show the
 * guess. A parent in Dubai on a laptop still set to India time saw every slot
 * ninety minutes out and had no way to know which clock the page was reading.
 * So the first thing it does is say what it detected and let them correct it
 * — every time on the later steps is shown in that zone, and the booking
 * writes it to their profile so their dashboard reads the same clock.
 *
 * ── One question at a time ──────────────────────────────────────────────────
 * Everything used to be on a single card: name, grade, subject, a phone with
 * its code box, an email with its own code box. Each step now asks one thing
 * and shows how far along they are. Nothing is removed; a person is never
 * looking at more than one decision.
 *
 * ── India proves its number; the rest of the world does not have to ─────────
 * apitxt.com delivers SMS to India and nowhere else, so demanding a code
 * abroad demands the impossible. Numbers outside India are accepted
 * unverified and recorded as such.
 *
 * ── What it never shows ─────────────────────────────────────────────────────
 * No teacher names, no "3 of our 4 teachers are free", no empty evenings. A
 * public page that publishes your staff rota and its occupancy is a
 * competitor's research done for them. Times and seats, nothing else.
 */

type Step = 'timezone' | 'name' | 'phone' | 'email' | 'subject' | 'grade' | 'time' | 'done';

/** The order, and what the progress bar counts. `done` is not a step. */
const FLOW: Step[] = ['timezone', 'name', 'phone', 'email', 'subject', 'grade', 'time'];

const STEP_TITLE: Record<Step, string> = {
  timezone: 'Where are you joining from?',
  name: 'Who is the class for?',
  phone: 'How do we reach you?',
  email: 'And an email address',
  subject: 'What would they like to learn?',
  grade: 'Which grade are they in?',
  time: 'Pick a time',
  done: 'Booked',
};

interface Booked {
  slotStart: string;
  teacherName: string | null;
  signInUrl: string | null;
  existingAccount: boolean;
  /** A new account was made, and its password emailed. */
  newAccount: boolean;
}

/** Group for the <optgroup> headings, once per fetch rather than per keystroke. */
const groupSubjects = (list: TrialSubject[]): [string, TrialSubject[]][] =>
  Object.entries(
    list.reduce<Record<string, TrialSubject[]>>((acc, s) => {
      (acc[s.group] ??= []).push(s);
      return acc;
    }, {})
  );

export default function SelfServeBooking() {
  const [step, setStep] = useState<Step>('timezone');

  /* ── The time zone ───────────────────────────────────────────────────────
     `detectedTz` is null until the browser has answered, and everything that
     depends on it — the label, the local time, the list of zones — renders
     only after that. The server's list of zones and the browser's can differ,
     and rendering them on both sides would be a hydration mismatch on the
     very first thing a visitor sees. */
  const [detectedTz, setDetectedTz] = useState<string | null>(null);
  const [tz, setTz] = useState(DEFAULT_TIME_ZONE);
  const [country, setCountry] = useState('IN');
  /* Once somebody has touched the country picker, a later change of time zone
     must not overwrite their choice. Before that, the zone is the best guess
     at their country — a family in Dubai should not have to find +971. */
  const [countryTouched, setCountryTouched] = useState(false);

  useEffect(() => {
    const zone = detectTimeZone();
    setDetectedTz(zone);
    setTz(zone);
    setCountry(guessCountry(zone));
  }, []);

  const tzOptions = useMemo(
    () => (detectedTz ? timeZoneOptions(detectedTz) : { common: [] as string[], all: [] as string[] }),
    [detectedTz]
  );

  const changeTz = (next: string) => {
    setTz(next);
    if (!countryTouched) setCountry(guessCountry(next));
  };

  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  /* Every course, whether or not a teacher is free for it today — the
     founder's call. A family who picks one with nobody free is not turned
     away: the time step says every slot is filled and lets them carry on, and
     a counsellor arranges the class. Hiding the course would lose them before
     they had even asked. */
  const subjects: TrialSubject[] = trialSubjects();

  const [email, setEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);

  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  /** Why there are none, when there are none. 'no_teacher_for_subject' is the
      one worth saying out loud — it is not "we are full", it is "nobody here
      teaches that yet", and those need different sentences. */
  const [slotReason, setSlotReason] = useState<string | null>(null);
  const [chosen, setChosen] = useState<PublicSlot | null>(null);

  /* "None of these times work." The most motivated visitor on the page is the
     one who got this far and found nothing — and until now the form had no
     exit for them at all, so they simply left. */
  const [assistOpen, setAssistOpen] = useState(false);
  const [preference, setPreference] = useState('');
  const [assisted, setAssisted] = useState(false);
  /* The one-time sign-in link for a family who carried on without a slot. */
  const [assistedUrl, setAssistedUrl] = useState<string | null>(null);
  const [assistedNewAccount, setAssistedNewAccount] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Booked | null>(null);

  /* Whether we could send this number a code at all. Everything about the
     phone step branches on it. */
  const canVerifyPhone = smsReachable(country);
  const parsedPhone = useMemo(() => acceptPhone(phone, country), [phone, country]);
  const phoneUsable = parsedPhone.ok && (canVerifyPhone ? phoneVerified : true);


  /* ── The phone, proved (India only) ─────────────────────────────────────── */
  const sendCode = async () => {
    setOtpBusy(true); setError(null);
    try {
      const r = await fetch('/api/phone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone: parsedPhone.ok ? parsedPhone.e164 : phone }),
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
        body: JSON.stringify({ action: 'verify', phone: parsedPhone.ok ? parsedPhone.e164 : phone, code }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) { setError(j?.message ?? 'That code did not match.'); return; }
      setPhoneVerified(true);
      setStep('email');
    } catch {
      setError('Could not reach us just now. Try again in a moment.');
    } finally { setOtpBusy(false); }
  };

  /* ── The email, proved ─────────────────────────────────────────────────── */
  const sendEmailCode = async () => {
    setEmailBusy(true); setError(null);
    try {
      const r = await fetch('/api/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: email.trim() }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) { setError(j?.message ?? 'We could not send a code to that address.'); return; }
      setEmailCodeSent(true);
    } catch {
      setError('Could not reach us just now. Check your connection and try again.');
    } finally { setEmailBusy(false); }
  };

  const verifyEmailCode = async () => {
    setEmailBusy(true); setError(null);
    try {
      const r = await fetch('/api/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: email.trim(), code: emailCode }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) { setError(j?.message ?? 'That code did not match.'); return; }
      setEmailVerified(true);
      setStep('subject');
    } catch {
      setError('Could not reach us just now. Try again in a moment.');
    } finally { setEmailBusy(false); }
  };

  /* ── The times ─────────────────────────────────────────────────────────── */
  const loadSlots = useCallback(async () => {
    setSlots(null); setChosen(null); setError(null);
    try {
      // The subject goes with the grade: together they decide which teachers
      // can appear at all. §13. Slots come back as real instants; the zone
      // only decides how they are written, which is why it is not sent here.
      const r = await fetch(
        `/api/trial/slots?seats=1&grade=${grade ?? ''}&subject=${encodeURIComponent(subject)}`
      );
      const j = await r.json().catch(() => null);
      setSlots(j?.ok ? (j.slots as PublicSlot[]) : []);
      setSlotReason(j?.reason ?? null);
    } catch {
      setSlots([]);
      setSlotReason(null);
    }
  }, [grade, subject]);

  const goToTimes = async () => {
    setStep('time');
    await loadSlots();
  };

  const days = useMemo(() => (slots ? groupByDay(slots, tz) : []), [slots, tz]);

  /* ── Straight into their account ────────────────────────────────────────
     Finish the form, land signed in on the class page. The one-time link from
     the booking route does that; the pause is only long enough to read
     "booked". A family who could not be signed in automatically keeps the
     "Sign in" button instead. /my-class sends anybody who already has a
     course on to the full student dashboard. */
  useEffect(() => {
    const url = booked?.signInUrl ?? assistedUrl;
    if (!url) return;
    const timer = setTimeout(() => window.location.assign(url), 2200);
    return () => clearTimeout(timer);
  }, [booked, assistedUrl]);

  /* ── Book it ───────────────────────────────────────────────────────────── */
  const confirm = async () => {
    if (!chosen || !parsedPhone.ok) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/trial/self-book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, grade, phone: parsedPhone.e164, country, timezone: tz,
          email: email.trim(), subject,
          teacherId: chosen.teacherId, slotStart: chosen.iso,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setError(j?.message ?? 'We could not complete that booking. Please try again.');
        // Somebody took the seat while they were deciding. Refresh rather than
        // leave them staring at a time that no longer exists.
        if (j?.error === 'slot_full' || j?.error === 'slot_gone') await loadSlots();
        return;
      }
      setBooked({
        slotStart: j.slotStart, teacherName: j.teacherName,
        signInUrl: j.signInUrl ?? null, existingAccount: !!j.existingAccount,
        newAccount: !!j.newAccount,
      });
      setStep('done');
    } catch {
      setError('Could not reach us just now. Your class is not booked — please try again.');
    } finally { setBusy(false); }
  };

  /* ── "None of these slots work for me" ──────────────────────────────────
     Deliberately does NOT create a booking. Inventing a class to represent
     one that will not happen puts a ghost in a teacher's calendar and in
     every trial count, and fires a reminder the night before for a time the
     family already said does not work. It creates a LEAD, on a seller's
     desk, in their Needs Slot Assistance queue. */
  const askForHelp = async () => {
    if (!parsedPhone.ok) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/trial/slot-assistance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email: email.trim(), phone: parsedPhone.e164, country,
          subject, grade, timezone: tz, preference: preference.trim(),
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) { setError(j?.message ?? 'We could not save that. Please ring us instead.'); return; }
      setAssistedUrl(j.signInUrl ?? null);
      setAssistedNewAccount(!!j.newAccount);
      setAssisted(true);
    } catch {
      setError('Could not reach us just now. Please try again.');
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
          {cityOf(tz)} time. Thirty minutes, nothing to pay, and no card anywhere.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          {booked.newAccount
            ? <>We’ve emailed your booking and a password for next time to <strong>{email}</strong>.</>
            : <>We’ve emailed your booking to <strong>{email}</strong>.</>}
        </p>

        {booked.signInUrl ? (
          <>
            <p className="mt-5 text-sm text-slate-600 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Signing you in and opening your class page…
            </p>
            <a href={booked.signInUrl} className="btn-tactile btn-tactile-primary mt-3 px-6 py-3 text-sm inline-flex items-center justify-center gap-2">
              Go to your class page now <ArrowRight className="w-4 h-4" />
            </a>
          </>
        ) : (
          /* They already have an account on that email. We will not hand out a
             session for an identity this request did not prove — they sign in
             as normal and the class is waiting. */
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

  /* ══ They asked us to find a time ═══════════════════════════════════════ */
  if (assisted) {
    return (
      <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Phone className="w-7 h-7 text-blue-700" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          We will ring you.
        </h2>
        <p className="mt-2 text-[15px] text-slate-700">
          A Sariro counsellor will call {parsedPhone.ok ? parsedPhone.e164 : 'you'} and arrange the class
          at a time that suits you — usually within a day.
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {assistedNewAccount
            ? <>We’ve emailed the details and a password for next time to <strong>{email}</strong>.</>
            : <>We’ve emailed the details to <strong>{email}</strong>.</>}
        </p>
        {assistedUrl ? (
          <p className="mt-5 text-sm text-slate-600 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Signing you in to your account…
          </p>
        ) : (
          <a href="/auth/sign-in?next=/my-class" className="btn-tactile btn-tactile-primary mt-6 px-6 py-3 text-sm inline-flex items-center justify-center gap-2">
            Sign in to your account <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  const index = FLOW.indexOf(step);
  const back = index > 0 ? FLOW[index - 1] : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      {/* ── Where they are ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-4">
        {FLOW.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < index ? 'bg-green-500' : i === index ? 'bg-blue-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {STEP_TITLE[step]}
        </h2>
        <span className="text-[11px] font-bold text-slate-400 shrink-0" style={{ fontFamily: 'var(--font-grotesk)' }}>
          {index + 1} of {FLOW.length}
        </span>
      </div>

      {back && (
        <button
          onClick={() => { setStep(back); setError(null); }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}

      <HoneypotField />

      {/* ══ 1. The time zone ═══════════════════════════════════════════════ */}
      {step === 'timezone' && (
        <Field icon={Globe} hint="Every time on the next pages is shown in this zone, so a slot means the same hour on your own clock.">
          {detectedTz === null ? (
            <div className="h-24 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Working out your time zone…
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {tz === detectedTz ? 'We detected' : 'You picked'}
                </p>
                <p className="mt-0.5 text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {cityOf(tz)}{' '}
                  <span className="text-sm font-semibold text-slate-500">· {utcOffsetLabel(tz)}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">It’s {localTimeLabel(tz)} there right now.</p>
              </div>

              <label className="block mt-4">
                <span className="text-xs font-semibold text-slate-600">
                  Not your time zone? Please pick yours, so we can find slots around your day.
                </span>
                <select
                  value={tz}
                  onChange={(e) => changeTz(e.target.value)}
                  className="mt-1.5 w-full h-12 px-3 rounded-xl border border-slate-200 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{ fontFamily: 'var(--font-inter)' }}
                  aria-label="Time zone"
                >
                  <optgroup label="Where most families are">
                    {tzOptions.common.map((z) => <option key={z} value={z}>{timeZoneLabel(z)}</option>)}
                  </optgroup>
                  <optgroup label="Every time zone">
                    {tzOptions.all.map((z) => <option key={z} value={z}>{timeZoneLabel(z)}</option>)}
                  </optgroup>
                </select>
              </label>

              <Next onClick={() => setStep('name')}>
                {tz === detectedTz ? 'Yes, that’s right' : `Use ${cityOf(tz)} time`}
              </Next>
            </>
          )}
        </Field>
      )}

      {/* ══ 2. The name ════════════════════════════════════════════════════ */}
      {step === 'name' && (
        <Field icon={User} hint="Whoever is filling this in decides whose name it is — the child's or your own.">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim().length > 1) setStep('phone'); }}
            placeholder="Student's name"
            autoComplete="name"
            autoFocus
            className="w-full h-12 px-3 rounded-xl border border-slate-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{ fontFamily: 'var(--font-inter)' }}
          />
          <Next onClick={() => setStep('phone')} disabled={name.trim().length < 2}>Continue</Next>
        </Field>
      )}

      {/* ══ 3. Country + phone, and a code if we can send one ══════════════ */}
      {step === 'phone' && (
        <Field
          icon={Phone}
          hint={
            canVerifyPhone
              ? 'We send a six-digit code. It is how we reach you about the class.'
              : 'We can only text Indian numbers at the moment, so we will confirm yours when we ring.'
          }
        >
          <div className="flex gap-2">
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setCountryTouched(true);
                /* A code sent to the old number proves nothing about the new
                   one. Changing the country restarts the proof. */
                setCodeSent(false); setPhoneVerified(false); setCode(''); setError(null);
              }}
              className="h-12 px-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{ fontFamily: 'var(--font-inter)' }}
              aria-label="Country"
            >
              {COUNTRY_LIST.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} +{c.dial}</option>
              ))}
            </select>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setCodeSent(false); setPhoneVerified(false); setError(null);
              }}
              placeholder="Phone number"
              autoComplete="tel"
              autoFocus
              disabled={phoneVerified}
              className="flex-1 h-12 px-3 rounded-xl border border-slate-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-50"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
          </div>

          {/* The number as it will actually be stored, so a mis-picked country
              is visible before it costs them a call. */}
          {parsedPhone.ok && (
            <p className="mt-1.5 text-[11px] text-slate-500">
              We will save this as <span className="font-bold text-slate-700">{parsedPhone.e164}</span>
            </p>
          )}
          {!parsedPhone.ok && phone.trim().length > 3 && (
            <p className="mt-1.5 text-[11px] text-amber-700">{parsedPhone.problem}</p>
          )}

          {/* India: prove it. Everywhere else: straight on. */}
          {canVerifyPhone ? (
            phoneVerified ? (
              <>
                <p className="mt-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Number confirmed.
                </p>
                <Next onClick={() => setStep('email')}>Continue</Next>
              </>
            ) : codeSent ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                  placeholder="6-digit code"
                  autoFocus
                  className="flex-1 h-12 px-3 rounded-xl border border-slate-200 text-[15px] tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
                <button
                  onClick={verifyCode}
                  disabled={otpBusy || code.length < 4}
                  className="h-12 px-5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-40"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {otpBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </button>
              </div>
            ) : (
              <Next onClick={sendCode} disabled={!parsedPhone.ok || otpBusy}>
                {otpBusy ? 'Sending…' : 'Send me a code'}
              </Next>
            )
          ) : (
            <Next onClick={() => setStep('email')} disabled={!parsedPhone.ok}>Continue</Next>
          )}

          {canVerifyPhone && codeSent && !phoneVerified && (
            <button onClick={sendCode} disabled={otpBusy} className="mt-2 text-[11px] font-bold text-slate-500 hover:text-slate-800">
              Send it again
            </button>
          )}
        </Field>
      )}

      {/* ══ 4. Email ═══════════════════════════════════════════════════════ */}
      {step === 'email' && (
        <Field icon={Mail} hint="This is how they sign in to their class page afterwards.">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailCodeSent(false); setEmailVerified(false); setError(null); }}
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            disabled={emailVerified}
            className="w-full h-12 px-3 rounded-xl border border-slate-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-50"
            style={{ fontFamily: 'var(--font-inter)' }}
          />

          {emailVerified ? (
            <>
              <p className="mt-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Address confirmed.
              </p>
              <Next onClick={() => setStep('subject')}>Continue</Next>
            </>
          ) : emailCodeSent ? (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={emailCode}
                onChange={(e) => { setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                placeholder="6-digit code"
                autoFocus
                className="flex-1 h-12 px-3 rounded-xl border border-slate-200 text-[15px] tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
              <button
                onClick={verifyEmailCode}
                disabled={emailBusy || emailCode.length < 4}
                className="h-12 px-5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-40"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {emailBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </button>
            </div>
          ) : (
            <Next
              onClick={sendEmailCode}
              disabled={emailBusy || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim())}
            >
              {emailBusy ? 'Sending…' : 'Send me a code'}
            </Next>
          )}

          {emailCodeSent && !emailVerified && (
            <button onClick={sendEmailCode} disabled={emailBusy} className="mt-2 text-[11px] font-bold text-slate-500 hover:text-slate-800">
              Send it again
            </button>
          )}
        </Field>
      )}

      {/* ══ 5. Subject ═════════════════════════════════════════════════════ */}
      {step === 'subject' && (
        <Field
          icon={BookOpen}
          hint="Every course we teach. If every slot for it is taken, you can still book — a counsellor will arrange the time."
        >
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setError(null); }}
            autoFocus
            className="w-full h-12 px-3 rounded-xl border border-slate-200 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-50"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <option value="">Choose a course…</option>
            {groupSubjects(subjects).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </optgroup>
            ))}
          </select>
          <Next onClick={() => setStep('grade')} disabled={!subject}>Continue</Next>
        </Field>
      )}

      {/* ══ 6. Grade ═══════════════════════════════════════════════════════ */}
      {step === 'grade' && (
        <Field
          icon={GraduationCap}
          hint="A trial holds learners at the same level, so the class is pitched right. U is an undergraduate; P is a graduate or working professional."
        >
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {GRADE_CHOICES.filter((c) => c.value <= 12).map((c) => (
              <button
                key={c.value}
                onClick={() => { setGrade(c.value); setError(null); }}
                className={`h-12 rounded-xl border-2 text-sm font-bold transition-colors ${
                  grade === c.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
                aria-label={c.name}
              >
                {c.tag}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {GRADE_CHOICES.filter((c) => c.value > 12).map((c) => (
              <button
                key={c.value}
                onClick={() => { setGrade(c.value); setError(null); }}
                className={`min-h-12 px-3 py-2 rounded-xl border-2 text-left transition-colors ${
                  grade === c.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <span className="block text-sm font-bold">{c.tag}</span>
                <span className="block text-[11px] opacity-70">{c.name}</span>
              </button>
            ))}
          </div>
          <Next onClick={goToTimes} disabled={grade === null || !phoneUsable}>Find me a time</Next>
        </Field>
      )}

      {/* ══ 7. Time ════════════════════════════════════════════════════════ */}
      {step === 'time' && (
        <div>
          <p className="mt-1 text-sm text-slate-600 mb-3">
            Thirty minutes. Shown in <strong className="text-slate-800">{cityOf(tz)}</strong> time
            ({utcOffsetLabel(tz)}).{' '}
            <button
              onClick={() => { setStep('timezone'); setError(null); }}
              className="font-bold text-blue-700 hover:underline"
            >
              Change
            </button>
          </p>

          {slots === null ? (
            <div className="flex items-center gap-2 py-10 justify-center text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Finding times…
            </div>
          ) : days.length === 0 ? (
            /* Two different situations, and they need different sentences. "We
               are full" is a scheduling problem the family can wait out; "nobody
               here teaches that yet" is not, and pretending otherwise wastes
               their week. Either way they are not lost — somebody rings them. */
            /* Not a dead end. Every course is offered whether or not a teacher
               is free for it, so "no slots" is a normal ending: the family
               carries on, gets their account, and a counsellor arranges the
               class. Nothing is booked until then. */
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-bold text-amber-900">
                {slotReason === 'no_teacher_for_subject'
                  ? 'All slots for this course are filled up right now.'
                  : 'All slots are filled up right now.'}
              </p>
              <p className="mt-1 text-sm text-amber-900/90 leading-relaxed">
                You can still go ahead with your booking. Our counsellor will call you on{' '}
                <strong>{parsedPhone.ok ? parsedPhone.e164 : 'your number'}</strong> and arrange the
                class at a time that suits you.
              </p>
              <button
                onClick={askForHelp}
                disabled={busy}
                className="btn-tactile btn-tactile-primary mt-4 w-full px-6 py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Continue with my booking
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[22rem] overflow-y-auto pr-1">
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

          {days.length > 0 && (
            <button
              onClick={confirm}
              disabled={!chosen || busy}
              className="btn-tactile btn-tactile-primary mt-5 w-full px-6 py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarCheck className="w-5 h-5" />}
              {chosen ? `Book ${slotLabel(chosen.iso, tz)}` : 'Choose a time'}
            </button>
          )}

          {/* ── The exit that did not exist ──────────────────────────────── */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            {assistOpen ? (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  When would suit you? ({cityOf(tz)} time)
                </label>
                <textarea
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  rows={2}
                  autoFocus
                  placeholder="Weekday evenings after 6, or Saturday mornings…"
                  className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
                  style={{ fontFamily: 'var(--font-inter)' }}
                />
                <button
                  onClick={askForHelp}
                  disabled={busy}
                  className="mt-2 w-full h-12 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                  Ask us to find a time
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAssistOpen(true)}
                className="w-full text-sm font-bold text-blue-700 hover:text-blue-900 flex items-center justify-center gap-1.5"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <Clock className="w-4 h-4" />
                {days.length > 0 ? 'None of these slots work for me' : 'Add the times that suit you (optional)'}
              </button>
            )}
          </div>
        </div>
      )}

      {error && step !== 'time' && (
        <p className="mt-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One question, its icon, and the sentence under it
   ══════════════════════════════════════════════════════════════════════════ */

function Field({
  icon: Icon, hint, children,
}: {
  icon: typeof User;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-slate-600 mb-3 flex items-start gap-2">
        <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        {hint}
      </p>
      {children}
    </div>
  );
}

function Next({
  onClick, disabled, children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-tactile btn-tactile-primary mt-4 w-full px-6 py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40"
    >
      {children} <ArrowRight className="w-4 h-4" />
    </button>
  );
}
