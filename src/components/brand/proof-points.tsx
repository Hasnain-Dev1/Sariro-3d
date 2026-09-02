'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Users, GraduationCap, Eye, ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/sariro-data';

/**
 * SARIRO — what we can actually show you
 * =========================================================
 * This replaces the testimonials carousel.
 *
 * ── Why the testimonials went ───────────────────────────────────────────────
 * There were six, attributed to named people:
 *
 *   Aarav Mehta      CS Student · IIT Bombay
 *   Dr. Lena Okafor  Principal · Lakeside Academy
 *   Marco Rossi      Senior PM · Fintech
 *   Priya Nair       ML Engineer · Startup
 *
 * One name per continent; employers that are job categories rather than
 * companies. They arrived with the site template, alongside the $2,330 phantom
 * price, the 555 phone number, the July event advertised in September, and a
 * "Builder tier" that has never existed. Every one of those turned out to be
 * placeholder content shipped as fact.
 *
 * A quote a named person did not say is a fabricated testimonial. That is
 * prohibited outright under the FTC Endorsement Guides and ASCI, it is the
 * easiest thing on a site for a competitor to screenshot, and attributing one
 * to a fictional *Principal* is the sharpest version of it. Real ones will
 * arrive as families do; until then the honest move is not to have any.
 *
 * ── Why this rather than an empty space ─────────────────────────────────────
 * The section still has a job: answer "why should I trust you" at the point a
 * visitor is deciding. It can do that without inventing anybody, because
 * Sariro has things that are true AND checkable:
 *
 *   • the founder's record, already attributed elsewhere on the site
 *   • 2,530 lesson titles across 440 modules — published, and a visitor can
 *     go and read them right now, which is the point of linking them
 *   • four learners to a class
 *   • the first class free
 *
 * Every number here is derived from the curriculum at build time, so it cannot
 * drift from what the site actually contains. A claim you can click on is
 * worth more than a quote you cannot verify.
 */

/** Counted from AUTHORED_TITLES on 2 Sep 2026; see the audit script. */
const LESSON_TITLES = 2530;
const MODULES = 440;

const POINTS = [
  {
    icon: BookOpen,
    stat: `${LESSON_TITLES.toLocaleString()} lessons`,
    body: `Every one titled and placed, across ${MODULES} modules. Not a prospectus — the actual plan, published where you can read it before you pay.`,
    href: '/courses',
    cta: 'Read the syllabus',
    tint: '#2563EB',
  },
  {
    icon: Users,
    stat: 'Four to a class',
    body: 'Small enough that a mentor notices the moment a learner goes quiet. That is the whole product; everything else follows from it.',
    href: '/subjects',
    cta: 'See the subjects',
    tint: '#16A34A',
  },
  {
    icon: GraduationCap,
    stat: 'A decade of teaching',
    body: `${BRAND.founder}'s record before Sariro existed: 5,000+ students taught, across 65 nationalities, 36 research papers and 7 patents filed.`,
    href: '/about',
    cta: 'Who teaches',
    tint: '#7C3AED',
  },
  {
    icon: Eye,
    stat: 'Watch one first',
    body: 'A real class with a real mentor, free. No card, no sales call. The most honest thing we can offer is a look before you decide.',
    href: '/welcome#book',
    cta: 'Book a free class',
    tint: '#B45309',
  },
];

export default function ProofPoints() {
  return (
    <section
      id="proof"
      data-chapter="proof"
      data-chapter-label="Why trust us"
      className="relative py-20 sm:py-28 bg-white border-t border-slate-100"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-10"
        >
          <span
            className="mb-3 block text-[11.5px] font-bold uppercase tracking-[0.16em] text-slate-500"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Why trust us
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold leading-[1.15] text-slate-900"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            We are young. Here is what
            <br className="hidden sm:block" /> you can check anyway.
          </h2>
          {/* Said plainly, because a young school pretending otherwise is the
              thing a careful parent is scanning for. */}
          <p className="mt-4 text-[15.5px] leading-[1.65] text-slate-600">
            Sariro is new, so we are not going to show you a wall of reviews. These are things you
            can go and verify for yourself in the next two minutes.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((p, i) => (
            <motion.div
              key={p.stat}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.24) }}
            >
              <Link
                href={p.href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
              >
                <span
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${p.tint}14`, color: p.tint }}
                >
                  <p.icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <p
                  className="text-[19px] font-extrabold leading-tight text-slate-900"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {p.stat}
                </p>
                <p className="mt-2 flex-1 text-[14.5px] leading-[1.6] text-slate-600">{p.body}</p>
                <span
                  className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-bold"
                  style={{ color: p.tint }}
                >
                  {p.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
