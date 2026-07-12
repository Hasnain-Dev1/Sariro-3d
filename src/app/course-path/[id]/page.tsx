'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Clock, Layers, BookOpen, Calendar,
  CheckCircle2, Users, User, Sparkles, ShieldCheck, Rocket,
  TrendingUp, Star,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { ReserveSeatButton } from '@/components/auth/reserve-seat-button';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  TiltCard,
  CountUp,
  ParallaxOrb,
} from '@/components/brand/effects-kit';
import { COURSES, TRACKS, getRazorpayLink, type LearningRatio } from '@/lib/sariro-data';

const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB', green: '#16A34A', violet: '#7C3AED', amber: '#F59E0B', cyan: '#06B6D4',
};

const LEVEL_STYLES = [
  { label: 'Beginner', price: 199, color: '#16A34A', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: Rocket },
  { label: 'Intermediate', price: 299, color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: TrendingUp },
  { label: 'Advanced', price: 699, color: '#7C3AED', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: Star },
];

export default function CoursePathPage() {
  const params = useParams();
  const trackId = params.id as string;
  const [ratio, setRatio] = useState<LearningRatio>('1:4');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const track = useMemo(() => TRACKS.find((t) => t.id === trackId), [trackId]);
  const courses = useMemo(() => COURSES.filter((c) => c.trackId === trackId), [trackId]);

  // Auto-scroll to details section when a level is selected
  useEffect(() => {
    if (selectedLevel && detailsRef.current) {
      const timer = setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedLevel]);

  if (!track || courses.length === 0) {
    return (
      <BrandLayout>
        <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
          <div className="relative max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>Course not found</h1>
            <p className="text-slate-600 mb-8">We couldn't find this course path.</p>
            <Link href="/courses" className="btn-tactile btn-tactile-primary px-6 py-3 text-sm"><ArrowLeft className="w-4 h-4" />Browse courses</Link>
          </div>
        </section>
      </BrandLayout>
    );
  }

  const accent = ACCENT_HEX[track.accent] ?? '#2563EB';
  const selectedCourse = selectedLevel ? courses.find((c) => c.level === selectedLevel) : null;

  return (
    <BrandLayout>
      <section className="relative pt-28 sm:pt-36 pb-12 sm:pb-16 overflow-hidden">
        <ParallaxOrb color={`${accent}1A`} size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={340} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back link */}
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 mb-6 transition-colors" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <ArrowLeft className="w-3.5 h-3.5" />All courses
          </Link>

          {/* Track header */}
          <Reveal>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5" style={{ color: accent }} />
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}>Course Path</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {track.name}
              </h1>
              <p className="text-base text-slate-600 max-w-2xl">{track.tagline}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                <span>Beginner</span>
                <ArrowRight className="w-4 h-4" />
                <span>Intermediate</span>
                <ArrowRight className="w-4 h-4" />
                <span>Advanced</span>
              </div>
            </div>
          </Reveal>

          {/* 3 Level Cards */}
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" stagger={0.1}>
            {LEVEL_STYLES.map((ls, i) => {
              const course = courses.find((c) => c.level === ls.label);
              if (!course) return null;
              const Icon = ls.icon;
              const isSelected = selectedLevel === ls.label;
              return (
                <StaggerItem key={ls.label}>
                  <TiltCard
                    className={`card-3d p-6 h-full cursor-pointer border-2 transition-all ${isSelected ? 'border-2' : 'border-2 border-transparent'}`}
                    maxTilt={4}
                  >
                    <div onClick={() => setSelectedLevel(ls.label)} style={{ transformStyle: 'preserve-3d' }}>
                      {/* Level badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${ls.bg} flex items-center justify-center`} style={{ color: ls.color }}>
                          <Icon className="w-6 h-6" strokeWidth={2.2} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${ls.bg} ${ls.text}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                          Level {i + 1}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {ls.label}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">{course.tagline}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.durationWeeks}w</span>
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{course.modules} mods</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessons} lessons</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-extrabold" style={{ color: ls.color, fontFamily: 'var(--font-jakarta)' }}>${ls.price}</span>
                        {course.originalPrice && <span className="text-xs font-bold line-through text-red-500">${course.originalPrice}</span>}
                      </div>

                      {/* CTA */}
                      <div
                        className="block w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-colors"
                        style={{ background: ls.color, fontFamily: 'var(--font-grotesk)' }}
                      >
                        {isSelected ? 'Selected ✓' : 'View details'}
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>

          {/* Selected course details */}
          {selectedCourse && (() => {
            const ls = LEVEL_STYLES.find((l) => l.label === selectedCourse.level)!;
            const displayPrice = ratio === '1:1' ? ls.price + 100 : ls.price;
            const paymentLink = getRazorpayLink(selectedCourse.level, ratio);
            const syllabus = 'syllabus' in selectedCourse ? (selectedCourse.syllabus as Array<{ num: string; name: string; project: string; lessons: string[] }>) : [];

            return (
              <motion.div
                ref={detailsRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="scroll-mt-24"
              >
                {/* Divider */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {selectedCourse.level} Details
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* LEFT: Outcomes + syllabus */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Outcomes */}
                    <Reveal>
                      <div className="card-3d p-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: ls.color, fontFamily: 'var(--font-grotesk)' }}>
                          <CheckCircle2 className="w-4 h-4" />What you'll be able to do
                        </h3>
                        <ul className="space-y-2.5">
                          {selectedCourse.outcomes.map((o, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold mt-0.5" style={{ background: `${ls.color}15`, color: ls.color }}>✓</span>
                              <span className="text-sm text-slate-700 leading-relaxed">{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>

                    {/* Syllabus */}
                    <Reveal delay={0.1}>
                      <div className="card-3d p-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: ls.color, fontFamily: 'var(--font-grotesk)' }}>
                          <Layers className="w-4 h-4" />Syllabus — {selectedCourse.modules} modules, {selectedCourse.lessons} lessons
                        </h3>
                        <div className="space-y-3">
                          {syllabus.map((mod) => (
                            <div key={mod.num} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                              <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-sm" style={{ background: ls.color, fontFamily: 'var(--font-jakarta)' }}>{mod.num}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-900">{mod.name}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5"><strong style={{ color: ls.color }}>Build:</strong> {mod.project} · {mod.lessons.length} lessons</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  </div>

                  {/* RIGHT: Checkout panel */}
                  <div className="lg:col-span-2">
                    <Reveal delay={0.15}>
                      <div className="card-3d p-6 lg:sticky lg:top-28">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>Choose your batch</h3>

                        {/* Ratio selection */}
                        <div className="space-y-3 mb-6">
                          <button
                            onClick={() => setRatio('1:4')}
                            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${ratio === '1:4' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${ratio === '1:4' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Users className="w-5 h-5" strokeWidth={2.2} /></div>
                                <div>
                                  <div className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>1:4 Cohort</div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">1 teacher per 4 students</div>
                                </div>
                              </div>
                              <div className="text-right shrink-0"><div className="text-lg font-extrabold" style={{ color: ls.color }}>${ls.price}</div></div>
                            </div>
                          </button>

                          <button
                            onClick={() => setRatio('1:1')}
                            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${ratio === '1:1' ? 'border-violet-500 bg-violet-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${ratio === '1:1' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}><User className="w-5 h-5" strokeWidth={2.2} /></div>
                                <div>
                                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>1:1 Personal<span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Premium</span></div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">1 teacher dedicated to you</div>
                                </div>
                              </div>
                              <div className="text-right shrink-0"><div className="text-lg font-extrabold" style={{ color: ls.color }}>${ls.price + 100}</div></div>
                            </div>
                          </button>
                        </div>

                        {/* Summary */}
                        <div className="rounded-2xl bg-slate-50 p-4 mb-4 space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-slate-500">Course</span><span className="font-bold text-slate-900">{track.name} — {selectedCourse.level}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Batch type</span><span className="font-bold" style={{ color: ratio === '1:1' ? '#7C3AED' : '#2563EB' }}>{ratio === '1:1' ? '1:1 Personal' : '1:4 Cohort'}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-bold text-slate-900">{selectedCourse.durationWeeks} weeks · {selectedCourse.lessons} lessons</span></div>
                          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                            <span className="text-sm font-bold text-slate-900">Total</span>
                            <span className="text-2xl font-extrabold" style={{ color: ls.color, fontFamily: 'var(--font-jakarta)' }}>${displayPrice}</span>
                          </div>
                        </div>

                        {/* CTA — login-gated, creates purchase_intent, then opens Razorpay */}
                        <ReserveSeatButton
                          track={trackId}
                          level={selectedCourse.level}
                          ratio={ratio}
                          paymentLink={paymentLink}
                          courseName={`${track.name} — ${selectedCourse.level}`}
                          accentColor={ls.color}
                        />

                        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />14-day refund</span>
                          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />Secure checkout</span>
                        </div>
                      </div>
                    </Reveal>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* If nothing selected, show prompt */}
          {!selectedLevel && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Click a level card above to see detailed syllabus and enrollment options.</p>
            </div>
          )}

        </div>
      </section>
    </BrandLayout>
  );
}
