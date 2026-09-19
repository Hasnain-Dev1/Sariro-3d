'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, Swords, Timer, Trophy, Volume2, VolumeX } from 'lucide-react';
import { checkAnswer, type Response } from '@/lib/practice/check';
import {
  battleScore, bossFor, bossTopic, enraged, newBattle, nextTier, starsFrom, strike, tierDifficulty, timeLimit,
  BOSS_HEARTS, BOSS_HP, MAX_TIER, type Battle,
} from '@/lib/practice/games/boss';
import { modulesFor, type ModuleInfo } from '@/lib/practice/maths/tests';
import { gradeTopics } from '@/lib/practice/maths/topics';
import { freshSeed } from '@/lib/practice/rng';
import { logPractice } from '@/lib/practice/log';
import type { TopicAttempt } from '@/lib/practice/mastery';
import type { Item, Topic } from '@/lib/practice/types';
import { Confetti, PatienceBar, useSound } from './game-kit';

/**
 * SARIRO — Boss Battles
 * ============================================================================
 * Every module of the grade's syllabus is guarded by a boss. Its questions are
 * the module's questions; right answers hit (fast ones hit harder, a streak
 * harder still), wrong or slow ones let it hit back, and three hits end the
 * fight. Beat it and it returns angrier — ★★, then ★★★ — so a whole year's
 * maths becomes a shelf of trophies to fill.
 * The rules are lib/practice/games/boss.ts (pure, tested).
 */

function Stars({ n, size = 'w-4 h-4' }: { n: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} of ${MAX_TIER} stars`}>
      {Array.from({ length: MAX_TIER }, (_, i) => (
        <Star key={i} className={`${size} ${i < n ? 'text-amber-400' : 'text-slate-300'}`} fill={i < n ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

/* ── One fight ─────────────────────────────────────────────────────────── */

function Fight({ grade, mod, tier, accent, onExit, onLogged, onRematch }: {
  grade: number; mod: ModuleInfo; tier: number; accent: string; onExit: () => void; onLogged: () => void; onRematch: (tier: number) => void;
}) {
  const boss = bossFor(mod.num);
  const pool = useMemo<Topic[]>(() => (mod.topics.length ? mod.topics : gradeTopics(grade)), [mod, grade]);
  const { play, muted, toggle } = useSound();
  const seen = useRef(new Set<string>());
  const started = useRef(Date.now());
  const [battle, setBattle] = useState<Battle>(newBattle);
  const [item, setItem] = useState<Item | null>(null);
  const [text, setText] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const [nearly, setNearly] = useState<string | null>(null);
  const [answered, setAnswered] = useState<{ ok: boolean; message: string } | null>(null);
  const [hit, setHit] = useState<{ id: number; damage: number } | null>(null);
  const [ouch, setOuch] = useState(0);
  const [burst, setBurst] = useState(0);
  const [left, setLeft] = useState(0);
  const [saved, setSaved] = useState<'saved' | 'not-saved' | null>(null);
  const [finished, setFinished] = useState(false);
  const leftRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const limit = timeLimit(tier, enraged(battle));

  const ask = useCallback((b: Battle) => {
    let next: Item | null = null;
    for (let i = 0; i < 30; i++) {
      const topic = pool[Math.floor(Math.random() * pool.length)];
      next = topic.make(freshSeed(), tierDifficulty(tier));
      if (!seen.current.has(next.prompt)) break;
    }
    seen.current.add(next!.prompt);
    setItem(next);
    setText('');
    setChoice(null);
    setNearly(null);
    setAnswered(null);
    const l = timeLimit(tier, enraged(b));
    leftRef.current = l;
    setLeft(l);
    setTimeout(() => inputRef.current?.focus(), 40);
  }, [pool, tier]);

  useEffect(() => { ask(newBattle()); }, [ask]);

  const end = useCallback(async (b: Battle) => {
    setFinished(true);
    play(b.won ? 'win' : 'boom');
    if (b.won) setBurst((x) => x + 1);
    const ok = await logPractice({
      room: 'maths', topic: bossTopic(grade, mod.num, tier), kind: 'problem', drillId: bossTopic(grade, mod.num, tier),
      score: battleScore(b), durationMs: Date.now() - started.current,
      metrics: { won: b.won ? 1 : 0, hp: b.hp, right: b.right, wrong: b.wrong, tier },
    });
    setSaved(ok ? 'saved' : 'not-saved');
    onLogged();
  }, [grade, mod.num, tier, play, onLogged]);

  const settle = useCallback((correct: boolean, message: string) => {
    if (answered || battle.over || !item) return;
    const { battle: b, damage } = strike(battle, correct, leftRef.current, limit);
    setBattle(b);
    setAnswered({ ok: correct, message });
    if (correct) {
      setHit({ id: Date.now(), damage });
      play(b.combo > 0 && b.combo % 3 === 0 ? 'level' : 'coin');
    } else {
      setOuch((o) => o + 1);
      play('wrong');
    }
    if (b.over) setTimeout(() => void end(b), 700);
    else setTimeout(() => ask(b), correct ? 900 : 2200);
  }, [answered, battle, item, limit, play, end, ask]);

  /* The clock: at zero the boss strikes. */
  const settleRef = useRef(settle);
  useEffect(() => { settleRef.current = settle; }, [settle]);
  useEffect(() => {
    if (!item || answered || battle.over) return;
    const t = setInterval(() => {
      leftRef.current = Math.max(0, leftRef.current - 0.2);
      setLeft(leftRef.current);
      if (leftRef.current <= 0) {
        clearInterval(t);
        settleRef.current(false, 'Too slow — the boss struck first!');
      }
    }, 200);
    return () => clearInterval(t);
  }, [item, answered, battle.over]);

  const response = (): Response | null => {
    if (!item) return null;
    if (item.answer.kind === 'choice') return choice === null ? null : { kind: 'choice', index: choice };
    return text.trim() ? { kind: 'text', text } : null;
  };
  const attack = (r = response()) => {
    if (!item || !r || answered) return;
    const v = checkAnswer(item.answer, r);
    if (v.correct) { settle(true, 'Hit!'); return; }
    if (v.nearly && !nearly) { setNearly(v.message); play('tap'); return; }
    settle(false, `${v.message} The answer was ${item.answerText}.`);
  };

  /* ── The end of the fight ── */
  if (finished) {
    const won = battle.won;
    return (
      <div className="relative rounded-3xl p-6 sm:p-10 text-center overflow-hidden text-white" style={{ background: won ? 'radial-gradient(circle at 50% 20%, #065F46, #0F172A 75%)' : 'radial-gradient(circle at 50% 20%, #7F1D1D, #0F172A 75%)' }}>
        <Confetti burst={burst} />
        <motion.p initial={{ scale: 0.4, rotate: won ? -20 : 0 }} animate={{ scale: 1, rotate: 0 }} className="text-7xl" aria-hidden>{won ? '🏆' : boss.emoji}</motion.p>
        <h2 className="mt-3 text-3xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>{won ? `${boss.name} defeated!` : `The ${boss.name} survived`}</h2>
        <p className="mt-2 text-[15px] text-white/80">
          {won ? `Module ${mod.num} · ${mod.title}` : `It had ${battle.hp} of ${BOSS_HP} health left. ${battle.hp <= 30 ? 'So close to a trophy!' : 'Every hit counts — go again.'}`}
        </p>
        {won && <p className="mt-3"><Stars n={tier} size="w-8 h-8" /></p>}
        <p className="mt-3 text-[13px] text-white/70">{battle.right} hit{battle.right === 1 ? '' : 's'} · {battle.wrong} miss{battle.wrong === 1 ? '' : 'es'}{saved ? ` · ${saved === 'saved' ? 'saved to your progress' : 'not saved this time'}` : ''}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {won && tier < MAX_TIER
            ? <button type="button" autoFocus onClick={() => onRematch(tier + 1)} className="h-12 px-6 rounded-2xl bg-amber-400 text-slate-900 text-[16px] font-extrabold shadow-lg">Rematch {'★'.repeat(tier + 1)} — it&apos;s angrier</button>
            : <button type="button" autoFocus onClick={() => onRematch(tier)} className="h-12 px-6 rounded-2xl bg-white text-slate-900 text-[16px] font-extrabold shadow-lg">{won ? 'Fight again' : 'Try again'}</button>}
          <button type="button" onClick={onExit} className="h-12 px-6 rounded-2xl border-2 border-white/40 text-white text-[15px] font-bold">All bosses</button>
        </div>
      </div>
    );
  }

  const angry = enraged(battle);
  const hpPct = (battle.hp / BOSS_HP) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onExit} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800"><ArrowLeft className="w-4 h-4" /> Retreat</button>
        <span className="ml-auto inline-flex items-center gap-0.5" aria-label={`${battle.hearts} lives left`}>
          {Array.from({ length: BOSS_HEARTS }, (_, i) => (
            <motion.span key={i} animate={{ scale: i < battle.hearts ? 1 : 0.8, opacity: i < battle.hearts ? 1 : 0.25 }}>
              <Heart className="w-5 h-5 text-rose-500" fill={i < battle.hearts ? 'currentColor' : 'none'} />
            </motion.span>
          ))}
        </span>
        <button type="button" onClick={toggle} aria-label={muted ? 'Sound on' : 'Sound off'} className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* The boss */}
      <motion.div
        key={`ouch${ouch}`}
        animate={ouch ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.35 }}
        className="relative rounded-3xl p-5 text-white overflow-hidden"
        style={{ background: `radial-gradient(circle at 50% 0%, ${boss.colour}, #0F172A 80%)` }}
      >
        {ouch > 0 && answered && !answered.ok && <div className="absolute inset-0 bg-rose-600/30 pointer-events-none" aria-hidden />}
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.span
              key={hit?.id ?? 0}
              animate={hit ? { scale: [1, 0.8, 1.1, 1], rotate: [0, -8, 6, 0] } : { y: [0, -4, 0] }}
              transition={hit ? { duration: 0.4 } : { duration: 2, repeat: Infinity }}
              className="block text-6xl sm:text-7xl leading-none"
              aria-hidden
            >
              {boss.emoji}
            </motion.span>
            <AnimatePresence>
              {hit && answered?.ok && (
                <motion.span key={hit.id} initial={{ y: 0, opacity: 1 }} animate={{ y: -40, opacity: 0 }} transition={{ duration: 0.9 }} className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl font-black text-amber-300 drop-shadow">
                  −{hit.damage}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-white/70" style={{ fontFamily: 'var(--font-grotesk)' }}>Boss {mod.num} · <Stars n={tier} size="w-3 h-3" /></p>
            <p className="text-xl sm:text-2xl font-extrabold truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>The {boss.name} {angry && <span className="text-amber-300 text-[15px] align-middle">💢 ANGRY</span>}</p>
            <div className="mt-2 h-4 rounded-full bg-white/15 overflow-hidden" aria-label={`Boss health ${battle.hp} of ${BOSS_HP}`}>
              <motion.div className="h-full rounded-full" animate={{ width: `${hpPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} style={{ background: hpPct > 50 ? '#22C55E' : hpPct > 25 ? '#F59E0B' : '#EF4444' }} />
            </div>
            <p className="mt-1 text-[12px] font-bold text-white/70 tabular-nums">HP {battle.hp}/{BOSS_HP}{battle.combo >= 2 ? ` · 🔥 streak ${battle.combo}` : ''}</p>
          </div>
        </div>
        <Confetti burst={burst} />
      </motion.div>

      {/* The question */}
      {item && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
            <div className="flex-1"><PatienceBar left={left} total={limit} /></div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 whitespace-pre-line leading-relaxed" style={{ fontFamily: 'var(--font-jakarta)' }}>{item.prompt}</p>
          {item.answer.kind === 'choice' ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.answer.options.map((opt, i) => {
                const isRight = answered && i === (item.answer as { correct: number }).correct;
                const isWrongPick = answered && !answered.ok && choice === i;
                return (
                  <button
                    key={opt + i}
                    type="button"
                    disabled={!!answered}
                    onClick={() => { setChoice(i); attack({ kind: 'choice', index: i }); }}
                    className={`min-h-[48px] rounded-xl border-2 px-4 text-left text-[15px] font-bold ${isRight ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : isWrongPick ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-800 hover:border-slate-400'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); attack(); }} className="mt-4 flex gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!!answered}
                autoComplete="off"
                spellCheck={false}
                inputMode={item.answer.kind === 'number' ? 'decimal' : 'text'}
                placeholder="Your answer"
                aria-label="Your answer"
                className="flex-1 min-w-0 h-14 rounded-2xl border-2 border-slate-300 px-4 text-xl font-extrabold text-slate-900 outline-none focus:border-slate-500 disabled:bg-slate-50"
              />
              <button type="submit" disabled={!!answered || !text.trim()} className="inline-flex items-center gap-2 h-14 px-5 rounded-2xl text-white text-[16px] font-extrabold disabled:opacity-40" style={{ background: accent }}>
                <Swords className="w-5 h-5" /> Attack
              </button>
            </form>
          )}
          {item.inputHint && !answered && <p className="mt-1.5 text-[12.5px] text-slate-500">{item.inputHint}</p>}
          {nearly && !answered && <p className="mt-3 rounded-xl bg-amber-50 text-amber-800 px-4 py-2.5 text-[14px] font-semibold">{nearly} Have another go.</p>}
          {answered && (
            <p className={`mt-3 rounded-xl px-4 py-2.5 text-[14px] font-bold ${answered.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`} role="status">
              {answered.ok ? '⚔️ ' : '💥 The boss hits back! '}{answered.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── The boss map ──────────────────────────────────────────────────────── */

export default function BossBattles({ grade, accent, attempts, onLogged, currentModule }: {
  grade: number; accent: string; attempts: TopicAttempt[]; onLogged: () => void; currentModule?: number | null;
}) {
  const modules = useMemo(() => modulesFor(grade), [grade]);
  const stars = useMemo(() => starsFrom(attempts, grade), [attempts, grade]);
  const [fight, setFight] = useState<{ num: number; tier: number; round: number } | null>(null);
  const total = [...stars.values()].reduce((s, n) => s + n, 0);
  const beaten = [...stars.values()].filter((n) => n > 0).length;

  if (fight) {
    const mod = modules.find((m) => m.num === fight.num);
    if (mod) {
      return (
        <Fight
          key={`${fight.num}-${fight.tier}-${fight.round}`}
          grade={grade}
          mod={mod}
          tier={fight.tier}
          accent={accent}
          onExit={() => setFight(null)}
          onLogged={onLogged}
          onRematch={(tier) => setFight({ num: fight.num, tier, round: fight.round + 1 })}
        />
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 sm:p-6 text-white flex flex-wrap items-center gap-4" style={{ background: 'radial-gradient(circle at 20% 0%, #7C3AED, #0F172A 80%)' }}>
        <span className="text-5xl" aria-hidden>⚔️</span>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>Grade {grade} Boss Battles</h2>
          <p className="text-[14px] text-white/80">Every module has a boss. Beat it, then beat it angrier — three stars each.</p>
        </div>
        <div className="text-right">
          <p className="inline-flex items-center gap-1.5 text-[15px] font-extrabold"><Trophy className="w-5 h-5 text-amber-300" /> {beaten}/{modules.length} beaten</p>
          <p className="text-[13px] text-white/70">{total}/{modules.length * MAX_TIER} stars</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {modules.map((m) => {
          const b = bossFor(m.num);
          const s = stars.get(m.num) ?? 0;
          const current = currentModule === m.num;
          return (
            <motion.button
              key={m.num}
              type="button"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFight({ num: m.num, tier: nextTier(s), round: 0 })}
              className={`relative text-left rounded-2xl p-4 border-2 bg-white shadow-sm hover:shadow-md ${current ? '' : 'border-slate-200'}`}
              style={current ? { borderColor: accent } : undefined}
            >
              {current && <span className="absolute -top-2.5 left-3 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold text-white" style={{ background: accent }}>This week</span>}
              <span className="flex items-center justify-between">
                <span className="text-4xl" style={{ filter: s >= MAX_TIER ? 'grayscale(0.2)' : undefined }} aria-hidden>{s >= MAX_TIER ? '🏆' : b.emoji}</span>
                <Stars n={s} />
              </span>
              <span className="block mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>Boss {m.num} · {b.name}</span>
              <span className="block text-[14px] font-extrabold text-slate-900 leading-snug line-clamp-2">{m.title}</span>
              <span className="mt-2 inline-flex h-8 items-center px-3 rounded-lg text-[12.5px] font-extrabold text-white" style={{ background: s >= MAX_TIER ? '#10B981' : b.colour }}>
                {s === 0 ? 'Fight' : s >= MAX_TIER ? 'Beaten — fight again' : `Rematch ${'★'.repeat(s + 1)}`}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
