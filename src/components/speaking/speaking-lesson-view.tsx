'use client';

import { useState } from 'react';
import { Lightbulb, Quote, Mic, ListChecks, Plus } from 'lucide-react';
import SpeakingLab, { type Drill } from '@/components/speaking/speaking-lab';
import type { SpeakingLesson } from '@/lib/speaking/lesson';

/**
 * SARIRO — a Public Speaking lesson, on screen
 * =========================================================
 * Deliberately not the five-tab coding layout. There is nothing to tab between:
 * a student reads a short idea, looks at one example, and then spends the rest
 * of the lesson speaking. Tabs would hide the part that matters behind the part
 * that does not.
 *
 * So it is one column, in the order the lesson is meant to happen, with the lab
 * sitting where the work is. The mentor's notes are not rendered here at all —
 * they are for the person teaching the class, and a student reading "watch for
 * students who are avoiding this" learns the wrong thing about themselves.
 */
export default function SpeakingLessonView({ lesson }: { lesson: SpeakingLesson }) {
  const [active, setActive] = useState<Drill>(lesson.drills[0]);
  const [showExtra, setShowExtra] = useState(false);

  const extras = lesson.extraDrills ?? [];

  return (
    <article className="space-y-6 max-w-3xl">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Lesson {lesson.number}
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {lesson.title}
        </h1>
        <p className="text-[15px] text-slate-600 mt-2 leading-[1.7]">{lesson.oneLine}</p>
      </header>

      {/* ── The idea ── */}
      <section className="space-y-3">
        <SectionLabel icon={<Lightbulb className="w-4 h-4" />}>The idea</SectionLabel>
        {lesson.idea.map((p, i) => (
          <p key={i} className="text-[14.5px] text-slate-700 leading-[1.75]">{p}</p>
        ))}
      </section>

      {/* ── The model ── */}
      {lesson.model && (
        <section className="space-y-3">
          <SectionLabel icon={<Quote className="w-4 h-4" />}>Somebody doing it</SectionLabel>
          <blockquote className="rounded-xl bg-slate-50 border-l-2 border-slate-300 px-4 py-3.5">
            <p className="text-[15px] text-slate-800 leading-[1.8]">{lesson.model.text}</p>
            {lesson.model.attribution && (
              <footer className="text-[12.5px] text-slate-500 mt-2">— {lesson.model.attribution}</footer>
            )}
          </blockquote>
          <ul className="space-y-1.5">
            {lesson.model.noticing.map((n, i) => (
              <li key={i} className="flex gap-2 text-[14px] text-slate-600 leading-[1.7]">
                <span className="text-slate-300 shrink-0">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── The practice. The lesson. ── */}
      <section className="space-y-3">
        <SectionLabel icon={<Mic className="w-4 h-4" />}>Say it out loud</SectionLabel>

        <div className="flex flex-wrap gap-1.5">
          {[...lesson.drills, ...(showExtra ? extras : [])].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActive(d)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${
                active.id === d.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {d.title}
            </button>
          ))}
          {/* Practice must not run out. A student who wants a fourth attempt is
              the one most likely to improve and the one most easily lost. */}
          {!showExtra && extras.length > 0 && (
            <button
              type="button"
              onClick={() => setShowExtra(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-slate-500 border border-dashed border-slate-300 hover:bg-slate-50"
            >
              <Plus className="w-3.5 h-3.5" /> {extras.length} more to practise on
            </button>
          )}
        </div>

        <SpeakingLab key={active.id} drill={active} />
      </section>

      {/* ── Their own check ── */}
      <section className="space-y-2">
        <SectionLabel icon={<ListChecks className="w-4 h-4" />}>Before you move on</SectionLabel>
        <ul className="space-y-1.5">
          {lesson.selfCheck.map((c, i) => (
            <li key={i} className="flex gap-2 text-[14px] text-slate-600 leading-[1.7]">
              <span className="text-slate-300 shrink-0">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
      <span className="text-slate-300">{icon}</span>
      {children}
    </p>
  );
}
