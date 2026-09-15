'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Star, Target, Zap, Check, X } from 'lucide-react';
import { allSpeakingLessons } from '@/lib/speaking/modules';
import { homeworkFor, showcaseMissions, attemptPasses, type Mission } from '@/lib/speaking/quest/homework';
import { questState, dailyQuest } from '@/lib/speaking/quest/engine';
import { SHOWCASES } from '@/lib/speaking/quest/worlds';
import { useAttempts } from './use-attempts';
import { createClient } from '@/lib/supabase/client';
import { stageFor, STAGES, type Stage } from '@/lib/speaking/stages';
import { KIND_META } from './homework-panel';

/**
 * SARIRO — a learner's Voice Quest, as their teacher sees it
 * ============================================================================
 * Read-only. The teacher opening a class wants three answers: did they
 * practise (streak, tries), did the homework pass, and where did it not. The
 * rows are the learner's own practice_attempts — staff can read them under the
 * table's RLS (scripts/practice-log.sql).
 */
export default function QuestRecord({ userId, name }: { userId: string; name: string }) {
  const lessons = useMemo(() => allSpeakingLessons(), []);
  const { attempts } = useAttempts(userId);
  const [clock, setClock] = useState<{ now: number; offset: number } | null>(null);
  useEffect(() => { setClock({ now: Date.now(), offset: new Date().getTimezoneOffset() }); }, []);

  /* The learner's stage decides the pass marks their missions were set at. */
  const [stage, setStage] = useState<Stage | null>(null);
  useEffect(() => {
    let live = true;
    createClient().from('profiles').select('grade').eq('id', userId).maybeSingle()
      .then(({ data }) => { if (live) setStage(stageFor((data?.grade as number | null | undefined) ?? null)); });
    return () => { live = false; };
  }, [userId]);

  const index = useMemo(() => {
    const m = new Map<string, { mission: Mission; where: string }>();
    if (!stage) return m;
    for (const l of lessons) for (const mission of homeworkFor(l, stage)) m.set(mission.id, { mission, where: `Level ${l.number}` });
    for (const s of SHOWCASES) for (const mission of showcaseMissions(s, stage)) m.set(mission.id, { mission, where: 'Showcase' });
    return m;
  }, [lessons, stage]);

  if (!attempts || !clock || !stage) return <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />;
  const state = questState(attempts, lessons, { now: clock.now, offsetMinutes: clock.offset, stage });

  const homework = attempts
    .filter((a) => a.drillId && (index.has(a.drillId) || a.drillId.startsWith('dq:')))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 10);
  const passedMissions = state.worlds.flatMap((w) => w.levels.flatMap((l) => l.status.missions)).filter((m) => m.passed).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Voice Quest & homework · {STAGES[stage].emoji} {STAGES[stage].name} ({STAGES[stage].grades})</p>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Tile icon={<Zap className="w-3.5 h-3.5 text-amber-500" />} value={`${state.rank.emoji} ${state.rank.title}`} label={`${state.xp.toLocaleString()} XP`} />
        <Tile icon={<Flame className="w-3.5 h-3.5 text-orange-500" />} value={`${state.streak.current} days`} label={`best ${state.streak.best}`} />
        <Tile icon={<Target className="w-3.5 h-3.5 text-emerald-600" />} value={`${state.levelsCleared}/${state.totalLevels}`} label="levels cleared" />
        <Tile icon={<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />} value={`${passedMissions}`} label="missions passed" />
      </div>

      {homework.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-slate-500">{name} has not started any homework missions yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left font-bold py-1.5 pr-2">Mission</th>
                <th className="text-left font-bold py-1.5 pr-2">When</th>
                <th className="text-right font-bold py-1.5 pr-2">Score</th>
                <th className="text-right font-bold py-1.5">Pass</th>
              </tr>
            </thead>
            <tbody>
              {homework.map((a, i) => {
                const hit = a.drillId?.startsWith('dq:')
                  ? { mission: dailyQuest(a.drillId.slice(3), stage), where: 'Daily quest' }
                  : index.get(a.drillId as string);
                if (!hit) return null;
                const ok = attemptPasses(hit.mission, a);
                const meta = KIND_META[hit.mission.kind];
                return (
                  <tr key={a.id ?? `${a.createdAt}-${i}`} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2">
                      <span className="font-semibold text-slate-800">{hit.where}</span>
                      <span className="text-slate-500"> · <span style={{ color: meta.color }}>{meta.label}</span> · {hit.mission.title}</span>
                    </td>
                    <td className="py-1.5 pr-2 text-slate-500 whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td>
                    <td className="py-1.5 pr-2 text-right font-bold tabular-nums">{a.score}<span className="text-slate-400 font-normal">/{hit.mission.pass}</span></td>
                    <td className="py-1.5 text-right">{ok ? <Check className="inline w-3.5 h-3.5 text-emerald-600" /> : <X className="inline w-3.5 h-3.5 text-slate-300" />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Tile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <p className="flex items-center gap-1 text-[13px] font-extrabold text-slate-900 truncate">{icon} {value}</p>
      <p className="text-[10.5px] text-slate-500">{label}</p>
    </div>
  );
}
