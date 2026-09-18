'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { mathsTopicsFor, MATHS_TOPICS } from '@/lib/practice/maths/topics';
import { fireStorm, newStorm, stepStorm, STORM_HEARTS as HEARTS, type Meteor, type StormState } from '@/lib/practice/games/storm';
import { freshSeed } from '@/lib/practice/rng';
import { logPractice } from '@/lib/practice/log';
import type { Difficulty, Item, Topic } from '@/lib/practice/types';
import { Confetti, GameOver, Hud, useBest, useSound } from './game-kit';

/**
 * SARIRO — Meteor Storm
 * ============================================================================
 * The arcade for every grade: questions fall as meteors; type the answer and
 * press Enter to blast it. Meteors come faster as the score climbs, the
 * questions get harder, and every hit in a row raises the multiplier. A meteor
 * that reaches the ground costs a heart. Uses the same generators and the same
 * marking as the practice room — only short questions are sent up, so they
 * fit on a meteor.
 */

const PROMPT_MAX = 44;

interface Blast { id: number; x: number; y: number; ok: boolean }

function shortItem(pool: Topic[], difficulty: Difficulty): Item {
  for (let i = 0; i < 40; i++) {
    const topic = pool[Math.floor(Math.random() * pool.length)];
    const item = topic.make(freshSeed(), difficulty);
    const face = item.short ?? item.prompt;
    if (item.answer.kind !== 'choice' && item.answer.kind !== 'order' && item.answer.kind !== 'coefficients' && !face.includes('\n') && face.length <= PROMPT_MAX) return item;
  }
  const fallback = MATHS_TOPICS.find((t) => t.key === 'maths:times-tables')!;
  return fallback.make(freshSeed(), difficulty);
}

export default function MeteorStorm({ grade, accent }: { grade: number; accent: string }) {
  const { play, muted, toggle } = useSound();
  const [best, offerBest] = useBest(`meteor-storm-g${grade}`);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'over'>('intro');
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [blasts, setBlasts] = useState<Blast[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState(HEARTS);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [text, setText] = useState('');
  const [shake, setShake] = useState(0);
  const [burst, setBurst] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [saved, setSaved] = useState<'saved' | 'not-saved' | null>(null);

  const pool = useRef<Topic[]>([]);
  const state = useRef<StormState>(newStorm());
  const clock = useRef({ last: 0, started: 0, ended: false });
  const inputRef = useRef<HTMLInputElement>(null);

  const level = 1 + Math.floor(score / 150);
  const difficulty = (s: number): Difficulty => (s >= 400 ? 3 : s >= 150 ? 2 : 1);

  const end = useCallback(async () => {
    const st = state.current;
    if (clock.current.ended) return;
    clock.current.ended = true;
    setPhase('over');
    const beaten = offerBest(st.score);
    setNewBest(beaten);
    play(beaten ? 'win' : 'boom');
    const tries = st.hits + st.misses;
    const ok = await logPractice({
      room: 'maths', topic: 'maths:game:meteor-storm', kind: 'problem', drillId: 'meteor-storm',
      score: tries ? (st.hits / tries) * 100 : 0,
      durationMs: Date.now() - clock.current.started,
      metrics: { coins: st.score, hits: st.hits, misses: st.misses },
    });
    setSaved(ok ? 'saved' : 'not-saved');
  }, [offerBest, play]);

  /* The game loop: the rules are lib/practice/games/storm.ts; this feeds them the clock. */
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    const tick = (now: number) => {
      const c = clock.current;
      const dt = c.last ? Math.min(0.1, (now - c.last) / 1000) : 0;
      c.last = now;
      const { st, landed } = stepStorm(state.current, now, dt, () => ({
        item: shortItem(pool.current, difficulty(state.current.score)),
        x: 8 + Math.random() * 64,
      }));
      state.current = st;
      if (landed.length) {
        setHearts(st.hearts);
        setCombo(0);
        play('boom');
        setBlasts((b) => [...b, ...landed.map((m) => ({ id: m.id, x: m.x, y: 96, ok: false }))]);
      }
      setMeteors(st.meteors);
      if (st.over) { void end(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, play, end]);

  /* Blasts fade on their own. */
  useEffect(() => {
    if (!blasts.length) return;
    const t = setTimeout(() => setBlasts((b) => b.slice(1)), 600);
    return () => clearTimeout(t);
  }, [blasts]);

  const start = () => {
    pool.current = mathsTopicsFor(grade);
    state.current = newStorm();
    clock.current = { last: 0, started: Date.now(), ended: false };
    setMeteors([]);
    setBlasts([]);
    setScore(0);
    setCombo(0);
    setHearts(HEARTS);
    setHits(0);
    setMisses(0);
    setText('');
    setSaved(null);
    setNewBest(false);
    setPhase('playing');
    play('tap');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const fire = () => {
    if (!text.trim()) return;
    const { st, hit } = fireStorm(state.current, text);
    state.current = st;
    setText('');
    setMeteors(st.meteors);
    setScore(st.score);
    setCombo(st.combo);
    setHits(st.hits);
    setMisses(st.misses);
    if (hit) {
      if (st.combo % 5 === 0) { setBurst((b) => b + 1); play('level'); } else play('coin');
      setBlasts((b) => [...b, { id: hit.id, x: hit.x, y: hit.y, ok: true }]);
    } else {
      setShake((s) => s + 1);
      play('wrong');
    }
  };

  if (phase === 'intro') {
    return (
      <div className="relative rounded-3xl p-6 sm:p-10 text-center overflow-hidden text-white" style={{ background: 'radial-gradient(circle at 30% 20%, #312E81, #0F172A 70%)' }}>
        <p className="text-6xl" aria-hidden>☄️</p>
        <h2 className="mt-3 text-3xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>Meteor Storm</h2>
        <p className="mt-2 text-[15px] text-indigo-100 max-w-md mx-auto">
          Sums are falling from the sky. Type the answer and press Enter to blast them before they land. Hits in a row multiply your score — and it gets faster.
        </p>
        <p className="mt-3 text-[13px] text-indigo-200">Grade {grade} questions · Best: {best}</p>
        <button type="button" onClick={start} autoFocus className="mt-6 h-14 px-10 rounded-2xl bg-white text-indigo-900 text-[18px] font-extrabold shadow-lg">Launch</button>
      </div>
    );
  }

  if (phase === 'over') {
    const tries = hits + misses;
    return (
      <GameOver
        title="Game over"
        score={score}
        best={best}
        newBest={newBest}
        accent={accent}
        saved={saved}
        lines={[`${hits} meteor${hits === 1 ? '' : 's'} blasted`, tries ? `${Math.round((hits / tries) * 100)}% of your shots hit` : 'No shots fired'].filter(Boolean)}
        onAgain={start}
      />
    );
  }

  return (
    <div className="space-y-3">
      <Hud score={score} combo={combo} hearts={hearts} maxHearts={HEARTS} level={level} best={best} muted={muted} onMute={toggle} />
      <div className="relative h-[420px] rounded-3xl overflow-hidden select-none" style={{ background: 'radial-gradient(circle at 30% 10%, #312E81, #0F172A 75%)' }} onClick={() => inputRef.current?.focus()}>
        {/* Stars */}
        {Array.from({ length: 30 }, (_, i) => (
          <span key={i} className="absolute rounded-full bg-white" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3, opacity: 0.4 + (i % 5) / 10 }} aria-hidden />
        ))}
        <Confetti burst={burst} />

        {meteors.map((m) => (
          <div key={m.id} className="absolute -translate-x-1/2" style={{ left: `${m.x + 10}%`, top: `${m.y}%` }}>
            <div className="relative flex items-center gap-1.5 rounded-2xl px-3 py-1.5 font-extrabold text-[14px] sm:text-[16px] max-w-[260px] leading-snug shadow-[0_0_24px_rgba(251,146,60,0.55)]" style={{ background: 'linear-gradient(135deg, #FB923C, #DC2626)', color: 'white' }}>
              <span aria-hidden>☄️</span> {(m.item.short ?? m.item.prompt).replace(/ = \?$/, '').replace(/\?$/, '')}
            </div>
          </div>
        ))}

        <AnimatePresence>
          {blasts.map((b) => (
            <motion.span
              key={`b${b.id}`}
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl"
              style={{ left: `${b.x + 10}%`, top: `${b.y + 4}%` }}
              aria-hidden
            >
              {b.ok ? '💥' : '🔥'}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* The ground */}
        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-emerald-500/60 to-transparent" aria-hidden />
      </div>

      <motion.form
        key={shake}
        animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.3 }}
        onSubmit={(e) => { e.preventDefault(); fire(); }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Type an answer, press Enter"
          aria-label="Your answer"
          className="flex-1 h-14 rounded-2xl border-2 border-slate-300 px-4 text-xl font-extrabold text-slate-900 outline-none focus:border-indigo-500"
        />
        <button type="submit" className="h-14 px-6 rounded-2xl text-white text-lg font-extrabold" style={{ background: accent }}>Fire</button>
      </motion.form>
    </div>
  );
}
