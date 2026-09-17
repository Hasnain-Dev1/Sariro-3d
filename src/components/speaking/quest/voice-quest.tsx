'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Lock, Sparkles, Star, Target, Trophy, Zap, CalendarDays, ChevronRight } from 'lucide-react';
import { speakingLessons } from '@/lib/speaking/courses';
import { homeworkFor, showcaseMissions } from '@/lib/speaking/quest/homework';
import { questState, type QuestState } from '@/lib/speaking/quest/engine';
import type { PracticeAttempt } from '@/lib/speaking/progress';
import { useAttempts } from './use-attempts';
import HomeworkPanel, { MissionCard, StarRow } from './homework-panel';
import { ArenaCard, LevelBadge, WarmUp } from './level-parts';
import { useLearnerStage } from '@/components/speaking/use-stage';
import { STAGES, type Stage } from '@/lib/speaking/stages';

/**
 * SARIRO — Voice Quest
 * ============================================================================
 * The practice room's front door for a Public Speaking learner: who you are
 * becoming (rank and XP), whether you showed up (the streak), one thing to do
 * today (the daily quest), and the whole course as a map you can see yourself
 * moving across — every level with its class game, its warm-up and homework
 * that records every try.
 *
 * Everything on this screen is worked out from practice_attempts by
 * lib/speaking/quest/engine.ts. There is no points table to game.
 */

type Selection = { type: 'level'; key: string } | { type: 'showcase'; slot: number };

export default function VoiceQuest({ demo, stage: forced }: {
  /**
   * A sample history to show instead of the learner's own — for showing a
   * family what the quest looks like a few weeks in, in a trial class.
   */
  demo?: readonly PracticeAttempt[];
  /** Which age stage to show; the learner's own, from their grade, when omitted. */
  stage?: Stage;
} = {}) {
  const { stage: mine } = useLearnerStage();
  const stage = forced ?? mine;
  const stageMeta = STAGES[stage];
  const lessons = useMemo(() => speakingLessons(stage), [stage]);
  const live = useAttempts();
  const attempts = demo ?? live.attempts;
  const afterLog = live.afterLog;
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setOffset(new Date().getTimezoneOffset()); setNow(Date.now()); }, []);

  const state = useMemo<QuestState | null>(
    () => (attempts && now !== null ? questState(attempts, lessons, { now, offsetMinutes: offset, stage }) : null),
    [attempts, lessons, now, offset, stage]
  );

  const [selected, setSelected] = useState<Selection | null>(null);
  const nextLevel = state?.worlds.flatMap((w) => w.levels).find((l) => !l.status.cleared);
  const current: Selection | null = selected ?? (nextLevel ? { type: 'level', key: nextLevel.lesson.key } : null);

  if (!state) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-44 rounded-[1.4rem] bg-slate-200/70 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-200/50 animate-pulse" />
      </div>
    );
  }

  const earned = state.badges.filter((b) => b.earned);
  const toNext = state.rank.next === null ? null : state.rank.next - state.xp;

  return (
    <div className="space-y-6">
      {/* ── The player ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[1.4rem] text-white" style={{ background: 'radial-gradient(120% 140% at 0% 0%, #1E3A8A 0%, #111827 60%, #0B0F19 100%)' }}>
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl shrink-0" aria-hidden>{state.rank.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Voice Quest · Rank {state.rank.level} · <span aria-hidden>{stageMeta.emoji}</span> {stageMeta.name}
                </p>
                <p className="text-[1.9rem] font-extrabold leading-none tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{state.rank.title}</p>
                <div className="mt-3 h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-fuchsia-400 transition-all" style={{ width: `${Math.round(state.rank.progress * 100)}%` }} />
                </div>
                <p className="mt-1.5 text-[12px] text-white/60 tabular-nums">
                  <Zap className="inline w-3.5 h-3.5 text-amber-300" /> {state.xp.toLocaleString()} XP{toNext !== null ? ` · ${toNext.toLocaleString()} to the next rank` : ' · top rank'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:w-[21rem]">
              <Stat icon={<Flame className={`w-4 h-4 ${state.streak.today ? 'text-orange-400' : 'text-white/40'}`} />} value={state.streak.current} label={state.streak.today ? 'day streak' : state.streak.current ? 'practise today!' : 'day streak'} />
              <Stat icon={<Target className="w-4 h-4 text-emerald-300" />} value={`${state.levelsCleared}/${state.totalLevels}`} label="levels" />
              <Stat icon={<Star className="w-4 h-4 text-amber-300 fill-amber-300" />} value={state.totalStars} label="stars" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Today ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-end justify-between gap-2 mb-2">
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <CalendarDays className="w-4 h-4 text-amber-500" /> Daily quest
          </h3>
          <span className="text-[12px] text-slate-500">New one every day · keeps your streak</span>
        </div>
        <MissionCard status={state.daily} onLogged={afterLog} highlight={!state.daily.passed} />
      </section>

      {/* ── The map ────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-[15px] font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>The map</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {state.worlds.map((w) => {
            const showcase = state.showcases.find((s) => s.showcase.worlds[s.showcase.worlds.length - 1] === w.world.num);
            return (
              <div key={w.world.num} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3" style={{ background: `${w.world.color}10` }}>
                  <span className="text-2xl" aria-hidden>{w.world.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{w.world.name}</p>
                    <p className="text-[12px] text-slate-500 truncate">{w.world.tagline}</p>
                  </div>
                  <span className="text-[11.5px] font-bold tabular-nums" style={{ color: w.world.color }}>{w.cleared}/{w.levels.length}</span>
                </div>
                <div className="px-4 py-4 flex flex-wrap gap-2.5">
                  {w.levels.map(({ lesson, status }) => {
                    const on = current?.type === 'level' && current.key === lesson.key;
                    const isNext = nextLevel?.lesson.key === lesson.key;
                    return (
                      <button
                        key={lesson.key}
                        type="button"
                        onClick={() => setSelected({ type: 'level', key: lesson.key })}
                        title={lesson.title}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <span
                          className={`relative w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-black transition-transform group-hover:-translate-y-0.5 ${status.cleared ? 'text-white' : status.started ? 'bg-white' : 'bg-slate-100 text-slate-500'} ${on ? 'ring-4 ring-offset-2' : ''}`}
                          style={{
                            ...(status.cleared ? { background: w.world.color } : status.started ? { border: `2.5px solid ${w.world.color}`, color: w.world.color } : null),
                            ['--tw-ring-color' as string]: `${w.world.color}55`,
                          }}
                        >
                          {lesson.number}
                          {isNext && !on && <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: w.world.color }} />}
                        </span>
                        <StarRow stars={status.stars} size={9} />
                      </button>
                    );
                  })}
                  {showcase && (
                    <button
                      type="button"
                      onClick={() => setSelected({ type: 'showcase', slot: showcase.showcase.slot })}
                      className="flex flex-col items-center gap-1"
                      title={showcase.showcase.name}
                    >
                      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${showcase.status.cleared ? 'bg-amber-400' : showcase.unlocked ? 'bg-slate-900' : 'bg-slate-100'}`}>
                        {showcase.unlocked ? showcase.showcase.emoji : <Lock className="w-4 h-4 text-slate-400" />}
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-500">Showcase</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── The selected level ─────────────────────────────────────────── */}
      {current && <Selected state={state} attempts={attempts ?? []} selection={current} afterLog={afterLog} stage={stage} />}

      {/* ── Badges ─────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <Trophy className="w-4 h-4 text-amber-500" /> Badges
          </h3>
          <span className="text-[12px] text-slate-500">{earned.length} of {state.badges.length}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {state.badges.map((b) => (
            <div key={b.id} className={`rounded-xl border p-3 ${b.earned ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${b.earned ? '' : 'grayscale opacity-40'}`} aria-hidden>{b.emoji}</span>
                <p className={`text-[13px] font-extrabold leading-tight ${b.earned ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</p>
              </div>
              <p className="mt-1 text-[11.5px] text-slate-500 leading-snug">{b.how}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-white/[0.07] px-3 py-2.5 text-center">
      <div className="flex items-center justify-center gap-1.5">{icon}<span className="text-[1.25rem] font-extrabold tabular-nums">{value}</span></div>
      <p className="text-[10.5px] text-white/55 leading-tight mt-0.5">{label}</p>
    </div>
  );
}

function Selected({ state, attempts, selection, afterLog, stage }: { state: QuestState; attempts: readonly PracticeAttempt[]; selection: Selection; afterLog: () => void; stage: Stage }) {
  if (selection.type === 'showcase') {
    const s = state.showcases.find((x) => x.showcase.slot === selection.slot);
    if (!s) return null;
    return (
      <section className="space-y-4" id="quest-level">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Showcase</p>
          <p className="text-[1.4rem] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{s.showcase.emoji} {s.showcase.name}</p>
          <p className="mt-1 text-[14px] text-slate-600">{s.showcase.brief}</p>
          {!s.unlocked && (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="flex items-center gap-2 text-[13.5px] font-bold text-slate-700"><Lock className="w-4 h-4" /> Clear {s.showcase.unlockAfter} levels in these worlds to unlock it — {s.toward} done.</p>
              <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-slate-900 rounded-full" style={{ width: `${Math.min(100, (s.toward / s.showcase.unlockAfter) * 100)}%` }} /></div>
            </div>
          )}
        </div>
        {s.unlocked && <HomeworkPanel missions={showcaseMissions(s.showcase, stage)} attempts={attempts} onLogged={afterLog} title={s.showcase.name} subtitle="Showcase missions" />}
      </section>
    );
  }

  const found = state.worlds.flatMap((w) => w.levels).find((l) => l.lesson.key === selection.key);
  if (!found) return null;
  const { status } = found;
  const lesson = found.lesson;
  return (
    <section className="space-y-4" id="quest-level">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <LevelBadge lesson={lesson} stars={status.stars} cleared={status.cleared} />
        <p className="mt-2 text-[1.45rem] font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{lesson.title}</p>
        <p className="mt-1 text-[14.5px] text-slate-600 leading-relaxed">{lesson.oneLine}</p>
        <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-500">
          <Sparkles className="w-3.5 h-3.5" /> The full lesson — the idea, the model and the drills — is in My Lessons <ChevronRight className="w-3.5 h-3.5" />
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <WarmUp lesson={lesson} />
        <ArenaCard lesson={lesson} />
      </div>
      <HomeworkPanel key={`${stage}:${lesson.key}`} missions={homeworkFor(lesson)} attempts={attempts} onLogged={afterLog} title={`Level ${lesson.number} homework`} />
    </section>
  );
}
