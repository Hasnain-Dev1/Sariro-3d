'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { ArrowRight, Clock, Layers, Calendar, Star, RotateCw, Check } from 'lucide-react';
import { COURSES } from '@/lib/sariro-data';
import { SplitText3D, TiltCard3D } from './scroll-effects';
import { FlipCard3D } from './kit-3d';

const ACCENT_MAP: Record<string, { text: string; bg: string; soft: string; border: string; ring: string }> = {
  blue:   { text: 'text-blue-700',   bg: 'bg-blue-600',   soft: 'bg-blue-50',   border: 'border-blue-200',   ring: 'ring-blue-300' },
  green:  { text: 'text-green-700',  bg: 'bg-green-600',  soft: 'bg-green-50',  border: 'border-green-200',  ring: 'ring-green-300' },
  violet: { text: 'text-violet-700', bg: 'bg-violet-600', soft: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-300' },
  amber:  { text: 'text-amber-700',  bg: 'bg-amber-600',  soft: 'bg-amber-50',  border: 'border-amber-200',  ring: 'ring-amber-300' },
  cyan:   { text: 'text-cyan-700',   bg: 'bg-cyan-600',   soft: 'bg-cyan-50',   border: 'border-cyan-200',   ring: 'ring-cyan-300' },
};

type Filter = 'All' | 'Students' | 'Professionals';
const FILTERS: Filter[] = ['All', 'Students', 'Professionals'];

function CourseCard({ course, index }: { course: typeof COURSES[number]; index: number }) {
  const a = ACCENT_MAP[course.accent] ?? ACCENT_MAP.blue;

  // Front face: course info (same as before but slightly compressed)
  const front = (
    <div className="card-3d h-full overflow-hidden">
      <div className={`h-1.5 rounded-t-[1.25rem] ${a.bg}`} />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${a.soft} ${a.text} border ${a.border}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
            {course.level}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {course.audience}
          </span>
          {course.featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <Star className="w-3 h-3 fill-current" /> Featured
            </span>
          )}
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {course.title}
        </h3>
        <p className="text-sm text-slate-600 mb-5">{course.tagline}</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            {course.durationWeeks} weeks
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Layers className="w-4 h-4 text-slate-400" />
            {course.modules} modules
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            {course.nextCohort}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            ${course.price}
          </div>
        </div>
        <ul className="space-y-1.5 mb-6">
          {course.outcomes.slice(0, 2).map((o) => (
            <li key={o} className="flex items-start gap-2 text-xs text-slate-600">
              <span className={`mt-1 w-1.5 h-1.5 rounded-full ${a.bg} flex-shrink-0`} />
              {o}
            </li>
          ))}
        </ul>
        {/* Hover hint */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-2 border-t border-slate-100" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <RotateCw className="w-3 h-3" />
          Hover to see syllabus
        </div>
      </div>
    </div>
  );

  // Back face: syllabus + outcomes
  const back = (
    <div className={`card-3d h-full overflow-hidden ${a.soft}`}>
      <div className={`h-1.5 rounded-t-[1.25rem] ${a.bg}`} />
      <div className="p-6 flex flex-col h-full" style={{ background: a.soft.includes('blue') ? '#EFF6FF' : a.soft.includes('green') ? '#F0FDF4' : a.soft.includes('violet') ? '#F5F3FF' : a.soft.includes('amber') ? '#FFFBEB' : '#ECFEFF' }}>
        <h3 className="text-lg font-extrabold text-slate-900 leading-tight mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {course.title}
        </h3>
        <p className={`text-xs font-bold ${a.text} mb-4 uppercase tracking-wide`} style={{ fontFamily: 'var(--font-grotesk)' }}>
          What you'll achieve
        </p>
        <ul className="space-y-2.5 mb-5 flex-1">
          {course.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2 text-xs text-slate-700">
              <span className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded ${a.bg} flex items-center justify-center`}>
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </span>
              <span className="font-medium">{o}</span>
            </li>
          ))}
        </ul>
        <button
          className={`group/btn inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white ${a.bg} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          Enroll in cohort
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateY: -15, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateY: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <FlipCard3D front={front} back={back} height="440px" />
    </motion.div>
  );
}

export default function Courses3D() {
  const [filter, setFilter] = useState<Filter>('All');
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const filtered = filter === 'All' ? COURSES : COURSES.filter((c) => c.audience === filter);

  return (
    <section id="courses" ref={sectionRef} data-chapter="courses" data-chapter-label="Courses" className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-white to-slate-50">
      {/* Parallax decorative orbs */}
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [100, -100]) }}
        className="absolute top-40 right-20 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          style={{ y: headerY }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
              — Cohort-based learning —
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText3D text="Courses that ship" highlight="ship" highlightClassName="gradient-text" />
              <br />
              <SplitText3D text="real builders." highlight="builders." highlightClassName="gradient-text" delay={0.3} />
            </h2>
            <p className="mt-5 text-lg text-slate-600">
              No 80-hour video dumps. No 'just follow along' tutorials. Every Sariro course is a live cohort with feedback, community, and a portfolio project that proves you can build.
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl glass-panel self-start lg:self-end">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-tactile btn-tactile-primary px-7 py-4"
          >
            See all courses & pricing
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
