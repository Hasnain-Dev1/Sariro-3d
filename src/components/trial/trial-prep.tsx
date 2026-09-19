'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Headphones, Mic, Brain, Hand, Loader2, Volume2, Sparkles, RotateCcw, ArrowRight, X } from 'lucide-react';
import { playbookFor, rankPaths, warmUpsFor, type TrialIntake, type Level } from '@/lib/trial/playbooks';
import { mergeIntake, stepsDone, micHeard, FEELING, type PrepStep } from '@/lib/trial/intake';
import { subjectLabel } from '@/lib/trial/subjects';
import { storyFor } from '@/lib/trial/stories';

/**
 * SARIRO — get class-ready
 * ============================================================================
 * The time between booking and the class used to be a countdown to stare at.
 * Now it is three small steps a child actually wants to do, and every answer
 * goes to the teacher's trial playbook before the class starts:
 *
 *   About you   how much they have done, what sounds fun, how they feel, and
 *               one question — the playbook uses these to pick the path
 *   Sound check the speakers say hello, the microphone has to hear a voice —
 *               the first five minutes of a trial are no longer lost to "can
 *               you hear me?"
 *   Warm-up     three questions at their grade, answered with an explanation
 *               right or wrong — a first win before class, and a read on
 *               where they are for the teacher
 *
 * Saved step by step through /api/trial/intake. If the database is not ready
 * the answers stay on this device and the page says so plainly.
 */

type SaveState = 'idle' | 'saving' | 'saved' | 'local' | 'error';

const STEP_META: Record<PrepStep, { title: string; time: string; icon: typeof Hand }> = {
  about: { title: 'Tell your teacher about you', time: '1 min', icon: Hand },
  sound: { title: 'Sound check', time: '30 sec', icon: Headphones },
  warmup: { title: 'Warm-up challenge', time: '1 min', icon: Brain },
};

export default function TrialPrep({
  bookingId,
  subject,
  grade,
  firstName,
  teacherName,
}: {
  bookingId: string;
  subject: string | null | undefined;
  grade: number | null | undefined;
  firstName: string;
  teacherName: string | null;
}) {
  const playbook = playbookFor(subject);
  /* The grade's trial story (lib/trial/stories): its hook is the teaser for the class. */
  const story = storyFor(subject, grade);
  const localKey = `sariro:trial-prep:${bookingId}`;
  const [intake, setIntake] = useState<TrialIntake>({});
  const [loaded, setLoaded] = useState(false);
  const [save, setSave] = useState<SaveState>('idle');
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<PrepStep | null>(null);

  useEffect(() => {
    let live = true;
    let local: TrialIntake = {};
    try { local = JSON.parse(localStorage.getItem(localKey) ?? '{}') as TrialIntake; } catch { /* nothing stored */ }
    fetch(`/api/trial/intake?bookingId=${encodeURIComponent(bookingId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        const server = (j?.ok && j.intake) ? (j.intake as TrialIntake) : null;
        const merged = mergeIntake(local, server ?? {});
        setIntake(merged);
        if (j?.ok && j.configured === false) setSave('local');
        const done = stepsDone(merged);
        setOpen(done.about ? (done.sound ? (done.warmup ? null : 'warmup') : 'sound') : 'about');
      })
      .catch(() => { if (live) { setIntake(local); setOpen('about'); } })
      .finally(() => { if (live) setLoaded(true); });
    return () => { live = false; };
  }, [bookingId, localKey]);

  const persist = useCallback(async (patch: TrialIntake, next: PrepStep | null) => {
    const merged = mergeIntake(intake, patch);
    setIntake(merged);
    try { localStorage.setItem(localKey, JSON.stringify(merged)); } catch { /* storage blocked */ }
    setSave('saving');
    setNote(null);
    try {
      const r = await fetch('/api/trial/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, intake: patch }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) setSave('saved');
      else if (j?.error === 'not_configured') { setSave('local'); setNote(j.message); }
      else { setSave('error'); setNote(j?.message ?? 'We could not send that just now. It is kept on this device.'); }
    } catch {
      setSave('error');
      setNote('Could not reach us just now. Your answers are kept on this device.');
    }
    setOpen(next);
  }, [bookingId, intake, localKey]);

  if (!loaded) return <div className="mt-6 h-40 rounded-2xl bg-slate-100 animate-pulse" aria-hidden />;

  const done = stepsDone(intake);
  const count = Object.values(done).filter(Boolean).length;
  const allDone = count === 3;
  const top = playbook && allDone ? rankPaths(playbook, { grade, intake })[0] : null;
  const subjectName = subject ? subjectLabel(subject) : 'this subject';

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden bg-white">
      <div className="relative px-5 py-4 text-white" style={{ background: 'linear-gradient(120deg, #2563EB, #7C3AED)' }}>
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(count / 3) * 97.4} 97.4`} className="transition-all duration-500" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black">{count}/3</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70" style={{ fontFamily: 'var(--font-grotesk)' }}>Before your class</p>
            <p className="text-[1.2rem] font-extrabold leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {allDone ? `You’re class-ready, ${firstName}! 🎉` : `Get class-ready, ${firstName}`}
            </p>
            <p className="text-[12.5px] text-white/80">
              {allDone
                ? `${teacherName ?? 'Your teacher'} will see your answers before the class starts.`
                : `Three quick steps. ${teacherName ?? 'Your teacher'} sees your answers and plans the class around you.`}
            </p>
          </div>
        </div>
      </div>

      {story && (
        <div className="mx-4 mt-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Your mission in class</p>
          <p className="mt-1 text-[16px] font-extrabold text-slate-900">{story.emoji} {story.title}</p>
          <p className="text-[12.5px] font-bold text-indigo-700">You will be {story.role}.</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-700">{story.hook}</p>
          <p className="mt-1.5 text-[11.5px] text-slate-400">{teacherName ?? 'Your teacher'} starts the story with you — and there are three chapters to solve.</p>
        </div>
      )}

      {!story && allDone && top && (
        <div className="mx-4 mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Your class could start with</p>
          <p className="mt-1 text-[15px] font-extrabold text-slate-900">{top.path.name}</p>
          <p className="text-[13px] text-slate-600">“{top.path.win}”</p>
          <p className="mt-1 text-[11.5px] text-slate-400">Your teacher decides on the day, once they have met you.</p>
        </div>
      )}

      <div className="p-4 space-y-2">
        {(['about', 'sound', 'warmup'] as PrepStep[]).map((step, i) => {
          const meta = STEP_META[step];
          const Icon = meta.icon;
          const isOpen = open === step;
          return (
            <div key={step} className={`rounded-xl border transition-colors ${isOpen ? 'border-blue-300 bg-blue-50/30' : done[step] ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'}`}>
              <button type="button" onClick={() => setOpen(isOpen ? null : step)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${done[step] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {done[step] ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-slate-900">{i + 1}. {meta.title}</span>
                  <span className="block text-[12px] text-slate-500">{done[step] ? 'Done — tap to change' : meta.time}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-3.5 pb-4">
                  {step === 'about' && <AboutStep intake={intake} playbook={playbook} subjectName={subjectName} onSave={(p) => persist(p, done.sound ? (done.warmup ? null : 'warmup') : 'sound')} saving={save === 'saving'} />}
                  {step === 'sound' && <SoundStep firstName={firstName} ok={intake.micOk === true} onHeard={() => persist({ micOk: true }, done.warmup ? null : 'warmup')} />}
                  {step === 'warmup' && playbook && <WarmUpStep questions={warmUpsFor(playbook, grade)} previous={intake.warmUp} onDone={(correct, total) => persist({ warmUp: { correct, total } }, null)} />}
                  {step === 'warmup' && !playbook && <p className="text-[13px] text-slate-500">Your teacher will start with a warm-up in class.</p>}
                </div>
              )}
            </div>
          );
        })}

        {(save === 'saved' || save === 'local' || save === 'error') && (
          <p className={`text-[12px] px-1 ${save === 'saved' ? 'text-emerald-700' : save === 'local' ? 'text-slate-500' : 'text-amber-700'}`}>
            {save === 'saved' ? `✓ Sent to ${teacherName ?? 'your teacher'}.` : note ?? 'Saved on this device — your teacher will ask you in class.'}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── 1. About you ─────────────────────────────────────────────────────────── */

function AboutStep({
  intake, playbook, subjectName, onSave, saving,
}: {
  intake: TrialIntake;
  playbook: ReturnType<typeof playbookFor>;
  subjectName: string;
  onSave: (p: TrialIntake) => void;
  saving: boolean;
}) {
  const [experience, setExperience] = useState<Level | undefined>(intake.experience);
  const [interests, setInterests] = useState<string[]>(intake.interests ?? []);
  const [feeling, setFeeling] = useState<number | undefined>(intake.feeling);
  const [question, setQuestion] = useState(intake.question ?? '');
  const ready = experience !== undefined || interests.length > 0 || feeling !== undefined;

  return (
    <div className="space-y-4">
      {playbook && (
        <div>
          <p className="text-[13px] font-bold text-slate-800 mb-2">How much {subjectName} have you done?</p>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {playbook.intake.experience.map((e) => (
              <button key={e.id} type="button" onClick={() => setExperience(e.id)}
                className={`rounded-xl border-2 px-3 py-2.5 text-[13px] font-semibold text-left transition-colors ${experience === e.id ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {playbook && (
        <div>
          <p className="text-[13px] font-bold text-slate-800 mb-2">What sounds fun? <span className="font-normal text-slate-500">Pick any</span></p>
          <div className="flex flex-wrap gap-1.5">
            {playbook.intake.interests.map((i) => {
              const on = interests.includes(i.id);
              return (
                <button key={i.id} type="button" onClick={() => setInterests((prev) => (prev.includes(i.id) ? prev.filter((x) => x !== i.id) : [...prev, i.id]))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all ${on ? 'border-violet-500 bg-violet-500 text-white scale-[1.03]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                  <span aria-hidden>{i.emoji}</span> {i.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <p className="text-[13px] font-bold text-slate-800 mb-2">How are you feeling about the class?</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setFeeling(n)} aria-label={FEELING[n].label} title={FEELING[n].label}
              className={`flex-1 rounded-xl border-2 py-2 text-2xl transition-transform ${feeling === n ? 'border-amber-400 bg-amber-50 scale-110' : 'border-slate-200 bg-white hover:scale-105'}`}>
              {FEELING[n].emoji}
            </button>
          ))}
        </div>
        {feeling !== undefined && <p className="mt-1 text-[12px] text-slate-500 text-center">{FEELING[feeling].label}{feeling <= 2 ? ' — that is completely normal. Your teacher will start gently.' : ''}</p>}
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-800 mb-2">One question you would love answered <span className="font-normal text-slate-500">(optional)</span></p>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value.slice(0, 280))} rows={2} placeholder="e.g. How do games know when you win?"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-[16px] sm:text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
      </div>
      <button type="button" disabled={!ready || saving} onClick={() => onSave({ experience, interests, feeling, question: question.trim() || undefined })}
        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-[14px] font-bold inline-flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send to my teacher <ArrowRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

/* ── 2. Sound check ───────────────────────────────────────────────────────── */

function SoundStep({ firstName, ok, onHeard }: { firstName: string; ok: boolean; onHeard: () => void }) {
  const [heardSpeaker, setHeardSpeaker] = useState(false);
  const [state, setState] = useState<'idle' | 'listening' | 'heard' | 'denied' | 'unsupported'>(ok ? 'heard' : 'idle');
  const [level, setLevel] = useState(0);
  const stop = useRef<(() => void) | null>(null);
  const reported = useRef(ok);

  useEffect(() => () => stop.current?.(), []);

  const speak = () => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Hi ${firstName}! If you can hear this, your speakers are working.`);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch { /* no voice on this device */ }
  };

  const listen = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) { setState('unsupported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const history: number[] = [];
      let raf = 0;
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += v * v;
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 6));
        history.push(rms);
        if (history.length > 60) history.shift();
        if (micHeard(history) && !reported.current) {
          reported.current = true;
          setState('heard');
          onHeard();
          window.setTimeout(() => stop.current?.(), 1200);
        }
        raf = requestAnimationFrame(tick);
      };
      stop.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
        stop.current = null;
        setLevel(0);
      };
      setState('listening');
      tick();
    } catch {
      setState('denied');
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-slate-800">Speakers</p>
          <p className="text-[12px] text-slate-500">Press play — you should hear a hello.</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button type="button" onClick={speak} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-900 text-white text-[12.5px] font-bold"><Volume2 className="w-3.5 h-3.5" /> Play</button>
          <button type="button" onClick={() => setHeardSpeaker(true)} className={`inline-flex items-center gap-1 h-9 px-3 rounded-lg text-[12.5px] font-bold ${heardSpeaker ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
            <Check className="w-3.5 h-3.5" /> I heard it
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-slate-800">Microphone</p>
            <p className="text-[12px] text-slate-500">
              {state === 'heard' ? 'We heard you — your microphone works.' : state === 'listening' ? `Say “Hello, I’m ${firstName}!”` : 'Allow the microphone, then say hello.'}
            </p>
          </div>
          {state === 'heard' ? (
            <span className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-emerald-500 text-white text-[12.5px] font-bold"><Check className="w-3.5 h-3.5" /> Works</span>
          ) : state === 'listening' ? (
            <button type="button" onClick={() => { stop.current?.(); setState('idle'); }} className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-slate-100 text-slate-700 text-[12.5px] font-bold"><X className="w-3.5 h-3.5" /> Stop</button>
          ) : (
            <button type="button" onClick={listen} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-blue-600 text-white text-[12.5px] font-bold"><Mic className="w-3.5 h-3.5" /> Test mic</button>
          )}
        </div>
        {(state === 'listening' || state === 'heard') && (
          <div className="mt-3 flex items-end gap-[3px] h-10" aria-hidden>
            {Array.from({ length: 24 }, (_, i) => {
              const h = Math.max(0.08, Math.min(1, level * (0.55 + 0.45 * Math.sin((i / 23) * Math.PI))));
              return <span key={i} className={`flex-1 rounded-full transition-[height] duration-75 ${state === 'heard' ? 'bg-emerald-400' : 'bg-blue-500'}`} style={{ height: `${h * 100}%` }} />;
            })}
          </div>
        )}
        {state === 'denied' && <p className="mt-2 text-[12.5px] text-amber-800">The browser did not allow the microphone. Click the lock icon next to the address, allow the microphone, and try again — you will need it in class.</p>}
        {state === 'unsupported' && <p className="mt-2 text-[12.5px] text-amber-800">This browser cannot test the microphone here. Chrome or Edge on a laptop works best for class.</p>}
      </div>
    </div>
  );
}

/* ── 3. Warm-up ───────────────────────────────────────────────────────────── */

function WarmUpStep({
  questions, previous, onDone,
}: {
  questions: { q: string; options: string[]; answer: number; explain: string }[];
  previous?: { correct: number; total: number };
  onDone: (correct: number, total: number) => void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) return null;
  if (finished) {
    const great = correct === questions.length;
    return (
      <div className="text-center py-2">
        <p className="text-4xl" aria-hidden>{great ? '🏆' : correct > 0 ? '⭐' : '💪'}</p>
        <p className="mt-1 text-[1.3rem] font-extrabold text-slate-900">{correct} / {questions.length}</p>
        <p className="text-[13px] text-slate-600">{great ? 'Perfect! Your teacher will have something harder ready.' : 'Nice warm-up — your teacher will pick up from here.'}</p>
        <button type="button" onClick={() => { setI(0); setPicked(null); setCorrect(0); setFinished(false); }} className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-100 text-slate-700 text-[12.5px] font-bold">
          <RotateCcw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    );
  }

  const q = questions[i];
  const answered = picked !== null;
  return (
    <div>
      {previous && i === 0 && !answered && <p className="mb-2 text-[12px] text-slate-500">Last time: {previous.correct}/{previous.total}. Have another go?</p>}
      <div className="flex items-center gap-2 mb-2">
        {questions.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full ${k < i ? 'bg-blue-500' : k === i ? 'bg-blue-300' : 'bg-slate-200'}`} />)}
      </div>
      <p className="text-[15px] font-bold text-slate-900 leading-snug">{q.q}</p>
      <div className="mt-3 grid gap-1.5">
        {q.options.map((o, k) => {
          const isRight = answered && k === q.answer;
          const isWrong = answered && k === picked && k !== q.answer;
          return (
            <button key={o} type="button" disabled={answered}
              onClick={() => { setPicked(k); if (k === q.answer) setCorrect((c) => c + 1); }}
              className={`text-left rounded-xl border-2 px-3 py-2.5 text-[14px] font-semibold transition-colors ${isRight ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : isWrong ? 'border-rose-400 bg-rose-50 text-rose-900' : answered ? 'border-slate-200 bg-white text-slate-400' : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300'}`}>
              {o}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
          <p className="text-[13px] text-slate-700"><strong className={picked === q.answer ? 'text-emerald-700' : 'text-rose-600'}>{picked === q.answer ? 'Yes! ' : 'Not quite. '}</strong>{q.explain}</p>
          <button type="button"
            onClick={() => {
              if (i + 1 < questions.length) { setI(i + 1); setPicked(null); return; }
              setFinished(true);
              onDone(correct, questions.length);
            }}
            className="mt-2 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 text-white text-[12.5px] font-bold">
            {i + 1 < questions.length ? 'Next' : 'Finish'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
