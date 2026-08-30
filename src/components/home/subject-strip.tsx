'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Atom,
  BookOpen,
  Code2,
  Dna,
  FlaskConical,
  Microscope,
  Sigma,
  type LucideIcon,
} from 'lucide-react';
import { GRADE_GROUPS, LESSONS_PER_GRADE, SCHOOL_SUBJECTS } from '@/lib/school/curriculum';
import { formatPrice, perMonthFor } from '@/lib/school/pricing';

/**
 * SARIRO — the homepage subject strip
 * =========================================================
 * The homepage used to run eleven sections without once naming a subject. A
 * parent could scroll the entire page and never learn we teach maths — the
 * sections talked about tracks, a capability map, an AI core, coding tiers and
 * philosophy, all of which answer questions asked *after* "do you teach the
 * thing my child needs?"
 *
 * This sits directly under the hero because it answers that question first, and
 * because it is also the fastest route out of the homepage into a page that can
 * actually sell. Every card is a real destination, not a scroll anchor.
 *
 * Deliberately compact: seven cards, one line each. The full descriptions live
 * on /courses. The homepage's job is to prove the breadth exists and get out of
 * the way.
 */

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  mathematics: Sigma,
  science: Microscope,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  english: BookOpen,
};

/** One short, concrete line per subject — what it is, in a parent's words. */
const ONE_LINERS: Record<string, string> = {
  mathematics: 'The reasoning under the sums',
  science: 'Before it splits into three',
  physics: 'Forces, energy, and why they work',
  chemistry: 'Why things react and change',
  biology: 'Cells, systems, and living things',
  english: 'Reading closely, writing clearly',
};

const CODING_ACCENT = '#EA580C';

export default function SubjectStrip() {
  const monthly = formatPrice(perMonthFor('1:4'));

  return (
    <section className="relative py-14 sm:py-20 bg-white border-t border-slate-100">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-9">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            What we teach
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Seven subjects. One class size.
          </h2>
          <p className="mt-3 text-slate-600 text-[15px] leading-[1.65]">
            Grades 1 to 12, and coding at any age. {LESSONS_PER_GRADE} live classes a year, never
            more than four learners in the room — from {monthly} a month.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Coding leads: it is the flagship, and the only one with no grade. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/courses#catalog"
              className="card group flex flex-col h-full"
              style={{ ['--accent' as string]: CODING_ACCENT }}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${CODING_ACCENT}14`, color: CODING_ACCENT }}
              >
                <Code2 className="w-4.5 h-4.5" strokeWidth={2.2} />
              </span>
              <p className="font-bold text-slate-900 text-[15px] mb-1">Coding</p>
              <p className="text-[13px] leading-[1.55] text-slate-600 flex-1">
                From first steps to shipping
              </p>
              <span className="mt-3 flex items-center justify-between">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: CODING_ACCENT }}
                >
                  Any age
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
              </span>
            </Link>
          </motion.div>

          {SCHOOL_SUBJECTS.map((subject, i) => {
            const Icon = SUBJECT_ICONS[subject.slug] ?? BookOpen;
            const groups = GRADE_GROUPS.filter((g) => subject.groups.includes(g.slug));
            const lowest = groups[0]?.grades[0];
            const highest = groups[groups.length - 1]?.grades.slice(-1)[0];

            return (
              <motion.div
                key={subject.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: Math.min((i + 1) * 0.05, 0.3) }}
              >
                <Link
                  href={`/subjects/${subject.slug}`}
                  className="card group flex flex-col h-full"
                  style={{ ['--accent' as string]: subject.accent }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: `${subject.accent}14`, color: subject.accent }}
                  >
                    <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                  </span>
                  <p className="font-bold text-slate-900 text-[15px] mb-1">{subject.name}</p>
                  <p className="text-[13px] leading-[1.55] text-slate-600 flex-1">
                    {ONE_LINERS[subject.slug]}
                  </p>
                  <span className="mt-3 flex items-center justify-between">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider tabular-nums"
                      style={{ color: subject.accent }}
                    >
                      Grades {lowest}–{highest}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/courses#learn"
            className="btn-tactile btn-tactile-primary px-5 py-3 text-sm"
          >
            See all subjects
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[13.5px] text-slate-600">
            Not sure which? Book a free class and we will tell you honestly.
          </p>
        </div>
      </div>
    </section>
  );
}
