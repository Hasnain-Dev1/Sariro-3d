'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, ClipboardCheck, Dumbbell, Gamepad2, Shuffle, Sparkles, Target, Timer } from 'lucide-react';
import AngleLaser from '@/components/practice/games/angle-laser';
import BalanceScale from '@/components/practice/games/balance-scale';
import BossBattles from '@/components/practice/games/boss-battles';
import CakeShop from '@/components/practice/games/cake-shop';
import MeteorStorm from '@/components/practice/games/meteor-storm';
import TreasureMap from '@/components/practice/games/treasure-map';
import QuestionSet, { type SetResult } from '@/components/practice/question-set';
import TestPaperView from '@/components/practice/test-paper';
import { lessonQuizFor, modulesFor, sheetFor, SHEETS_PER_MODULE, type TestPaper, type TestReport } from '@/lib/practice/maths/tests';
import { MATHS_TOPICS, mathsTopicsFor } from '@/lib/practice/maths/topics';
import { difficultyFor, LEVEL_LABEL, masteryOf, suggestTopics, type TopicAttempt } from '@/lib/practice/mastery';
import { fetchRoomAttempts, logPractice } from '@/lib/practice/log';
import { freshSeed } from '@/lib/practice/rng';
import type { Item, Topic } from '@/lib/practice/types';

/**
 * SARIRO — the maths practice room
 * ============================================================================
 * Opens on what was taught last (when the class carried a lesson), suggests
 * what is due or weak, and lays out every topic of the learner's grade with how
 * well they know it. A set is eight questions at the difficulty their mastery
 * earns; a mixed set draws from the whole grade. Every set is logged per topic,
 * so mastery moves for each topic a mixed set touched.
 */

const SET_SIZE = 8;
const LEVEL_COLOUR = ['#CBD5E1', '#F59E0B', '#3B82F6', '#10B981', '#059669'];

interface Props {
  grade: number;
  accent: string;
  /** The last class's lesson and module, when known: "Adding fractions", "Fractions". */
  lastLesson?: { title: string; module: string; moduleNum?: number | null } | null;
}

type Tab = 'play' | 'practice' | 'sheets' | 'quiz';
type Game = 'boss' | 'cake-shop' | 'meteor-storm' | 'balance' | 'treasure' | 'laser';

/** The arcade, by grade. Boss Battles leads: it is the whole year's maths as a trophy shelf. */
const GAMES: { key: Game; emoji: string; title: string; blurb: (g: number) => string; bg: string; dark: boolean; accent: string; grades: [number, number] }[] = [
  { key: 'boss', emoji: '⚔️', title: 'Boss Battles', blurb: (g) => `Every Grade ${g} module has a boss. Answer fast to hit hard — beat each one three times for three stars.`, bg: 'radial-gradient(circle at 15% 0%, #7C3AED, #0F172A 75%)', dark: true, accent: '#7C3AED', grades: [1, 12] },
  { key: 'cake-shop', emoji: '🎂', title: 'Cake Shop', blurb: () => 'Cut cakes, serve slices, sell cupcakes — fractions and taking-away you do with your hands.', bg: 'linear-gradient(135deg, #FDF2F8, #FEF3C7)', dark: false, accent: '#DB2777', grades: [1, 6] },
  { key: 'balance', emoji: '⚖️', title: 'Balance Scale', blurb: (g) => (g <= 5 ? 'Weigh the mystery box: add weights until the beam is level, then work it out.' : 'Solve equations on a real scale — do the same to both pans until x stands alone.'), bg: 'linear-gradient(135deg, #E0F2FE, #ECFDF5)', dark: false, accent: '#0284C7', grades: [2, 9] },
  { key: 'treasure', emoji: '🏴‍☠️', title: 'Treasure Map', blurb: (g) => (g <= 4 ? 'Follow the parrot’s steps from the tent and dig in the right spot.' : 'Plot, move, mirror and cross lines to find where X marks the spot.'), bg: 'linear-gradient(135deg, #FEF3C7, #BAE6FD)', dark: false, accent: '#B45309', grades: [2, 12] },
  { key: 'laser', emoji: '🔦', title: 'Angle Laser', blurb: (g) => (g >= 11 ? 'Turn the laser to radians and bearings — then fire.' : 'Turn the laser to the angle — read the protractor, or guess without one — and fire.'), bg: 'radial-gradient(circle at 30% 20%, #1E3A8A, #0F172A 75%)', dark: true, accent: '#E11D48', grades: [3, 12] },
  { key: 'meteor-storm', emoji: '☄️', title: 'Meteor Storm', blurb: (g) => `Grade ${g} sums fall from the sky. Type the answer to blast them — faster and faster.`, bg: 'linear-gradient(135deg, #312E81, #0F172A)', dark: true, accent: '#4F46E5', grades: [1, 12] },
];
const TABS: { key: Tab; label: string; icon: typeof Dumbbell }[] = [
  { key: 'play', label: 'Play', icon: Gamepad2 },
  { key: 'practice', label: 'Practice', icon: Dumbbell },
  { key: 'sheets', label: 'Test sheets', icon: ClipboardCheck },
  { key: 'quiz', label: 'Lesson quiz', icon: Timer },
];

export default function MathsRoom({ grade: homeGrade, accent, lastLesson }: Props) {
  const [grade, setGrade] = useState(homeGrade);
  const [attempts, setAttempts] = useState<TopicAttempt[]>([]);
  const [session, setSession] = useState<{ label: string; items: Item[] } | null>(null);
  const [saved, setSaved] = useState<'saving' | 'saved' | 'not-saved' | null>(null);
  const [tab, setTab] = useState<Tab>('play');
  const [game, setGame] = useState<Game | null>(null);
  const [paper, setPaper] = useState<TestPaper | null>(null);
  const [quizModule, setQuizModule] = useState<number>(lastLesson?.moduleNum ?? 1);

  const refresh = useCallback(async () => setAttempts(await fetchRoomAttempts('maths')), []);
  useEffect(() => { void refresh(); }, [refresh]);

  const topics = useMemo(() => mathsTopicsFor(grade), [grade]);
  const lessonTopics = useMemo(
    () => (lastLesson && grade === homeGrade ? mathsTopicsFor(grade, lastLesson.module, lastLesson.title) : []),
    [lastLesson, grade, homeGrade]
  );
  const matchedLesson = lessonTopics.length > 0 && lessonTopics.length < topics.length;
  const suggestions = useMemo(() => suggestTopics(topics.map((t) => t.key), attempts), [topics, attempts]);

  const build = useCallback((pool: Topic[], label: string) => {
    const items: Item[] = [];
    for (let i = 0; i < SET_SIZE; i++) {
      const topic = pool.length === 1 ? pool[0] : pool[Math.floor(Math.random() * pool.length)];
      const level = masteryOf(topic.key, attempts).level;
      items.push(topic.make(freshSeed(), difficultyFor(level)));
    }
    setSaved(null);
    setSession({ label, items });
  }, [attempts]);

  const finish = useCallback(async (r: SetResult) => {
    setSaved('saving');
    // One row per topic the set covered, each with that topic's share of the score.
    const byTopic = new Map<string, { sum: number; n: number; first: string }>();
    for (const p of r.perItem) {
      const cur = byTopic.get(p.topic) ?? { sum: 0, n: 0, first: p.id };
      cur.sum += p.points;
      cur.n += 1;
      byTopic.set(p.topic, cur);
    }
    const results = await Promise.all([...byTopic.entries()].map(([topic, v]) =>
      logPractice({
        room: 'maths', topic, kind: 'problem', drillId: v.first,
        score: (v.sum / v.n) * 100,
        durationMs: Math.round(r.durationMs * (v.n / r.total)),
        metrics: { questions: v.n, correct: r.perItem.filter((p) => p.topic === topic && p.points > 0).length, hints: r.hints },
      })
    ));
    setSaved(results.every(Boolean) ? 'saved' : 'not-saved');
    void refresh();
  }, [refresh]);

  /* Best score on each test paper, by its id. */
  const best = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of attempts) if (a.topic.startsWith('maths:sheet:') || a.topic.startsWith('maths:quiz:')) m.set(a.topic, Math.max(m.get(a.topic) ?? 0, a.score));
    return m;
  }, [attempts]);
  const tries = (id: string) => attempts.filter((a) => a.topic === id).length;
  const modules = useMemo(() => modulesFor(grade), [grade]);

  const paperDone = useCallback(async (r: TestReport) => {
    await logPractice({
      room: 'maths', topic: r.paperId, kind: 'quiz', drillId: r.paperId, score: r.score, durationMs: r.secondsUsed * 1000,
      metrics: { correct: r.correct, total: r.total, unanswered: r.unanswered, seconds: r.secondsUsed },
    });
    void refresh();
  }, [refresh]);

  if (paper) {
    return (
      <div className="space-y-4">
        <TestPaperView key={paper.id + paper.items[0]?.id} paper={paper} accent={accent} onDone={(r) => void paperDone(r)} onExit={() => setPaper(null)} />
      </div>
    );
  }

  const tabBar = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={tab === t.key}
          onClick={() => { setTab(t.key); setGame(null); }}
          className={`h-11 rounded-xl text-sm font-bold border-2 flex items-center justify-center gap-2 ${tab === t.key ? '' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
          style={tab === t.key ? { borderColor: accent, background: `${accent}10`, color: accent } : undefined}
        >
          <t.icon className="w-4 h-4" /> <span>{t.label}</span>
        </button>
      ))}
    </div>
  );

  if (!session && tab === 'play') {
    if (game) {
      const g = GAMES.find((x) => x.key === game)!;
      return (
        <div className="space-y-4">
          {tabBar}
          <button type="button" onClick={() => setGame(null)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> All games
          </button>
          {game === 'boss' && <BossBattles grade={grade} accent={g.accent} attempts={attempts} onLogged={() => void refresh()} currentModule={grade === homeGrade ? lastLesson?.moduleNum ?? null : null} />}
          {game === 'cake-shop' && <CakeShop grade={grade} accent={g.accent} />}
          {game === 'meteor-storm' && <MeteorStorm grade={grade} accent={g.accent} />}
          {game === 'balance' && <BalanceScale grade={grade} accent={g.accent} />}
          {game === 'treasure' && <TreasureMap grade={grade} accent={g.accent} />}
          {game === 'laser' && <AngleLaser grade={grade} accent={g.accent} />}
        </div>
      );
    }
    const games = GAMES.filter((g) => grade >= g.grades[0] && grade <= g.grades[1]);
    return (
      <div className="space-y-5">
        {tabBar}
        <div className="grid sm:grid-cols-2 gap-3">
          {games.map((g, i) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGame(g.key)}
              className={`text-left rounded-3xl p-6 border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all ${i === 0 ? 'sm:col-span-2' : ''} ${g.dark ? 'text-white border-transparent' : 'text-slate-900 border-slate-200'}`}
              style={{ background: g.bg }}
            >
              <span className="text-5xl" aria-hidden>{g.emoji}</span>
              <span className="block mt-3 text-2xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>{g.title}</span>
              <span className={`block mt-1 text-[14px] ${g.dark ? 'text-white/80' : 'text-slate-700'}`}>{g.blurb(grade)}</span>
              <span className={`mt-4 inline-flex h-10 items-center px-5 rounded-xl text-[14px] font-extrabold ${g.dark ? 'bg-white text-slate-900' : 'text-white'}`} style={g.dark ? undefined : { background: g.accent }}>Play</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!session && tab === 'sheets') {
    return (
      <div className="space-y-5">
        {tabBar}
        <p className="text-[13.5px] text-slate-600">
          Ten timed sheets for every module — 15 questions, 30 minutes, marked the moment you hand in, with a report. Sheets 1–3 are foundation, 4–7 standard, 8–10 challenge.
        </p>
        <div className="space-y-3">
          {modules.map((m) => (
            <div key={m.num} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[15px] font-extrabold text-slate-900">Module {m.num} · {m.title}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{m.topics.map((t) => t.title).join(' · ')}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Array.from({ length: SHEETS_PER_MODULE }, (_, i) => i + 1).map((n) => {
                  const id = `maths:sheet:g${grade}:m${m.num}:s${n}`;
                  const b = best.get(id);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPaper(sheetFor(grade, m.num, n))}
                      title={b !== undefined ? `Best ${b}%` : 'Not taken yet'}
                      className="min-w-[52px] h-11 rounded-lg border-2 px-2 text-[12.5px] font-bold leading-tight"
                      style={b !== undefined ? { borderColor: b >= 80 ? '#10B981' : b >= 50 ? '#F59E0B' : '#F43F5E', color: '#0F172A' } : { borderColor: '#E2E8F0', color: '#64748B' }}
                    >
                      <span className="block">Sheet {n}</span>
                      <span className="block text-[11px] font-semibold">{b !== undefined ? `${b}%` : n <= 3 ? 'Basic' : n <= 7 ? 'Standard' : 'Hard'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session && tab === 'quiz') {
    const mod = modules.find((m) => m.num === quizModule) ?? modules[0];
    const startQuiz = (moduleNum: number, lesson: string) => {
      const probe = lessonQuizFor(grade, moduleNum, lesson);
      setPaper(lessonQuizFor(grade, moduleNum, lesson, tries(probe.id) + 1));
    };
    return (
      <div className="space-y-5">
        {tabBar}
        <p className="text-[13.5px] text-slate-600">A 10-minute quiz on one lesson — the quickest way to find out whether it stuck.</p>
        {lastLesson?.moduleNum && grade === homeGrade && (
          <button
            type="button"
            onClick={() => startQuiz(lastLesson.moduleNum!, lastLesson.title)}
            className="w-full text-left rounded-2xl border-2 p-4 flex items-center gap-4"
            style={{ borderColor: `${accent}55`, background: `${accent}0D` }}
          >
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: accent }}><Timer className="w-5 h-5" /></span>
            <span>
              <span className="block text-[11.5px] font-bold uppercase tracking-wider" style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}>Quiz on your last class</span>
              <span className="block text-[16px] font-extrabold text-slate-900">{lastLesson.title}</span>
            </span>
          </button>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="block text-[12.5px] font-bold text-slate-600 mb-1.5">Or pick a lesson</label>
          <select value={mod?.num ?? 1} onChange={(e) => setQuizModule(Number(e.target.value))} className="h-10 w-full sm:w-auto rounded-lg border border-slate-200 px-2 text-[14px]">
            {modules.map((m) => <option key={m.num} value={m.num}>Module {m.num} · {m.title}</option>)}
          </select>
          <ul className="mt-3 divide-y divide-slate-100">
            {(mod?.lessons ?? []).map((lesson) => {
              const id = lessonQuizFor(grade, mod!.num, lesson).id;
              const b = best.get(id);
              return (
                <li key={lesson} className="py-2 flex items-center gap-3">
                  <span className="flex-1 text-[14px] text-slate-800">{lesson}</span>
                  {b !== undefined && <span className="text-[12px] font-bold text-slate-500">Best {b}%</span>}
                  <button type="button" onClick={() => startQuiz(mod!.num, lesson)} className="h-9 px-3 rounded-lg text-[13px] font-bold text-white" style={{ background: accent }}>Take quiz</button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSession(null)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> All topics
        </button>
        <p className="text-[13px] font-bold text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>{session.label}</p>
        <QuestionSet
          key={session.items[0]?.id}
          items={session.items}
          accent={accent}
          saved={saved}
          onFinish={(r) => void finish(r)}
          onAgain={() => {
            const pool = [...new Set(session.items.map((i) => i.topic))].map((k) => MATHS_TOPICS.find((t) => t.key === k)!).filter(Boolean);
            build(pool, session.label);
          }}
        />
      </div>
    );
  }

  const gradeChoices = [homeGrade - 1, homeGrade, homeGrade + 1].filter((g) => g >= 1 && g <= 12);

  return (
    <div className="space-y-6">
      {tabBar}
      {matchedLesson && lastLesson && (
        <button
          type="button"
          onClick={() => build(lessonTopics, `Your last class · ${lastLesson.title}`)}
          className="w-full text-left rounded-2xl border-2 p-4 sm:p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
          style={{ borderColor: `${accent}55`, background: `${accent}0D` }}
        >
          <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: accent, color: 'white' }}><BookOpen className="w-5 h-5" /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-[11.5px] font-bold uppercase tracking-wider" style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}>Practise your last class</span>
            <span className="block text-[16px] font-extrabold text-slate-900 truncate">{lastLesson.title}</span>
            <span className="block text-[12.5px] text-slate-500">{lessonTopics.map((t) => t.title).join(' · ')}</span>
          </span>
        </button>
      )}

      {suggestions.length > 0 && (
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}><Sparkles className="w-4 h-4" /> Up next for you</h2>
          <div className="grid sm:grid-cols-3 gap-2">
            {suggestions.map((m) => {
              const t = topics.find((x) => x.key === m.topic)!;
              return (
                <button key={m.topic} type="button" onClick={() => build([t], t.title)} className="text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300">
                  <span className="block text-[14px] font-bold text-slate-900">{t.title}</span>
                  <span className="block text-[12px] text-slate-500 mt-0.5">
                    {m.level === 0 ? 'Not tried yet' : m.due ? `Time to review · ${LEVEL_LABEL[m.level]}` : LEVEL_LABEL[m.level]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}><Target className="w-4 h-4" /> Every topic · Grade {grade}</h2>
          <div className="flex items-center gap-1">
            {gradeChoices.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                aria-pressed={g === grade}
                className={`h-8 px-3 rounded-full text-[12px] font-bold border ${g === grade ? 'text-white' : 'border-slate-200 text-slate-600'}`}
                style={g === grade ? { background: accent, borderColor: accent } : undefined}
              >
                {g === homeGrade ? `Grade ${g} (mine)` : `Grade ${g}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <button type="button" onClick={() => build(topics, `Mixed · Grade ${grade}`)} className="text-left rounded-xl border-2 border-dashed p-3 hover:bg-slate-50" style={{ borderColor: `${accent}66` }}>
            <span className="flex items-center gap-2 text-[14px] font-bold text-slate-900"><Shuffle className="w-4 h-4" style={{ color: accent }} /> Mixed set</span>
            <span className="block text-[12px] text-slate-500 mt-0.5">Eight questions from across Grade {grade}</span>
          </button>
          {topics.map((t) => {
            const m = masteryOf(t.key, attempts);
            return (
              <button key={t.key} type="button" onClick={() => build([t], t.title)} className="text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300">
                <span className="block text-[14px] font-bold text-slate-900">{t.title}</span>
                <span className="mt-1.5 flex items-center gap-2">
                  <span className="flex gap-0.5" aria-hidden>
                    {[1, 2, 3, 4].map((l) => (
                      <span key={l} className="h-1.5 w-4 rounded-full" style={{ background: m.level >= l ? LEVEL_COLOUR[m.level] : '#E2E8F0' }} />
                    ))}
                  </span>
                  <span className="text-[11.5px] font-semibold text-slate-500">{LEVEL_LABEL[m.level]}{m.recent !== null ? ` · ${m.recent}%` : ''}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
