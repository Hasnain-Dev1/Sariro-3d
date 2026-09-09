'use client';

import { useMemo } from 'react';
import { AudioLines, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { analyseModulation } from '@/lib/speaking/modulation';

/**
 * SARIRO — the shape of a delivery
 * ============================================================================
 * "Your voice modulation needs work" is a sentence a child can do nothing
 * with. This is the same note as a picture: the energy of the whole recording
 * drawn end to end, so the fade at the end is visible rather than described.
 *
 * ── Why the arc is the headline and the numbers are underneath ──────────────
 * Almost every child starts strong and trails off, and none of them can hear
 * it while it is happening. A falling line does the whole job in one glance —
 * nobody needs "energy drift −38%" explained to them once they have seen the
 * slope.
 *
 * ── Semitones, shown as a word ──────────────────────────────────────────────
 * The number is there for a teacher. "Flat / steady / lively" is there for a
 * ten-year-old, and it is the same measurement.
 */

export default function ModulationPanel({
  levels,
  pitches,
  frameMs,
}: {
  levels: number[];
  pitches: (number | null)[];
  frameMs: number;
}) {
  const report = useMemo(
    () => analyseModulation({ levels, pitches, frameMs }),
    [levels, pitches, frameMs]
  );

  if (!report.scored) return null;

  const W = 300;
  const H = 56;
  const pad = 2;
  const arc = report.arc;
  const step = arc.length > 1 ? (W - pad * 2) / (arc.length - 1) : 0;

  /* An area rather than a line: a filled shape reads as "how much voice was
     here", which is what energy actually is. */
  const points = arc.map((v, i) => `${(pad + i * step).toFixed(1)},${(H - pad - v * (H - pad * 2)).toFixed(1)}`);
  const area = `${pad},${H - pad} ${points.join(' ')} ${(pad + (arc.length - 1) * step).toFixed(1)},${H - pad}`;

  const bandColour =
    report.band === 'lively' ? 'text-green-700 bg-green-50 border-green-200'
    : report.band === 'steady' ? 'text-blue-700 bg-blue-50 border-blue-200'
    : 'text-amber-800 bg-amber-50 border-amber-200';

  const faded = report.energyDrift <= -25;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3
          className="text-sm font-extrabold text-slate-900 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <AudioLines className="w-4 h-4 text-indigo-600" />
          How your voice moved
        </h3>
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${bandColour}`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {report.band}
        </span>
      </div>

      {/* The whole recording, end to end. The fade is meant to be seen, not
          read about. */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-14 mt-3"
        role="img"
        aria-label={`Your energy across the recording, ${faded ? 'falling towards the end' : 'fairly even'}`}
      >
        <defs>
          <linearGradient id="mod-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#mod-fill)" />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="#4f46e5"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <span>start</span>
        <span>end</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: 'Range', value: `${report.rangeSemitones}`, unit: 'semitones' },
          {
            label: 'Energy',
            value: `${report.energyDrift > 0 ? '+' : ''}${report.energyDrift}%`,
            unit: faded ? 'faded' : report.energyDrift >= 15 ? 'grew' : 'even',
          },
          { label: 'Emphasis', value: `${report.emphasisPerMin}`, unit: 'a minute' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {s.label}
            </p>
            <p className="text-lg font-extrabold text-slate-900 tabular-nums leading-none mt-0.5 flex items-center gap-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {s.label === 'Energy' && (faded
                ? <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                : report.energyDrift >= 15 ? <TrendingUp className="w-3.5 h-3.5 text-green-600" /> : null)}
              {s.value}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.unit}</p>
          </div>
        ))}
      </div>

      {report.notes.map((n, i) => (
        <p
          key={i}
          className={`mt-2 text-xs leading-relaxed rounded-xl border px-3 py-2 flex items-start gap-1.5 ${
            n.kind === 'good'
              ? 'bg-green-50 border-green-200 text-green-900'
              : n.kind === 'fix'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {n.kind === 'fix' && <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
          <span>{n.text}</span>
        </p>
      ))}

      <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
        Measured from your own microphone, on your own device. Range is in semitones, so a deep
        voice and a high one are judged on how much they move — not on how they sound.
      </p>
    </div>
  );
}
