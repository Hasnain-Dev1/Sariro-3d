'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ClipboardList } from 'lucide-react';

/**
 * SARIRO — a module list you can open
 * =========================================================
 * The card says "6 lessons". The next question anybody asks is *which* six, and
 * for a while there was nowhere on the site that answered it — the titles were
 * built by `buildGradeSyllabus` and thrown away by the pages that displayed the
 * counts.
 *
 * That was fixed for school subjects and NOT for the focus courses, because the
 * two pages had their own copies of the same markup: `/subjects/[subject]`
 * through `subject-plan.tsx`, and `/subjects/focus/[topic]` inline. So Organic
 * Chemistry, Mechanics, Calculus, Algebra 1 and 2, Trigonometry and Public
 * Speaking — the newest and most expensive things Sariro sells — still listed
 * eight modules a visitor could not open.
 *
 * One component now, used by both. The next page that shows modules gets the
 * behaviour for free instead of inheriting a third copy that drifts.
 *
 * ── Choices worth keeping ───────────────────────────────────────────────────
 * • One module open at a time. Eight expanded modules is forty-eight lines of
 *   list, which is a contents page, not a card.
 * • Assessments are listed in place and marked. A test occupies a class slot
 *   like any other — it is scheduled, attended and paid for — so hiding it
 *   would misrepresent what somebody is buying.
 * • A real <button> with aria-expanded/aria-controls, so the keyboard and
 *   screen readers get the disclosure without any extra work.
 */

export interface OutlineLesson {
  /** Global number within the grade or course — what a learner counts. */
  number: number;
  title: string;
  isTest: boolean;
}

export interface OutlineModule {
  num: number;
  title: string;
  /** Teachable lessons, excluding any assessment in this module. */
  lessons: number;
  tests: number;
  items: OutlineLesson[];
}

export default function ModuleOutline({
  modules,
  accent,
}: {
  modules: OutlineModule[];
  accent: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <ol className="space-y-2.5">
      {modules.map((m) => {
        const isOpen = open === m.num;
        return (
          <li key={m.num} className="card card--compact !p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : m.num)}
              aria-expanded={isOpen}
              aria-controls={`module-${m.num}-lessons`}
              className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
              <span
                className="shrink-0 w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center tabular-nums"
                style={{ background: `${accent}12`, color: accent }}
              >
                {m.num}
              </span>
              <span className="flex-1 font-medium text-slate-800 text-[14.5px]">{m.title}</span>
              <span className="text-[12.5px] text-slate-500 tabular-nums shrink-0">
                {m.lessons} lessons
                {m.tests > 0 && (
                  <span
                    className="inline-flex items-center gap-1 ml-2 font-semibold"
                    style={{ color: accent }}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    test
                  </span>
                )}
              </span>
              <ChevronDown
                className="w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                aria-hidden
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`module-${m.num}-lessons`}
                  key="lessons"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <ol className="border-t border-slate-100 px-4 py-2.5">
                    {m.items.map((it) => (
                      <li key={it.number} className="flex items-baseline gap-3 py-1.5 text-[13.5px]">
                        <span className="w-6 shrink-0 text-right text-[11.5px] font-semibold tabular-nums text-slate-400">
                          {it.number}
                        </span>
                        <span
                          className={it.isTest ? 'font-semibold' : 'text-slate-700'}
                          style={it.isTest ? { color: accent } : undefined}
                        >
                          {it.title}
                        </span>
                        {it.isTest && (
                          <ClipboardList
                            className="w-3.5 h-3.5 shrink-0 self-center"
                            style={{ color: accent }}
                            aria-label="assessment"
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
