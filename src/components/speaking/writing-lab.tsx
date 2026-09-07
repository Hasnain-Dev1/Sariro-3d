'use client';

import { useMemo, useState } from 'react';
import { PenLine, RotateCcw, Sparkles } from 'lucide-react';
import { analyseWriting } from '@/lib/speaking/writing';

/**
 * SARIRO — a writing coach that costs nothing to run
 * ============================================================================
 * Type a paragraph, get it read back. Sentence variety, repeated openers,
 * hedges, passive voice, shape, readability — every one of them countable, and
 * every one fixable in the next draft.
 *
 * ── Why there is no submit button and no waiting ────────────────────────────
 * It analyses as they type, because the whole value is in the rewrite. A child
 * who has to press a button and wait writes one draft; a child who can watch
 * "every sentence is the same length" disappear as they fix it writes six. The
 * analyser is arithmetic over strings, so there is nothing to wait for.
 *
 * ── What it will not do ─────────────────────────────────────────────────────
 * Grade the ideas. There is no score for "quality" here, and no model deciding
 * whether an argument is good. A number on a child's thinking is a number they
 * will argue with and learn nothing from. This grades the craft, which is the
 * part a lesson can actually teach.
 */

const PROMPTS = [
  'Describe a place you know well, without naming it. Let the reader work out where it is.',
  'Write about a time you changed your mind about something.',
  'Explain something you understand well to somebody who knows nothing about it.',
  'Describe the last five minutes before something you were dreading.',
  'Argue for something you do not actually believe. Make it convincing.',
];

export default function WritingLab({
  prompt,
  minWords = 60,
}: {
  prompt?: string;
  minWords?: number;
}) {
  const [text, setText] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const task = prompt ?? PROMPTS[promptIndex];

  const report = useMemo(() => analyseWriting(text), [text]);
  const enough = report.words >= minWords;

  const tone = (kind: 'good' | 'watch' | 'fix') =>
    kind === 'good' ? 'bg-green-50 border-green-200 text-green-900'
    : kind === 'fix' ? 'bg-amber-50 border-amber-200 text-amber-900'
    : 'bg-slate-50 border-slate-200 text-slate-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <PenLine className="w-4 h-4 text-violet-600" />
            Writing practice
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task}</p>
        </div>
        {!prompt && (
          <button
            onClick={() => { setPromptIndex((i) => (i + 1) % PROMPTS.length); }}
            className="shrink-0 h-8 px-2.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <RotateCcw className="w-3 h-3" /> Another
          </button>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={9}
        placeholder="Start writing. Nothing is sent anywhere — this runs on your own device."
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        style={{ fontFamily: 'var(--font-inter)' }}
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span>{report.words} words</span>
        <span>{report.sentences} {report.sentences === 1 ? 'sentence' : 'sentences'}</span>
        {report.sentences > 0 && <span>avg {report.sentenceLength.average} words</span>}
        {report.readability.grade > 0 && <span>reads like: {report.readability.summary}</span>}
        {!enough && <span className="text-amber-700">{minWords - report.words} more words for a proper read</span>}
      </div>

      {enough && (
        <>
          {/* The numbers a writer can act on, before the sentences about them. */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Shortest', value: `${report.sentenceLength.shortest}w` },
              { label: 'Longest', value: `${report.sentenceLength.longest}w` },
              { label: 'Variety', value: String(report.sentenceLength.variety) },
              { label: 'Soft words', value: String(report.hedging.count) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {s.label}
                </p>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {report.notes.map((n, i) => (
              <p key={i} className={`text-xs leading-relaxed rounded-xl border px-3 py-2 ${tone(n.kind)}`}>
                {n.text}
              </p>
            ))}
          </div>

          {report.passive.examples.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Sentences that hide who did it
              </p>
              {report.passive.examples.map((s, i) => (
                <p key={i} className="text-xs text-slate-600 italic border-l-2 border-slate-200 pl-2.5 py-0.5">{s}</p>
              ))}
            </div>
          )}

          <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            This reads the craft, not the ideas. The ideas are yours.
          </p>
        </>
      )}
    </div>
  );
}
