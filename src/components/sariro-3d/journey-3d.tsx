'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Brain, Hammer, Rocket, Users, Sparkles, ArrowDown } from 'lucide-react';
import { useScrollVelocity, VelocitySkew } from './scroll-effects';

/* ---------------------------------------------------------------
   JOURNEY 3D — Horizontal scroll storytelling section
   The section is pinned for ~3 viewport heights. Vertical scroll
   is translated into horizontal card movement + 3D depth rotation.
--------------------------------------------------------------- */

const JOURNEY_STEPS = [
  {
    n: '01',
    title: 'Curiosity',
    body: 'You start with a question. Why does ChatGPT work? How does a self-driving car see? We meet you there.',
    icon: Brain,
    accent: 'blue',
    color: '#2563EB',
  },
  {
    n: '02',
    title: 'Foundations',
    body: 'No copy-paste tutorials. We build the mental models — systems thinking, problem decomposition, abstraction.',
    icon: Hammer,
    accent: 'violet',
    color: '#7C3AED',
  },
  {
    n: '03',
    title: 'Build',
    body: 'Real projects. Real feedback. Real failures. You ship 3 portfolio artifacts you can show employers.',
    icon: Rocket,
    accent: 'green',
    color: '#16A34A',
  },
  {
    n: '04',
    title: 'Belong',
    body: 'You join 5,000+ builders across 65 countries. You don\'t just learn — you become part of a movement.',
    icon: Users,
    accent: 'amber',
    color: '#F59E0B',
  },
];

export default function Journey3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const velocity = useScrollVelocity();

  // Track scroll progress through the pinned section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Translate vertical scroll into horizontal movement
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-72%']);
  // Section header fades in/out
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  return (
    <section id="journey" ref={sectionRef} data-chapter="journey" data-chapter-label="Journey" className="relative bg-slate-950/95" style={{ height: '300vh' }}>
      {/* Sticky stage that holds the horizontal scroller */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(124, 58, 237, 0.4) 0%, transparent 50%)'
          }} />
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.5, 1], [0.4, 0.7, 0.4]),
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)'
            }}
          />
        </div>

        {/* Header (sticky, fades with scroll) */}
        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute top-24 left-0 right-0 z-10 text-center px-4"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 mb-3 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — The Sariro journey —
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Four stages. <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-green-400 bg-clip-text text-transparent">One transformation.</span>
          </h2>
        </motion.div>

        {/* Horizontal scroller */}
        <motion.div
          style={{ x }}
          className="flex gap-6 lg:gap-10 px-[5vw] items-center will-change-transform"
        >
          {JOURNEY_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <VelocitySkew
                key={step.n}
                velocity={velocity}
                max={6}
                className="flex-shrink-0 w-[80vw] sm:w-[60vw] lg:w-[40vw] max-w-2xl"
              >
                <div
                  className="relative glass-dark rounded-3xl p-8 sm:p-12 border border-white/10 hover:border-white/20 transition-colors group"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `perspective(1200px) rotateY(${i % 2 === 0 ? -3 : 3}deg)`,
                  }}
                >
                  {/* Big ghost number */}
                  <div
                    className="absolute -top-8 -right-4 text-[10rem] sm:text-[12rem] font-extrabold leading-none opacity-10 select-none"
                    style={{ fontFamily: 'var(--font-jakarta)', color: step.color }}
                  >
                    {step.n}
                  </div>

                  {/* Icon */}
                  <div
                    className="relative inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-2xl"
                    style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}99)`, boxShadow: `0 20px 50px -20px ${step.color}` }}
                  >
                    <Icon className="w-8 h-8 text-white" strokeWidth={2.4} />
                  </div>

                  {/* Label + title */}
                  <div className="relative">
                    <span
                      className="text-xs font-bold uppercase tracking-[0.25em] mb-2 block"
                      style={{ color: step.color, fontFamily: 'var(--font-grotesk)' }}
                    >
                      Stage {step.n}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {step.title}
                    </h3>
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-md">
                      {step.body}
                    </p>
                  </div>

                  {/* Progress connector dots */}
                  <div className="flex gap-2 mt-8 relative">
                    {JOURNEY_STEPS.map((_, j) => (
                      <div
                        key={j}
                        className="h-1 rounded-full transition-all duration-500"
                        style={{
                          width: j === i ? 40 : 12,
                          background: j <= i ? step.color : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </VelocitySkew>
            );
          })}

          {/* End card — call to action */}
          <motion.div
            className="flex-shrink-0 w-[80vw] sm:w-[60vw] lg:w-[40vw] max-w-2xl flex flex-col items-center justify-center text-center"
          >
            <div className="glass-dark rounded-3xl p-10 sm:p-14 border border-white/10">
              <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-5" />
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Ready to start?
              </h3>
              <p className="text-slate-300 mb-7 max-w-sm">
                Your journey begins with a single click. Browse our next cohort and claim your seat.
              </p>
              <button
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-tactile btn-tactile-primary px-7 py-4"
              >
                <Sparkles className="w-4 h-4" />
                Explore cohorts
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom hint */}
        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-400"
        >
          <ArrowDown className="w-3 h-3 animate-bounce" />
          Keep scrolling
        </motion.div>
      </div>
    </section>
  );
}
