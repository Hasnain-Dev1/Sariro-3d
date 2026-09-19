'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera, CheckCircle2, CircleHelp, Compass, Footprints, ImageIcon, KeyRound, Lightbulb, Loader2, RefreshCw, SendHorizonal,
  Sparkles, Star, ThumbsUp, TriangleAlert, Wand2, X,
} from 'lucide-react';
import RichText from '@/components/practice/lab/rich-text';
import type { Review, Solution } from '@/lib/practice/maths/coach';

/**
 * SARIRO — the Maths room's AI coach
 * ============================================================================
 * Type a problem or photograph it, then:
 *   · "Guide me"          — a conversation, one step at a time
 *   · "Show the solution" — every step, the answer, how to check it, the key
 *                           idea — and "Show another way" for a second method
 *   · "Check my working"  — typed or a photo of the page: the first wrong line
 *                           and how to fix it, and a rating of the approach
 * Claude, through /api/practice/maths-coach (it fails closed, and every call
 * comes off the learner's daily allowance). The practice questions can send a
 * problem straight here with the learner's answer as their working.
 */

type Phase = 'idle' | 'busy';
interface Img { media_type: 'image/jpeg'; data: string; preview: string }
interface ChatMsg { who: 'student' | 'coach'; text: string }

const RATINGS: { key: keyof Review['ratings']; label: string }[] = [
  { key: 'understanding', label: 'Understanding' },
  { key: 'method', label: 'Method' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'presentation', label: 'Presentation' },
];

let aiKnown: boolean | null = null;

/** A photo, shrunk to at most 1600px and re-encoded as JPEG, so a phone photo fits comfortably. */
async function shrink(file: File): Promise<Img> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL('image/jpeg', 0.85);
  return { media_type: 'image/jpeg', data: url.split(',')[1], preview: url };
}

export default function MathsCoach({ grade, accent, prefill }: {
  grade: number;
  accent: string;
  /** From a practice question: its text, and the learner's answer. A new object each time. */
  prefill?: { problem: string; working?: string } | null;
}) {
  const [ai, setAi] = useState<boolean | null>(aiKnown);
  const [problem, setProblem] = useState('');
  const [working, setWorking] = useState('');
  const [showWorking, setShowWorking] = useState(false);
  const [image, setImage] = useState<Img | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [chat, setChat] = useState<ChatMsg[] | null>(null);
  const [say, setSay] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiKnown !== null) return;
    fetch('/api/practice/maths-coach', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { aiKnown = !!d.ai; setAi(aiKnown); })
      .catch(() => { aiKnown = false; setAi(false); });
  }, []);

  useEffect(() => {
    if (!prefill) return;
    setProblem(prefill.problem);
    setWorking(prefill.working ?? '');
    setShowWorking(!!prefill.working);
    setImage(null);
    setSolutions([]);
    setReview(null);
    setChat(null);
    setError(null);
  }, [prefill]);

  const clear = () => { setSolutions([]); setReview(null); setChat(null); setError(null); };

  const scrollToResults = () => setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const failed = async (res: Response) => {
    const d = await res.json().catch(() => ({}));
    if (d.error === 'tutor_off') { aiKnown = false; setAi(false); }
    if (typeof d.left === 'number') setLeft(d.left);
    if (d.error === 'limit') setLeft(0);
    setError(d.message ?? (d.error === 'not_enrolled' ? 'The AI coach is for students on a maths course.' : d.error === 'unauthenticated' ? 'Sign in again to use the coach.' : 'The coach could not answer just now — try again.'));
  };

  const ask = async (mode: 'solve' | 'another' | 'check') => {
    if (phase === 'busy') return;
    if (mode !== 'another') clear();
    setPhase('busy');
    setError(null);
    scrollToResults();
    try {
      const res = await fetch('/api/practice/maths-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode, grade, problem, working: mode === 'check' ? working : undefined,
          avoid: mode === 'another' ? solutions.map((s) => s.methodName).join('; ') : undefined,
          image: image ? { media_type: image.media_type, data: image.data } : undefined,
        }),
      });
      if (!res.ok) { await failed(res); return; }
      const d = await res.json();
      if (typeof d.left === 'number') setLeft(d.left);
      if (!d.ok) { setError(d.message ?? 'The coach could not answer that.'); return; }
      if (d.kind === 'review') setReview(d.data as Review);
      else setSolutions((s) => [...s, d.data as Solution]);
    } catch {
      setError('No connection — check your internet and try again.');
    } finally {
      setPhase('idle');
    }
  };

  const guide = async (text: string, fresh = false) => {
    const q = text.trim();
    if (!q || phase === 'busy') return;
    const history: ChatMsg[] = fresh ? [] : chat ?? [];
    if (fresh) { setSolutions([]); setReview(null); setError(null); }
    const next: ChatMsg[] = [...history, { who: 'student', text: q }, { who: 'coach', text: '' }];
    setChat(next);
    setSay('');
    setPhase('busy');
    scrollToResults();
    const set = (t: string) => setChat((c) => (c ? [...c.slice(0, -1), { who: 'coach', text: t }] : c));
    try {
      const res = await fetch('/api/practice/maths-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'guide', grade, problem,
          image: image ? { media_type: image.media_type, data: image.data } : undefined,
          messages: [...history, { who: 'student', text: q }].map((m) => ({ role: m.who === 'student' ? 'user' : 'assistant', content: m.text })),
        }),
      });
      if (!res.ok || !res.body) { setChat(history.length ? history : null); await failed(res); return; }
      const l = res.headers.get('X-Tutor-Left');
      if (l !== null) setLeft(Number(l));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        set(acc);
      }
      set(acc.trim() || 'Tell me which part is confusing and we will work through it together.');
    } catch {
      set('No connection — check your internet and ask again.');
    } finally {
      setPhase('idle');
    }
  };

  const onPhoto = async (f: File | undefined) => {
    if (!f) return;
    try { setImage(await shrink(f)); } catch { setError('That photo could not be read — try a JPG or PNG.'); }
  };

  const hasProblem = !!problem.trim() || !!image;
  const canCheck = hasProblem && (!!working.trim() || !!image);
  const busy = phase === 'busy';

  return (
    <div className="space-y-5">
      <div className="rounded-3xl p-5 sm:p-6 text-white" style={{ background: 'radial-gradient(circle at 15% 0%, #4F46E5, #0F172A 80%)' }}>
        <div className="flex flex-wrap items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><Sparkles className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>AI Coach</h2>
            <p className="text-[14px] text-white/80">Stuck on a problem, or want your working checked? Type it or snap a photo of your page.</p>
          </div>
          {left !== null && <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold">{left} AI question{left === 1 ? '' : 's'} left today</span>}
        </div>
      </div>

      {ai === false && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
          The AI coach is being switched on. Until then, every practice question still shows how it is done — and the hints help.
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
        <label htmlFor="coach-problem" className="text-[12px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>The problem</label>
        <textarea
          id="coach-problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value.slice(0, 2000))}
          rows={3}
          placeholder="e.g. A shop sells pens at ₹12 each. How much do 15 pens cost?  ·  Solve 3x + 7 = 22"
          className="mt-1.5 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed text-slate-900 outline-none focus:border-slate-400"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50">
            <Camera className="h-4 w-4" /> {image ? 'Change photo' : 'Add a photo'}
          </button>
          {image && (
            <span className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-1 pl-1 pr-2">
              {/* A data: URL made on the device — next/image has nothing to optimise here. */}
              <img src={image.preview} alt="Your photo" className="h-9 w-9 rounded-lg object-cover" />
              <span className="text-[12px] font-semibold text-slate-600">Photo added</span>
              <button type="button" onClick={() => setImage(null)} aria-label="Remove the photo" className="rounded-md p-0.5 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </span>
          )}
          <button type="button" onClick={() => setShowWorking((v) => !v)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50">
            <Footprints className="h-4 w-4" /> {showWorking ? 'Hide my working' : 'Add my working'}
          </button>
        </div>
        {showWorking && (
          <div className="mt-3">
            <label htmlFor="coach-working" className="text-[12px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>My working — one step per line</label>
            <textarea
              id="coach-working"
              value={working}
              onChange={(e) => setWorking(e.target.value.slice(0, 4000))}
              rows={4}
              placeholder={'3x + 7 = 22\n3x = 15\nx = 5'}
              className="mt-1.5 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 font-mono text-[14px] leading-relaxed text-slate-900 outline-none focus:border-slate-400"
            />
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button type="button" disabled={!hasProblem || busy || ai === false} onClick={() => void guide('Help me start this problem.', true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 text-[14px] font-extrabold disabled:opacity-40" style={{ borderColor: accent, color: accent }}>
            <Compass className="h-5 w-5" /> Guide me step by step
          </button>
          <button type="button" disabled={!hasProblem || busy || ai === false} onClick={() => void ask('solve')} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-[14px] font-extrabold text-white disabled:opacity-40" style={{ background: accent }}>
            <KeyRound className="h-5 w-5" /> Show the full solution
          </button>
          <button type="button" disabled={!canCheck || busy || ai === false} onClick={() => void ask('check')} title={canCheck ? undefined : 'Add your working (or a photo of it) first'} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-[14px] font-extrabold text-white disabled:opacity-40">
            <CheckCircle2 className="h-5 w-5" /> Check my working
          </button>
        </div>
      </div>

      <div ref={resultsRef} className="space-y-4 scroll-mt-4">
        {error && (
          <p className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-semibold text-rose-800"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p>
        )}

        {busy && !chat && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-[14px] text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: accent }} /> The coach is working it out…
          </div>
        )}

        {review && <ReviewCard review={review} accent={accent} />}

        <AnimatePresence>
          {solutions.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <SolutionCard solution={s} index={i} accent={accent} />
            </motion.div>
          ))}
        </AnimatePresence>
        {solutions.length > 0 && solutions[solutions.length - 1].isMaths && solutions.length < 3 && (
          <button type="button" disabled={busy} onClick={() => void ask('another')} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Show another way
          </button>
        )}

        {chat && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-slate-800"><Compass className="h-4 w-4" style={{ color: accent }} /> Step by step</p>
            <div className="space-y-3">
              {chat.map((m, i) => (
                <div key={i} className={m.who === 'student' ? 'flex justify-end' : 'flex'}>
                  {m.who === 'student'
                    ? <p className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-[14px] text-white" style={{ background: accent }}>{m.text}</p>
                    : <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[14px] leading-relaxed text-slate-800">
                        {m.text ? <RichText text={m.text} /> : <span className="inline-flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</span>}
                      </div>}
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void guide(say); }} className="mt-3 flex items-center gap-2">
              <input value={say} onChange={(e) => setSay(e.target.value.slice(0, 1500))} disabled={busy} placeholder="Answer the coach, or ask something…" aria-label="Your reply to the coach" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-[14px] outline-none focus:border-slate-400" />
              <button type="submit" disabled={busy || !say.trim()} aria-label="Send" className="flex h-11 w-11 items-center justify-center rounded-xl text-white disabled:opacity-40" style={{ background: accent }}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function SolutionCard({ solution, index, accent }: { solution: Solution; index: number; accent: string }) {
  if (!solution.isMaths) {
    return <p className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-700"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {solution.restated}</p>;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full px-2.5 py-0.5 text-[11.5px] font-extrabold text-white" style={{ background: accent }}>{index === 0 ? 'Worked solution' : `Another way ${index}`}</span>
        <span className="text-[12.5px] font-bold text-slate-500">{solution.methodName}</span>
      </div>
      <p className="mt-2 text-[15px] font-semibold text-slate-900">{solution.restated}</p>
      <ol className="mt-4 space-y-4">
        {solution.steps.map((st, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: accent }}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold text-slate-900">{st.title}</p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-[15px] leading-relaxed text-slate-900 ring-1 ring-slate-200">{st.work}</p>
              <p className="mt-1 text-[13px] text-slate-600">{st.why}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700" style={{ fontFamily: 'var(--font-grotesk)' }}>Answer</p>
        <p className="mt-0.5 text-[18px] font-extrabold text-emerald-900">{solution.answer}</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="flex gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-[13.5px] text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span><span className="font-bold text-slate-900">Check it: </span>{solution.check}</span></p>
        <p className="flex gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-950"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span><span className="font-bold">Key idea: </span>{solution.keyIdea}</span></p>
      </div>
    </div>
  );
}

const VERDICT = {
  correct: { label: 'All correct', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
  partly: { label: 'Partly right', cls: 'bg-amber-100 text-amber-800', Icon: Wand2 },
  incorrect: { label: 'Not quite yet', cls: 'bg-rose-100 text-rose-800', Icon: TriangleAlert },
  unreadable: { label: 'Couldn\'t read it', cls: 'bg-slate-100 text-slate-700', Icon: ImageIcon },
} as const;

function ReviewCard({ review, accent }: { review: Review; accent: string }) {
  if (!review.isMaths) return <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-700">{review.summary}</p>;
  const v = VERDICT[(review.verdict as keyof typeof VERDICT)] ?? VERDICT.partly;
  const scores = RATINGS.map((r) => review.ratings[r.key]);
  const overall = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-extrabold ${v.cls}`}><v.Icon className="h-4 w-4" /> {v.label}</span>
        <span className="ml-auto inline-flex items-center gap-0.5" aria-label={`Approach rated ${overall} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`h-5 w-5 ${overall >= n ? 'text-amber-400' : overall >= n - 0.5 ? 'text-amber-300' : 'text-slate-200'}`} fill={overall >= n - 0.5 ? 'currentColor' : 'none'} />
          ))}
        </span>
      </div>
      <p className="mt-3 text-[15px] text-slate-800">{review.summary}</p>

      {review.mistake && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-rose-700" style={{ fontFamily: 'var(--font-grotesk)' }}>The first thing to fix</p>
          <p className="mt-1.5 rounded-lg bg-white px-3 py-2 font-mono text-[14px] text-rose-900 ring-1 ring-rose-200">{review.mistake.quote}</p>
          <p className="mt-2 text-[14px] text-slate-800"><span className="font-bold">What went wrong: </span>{review.mistake.whatWentWrong}</p>
          <p className="mt-1 text-[14px] text-slate-800"><span className="font-bold">Why: </span>{review.mistake.why}</p>
          <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-[14px] text-emerald-900 ring-1 ring-emerald-200"><span className="font-bold">Try this: </span>{review.mistake.fix}</p>
        </div>
      )}

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {RATINGS.map((r) => {
          const n = review.ratings[r.key];
          return (
            <div key={r.key}>
              <div className="flex items-center justify-between text-[12.5px] font-bold text-slate-600"><span>{r.label}</span><span>{n}/5</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(n / 5) * 100}%`, background: n >= 4 ? '#10B981' : n >= 3 ? accent : '#F59E0B' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="flex gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-[13.5px] text-emerald-950"><ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span><span className="font-bold">Well done: </span>{review.strength}</span></p>
        <p className="flex gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-[13.5px] text-slate-800"><Footprints className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span><span className="font-bold">Next: </span>{review.nextStep}</span></p>
      </div>
      {review.otherWay && (
        <p className="mt-3 flex gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-[13.5px] text-indigo-950"><RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /><span><span className="font-bold">Another way: </span>{review.otherWay}</span></p>
      )}
    </motion.div>
  );
}
