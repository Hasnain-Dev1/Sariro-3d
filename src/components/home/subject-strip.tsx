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
  Mic,
  Sigma,
  type LucideIcon,
} from 'lucide-react';
import {
  AUTHORED_TITLES,
  GRADE_GROUPS,
  LESSONS_PER_GRADE,
  SCHOOL_SUBJECTS,
} from '@/lib/school/curriculum';
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
/**
 * What each card SHOWS, and why it is no longer a slogan.
 *
 * These lines used to be mood copy - "The reasoning under the sums", "Before it
 * splits into three". They read nicely and told a parent nothing. Someone
 * deciding whether Sariro covers their child's Class 8 syllabus cannot answer
 * that from a poem, and that is the only question being asked on this part of
 * the page.
 *
 * So the cards show the real thing. The topics are pulled live from
 * AUTHORED_TITLES - the same 2,530-lesson curriculum the course pages and the
 * syllabus audit read. Nothing is written twice: rename a module in the
 * curriculum and this card follows, which also means it can never advertise a
 * topic that is not actually taught.
 */

/** A grade each subject really runs at - Science stops before 9, the three sciences start there. */
const TOPIC_SAMPLE_GRADE: Record<string, number> = {
  mathematics: 8,
  science: 5,
  physics: 9,
  chemistry: 9,
  biology: 9,
  english: 8,
};

/** First three real module titles for a subject, or null if unauthored. */
function topicsFor(slug: string): string[] | null {
  const grade = TOPIC_SAMPLE_GRADE[slug];
  if (!grade) return null;
  const entry = AUTHORED_TITLES[`${slug}:${grade}`];
  if (!entry?.modules?.length) return null;
  return entry.modules.slice(0, 3).map((m) => m.title);
}

const CODING_ACCENT = '#EA580C';
const SPEAKING_ACCENT = '#DB2777';

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
            Eight subjects. One class size.
          </h2>
          <p className="mt-3 text-slate-600 text-[15px] leading-[1.65]">
            Grades 1 to 12, plus coding and public speaking at any age. {LESSONS_PER_GRADE} live classes a year, never
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
              <p className="font-bold text-slate-900 text-[15px] mb-1">Coding &amp; AI</p>
              <p className="text-[13px] leading-[1.55] text-slate-600 flex-1">
                From first steps to building with AI
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
                  {/* Real module titles, straight from the curriculum. Three is
                      enough to be recognised as "yes, that is our syllabus"
                      without turning the card into a contents page. */}
                  <p className="text-[12.5px] leading-[1.5] text-slate-500 flex-1">
                    {topicsFor(subject.slug)?.join(' · ') ?? `${subject.name}, grade by grade`}
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

          {/* Public speaking sits with the subjects, not buried among the focus
              courses. It is the one thing here that is not remediation — nobody
              arrives "behind" at speaking — and it is the only card an adult
              buys for themselves. Hiding it costs us the audience least served
              by a grade-shaped catalogue. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Link
              href="/subjects/focus/public-speaking"
              className="card group flex flex-col h-full"
              style={{ ['--accent' as string]: SPEAKING_ACCENT }}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${SPEAKING_ACCENT}14`, color: SPEAKING_ACCENT }}
              >
                <Mic className="w-4.5 h-4.5" strokeWidth={2.2} />
              </span>
              <p className="font-bold text-slate-900 text-[15px] mb-1">Public Speaking</p>
              <p className="text-[13px] leading-[1.55] text-slate-600 flex-1">
                Say it so people listen
              </p>
              <span className="mt-3 flex items-center justify-between">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: SPEAKING_ACCENT }}
                >
                  Any age
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
              </span>
            </Link>
          </motion.div>
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
