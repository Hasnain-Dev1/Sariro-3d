'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, Circle, CircleDot, Eye, Flame, Lightbulb, ListChecks, Loader2, Lock,
  Minus, Play, Plus, RotateCcw, Search, Sparkles, Terminal, Trophy, X,
} from 'lucide-react';
import RichText from './rich-text';
import TutorPanel from './tutor-panel';
import { Confetti, useSound } from '@/components/practice/games/game-kit';
import { ALL_CHALLENGES, PACKS, awaitingRunner, packOrder, suggestedTier } from '@/lib/practice/lab/packs';
import { progressOf, scoreFor, type LabAttempt } from '@/lib/practice/lab/progress';
import { diagnose, type Note } from '@/lib/practice/lab/diagnose';
import { callLabel, formatValue } from '@/lib/practice/lab/format';
import { runJavaScript } from '@/lib/practice/lab/run-js';
import { python, type PythonStatus } from '@/lib/practice/lab/run-python';
import { buildPage, runWeb } from '@/lib/practice/lab/run-web';
import { TIER_LABEL, TIER_XP, isCode, type Challenge, type FnTest, type LabLanguage, type LabRun, type ProgramTest, type Tier } from '@/lib/practice/lab/types';
import { fetchRoomAttempts, logPractice } from '@/lib/practice/log';

const CodeEditor = dynamic(() => import('./code-editor'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-[#0B1020]"><Loader2 className="h-5 w-5 animate-spin text-slate-500" /></div>,
});

/**
 * SARIRO — the Code Lab
 * ============================================================================
 * The founder, 19 Sep 2026: a proper, professional coding practice room for
 * every coding course — pick a challenge, write real code, run the tests, take
 * a hint, ask a tutor.
 *
 *   left    the challenge (or the list of all of them)
 *   centre  the editor, and under it the tests, the console and — for HTML &
 *           CSS — the live page
 *   right   the tutor
 *
 * Three languages, all running in the browser for free: JavaScript and Python
 * in Web Workers, HTML & CSS in a sandboxed frame. The learner's course picks
 * the language the lab opens on and the difficulty it suggests.
 *
 * A solve is logged to practice_attempts (subject 'coding', topic = the
 * challenge id); XP, level and streak are worked out from those rows
 * (lib/practice/lab/progress.ts). Code in progress stays on the device.
 */

const TIER_STYLE: Record<Tier, string> = {
  1: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  2: 'bg-amber-50 text-amber-700 ring-amber-200',
  3: 'bg-rose-50 text-rose-700 ring-rose-200',
  4: 'bg-violet-50 text-violet-700 ring-violet-200',
};

interface Saved { code?: string; html?: string; css?: string; hints: number; peeked?: boolean }

const store = {
  get<T>(key: string): T | null {
    try { const v = window.localStorage.getItem(`sariro.lab.v1.${key}`); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
  },
  set(key: string, value: unknown) {
    try { window.localStorage.setItem(`sariro.lab.v1.${key}`, JSON.stringify(value)); } catch { /* private mode */ }
  },
};

function starterOf(c: Challenge): Saved {
  return isCode(c) ? { code: c.starter, hints: 0 } : { html: c.starter.html, css: c.starter.css, hints: 0 };
}

/** What the AI tutor is told about the last run. */
function summarise(run: LabRun | null): string | null {
  if (!run) return null;
  if (!run.ok) return `${run.timedOut ? 'The code ran too long and was stopped.' : `Error${run.line ? ` on line ${run.line}` : ''}: ${run.error}`}${run.logs.length ? `\nPrinted:\n${run.logs.slice(0, 20).join('\n')}` : ''}`;
  const lines = [`${run.passed} of ${run.total} tests passed.`];
  for (const r of run.results) {
    if (r.pass) continue;
    lines.push(r.hidden ? `${r.label}: failed` : `${r.label}: ${r.error ? r.error : `expected ${r.expected ?? '(see challenge)'}, got ${r.got ?? 'nothing'}`}`);
  }
  if (run.logs.length) lines.push(`Printed:\n${run.logs.slice(0, 20).join('\n')}`);
  return lines.join('\n');
}

export default function CodeLab({ accent, track, level }: { accent: string; track: string | null; level: number | null }) {
  const order = useMemo(() => packOrder(track), [track]);
  const [lang, setLang] = useState<LabLanguage>(order[0]);
  const [attempts, setAttempts] = useState<LabAttempt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const progress = useMemo(() => progressOf(attempts, ALL_CHALLENGES), [attempts]);
  const pack = PACKS[lang];
  const tier = suggestedTier(level);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const challenge = useMemo(() => pack.challenges.find((c) => c.id === challengeId) ?? pack.challenges[0], [pack, challengeId]);

  const [saved, setSaved] = useState<Saved>(() => starterOf(challenge));
  const [editorKey, setEditorKey] = useState(0);
  const [webFile, setWebFile] = useState<'html' | 'css'>('html');
  const [left, setLeft] = useState<'problem' | 'list'>('problem');
  const [mobile, setMobile] = useState<'problem' | 'code' | 'tutor'>('code');
  const [bottom, setBottom] = useState<'tests' | 'console' | 'preview'>('tests');
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<LabRun | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [solved, setSolved] = useState<{ gained: number; score: number; saved: boolean | null } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [failedRuns, setFailedRuns] = useState(0);
  const [fontSize, setFontSize] = useState(15);
  const [pyStatus, setPyStatus] = useState<PythonStatus>('idle');
  const [burst, setBurst] = useState(0);
  const { play } = useSound();
  const openedAt = useRef(Date.now());
  const loggedThisOpen = useRef(false);
  const current = useRef(saved);
  useEffect(() => { current.current = saved; }, [saved]);

  /* History, once. */
  useEffect(() => {
    let live = true;
    void fetchRoomAttempts('coding', 1000).then((rows) => {
      if (!live) return;
      setAttempts(rows);
      setLoaded(true);
    });
    const f = store.get<number>('font');
    if (f) setFontSize(Math.max(12, Math.min(22, f)));
    const l = store.get<LabLanguage>('lang');
    if (l && PACKS[l]) setLang(l);
    return () => { live = false; };
  }, []);

  /* Python loads in the background the moment the Python pack is open. */
  useEffect(() => {
    if (lang !== 'python' || !python) return;
    const off = python.onStatus(setPyStatus);
    void python.warm();
    return off;
  }, [lang]);

  /* Open a challenge: its saved code (or the starter), a clean slate. */
  const open = useCallback((c: Challenge) => {
    setChallengeId(c.id);
    const s = store.get<Saved>(c.id);
    setSaved(s ? { ...starterOf(c), ...s } : starterOf(c));
    setEditorKey((k) => k + 1);
    setWebFile('html');
    setLastRun(null);
    setNote(null);
    setSolved(null);
    setShowSolution(false);
    setFailedRuns(0);
    setBottom(c.lang === 'web' ? 'preview' : 'tests');
    setLeft('problem');
    setMobile('code');
    openedAt.current = Date.now();
    loggedThisOpen.current = false;
    store.set(`last.${c.lang}`, c.id);
  }, []);

  /* The first challenge in a pack: where they left off, else the first unsolved at their level. */
  useEffect(() => {
    if (!loaded) return;
    const last = store.get<string>(`last.${lang}`);
    const byLast = last ? pack.challenges.find((c) => c.id === last) : undefined;
    const firstOpen = pack.challenges.find((c) => c.tier >= tier && !progress.best.has(c.id))
      ?? pack.challenges.find((c) => !progress.best.has(c.id))
      ?? pack.challenges[0];
    open(byLast ?? firstOpen);
    store.set('lang', lang);
    // Only when the pack changes or history arrives — not on every solve.
  }, [lang, loaded]);

  const persist = useCallback((patch: Partial<Saved>) => {
    setSaved((s) => {
      const next = { ...s, ...patch };
      store.set(challenge.id, next);
      return next;
    });
  }, [challenge.id]);

  const codeText = () => {
    const s = current.current;
    return isCode(challenge) ? s.code ?? '' : `<!-- index.html -->\n${s.html ?? ''}\n\n/* style.css */\n${s.css ?? ''}`;
  };

  const nextHint = useCallback((): string | null => {
    const used = current.current.hints;
    if (used >= challenge.hints.length) return null;
    persist({ hints: used + 1 });
    return challenge.hints[used];
  }, [challenge, persist]);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setBottom('tests');
    const s = current.current;
    let r: LabRun;
    if (challenge.lang === 'web') r = await runWeb(s.html ?? '', s.css ?? '', challenge);
    else if (challenge.lang === 'python') r = await python.run(s.code ?? '', challenge);
    else r = await runJavaScript(s.code ?? '', challenge);
    setRunning(false);
    setLastRun(r);
    setNote(diagnose(challenge, r, s.code ?? ''));
    const allPass = r.ok && r.passed === r.total;
    if (!allPass) {
      setFailedRuns((n) => n + 1);
      play('wrong');
      if (!r.ok && r.logs.length) setBottom('console');
      return;
    }
    if (loggedThisOpen.current) { play('coin'); return; }
    loggedThisOpen.current = true;
    const score = s.peeked ? 40 : scoreFor(s.hints);
    const before = progress.xp;
    const row: LabAttempt = { topic: challenge.id, score, createdAt: new Date().toISOString() };
    const after = progressOf([...attempts, row], ALL_CHALLENGES).xp;
    setAttempts((a) => [...a, row]);
    setSolved({ gained: after - before, score, saved: null });
    setBurst((b) => b + 1);
    play('win');
    const ok = await logPractice({
      room: 'coding', topic: challenge.id, kind: 'code', drillId: challenge.id, score,
      durationMs: Date.now() - openedAt.current,
      metrics: { hints: s.hints, peeked: s.peeked ? 1 : 0, failedRuns, tier: challenge.tier },
    });
    setSolved((x) => (x ? { ...x, saved: ok } : x));
  }, [running, challenge, play, progress.xp, attempts, failedRuns]);

  const runRef = useRef(run);
  useEffect(() => { runRef.current = run; }, [run]);
  const onRun = useCallback(() => { void runRef.current(); }, []);

  const reset = () => {
    const fresh = starterOf(challenge);
    persist({ code: fresh.code, html: fresh.html, css: fresh.css });
    setEditorKey((k) => k + 1);
    setLastRun(null);
    setNote(null);
  };

  const nextChallenge = () => {
    const list = pack.challenges;
    const i = list.findIndex((c) => c.id === challenge.id);
    const after = [...list.slice(i + 1), ...list.slice(0, i)];
    open(after.find((c) => !progress.best.has(c.id) && c.id !== challenge.id) ?? after[0] ?? challenge);
  };

  const setFont = (d: number) => setFontSize((f) => { const n = Math.max(12, Math.min(22, f + d)); store.set('font', n); return n; });

  /* ── Pieces ─────────────────────────────────────────────────────────── */
  const best = progress.best.get(challenge.id);
  const hintsUsed = saved.hints;
  const solvedCount = pack.challenges.filter((c) => progress.best.has(c.id)).length;
  const stuck = !best && !solved && hintsUsed >= challenge.hints.length && failedRuns >= 3;

  const header = (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
      <div className="flex items-center rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Language">
        {order.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={lang === l}
            onClick={() => setLang(l)}
            className={`relative rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors ${lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {PACKS[l].label}
            {l === order[0] && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ background: accent }} title="Your course's language" />}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <span className="hidden items-center gap-1.5 text-[12.5px] font-bold text-slate-600 sm:inline-flex" title="Solved in this language">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {solvedCount}/{pack.challenges.length}
        </span>
        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-600" title="Days in a row with a solve">
          <Flame className={`h-4 w-4 ${progress.streak ? 'text-orange-500' : 'text-slate-300'}`} /> {progress.streak} day{progress.streak === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2" title={`${progress.into} / ${progress.span} XP to level ${progress.level + 1}`}>
          <span className="rounded-lg px-2 py-1 text-[12px] font-extrabold text-white" style={{ background: accent, fontFamily: 'var(--font-grotesk)' }}>LV {progress.level}</span>
          <div className="hidden w-28 sm:block">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ background: accent, width: `${Math.round((progress.into / progress.span) * 100)}%` }} />
            </div>
            <p className="mt-0.5 text-[10.5px] font-bold text-slate-500">{progress.xp} XP</p>
          </div>
        </div>
      </div>
    </div>
  );

  const problem = (
    <div className="h-full overflow-y-auto px-5 py-5">
      <button type="button" onClick={() => setLeft('list')} className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500 hover:text-slate-900">
        <ListChecks className="h-4 w-4" /> All {pack.label} challenges
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ring-1 ${TIER_STYLE[challenge.tier]}`}>{TIER_LABEL[challenge.tier]}</span>
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>{challenge.topic}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-slate-500"><Sparkles className="h-3.5 w-3.5" style={{ color: accent }} /> {TIER_XP[challenge.tier]} XP</span>
      </div>
      <h2 className="mt-2 flex items-center gap-2 text-[22px] font-extrabold leading-tight text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {challenge.title}
        {best !== undefined && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Solved" />}
      </h2>
      <RichText text={challenge.prompt} className="mt-3 text-[14.5px] leading-relaxed text-slate-700" />

      {isCode(challenge) && challenge.mode === 'function' && (
        <div className="mt-5">
          <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>Examples</p>
          <div className="space-y-1.5">
            {(challenge.tests as FnTest[]).filter((t) => t.visible).map((t, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-slate-50 px-3 py-2 font-mono text-[12.5px] text-slate-800 ring-1 ring-slate-200">
                <span>{callLabel(challenge.fnName!, t.args, challenge.lang)}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-bold">{formatValue(t.expected, challenge.lang)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-slate-500">Plus {(challenge.tests as FnTest[]).filter((t) => !t.visible).length} hidden tests — so the code has to work, not just match the examples.</p>
        </div>
      )}
      {isCode(challenge) && challenge.mode === 'program' && (
        <div className="mt-5">
          <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>It should print</p>
          <pre className="overflow-x-auto rounded-xl bg-slate-50 px-3 py-2 font-mono text-[12.5px] leading-relaxed text-slate-800 ring-1 ring-slate-200">{(challenge.tests as ProgramTest[])[0].stdout}</pre>
        </div>
      )}
      {!isCode(challenge) && (
        <div className="mt-5">
          <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>What gets checked</p>
          <ul className="space-y-1.5">
            {challenge.checks.map((k, i) => {
              const r = lastRun?.ok ? lastRun.results[i] : undefined;
              return (
                <li key={i} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                  {r ? (r.pass ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />) : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                  {k.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-amber-900"><Lightbulb className="h-4 w-4" /> Hints {hintsUsed}/{challenge.hints.length}</p>
          {hintsUsed < challenge.hints.length && (
            <button type="button" onClick={() => nextHint()} className="rounded-lg bg-white px-2.5 py-1 text-[12px] font-bold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">Show a hint</button>
          )}
        </div>
        {hintsUsed > 0 ? (
          <ol className="mt-2 space-y-1.5">
            {challenge.hints.slice(0, hintsUsed).map((h, i) => (
              <li key={i} className="flex gap-2 text-[13.5px] text-amber-950"><span className="font-bold">{i + 1}.</span><RichText text={h} /></li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 text-[12.5px] text-amber-800">Each hint you open takes a quarter off this challenge&apos;s XP.</p>
        )}
      </div>

      {(best !== undefined || solved || saved.peeked) && isCode(challenge) && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowSolution((v) => !v)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-600 hover:text-slate-900">
            <Eye className="h-4 w-4" /> {showSolution ? 'Hide' : 'Compare with'} our solution
          </button>
          {showSolution && <pre className="mt-2 overflow-x-auto rounded-xl bg-[#0B1020] px-3 py-3 font-mono text-[12.5px] leading-relaxed text-slate-100">{challenge.solution}</pre>}
        </div>
      )}
      {stuck && !saved.peeked && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[13.5px] font-bold text-slate-900">Really stuck?</p>
          <p className="mt-0.5 text-[12.5px] text-slate-600">You can look at a solution. Solving it after that still counts — for 40% of the XP.</p>
          <button type="button" onClick={() => { persist({ peeked: true }); setShowSolution(true); }} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] font-bold text-slate-700 hover:bg-slate-50"><Lock className="h-3.5 w-3.5" /> Show me a solution</button>
        </div>
      )}
    </div>
  );

  const list = (
    <ChallengeList challenges={pack.challenges} currentId={challenge.id} best={progress.best} suggested={tier} accent={accent} onPick={open} onBack={() => setLeft('problem')} label={pack.label} />
  );

  const editorFile = isCode(challenge) ? pack.file : webFile === 'html' ? 'index.html' : 'style.css';
  const editorPane = (
    <div className="flex h-full min-h-0 flex-col bg-[#0B1020]">
      <div className="flex items-center gap-1 border-b border-white/5 px-2 py-1.5">
        {isCode(challenge) ? (
          <span className="rounded-md bg-white/5 px-2.5 py-1 font-mono text-[12px] text-slate-200">{editorFile}</span>
        ) : (
          (['html', 'css'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setWebFile(f)} className={`rounded-md px-2.5 py-1 font-mono text-[12px] ${webFile === f ? 'bg-white/10 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}>
              {f === 'html' ? 'index.html' : 'style.css'}
            </button>
          ))
        )}
        {challenge.lang === 'python' && pyStatus !== 'ready' && (
          <span className="ml-2 inline-flex items-center gap-1.5 text-[11.5px] text-slate-400">
            {pyStatus === 'failed' ? <><X className="h-3.5 w-3.5 text-rose-400" /> Python could not load</> : <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading Python…</>}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setFont(-1)} aria-label="Smaller text" className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"><Minus className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => setFont(1)} aria-label="Bigger text" className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"><Plus className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={reset} className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          key={`${challenge.id}:${editorKey}:${editorFile}`}
          initial={isCode(challenge) ? saved.code ?? '' : webFile === 'html' ? saved.html ?? '' : saved.css ?? ''}
          language={challenge.lang === 'web' ? webFile : challenge.lang}
          onChange={(text) => persist(isCode(challenge) ? { code: text } : webFile === 'html' ? { html: text } : { css: text })}
          onRun={onRun}
          fontSize={fontSize}
          label={`${editorFile} — ${challenge.title}`}
        />
      </div>
      <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2">
        <span className="hidden text-[11.5px] text-slate-500 sm:inline">Ctrl + Enter runs</span>
        <button type="button" onClick={() => { setMobile('problem'); nextHint(); }} disabled={hintsUsed >= challenge.hints.length} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/5 px-3 text-[12.5px] font-bold text-amber-300 hover:bg-white/10 disabled:opacity-40 lg:hidden">
          <Lightbulb className="h-4 w-4" /> Hint
        </button>
        <button type="button" onClick={onRun} disabled={running} className="inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[13.5px] font-extrabold text-white shadow-lg disabled:opacity-60 lg:ml-auto" style={{ background: accent }}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" fill="currentColor" />} {challenge.lang === 'web' ? 'Run checks' : 'Run tests'}
        </button>
      </div>
    </div>
  );

  const results = (
    <ResultsPane
      challenge={challenge}
      run={lastRun}
      running={running}
      tab={bottom}
      onTab={setBottom}
      solved={solved}
      onNext={nextChallenge}
      preview={challenge.lang === 'web' ? buildPage(saved.html ?? '', saved.css ?? '') : null}
      pyLoading={challenge.lang === 'python' && pyStatus === 'loading'}
      accent={accent}
    />
  );

  const tutor = (
    <TutorPanel
      key={challenge.id}
      challenge={challenge}
      getCode={codeText}
      runSummary={summarise(lastRun)}
      note={note}
      nextHint={nextHint}
      accent={accent}
    />
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
      <Confetti burst={burst} />
      {header}
      {awaitingRunner(track) && (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[12.5px] text-amber-900">Java runs here soon. Until then, practise the same thinking in JavaScript — its syntax is the closest.</p>
      )}

      {/* Phones and tablets: one pane at a time. */}
      <div className="flex border-b border-slate-200 bg-white lg:hidden" role="tablist">
        {([['problem', 'Challenge', BookOpen], ['code', 'Code', Terminal], ['tutor', 'Tutor', Sparkles]] as const).map(([k, label, Icon]) => (
          <button key={k} type="button" role="tab" aria-selected={mobile === k} onClick={() => setMobile(k)} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold ${mobile === k ? 'border-b-2 text-slate-900' : 'text-slate-500'}`} style={mobile === k ? { borderColor: accent } : undefined}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="grid lg:h-[calc(100dvh-170px)] lg:min-h-[640px] lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)_minmax(280px,340px)]">
        <aside className={`${mobile === 'problem' ? 'block' : 'hidden'} min-h-0 border-slate-200 bg-white lg:block lg:border-r`}>
          {left === 'list' ? list : problem}
        </aside>
        <section className={`${mobile === 'code' ? 'flex' : 'hidden'} min-h-0 flex-col lg:flex`}>
          <div className="h-[52vh] min-h-[320px] lg:h-auto lg:min-h-0 lg:flex-[3]">{editorPane}</div>
          <div className="min-h-[260px] border-t border-slate-200 bg-white lg:min-h-0 lg:flex-[2]">{results}</div>
        </section>
        <aside className={`${mobile === 'tutor' ? 'block' : 'hidden'} h-[70vh] min-h-0 border-slate-200 bg-white lg:block lg:h-auto lg:border-l`}>
          {tutor}
        </aside>
      </div>
    </div>
  );
}

/* ── The challenge list ────────────────────────────────────────────────── */

function ChallengeList({ challenges, currentId, best, suggested, accent, onPick, onBack, label }: {
  challenges: Challenge[]; currentId: string; best: Map<string, number>; suggested: Tier; accent: string; onPick: (c: Challenge) => void; onBack: () => void; label: string;
}) {
  const [q, setQ] = useState('');
  const [tier, setTier] = useState<Tier | 0>(0);
  const [unsolved, setUnsolved] = useState(false);
  const shown = challenges.filter((c) => (!tier || c.tier === tier) && (!unsolved || !best.has(c.id)) && (!q.trim() || `${c.title} ${c.topic}`.toLowerCase().includes(q.trim().toLowerCase())));
  const topics = [...new Set(shown.map((c) => c.topic))];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2.5 border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-500 hover:text-slate-900"><ChevronLeft className="h-4 w-4" /> Back to the challenge</button>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${label} challenges`} aria-label="Search challenges" className="h-9 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {([0, 1, 2, 3, 4] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTier(t)} aria-pressed={tier === t} title={t === suggested ? 'Suggested for your course' : undefined} className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ring-1 ${tier === t ? 'text-white ring-transparent' : 'bg-white text-slate-600 ring-slate-200'}`} style={tier === t ? { background: accent } : undefined}>
              {t === 0 ? 'All' : TIER_LABEL[t]}{t === suggested ? ' ★' : ''}
            </button>
          ))}
          <label className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600">
            <input type="checkbox" checked={unsolved} onChange={(e) => setUnsolved(e.target.checked)} className="h-3.5 w-3.5 rounded" /> Unsolved
          </label>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {topics.map((topic) => {
          const items = shown.filter((c) => c.topic === topic);
          const done = challenges.filter((c) => c.topic === topic && best.has(c.id)).length;
          const all = challenges.filter((c) => c.topic === topic).length;
          return (
            <div key={topic} className="mb-3">
              <p className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                {topic} <span>{done}/{all}</span>
              </p>
              {items.map((c) => {
                const b = best.get(c.id);
                const active = c.id === currentId;
                return (
                  <button key={c.id} type="button" onClick={() => onPick(c)} className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left ${active ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                    {b !== undefined ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : active ? <CircleDot className="h-4 w-4 shrink-0" style={{ color: accent }} /> : <Circle className="h-4 w-4 shrink-0 text-slate-300" />}
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-slate-800">{c.title}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold ring-1 ${TIER_STYLE[c.tier]}`}>{TIER_LABEL[c.tier]}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
        {!shown.length && <p className="px-3 py-6 text-center text-[13px] text-slate-500">Nothing matches.</p>}
      </div>
    </div>
  );
}

/* ── Tests, console, preview ───────────────────────────────────────────── */

function ResultsPane({ challenge, run, running, tab, onTab, solved, onNext, preview, pyLoading, accent }: {
  challenge: Challenge;
  run: LabRun | null;
  running: boolean;
  tab: 'tests' | 'console' | 'preview';
  onTab: (t: 'tests' | 'console' | 'preview') => void;
  solved: { gained: number; score: number; saved: boolean | null } | null;
  onNext: () => void;
  preview: string | null;
  pyLoading: boolean;
  accent: string;
}) {
  const [doc, setDoc] = useState(preview ?? '');
  useEffect(() => {
    if (preview === null) return;
    const t = setTimeout(() => setDoc(preview), 350);
    return () => clearTimeout(t);
  }, [preview]);

  const tabs: ['tests' | 'console' | 'preview', string][] = [
    ...(preview !== null ? [['preview', 'Page'] as ['preview', string]] : []),
    ['tests', run?.ok ? `${challenge.lang === 'web' ? 'Checks' : 'Tests'} ${run.passed}/${run.total}` : challenge.lang === 'web' ? 'Checks' : 'Tests'],
    ...(challenge.lang !== 'web' ? [['console', 'Console'] as ['console', string]] : []),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-1 border-b border-slate-200 px-2">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" onClick={() => onTab(k)} className={`relative px-3 py-2.5 text-[12.5px] font-bold ${tab === k ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
            {label}
            {tab === k && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: accent }} />}
          </button>
        ))}
        {run && <span className="ml-auto pr-2 text-[11px] text-slate-400">{run.ms} ms</span>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'preview' && preview !== null && (
          <iframe title="Your page" sandbox="allow-scripts" srcDoc={doc} className="h-full min-h-[240px] w-full bg-white" />
        )}

        {tab === 'console' && (
          <div className="min-h-full bg-[#0B1020] px-4 py-3 font-mono text-[12.5px] leading-relaxed">
            {!run && <p className="text-slate-500">Anything your code prints shows up here.</p>}
            {run && run.logs.map((l, i) => <p key={i} className="whitespace-pre-wrap text-slate-200">{l}</p>)}
            {run && !run.ok && <p className="mt-1 whitespace-pre-wrap text-rose-300">{run.error}{run.line ? `  (line ${run.line})` : ''}</p>}
            {run && run.ok && !run.logs.length && <p className="text-slate-500">(nothing printed)</p>}
          </div>
        )}

        {tab === 'tests' && (
          <div className="px-4 py-3">
            <AnimatePresence>
              {solved && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white"><Trophy className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold text-emerald-900">Solved!{solved.gained > 0 ? ` +${solved.gained} XP` : ''}</p>
                    <p className="text-[12px] text-emerald-800">
                      {solved.score < 100 ? `${solved.score}% of the XP — hints used. ` : ''}
                      {solved.saved === null ? 'Saving…' : solved.saved ? 'Saved to your progress.' : 'Not saved this time.'}
                    </p>
                  </div>
                  <button type="button" onClick={onNext} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-extrabold text-white" style={{ background: accent }}>
                    Next challenge <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {running && (
              <p className="flex items-center gap-2 text-[13px] text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> {pyLoading ? 'Starting Python — the first time takes a few seconds…' : 'Running…'}</p>
            )}
            {!running && !run && (
              <p className="text-[13px] text-slate-500">Press <span className="font-bold text-slate-700">{challenge.lang === 'web' ? 'Run checks' : 'Run tests'}</span> (or Ctrl + Enter) to see how your code does.</p>
            )}
            {!running && run && !run.ok && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
                <p className="text-[13px] font-extrabold text-rose-800">{run.timedOut ? 'Your code took too long' : `Your code stopped with an error${run.line ? ` on line ${run.line}` : ''}`}</p>
                <p className="mt-1 whitespace-pre-wrap font-mono text-[12.5px] text-rose-900">{run.error}</p>
              </div>
            )}
            {!running && run && run.ok && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(run.passed / Math.max(1, run.total)) * 100}%`, background: run.passed === run.total ? '#10B981' : '#F59E0B' }} />
                  </div>
                  <span className={`text-[12.5px] font-extrabold ${run.passed === run.total ? 'text-emerald-700' : 'text-amber-700'}`}>{run.passed}/{run.total} passed</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {run.results.map((r) => (
                    <li key={r.index} className="flex items-start gap-2.5 py-2">
                      {r.pass ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
                      <div className="min-w-0 flex-1">
                        <p className={`break-words text-[13px] ${isCode(challenge) && !r.hidden && r.label !== 'Output' ? 'font-mono' : 'font-semibold'} text-slate-800`}>{r.label}</p>
                        {!r.pass && r.error && <p className="mt-0.5 font-mono text-[12px] text-rose-700">{r.error}</p>}
                        {!r.pass && !r.error && r.label === 'Output' && (
                          <div className="mt-1 grid gap-2 sm:grid-cols-2">
                            <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Expected</p><pre className="mt-0.5 overflow-x-auto rounded-lg bg-slate-50 px-2 py-1.5 font-mono text-[12px] text-slate-800 ring-1 ring-slate-200">{r.expected}</pre></div>
                            <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your output</p><pre className="mt-0.5 overflow-x-auto rounded-lg bg-rose-50 px-2 py-1.5 font-mono text-[12px] text-rose-900 ring-1 ring-rose-200">{r.got || '(nothing)'}</pre></div>
                          </div>
                        )}
                        {!r.pass && !r.error && r.label !== 'Output' && (r.expected !== undefined || r.got !== undefined) && (
                          <p className="mt-0.5 font-mono text-[12px] text-slate-600">
                            {r.expected !== undefined && <>expected <span className="font-bold text-emerald-700">{r.expected}</span></>}
                            {r.got !== undefined && <>{r.expected !== undefined ? ', ' : ''}{challenge.lang === 'web' ? '' : 'got '}<span className="font-bold text-rose-700">{r.got}</span></>}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
