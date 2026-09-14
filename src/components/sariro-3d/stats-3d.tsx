'use client';

import { motion, useInView, useMotionValue, useTransform, animate, useScroll, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Users, Globe, FileText, Award } from 'lucide-react';
import { BRAND, HERO_STATS } from '@/lib/sariro-data';
import { SplitText3D } from './scroll-effects';

const ICON_MAP = [Users, Globe, FileText, Award];
const ACCENT_STYLES = [
  { text: 'text-blue-600', bg: 'from-blue-500 to-blue-700', hex: '#2563EB', soft: 'rgba(37, 99, 235, 0.10)' },
  { text: 'text-green-600', bg: 'from-green-500 to-green-700', hex: '#16A34A', soft: 'rgba(22, 163, 74, 0.10)' },
  { text: 'text-violet-600', bg: 'from-violet-500 to-violet-700', hex: '#7C3AED', soft: 'rgba(124, 58, 237, 0.10)' },
  { text: 'text-amber-600', bg: 'from-amber-500 to-amber-700', hex: '#D97706', soft: 'rgba(245, 158, 11, 0.12)' },
];

/* One line under each number, so a figure is a fact and not a boast. Only
   what is already said about Mimo elsewhere on the site (FAQ, About, Story). */
const CONTEXT = [
  'Over twelve years of teaching',
  'Learners from around the world',
  'Published research',
  'Inventions filed',
];

/**
 * A founder's record, one card each.
 *
 * The cards used to carry a spinning shape behind each corner — rotateY on a
 * flat square, so for half of every turn it was seen edge-on as a sliver, and
 * the card in front sliced it in two. On a still screenshot it read as broken
 * glass on four cards. The per-digit flip counter printed "5000+" in fixed
 * cells while every other page says "5,000+". Both gone: a calm card, a real
 * number format, and one count-up the first time the card is seen.
 */
function StatCard({ value, suffix, index }: { value: number; suffix: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();
  /* Starts at the real number, so the server-rendered page, a crawler and a
     reader with motion off all see "5,000+" rather than "0". It only drops to
     zero to count up if the card has not been seen yet. */
  const count = useMotionValue(value);
  const shown = useTransform(count, (v) => Math.round(v).toLocaleString('en-US'));
  const counted = useRef(false);

  useEffect(() => {
    if (reduced || counted.current) return;
    const el = ref.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight) count.set(0);
  }, [count, reduced]);

  useEffect(() => {
    if (!inView || reduced || counted.current) return;
    counted.current = true;
    if (count.get() === value) return;
    const controls = animate(count, value, { duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 });
    return controls.stop;
  }, [inView, reduced, value, count, index]);

  const a = ACCENT_STYLES[index % ACCENT_STYLES.length];
  const Icon = ICON_MAP[index % ICON_MAP.length];

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-full"
    >
      <div className="relative h-full overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white px-4 py-6 sm:px-7 sm:py-9 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.28)] transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_28px_56px_-30px_rgba(15,23,42,0.38)]">
        {/* The accent sits inside the card: a hairline on top and a soft wash
            behind the icon. Nothing crosses the card's edge. */}
        <span aria-hidden className="absolute inset-x-8 top-0 h-[3px] rounded-b-full" style={{ background: `linear-gradient(90deg, transparent, ${a.hex}, transparent)` }} />
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/3 rounded-full blur-2xl" style={{ background: a.soft }} />

        <div className={`relative mx-auto mb-4 sm:mb-6 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${a.bg} shadow-lg`} style={{ boxShadow: `0 12px 24px -12px ${a.hex}` }}>
          <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-white" strokeWidth={2.3} />
        </div>

        <p
          className={`relative text-[2.1rem] sm:text-5xl lg:text-[3.6rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums ${a.text}`}
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <motion.span>{shown}</motion.span>
          {suffix}
        </p>

        <p
          className="relative mt-3 sm:mt-4 text-[10.5px] sm:text-[13px] font-bold uppercase tracking-[0.14em] text-slate-700 leading-tight"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {HERO_STATS[index].label}
        </p>
        <p className="relative mt-1.5 text-[11.5px] sm:text-[13px] text-slate-500 leading-snug">
          {CONTEXT[index]}
        </p>
      </div>
    </motion.div>
  );
}

export default function Stats3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const orb1Y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [-80, 80]);

  return (
    <section id="stats" ref={sectionRef} data-chapter="stats" data-chapter-label="Who teaches" className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <motion.div
        style={{ y: orb1Y }}
        className="absolute top-20 left-10 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"
      />
      <motion.div
        style={{ y: orb2Y }}
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-violet-400/10 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          style={{ y: headerY }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-9 sm:mb-16"
        >
          {/* Second place these same numbers appear — the hero is the other.
              They are Mimo's career, earned before Sariro existed, so they are
              attributed here too. Unattributed they read as the platform's, and
              the platform is young. See the hero comment in app/page.tsx. */}
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — Who is teaching —
          </span>
          <h2 className="text-[1.75rem] sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <SplitText3D text="Sariro did not start" highlight="Sariro" highlightClassName="gradient-text" />
            <br />
            <SplitText3D text="from nothing." highlight="from nothing." highlightClassName="gradient-text" delay={0.3} />
          </h2>
          <p className="mt-4 text-[15px] sm:text-lg text-slate-600 leading-[1.6]">
            A decade of teaching came first. These are {BRAND.founder}&apos;s numbers from the years
            before Sariro existed — the foundation it was built on, and the reason a parent can
            trust who is on the other side of the screen.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {HERO_STATS.map((s, i) => (
            <StatCard key={s.label} value={s.value} suffix={s.suffix} index={i} />
          ))}
        </div>

        {/* Secondary highlight strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 sm:mt-12 glass-panel rounded-3xl p-6 sm:p-10 text-center"
        >
          <p className="text-xl sm:text-2xl font-bold text-slate-800 max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-jakarta)' }}>
            "Every number on this page started with one student who decided to take a class. We're still counting."
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — Mimo Patra, Founder
          </p>
        </motion.div>
      </div>
    </section>
  );
}
