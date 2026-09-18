'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, Lightbulb, Loader2, RotateCcw, X } from 'lucide-react';
import { checkAnswer, type Response } from '@/lib/practice/check';
import type { CheckResult, Item } from '@/lib/practice/types';

/**
 * SARIRO — a set of practice questions, one at a time
 * ============================================================================
 * The same screen for every room's ordinary questions: read, answer, find out
 * straight away, see how it is done, next. A "nearly" (right amount, wrong
 * form — not simplified, no unit) gets one more go before it counts, because
 * the child was right about the maths.
 *
 * Scoring: correct first time 1, correct on the second go ½, a hint costs ¼ of
 * that question. The set's score is the average, 0–100.
 */

export interface SetResult {
  score: number;
  correct: number;
  total: number;
  hints: number;
  durationMs: number;
  /** Each question's topic and what it earned (0–1), for per-topic progress. */
  perItem: { topic: string; id: string; points: number }[];
}

interface Props {
  items: Item[];
  accent: string;
  onFinish: (result: SetResult) => void;
  onAgain: () => void;
  /** Shown on the summary: "Saved to your progress" or why not. */
  saved?: 'saving' | 'saved' | 'not-saved' | null;
}

type Phase = 'answering' | 'answered';

export default function QuestionSet({ items, accent, onFinish, onAgain, saved }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [text, setText] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [coeffs, setCoeffs] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<CheckResult | null>(null);
  const [tries, setTries] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [points, setPoints] = useState<number[]>([]);
  const [hintTotal, setHintTotal] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const item = items[index];
  const answer = item?.answer;

  /* Fresh inputs for each question. */
  useEffect(() => {
    if (!item) return;
    setPhase('answering');
    setText('');
    setChoice(null);
    setVerdict(null);
    setTries(0);
    setHintsShown(0);
    setOrder(item.answer.kind === 'order' ? item.answer.items.map((_, i) => i) : []);
    setCoeffs(item.answer.kind === 'coefficients' ? item.answer.species.map(() => '') : []);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [item]);

  const response = useMemo<Response | null>(() => {
    if (!answer) return null;
    if (answer.kind === 'choice') return choice === null ? null : { kind: 'choice', index: choice };
    if (answer.kind === 'order') return { kind: 'order', order };
    if (answer.kind === 'coefficients') {
      if (coeffs.some((c) => !c.trim())) return null;
      return { kind: 'coefficients', values: coeffs.map((c) => Number(c)) };
    }
    return text.trim() ? { kind: 'text', text } : null;
  }, [answer, choice, order, coeffs, text]);

  if (!item || !answer) return null;

  const settle = (earned: number) => {
    const withHints = Math.max(0, earned - 0.25 * hintsShown);
    setPoints((p) => [...p, withHints]);
    setHintTotal((h) => h + hintsShown);
    setPhase('answered');
  };

  const check = () => {
    if (!response || phase !== 'answering') return;
    const v = checkAnswer(answer, response);
    setVerdict(v);
    const attempt = tries + 1;
    setTries(attempt);
    if (v.correct) settle(attempt === 1 ? 1 : 0.5);
    else if (v.nearly && attempt === 1) return; // one more go
    else settle(0);
  };

  const next = () => {
    if (index + 1 < items.length) {
      setIndex(index + 1);
      return;
    }
    const all = points;
    const score = Math.round((all.reduce((s, p) => s + p, 0) / items.length) * 100);
    setDone(true);
    onFinish({
      score,
      correct: all.filter((p) => p > 0).length,
      total: items.length,
      hints: hintTotal,
      durationMs: Date.now() - started.current,
      perItem: items.map((it, i) => ({ topic: it.topic, id: it.id, points: all[i] ?? 0 })),
    });
  };

  if (done) {
    const score = Math.round((points.reduce((s, p) => s + p, 0) / items.length) * 100);
    const correct = points.filter((p) => p > 0).length;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>Set complete</p>
        <p className="text-5xl font-extrabold mt-2" style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}>{score}%</p>
        <p className="text-slate-600 mt-2 text-sm">{correct} of {items.length} right{hintTotal ? ` · ${hintTotal} hint${hintTotal === 1 ? '' : 's'} used` : ''}</p>
        <p className="text-[12.5px] mt-2 text-slate-500">
          {saved === 'saving' ? 'Saving to your progress…' : saved === 'saved' ? 'Saved to your progress.' : saved === 'not-saved' ? 'Not saved this time — your practice still counts.' : ''}
        </p>
        <p className="text-sm text-slate-700 mt-4 max-w-md mx-auto">
          {score >= 90 ? 'Excellent — the next set will be harder.' : score >= 60 ? 'Good. Another set will make it stick.' : 'Worth another go — read the worked answers, then try a fresh set.'}
        </p>
        <button type="button" onClick={onAgain} className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-bold" style={{ background: accent }}>
          <RotateCcw className="w-4 h-4" /> Another set
        </button>
      </div>
    );
  }

  const inputKind = answer.kind;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] font-bold text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
          Question {index + 1} of {items.length}
        </span>
        <div className="flex gap-1" aria-hidden>
          {items.map((_, i) => (
            <span key={i} className="h-1.5 w-5 rounded-full" style={{ background: i < index ? accent : i === index ? `${accent}80` : '#E2E8F0' }} />
          ))}
        </div>
      </div>

      <p className="text-lg sm:text-xl font-bold text-slate-900 whitespace-pre-line leading-relaxed" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {item.prompt}
      </p>

      <div className="mt-5">
        {inputKind === 'choice' && answer.kind === 'choice' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {answer.options.map((opt, i) => {
              const picked = choice === i;
              const isRight = phase === 'answered' && i === answer.correct;
              const isWrongPick = phase === 'answered' && picked && i !== answer.correct;
              return (
                <button
                  key={opt + i}
                  type="button"
                  disabled={phase === 'answered'}
                  onClick={() => setChoice(i)}
                  className={`min-h-[48px] rounded-xl border-2 px-4 text-left text-[15px] font-bold transition-colors ${
                    isRight ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : isWrongPick ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : picked ? 'text-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                  style={picked && phase === 'answering' ? { borderColor: accent, background: `${accent}10` } : undefined}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {inputKind === 'order' && answer.kind === 'order' && (
          <ol className="space-y-2">
            {order.map((itemIndex, pos) => (
              <li key={itemIndex} className="flex items-center gap-2 rounded-xl border-2 border-slate-200 px-3 py-2">
                <span className="w-6 text-sm font-bold text-slate-400">{pos + 1}.</span>
                <span className="flex-1 text-[15px] text-slate-800">{answer.items[itemIndex]}</span>
                <button type="button" aria-label="Move up" disabled={pos === 0 || phase === 'answered'} onClick={() => setOrder((o) => { const n = [...o]; [n[pos - 1], n[pos]] = [n[pos], n[pos - 1]]; return n; })} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                <button type="button" aria-label="Move down" disabled={pos === order.length - 1 || phase === 'answered'} onClick={() => setOrder((o) => { const n = [...o]; [n[pos + 1], n[pos]] = [n[pos], n[pos + 1]]; return n; })} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              </li>
            ))}
          </ol>
        )}

        {inputKind === 'coefficients' && answer.kind === 'coefficients' && (
          <div className="flex flex-wrap items-center gap-2 text-lg font-bold text-slate-800">
            {answer.species.map((sp, i) => (
              <span key={sp + i} className="inline-flex items-center gap-1">
                {i > 0 && <span className="text-slate-400 mx-1">{i === answer.arrow ? '→' : '+'}</span>}
                <input
                  inputMode="numeric"
                  value={coeffs[i] ?? ''}
                  disabled={phase === 'answered'}
                  onChange={(e) => setCoeffs((c) => c.map((v, j) => (j === i ? e.target.value.replace(/\D/g, '') : v)))}
                  className="w-12 h-11 rounded-lg border-2 border-slate-200 text-center"
                  aria-label={`Coefficient for ${sp}`}
                />
                <span>{sp}</span>
              </span>
            ))}
          </div>
        )}

        {(inputKind === 'number' || inputKind === 'quantity' || inputKind === 'expression' || inputKind === 'text') && (
          <form onSubmit={(e) => { e.preventDefault(); if (phase === 'answering') check(); else next(); }}>
            <input
              ref={inputRef}
              value={text}
              disabled={phase === 'answered'}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              inputMode={inputKind === 'number' ? 'decimal' : 'text'}
              placeholder="Your answer"
              className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 text-lg font-bold text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-50"
              aria-label="Your answer"
            />
            {item.inputHint && <p className="mt-1.5 text-[12.5px] text-slate-500">{item.inputHint}</p>}
          </form>
        )}
      </div>

      {verdict && (
        <div className={`mt-4 rounded-xl px-4 py-3 text-[14px] font-semibold flex items-start gap-2 ${
          verdict.correct ? 'bg-emerald-50 text-emerald-800' : verdict.nearly && phase === 'answering' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
        }`}>
          {verdict.correct ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
          <span>{verdict.message}{verdict.nearly && phase === 'answering' ? ' Have another go.' : ''}</span>
        </div>
      )}

      {phase === 'answering' && hintsShown > 0 && (
        <ul className="mt-4 space-y-1.5">
          {item.hints.slice(0, hintsShown).map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-[14px] text-slate-700"><Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />{h}</li>
          ))}
        </ul>
      )}

      {phase === 'answered' && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>How it is done</p>
          <p className="text-[14.5px] text-slate-800 whitespace-pre-line">{item.solution}</p>
          {!verdict?.correct && <p className="mt-2 text-[14px] font-bold text-slate-900">Answer: {item.answerText}</p>}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {phase === 'answering' ? (
          <>
            <button type="button" onClick={check} disabled={!response} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: accent }}>
              <Check className="w-4 h-4" /> Check
            </button>
            {hintsShown < item.hints.length && (
              <button type="button" onClick={() => setHintsShown((n) => n + 1)} className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
                <Lightbulb className="w-4 h-4" /> Hint{item.hints.length > 1 ? ` (${hintsShown + 1}/${item.hints.length})` : ''}
              </button>
            )}
            <button type="button" onClick={() => { setVerdict({ correct: false, message: 'Skipped.' }); settle(0); }} className="ml-auto text-[13px] font-bold text-slate-400 hover:text-slate-600">
              Skip
            </button>
          </>
        ) : (
          <button type="button" onClick={next} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-bold" style={{ background: accent }} autoFocus>
            {index + 1 < items.length ? <>Next <ArrowRight className="w-4 h-4" /></> : <>See my score <ArrowRight className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
}

export function SetLoading() {
  return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" /></div>;
}
