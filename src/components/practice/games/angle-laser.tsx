'use client';

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, RotateCcw, RotateCw, Zap } from 'lucide-react';
import {
  angleFromPointer, bearingText, checkShot, clampToScale, fromBearing, makeShot, norm, toBearing, type Shot,
} from '@/lib/practice/games/laser';
import { Confetti, Feedback, GameIntro, GameOver, Hud, LevelBanner, PatienceBar, useRound } from './game-kit';

/**
 * SARIRO — Angle Laser
 * ============================================================================
 * A laser on a turntable in the middle of a protractor. Drag it round (or nudge
 * it) and fire: make an obtuse angle, turn to 130°, estimate 70° with no scale,
 * make the missing angle on a line, fire on a bearing, turn to 2π/3. After the
 * shot the target shows where it was, so a miss is a measured miss.
 * The rules are lib/practice/games/laser.ts (pure, tested).
 */

type Sound = (name: 'zap' | 'tap' | 'wrong') => void;
type Resolve = (ok: boolean, message: string, bonus?: number) => void;

const W = 320;
const R = 128;

const at = (c: { x: number; y: number }, deg: number, r: number) => ({
  x: c.x + r * Math.cos((deg * Math.PI) / 180),
  y: c.y - r * Math.sin((deg * Math.PI) / 180),
});

/** An arc (as a filled wedge) from `from` anticlockwise to `to`, degrees. */
function wedge(c: { x: number; y: number }, from: number, to: number, r: number) {
  const sweep = norm(to - from);
  if (sweep === 0) return '';
  const a = at(c, from, r);
  const b = at(c, to, r);
  return `M${c.x} ${c.y} L${a.x} ${a.y} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${b.x} ${b.y} Z`;
}

function dialParts({ shot, aim, fired, verdict }: { shot: Shot; aim: number; fired: boolean; verdict: { ok: boolean } | null }) {
  const half = shot.scale === 'half';
  const H = half ? 196 : W;
  const C = { x: W / 2, y: half ? 172 : W / 2 };
  const compass = shot.scale === 'compass';
  const ticks: number[] = shot.scale === 'none' ? [] : Array.from({ length: half ? 37 : 72 }, (_, i) => i * 5);
  const targetStd = shot.kind === 'bearing' ? fromBearing(shot.target) : shot.target;
  const tip = at(C, aim, R - 6);
  const beamEnd = at(C, aim, R + 30);

  return { H, C, svg: (
    <>
      {/* The dial */}
      {half
        ? <path d={`M${C.x - R} ${C.y} A${R} ${R} 0 0 1 ${C.x + R} ${C.y} Z`} fill="#EFF6FF" stroke="#93C5FD" strokeWidth="2" />
        : <circle cx={C.x} cy={C.y} r={R} fill={shot.scale === 'none' ? '#F8FAFC' : '#EFF6FF'} stroke={shot.scale === 'none' ? '#E2E8F0' : '#93C5FD'} strokeWidth="2" />}
      {ticks.map((t) => {
        const long = t % 10 === 0;
        const a = at(C, t, R);
        const b = at(C, t, R - (t % 30 === 0 ? 12 : long ? 8 : 4));
        return <line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3B82F6" strokeWidth={long ? 1.3 : 0.8} />;
      })}
      {/* Numbers: a half protractor carries both scales, like the real thing. */}
      {half && ticks.filter((t) => t % 10 === 0).map((t) => {
        const o = at(C, t, R - 20);
        const i = at(C, t, R - 34);
        return (
          <g key={`n${t}`} textAnchor="middle" dominantBaseline="central">
            <text x={o.x} y={o.y} fontSize="8.5" fontWeight="800" fill="#1E3A8A">{t}</text>
            <text x={i.x} y={i.y} fontSize="7.5" fontWeight="700" fill="#DC2626" opacity="0.75">{180 - t}</text>
          </g>
        );
      })}
      {shot.scale === 'full' && ticks.filter((t) => t % 30 === 0).map((t) => {
        const o = at(C, t, R - 22);
        return <text key={`n${t}`} x={o.x} y={o.y} textAnchor="middle" dominantBaseline="central" fontSize="9.5" fontWeight="800" fill="#1E3A8A">{t}°</text>;
      })}
      {compass && [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((b) => {
        const o = at(C, fromBearing(b), R - 22);
        const cardinal = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }[b as 0 | 90 | 180 | 270];
        return <text key={`b${b}`} x={o.x} y={o.y} textAnchor="middle" dominantBaseline="central" fontSize={cardinal ? 14 : 9} fontWeight="800" fill={cardinal === 'N' ? '#DC2626' : '#1E3A8A'}>{cardinal ?? String(b).padStart(3, '0')}</text>;
      })}

      {/* The angle being made: from the fixed arm (or from North) to the laser. */}
      {shot.kind !== 'measure' && (compass
        ? <path d={wedge(C, aim, 90, 40)} fill="#FDE68A" opacity="0.7" />
        : <path d={wedge(C, 0, aim, 40)} fill="#FDE68A" opacity="0.7" />)}
      {compass
        ? <line x1={C.x} y1={C.y} x2={C.x} y2={C.y - R} stroke="#DC2626" strokeWidth="2" strokeDasharray="5 4" />
        : <line x1={C.x} y1={C.y} x2={C.x + R} y2={C.y} stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />}

      {/* After the shot: where the target was. */}
      {fired && shot.range && <path d={wedge(C, shot.range[0], shot.range[1], R)} fill="#10B981" opacity="0.18" />}
      {fired && !shot.range && shot.kind !== 'measure' && (() => {
        const p = at(C, targetStd, R + 14);
        return (
          <g>
            {!verdict?.ok && <line x1={C.x} y1={C.y} x2={p.x} y2={p.y} stroke="#10B981" strokeWidth="2" strokeDasharray="5 4" />}
            <text x={p.x} y={p.y} fontSize="20" textAnchor="middle" dominantBaseline="central">{verdict?.ok ? '💥' : '👾'}</text>
          </g>
        );
      })()}
      {fired && <line x1={C.x} y1={C.y} x2={beamEnd.x} y2={beamEnd.y} stroke="#F43F5E" strokeWidth="5" strokeLinecap="round" opacity="0.9" style={{ filter: 'drop-shadow(0 0 6px #FB7185)' }} />}

      {/* The laser */}
      <line x1={C.x} y1={C.y} x2={tip.x} y2={tip.y} stroke="#BE123C" strokeWidth="6" strokeLinecap="round" />
      <circle cx={tip.x} cy={tip.y} r="6" fill="#F43F5E" stroke="#881337" strokeWidth="2" />
      <circle cx={C.x} cy={C.y} r="13" fill="#1E293B" stroke="#F43F5E" strokeWidth="3" />
    </>
  ) };
}

function LaserBoard({ shot, disabled, resolve, play, accent }: { shot: Shot; disabled: boolean; resolve: Resolve; play: Sound; accent: string }) {
  const [aim, setAim] = useState(shot.start);
  const [fired, setFired] = useState(false);
  const [verdict, setVerdict] = useState<{ ok: boolean } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const locked = shot.kind === 'measure';
  const { H, C, svg } = dialParts({ shot, aim, fired, verdict });

  const turn = (by: number) => {
    if (disabled || fired || locked) return;
    setAim((a) => clampToScale(norm(a + by), shot.scale));
    play('tap');
  };
  const aimAt = (e: PointerEvent<SVGSVGElement>) => {
    const el = svgRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const sx = ((e.clientX - box.left) / box.width) * W;
    const sy = ((e.clientY - box.top) / box.height) * H;
    setAim(clampToScale(angleFromPointer(sx - C.x, sy - C.y), shot.scale));
  };
  const fire = () => {
    if (disabled || fired || locked) return;
    setFired(true);
    play('zap');
    const v = checkShot(shot, aim);
    setVerdict(v);
    setTimeout(() => resolve(v.ok, v.message, v.bullseye ? 5 : 0), 450);
  };
  const pick = (opt: string) => {
    if (disabled || picked) return;
    setPicked(opt);
    setFired(true);
    const ok = opt === shot.correctOption;
    setVerdict({ ok });
    resolve(ok, ok ? `Yes — ${opt}. You read the scale that starts at 0 on the laser's arm.` : `It is ${shot.correctOption}. Start from the 0 on the arm the angle begins at — the blue numbers here.`);
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); turn(step); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); turn(-step); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
  };

  const shown = shot.scale === 'compass' ? bearingText(toBearing(aim)) : `${aim}°`;

  return (
    <div className="mt-4 flex flex-col items-center">
      <p className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-[16px] sm:text-[17px] font-bold text-slate-900 shadow-sm">{shot.text}</p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full max-w-[460px] h-auto select-none touch-none rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-rose-300"
        role="slider"
        aria-label="Laser angle"
        aria-valuemin={0}
        aria-valuemax={shot.scale === 'half' ? 180 : 359}
        aria-valuenow={aim}
        aria-valuetext={shot.readout ? shown : 'hidden — read the dial'}
        tabIndex={locked ? -1 : 0}
        onKeyDown={onKey}
        onPointerDown={(e) => { if (disabled || fired || locked) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); aimAt(e); }}
        onPointerMove={(e) => { if (dragging.current) aimAt(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        style={{ cursor: locked ? 'default' : 'grab' }}
      >
        {svg}
      </svg>

      {shot.readout && !locked && (
        <motion.p key={aim} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="text-3xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>{shown}</motion.p>
      )}

      {locked ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {shot.options!.map((opt) => {
            const right = fired && opt === shot.correctOption;
            const wrongPick = fired && opt === picked && !right;
            return (
              <motion.button key={opt} type="button" whileTap={{ scale: 0.92 }} disabled={disabled} onClick={() => pick(opt)} className={`min-w-[84px] h-12 px-4 rounded-2xl border-2 text-[18px] font-extrabold tabular-nums ${right ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : wrongPick ? 'border-rose-400 bg-rose-50 text-rose-700' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400'}`}>
                {opt}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-center gap-1.5" aria-label="Turn the laser">
            <button type="button" onClick={() => turn(10)} disabled={disabled || fired} className="h-11 px-3 rounded-xl bg-white border-2 border-slate-200 text-[13px] font-extrabold text-slate-700 inline-flex items-center gap-1 disabled:opacity-40"><RotateCcw className="w-4 h-4" /> 10°</button>
            <button type="button" onClick={() => turn(1)} disabled={disabled || fired} className="h-11 px-3 rounded-xl bg-white border-2 border-slate-200 text-[13px] font-extrabold text-slate-700 inline-flex items-center gap-1 disabled:opacity-40"><RotateCcw className="w-3.5 h-3.5" /> 1°</button>
            <button type="button" onClick={() => turn(-1)} disabled={disabled || fired} className="h-11 px-3 rounded-xl bg-white border-2 border-slate-200 text-[13px] font-extrabold text-slate-700 inline-flex items-center gap-1 disabled:opacity-40">1° <RotateCw className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => turn(-10)} disabled={disabled || fired} className="h-11 px-3 rounded-xl bg-white border-2 border-slate-200 text-[13px] font-extrabold text-slate-700 inline-flex items-center gap-1 disabled:opacity-40">10° <RotateCw className="w-4 h-4" /></button>
          </div>
          <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={fire} disabled={disabled || fired} className="mt-3 inline-flex items-center gap-2 h-14 px-10 rounded-2xl text-white text-[18px] font-extrabold shadow-lg disabled:opacity-50" style={{ background: accent }}>
            <Zap className="w-5 h-5" /> Fire!
          </motion.button>
          {!fired && <p className="mt-2 text-[12.5px] text-slate-500">Drag the laser round, or nudge it. Arrow keys work too; Enter fires.</p>}
        </>
      )}
    </div>
  );
}

export default function AngleLaser({ grade, accent }: { grade: number; accent: string }) {
  const make = useCallback((seed: number, level: number) => makeShot(seed, grade, level), [grade]);
  const g = useRound({ slug: 'angle-laser', bestKey: `angle-laser-g${grade}`, make, levelEvery: 5 });

  if (g.phase === 'intro') {
    return (
      <GameIntro
        emoji="🔦"
        title="Angle Laser"
        blurb={grade >= 11
          ? 'Radians and bearings, on a turntable. Turn the laser to the angle and fire — close only counts if it is really close.'
          : 'Turn the laser to the angle the mission asks for and fire. Read the protractor, guess without one, or work out the missing angle first.'}
        note={`Bullseyes earn a bonus · best ${g.best}`}
        cta="Power up"
        onStart={g.start}
        background="radial-gradient(circle at 30% 20%, #1E3A8A, #0F172A 75%)"
        dark
      />
    );
  }
  if (g.phase === 'over') {
    return (
      <GameOver
        title="Laser cooling down"
        score={g.score}
        best={g.best}
        newBest={g.newBest}
        accent={accent}
        saved={g.saved}
        lines={[`${g.done} target${g.done === 1 ? '' : 's'} hit · level ${g.level}`, g.tried ? `${Math.round((g.done / g.tried) * 100)}% of shots on target` : ''].filter(Boolean)}
        onAgain={g.start}
      />
    );
  }
  const s = g.challenge;
  if (!s) return null;
  return (
    <div className="relative rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-rose-50 p-4 sm:p-6 overflow-hidden">
      <Confetti burst={g.burst} />
      <Hud score={g.score} combo={g.combo} hearts={g.hearts} maxHearts={g.maxHearts} level={g.level} best={g.best} muted={g.muted} onMute={g.toggle} />
      <LevelBanner level={g.levelUp} />
      <div className="mt-3 flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-rose-500 shrink-0" aria-hidden />
        <div className="flex-1"><PatienceBar left={g.left} total={s.patience} /></div>
      </div>
      <LaserBoard key={g.challengeId} shot={s} disabled={!!g.feedback} resolve={g.resolve} play={g.play} accent={accent} />
      <Feedback feedback={g.feedback} />
    </div>
  );
}
