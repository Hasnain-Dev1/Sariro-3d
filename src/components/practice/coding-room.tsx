'use client';

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Bug, Check, Eye, Lightbulb, Loader2, Play, RotateCcw, X } from 'lucide-react';
import { KATAS, katasFor, type Kata } from '@/lib/practice/coding/katas';
import { runKata, type RunResult } from '@/lib/practice/coding/run';
import { fetchRoomAttempts, logPractice } from '@/lib/practice/log';
import type { TopicAttempt } from '@/lib/practice/mastery';

/**
 * SARIRO — the coding practice room
 * ============================================================================
 * Pick a kata, write the function, run it against the tests. Visible tests show
 * what went in, what was expected and what came back; hidden ones only pass or
 * fail, so a solution cannot be written to the test. Drafts are kept on the
 * device per kata. The worked solution unlocks after three runs — looking
 * sooner teaches less.
 */

const LEVEL_NAME = ['', 'Elementary', 'Beginner', 'Intermediate', 'Advanced'];
const draftKey = (id: string) => `sariro.kata.${id}`;
const show = (v: unknown) => (v === undefined ? 'undefined' : JSON.stringify(v));

export default function CodingRoom({ level, accent }: { level: number; accent: string }) {
  const [attempts, setAttempts] = useState<TopicAttempt[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [kata, setKata] = useState<Kata | null>(null);

  const refresh = useCallback(async () => setAttempts(await fetchRoomAttempts('coding')), []);
  useEffect(() => { void refresh(); }, [refresh]);

  const solved = useMemo(() => new Set(attempts.filter((a) => a.score >= 100).map((a) => a.topic)), [attempts]);
  const list = showAll ? [...KATAS].sort((a, b) => a.level - b.level) : katasFor(level);

  if (kata) {
    return <KataView kata={kata} accent={accent} onBack={() => { setKata(null); void refresh(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-slate-600">
          {solved.size} solved · JavaScript runs right here in your browser. <span className="text-slate-400">(Python is coming.)</span>
        </p>
        <button type="button" onClick={() => setShowAll((s) => !s)} className="text-[12.5px] font-bold" style={{ color: accent }}>
          {showAll ? `Show my level (${LEVEL_NAME[level]})` : 'Show every level'}
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {list.map((k) => (
          <button key={k.id} type="button" onClick={() => setKata(k)} className="text-left rounded-xl border border-slate-200 bg-white p-3.5 hover:border-slate-300 flex items-start gap-3">
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${solved.has(k.id) ? 'bg-emerald-100 text-emerald-700' : ''}`} style={solved.has(k.id) ? undefined : { background: `${accent}14`, color: accent }}>
              {solved.has(k.id) ? <Check className="w-4 h-4" /> : k.kind === 'fix' ? <Bug className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-bold text-slate-900">{k.title}</span>
              <span className="block text-[12px] text-slate-500">{LEVEL_NAME[k.level]} · {k.kind === 'fix' ? 'Fix the bug' : 'Write it'} · {k.concepts.slice(0, 2).join(', ')}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function KataView({ kata, accent, onBack }: { kata: Kata; accent: string; onBack: () => void }) {
  const [code, setCode] = useState(kata.starter);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [runs, setRuns] = useState(0);
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [logged, setLogged] = useState<'saved' | 'not-saved' | null>(null);

  /* A draft left on this device, after mount (storage is not on the server). */
  useEffect(() => {
    try {
      const d = window.localStorage.getItem(draftKey(kata.id));
      if (d) setCode(d);
    } catch { /* private mode */ }
  }, [kata.id]);
  useEffect(() => {
    try { window.localStorage.setItem(draftKey(kata.id), code); } catch { /* ignore */ }
  }, [kata.id, code]);

  const run = async () => {
    setRunning(true);
    const r = await runKata(code, kata);
    setRunning(false);
    setResult(r);
    const n = runs + 1;
    setRuns(n);
    const score = r.ok ? (r.passed / r.total) * 100 : 0;
    // Every all-pass, and the first run of a visit, go into the history.
    if (score === 100 || n === 1) {
      const ok = await logPractice({ room: 'coding', topic: kata.id, kind: 'code', drillId: kata.id, score, metrics: { runs: n, hints, passed: r.ok ? r.passed : 0 } });
      setLogged(ok ? 'saved' : 'not-saved');
    }
  };

  /* Tab indents instead of leaving the editor. */
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const t = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = t;
      const next = code.slice(0, s) + '  ' + code.slice(en);
      setCode(next);
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; });
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void run();
    }
  };

  const allPass = result?.ok && result.passed === result.total;

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> All katas
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}>
          {LEVEL_NAME[kata.level]} · {kata.kind === 'fix' ? 'Fix the bug' : 'Write the function'}
        </p>
        <h2 className="text-xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-jakarta)' }}>{kata.title}</h2>
        <p className="text-[15px] text-slate-700 mt-2">{kata.prompt.replace(/`/g, '')}</p>
        <div className="mt-3 text-[12.5px] text-slate-500">
          <span className="font-bold text-slate-600">Examples: </span>
          {kata.tests.filter((t) => t.visible).map((t, i) => (
            <code key={i} className="mr-3 whitespace-nowrap">{kata.fnName}({t.args.map(show).join(', ')}) → {show(t.expected)}</code>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Your code"
          className="w-full min-h-[240px] bg-transparent text-slate-100 font-mono text-[13.5px] leading-6 p-4 outline-none resize-y"
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 px-3 py-2.5">
          <button type="button" onClick={() => void run()} disabled={running} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-white text-sm font-bold disabled:opacity-60" style={{ background: accent }}>
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run tests
          </button>
          <span className="text-[11.5px] text-slate-400 hidden sm:inline">Ctrl + Enter</span>
          {hints < kata.hints.length && (
            <button type="button" onClick={() => setHints((h) => h + 1)} className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-slate-300 text-sm font-bold hover:bg-slate-800">
              <Lightbulb className="w-4 h-4" /> Hint
            </button>
          )}
          <button type="button" onClick={() => { setCode(kata.starter); setResult(null); }} className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-slate-400 text-sm font-bold hover:bg-slate-800 ml-auto">
            <RotateCcw className="w-4 h-4" /> Start over
          </button>
        </div>
      </div>

      {hints > 0 && (
        <ul className="space-y-1.5">
          {kata.hints.slice(0, hints).map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] text-slate-700"><Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />{h.replace(/`/g, '')}</li>
          ))}
        </ul>
      )}

      {result && !result.ok && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-[14px] text-rose-800 font-semibold">{result.error}</div>
      )}

      {result?.ok && (
        <div className={`rounded-2xl border p-4 ${allPass ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <p className={`text-[15px] font-extrabold ${allPass ? 'text-emerald-800' : 'text-slate-900'}`}>
            {allPass ? 'Every test passes — solved.' : `${result.passed} of ${result.total} tests pass.`}
            {logged && <span className="ml-2 text-[12px] font-semibold text-slate-500">{logged === 'saved' ? 'Saved.' : 'Not saved this time.'}</span>}
          </p>
          <ul className="mt-2 space-y-1">
            {result.results.map((r) => {
              const t = kata.tests[r.i];
              return (
                <li key={r.i} className="flex items-start gap-2 text-[13px]">
                  {r.pass ? <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> : <X className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
                  {t.visible ? (
                    <code className="text-slate-700 break-all">
                      {kata.fnName}({t.args.map(show).join(', ')}) → expected {show(t.expected)}
                      {!r.pass && <span className="text-rose-700">, got {r.error ?? r.got}</span>}
                    </code>
                  ) : (
                    <span className="text-slate-600">Hidden test {r.i + 1}{!r.pass && r.error ? ` — ${r.error}` : ''}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {result.logs.length > 0 && (
            <pre className="mt-3 rounded-lg bg-slate-900 text-slate-200 text-[12px] p-3 overflow-x-auto">{result.logs.join('\n')}</pre>
          )}
        </div>
      )}

      {(runs >= 3 || allPass) && (
        <div>
          {!showSolution ? (
            <button type="button" onClick={() => setShowSolution(true)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">
              <Eye className="w-4 h-4" /> {allPass ? 'Compare with our solution' : 'Show a solution'}
            </button>
          ) : (
            <pre className="rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[13px] p-4 overflow-x-auto">{kata.solution}</pre>
          )}
        </div>
      )}
    </div>
  );
}
