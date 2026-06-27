'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import { Brain, Hammer, Heart, Users } from 'lucide-react';
import { MIMO } from '@/lib/sariro-data';
import { SplitText3D } from './scroll-effects';
import { FloatingStatsCluster } from '@/components/brand/floating-stats-cluster';

const ICON_MAP = [Brain, Hammer, Heart, Users];
const ACCENT_STYLES = [
  { text: 'text-blue-600', bg: 'bg-blue-600', soft: 'bg-blue-50', border: 'border-blue-200', glow: 'rgba(37, 99, 235, 0.4)' },
  { text: 'text-green-600', bg: 'bg-green-600', soft: 'bg-green-50', border: 'border-green-200', glow: 'rgba(22, 163, 74, 0.4)' },
  { text: 'text-violet-600', bg: 'bg-violet-600', soft: 'bg-violet-50', border: 'border-violet-200', glow: 'rgba(124, 58, 237, 0.4)' },
  { text: 'text-amber-600', bg: 'bg-amber-600', soft: 'bg-amber-50', border: 'border-amber-200', glow: 'rgba(245, 158, 11, 0.4)' },
];

export default function Philosophy3D() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const portraitY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  // Removed rotate — was causing the text to look tilted. Keep it straight.

  return (
    <section ref={ref} data-chapter="philosophy" data-chapter-label="Mimo" className="relative py-24 sm:py-32 overflow-hidden bg-white">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left: Portrait + 3D Cube */}
          <motion.div
            style={{ y: portraitY }}
            className="lg:col-span-5 lg:sticky lg:top-28"
          >
            <div className="card-3d p-8" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
              <div className="flex flex-col items-center">
                {/* Portrait Image with Logo Badge */}
                <div className="relative w-full max-w-[260px] mb-6">
                  {/* Portrait */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white">
                    <Image
                      src="/images/mimo-portrait.jpg"
                      alt={`${MIMO.name} — ${MIMO.title}`}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 260px"
                    />
                    {/* Gradient overlay at bottom for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                    {/* Name overlay on portrait */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="text-lg font-extrabold leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {MIMO.name}
                      </div>
                      <div className="text-xs font-bold text-blue-200">{MIMO.title}</div>
                    </div>
                  </div>

                  {/* Sariro Logo Badge — floating top-right */}
                  <div className="absolute -top-3 -right-3 w-14 h-14 rounded-xl bg-white shadow-xl flex items-center justify-center ring-2 ring-blue-100">
                    <Image
                      src="/images/sariro-logo.svg"
                      alt="Sariro logo"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>

                  {/* Decorative accent dot — top-left */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg" />
                </div>

                {/* Floating Stats Cluster — replaces old cube */}
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4 text-center" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  ✦ Hover to explore the stats ✦
                </p>

                <FloatingStatsCluster
                  size={200}
                  stats={[
                    { value: '12+', label: 'Years', color: '#16A34A' },
                    { value: '5K+', label: 'Students', color: '#7C3AED' },
                    { value: '36', label: 'Papers', color: '#F59E0B' },
                    { value: '7', label: 'Patents', color: '#06B6D4' },
                    { value: '65+', label: 'Countries', color: '#2563EB' },
                  ]}
                />

                <p className="text-sm text-slate-600 leading-relaxed text-center mt-6">{MIMO.bio}</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Philosophy */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
                — The philosophy —
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                <SplitText3D text="Four principles that" highlight="principles" highlightClassName="gradient-text" />
                <br />
                <SplitText3D text="shape every Sariro course." highlight="Sariro" highlightClassName="gradient-text" delay={0.3} />
              </h2>
              <p className="mt-5 text-lg text-slate-600">
                These aren't slogans on a wall. Every curriculum decision, every project prompt, every line of feedback comes back to one of these four things.
              </p>
            </motion.div>

            <div className="space-y-5">
              {MIMO.principles.map((p, i) => {
                const Icon = ICON_MAP[i];
                const a = ACCENT_STYLES[i];
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 6 }}
                    className="card-3d p-6 flex gap-5"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="flex-shrink-0" style={{ transform: 'translateZ(25px)' }}>
                      <div className={`w-12 h-12 rounded-xl ${a.soft} flex items-center justify-center border ${a.border}`}>
                        <Icon className={`w-6 h-6 ${a.text}`} strokeWidth={2.4} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${a.text}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                          0{i + 1}
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          {p.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{p.body}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
