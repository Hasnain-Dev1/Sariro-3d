'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Flame, Heart, Trophy, Volume2, VolumeX } from 'lucide-react';
import { coinsFor, levelFor } from '@/lib/practice/games/round';
import { freshSeed } from '@/lib/practice/rng';
import { logPractice } from '@/lib/practice/log';

/**
 * SARIRO — what every practice game shares
 * ============================================================================
 * The feel of a game is small things done every time: a sound on every tap, a
 * number that jumps when it grows, a burst of confetti on a streak, a best
 * score to beat. They live here so each game only has to be its game.
 *
 * Sound is synthesised (Web Audio) — nothing to download — and can be muted;
 * the choice is remembered on the device. The best score is kept on the device
 * too (it is a personal record, not a leaderboard).
 */

/* ── Sound ─────────────────────────────────────────────────────────────── */

type Sfx = 'tap' | 'cut' | 'coin' | 'wrong' | 'level' | 'boom' | 'win' | 'zap' | 'dig' | 'clunk';

const NOTES: Record<Sfx, { f: number; t: number; type: OscillatorType; slide?: number; gain?: number }[]> = {
  tap: [{ f: 660, t: 0.05, type: 'triangle' }],
  cut: [{ f: 320, t: 0.07, type: 'sawtooth', slide: 120, gain: 0.05 }],
  coin: [{ f: 988, t: 0.07, type: 'square', gain: 0.05 }, { f: 1319, t: 0.14, type: 'square', gain: 0.05 }],
  wrong: [{ f: 220, t: 0.18, type: 'sawtooth', slide: 140, gain: 0.06 }],
  level: [{ f: 523, t: 0.09, type: 'triangle' }, { f: 659, t: 0.09, type: 'triangle' }, { f: 784, t: 0.09, type: 'triangle' }, { f: 1047, t: 0.2, type: 'triangle' }],
  boom: [{ f: 140, t: 0.16, type: 'sawtooth', slide: 50, gain: 0.07 }],
  win: [{ f: 784, t: 0.1, type: 'triangle' }, { f: 988, t: 0.1, type: 'triangle' }, { f: 1175, t: 0.24, type: 'triangle' }],
  zap: [{ f: 1400, t: 0.16, type: 'sawtooth', slide: 180, gain: 0.04 }],
  dig: [{ f: 200, t: 0.07, type: 'triangle', slide: 90 }, { f: 170, t: 0.09, type: 'triangle', slide: 70 }],
  clunk: [{ f: 110, t: 0.09, type: 'square', slide: 70, gain: 0.05 }],
};

const MUTE_KEY = 'sariro.games.muted';

export function useSound() {
  const ctx = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try { setMuted(window.localStorage.getItem(MUTE_KEY) === '1'); } catch { /* private mode */ }
  }, []);

  const toggle = useCallback(() => {
    setMuted((m) => {
      try { window.localStorage.setItem(MUTE_KEY, m ? '0' : '1'); } catch { /* ignore */ }
      return !m;
    });
  }, []);

  const play = useCallback((name: Sfx) => {
    if (muted) return;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx.current = ctx.current ?? new Ctor();
      const ac = ctx.current;
      let at = ac.currentTime;
      for (const n of NOTES[name]) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = n.type;
        osc.frequency.setValueAtTime(n.f, at);
        if (n.slide) osc.frequency.exponentialRampToValueAtTime(n.slide, at + n.t);
        g.gain.setValueAtTime(n.gain ?? 0.08, at);
        g.gain.exponentialRampToValueAtTime(0.0001, at + n.t);
        osc.connect(g).connect(ac.destination);
        osc.start(at);
        osc.stop(at + n.t + 0.02);
        at += n.t * 0.8;
      }
    } catch { /* sound is a nicety */ }
  }, [muted]);

  return { play, muted, toggle };
}

/* ── Best score, kept on this device ───────────────────────────────────── */

export function useBest(key: string): [number, (score: number) => boolean] {
  const [best, setBest] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    try {
      const v = Number(window.localStorage.getItem(`sariro.best.${key}`)) || 0;
      ref.current = v;
      setBest(v);
    } catch { /* ignore */ }
  }, [key]);
  /** Record a score; true when it beats the best. */
  const offer = useCallback((score: number) => {
    if (score <= ref.current) return false;
    ref.current = score;
    setBest(score);
    try { window.localStorage.setItem(`sariro.best.${key}`, String(score)); } catch { /* ignore */ }
    return true;
  }, [key]);
  return [best, offer];
}

/* ── Confetti ──────────────────────────────────────────────────────────── */

const COLOURS = ['#F43F5E', '#F59E0B', '#10B981', '#3B82F6', '#A855F7', '#EC4899'];

export function Confetti({ burst }: { burst: number }) {
  const [pieces, setPieces] = useState<{ id: number; x: number; r: number; c: string; d: number }[]>([]);
  useEffect(() => {
    if (!burst) return;
    const made = Array.from({ length: 28 }, (_, i) => ({
      id: burst * 100 + i,
      x: (Math.random() - 0.5) * 360,
      r: Math.random() * 540 - 270,
      c: COLOURS[i % COLOURS.length],
      d: 0.7 + Math.random() * 0.5,
    }));
    setPieces(made);
    const t = setTimeout(() => setPieces([]), 1400);
    return () => clearTimeout(t);
  }, [burst]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: p.x, y: [0, -140 - Math.random() * 80, 260], rotate: p.r, opacity: [1, 1, 0] }}
            transition={{ duration: p.d * 1.4, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 w-2 h-3 rounded-sm"
            style={{ background: p.c }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ── The bar across the top ────────────────────────────────────────────── */

export function Hud({ score, combo, hearts, maxHearts = 3, level, best, muted, onMute }: {
  score: number; combo: number; hearts: number; maxHearts?: number; level: number; best: number; muted: boolean; onMute: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-3 h-9 text-[15px] font-extrabold tabular-nums">
        <Coins className="w-4 h-4" />
        <motion.span key={score} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>{score}</motion.span>
      </span>
      {/* One badge that pops each time the combo grows — no exit animation, so a
          fast streak never stacks two. */}
      {combo >= 2 && (
        <motion.span key={combo} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 rounded-full bg-orange-500 text-white px-3 h-9 text-[14px] font-extrabold">
          <Flame className="w-4 h-4" /> ×{Math.min(5, 1 + combo * 0.5).toFixed(1).replace('.0', '')} combo
        </motion.span>
      )}
      <span className="inline-flex items-center gap-0.5" aria-label={`${hearts} lives left`}>
        {Array.from({ length: maxHearts }, (_, i) => (
          <motion.span key={i} animate={{ scale: i < hearts ? 1 : 0.8, opacity: i < hearts ? 1 : 0.25 }}>
            <Heart className="w-5 h-5 text-rose-500" fill={i < hearts ? 'currentColor' : 'none'} />
          </motion.span>
        ))}
      </span>
      <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-800 px-3 h-9 text-[13px] font-extrabold">Level {level}</span>
      <span className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-500"><Trophy className="w-4 h-4 text-amber-500" /> Best {best}</span>
      <button type="button" onClick={onMute} aria-label={muted ? 'Sound on' : 'Sound off'} className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

/** Seconds-left bar that drains. */
export function PatienceBar({ left, total }: { left: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden" aria-label={`${Math.ceil(left)} seconds left`}>
      <div className="h-full rounded-full transition-[width] duration-200 ease-linear" style={{ width: `${pct}%`, background: pct > 50 ? '#10B981' : pct > 25 ? '#F59E0B' : '#F43F5E' }} />
    </div>
  );
}

export function GameOver({ title, score, best, newBest, lines, onAgain, accent, saved }: {
  title: string; score: number; best: number; newBest: boolean; lines: string[]; onAgain: () => void; accent: string; saved: 'saved' | 'not-saved' | null;
}) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center max-w-md mx-auto">
      <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>{title}</p>
      {newBest && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-[13px] font-extrabold"><Trophy className="w-4 h-4" /> New best!</p>}
      <p className="text-6xl font-extrabold mt-3 tabular-nums" style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}>{score}</p>
      <p className="text-[13px] text-slate-500 mt-1">coins · best {best}</p>
      <ul className="mt-4 space-y-1 text-[14px] text-slate-700">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
      {saved && <p className="mt-3 text-[12px] text-slate-400">{saved === 'saved' ? 'Saved to your progress.' : 'Not saved this time.'}</p>}
      <button type="button" onClick={onAgain} autoFocus className="mt-6 h-12 px-8 rounded-2xl text-white text-[16px] font-extrabold shadow-lg" style={{ background: accent }}>Play again</button>
    </motion.div>
  );
}

/* ── Intro card, level-up banner, feedback ─────────────────────────────── */

export function GameIntro({ emoji, title, blurb, note, cta, onStart, background, dark }: {
  emoji: string; title: string; blurb: string; note: string; cta: string; onStart: () => void; background: string; dark?: boolean;
}) {
  return (
    <div className={`relative rounded-3xl p-6 sm:p-10 text-center overflow-hidden border ${dark ? 'text-white border-transparent' : 'text-slate-900 border-slate-200'}`} style={{ background }}>
      <p className="text-6xl" aria-hidden>{emoji}</p>
      <h2 className="mt-3 text-3xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>{title}</h2>
      <p className={`mt-2 text-[15px] max-w-md mx-auto ${dark ? 'text-white/85' : 'text-slate-700'}`}>{blurb}</p>
      <p className={`mt-3 text-[13px] ${dark ? 'text-white/70' : 'text-slate-500'}`}>{note}</p>
      <button type="button" onClick={onStart} autoFocus className={`mt-6 h-14 px-10 rounded-2xl text-[18px] font-extrabold shadow-lg ${dark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>{cta}</button>
    </div>
  );
}

export function LevelBanner({ level }: { level: number | null }) {
  return (
    <AnimatePresence>
      {level && (
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 top-16 z-20 text-center pointer-events-none">
          <span className="inline-block rounded-2xl bg-violet-600 text-white px-6 py-3 text-2xl font-extrabold shadow-xl">Level {level}! 🎉</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Feedback({ feedback }: { feedback: { ok: boolean; message: string } | null }) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} role="status" className={`mt-4 rounded-2xl px-5 py-3 text-[15px] font-extrabold text-center ${feedback.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          {feedback.ok ? '✓ ' : '✗ '}{feedback.message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/* ── A round of one-challenge-at-a-time play ───────────────────────────── */

/**
 * The loop Cake Shop hand-rolled, for every game built after it: a challenge
 * with a patience clock, coins for a fast right answer, a streak, hearts, a
 * level every few answers, a best score, and the round logged at the end.
 *
 * A game draws `challenge` and calls `resolve(ok, message, bonus)` once per
 * challenge. The board for a challenge should be keyed by `challengeId`, so its
 * own state starts fresh with every new one.
 */
export function useRound<C extends { patience: number }>({ slug, bestKey, make, levelEvery, hearts: maxHearts = 3 }: {
  /** `balance` → logged as `maths:game:balance`. */
  slug: string;
  bestKey: string;
  /** Must be stable (useCallback). */
  make: (seed: number, level: number) => C;
  levelEvery: number;
  hearts?: number;
}) {
  const { play, muted, toggle } = useSound();
  const [best, offerBest] = useBest(bestKey);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'over'>('intro');
  const [challenge, setChallenge] = useState<C | null>(null);
  const [challengeId, setChallengeId] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState(maxHearts);
  const [done, setDone] = useState(0);
  const [tried, setTried] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [left, setLeft] = useState(0);
  const [burst, setBurst] = useState(0);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [saved, setSaved] = useState<'saved' | 'not-saved' | null>(null);
  const base = useRef(1);
  const index = useRef(0);
  const leftRef = useRef(0);
  const started = useRef(0);

  const level = levelFor(done, levelEvery);

  const next = useCallback((lvl: number) => {
    const c = make(base.current + index.current * 7919, lvl);
    setChallenge(c);
    setChallengeId(base.current + index.current);
    setFeedback(null);
    leftRef.current = c.patience;
    setLeft(c.patience);
  }, [make]);

  const finish = useCallback(async (finalScore: number, finalDone: number, finalTried: number) => {
    setPhase('over');
    const beaten = offerBest(finalScore);
    setNewBest(beaten);
    play(beaten ? 'win' : 'level');
    const ok = await logPractice({
      room: 'maths', topic: `maths:game:${slug}`, kind: 'problem', drillId: `${slug}#${base.current}`,
      score: finalTried ? (finalDone / finalTried) * 100 : 0,
      durationMs: Date.now() - started.current,
      metrics: { coins: finalScore, solved: finalDone, tried: finalTried, level: levelFor(finalDone, levelEvery) },
    });
    setSaved(ok ? 'saved' : 'not-saved');
  }, [offerBest, play, slug, levelEvery]);

  const resolve = useCallback((ok: boolean, message: string, bonus = 0) => {
    if (feedback || !challenge || phase !== 'playing') return;
    setFeedback({ ok, message });
    const nextTried = tried + 1;
    setTried(nextTried);
    if (ok) {
      const gained = coinsFor(leftRef.current, challenge.patience, combo, bonus);
      const nextDone = done + 1;
      setScore(score + gained);
      setCombo((c) => c + 1);
      setDone(nextDone);
      setBurst((b) => b + 1);
      play('coin');
      if (levelFor(nextDone, levelEvery) > levelFor(done, levelEvery)) {
        setLevelUp(levelFor(nextDone, levelEvery));
        setTimeout(() => play('level'), 250);
        setTimeout(() => setLevelUp(null), 1600);
      }
      setTimeout(() => { index.current += 1; next(levelFor(nextDone, levelEvery)); }, 1500);
    } else {
      play('wrong');
      setCombo(0);
      const h = hearts - 1;
      setHearts(h);
      if (h <= 0) setTimeout(() => void finish(score, done, nextTried), 2200);
      else setTimeout(() => { index.current += 1; next(levelFor(done, levelEvery)); }, 2600);
    }
  }, [feedback, challenge, phase, tried, combo, done, score, hearts, play, next, finish, levelEvery]);

  /* The clock drains; at zero the challenge is lost. */
  const resolveRef = useRef(resolve);
  useEffect(() => { resolveRef.current = resolve; }, [resolve]);
  useEffect(() => {
    if (phase !== 'playing' || feedback || !challenge) return;
    const t = setInterval(() => {
      leftRef.current = Math.max(0, leftRef.current - 0.2);
      setLeft(leftRef.current);
      if (leftRef.current <= 0) {
        clearInterval(t);
        resolveRef.current(false, 'Out of time!');
      }
    }, 200);
    return () => clearInterval(t);
  }, [phase, feedback, challenge]);

  const start = useCallback(() => {
    base.current = freshSeed();
    index.current = 0;
    setScore(0);
    setCombo(0);
    setHearts(maxHearts);
    setDone(0);
    setTried(0);
    setSaved(null);
    setNewBest(false);
    started.current = Date.now();
    setPhase('playing');
    next(1);
    play('tap');
  }, [maxHearts, next, play]);

  return {
    phase, challenge, challengeId, level, score, combo, hearts, maxHearts, done, tried, feedback, left, burst, levelUp, best, newBest, saved,
    muted, toggle, play, start, resolve,
  };
}
