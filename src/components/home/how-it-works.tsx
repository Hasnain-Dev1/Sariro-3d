'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, MessageSquare, Rocket, Users } from 'lucide-react';
import { LESSONS_PER_GRADE } from '@/lib/school/curriculum';

/**
 * SARIRO — how it actually works
 * =========================================================
 * The homepage explained the philosophy, the map, the tiers and the principles,
 * and never once explained the mechanics: what happens after you click, when
 * your class is, who is in the room, and what it costs to find out.
 *
 * That gap is expensive at exactly the wrong moment. A parent convinced by the
 * pitch still has to guess how it works, and guessing is when people close the
 * tab. Four steps, in the order they happen, with the free first class named as
 * step one because it is the only step that costs nothing to try.
 *
 * Deliberately plain: no WebGL, no parallax, no flip cards. This section is
 * information, and decoration here would read as evasion.
 */

const STEPS = [
  {
    icon: Rocket,
    accent: '#F59E0B',
    label: 'Step one',
    title: 'Book a free class',
    body: 'A real class with a real mentor, not a sales call. You watch how your child is taught before any money is discussed.',
  },
  {
    icon: MessageSquare,
    accent: '#2563EB',
    label: 'Step two',
    title: 'Tell us the subject and grade',
    body: 'Maths for grade 8, chemistry for grade 11, coding for a curious nine-year-old. We work out where they actually are, which is not always where the grade says.',
  },
  {
    icon: CalendarClock,
    accent: '#16A34A',
    label: 'Step three',
    title: 'We find a batch that fits',
    body: 'You tell us the times that work in your timezone. We place your child in a batch that matches — you never rearrange your week around us.',
  },
  {
    icon: Users,
    accent: '#7C3AED',
    label: 'Step four',
    title: 'One class a week, four to a room',
    body: `${LESSONS_PER_GRADE} classes a year, two of them assessments, so you find out in month six whether it is working rather than in month twelve.`,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      data-chapter="how-it-works"
      data-chapter-label="How it works"
      className="relative py-14 sm:py-20 bg-slate-50 border-t border-slate-100"
    >
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-green-700 mb-3"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            How it works
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Four steps, and the first one is free.
          </h2>
          <p className="mt-3 text-slate-600 text-[15px] leading-[1.65]">
            No entrance test, no placement exam, no commitment before you have seen a class.
          </p>
        </div>

        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.08, 0.32) }}
              className="card card--feature flex flex-col"
              style={{ ['--accent' as string]: step.accent }}
            >
              <span className="flex items-center gap-3 mb-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${step.accent}14`, color: step.accent }}
                >
                  <step.icon className="w-5 h-5" strokeWidth={2.2} />
                </span>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: step.accent, fontFamily: 'var(--font-grotesk)' }}
                >
                  {step.label}
                </span>
              </span>

              <p className="font-bold text-slate-900 text-[16px] mb-1.5 leading-snug">
                {step.title}
              </p>
              <p className="text-[13.5px] leading-[1.6] text-slate-600 flex-1">{step.body}</p>
            </motion.li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/welcome#book" className="btn-tactile btn-tactile-green px-6 py-3.5 text-sm">
            <Rocket className="w-4 h-4" />
            Book a free class
          </Link>
          <Link href="/pricing" className="btn-tactile btn-tactile-light px-5 py-3.5 text-sm">
            See pricing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
