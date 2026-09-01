'use client';

import Link from 'next/link';
import { MotionConfig, motion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  CreditCard,
  PhoneOff,
  UserCheck,
  Eye,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';

/**
 * SARIRO — the free class, said plainly, immediately before the price
 * =========================================================
 * ── What used to be here, and why it went ───────────────────────────────────
 * This slot held `Events3D`: an auto-playing carousel of three events. On
 * 31 Aug 2026 it was advertising, under the heading "Upcoming events":
 *
 *   Prompt Jam: Live Workshop     Jul 22, 2026   — 40 days in the PAST
 *   Summer AI Builder Cohort      Aug 12 — Oct 4 — started 19 days earlier
 *   AI for Good Hackathon         Sep 20 — 22    — SF, $10k prizes
 *
 * Three problems, in order of severity:
 *
 *   1. Its only call to action was DEAD. `MagneticButton` accepts `href` and
 *      `onClick`; "Reserve spot" passed neither. The one button in the warmest
 *      slot on the page did nothing when clicked.
 *   2. The dates were stale, and nothing in the code could ever prevent that —
 *      they were hardcoded display strings, so "Upcoming" was a promise the
 *      component had no way to keep.
 *   3. The content sold a coding bootcamp — hackathons, cohorts, prizes — to a
 *      site that now teaches Mathematics, Science, Physics, Chemistry, Biology
 *      and English alongside Coding & AI and Public Speaking.
 *
 * ── Why THIS, in this position ──────────────────────────────────────────────
 * The section sits ninth of eleven: after the testimonials, immediately before
 * `Pricing3D`. The reader arriving here is convinced but has not yet seen a
 * number. The single most useful thing to tell them at that exact moment is
 * that they can find out what a class is like without paying for one — so the
 * price, when it lands one section later, is a decision rather than a risk.
 *
 * That is also the conversion goal stated for the whole site: nobody should
 * leave without either buying or booking a free class.
 *
 * ── Every claim here is one the site already makes ──────────────────────────
 * Nothing here is new marketing. The promise is lifted from what /welcome and
 * the rest of the site already say — "No credit card. No commitment. Just 30
 * minutes", "no card, no sales call, and no obligation afterwards", "a real
 * lesson with a real mentor". If that offer ever changes it must change in both
 * places; the wording is deliberately identical so a mismatch would be obvious.
 *
 * ── What this deliberately does NOT do ──────────────────────────────────────
 * It does not show a date picker. /welcome#book already has one, wired to real
 * time-slot availability. A second picker here would be a decorative scheduler
 * that disagrees with the real one — the failure mode this section was built to
 * get rid of. One door, and it is the working one.
 */

/** Amber is already the free-class colour — /welcome's hero uses #F59E0B. */
const AMBER = '#F59E0B';

/**
 * The same amber, dark enough to carry white text.
 *
 * #F59E0B behind white is 2.15:1 — measured, not guessed. That is not a near
 * miss; WCAG AA wants 4.5:1 for 15px bold, so the most important button in the
 * section would have been the least readable thing on the page. Amber is a
 * genuinely awkward hue this way: it looks strong and tests terribly.
 *
 * #B45309 is the same colour family two steps down and reaches 5.02:1, so the
 * button still reads as "the free-class button" without failing. Bright amber
 * stays where it is safe — icons and washes beside dark labels that carry the
 * meaning on their own.
 */
const AMBER_INK = '#B45309';

/** The four objections, answered before they are raised. */
const NO_RISK = [
  { icon: Clock, label: '30 minutes', sub: 'One real lesson' },
  { icon: UserCheck, label: 'A real mentor', sub: 'Live, not a recording' },
  { icon: CreditCard, label: 'No card', sub: 'Nothing to enter' },
  { icon: PhoneOff, label: 'No sales call', sub: 'We do not chase you' },
];

/** What actually happens — concrete, and true in every subject. */
const WHAT_HAPPENS = [
  {
    icon: Sparkles,
    title: 'They do real work',
    body: 'An actual lesson from your own syllabus — not a tour of the platform, and not a pitch.',
    tint: '#2563EB',
  },
  {
    icon: Eye,
    title: 'You can sit in',
    body: 'Watch how the mentor explains things, and how your child responds. That is the part you are really choosing.',
    tint: '#7C3AED',
  },
  {
    icon: ClipboardCheck,
    title: 'You get an honest read',
    body: 'Where they actually are, and what we would do about it — including if the answer is that you do not need us.',
    tint: '#16A34A',
  },
];

const SUBJECTS =
  'Mathematics · Science · Physics · Chemistry · Biology · English · Coding & AI · Public Speaking';

/**
 * One shared entrance.
 *
 * These props are IDENTICAL on the server and in the browser, deliberately.
 * The first version of this branched on `useReducedMotion()`, which reads
 * matchMedia and therefore cannot give the same answer in both places: the
 * server rendered the cards visible while the client wanted them at opacity 0,
 * and React reported "a tree hydrated but some attributes ... didn't match ...
 * This won't be patched up" — naming this component. A whole section left in a
 * half-hydrated state, to save a media query.
 *
 * Reduced motion is honoured by <MotionConfig reducedMotion="user"> below
 * instead, which framer applies after mount: it drops the transform and keeps
 * the fade, and it changes no server-rendered attribute, so there is nothing
 * for hydration to disagree about.
 */
const rise = (delay = 0) =>
  ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  }) as const;

export default function FirstClassFree() {
  return (
    /* Honours prefers-reduced-motion without a render-time branch: framer drops
       transform animations for those users and keeps the fade. */
    <MotionConfig reducedMotion="user">
    <section
      id="free-class"
      data-chapter="free-class"
      data-chapter-label="Free class"
      className="relative overflow-hidden py-20 sm:py-28"
      style={{
        // Warm, not the old slate-950 slab. This was the last dark section on
        // the homepage; a "this costs you nothing" message delivered on black
        // with neon gradients reads as a tech conference, not as a school
        // reassuring a cautious parent.
        background: 'linear-gradient(180deg, #FFFDF9 0%, #FFF8EC 45%, #FFFDF9 100%)',
      }}
    >
      {/* Soft amber wash — decorative only, kept well below the text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 15% 0%, rgba(245,158,11,0.16) 0%, transparent 60%), radial-gradient(50% 45% at 90% 100%, rgba(37,99,235,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── the ask ────────────────────────────────────────────────────── */}
        <motion.div {...rise()} className="max-w-3xl">
          <span
            className="mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.16em]"
            style={{
              color: '#B45309',
              borderColor: 'rgba(245,158,11,0.35)',
              background: 'rgba(245,158,11,0.10)',
              fontFamily: 'var(--font-grotesk)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Before you look at prices
          </span>

          <h2
            className="text-4xl font-extrabold leading-[1.1] text-slate-900 sm:text-5xl"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            See a real class
            <br />
            before you pay for one.
          </h2>

          <p className="mt-5 text-lg leading-[1.65] text-slate-600">
            Thirty minutes, a real mentor, your own syllabus. No credit card, no sales call, and no
            obligation afterwards — book it, sit in, and decide with something to go on.
          </p>
        </motion.div>

        {/* ── the four objections, answered ──────────────────────────────── */}
        <motion.ul {...rise(0.08)} className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {NO_RISK.map(({ icon: Icon, label, sub }) => (
            <li
              key={label}
              className="rounded-2xl border border-amber-200/70 bg-white/80 px-4 py-4 backdrop-blur-sm"
            >
              <Icon className="mb-2.5 h-5 w-5" style={{ color: AMBER }} strokeWidth={2.2} />
              <p className="text-[15px] font-bold leading-tight text-slate-900">{label}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-slate-500">{sub}</p>
            </li>
          ))}
        </motion.ul>

        {/* ── what the 30 minutes actually contains ──────────────────────── */}
        <div className="mt-12">
          <motion.h3
            {...rise(0.1)}
            className="text-[13px] font-bold uppercase tracking-[0.16em] text-slate-500"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            What happens in those 30 minutes
          </motion.h3>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {WHAT_HAPPENS.map(({ icon: Icon, title, body, tint }, i) => (
              <motion.div
                key={title}
                {...rise(0.14 + i * 0.07)}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(42,37,31,0.04)]"
              >
                <span
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${tint}14`, color: tint }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <p
                  className="text-[16.5px] font-bold text-slate-900"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {title}
                </p>
                <p className="mt-2 text-[14.5px] leading-[1.6] text-slate-600">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── the door ───────────────────────────────────────────────────── */}
        <motion.div
          {...rise(0.34)}
          className="mt-12 rounded-3xl border p-7 sm:p-9"
          style={{
            borderColor: 'rgba(245,158,11,0.32)',
            background:
              'linear-gradient(135deg, rgba(255,251,240,0.95) 0%, rgba(255,247,232,0.95) 100%)',
          }}
        >
          <div className="flex flex-col items-start gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p
                className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-[27px]"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Free in every subject we teach.
              </p>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-slate-600">{SUBJECTS}</p>
              <p className="mt-4 text-[14px] leading-[1.6] text-slate-500">
                If it is not right for you, say so and nothing happens. That is the whole deal.
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
              {/* The CTA this section spent its whole life not having. */}
              <Link
                href="/welcome#book"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background: AMBER_INK,
                  boxShadow: '0 10px 0 -1px #92400E, 0 18px 30px -12px rgba(180,83,9,0.45)',
                }}
              >
                Book the free class
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-[15px] font-bold text-slate-800 transition-colors hover:border-slate-400"
              >
                Browse subjects
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
    </MotionConfig>
  );
}
