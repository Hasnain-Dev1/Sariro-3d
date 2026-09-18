'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag, RotateCcw, TrendingUp, XCircle } from 'lucide-react';
import type { Response } from '@/lib/practice/check';
import type { Item } from '@/lib/practice/types';
import { markPaper, type TestPaper, type TestReport } from '@/lib/practice/maths/tests';

/**
 * SARIRO — sitting a timed test sheet or lesson quiz
 * ============================================================================
 * Like an exam, not like practice: no marking until it is handed in, move
 * freely between questions, a clock that counts down and hands the paper in
 * itself at zero. Then every answer is marked on the device and the report
 * shows the score, where the marks went, and what to do next — with each
 * question's right answer and working.
 */

interface Draft { text: string; choice: number | null }

function toResponse(item: Item, d: Draft | undefined): Response | null {
  if (!d) return null;
  if (item.answer.kind === 'choice') return d.choice === null ? null : { kind: 'choice', index: d.choice };
  return d.text.trim() ? { kind: 'text', text: d.text } : null;
}

const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, Math.floor(s) % 60)).padStart(2, '0')}`;

interface Props {
  paper: TestPaper;
  accent: string;
  onDone: (report: TestReport) => void;
  onExit: () => void;
}

export default function TestPaperView({ paper, accent, onDone, onExit }: Props) {
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [left, setLeft] = useState(paper.minutes * 60);
  const [report, setReport] = useState<TestReport | null>(null);
  const startedAt = useRef(0);
  const perQuestion = useRef<number[]>(paper.items.map(() => 0));
  const enteredAt = useRef(0);

  const item = paper.items[index];
  const draft = drafts[index] ?? { text: '', choice: null };
  const answeredCount = useMemo(() => paper.items.filter((it, i) => toResponse(it, drafts[i])).length, [paper.items, drafts]);

  const handIn = useCallback(() => {
    if (report) return;
    const now = Date.now();
    perQuestion.current[index] += (now - enteredAt.current) / 1000;
    const used = Math.round((now - startedAt.current) / 1000);
    const r = markPaper(paper, paper.items.map((it, i) => toResponse(it, drafts[i])), used, perQuestion.current.map((s) => Math.round(s)));
    setReport(r);
    onDone(r);
  }, [report, index, paper, drafts, onDone]);

  /* The clock. At zero the paper hands itself in. */
  useEffect(() => {
    if (!started || report) return;
    const t = setInterval(() => {
      const remaining = paper.minutes * 60 - (Date.now() - startedAt.current) / 1000;
      setLeft(remaining);
      if (remaining <= 0) handIn();
    }, 500);
    return () => clearInterval(t);
  }, [started, report, paper.minutes, handIn]);

  const go = (to: number) => {
    const now = Date.now();
    perQuestion.current[index] += (now - enteredAt.current) / 1000;
    enteredAt.current = now;
    setIndex(to);
  };

  const setDraft = (patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [index]: { ...draft, ...patch } }));

  if (!started) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 max-w-xl">
        <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}>{paper.id.includes(':quiz:') ? 'Lesson quiz' : 'Test sheet'}</p>
        <h2 className="text-xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-jakarta)' }}>{paper.title}</h2>
        <ul className="mt-3 space-y-1.5 text-[14px] text-slate-700">
          <li>{paper.items.length} questions · {paper.minutes} minutes</li>
          <li>Nothing is marked until you hand it in — move between questions freely.</li>
          <li>When the clock reaches zero, it hands itself in.</li>
        </ul>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => { startedAt.current = Date.now(); enteredAt.current = Date.now(); setStarted(true); }} className="h-11 px-5 rounded-xl text-white text-sm font-bold" style={{ background: accent }}>Start the clock</button>
          <button type="button" onClick={onExit} className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">Not now</button>
        </div>
      </div>
    );
  }

  if (report) return <ReportView paper={paper} report={report} accent={accent} drafts={drafts} onExit={onExit} />;

  const low = left < 60;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-bold text-slate-900">{paper.title}</p>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-extrabold tabular-nums ${low ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
          <Clock className="w-4 h-4" /> {mmss(left)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5" role="navigation" aria-label="Questions">
        {paper.items.map((it, i) => {
          const done = !!toResponse(it, drafts[i]);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => go(i)}
              aria-current={i === index}
              className={`w-9 h-9 rounded-lg text-[13px] font-bold border-2 ${i === index ? 'text-white' : done ? 'text-slate-800' : 'text-slate-400 border-slate-200'}`}
              style={i === index ? { background: accent, borderColor: accent } : done ? { borderColor: `${accent}80`, background: `${accent}12` } : undefined}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-[12px] font-bold text-slate-400 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>Question {index + 1} of {paper.items.length}</p>
        <p className="text-lg sm:text-xl font-bold text-slate-900 whitespace-pre-line leading-relaxed" style={{ fontFamily: 'var(--font-jakarta)' }}>{item.prompt}</p>
        <div className="mt-5">
          {item.answer.kind === 'choice' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.answer.options.map((opt, i) => (
                <button key={opt + i} type="button" onClick={() => setDraft({ choice: i })} className={`min-h-[48px] rounded-xl border-2 px-4 text-left text-[15px] font-bold ${draft.choice === i ? 'text-slate-900' : 'border-slate-200 text-slate-700'}`} style={draft.choice === i ? { borderColor: accent, background: `${accent}10` } : undefined}>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (index + 1 < paper.items.length) go(index + 1); }}>
              <input
                key={item.id}
                autoFocus
                value={draft.text}
                onChange={(e) => setDraft({ text: e.target.value })}
                autoComplete="off"
                spellCheck={false}
                placeholder="Your answer"
                aria-label="Your answer"
                className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 text-lg font-bold text-slate-900 outline-none focus:border-slate-400"
              />
              {item.inputHint && <p className="mt-1.5 text-[12.5px] text-slate-500">{item.inputHint}</p>}
            </form>
          )}
        </div>
        <div className="mt-5 flex items-center gap-2">
          <button type="button" disabled={index === 0} onClick={() => go(index - 1)} className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 disabled:opacity-30"><ArrowLeft className="w-4 h-4" /> Back</button>
          {index + 1 < paper.items.length && (
            <button type="button" onClick={() => go(index + 1)} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-700">Next <ArrowRight className="w-4 h-4" /></button>
          )}
          <button
            type="button"
            onClick={() => { if (answeredCount === paper.items.length || window.confirm(`${paper.items.length - answeredCount} question(s) are blank. Hand in anyway?`)) handIn(); }}
            className="ml-auto inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-white text-sm font-bold"
            style={{ background: accent }}
          >
            <Flag className="w-4 h-4" /> Hand in ({answeredCount}/{paper.items.length})
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportView({ paper, report, accent, drafts, onExit }: { paper: TestPaper; report: TestReport; accent: string; drafts: Record<number, Draft>; onExit: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>Your report · {paper.title}</p>
        <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-5xl font-extrabold" style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}>{report.score}%</p>
          <p className="text-[14px] text-slate-600 pb-1.5">
            {report.correct} of {report.total} right · {mmss(report.secondsUsed)} of {report.minutes}:00 used{report.unanswered ? ` · ${report.unanswered} blank` : ''}
          </p>
        </div>
        <p className="mt-3 text-[16px] font-bold text-slate-900">{report.headline}</p>
        <ul className="mt-3 space-y-1.5">
          {report.advice.map((a) => <li key={a} className="flex items-start gap-2 text-[14px] text-slate-700"><TrendingUp className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />{a}</li>)}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>By topic</p>
        <ul className="space-y-2">
          {report.byTopic.map((l) => {
            const pct = Math.round((l.correct / l.total) * 100);
            return (
              <li key={l.topic}>
                <div className="flex justify-between text-[13.5px]"><span className="font-bold text-slate-800">{l.title}</span><span className="text-slate-500 tabular-nums">{l.correct}/{l.total}</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#F43F5E' }} /></div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>Every question</p>
        <ol className="space-y-3">
          {paper.items.map((it, i) => {
            const m = report.marked[i];
            const given = it.answer.kind === 'choice' ? (drafts[i]?.choice != null ? it.answer.options[drafts[i]!.choice!] : '') : drafts[i]?.text ?? '';
            return (
              <li key={it.id} className="border-b border-slate-100 pb-3 last:border-0">
                <p className="flex items-start gap-2 text-[14px] font-bold text-slate-900">
                  {m.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
                  <span className="whitespace-pre-line">{i + 1}. {it.prompt}</span>
                </p>
                <p className="ml-6 text-[13px] text-slate-600">
                  Your answer: <b>{given || '—'}</b>{!m.correct && <> · Right answer: <b>{it.answerText}</b></>}
                </p>
                {!m.correct && <p className="ml-6 text-[13px] text-slate-500 mt-0.5">{it.solution}</p>}
              </li>
            );
          })}
        </ol>
      </div>

      <button type="button" onClick={onExit} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-bold" style={{ background: accent }}>
        <RotateCcw className="w-4 h-4" /> Back to the tests
      </button>
    </div>
  );
}
