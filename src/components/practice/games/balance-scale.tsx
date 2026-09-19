'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Scale as ScaleIcon, Undo2 } from 'lucide-react';
import {
  applyMove, equationText, isSolved, makePuzzle, sumWeights, tilt, weighExplain, weightOf,
  MAX_WEIGHTS, WEIGHTS, type Move, type Pan, type Puzzle,
} from '@/lib/practice/games/balance';
import { Confetti, Feedback, GameIntro, GameOver, Hud, LevelBanner, PatienceBar, useRound } from './game-kit';

/**
 * SARIRO — Balance Scale
 * ============================================================================
 * An equation you can hold. Young learners weigh a mystery box with real
 * weights — the beam tips as they add and take away — then say what the box
 * weighs. Older ones solve 3x + 7 = x + 19 by doing the same thing to both
 * pans until one box stands alone; the fewest moves is a perfect.
 * The rules are lib/practice/games/balance.ts (pure, tested).
 */

type Sound = (name: 'tap' | 'clunk' | 'wrong' | 'win') => void;
type Resolve = (ok: boolean, message: string, bonus?: number) => void;

/* ── The scale, drawn ──────────────────────────────────────────────────── */

interface PanItem { key: string; kind: 'box' | 'weight'; label: string; w: number; onClick?: () => void; reveal?: boolean }

const PIVOT = { x: 200, y: 58 };
const ARM = 130;
const STRING = 96;

function greedy(total: number): number[] {
  const out: number[] = [];
  let left = total;
  for (const w of [...WEIGHTS].reverse()) while (left >= w) { out.push(w); left -= w; }
  return out;
}

function weightSize(w: number) {
  return w >= 10 ? 26 : w >= 5 ? 23 : w >= 2 ? 20 : 17;
}

/** Items laid out left to right, rows stacking up from the pan. */
function PanContents({ items, cx, baseY }: { items: PanItem[]; cx: number; baseY: number }) {
  const rows: PanItem[][] = [[]];
  let width = 0;
  for (const it of items) {
    if (width + it.w > 134 && rows[rows.length - 1].length) { rows.push([]); width = 0; }
    rows[rows.length - 1].push(it);
    width += it.w + 3;
  }
  return (
    <g>
      {rows.map((row, r) => {
        const total = row.reduce((s, it) => s + it.w + 3, -3);
        let x = cx - total / 2;
        return row.map((it) => {
          const h = it.kind === 'box' ? 24 : Math.min(24, it.w);
          const y = baseY - 2 - r * 27 - h;
          const at = x;
          x += it.w + 3;
          const clickable = !!it.onClick;
          return (
            <g
              key={it.key}
              onClick={it.onClick}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              aria-label={clickable ? `Take the ${it.label} off` : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.onClick?.(); } } : undefined}
              style={{ cursor: clickable ? 'pointer' : 'default' }}
            >
              {it.kind === 'box' ? (
                <>
                  <rect x={at} y={y} width={it.w} height={h} rx="5" fill={it.reveal ? '#10B981' : '#7C3AED'} stroke={it.reveal ? '#047857' : '#5B21B6'} strokeWidth="1.5" />
                  <text x={at + it.w / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize={it.label.length > 2 ? 11 : 14} fontWeight="800" fill="#FFF">{it.label}</text>
                </>
              ) : (
                <>
                  <path d={`M${at + 3} ${y} H${at + it.w - 3} L${at + it.w} ${y + h} H${at} Z`} fill="#64748B" stroke="#334155" strokeWidth="1.2" />
                  <text x={at + it.w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={it.label.length > 2 ? 9.5 : 11} fontWeight="800" fill="#FFF">{it.label}</text>
                </>
              )}
            </g>
          );
        });
      })}
    </g>
  );
}

function ScaleSvg({ deg, left, right, level }: { deg: number; left: PanItem[]; right: PanItem[]; level: boolean }) {
  const rad = (deg * Math.PI) / 180;
  const dx = ARM * (1 - Math.cos(rad));
  const dy = ARM * Math.sin(rad);
  const ease = 'transform 0.7s cubic-bezier(.34,1.56,.64,1)';
  const pan = (side: -1 | 1, items: PanItem[]) => {
    const cx = PIVOT.x + side * ARM;
    const baseY = PIVOT.y + STRING;
    const t = side === 1 ? `translate(${-dx}px, ${dy}px)` : `translate(${dx}px, ${-dy}px)`;
    return (
      <g style={{ transform: t, transition: ease }}>
        <line x1={cx} y1={PIVOT.y} x2={cx - 58} y2={baseY} stroke="#94A3B8" strokeWidth="1.5" />
        <line x1={cx} y1={PIVOT.y} x2={cx + 58} y2={baseY} stroke="#94A3B8" strokeWidth="1.5" />
        <PanContents items={items} cx={cx} baseY={baseY} />
        <path d={`M${cx - 70} ${baseY} Q${cx} ${baseY + 18} ${cx + 70} ${baseY} Z`} fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 400 268" className="w-full max-w-[520px] h-auto select-none touch-manipulation" role="img" aria-label={level ? 'The scale is balanced' : deg > 0 ? 'The right pan is heavier' : 'The left pan is heavier'}>
      <rect x="150" y="254" width="100" height="10" rx="4" fill="#475569" />
      <path d={`M${PIVOT.x - 8} 254 L${PIVOT.x} ${PIVOT.y} L${PIVOT.x + 8} 254 Z`} fill="#64748B" />
      {pan(-1, left)}
      {pan(1, right)}
      <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transformBox: 'view-box', transition: ease }}>
        <rect x={PIVOT.x - ARM - 6} y={PIVOT.y - 5} width={ARM * 2 + 12} height="10" rx="5" fill={level ? '#10B981' : '#334155'} style={{ transition: 'fill .3s' }} />
        <circle cx={PIVOT.x - ARM} cy={PIVOT.y} r="4" fill="#E2E8F0" />
        <circle cx={PIVOT.x + ARM} cy={PIVOT.y} r="4" fill="#E2E8F0" />
      </g>
      <circle cx={PIVOT.x} cy={PIVOT.y} r="9" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
    </svg>
  );
}

const boxes = (n: number, label: string, reveal = false): PanItem[] => Array.from({ length: n }, (_, i) => ({ key: `x${i}`, kind: 'box', label, w: 24, reveal }));

/* ── Weigh: find the box ───────────────────────────────────────────────── */

function WeighBoard({ p, disabled, resolve, play, accent }: { p: Puzzle; disabled: boolean; resolve: Resolve; play: Sound; accent: string }) {
  const [weights, setWeights] = useState<number[]>([]);
  const [answer, setAnswer] = useState('');
  const [full, setFull] = useState(false);
  const leftW = weightOf(p.left, p.value);
  const deg = tilt(leftW, sumWeights(weights));
  const level = deg === 0;

  const add = (w: number) => {
    if (disabled) return;
    if (weights.length >= MAX_WEIGHTS) { setFull(true); play('wrong'); return; }
    setWeights([...weights, w]);
    setAnswer('');
    play('clunk');
  };
  const remove = (i: number) => {
    if (disabled) return;
    setWeights(weights.filter((_, j) => j !== i));
    setFull(false);
    play('tap');
  };
  const check = () => {
    if (disabled || !answer.trim()) return;
    const ok = Number(answer.trim()) === p.value;
    resolve(ok, ok ? `Yes — one box weighs ${p.value}! ${p.left.x > 1 || p.left.n ? weighExplain(p) : ''}`.trim() : `Not quite. ${weighExplain(p)}`);
  };

  const { x: nBoxes, n: extra } = p.left;
  const ask = nBoxes === 1 && !extra
    ? 'How heavy is the mystery box? Put weights on the right pan until the scale balances.'
    : nBoxes === 1
      ? `The box shares its pan with ${extra}. Balance the scale — then work out the box on its own.`
      : `These ${nBoxes} boxes all weigh the same${extra ? `, and there is ${extra} with them` : ''}. Balance the scale — then work out ONE box.`;

  const leftItems: PanItem[] = [
    ...boxes(nBoxes, disabled ? String(p.value) : '?', disabled),
    ...greedy(extra).map((w, i) => ({ key: `l${i}`, kind: 'weight' as const, label: String(w), w: weightSize(w) })),
  ];
  const rightItems: PanItem[] = weights.map((w, i) => ({ key: `r${i}-${w}`, kind: 'weight' as const, label: String(w), w: weightSize(w), onClick: () => remove(i) }));

  return (
    <div className="mt-4 flex flex-col items-center">
      <p className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-[16px] sm:text-[17px] font-bold text-slate-900 shadow-sm">{ask}</p>
      <ScaleSvg deg={deg} left={leftItems} right={rightItems} level={level} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-[13px] font-bold text-slate-600">Add a weight:</span>
        {WEIGHTS.map((w) => (
          <motion.button key={w} type="button" whileTap={{ scale: 0.88 }} disabled={disabled} onClick={() => add(w)} className="h-12 min-w-[52px] px-3 rounded-xl bg-slate-600 text-white text-[17px] font-extrabold shadow disabled:opacity-40">
            {w}
          </motion.button>
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-slate-500">Tap a weight on the pan to take it off.{full ? ' The pan is full — use bigger weights.' : ''}</p>
      <div className="mt-3 min-h-[60px] flex flex-col items-center">
        {level && weights.length > 0 ? (
          <form onSubmit={(e) => { e.preventDefault(); check(); }} className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[15px] font-extrabold text-emerald-700">⚖️ Balanced! One box weighs</span>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
              inputMode="numeric"
              autoFocus
              disabled={disabled}
              aria-label="What one box weighs"
              className="w-20 h-12 rounded-xl border-2 border-slate-300 text-center text-xl font-extrabold outline-none focus:border-emerald-500"
            />
            <button type="submit" disabled={disabled || !answer} className="inline-flex items-center gap-1.5 h-12 px-5 rounded-xl text-white text-[15px] font-extrabold disabled:opacity-40" style={{ background: accent }}><Check className="w-5 h-5" /> Check</button>
          </form>
        ) : (
          <p className="text-[14px] font-bold text-slate-600">
            {weights.length === 0 ? 'The left pan is down — it needs weights on the right.' : deg < 0 ? '⬅ Left is still heavier — add more.' : 'Right is heavier now ➡ — take some off.'}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Solve: keep it balanced ───────────────────────────────────────────── */

function SolveBoard({ p, disabled, resolve, play, accent }: { p: Puzzle; disabled: boolean; resolve: Resolve; play: Sound; accent: string }) {
  const [state, setState] = useState<{ left: Pan; right: Pan }>({ left: p.left, right: p.right });
  const [history, setHistory] = useState<{ left: Pan; right: Pan }[]>([]);
  const [take, setTake] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const moves = history.length;
  const solved = isSolved(state.left, state.right);

  const go = (m: Move) => {
    if (disabled || solved) return;
    const res = applyMove(state.left, state.right, m);
    if (!res.ok) { setError(res.reason); setShake((s) => s + 1); play('wrong'); return; }
    setHistory([...history, state]);
    setState({ left: res.left, right: res.right });
    setError(null);
    setTake('');
    play('clunk');
    if (isSolved(res.left, res.right)) {
      const used = moves + 1;
      const perfect = used <= p.par;
      setTimeout(() => resolve(true, `x = ${p.value}! ${perfect ? `Perfect — ${used} move${used === 1 ? '' : 's'}, right on par.` : `Solved in ${used} moves (par ${p.par}).`}`, perfect ? 10 : 0), 350);
    }
  };
  const undo = () => {
    if (disabled || solved || !history.length) return;
    setState(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setError(null);
    play('tap');
  };

  const toItems = (pan: Pan, side: string): PanItem[] => [
    ...boxes(pan.x, disabled && solved ? String(p.value) : 'x', disabled && solved),
    ...(pan.n ? [{ key: `${side}n`, kind: 'weight' as const, label: String(pan.n), w: pan.n >= 100 ? 40 : pan.n >= 10 ? 34 : 26 }] : []),
  ];
  const maxBoxes = Math.max(state.left.x, state.right.x);
  const boxChoices = Array.from({ length: Math.min(4, Math.max(1, maxBoxes)) }, (_, i) => i + 1);
  const splitChoices = Array.from({ length: Math.max(1, Math.min(6, maxBoxes) - 1) }, (_, i) => i + 2);

  return (
    <div className="mt-4 flex flex-col items-center">
      <p className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-[15px] sm:text-[16px] font-bold text-slate-900 shadow-sm">
        Each purple box is <span className="text-violet-700">x</span>. Do the same to both pans until one box stands alone.
      </p>
      <ScaleSvg deg={0} left={toItems(state.left, 'l')} right={toItems(state.right, 'r')} level />
      <motion.p key={equationText(state.left, state.right)} initial={{ scale: 1.15, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {equationText(state.left, state.right)}
      </motion.p>
      <p className="text-[12.5px] font-bold text-slate-500 mt-1">Moves {moves} · Par {p.par}</p>

      <motion.div key={shake} animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined} transition={{ duration: 0.3 }} className="mt-3 w-full max-w-[520px] space-y-2">
        <form onSubmit={(e) => { e.preventDefault(); go({ op: 'take', n: Number(take) }); }} className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-2">
          <span className="flex-1 text-[13.5px] font-bold text-slate-700 pl-1">Take weight off both pans</span>
          <input value={take} onChange={(e) => setTake(e.target.value.replace(/[^\d]/g, '').slice(0, 3))} inputMode="numeric" disabled={disabled} aria-label="How much weight to take off both pans" className="w-16 h-10 rounded-lg border-2 border-slate-200 text-center text-lg font-extrabold outline-none focus:border-slate-400" />
          <button type="submit" disabled={disabled || !take} className="h-10 px-4 rounded-lg text-white text-[14px] font-extrabold disabled:opacity-40" style={{ background: accent }}>Take</button>
        </form>
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white border border-slate-200 p-2">
          <span className="flex-1 min-w-[150px] text-[13.5px] font-bold text-slate-700 pl-1">Take boxes off both pans</span>
          {boxChoices.map((k) => (
            <button key={k} type="button" disabled={disabled} onClick={() => go({ op: 'takeX', k })} className="h-10 min-w-[44px] px-2 rounded-lg bg-violet-600 text-white text-[14px] font-extrabold disabled:opacity-40">{k}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white border border-slate-200 p-2">
          <span className="flex-1 min-w-[150px] text-[13.5px] font-bold text-slate-700 pl-1">Split both pans into equal groups, keep one</span>
          {splitChoices.map((k) => (
            <button key={k} type="button" disabled={disabled} onClick={() => go({ op: 'split', k })} className="h-10 min-w-[44px] px-2 rounded-lg bg-amber-500 text-white text-[14px] font-extrabold disabled:opacity-40">÷{k}</button>
          ))}
        </div>
      </motion.div>
      <div className="mt-2 flex items-center gap-3 min-h-[40px]">
        <button type="button" onClick={undo} disabled={disabled || !history.length} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-600 disabled:opacity-40"><Undo2 className="w-4 h-4" /> Undo</button>
        {error && <p className="text-[13.5px] font-bold text-rose-700" role="alert">{error}</p>}
      </div>
    </div>
  );
}

/* ── The game ──────────────────────────────────────────────────────────── */

export default function BalanceScale({ grade, accent }: { grade: number; accent: string }) {
  const make = useCallback((seed: number, level: number) => makePuzzle(seed, grade, level), [grade]);
  const g = useRound({ slug: 'balance', bestKey: `balance-g${grade}`, make, levelEvery: 4 });

  if (g.phase === 'intro') {
    return (
      <GameIntro
        emoji="⚖️"
        title="Balance Scale"
        blurb={grade <= 5
          ? 'A mystery box sits on the scale. Add weights until the beam is level — then work out what the box weighs.'
          : 'Every equation is a balanced scale. Take the same off both pans until one box stands alone — in as few moves as you can.'}
        note={`Beat the clock for more coins · a perfect solve earns a bonus · best ${g.best}`}
        cta="Start weighing"
        onStart={g.start}
        background="linear-gradient(135deg, #E0F2FE, #ECFDF5)"
      />
    );
  }
  if (g.phase === 'over') {
    return (
      <GameOver
        title="Scale packed away"
        score={g.score}
        best={g.best}
        newBest={g.newBest}
        accent={accent}
        saved={g.saved}
        lines={[`${g.done} puzzle${g.done === 1 ? '' : 's'} solved · level ${g.level}`, g.tried ? `${Math.round((g.done / g.tried) * 100)}% right` : ''].filter(Boolean)}
        onAgain={g.start}
      />
    );
  }
  const p = g.challenge;
  if (!p) return null;
  const Board = p.mode === 'weigh' ? WeighBoard : SolveBoard;
  return (
    <div className="relative rounded-3xl border border-sky-200 bg-gradient-to-b from-sky-50 via-white to-emerald-50 p-4 sm:p-6 overflow-hidden">
      <Confetti burst={g.burst} />
      <Hud score={g.score} combo={g.combo} hearts={g.hearts} maxHearts={g.maxHearts} level={g.level} best={g.best} muted={g.muted} onMute={g.toggle} />
      <LevelBanner level={g.levelUp} />
      <div className="mt-3 flex items-center gap-2">
        <ScaleIcon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
        <div className="flex-1"><PatienceBar left={g.left} total={p.patience} /></div>
      </div>
      <Board key={g.challengeId} p={p} disabled={!!g.feedback} resolve={g.resolve} play={g.play} accent={accent} />
      <Feedback feedback={g.feedback} />
    </div>
  );
}

