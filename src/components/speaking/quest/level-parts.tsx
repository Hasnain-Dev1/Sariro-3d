'use client';

import { useState } from 'react';
import { Flame, Gamepad2, Globe2, Volume2, Mic, X } from 'lucide-react';
import SpeakingLab from '@/components/speaking/speaking-lab';
import type { SpeakingLesson } from '@/lib/speaking/lesson';
import { ARENA, type ArenaGame } from '@/lib/speaking/quest/arena';
import { twisterFor, worldOf } from '@/lib/speaking/quest/worlds';
import { StarRow } from './homework-panel';
import type { Stars } from '@/lib/speaking/quest/homework';

/**
 * The parts every level has on top of the lesson itself: where it sits on the
 * map, a tongue twister to start, and the game the class plays.
 */

export function LevelBadge({ lesson, stars, cleared }: { lesson: SpeakingLesson; stars?: Stars; cleared?: boolean }) {
  const world = worldOf(lesson.moduleNum);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold text-white" style={{ background: world.color, fontFamily: 'var(--font-grotesk)' }}>
        <span aria-hidden>{world.emoji}</span> World {world.num} · {world.name}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[11.5px] font-bold text-white" style={{ fontFamily: 'var(--font-grotesk)' }}>
        Level {lesson.number}
      </span>
      {stars !== undefined && <StarRow stars={stars} size={15} />}
      {cleared && <span className="text-[11.5px] font-bold text-emerald-700">Cleared</span>}
    </div>
  );
}

export function WarmUp({ lesson }: { lesson: SpeakingLesson }) {
  const t = twisterFor(lesson.number);
  const [open, setOpen] = useState(false);
  const hear = () => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t.text);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch { /* no voice on this device */ }
  };
  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <Flame className="w-3.5 h-3.5" /> Warm-up · {t.focus}
      </p>
      <p className="mt-2 text-[1.2rem] sm:text-[1.35rem] font-extrabold text-slate-900 leading-snug" style={{ fontFamily: 'var(--font-jakarta)' }}>“{t.text}”</p>
      <p className="mt-1 text-[13px] text-orange-900/80">Say it three times — slow, faster, fastest — then record it once, clean. The lab counts the words it heard right.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={hear} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-orange-200 text-[13px] font-bold text-orange-800">
          <Volume2 className="w-3.5 h-3.5" /> Hear it
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-orange-600 text-white text-[13px] font-bold">
          {open ? <><X className="w-3.5 h-3.5" /> Close</> : <><Mic className="w-3.5 h-3.5" /> Record the twister</>}
        </button>
      </div>
      {open && (
        <div className="mt-4">
          <SpeakingLab drill={{ id: `warmup:${lesson.key}`, title: 'Tongue twister', brief: t.focus, passage: t.text, targetSeconds: 8 }} />
        </div>
      )}
    </div>
  );
}

/** The class game. A stage can bring its own game and its own real-life moment (lib/speaking/stages.ts). */
export function ArenaCard({ lesson, game: override, realWorld }: { lesson: SpeakingLesson; game?: ArenaGame; realWorld?: string }) {
  const game = override ?? ARENA[lesson.number];
  if (!game) return null;
  const world = worldOf(lesson.moduleNum);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 sm:px-5 py-4 text-white" style={{ background: `linear-gradient(120deg, ${world.color}, #0F172A)` }}>
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <Gamepad2 className="w-3.5 h-3.5" /> The class game
        </p>
        <p className="mt-1 text-[1.3rem] font-extrabold leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
          <span aria-hidden className="mr-1.5">{game.emoji}</span>{game.name}
        </p>
      </div>
      <ol className="px-4 sm:px-5 py-4 space-y-2.5">
        {game.how.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-6 h-6 rounded-full text-[11px] font-black text-white flex items-center justify-center shrink-0" style={{ background: world.color }}>{i + 1}</span>
            <p className="text-[14px] text-slate-700 leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
      <div className="mx-4 sm:mx-5 mb-4 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex items-start gap-2">
        <Globe2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[13px] text-slate-700"><span className="font-bold text-slate-900">In real life: </span>{realWorld ?? game.realWorld}</p>
      </div>
    </div>
  );
}
