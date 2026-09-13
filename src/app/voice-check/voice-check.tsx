'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Square, RotateCcw, Share2, Shuffle, ShieldCheck, Sparkles, Trophy, ArrowRight, Info, Zap, Loader2,
} from 'lucide-react';
import { analyseSpeech, scoreBreakdown, type SpeechReport } from '@/lib/speaking/analyse';
import { analyseModulation, type ModulationReport } from '@/lib/speaking/modulation';
import { micMessage } from '@/lib/speaking/mic';
import { useSpeechRecorder, type Recording } from '@/components/speaking/use-speech-recorder';
import {
  PROMPTS, nextPrompt, checkRecording, scoreBand, tilesFor, drillFor, shareMessage,
  TARGET_SECONDS, MAX_SECONDS, type Prompt, type ScoreBand, type Tile,
} from '@/lib/speaking/voice-check';

/**
 * SARIRO — Voice Check, the page
 * ============================================================================
 * Talk for 45 seconds, see what your voice did. Free, no account, and nothing
 * leaves the device — the recording is measured in the browser by the same
 * engine enrolled students practise against (use-speech-recorder + analyse).
 *
 * Three moments, and each gets the whole screen: a prompt worth talking about,
 * a timer that makes 45 seconds feel doable, and a scorecard worth sharing.
 */

type Outcome =
  | { kind: 'scored'; report: SpeechReport; modulation: ModulationReport; prevBest: number | null; isBest: boolean; sample?: boolean }
  | { kind: 'invalid'; message: string };

/**
 * What a result looks like, for somebody who cannot record one.
 *
 * iPhone Safari's speech recognition is unreliable and Firefox has none, so a
 * parent on either would otherwise meet a warning and nothing else. This is a
 * real report from the real engine, run on a realistic forty-second answer —
 * clearly labelled as a sample, never passed off as theirs.
 */
function sampleOutcome(): Extract<Outcome, { kind: 'scored' }> {
  /* A good answer with one real habit in it — which is what most children
     sound like. A flawless sample would make every real first attempt feel
     like failing by comparison. This one scores 80: steady pace, good pauses,
     and four "um"s that cost it every filler point. */
  const transcript =
    'my favourite food is pani puri um because every single bite is like a surprise you get the crunch then the spicy water ' +
    'and then uh the sweet chutney all at once and honestly nothing else does that um my whole family goes to the same stall ' +
    'every sunday and the uncle there already knows exactly how spicy we want it so basically if you have never tried it ' +
    'um you are really missing out on the best thing in the whole world and I think everyone should try it at least once';
  const frameMs = 50;
  const frames = 40_000 / frameMs;
  // Talking in phrases, with a breath roughly every six seconds.
  const levels = Array.from({ length: frames }, (_, i) => (i % 120 < 10 ? 0.004 : 0.22 + ((i * 7) % 11) * 0.02));
  const pitches = levels.map((l, i) => (l < 0.01 ? null : 180 + Math.sin(i / 9) * 38 + ((i * 13) % 7)));
  const report = analyseSpeech({ transcript, durationMs: 40_000, levels, frameMs });
  const modulation = analyseModulation({ levels, pitches, frameMs });
  return { kind: 'scored', report, modulation, prevBest: null, isBest: false, sample: true };
}

const BEST_KEY = 'sariro.voice-check.best';

function readBest(): number | null {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function writeBest(score: number) {
  try { localStorage.setItem(BEST_KEY, String(score)); } catch { /* private mode — the score still shows */ }
}

const TONE: Record<ScoreBand['tone'], { ring: string; chip: string; glow: string }> = {
  gold: { ring: '#F59E0B', chip: 'bg-amber-100 text-amber-800', glow: 'rgba(245,158,11,0.25)' },
  green: { ring: '#16A34A', chip: 'bg-green-100 text-green-800', glow: 'rgba(22,163,74,0.22)' },
  blue: { ring: '#2563EB', chip: 'bg-blue-100 text-blue-800', glow: 'rgba(37,99,235,0.22)' },
  violet: { ring: '#7C3AED', chip: 'bg-violet-100 text-violet-800', glow: 'rgba(124,58,237,0.22)' },
};

export default function VoiceCheck() {
  const [prompt, setPrompt] = useState<Prompt>(PROMPTS[0]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const onStop = useCallback((rec: Recording) => {
    const report = analyseSpeech({
      transcript: rec.transcript,
      durationMs: rec.durationMs,
      levels: rec.levels,
      frameMs: rec.frameMs,
    });
    const validity = checkRecording({ durationMs: rec.durationMs, words: report.words, heardWords: rec.heardWords });
    if (!validity.ok) {
      setOutcome({ kind: 'invalid', message: validity.message });
      return;
    }
    const modulation = analyseModulation({ levels: rec.levels, pitches: rec.pitches, frameMs: rec.frameMs });
    const prevBest = readBest();
    const isBest = prevBest === null || report.score > prevBest;
    if (isBest) writeBest(report.score);
    setOutcome({ kind: 'scored', report, modulation, prevBest, isBest });
  }, []);

  const { blocker, state, elapsed, transcript, error, level, start, stop, reset } = useSpeechRecorder({ onStop });

  // The recording stops itself, so a forgotten tab is never left listening.
  useEffect(() => {
    if (state !== 'recording') return;
    const id = window.setTimeout(() => stop(), MAX_SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, [state, stop]);

  const tryAgain = () => {
    reset();
    setOutcome(null);
    setPrompt((p) => nextPrompt(p.id));
  };

  const stage: 'intro' | 'recording' | 'result' =
    state === 'recording' ? 'recording' : outcome ? 'result' : 'intro';

  return (
    <main className="min-h-screen bg-[#FBF9F6]">
      <header className="px-5 pt-6 pb-2 max-w-lg mx-auto flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Sariro" width={34} height={34} priority className="rounded-lg" />
          <span className="text-lg font-extrabold text-[#1A1611]" style={{ fontFamily: 'var(--font-jakarta)' }}>Sariro</span>
        </Link>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <Mic className="w-3 h-3" /> Voice Check
        </span>
      </header>

      <div className="max-w-lg mx-auto px-5 pb-16 relative">
        {/* initial={false}: the first screen is in the server HTML at full
            opacity. With an entrance animation it arrived at opacity 0, so on a
            slow phone opening an ad link the headline was invisible until the
            JavaScript loaded — exactly the visitor this page is for.
            popLayout: the next screen appears at once rather than waiting for
            the last one to finish leaving. */}
        <AnimatePresence initial={false} mode="popLayout">
          {stage === 'intro' && (
            <motion.section key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Intro
                prompt={prompt}
                onShuffle={() => setPrompt((p) => nextPrompt(p.id))}
                onStart={start}
                onSample={() => setOutcome(sampleOutcome())}
                blocker={blocker}
                error={error}
              />
            </motion.section>
          )}

          {stage === 'recording' && (
            <motion.section key="recording" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Recorder prompt={prompt} elapsed={elapsed} level={level} transcript={transcript} onStop={stop} />
            </motion.section>
          )}

          {stage === 'result' && outcome?.kind === 'invalid' && (
            <motion.section key="invalid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                <Info className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="mt-3 text-[15px] text-amber-900 leading-relaxed">{outcome.message}</p>
                <button onClick={tryAgain} className="btn-tactile btn-tactile-primary mt-5 px-6 py-3 text-sm inline-flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Try again
                </button>
              </div>
            </motion.section>
          )}

          {stage === 'result' && outcome?.kind === 'scored' && (
            <motion.section key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Scorecard outcome={outcome} onTryAgain={tryAgain} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1. The prompt
   ══════════════════════════════════════════════════════════════════════════ */

function Intro({
  prompt, onShuffle, onStart, onSample, blocker, error,
}: {
  prompt: Prompt;
  onShuffle: () => void;
  onStart: () => void;
  onSample: () => void;
  blocker: string | null;
  error: string | null;
}) {
  return (
    <>
      <div className="pt-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-800 text-[11px] font-bold" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <Sparkles className="w-3 h-3" /> Free · 45 seconds · no sign-up
        </span>
        <h1 className="mt-3 text-[30px] leading-[1.15] sm:text-4xl font-extrabold text-[#1A1611] tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
          How does your child<br />
          <span className="text-blue-700">really sound?</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          Talk for 45 seconds and get an instant speaking score — pace, filler words, pauses and
          expression — with one drill to get better straight away.
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Your prompt
          </p>
          <button onClick={onShuffle} className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-700 hover:text-blue-900" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <Shuffle className="w-3.5 h-3.5" /> Another one
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={prompt.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="mt-3 text-xl font-extrabold text-slate-900 leading-snug"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <span className="mr-2">{prompt.emoji}</span>{prompt.text}
          </motion.p>
        </AnimatePresence>
      </div>

      {blocker ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[13px] text-amber-900 leading-[1.6]">
            <p className="font-bold mb-1">{micMessage(blocker as 'insecure' | 'no-recognition').title}</p>
            <p>{micMessage(blocker as 'insecure' | 'no-recognition').body}</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={onStart}
            disabled={blocker === null}
            aria-label="Start speaking"
            className="relative w-28 h-28 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
          >
            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25" />
            {blocker === null ? <Loader2 className="w-9 h-9 animate-spin" /> : <Mic className="w-10 h-10" />}
          </button>
          <p className="mt-3 text-sm font-bold text-slate-700" style={{ fontFamily: 'var(--font-grotesk)' }}>Tap and start talking</p>
          {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
        </div>
      )}

      <div className="mt-6 text-center">
        <button onClick={onSample} className="text-[13px] font-bold text-slate-500 hover:text-slate-900 underline underline-offset-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
          {blocker ? 'See what a result looks like' : 'Not now? See a sample result'}
        </button>
      </div>

      <p className="mt-8 text-[12px] text-slate-500 flex items-start gap-2 justify-center text-center">
        <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
        Your voice never leaves this device. Nothing is recorded, uploaded or stored.
      </p>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. Talking
   ══════════════════════════════════════════════════════════════════════════ */

function Recorder({
  prompt, elapsed, level, transcript, onStop,
}: {
  prompt: Prompt;
  elapsed: number;
  level: number;
  transcript: string;
  onStop: () => void;
}) {
  const progress = Math.min(1, elapsed / TARGET_SECONDS);
  const remaining = Math.max(0, TARGET_SECONDS - elapsed);
  const R = 88;
  const C = 2 * Math.PI * R;
  // Nine bars that move with the voice, so they can SEE they are being heard.
  const bars = Array.from({ length: 9 }, (_, i) => {
    const wave = Math.sin((elapsed * 3 + i) * 1.3) * 0.5 + 0.5;
    return Math.max(0.12, Math.min(1, level * 5 * (0.55 + wave * 0.45)));
  });

  return (
    <div className="pt-6 text-center">
      <p className="text-[15px] font-bold text-slate-700 leading-snug px-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {prompt.emoji} {prompt.text}
      </p>

      <div className="relative mx-auto mt-8 w-56 h-56">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <circle
            cx="100" cy="100" r={R} fill="none" stroke={progress >= 1 ? '#16A34A' : '#2563EB'}
            strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-end gap-1 h-10">
            {bars.map((h, i) => (
              <span key={i} className="w-1.5 rounded-full bg-blue-600" style={{ height: `${h * 100}%`, transition: 'height 90ms ease-out' }} />
            ))}
          </div>
          <p className="mt-2 text-4xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {remaining > 0 ? remaining : '✓'}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {remaining > 0 ? 'seconds to go' : 'great — finish your thought'}
          </p>
        </div>
      </div>

      <p className="mt-6 min-h-[3rem] text-[13px] text-slate-500 italic leading-relaxed line-clamp-2 px-3">
        {transcript ? `“${transcript.split(' ').slice(-18).join(' ')}”` : 'Listening…'}
      </p>

      <button onClick={onStop} className="btn-tactile btn-tactile-primary mt-4 px-8 py-4 text-base inline-flex items-center gap-2">
        <Square className="w-4 h-4 fill-white" /> I&apos;m done — show my score
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. The scorecard
   ══════════════════════════════════════════════════════════════════════════ */

function Scorecard({
  outcome, onTryAgain,
}: {
  outcome: Extract<Outcome, { kind: 'scored' }>;
  onTryAgain: () => void;
}) {
  const { report, modulation, prevBest, isBest, sample } = outcome;
  const band = scoreBand(report.score);
  const tone = TONE[band.tone];
  const tiles = tilesFor(report, modulation);
  const drill = drillFor(report);
  const parts = scoreBreakdown(report);
  const notes = report.notes.slice(0, 2);
  const improvedBy = prevBest !== null && isBest ? report.score - prevBest : 0;

  return (
    <div className="pt-4">
      <style>{'@keyframes vcGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}'}</style>
      {sample && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-[13px] text-blue-900">
          <strong>Sample result</strong> — the real engine, on a 40-second answer about pani puri. Yours will be about you.
        </div>
      )}
      {/* The number */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 text-center shadow-sm" style={{ boxShadow: `0 20px 60px -20px ${tone.glow}` }}>
        {isBest && (
          <motion.span
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Trophy className="w-3.5 h-3.5" />
            {improvedBy > 0 ? `New best — up ${improvedBy} points!` : 'Your first score!'}
          </motion.span>
        )}
        <ScoreRing score={report.score} color={tone.ring} />
        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-extrabold ${tone.chip}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
          {band.label}
        </span>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{band.blurb}</p>

        {/* Where the number came from — five parts, twenty each. */}
        <div className="mt-5 grid grid-cols-5 gap-1.5">
          {([
            ['Pace', parts.pace], ['Flow', parts.phrasing], ['Fillers', parts.fillers], ['Pauses', parts.pausing], ['Voice', parts.delivery],
          ] as const).map(([label, pts], i) => (
            <div key={label}>
              <div className="h-16 rounded-lg bg-slate-100 flex items-end overflow-hidden">
                {/* The real height, always. The grow is decoration layered on
                    top, so a bar is never left at zero when animation stalls. */}
                <div
                  className="w-full rounded-lg"
                  style={{
                    background: tone.ring,
                    height: `${(pts / 20) * 100}%`,
                    transformOrigin: 'bottom',
                    animation: `vcGrow 0.6s ease-out ${0.3 + i * 0.08}s both`,
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] font-bold text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>{label}</p>
              <p className="text-[10px] text-slate-400 tabular-nums">{pts}/20</p>
            </div>
          ))}
        </div>
      </div>

      {/* The four numbers */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map((t) => <TileCard key={t.key} tile={t} />)}
      </div>

      {/* What a coach would say */}
      {notes.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Your coach says
          </p>
          <ul className="space-y-2.5">
            {notes.map((n, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.kind === 'good' ? 'bg-green-500' : n.kind === 'watch' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                {n.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* One drill, right now */}
      <div className="mt-4 rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb 60%, #7c3aed)' }}>
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-100 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <Zap className="w-3.5 h-3.5" /> Try this · {drill.seconds} seconds
        </p>
        <p className="mt-2 text-lg font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>{drill.title}</p>
        <p className="mt-1 text-sm text-blue-50 leading-relaxed">{drill.steps}</p>
        <button onClick={onTryAgain} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white text-blue-800 px-4 py-2.5 text-sm font-extrabold hover:bg-blue-50" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <RotateCcw className="w-4 h-4" /> {sample ? 'Now try it yourself' : `Try again and beat ${report.score}`}
        </button>
      </div>

      {!sample && <ShareButton score={report.score} band={band} tiles={tiles} />}

      {/* The way in */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-center">
        <p className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {report.score >= 90
            ? 'Ready for a bigger stage?'
            : `Want to push past ${Math.min(95, Math.ceil((report.score + 10) / 5) * 5)}?`}
        </p>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
          A real Public Speaking teacher, a class of four or fewer, and your first class is free.
        </p>
        <Link href="/free-class#book" className="btn-tactile btn-tactile-primary mt-4 px-6 py-3 text-sm inline-flex items-center gap-2">
          Book a free class <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="mt-6 text-[12px] text-slate-400 flex items-start gap-2 justify-center text-center">
        <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
        Measured on this device. Nothing was recorded, uploaded or stored.
      </p>
    </div>
  );
}

/**
 * Counts up to `target` — by the clock, not by animation frames.
 *
 * It used framer's frame loop, and a frame loop does not run in a background
 * tab or on a phone that is struggling: the number sat at 0 for ever. A score
 * that reads "0" is the worst thing this page can show, and the likeliest to be
 * screenshotted. Reading elapsed wall-clock time on every tick means the very
 * next tick after the duration lands on the real score, however late it comes.
 */
function useCountUp(target: number, durationMs = 1100): number {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setShown(t >= 1 ? target : Math.round(target * eased));
      if (t >= 1) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [target, durationMs]);
  return shown;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const shown = useCountUp(score);
  const R = 70;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative mx-auto mt-4 w-44 h-44">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="#F1F5F9" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={R} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {shown}
        </span>
        <span className="text-xs font-bold text-slate-400">out of 100</span>
      </div>
    </div>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>{tile.label}</p>
        <span className={`w-2 h-2 rounded-full ${tile.good ? 'bg-green-500' : 'bg-amber-500'}`} />
      </div>
      <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {tile.value} <span className="text-[11px] font-bold text-slate-400">{tile.unit}</span>
      </p>
      <p className="mt-1 text-[12px] text-slate-600 leading-snug">{tile.hint}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   The share card
   ══════════════════════════════════════════════════════════════════════════ */

function ShareButton({ score, band, tiles }: { score: number; band: ScoreBand; tiles: Tile[] }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const share = async () => {
    setBusy(true);
    setDone(null);
    try {
      const url = `${window.location.origin}/voice-check`;
      const text = shareMessage(score, band, url);
      const blob = await renderShareCard({ score, band, tiles, site: window.location.host });
      const file = blob ? new File([blob], 'sariro-voice-check.png', { type: 'image/png' }) : null;

      /* A phone's share sheet takes the picture straight to WhatsApp. Where it
         cannot carry a file, the picture is saved and the words are copied. */
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (file && nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        setDone('Shared!');
      } else if (blob) {
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = 'sariro-voice-check.png';
        a.click();
        URL.revokeObjectURL(href);
        try { await navigator.clipboard.writeText(text); } catch { /* the picture is the point */ }
        setDone('Score card saved — and the message copied.');
      }
    } catch (err) {
      // Closing the share sheet is not a failure.
      if (!(err instanceof DOMException && err.name === 'AbortError')) setDone('Could not share just now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 text-center">
      <button
        onClick={share}
        disabled={busy}
        className="w-full rounded-2xl border-2 border-slate-900 bg-white px-5 py-3.5 text-sm font-extrabold text-slate-900 hover:bg-slate-50 inline-flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        Share my score card
      </button>
      {done && <p className="mt-2 text-[12px] text-slate-500">{done}</p>}
    </div>
  );
}

/** A 1080×1350 picture — the shape WhatsApp and Instagram show whole. */
async function renderShareCard(opts: { score: number; band: ScoreBand; tiles: Tile[]; site: string }): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1e3a8a');
  bg.addColorStop(0.55, '#2563eb');
  bg.addColorStop(1, '#7c3aed');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const font = (weight: number, size: number) => `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = font(800, 38);
  ctx.fillText('SARIRO  VOICE CHECK', W / 2, 150);

  // The ring
  const cx = W / 2;
  const cy = 520;
  const r = 230;
  ctx.lineCap = 'round';
  ctx.lineWidth = 36;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#FBBF24';
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * opts.score) / 100); ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = font(900, 200);
  ctx.fillText(String(opts.score), cx, cy + 60);
  ctx.font = font(700, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('out of 100', cx, cy + 130);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(900, 72);
  ctx.fillText(opts.band.label, cx, 880);

  // Three numbers
  const picks = opts.tiles.filter((t) => t.key !== 'pauses').slice(0, 3);
  const colW = W / picks.length;
  picks.forEach((t, i) => {
    const x = colW * i + colW / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = font(900, 64);
    ctx.fillText(t.value, x, 1030);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = font(700, 30);
    ctx.fillText(t.label.toUpperCase(), x, 1080);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = font(800, 40);
  ctx.fillText(`Free 45-second test → ${opts.site}/voice-check`, W / 2, 1240);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
