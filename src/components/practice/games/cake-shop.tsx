'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw, Scissors } from 'lucide-react';
import {
  checkServe, coinsFor, cutInto, eatSlice, freshCake, leftCount, levelFor, makeOrder, recutEach, servedCount, toggleServe,
  type CakeState, type Order,
} from '@/lib/practice/games/cake';
import { freshSeed } from '@/lib/practice/rng';
import { logPractice } from '@/lib/practice/log';
import { Confetti, GameOver, Hud, PatienceBar, useBest, useSound } from './game-kit';

/**
 * SARIRO — Cake Shop
 * ============================================================================
 * Fractions and taking-away you do with your hands: cut the cake, serve the
 * slices, eat what the customer eats, sell the cupcakes. Customers queue with a
 * patience bar; fast, right answers earn more coins and build a combo; three
 * mistakes end the round. Every round goes into the learner's progress.
 * The rules are lib/practice/games/cake.ts (pure, tested).
 */

const FACES = ['🧒', '👧', '👦', '👩', '🧑', '👵', '👴', '🐻', '🦊', '🐼', '🐯', '🐰'];
const CUT_CHOICES = [2, 3, 4, 5, 6, 8, 10, 12];
const HEARTS = 3;

type Phase = 'intro' | 'playing' | 'over';
type Step = 'act' | 'answer';

/* ── The cake, drawn ───────────────────────────────────────────────────── */

function wedge(i: number, n: number, r: number) {
  if (n === 1) return null;
  const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
  const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
  const p = (a: number) => `${100 + r * Math.cos(a)} ${100 + r * Math.sin(a)}`;
  return `M100 100 L${p(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z`;
}

function CakeSvg({ cake, onSlice, highlight }: { cake: CakeState; onSlice: (i: number) => void; highlight: boolean }) {
  const n = cake.slices;
  return (
    <svg viewBox="0 0 200 200" className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] select-none touch-manipulation" role="group" aria-label={`Cake in ${n} slices`}>
      <circle cx="100" cy="100" r="97" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2" />
      {n === 1 ? (
        <g onClick={() => onSlice(0)} style={{ cursor: 'pointer' }}>
          <circle cx="100" cy="100" r="84" fill={cake.served[0] ? '#FBCFE8' : '#F9A8D4'} stroke="#DB2777" strokeWidth="2" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="#FFF" strokeWidth="3" strokeDasharray="6 6" opacity="0.8" />
          <circle cx="100" cy="100" r="7" fill="#DC2626" />
        </g>
      ) : (
        Array.from({ length: n }, (_, i) => {
          const mid = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
          const out = cake.served[i] ? 10 : 0;
          const dx = Math.cos(mid) * out;
          const dy = Math.sin(mid) * out;
          const cherry = { x: 100 + Math.cos(mid) * 58, y: 100 + Math.sin(mid) * 58 };
          if (cake.eaten[i]) {
            return (
              <g key={i} aria-hidden>
                <path d={wedge(i, n, 84)!} fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 4" />
                <circle cx={100 + Math.cos(mid) * 50} cy={100 + Math.sin(mid) * 50} r="2" fill="#E2E8F0" />
                <circle cx={100 + Math.cos(mid) * 64} cy={100 + Math.sin(mid) * 64} r="1.6" fill="#E2E8F0" />
              </g>
            );
          }
          return (
            <motion.g
              key={`${n}-${i}`}
              role="button"
              tabIndex={0}
              aria-label={`Slice ${i + 1}${cake.served[i] ? ', served' : ''}`}
              onClick={() => onSlice(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSlice(i); } }}
              animate={{ x: dx, y: dy, scale: cake.served[i] ? 1.03 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              style={{ cursor: 'pointer' }}
            >
              <path d={wedge(i, n, 84)!} fill={cake.served[i] ? '#FDE68A' : '#F9A8D4'} stroke={cake.served[i] ? '#D97706' : '#DB2777'} strokeWidth={cake.served[i] ? 2.5 : 1.5} />
              <circle cx={cherry.x} cy={cherry.y} r={Math.max(3, 9 - n * 0.4)} fill="#DC2626" />
            </motion.g>
          );
        })
      )}
      {highlight && <circle cx="100" cy="100" r="95" fill="none" stroke="#10B981" strokeWidth="4" />}
    </svg>
  );
}

/* ── The game ──────────────────────────────────────────────────────────── */

export default function CakeShop({ grade, accent }: { grade: number; accent: string }) {
  const { play, muted, toggle } = useSound();
  const [best, offerBest] = useBest(`cake-shop-g${grade}`);
  const [phase, setPhase] = useState<Phase>('intro');
  const [order, setOrder] = useState<Order | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState(HEARTS);
  const [served, setServed] = useState(0);
  const [tried, setTried] = useState(0);
  const [cake, setCake] = useState<CakeState>(freshCake());
  const [sold, setSold] = useState<boolean[]>([]);
  const [step, setStep] = useState<Step>('act');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [left, setLeft] = useState(30);
  const [burst, setBurst] = useState(0);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [saved, setSaved] = useState<'saved' | 'not-saved' | null>(null);
  const started = useRef(0);
  const base = useRef(1);
  const index = useRef(0);
  const leftRef = useRef(30);

  const level = levelFor(served);
  const face = FACES[(base.current + index.current) % FACES.length];

  /** The next customer walks in: a fresh order, a fresh counter. Event-driven, never an effect. */
  const nextCustomer = useCallback((lvl: number) => {
    const o = makeOrder(base.current + index.current * 7919, grade, lvl);
    setOrder(o);
    setFeedback(null);
    setStep('act');
    leftRef.current = o.patience;
    setLeft(o.patience);
    if (o.kind === 'takeaway') setSold(Array.from({ length: o.tray! }, () => false));
    else if (o.kind === 'leftover' || o.kind === 'recut') setCake(freshCake(o.startSlices!, o.startEaten!));
    else setCake(freshCake());
  }, [grade]);

  const finishRound = useCallback(async (finalScore: number, finalServed: number, finalTried: number) => {
    setPhase('over');
    const beaten = offerBest(finalScore);
    setNewBest(beaten);
    play(beaten ? 'win' : 'level');
    const ok = await logPractice({
      room: 'maths', topic: 'maths:game:cake-shop', kind: 'problem', drillId: `cake-shop#${base.current}`,
      score: finalTried ? (finalServed / finalTried) * 100 : 0,
      durationMs: Date.now() - started.current,
      metrics: { coins: finalScore, served: finalServed, tried: finalTried, level: levelFor(finalServed) },
    });
    setSaved(ok ? 'saved' : 'not-saved');
  }, [offerBest, play]);

  const resolve = useCallback((ok: boolean, message: string) => {
    if (feedback || !order) return;
    setFeedback({ ok, message });
    const nextTried = tried + 1;
    setTried(nextTried);
    if (ok) {
      const gained = coinsFor(leftRef.current, order.patience, combo);
      const nextServed = served + 1;
      setScore(score + gained);
      setCombo((c) => c + 1);
      setServed(nextServed);
      setBurst((b) => b + 1);
      play('coin');
      if (levelFor(nextServed) > levelFor(served)) {
        setLevelUp(levelFor(nextServed));
        setTimeout(() => play('level'), 250);
        setTimeout(() => setLevelUp(null), 1600);
      }
      setTimeout(() => { index.current += 1; nextCustomer(levelFor(nextServed)); }, 1300);
    } else {
      play('wrong');
      setCombo(0);
      const h = hearts - 1;
      setHearts(h);
      if (h <= 0) setTimeout(() => void finishRound(score, served, nextTried), 1500);
      else setTimeout(() => { index.current += 1; nextCustomer(levelFor(served)); }, 2200);
    }
  }, [feedback, order, tried, combo, served, score, hearts, play, nextCustomer, finishRound]);

  /* The customer's patience drains; at zero they walk out. */
  const resolveRef = useRef(resolve);
  useEffect(() => { resolveRef.current = resolve; }, [resolve]);
  useEffect(() => {
    if (phase !== 'playing' || feedback || !order) return;
    const t = setInterval(() => {
      leftRef.current = Math.max(0, leftRef.current - 0.2);
      setLeft(leftRef.current);
      if (leftRef.current <= 0) {
        clearInterval(t);
        resolveRef.current(false, 'Too slow — the customer walked out!');
      }
    }, 200);
    return () => clearInterval(t);
  }, [phase, feedback, order]);

  const start = () => {
    base.current = freshSeed();
    index.current = 0;
    setScore(0);
    setCombo(0);
    setHearts(HEARTS);
    setServed(0);
    setTried(0);
    setSaved(null);
    setNewBest(false);
    started.current = Date.now();
    setPhase('playing');
    nextCustomer(1);
    play('tap');
  };

  /* ── Actions ── */
  const eatenByCustomer = order?.kind === 'leftover' ? cake.eaten.filter(Boolean).length - (order.startEaten ?? 0) : 0;

  const onSlice = (i: number) => {
    if (feedback || !order) return;
    if (order.kind === 'leftover') {
      if (step !== 'act' || cake.eaten[i]) return;
      const next = eatSlice(cake, i);
      setCake(next);
      play('tap');
      if (next.eaten.filter(Boolean).length - (order.startEaten ?? 0) >= order.take!) setTimeout(() => setStep('answer'), 250);
      return;
    }
    if (cake.slices === 1) return; // cut first
    setCake(toggleServe(cake, i));
    play('tap');
  };

  const sell = (i: number) => {
    if (feedback || !order || step !== 'act' || sold[i]) return;
    const next = [...sold];
    next[i] = true;
    setSold(next);
    play('tap');
    if (next.filter(Boolean).length >= order.take!) setTimeout(() => setStep('answer'), 250);
  };

  const pickOption = (opt: string) => {
    if (feedback || !order) return;
    resolve(opt === order.correctOption, opt === order.correctOption ? `Yes — ${opt} left!` : `Not quite — ${order.correctOption} is left.`);
  };

  /* ── Screens ── */
  if (phase === 'intro') {
    return (
      <div className="relative rounded-3xl border border-pink-200 bg-gradient-to-b from-pink-50 to-amber-50 p-6 sm:p-10 text-center overflow-hidden">
        <p className="text-6xl" aria-hidden>🎂</p>
        <h2 className="mt-3 text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Cake Shop</h2>
        <p className="mt-2 text-[15px] text-slate-700 max-w-md mx-auto">
          Customers want cake — exactly the right amount. Cut it, serve it, count what is left. Be quick: faster serves earn more coins, and every right answer in a row builds your combo.
        </p>
        <p className="mt-3 text-[13px] text-slate-500">Three mistakes and the shop closes. Best: {best} coins</p>
        <button type="button" onClick={start} className="mt-6 h-14 px-10 rounded-2xl text-white text-[18px] font-extrabold shadow-lg" style={{ background: accent }} autoFocus>Open the shop</button>
      </div>
    );
  }

  if (phase === 'over') {
    return (
      <GameOver
        title="The shop is closed"
        score={score}
        best={best}
        newBest={newBest}
        accent={accent}
        saved={saved}
        lines={[`${served} customer${served === 1 ? '' : 's'} served · level ${levelFor(served)}`, tried ? `${Math.round((served / tried) * 100)}% right` : '']}
        onAgain={start}
      />
    );
  }

  if (!order) return null;

  const canCut = (order.kind === 'serve') && !cake.eaten.some(Boolean) && servedCount(cake) === 0;
  const recutOptions = order.kind === 'recut' ? [2, 3].filter((k) => cake.slices * k <= 12 && cake.slices * k <= (order.mustCut ?? 12)) : [];

  return (
    <div className="relative rounded-3xl border border-pink-200 bg-gradient-to-b from-pink-50 via-white to-amber-50 p-4 sm:p-6 overflow-hidden">
      <Confetti burst={burst} />
      <Hud score={score} combo={combo} hearts={hearts} maxHearts={HEARTS} level={level} best={best} muted={muted} onMute={toggle} />

      <AnimatePresence>
        {levelUp && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 top-16 z-10 text-center pointer-events-none">
            <span className="inline-block rounded-2xl bg-violet-600 text-white px-6 py-3 text-2xl font-extrabold shadow-xl">Level {levelUp}! 🎉</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The customer */}
      <div className="mt-4 flex items-start gap-3">
        <motion.span key={`${base.current}-${index.current}`} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-5xl leading-none" aria-hidden>{face}</motion.span>
        <div className="flex-1 min-w-0">
          <motion.p key={`t-${base.current}-${index.current}`} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-3 text-[16px] sm:text-[17px] font-bold text-slate-900 shadow-sm">
            {order.text}
          </motion.p>
          <div className="mt-2"><PatienceBar left={left} total={order.patience} /></div>
        </div>
      </div>

      {/* The counter */}
      <div className="mt-5 flex flex-col items-center">
        {order.kind === 'takeaway' ? (
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 p-4 rounded-2xl bg-amber-100/70 border border-amber-200">
            {sold.map((s, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => sell(i)}
                disabled={s || step !== 'act'}
                aria-label={`Cupcake ${i + 1}${s ? ', sold' : ''}`}
                animate={{ scale: s ? 0 : 1, rotate: s ? 30 : 0, opacity: s ? 0 : 1 }}
                whileTap={{ scale: 0.85 }}
                className="w-11 h-11 sm:w-12 sm:h-12 text-3xl leading-none flex items-center justify-center"
              >🧁</motion.button>
            ))}
          </div>
        ) : (
          <CakeSvg cake={cake} onSlice={onSlice} highlight={!!feedback?.ok} />
        )}

        {/* Tools */}
        {order.kind === 'serve' && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-600 mr-1"><Scissors className="w-4 h-4" /> Cut into</span>
            {CUT_CHOICES.map((k) => (
              <button
                key={k}
                type="button"
                disabled={!canCut || !!feedback}
                onClick={() => { setCake(cutInto(cake, k)); play('cut'); }}
                className={`w-10 h-10 rounded-xl text-[15px] font-extrabold border-2 disabled:opacity-40 ${cake.slices === k ? 'text-white' : 'bg-white text-slate-700 border-slate-200'}`}
                style={cake.slices === k ? { background: accent, borderColor: accent } : undefined}
              >{k}</button>
            ))}
            {!canCut && servedCount(cake) > 0 && !feedback && (
              <button type="button" onClick={() => setCake(freshCake())} className="ml-1 inline-flex items-center gap-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600"><RotateCcw className="w-4 h-4" /> New cake</button>
            )}
          </div>
        )}
        {order.kind === 'recut' && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-slate-600"><Scissors className="w-4 h-4" /> Cut every slice into</span>
            {recutOptions.map((k) => (
              <button key={k} type="button" disabled={!!feedback} onClick={() => { setCake(recutEach(cake, k)); play('cut'); }} className="h-10 px-4 rounded-xl bg-white border-2 border-slate-200 text-[15px] font-extrabold text-slate-700">{k}</button>
            ))}
            <span className="text-[12.5px] text-slate-500">({cake.slices} slices now)</span>
          </div>
        )}

        {(order.kind === 'serve' || order.kind === 'recut') && (
          <button
            type="button"
            disabled={!!feedback || servedCount(cake) === 0}
            onClick={() => { const v = checkServe(order, cake); resolve(v.ok, v.message); }}
            className="mt-4 inline-flex items-center gap-2 h-12 px-8 rounded-2xl text-white text-[16px] font-extrabold shadow disabled:opacity-40"
            style={{ background: accent }}
          >
            <Check className="w-5 h-5" /> Serve {servedCount(cake) > 0 ? `${servedCount(cake)} slice${servedCount(cake) === 1 ? '' : 's'}` : ''}
          </button>
        )}

        {(order.kind === 'leftover' || order.kind === 'takeaway') && (
          <div className="mt-4 min-h-[56px] flex flex-col items-center">
            {step === 'act' ? (
              <p className="text-[14px] font-bold text-slate-600">
                {order.kind === 'leftover' ? `Tap the slices they eat (${Math.max(0, eatenByCustomer)}/${order.take})` : `Tap the cupcakes they buy (${sold.filter(Boolean).length}/${order.take})`}
              </p>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {order.options!.map((opt) => (
                  <motion.button key={opt} type="button" whileTap={{ scale: 0.92 }} onClick={() => pickOption(opt)} disabled={!!feedback} className="min-w-[72px] h-12 px-4 rounded-2xl bg-white border-2 border-slate-200 text-[18px] font-extrabold text-slate-900 hover:border-slate-400">
                    {opt}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {feedback && (
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className={`mt-4 rounded-2xl px-5 py-3 text-[15px] font-extrabold ${feedback.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`} role="status">
              {feedback.ok ? '✓ ' : '✗ '}{feedback.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <p className="sr-only" aria-live="polite">{leftCount(cake)} slices left</p>
    </div>
  );
}
