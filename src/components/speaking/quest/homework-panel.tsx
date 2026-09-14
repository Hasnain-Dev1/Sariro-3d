'use client';

import { useMemo, useState } from 'react';
import {
  Mic, Ear, PenLine, AudioLines, Star, Check, X, ChevronDown, Play, RotateCcw, Trophy, Target, Repeat, Zap,
} from 'lucide-react';
import SpeakingLab from '@/components/speaking/speaking-lab';
import ListeningLab from '@/components/speaking/listening-lab';
import WritingLab from '@/components/speaking/writing-lab';
import SoundLab from '@/components/speaking/sound-lab';
import type { PracticeAttempt } from '@/lib/speaking/progress';
import {
  levelStatus, attemptPasses, type Mission, type MissionKind, type MissionStatus, type Stars,
} from '@/lib/speaking/quest/homework';
import { XP } from '@/lib/speaking/quest/engine';

/**
 * SARIRO — homework, with the record on it
 * ============================================================================
 * Each mission says up front how many tries it takes, what score passes, and
 * what it is worth — and underneath keeps every try: when, what it scored,
 * whether that one would have passed. The same rows a teacher opens before the
 * next class (practice_attempts), so "I did my homework" is something both of
 * them can see rather than something one of them says.
 */

export const KIND_META: Record<MissionKind, { label: string; icon: typeof Mic; color: string; bg: string }> = {
  speak: { label: 'Speak', icon: Mic, color: '#2563EB', bg: '#EFF6FF' },
  listen: { label: 'Listen', icon: Ear, color: '#0891B2', bg: '#ECFEFF' },
  write: { label: 'Write', icon: PenLine, color: '#7C3AED', bg: '#F5F3FF' },
  sound: { label: 'Sounds', icon: AudioLines, color: '#DB2777', bg: '#FDF2F8' },
};

export function StarRow({ stars, size = 16 }: { stars: Stars | number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${stars} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
      ))}
    </span>
  );
}

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function MissionCard({
  status,
  onLogged,
  readOnly = false,
  highlight = false,
}: {
  status: MissionStatus;
  onLogged?: () => void;
  /** A teacher or parent reading the record: no labs. */
  readOnly?: boolean;
  highlight?: boolean;
}) {
  const { mission, tries, triesLeft, best, passed, stars, records } = status;
  const [open, setOpen] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const meta = KIND_META[mission.kind];
  const Icon = meta.icon;

  return (
    <div
      className={`rounded-2xl border bg-white transition-shadow ${passed ? 'border-emerald-300' : highlight ? 'border-amber-300 shadow-[0_18px_40px_-28px_rgba(217,119,6,0.6)]' : 'border-slate-200'}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg, color: meta.color }}>
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: meta.color, fontFamily: 'var(--font-grotesk)' }}>{meta.label}</p>
                <p className="text-[15.5px] font-extrabold text-slate-900 leading-snug" style={{ fontFamily: 'var(--font-jakarta)' }}>{mission.title}</p>
              </div>
              <div className="shrink-0 text-right">
                {passed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11.5px] font-bold"><Check className="w-3.5 h-3.5" /> Passed</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[11.5px] font-bold"><Zap className="w-3.5 h-3.5" /> +{mission.xp} XP</span>
                )}
                <div className="mt-1"><StarRow stars={stars} size={14} /></div>
              </div>
            </div>
            <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">{mission.brief}</p>

            {/* The rules, before they start */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                <Repeat className="w-3.5 h-3.5 text-slate-400" /> Tries {Math.min(tries, mission.attempts)}/{mission.attempts}
                <span className="flex gap-0.5 ml-0.5">
                  {Array.from({ length: mission.attempts }, (_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < tries ? 'bg-slate-700' : 'bg-slate-300'}`} />
                  ))}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                <Target className="w-3.5 h-3.5 text-slate-400" /> Pass: {mission.pass}+
              </span>
              {mission.goal && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">and {mission.goal.label}</span>
              )}
              {best !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-bold" style={{ background: meta.bg, color: meta.color }}>
                  <Trophy className="w-3.5 h-3.5" /> Best {best}
                </span>
              )}
            </div>

            {!passed && tries >= mission.attempts && (
              <p className="mt-2 text-[12.5px] text-amber-800">All tries done, not passed yet — keep going: the best passing try counts.</p>
            )}
            {!passed && triesLeft > 0 && tries > 0 && (
              <p className="mt-2 text-[12.5px] text-slate-500">{triesLeft} more {triesLeft === 1 ? 'try' : 'tries'} to go.</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-white text-[13px] font-bold"
                  style={{ background: open ? '#0F172A' : meta.color, fontFamily: 'var(--font-grotesk)' }}
                >
                  {open ? <><X className="w-3.5 h-3.5" /> Close</> : tries > 0 ? <><RotateCcw className="w-3.5 h-3.5" /> {passed ? 'Beat your best' : 'Try again'}</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                </button>
              )}
              {records.length > 0 && (
                <button type="button" onClick={() => setShowRecord((s) => !s)} className="inline-flex items-center gap-1 h-9 px-3 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-bold">
                  Record ({records.length}) <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRecord ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {showRecord && records.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-[12.5px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left font-bold px-3 py-2">Try</th>
                  <th className="text-left font-bold px-3 py-2">When</th>
                  <th className="text-right font-bold px-3 py-2">Score</th>
                  <th className="text-right font-bold px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const ok = attemptPasses(mission, r);
                  return (
                    <tr key={r.id ?? `${r.createdAt}-${i}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold text-slate-700">#{records.length - i}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{when(r.createdAt)}</td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-900">{r.score}</td>
                      <td className="px-3 py-2 text-right">
                        {ok ? <span className="text-emerald-700 font-bold">Pass</span> : <span className="text-slate-400 font-semibold">{r.score >= mission.pass && mission.goal ? `Missed: ${mission.goal.label}` : 'Below pass'}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && !readOnly && (
        <div className="border-t border-slate-100 bg-[#FBFAF8] p-4 sm:p-5">
          {mission.kind === 'speak' && mission.drill && <SpeakingLab key={mission.id} drill={mission.drill} onLogged={onLogged} />}
          {mission.kind === 'listen' && <ListeningLab key={mission.id} passage={mission.passage} drillId={mission.id} onLogged={onLogged} />}
          {mission.kind === 'write' && <WritingLab key={mission.id} prompt={mission.prompt} drillId={mission.id} minWords={mission.goal?.min ?? 40} onLogged={onLogged} />}
          {mission.kind === 'sound' && mission.pattern && (
            <SoundLab key={mission.id} patternIds={[mission.pattern]} initialMode="sort" logAs={() => mission.id} onLogged={onLogged} practise={false} />
          )}
        </div>
      )}
    </div>
  );
}

export default function HomeworkPanel({
  missions,
  attempts,
  onLogged,
  readOnly = false,
  title = 'Homework',
  subtitle = 'Before your next class',
}: {
  missions: readonly Mission[];
  attempts: readonly PracticeAttempt[] | null;
  onLogged?: () => void;
  readOnly?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const status = useMemo(() => levelStatus(missions, attempts ?? []), [missions, attempts]);
  const starsEarned = status.missions.reduce((n, m) => n + m.stars, 0);
  const xpEarned = status.missions.reduce((n, m) => n + (m.passed ? m.mission.xp + m.stars * XP.starBonus : 0), 0);
  const xpAvailable = missions.reduce((n, m) => n + m.xp + 3 * XP.starBonus, 0) + XP.levelCleared;
  const pct = status.total ? status.passed / status.total : 0;
  const nextUp = status.missions.find((m) => !m.passed);

  return (
    <section className="rounded-[1.4rem] border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4 flex items-center gap-4 border-b border-slate-100">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={status.cleared ? '#10B981' : '#F59E0B'} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${pct * 97.4} 97.4`} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-slate-900 tabular-nums">{status.passed}/{status.total}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>{subtitle}</p>
          <h3 className="text-[1.2rem] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{title}</h3>
          <p className="text-[12.5px] text-slate-500">
            {status.cleared ? 'Every mission passed.' : `${status.total - status.passed} mission${status.total - status.passed === 1 ? '' : 's'} to go`} · <StarRow stars={Math.round(starsEarned / Math.max(1, status.total))} size={12} /> {starsEarned}/{status.total * 3} stars · {xpEarned}/{xpAvailable} XP
          </p>
        </div>
      </div>

      {status.cleared && (
        <div className="mx-5 sm:mx-6 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 shrink-0" />
          <p className="text-[14px] font-bold">Level cleared! +{XP.levelCleared} XP. Go for three stars on every mission — or on to the next level.</p>
        </div>
      )}

      {attempts === null ? (
        <div className="p-6 text-[13px] text-slate-400">Loading your record…</div>
      ) : (
        <div className="p-4 sm:p-5 space-y-3">
          {status.missions.map((m) => (
            <MissionCard key={m.mission.id} status={m} onLogged={onLogged} readOnly={readOnly} highlight={!readOnly && m === nextUp} />
          ))}
        </div>
      )}
    </section>
  );
}
