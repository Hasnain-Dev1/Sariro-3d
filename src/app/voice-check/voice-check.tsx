'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Square, RotateCcw, Share2, Shuffle, ShieldCheck, Sparkles, Trophy, ArrowRight, Info, Zap, Loader2,
  Play, Pause, Dna, TrendingUp,
} from 'lucide-react';
import { analyseSpeech, scoreBreakdown, PACE_BAND, type SpeechReport } from '@/lib/speaking/analyse';
import { analyseModulation, type ModulationReport } from '@/lib/speaking/modulation';
import { micMessage } from '@/lib/speaking/mic';
import { useSpeechRecorder, type Recording, type RecorderLive } from '@/components/speaking/use-speech-recorder';
import {
  PROMPTS, checkRecording, scoreBand, tilesFor, drillFor, shareMessage,
  TARGET_SECONDS, MAX_SECONDS, type Prompt, type ScoreBand, type Tile,
} from '@/lib/speaking/voice-check';
import {
  alignWordTimes, markersFor, contextFor, waveformBars, clockLabel,
  type TimedWord, type TimelineMarker, type WordObservation,
} from '@/lib/speaking/timeline';
import { livePace, paceZone, needleAngle, liveFillers, pitchTrace, DIAL } from '@/lib/speaking/live';
import { speakingDna, archetypeFor, biggestGain, type DnaAxis, type Archetype } from '@/lib/speaking/dna';
import { dealFromStorage } from '@/lib/speaking/passages/deck';
import {
  parseHistory, addAttempt, progressOf, HISTORY_KEY, LEGACY_BEST_KEY, type Progress,
} from '@/lib/speaking/history';

/**
 * SARIRO — Voice Check, the page
 * ============================================================================
 * Talk for 45 seconds, see what your voice did. Free, no account, and nothing
 * leaves the device — the recording is measured in the browser by the same
 * engine enrolled students practise against (use-speech-recorder + analyse).
 *
 * Three moments, and each gets the whole screen:
 *
 *   1. a prompt worth talking about;
 *   2. talking — with the voice drawn as it moves, a pace needle, and a counter
 *      that jumps the instant an "um" is said, so a child can correct it WHILE
 *      speaking rather than read about it afterwards;
 *   3. the result — the score, a replay with every filler and long pause pinned
 *      where it happened (tap one and hear it), a Speaking DNA shape, and how it
 *      compares with their last go.
 *
 * The replay is the part that is hard to copy. The browser's speech recognition
 * gives words and no timings; lib/speaking/timeline.ts recovers a time for every
 * word from when it first appeared and the loudness of the audio around it.
 */

interface Timeline {
  timed: TimedWord[];
  markers: TimelineMarker[];
  levels: number[];
  durationMs: number;
}

type Scored = {
  kind: 'scored';
  report: SpeechReport;
  modulation: ModulationReport;
  timeline: Timeline;
  dna: DnaAxis[];
  archetype: Archetype;
  /** null for the sample, which is never saved as an attempt. */
  progress: Progress | null;
  sample?: boolean;
};

type Outcome = Scored | { kind: 'invalid'; message: string };

/** Everything the result screen shows, from one recording. */
function measure(input: {
  transcript: string;
  durationMs: number;
  levels: number[];
  pitches: (number | null)[];
  frameMs: number;
  observations: WordObservation[];
}) {
  const { transcript, durationMs, levels, pitches, frameMs, observations } = input;
  const report = analyseSpeech({ transcript, durationMs, levels, frameMs });
  const modulation = analyseModulation({ levels, pitches, frameMs });
  const timed = alignWordTimes(transcript, observations, durationMs, levels, frameMs);
  const timeline: Timeline = { timed, markers: markersFor(timed, levels, frameMs), levels, durationMs };
  const dna = speakingDna(report, modulation);
  return { report, modulation, timeline, dna, archetype: archetypeFor(report, dna) };
}

/**
 * What a result looks like, for somebody who cannot record one.
 *
 * iPhone Safari's speech recognition is unreliable and Firefox has none, so a
 * parent on either would otherwise meet a warning and nothing else. This is a
 * real report from the real engine, run on a realistic forty-second answer —
 * clearly labelled as a sample, never passed off as theirs.
 */
function sampleOutcome(): Scored {
  /* A good answer with one real habit in it — which is what most children
     sound like. A flawless sample would make every real first attempt feel
     like failing by comparison. Steady pace, good pauses, one long think, and
     four "um"s that cost it every filler point. */
  const transcript =
    'my favourite food is pani puri um because every single bite is like a surprise you get the crunch then the spicy water ' +
    'and then uh the sweet chutney all at once and honestly nothing else does that um my whole family goes to the same stall ' +
    'every sunday and the uncle there already knows exactly how spicy we want it so basically if you have never tried it ' +
    'um you are really missing out on the best thing in the whole world and I think everyone should try it at least once';
  const frameMs = 50;
  const frames = 40_000 / frameMs;
  // Talking in phrases, a breath roughly every six seconds, and one longer think.
  const levels = Array.from({ length: frames }, (_, i) =>
    i % 120 < 10 || (i >= 360 && i < 382) ? 0.004 : 0.22 + ((i * 7) % 11) * 0.02);
  const pitches = levels.map((l, i) => (l < 0.01 ? null : 180 + Math.sin(i / 9) * 38 + ((i * 13) % 7)));
  return {
    kind: 'scored',
    ...measure({ transcript, durationMs: 40_000, levels, pitches, frameMs, observations: [] }),
    progress: null,
    sample: true,
  };
}

/** Save this attempt on the device and say where it stands. Never throws. */
function recordAttempt(score: number, dna: DnaAxis[]): Progress | null {
  try {
    const list = addAttempt(
      parseHistory(localStorage.getItem(HISTORY_KEY), localStorage.getItem(LEGACY_BEST_KEY)),
      { at: Date.now(), score, dna: dna.map((a) => a.value) }
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    return progressOf(list);
  } catch {
    // Private mode or storage blocked — the score still shows, just without history.
    return progressOf([{ at: Date.now(), score, dna: dna.map((a) => a.value) }]);
  }
}

/* Prompts are dealt like a deck and remembered on the device: every visitor used
   to open on the same one, and a child trying again soon met the few there were. */
const PROMPT_DECK = 'sariro.voice-check.prompts';
const PROMPT_IDS = PROMPTS.map((p) => p.id);
/* Dealt ONCE, then looked up. Dealing inside find() dealt a card per prompt it
   compared — it burned seventy through the deck in a few clicks and kept landing
   on the first few. */
const dealPrompt = () => {
  const id = dealFromStorage(PROMPT_DECK, PROMPT_IDS);
  return PROMPTS.find((p) => p.id === id) ?? PROMPTS[0];
};

const TONE: Record<ScoreBand['tone'], { ring: string; chip: string; glow: string }> = {
  gold: { ring: '#F59E0B', chip: 'bg-amber-100 text-amber-800', glow: 'rgba(245,158,11,0.25)' },
  green: { ring: '#16A34A', chip: 'bg-green-100 text-green-800', glow: 'rgba(22,163,74,0.22)' },
  blue: { ring: '#2563EB', chip: 'bg-blue-100 text-blue-800', glow: 'rgba(37,99,235,0.22)' },
  violet: { ring: '#7C3AED', chip: 'bg-violet-100 text-violet-800', glow: 'rgba(124,58,237,0.22)' },
};

const KEYFRAMES =
  '@keyframes vcGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
  '@keyframes vcPop{0%{transform:scale(1.7)}55%{transform:scale(.9)}100%{transform:scale(1)}}' +
  '@keyframes vcRise{0%{opacity:0;transform:translate(-50%,8px)}15%{opacity:1}100%{opacity:0;transform:translate(-50%,-26px)}}' +
  '@keyframes vcBloom{from{transform:scale(.15);opacity:0}to{transform:scale(1);opacity:1}}' +
  '@keyframes vcLit{0%{box-shadow:0 0 0 0 rgba(225,29,72,.55)}100%{box-shadow:0 0 0 10px rgba(225,29,72,0)}}';

export default function VoiceCheck() {
  // The server renders the first prompt; the device deals its own straight after.
  const [prompt, setPrompt] = useState<Prompt>(PROMPTS[0]);
  useEffect(() => { setPrompt(dealPrompt()); }, []);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const onStop = useCallback((rec: Recording) => {
    const m = measure(rec);
    const validity = checkRecording({ durationMs: rec.durationMs, words: m.report.words, heardWords: rec.heardWords });
    if (!validity.ok) {
      setOutcome({ kind: 'invalid', message: validity.message });
      return;
    }
    // Only a valid attempt is remembered — a two-second mis-tap is not progress.
    setOutcome({ kind: 'scored', ...m, progress: recordAttempt(m.report.score, m.dna) });
  }, []);

  const {
    blocker, state, elapsed, transcript, error, level, start, stop, reset, audioUrl, clock, live,
  } = useSpeechRecorder({ onStop, captureAudio: true });

  // The recording stops itself, so a forgotten tab is never left listening.
  useEffect(() => {
    if (state !== 'recording') return;
    const id = window.setTimeout(() => stop(), MAX_SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, [state, stop]);

  const tryAgain = () => {
    reset();
    setOutcome(null);
    setPrompt(dealPrompt());
  };

  const stage: 'intro' | 'recording' | 'result' =
    state === 'recording' ? 'recording' : outcome ? 'result' : 'intro';

  return (
    <main className="min-h-screen bg-[#FBF9F6]">
      <style>{KEYFRAMES}</style>
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
                onShuffle={() => setPrompt(dealPrompt())}
                onStart={start}
                onSample={() => setOutcome(sampleOutcome())}
                blocker={blocker}
                error={error}
              />
            </motion.section>
          )}

          {stage === 'recording' && (
            <motion.section key="recording" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Recorder
                prompt={prompt} elapsed={elapsed} level={level} transcript={transcript}
                live={live} clock={clock} onStop={stop}
              />
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
              <Scorecard outcome={outcome} audioUrl={outcome.sample ? null : audioUrl} onTryAgain={tryAgain} />
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
          Talk for 45 seconds. Watch your voice live, then hear it back with every “um” and pause
          pinned where it happened — plus your Speaking DNA and one drill to get better straight away.
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
        Your voice never leaves this device. Nothing is uploaded or saved — the replay disappears when you close the page.
      </p>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. Talking
   ══════════════════════════════════════════════════════════════════════════ */

function Recorder({
  prompt, elapsed, level, transcript, live, clock, onStop,
}: {
  prompt: Prompt;
  elapsed: number;
  level: number;
  transcript: string;
  live: RecorderLive;
  clock: () => number;
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
    <div className="pt-4 text-center">
      <p className="text-[15px] font-bold text-slate-700 leading-snug px-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {prompt.emoji} {prompt.text}
      </p>

      <div className="relative mx-auto mt-5 w-44 h-44">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <circle
            cx="100" cy="100" r={R} fill="none" stroke={progress >= 1 ? '#16A34A' : '#2563EB'}
            strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-end gap-1 h-8">
            {bars.map((h, i) => (
              <span key={i} className="w-1.5 rounded-full bg-blue-600" style={{ height: `${h * 100}%`, transition: 'height 90ms ease-out' }} />
            ))}
          </div>
          <p className="mt-1.5 text-4xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {remaining > 0 ? remaining : '✓'}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 leading-tight" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {remaining > 0 ? 'seconds to go' : 'great — finish your thought'}
          </p>
        </div>
      </div>

      <LivePanel live={live} clock={clock} transcript={transcript} />

      <p className="mt-4 min-h-[2.5rem] text-[13px] text-slate-500 italic leading-relaxed line-clamp-2 px-3">
        {transcript ? `“${transcript.split(' ').slice(-18).join(' ')}”` : 'Listening…'}
      </p>

      <button onClick={onStop} className="btn-tactile btn-tactile-primary mt-3 px-8 py-4 text-base inline-flex items-center gap-2">
        <Square className="w-4 h-4 fill-white" /> I&apos;m done — show my score
      </button>
    </div>
  );
}

/**
 * The three live meters: the voice as a moving line, the pace needle, and the
 * "um" counter. Dark, like a studio desk — it is the one screen where the child
 * is performing, and it should feel like it.
 */
function LivePanel({ live, clock, transcript }: { live: RecorderLive; clock: () => number; transcript: string }) {
  const [wpm, setWpm] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setWpm(livePace(live.words.current, clock())), 250);
    return () => window.clearInterval(id);
  }, [live, clock]);

  const fillers = liveFillers(transcript);
  const zone = paceZone(wpm);

  return (
    <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-left shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
          Your voice, live
        </p>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-300" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> LISTENING
        </span>
      </div>

      <PitchLine live={live} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <PaceDial wpm={wpm} zone={zone} />

        <div className="relative rounded-xl bg-white/5 p-3 flex flex-col items-center justify-center">
          {fillers.length > 0 && (
            <span
              key={`bubble-${fillers.length}`}
              className="absolute left-1/2 top-1 whitespace-nowrap rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-black text-white"
              style={{ animation: 'vcRise 1.3s ease-out forwards', fontFamily: 'var(--font-grotesk)' }}
            >
              “{fillers[fillers.length - 1]}” +1
            </span>
          )}
          <span
            key={`count-${fillers.length}`}
            className={`text-4xl font-extrabold tabular-nums ${fillers.length === 0 ? 'text-emerald-300' : 'text-rose-300'}`}
            style={{ fontFamily: 'var(--font-jakarta)', animation: fillers.length ? 'vcPop .45s ease-out' : undefined }}
          >
            {fillers.length}
          </span>
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            “um” counter
          </span>
          <span className="mt-1 text-[11px] text-slate-300 text-center leading-tight">
            {fillers.length === 0 ? 'Clean so far' : 'Pause instead'}
          </span>
        </div>
      </div>
    </div>
  );
}

/** The voice's pitch over the last six seconds, drawn every frame from the recorder's own stream. */
function PitchLine({ live }: { live: RecorderLive }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    const FRAMES = 120;
    const draw = () => {
      const c = canvas.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const dpr = window.devicePixelRatio || 1;
        const w = c.clientWidth;
        const h = c.clientHeight;
        if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
          c.width = Math.round(w * dpr);
          c.height = Math.round(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // Loudness underneath, faint — the voice line sits on top of it.
        const levels = live.levels.current.slice(-FRAMES);
        const peak = Math.max(0.02, ...live.levels.current.slice(-400));
        const step = w / (FRAMES - 1);
        ctx.fillStyle = 'rgba(148,163,184,0.18)';
        levels.forEach((l, i) => {
          const x = (FRAMES - levels.length + i) * step;
          const bh = Math.min(1, l / peak) * h * 0.55;
          ctx.fillRect(x - 1, h - bh, 2, bh);
        });

        // The speaker's own middle.
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = 'rgba(148,163,184,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
        ctx.setLineDash([]);

        const trace = pitchTrace(live.pitches.current, FRAMES);
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, 'rgba(96,165,250,0.15)');
        grad.addColorStop(0.6, '#60A5FA');
        grad.addColorStop(1, '#C084FC');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i < trace.length; i++) {
          const v = trace[i];
          if (v === null) { pen = false; continue; }
          const x = i * step;
          const y = h * 0.1 + (1 - v) * h * 0.8;
          if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          pen = true;
        }
        ctx.stroke();

        // A bright tip while they are making a sound, so the line reads as "now".
        const last = trace.length ? trace[trace.length - 1] : null;
        if (last !== null) {
          const x = w;
          const y = h * 0.1 + (1 - last) * h * 0.8;
          ctx.fillStyle = 'rgba(192,132,252,0.35)';
          ctx.beginPath(); ctx.arc(x - 3, y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#F5F3FF';
          ctx.beginPath(); ctx.arc(x - 3, y, 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  return (
    <div className="mt-2">
      <canvas ref={canvas} className="w-full h-20 block" aria-label="Your voice's pitch, drawn live" />
      <div className="flex justify-between text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <span>6 seconds ago</span>
        <span>higher ↑ · lower ↓</span>
        <span>now</span>
      </div>
    </div>
  );
}

const ZONE_COPY: Record<ReturnType<typeof paceZone>, { text: string; color: string }> = {
  waiting: { text: 'Finding your pace…', color: 'text-slate-400' },
  slow: { text: 'A bit slow', color: 'text-amber-300' },
  good: { text: 'Perfect pace', color: 'text-emerald-300' },
  fast: { text: 'Slow down a touch', color: 'text-rose-300' },
};

/** Where on the dial a pace sits, as a point on the arc. */
function dialPoint(wpm: number, r: number, cx = 60, cy = 58): [number, number] {
  const a = (needleAngle(wpm) * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

function dialArc(from: number, to: number, r: number): string {
  const [x1, y1] = dialPoint(from, r);
  const [x2, y2] = dialPoint(to, r);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function PaceDial({ wpm, zone }: { wpm: number; zone: ReturnType<typeof paceZone> }) {
  const copy = ZONE_COPY[zone];
  return (
    <div className="rounded-xl bg-white/5 p-2 flex flex-col items-center">
      <svg viewBox="0 0 120 66" className="w-full max-w-[150px]">
        <path d={dialArc(DIAL.min, PACE_BAND.min, 46)} stroke="#F59E0B" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.85" />
        <path d={dialArc(PACE_BAND.min, PACE_BAND.max, 46)} stroke="#10B981" strokeWidth="9" fill="none" opacity="0.95" />
        <path d={dialArc(PACE_BAND.max, DIAL.max, 46)} stroke="#F43F5E" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.85" />
        <g style={{ transform: `rotate(${needleAngle(wpm)}deg)`, transformOrigin: '60px 58px', transition: 'transform .5s cubic-bezier(.3,1.5,.55,1)' }}>
          <line x1="60" y1="58" x2="60" y2="18" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="60" cy="58" r="5" fill="#F8FAFC" />
      </svg>
      <p className={`-mt-0.5 text-[12px] font-extrabold ${copy.color}`} style={{ fontFamily: 'var(--font-jakarta)' }}>{copy.text}</p>
      <p className="text-[10px] text-slate-400 tabular-nums">{wpm > 0 ? `${wpm} words / min` : 'keep talking'}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. The scorecard
   ══════════════════════════════════════════════════════════════════════════ */

function Scorecard({
  outcome, audioUrl, onTryAgain,
}: {
  outcome: Scored;
  audioUrl: string | null;
  onTryAgain: () => void;
}) {
  const { report, modulation, timeline, dna, archetype, progress, sample } = outcome;
  const band = scoreBand(report.score);
  const tone = TONE[band.tone];
  const tiles = tilesFor(report, modulation);
  const drill = drillFor(report);
  const parts = scoreBreakdown(report);
  const notes = report.notes.slice(0, 2);
  const improvedBy = progress?.previousBest != null && progress.isBest ? report.score - progress.previousBest : 0;

  return (
    <div className="pt-4">
      {sample && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-[13px] text-blue-900">
          <strong>Sample result</strong> — the real engine, on a 40-second answer about pani puri. Yours will be about you.
        </div>
      )}
      {/* The number */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 text-center shadow-sm" style={{ boxShadow: `0 20px 60px -20px ${tone.glow}` }}>
        {progress?.isBest && (
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

        {progress && progress.count > 1 && <ProgressStrip progress={progress} score={report.score} color={tone.ring} />}

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

      <Replay timeline={timeline} audioUrl={audioUrl} sample={!!sample} />

      <DnaCard dna={dna} archetype={archetype} previous={progress?.previous?.dna ?? null} sample={!!sample} />

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

      {!sample && <ShareButton score={report.score} band={band} tiles={tiles} archetype={archetype} />}

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
        Measured on this device. Nothing was uploaded or saved — the replay lives only in this tab.
      </p>
    </div>
  );
}

/** "+14 since your first go", with the scores that got there. */
function ProgressStrip({ progress, score, color }: { progress: Progress; score: number; color: string }) {
  const pts = progress.recent;
  const W = 132;
  const H = 34;
  const lo = Math.min(...pts) - 4;
  const hi = Math.max(...pts) + 4;
  const xy = pts.map((s, i) => [
    pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * (W - 8) + 4,
    H - 4 - ((s - lo) / Math.max(1, hi - lo)) * (H - 8),
  ]);
  const best = Math.max(score, progress.previousBest ?? 0);

  return (
    <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-[132px] h-[34px] shrink-0" aria-hidden>
        <polyline points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinejoin="round" />
        {xy.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4 : 2.2} fill={i === xy.length - 1 ? color : '#94A3B8'} />
        ))}
      </svg>
      <div className="text-left">
        <p className="text-[13px] font-extrabold text-slate-900 flex items-center gap-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
          {progress.sinceFirst > 0 ? `+${progress.sinceFirst} since your first go` : `Best so far: ${best}`}
        </p>
        <p className="text-[11px] text-slate-500">Try #{progress.count} on this device</p>
      </div>
    </div>
  );
}

/* ── The replay ─────────────────────────────────────────────────────────── */

const PIN_COLOR = { certain: '#E11D48', hedged: '#F59E0B', pause: '#0EA5E9' } as const;
const pinColor = (m: TimelineMarker) => (m.kind === 'pause' ? PIN_COLOR.pause : m.certain ? PIN_COLOR.certain : PIN_COLOR.hedged);

/**
 * Hear it back, with every filler and long pause pinned where it happened.
 *
 * Tapping a pin starts the audio a moment before it, so the child hears the
 * run-up and then the "um" — hearing it in context is what makes it land.
 * Without audio (the sample, or a browser that cannot record) the pins still
 * work: they show the words around the moment instead.
 */
function Replay({ timeline, audioUrl, sample }: { timeline: Timeline; audioUrl: string | null; sample: boolean }) {
  const { timed, markers, levels, durationMs } = timeline;
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const bars = useMemo(() => waveformBars(levels, 64), [levels]);

  // The audio arrives a moment after the score. If it never does, stop waiting.
  useEffect(() => {
    if (audioUrl || sample) return;
    const id = window.setTimeout(() => setGaveUp(true), 3000);
    return () => window.clearTimeout(id);
  }, [audioUrl, sample]);

  useEffect(() => {
    const a = audio.current;
    if (!a || !audioUrl) return;
    let raf = 0;
    const tick = () => {
      setAt(a.currentTime * 1000);
      if (!a.paused) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => { setPlaying(true); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    const onPause = () => { setPlaying(false); cancelAnimationFrame(raf); setAt(a.currentTime * 1000); };
    const onEnded = () => { setPlaying(false); cancelAnimationFrame(raf); setAt(0); };
    const onTime = () => setAt(a.currentTime * 1000);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('timeupdate', onTime);
    return () => {
      cancelAnimationFrame(raf);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('timeupdate', onTime);
    };
  }, [audioUrl]);

  const seek = (ms: number) => {
    const clamped = Math.max(0, Math.min(durationMs, ms));
    setAt(clamped);
    const a = audio.current;
    if (!a || !audioUrl) return;
    try { a.currentTime = clamped / 1000; } catch { /* not seekable yet */ }
    void a.play().catch(() => {});
  };

  const toggle = () => {
    const a = audio.current;
    if (!a || !audioUrl) return;
    if (a.paused) void a.play().catch(() => {}); else a.pause();
  };

  const jump = (i: number) => {
    setActive(i);
    // A beat of run-up, so the moment is heard in its sentence.
    if (audioUrl) seek(markers[i].ms - 900);
    else setAt(markers[i].ms);
  };

  const onWave = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width > 0) { setActive(null); seek(((e.clientX - r.left) / r.width) * durationMs); }
  };

  const pct = (ms: number) => `${Math.max(0, Math.min(100, (ms / Math.max(1, durationMs)) * 100))}%`;
  /* Counted the way the Filler words tile counts: "um" and "uh" are fillers;
     "like" and "so" are only worth a listen. One sentence saying six fillers
     above a tile saying four is the page contradicting itself. */
  const certainCount = markers.filter((m) => m.kind === 'filler' && m.certain).length;
  const hedgedCount = markers.filter((m) => m.kind === 'filler' && !m.certain).length;
  const pauseCount = markers.filter((m) => m.kind === 'pause').length;
  const playedTo = at / Math.max(1, durationMs);
  const shown = showAll ? markers : markers.slice(0, 6);
  const canPlay = !!audioUrl;

  const summary = markers.length === 0
    ? 'A clean run — no fillers and no long pauses to pin.'
    : [
        certainCount ? `${certainCount} filler${certainCount === 1 ? '' : 's'}` : null,
        pauseCount ? `${pauseCount} long pause${pauseCount === 1 ? '' : 's'}` : null,
        hedgedCount ? `${hedgedCount} worth a listen` : null,
      ].filter(Boolean).join(' · ') + ' — pinned where they happened.';

  return (
    <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-5">
      {audioUrl && <audio ref={audio} src={audioUrl} preload="auto" className="hidden" />}

      <div className="flex items-start gap-3">
        <button
          onClick={toggle}
          disabled={!canPlay}
          aria-label={playing ? 'Pause replay' : 'Play replay'}
          className="w-12 h-12 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:bg-slate-200 disabled:text-slate-400 active:scale-95 transition-transform"
        >
          {canPlay
            ? (playing ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />)
            : (!sample && !gaveUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 ml-0.5" />)}
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Hear yourself back
          </p>
          <p className="mt-0.5 text-[14px] font-bold text-slate-900 leading-snug" style={{ fontFamily: 'var(--font-jakarta)' }}>{summary}</p>
          <p className="text-[12px] text-slate-500">
            {canPlay
              ? 'Tap any pin to jump straight to it.'
              : sample
                ? 'Replay plays your own recording — here, tap a pin to see the moment.'
                : gaveUp
                  ? 'This browser cannot play the recording back — tap a pin to see the moment.'
                  : 'Getting your replay ready…'}
          </p>
        </div>
      </div>

      {/* Pins over the waveform */}
      <div className="mt-4 relative">
        <div className="relative h-7">
          {markers.map((m, i) => {
            const lit = active === i || (playing && at >= m.ms && at < m.ms + 1200);
            return (
              <button
                key={`${m.kind}-${m.ms}-${i}`}
                onClick={() => jump(i)}
                aria-label={`${m.kind === 'pause' ? m.label : `"${m.label}"`} at ${clockLabel(m.ms)}`}
                className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center group"
                style={{ left: pct(m.ms), zIndex: lit ? 2 : 1 }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-white shadow transition-transform group-hover:scale-125"
                  style={{
                    background: pinColor(m),
                    transform: lit ? 'scale(1.35)' : undefined,
                    animation: lit ? 'vcLit 1s ease-out infinite' : undefined,
                  }}
                />
                <span className="w-px h-2.5" style={{ background: pinColor(m) }} />
              </button>
            );
          })}
        </div>
        <div className="relative h-16 flex items-center gap-[2px] cursor-pointer" onClick={onWave} role="presentation">
          {bars.map((b, i) => (
            <span
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: `${Math.max(6, b * 100)}%`,
                background: (i + 0.5) / bars.length <= playedTo ? '#2563EB' : '#CBD5E1',
              }}
            />
          ))}
          {markers.map((m, i) => m.kind === 'pause' && m.durationMs ? (
            <span
              key={`band-${i}`}
              className="absolute top-0 bottom-0 rounded bg-sky-400/15 pointer-events-none"
              style={{ left: pct(m.ms), width: pct(m.durationMs) }}
            />
          ) : null)}
          <span className="absolute top-0 bottom-0 w-0.5 bg-slate-900 rounded pointer-events-none" style={{ left: pct(at) }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400 tabular-nums">
          <span>{clockLabel(at)}</span>
          <span className="flex items-center gap-2.5">
            <Legend color={PIN_COLOR.certain} label="um / uh" />
            <Legend color={PIN_COLOR.hedged} label="like / so" />
            <Legend color={PIN_COLOR.pause} label="long pause" />
          </span>
          <span>{clockLabel(durationMs)}</span>
        </div>
      </div>

      {/* The moments, readable */}
      {markers.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {shown.map((m, i) => {
            const c = contextFor(timed, m);
            const isActive = active === i;
            return (
              <li key={`row-${m.kind}-${m.ms}-${i}`}>
                <button
                  onClick={() => jump(i)}
                  className={`w-full text-left rounded-xl px-3 py-2 flex items-center gap-3 border transition-colors ${isActive ? 'border-slate-900 bg-slate-50' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <span className="text-[11px] font-bold text-slate-400 tabular-nums w-8 shrink-0">{clockLabel(m.ms)}</span>
                  <span className="text-[13px] text-slate-600 leading-snug min-w-0 truncate">
                    {c.before && <span>…{c.before} </span>}
                    <span className="font-extrabold px-1 rounded" style={{ color: pinColor(m), background: `${pinColor(m)}1A` }}>
                      {m.kind === 'pause' ? `${((m.durationMs ?? 0) / 1000).toFixed(1)}s silence` : m.label}
                    </span>
                    {c.after && <span> {c.after}…</span>}
                  </span>
                  {canPlay && <Play className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />}
                </button>
              </li>
            );
          })}
          {markers.length > shown.length && (
            <li>
              <button onClick={() => setShowAll(true)} className="w-full text-center text-[12px] font-bold text-blue-700 py-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Show all {markers.length} moments
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />{label}
    </span>
  );
}

/* ── Speaking DNA ───────────────────────────────────────────────────────── */

function DnaCard({
  dna, archetype, previous, sample,
}: {
  dna: DnaAxis[];
  archetype: Archetype;
  previous: number[] | null;
  sample: boolean;
}) {
  const ghost = previous && previous.length === dna.length ? previous : null;
  const gain = biggestGain(dna, ghost);
  const strongest = [...dna].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <Dna className="w-3.5 h-3.5" /> {sample ? 'Speaking DNA' : 'Your Speaking DNA'}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-4xl leading-none" aria-hidden>{archetype.emoji}</span>
        <div>
          <p className="text-xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{archetype.name}</p>
          <p className="text-[13px] text-slate-600 leading-snug">{archetype.line}</p>
        </div>
      </div>

      <Radar dna={dna} ghost={ghost} />

      <p className="text-center text-[12px] text-slate-500 leading-relaxed">
        {gain
          ? <><strong className="text-green-700">{gain.label} up {gain.by}</strong> since your last try{ghost ? ' — the dashed shape was you then.' : '.'}</>
          : ghost
            ? <>The dashed shape is your last try. Your strongest trait is <strong className="text-slate-800">{strongest.label.toLowerCase()}</strong>.</>
            : <>Your strongest trait is <strong className="text-slate-800">{strongest.label.toLowerCase()}</strong>. Try again and watch the shape change.</>}
      </p>
    </div>
  );
}

function Radar({ dna, ghost }: { dna: DnaAxis[]; ghost: number[] | null }) {
  const CX = 150;
  const CY = 118;
  const R = 78;
  const n = dna.length;
  const point = (i: number, v: number): [number, number] => {
    const a = ((-90 + (360 / n) * i) * Math.PI) / 180;
    return [CX + R * (v / 100) * Math.cos(a), CY + R * (v / 100) * Math.sin(a)];
  };
  const poly = (values: number[]) => values.map((v, i) => point(i, v).map((c) => c.toFixed(1)).join(',')).join(' ');

  return (
    <svg viewBox="0 0 300 240" className="w-full max-w-[340px] mx-auto mt-2 block" role="img" aria-label={dna.map((a) => `${a.label} ${a.value}`).join(', ')}>
      <defs>
        <linearGradient id="vcDnaFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {[25, 50, 75, 100].map((ring) => (
        <polygon key={ring} points={poly(dna.map(() => ring))} fill={ring === 100 ? '#F8FAFC' : 'none'} stroke="#E2E8F0" strokeWidth="1" />
      ))}
      {dna.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#E2E8F0" strokeWidth="1" />;
      })}
      {ghost && <polygon points={poly(ghost)} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />}
      <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: 'vcBloom .9s cubic-bezier(.2,1.3,.4,1) .15s both' }}>
        <polygon points={poly(dna.map((a) => Math.max(4, a.value)))} fill="url(#vcDnaFill)" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" />
        {dna.map((a, i) => {
          const [x, y] = point(i, Math.max(4, a.value));
          return <circle key={a.key} cx={x} cy={y} r="3.5" fill="#fff" stroke="#2563EB" strokeWidth="2" />;
        })}
      </g>
      {dna.map((a, i) => {
        const [x, y] = point(i, 128);
        const anchor = Math.abs(x - CX) < 8 ? 'middle' : x > CX ? 'start' : 'end';
        return (
          <g key={`label-${a.key}`}>
            <text x={x} y={y - 2} textAnchor={anchor} fontSize="11" fontWeight="800" fill="#334155" style={{ fontFamily: 'var(--font-grotesk)' }}>{a.label}</text>
            <text x={x} y={y + 11} textAnchor={anchor} fontSize="11" fontWeight="700" fill="#2563EB">{a.value}</text>
          </g>
        );
      })}
    </svg>
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

function ShareButton({ score, band, tiles, archetype }: { score: number; band: ScoreBand; tiles: Tile[]; archetype: Archetype }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const share = async () => {
    setBusy(true);
    setDone(null);
    try {
      const url = `${window.location.origin}/voice-check`;
      const text = shareMessage(score, band, url);
      const blob = await renderShareCard({ score, band, tiles, archetype, site: window.location.host });
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
async function renderShareCard(opts: { score: number; band: ScoreBand; tiles: Tile[]; archetype: Archetype; site: string }): Promise<Blob | null> {
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
  ctx.fillText('SARIRO  VOICE CHECK', W / 2, 140);

  // The ring
  const cx = W / 2;
  const cy = 480;
  const r = 220;
  ctx.lineCap = 'round';
  ctx.lineWidth = 36;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#FBBF24';
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * opts.score) / 100); ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = font(900, 190);
  ctx.fillText(String(opts.score), cx, cy + 58);
  ctx.font = font(700, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('out of 100', cx, cy + 125);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(900, 70);
  ctx.fillText(opts.band.label, cx, 830);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = font(800, 46);
  ctx.fillText(`${opts.archetype.emoji}  ${opts.archetype.name}`, cx, 910);

  // Three numbers
  const picks = opts.tiles.filter((t) => t.key !== 'pauses').slice(0, 3);
  const colW = W / picks.length;
  picks.forEach((t, i) => {
    const x = colW * i + colW / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = font(900, 64);
    ctx.fillText(t.value, x, 1050);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = font(700, 30);
    ctx.fillText(t.label.toUpperCase(), x, 1100);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = font(800, 40);
  ctx.fillText(`Free 45-second test → ${opts.site}/voice-check`, W / 2, 1240);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
