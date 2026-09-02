'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ClipboardList, ChevronDown } from 'lucide-react';
import { REDUCED, SPRING_QUICK } from '@/lib/motion';
import SubjectPicker, { type GradeChoice, type ScopePrice } from './subject-picker';
import ModuleOutline from '@/components/curriculum/module-outline';

/**
 * SARIRO — Grade picker + the year that grade actually contains
 * =========================================================
 * These two things are one component because they answer one question. A parent
 * picks a grade, and the very next thing they want is *what will my child be
 * taught?* — so the outline has to move when the picker moves.
 *
 * It did not. The outline used to be rendered by the server page from
 * `grades[0]`, which for Mathematics is grade 1, and it never changed. That was
 * invisible while every grade rendered "Module 1 … Module 8", and became a lie
 * the moment real titles were authored: choose grade 8, read grade 1's plan.
 *
 * Owning the grade here and passing it down is what keeps the two in step.
 */

export interface LessonItem {
  /** Global 1–48 within the grade. What a parent counts. */
  number: number;
  title: string;
  isTest: boolean;
}

export interface ModuleSummary {
  num: number;
  title: string;
  /** What the learner can do afterwards. Undefined until authored. */
  outcome?: string;
  /** Teachable lessons — excludes any assessment sitting in this module. */
  lessons: number;
  tests: number;
  /** The actual week-by-week titles, revealed when the module is opened. */
  items: LessonItem[];
}

export interface GradePlan {
  modules: ModuleSummary[];
  testCount: number;
  /** True once real module titles exist for this grade. */
  authored: boolean;
}

export interface SubjectPlanProps {
  subjectSlug: string;
  subjectName: string;
  accent: string;
  grades: GradeChoice[];
  prices: Record<string, ScopePrice>;
  /** Keyed by grade number. Every offered grade is present. */
  plans: Record<number, GradePlan>;
  totalSlots: number;
}

export default function SubjectPlan({
  subjectSlug,
  subjectName,
  accent,
  grades,
  prices,
  plans,
  totalSlots,
}: SubjectPlanProps) {
  const reduced = useReducedMotion();
  const spring = reduced ? REDUCED : SPRING_QUICK;

  // Default to the middle of the range: most enquiries are for older children,
  // and a default of grade 1 makes the product look like it is for toddlers.
  const [grade, setGrade] = useState(
    grades[Math.floor(grades.length / 2)]?.grade ?? grades[0].grade
  );

  const plan = plans[grade] ?? plans[grades[0].grade];

  /**
   * "This year" or "the whole thing".
   *
   * The picker above answers "what does my child get next term". It could not
   * answer the other question people ask about a subject called "Maths Beyond
   * School" — what does the WHOLE thing cover? The only way to find out was to
   * step the grade selector through twelve years, one at a time, holding the
   * shape of it in your head.
   *
   * Every grade's plan is already in `plans`, so the outline costs no extra
   * data — it was simply never rendered. Defaults to the single year, because
   * that is what a parent buying next term is actually choosing.
   */
  const [showAll, setShowAll] = useState(false);

  /**
   * Which module is open, by number. One at a time.
   *
   * The card said "6 lessons" and stopped there, so the honest question a
   * parent asks next — which six? — had no answer anywhere on the site, even
   * though the titles were already built one function call away.
   *
   * Single-open rather than many: eight modules expanded at once is 48 lines
   * of list, which is the contents page this card was deliberately not.
   */
  const [openModule, setOpenModule] = useState<number | null>(null);

  return (
    <>
      {/* ── choose + price ───────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SubjectPicker
            subjectSlug={subjectSlug}
            subjectName={subjectName}
            accent={accent}
            grades={grades}
            prices={prices}
            grade={grade}
            onGradeChange={setGrade}
          />
        </div>
      </section>

      {/* ── what a year looks like ───────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-slate-900">
              {showAll ? `The whole ${subjectName} outline` : `What Grade ${grade} looks like`}
            </h2>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shrink-0">
              {[
                { key: false, label: `Grade ${grade}` },
                { key: true, label: 'Every grade' },
              ].map((opt) => (
                <button
                  key={String(opt.key)}
                  type="button"
                  onClick={() => setShowAll(opt.key)}
                  aria-pressed={showAll === opt.key}
                  className="min-h-[36px] px-3 rounded-[6px] text-[13px] font-bold transition-colors"
                  style={
                    showAll === opt.key
                      ? { background: accent, color: '#fff' }
                      : { color: '#64748b' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mb-7">
            {showAll ? (
              <>
                Every year of {subjectName}, end to end — {grades.length} grades,{' '}
                {grades.length * plan.modules.length} modules,{' '}
                {(totalSlots * grades.length).toLocaleString()} classes. This is the full scope of
                the subject, not a sample.
              </>
            ) : (
              <>
                {totalSlots} classes across {plan.modules.length} modules — one class a week, four a
                month. {plan.testCount} of those classes are assessments rather than lessons, so you
                always know whether it is working.
              </>
            )}
          </p>

          {showAll ? (
            /* The whole subject. Grouped by grade so the progression is
               readable as a progression — a flat list of ninety-six module
               titles is data, not an outline. */
            <div className="space-y-6">
              {grades.map((g) => {
                const gp = plans[g.grade];
                if (!gp) return null;
                return (
                  <div key={g.grade}>
                    <div className="flex items-baseline gap-2.5 mb-2.5">
                      <h3
                        className="text-[15px] font-extrabold text-slate-900 tabular-nums"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        Grade {g.grade}
                      </h3>
                      <span className="text-[12.5px] text-slate-500 tabular-nums">
                        {gp.modules.length} modules · {totalSlots} classes
                      </span>
                    </div>
                    <ol className="grid gap-1.5 sm:grid-cols-2">
                      {gp.modules.map((m) => (
                        <li
                          key={m.num}
                          className="flex items-center gap-2.5 rounded-lg bg-white border border-slate-200 px-3 py-2"
                        >
                          <span
                            className="shrink-0 w-6 h-6 rounded text-[11px] font-bold flex items-center justify-center tabular-nums"
                            style={{ background: `${accent}12`, color: accent }}
                          >
                            {m.num}
                          </span>
                          <span className="flex-1 text-[13.5px] text-slate-800 leading-snug">
                            {m.title}
                          </span>
                          {m.tests > 0 && (
                            <ClipboardList
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: accent }}
                              aria-label="includes an assessment"
                            />
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          ) : (
            <ModuleOutline key={grade} accent={accent} modules={plan.modules} />
          )}

          {/* Only promise a teacher will finalise the titles where they genuinely
              are not written yet. Saying it under a real, board-aligned outline
              reads as though we have not decided what we teach. */}
          <p className="text-[13px] text-slate-500 mt-5">
            {plan.authored
              ? 'Your teacher paces these to your child’s school board and adjusts where they need longer.'
              : 'Module titles are finalised with your child’s teacher to match their school board.'}
          </p>
        </div>
      </section>
    </>
  );
}
