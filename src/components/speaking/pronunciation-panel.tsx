'use client';

import { useMemo, useState } from 'react';
import { Volume2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { analysePronunciation } from '@/lib/speaking/pronunciation';

/**
 * SARIRO — the word-by-word read-back
 * ============================================================================
 * The thing a parent screenshots. Not a score out of ten: the actual passage,
 * with the words that came out differently marked, and — when the evidence is
 * strong enough — the one sound to work on and how to make it.
 *
 * ── Why the passage is shown whole ──────────────────────────────────────────
 * A list of "words you got wrong" is a list of failures. The same information
 * inside the passage they just read is a map: mostly right, with three marks
 * on it. The second one gets read twice; the first gets closed.
 *
 * ── One sound, never a list ─────────────────────────────────────────────────
 * analysePronunciation only reports a substitution that repeated across
 * different words, and this shows the strongest one. A child cannot practise
 * "eleven words were wrong". They can practise putting their tongue between
 * their teeth.
 */

export default function PronunciationPanel({
  reference,
  transcript,
}: {
  reference: string;
  transcript: string;
}) {
  const report = useMemo(
    () => analysePronunciation({ reference, transcript }),
    [reference, transcript]
  );
  const [open, setOpen] = useState(false);

  if (!report.scored) return null;

  const top = report.patterns[0] ?? null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3
          className="text-sm font-extrabold text-slate-900 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <Volume2 className="w-4 h-4 text-rose-600" />
          How it came out
        </h3>
        <div className="text-right shrink-0">
          <p
            className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            {report.accuracy}%
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
            came through
          </p>
        </div>
      </div>

      {/* The passage, marked. Mostly right with three marks on it reads as a
          map; the same words in a list read as a page of failures. */}
      <p className="mt-3 text-[15px] leading-[2] text-slate-700" style={{ fontFamily: 'var(--font-inter)' }}>
        {report.words.map((w, i) => (
          <span key={i}>
            {w.ok ? (
              <span>{w.expected}</span>
            ) : w.heard ? (
              <span
                className="rounded px-1 bg-rose-50 text-rose-800 border-b-2 border-rose-300"
                title={`came out as “${w.heard}”`}
              >
                {w.expected}
              </span>
            ) : (
              /* Never reached. Not wrong — not said at all, which is a
                 different thing and must not look like a mistake. */
              <span className="text-slate-300">{w.expected}</span>
            )}{' '}
          </span>
        ))}
      </p>

      {report.notes.map((n, i) => (
        <p
          key={i}
          className={`mt-2 text-xs leading-relaxed rounded-xl border px-3 py-2 ${
            n.kind === 'good'
              ? 'bg-green-50 border-green-200 text-green-900'
              : n.kind === 'fix'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          {n.text}
        </p>
      ))}

      {/* The one sound, and how to make it. This is the part that is worth
          more than the percentage. */}
      {top && (
        <div className="mt-3 rounded-xl border-2 border-rose-200 bg-rose-50/60 px-3 py-3">
          <p
            className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Sparkles className="w-3 h-3" /> Practise this one sound
          </p>
          <p className="mt-1.5 text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            “{top.sound}” came out as “{top.heardAs}” — {top.count} of {top.opportunities} times
          </p>
          <p className="mt-1 text-xs text-slate-700 leading-relaxed">{top.note}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {top.examples.map((e, i) => (
              <span key={i} className="text-[11px] rounded-lg bg-white border border-rose-200 px-2 py-1">
                <span className="font-bold text-slate-800">{e.expected}</span>
                <span className="text-slate-400"> → </span>
                <span className="text-rose-700">{e.heard}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Everything else, folded away. A child wants the one thing; a parent
          sometimes wants the whole list, and a teacher always does. */}
      {report.patterns.length > 1 && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-3 text-[11px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {open ? 'Hide' : `${report.patterns.length - 1} more`}
          </button>
          {open && (
            <div className="mt-2 space-y-2">
              {report.patterns.slice(1).map((p, i) => (
                <div key={i} className="rounded-xl border border-slate-200 px-3 py-2">
                  <p className="text-xs font-bold text-slate-800">
                    “{p.sound}” → “{p.heardAs}” · {p.count} of {p.opportunities}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{p.note}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
        Measured on your own device from what the browser heard. It can miss things, so it only
        names a sound when the same slip happens more than once.
      </p>
    </div>
  );
}
