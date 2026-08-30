'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { REDUCED, SPRING_QUICK } from '@/lib/motion';
import SubjectPicker, { type GradeChoice, type ScopePrice } from './subject-picker';

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

export interface ModuleSummary {
  num: number;
  title: string;
  /** Teachable lessons — excludes any assessment sitting in this module. */
  lessons: number;
  tests: number;
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
          <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-slate-900 mb-2">
            What Grade {grade} looks like
          </h2>
          <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mb-7">
            {totalSlots} classes across {plan.modules.length} modules — one class a week, four a
            month. {plan.testCount} of those classes are assessments rather than lessons, so you
            always know whether it is working.
          </p>

          <motion.ol
            key={grade}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="space-y-2.5"
          >
            {plan.modules.map((m) => (
              <li key={m.num} className="card card--compact flex items-center gap-4">
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
              </li>
            ))}
          </motion.ol>

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
