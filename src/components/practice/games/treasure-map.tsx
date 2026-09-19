'use client';

import { useCallback, useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MapPinned } from 'lucide-react';
import { checkDig, makeClue, pt, same, type Clue, type Point } from '@/lib/practice/games/treasure';
import { Confetti, Feedback, GameIntro, GameOver, Hud, LevelBanner, PatienceBar, useRound } from './game-kit';

/**
 * SARIRO — Treasure Map
 * ============================================================================
 * The parrot reads a clue; tap the spot and dig. Young learners walk squares
 * from the tent; older ones plot coordinates in all four quadrants, then move,
 * mirror, halve and cross lines to find the spot. A wrong dig leaves a hole
 * labelled with where it actually was — and once the dig is over the map
 * shows the working: the walk, the mirror, the line.
 * The rules are lib/practice/games/treasure.ts (pure, tested).
 */

type Sound = (name: 'dig' | 'tap') => void;
type Resolve = (ok: boolean, message: string, bonus?: number) => void;

const CELL = 32;
const PAD = 30;
const MINUS = '−';

function MapBoard({ clue, disabled, resolve, play, accent }: { clue: Clue; disabled: boolean; resolve: Resolve; play: Sound; accent: string }) {
  const [dug, setDug] = useState<Point | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const clip = useId();
  const { min, max, target } = clue;
  const n = max - min;
  const size = n * CELL + PAD * 2;
  const X = (x: number) => PAD + (x - min) * CELL;
  const Y = (y: number) => PAD + (max - y) * CELL;
  const reading = clue.kind === 'read';
  const over = disabled;

  const dig = (p: Point) => {
    if (disabled || dug || reading) return;
    setDug(p);
    play('dig');
    const v = checkDig(clue, p);
    setTimeout(() => resolve(v.ok, v.message), 300);
  };
  const pick = (opt: string) => {
    if (disabled || picked) return;
    setPicked(opt);
    play('tap');
    const ok = opt === pt(target);
    resolve(ok, ok ? `Yes — ${opt}!` : `It is at ${pt(target)}: ${target.x < 0 ? 'left' : 'across'} ${Math.abs(target.x)}, then ${target.y < 0 ? 'down' : 'up'} ${Math.abs(target.y)}.`);
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (reading) return;
    const c = cursor ?? { x: Math.round((min + max) / 2), y: Math.round((min + max) / 2) };
    const move: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: 1 }, ArrowDown: { x: 0, y: -1 } };
    if (move[e.key]) {
      e.preventDefault();
      setCursor({ x: Math.max(min, Math.min(max, c.x + move[e.key].x)), y: Math.max(min, Math.min(max, c.y + move[e.key].y)) });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dig(c);
    }
  };

  const ticks = Array.from({ length: n + 1 }, (_, i) => min + i);
  const axisY = clue.axes ? Y(Math.max(min, Math.min(max, 0))) : null;
  const axisX = clue.axes ? X(Math.max(min, Math.min(max, 0))) : null;
  const label = (v: number) => (v < 0 ? `${MINUS}${-v}` : String(v));

  /* The working, shown once the dig is over. */
  const working = () => {
    if (!over) return null;
    const out: ReactNode[] = [];
    if (clue.legs && clue.landmarks[0]) {
      let at = { x: clue.landmarks[0].x, y: clue.landmarks[0].y };
      const pts = [at];
      for (const leg of clue.legs) { at = { x: at.x + leg.x, y: at.y + leg.y }; pts.push(at); }
      out.push(<polyline key="walk" points={pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke="#DC2626" strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" />);
    }
    for (const [i, l] of (clue.lines ?? []).entries()) {
      const x1 = min;
      const x2 = max;
      out.push(<line key={`line${i}`} x1={X(x1)} y1={Y(l.m * x1 + l.c)} x2={X(x2)} y2={Y(l.m * x2 + l.c)} stroke={i ? '#2563EB' : '#9333EA'} strokeWidth="2.5" opacity="0.8" />);
    }
    if (clue.kind === 'reflect') {
      const s = clue.landmarks[0];
      if (/x-axis/.test(clue.text)) out.push(<line key="m" x1={X(min)} y1={Y(0)} x2={X(max)} y2={Y(0)} stroke="#0EA5E9" strokeWidth="4" opacity="0.6" />);
      else if (/y-axis/.test(clue.text)) out.push(<line key="m" x1={X(0)} y1={Y(min)} x2={X(0)} y2={Y(max)} stroke="#0EA5E9" strokeWidth="4" opacity="0.6" />);
      else out.push(<line key="m" x1={X(min)} y1={Y(min)} x2={X(max)} y2={Y(max)} stroke="#0EA5E9" strokeWidth="4" opacity="0.6" />);
      out.push(<line key="r" x1={X(s.x)} y1={Y(s.y)} x2={X(target.x)} y2={Y(target.y)} stroke="#DC2626" strokeWidth="2.5" strokeDasharray="6 5" />);
    }
    if (clue.kind === 'midpoint') {
      const [a, b] = clue.landmarks;
      out.push(<line key="mid" x1={X(a.x)} y1={Y(a.y)} x2={X(b.x)} y2={Y(b.y)} stroke="#DC2626" strokeWidth="2.5" strokeDasharray="6 5" />);
    }
    if (clue.axes && (clue.kind === 'plot' || clue.kind === 'read') && axisX !== null && axisY !== null) {
      out.push(
        <g key="drop" stroke="#DC2626" strokeWidth="2" strokeDasharray="4 4">
          <line x1={X(target.x)} y1={Y(target.y)} x2={X(target.x)} y2={axisY} />
          <line x1={X(target.x)} y1={Y(target.y)} x2={axisX} y2={Y(target.y)} />
        </g>
      );
    }
    return out;
  };

  return (
    <div className="mt-4 flex flex-col items-center">
      <div className="w-full flex items-start gap-3">
        <span className="text-4xl leading-none" aria-hidden>🦜</span>
        <p className="flex-1 rounded-2xl rounded-tl-sm bg-white border border-amber-200 px-4 py-3 text-[16px] sm:text-[17px] font-bold text-slate-900 shadow-sm">{clue.text}</p>
      </div>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="mt-3 w-full max-w-[460px] h-auto select-none touch-manipulation rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
        role="application"
        aria-label={reading ? 'Treasure map' : 'Treasure map: use the arrow keys to move, Enter to dig'}
        tabIndex={reading ? -1 : 0}
        onKeyDown={onKey}
        onMouseLeave={() => setCursor(null)}
      >
        <rect x="2" y="2" width={size - 4} height={size - 4} rx="18" fill="#FDF3D7" stroke="#D6B98C" strokeWidth="3" />
        {ticks.map((t) => (
          <g key={`g${t}`} stroke="#E8D6AE" strokeWidth="1">
            <line x1={X(t)} y1={Y(min)} x2={X(t)} y2={Y(max)} />
            <line x1={X(min)} y1={Y(t)} x2={X(max)} y2={Y(t)} />
          </g>
        ))}
        {clue.axes && axisX !== null && axisY !== null && (
          <g>
            <line x1={X(min)} y1={axisY} x2={X(max) + 8} y2={axisY} stroke="#78350F" strokeWidth="2" />
            <line x1={axisX} y1={Y(min)} x2={axisX} y2={Y(max) - 8} stroke="#78350F" strokeWidth="2" />
            <text x={X(max) + 12} y={axisY + 4} fontSize="12" fontWeight="800" fill="#78350F">x</text>
            <text x={axisX - 4} y={Y(max) - 12} fontSize="12" fontWeight="800" fill="#78350F">y</text>
            {ticks.map((t) => (
              <g key={`l${t}`} fontSize="10" fontWeight="700" fill="#92400E">
                {t !== 0 && <text x={X(t)} y={axisY + 14} textAnchor="middle">{label(t)}</text>}
                {t !== 0 && <text x={axisX - 6} y={Y(t) + 3.5} textAnchor="end">{label(t)}</text>}
              </g>
            ))}
            <text x={axisX - 6} y={axisY + 14} textAnchor="end" fontSize="10" fontWeight="700" fill="#92400E">0</text>
          </g>
        )}
        {!clue.axes && <text x={size - PAD / 2} y={PAD - 10} textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350F">N ▲</text>}

        <defs><clipPath id={clip}><rect x={X(min)} y={Y(max)} width={n * CELL} height={n * CELL} /></clipPath></defs>
        <g clipPath={`url(#${clip})`}>{working()}</g>

        {clue.decor.map((d) => (
          <text key={`d${d.x},${d.y}`} x={X(d.x)} y={Y(d.y)} fontSize="17" textAnchor="middle" dominantBaseline="central" opacity="0.75" aria-hidden>{d.emoji}</text>
        ))}
        {clue.landmarks.map((l, i) => (
          <text key={`m${i}`} x={X(l.x)} y={Y(l.y)} fontSize="22" textAnchor="middle" dominantBaseline="central">{l.emoji}</text>
        ))}
        {clue.showMark && <text x={X(target.x)} y={Y(target.y)} fontSize="22" fontWeight="900" fill="#DC2626" textAnchor="middle" dominantBaseline="central">✖</text>}

        {!reading && !over && ticks.map((x) => ticks.map((y) => (
          <circle
            key={`h${x},${y}`}
            cx={X(x)}
            cy={Y(y)}
            r={CELL * 0.45}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => dig({ x, y })}
            onMouseEnter={() => setCursor({ x, y })}
          />
        )))}
        {cursor && !over && !reading && <circle cx={X(cursor.x)} cy={Y(cursor.y)} r="8" fill="#F59E0B" opacity="0.8" pointerEvents="none" />}

        {dug && !same(dug, target) && (
          <g pointerEvents="none">
            <text x={X(dug.x)} y={Y(dug.y)} fontSize="20" textAnchor="middle" dominantBaseline="central">🕳️</text>
            {clue.axes && <text x={X(dug.x)} y={Y(dug.y) + 20} fontSize="10.5" fontWeight="800" fill="#B91C1C" textAnchor="middle">{pt(dug)}</text>}
          </g>
        )}
        {over && (
          <motion.text initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} x={X(target.x)} y={Y(target.y)} fontSize="26" textAnchor="middle" dominantBaseline="central" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            💰
          </motion.text>
        )}
      </svg>

      {reading && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {clue.options!.map((opt) => {
            const right = over && opt === pt(target);
            const wrongPick = over && opt === picked && !right;
            return (
              <motion.button
                key={opt}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => pick(opt)}
                disabled={disabled}
                className={`min-w-[96px] h-12 px-4 rounded-2xl border-2 text-[18px] font-extrabold tabular-nums ${right ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : wrongPick ? 'border-rose-400 bg-rose-50 text-rose-700' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400'}`}
                style={!over && picked === opt ? { borderColor: accent } : undefined}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>
      )}
      {!reading && !over && <p className="mt-2 text-[12.5px] text-slate-500">Tap a crossing point to dig{clue.axes ? ' — across first, then up or down' : ''}.</p>}
    </div>
  );
}

export default function TreasureMap({ grade, accent }: { grade: number; accent: string }) {
  const make = useCallback((seed: number, level: number) => makeClue(seed, grade, level), [grade]);
  const g = useRound({ slug: 'treasure-map', bestKey: `treasure-g${grade}`, make, levelEvery: 5 });

  if (g.phase === 'intro') {
    return (
      <GameIntro
        emoji="🏴‍☠️"
        title="Treasure Map"
        blurb={grade <= 4
          ? 'The parrot knows where the treasure is. Follow the steps from the tent and dig in the right spot!'
          : 'The parrot squawks a clue. Plot it, move it, mirror it — then dig. Wrong spots leave holes, and holes cost hearts.'}
        note={`Dig fast for more coins · best ${g.best}`}
        cta="Set sail"
        onStart={g.start}
        background="linear-gradient(135deg, #FEF3C7, #BAE6FD)"
      />
    );
  }
  if (g.phase === 'over') {
    return (
      <GameOver
        title="Back to the ship"
        score={g.score}
        best={g.best}
        newBest={g.newBest}
        accent={accent}
        saved={g.saved}
        lines={[`${g.done} treasure${g.done === 1 ? '' : 's'} found · level ${g.level}`, g.tried ? `${Math.round((g.done / g.tried) * 100)}% of digs struck gold` : ''].filter(Boolean)}
        onAgain={g.start}
      />
    );
  }
  const c = g.challenge;
  if (!c) return null;
  return (
    <div className="relative rounded-3xl border border-amber-200 bg-gradient-to-b from-sky-100 via-amber-50 to-amber-100 p-4 sm:p-6 overflow-hidden">
      <Confetti burst={g.burst} />
      <Hud score={g.score} combo={g.combo} hearts={g.hearts} maxHearts={g.maxHearts} level={g.level} best={g.best} muted={g.muted} onMute={g.toggle} />
      <LevelBanner level={g.levelUp} />
      <div className="mt-3 flex items-center gap-2">
        <MapPinned className="w-4 h-4 text-amber-700 shrink-0" aria-hidden />
        <div className="flex-1"><PatienceBar left={g.left} total={c.patience} /></div>
      </div>
      <MapBoard key={g.challengeId} clue={c} disabled={!!g.feedback} resolve={g.resolve} play={g.play} accent={accent} />
      <Feedback feedback={g.feedback} />
    </div>
  );
}
