'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Layers,
  BookOpen,
  Calendar,
  CheckCircle2,
  Users,
  User,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import {
  Reveal,
  CountUp,
  ParallaxOrb,
} from '@/components/brand/effects-kit';
import {
  COURSES,
  getRazorpayLink,
  type LearningRatio,
} from '@/lib/sariro-data';

const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
  cyan: '#06B6D4',
};

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course') || '';
  const [ratio, setRatio] = useState<LearningRatio>('1:4');

  const course = useMemo(
    () => COURSES.find((c) => c.id === courseId),
    [courseId]
  );

  // If course not found, show error
  if (!course) {
    return (
      <BrandLayout>
        <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
          <div className="relative max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Course not found
            </h1>
            <p className="text-slate-600 mb-8">
              We couldn't find the course you're looking for. Browse our catalog and try again.
            </p>
            <Link href="/courses" className="btn-tactile btn-tactile-primary px-6 py-3 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Browse courses
            </Link>
          </div>
        </section>
      </BrandLayout>
    );
  }

  const accent = ACCENT_HEX[course.accent] ?? '#2563EB';
  const displayPrice = ratio === '1:1' ? course.price + 100 : course.price;
  const paymentLink = getRazorpayLink(course.level, ratio);
  const syllabus = 'syllabus' in course ? (course.syllabus as Array<{ num: string; name: string; project: string; lessons: string[] }>) : [];

  return (
    <BrandLayout>
      <section className="relative pt-28 sm:pt-36 pb-12 sm:pb-16 overflow-hidden">
        <ParallaxOrb color={`${accent}1A`} size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={340} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Back link */}
          <Link
            href={`/courses/${course.level.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 mb-6 transition-colors"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {course.level} courses
          </Link>

          {/* Course header card */}
          <Reveal>
            <div
              className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden mb-8"
              style={{ background: `linear-gradient(135deg, ${accent} 0%, #0F172A 100%)` }}
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/20"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {course.level} course
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/15"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {course.audience}
                  </span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl font-extrabold mb-2"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {course.title}
                </h1>
                <p className="text-sm sm:text-base text-white/90 mb-4">{course.tagline}</p>
                <div className="flex items-center gap-4 text-xs flex-wrap" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <strong>{course.durationWeeks}</strong> weeks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <strong>{course.modules}</strong> modules
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <strong>{course.lessons}</strong> lessons
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Next: <strong>{course.nextCohort}</strong>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Two-column layout: syllabus summary + checkout panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* LEFT: Outcomes + syllabus preview (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Outcomes */}
              <Reveal>
                <div className="card-3d p-6">
                  <h3
                    className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
                    style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    What you'll be able to do
                  </h3>
                  <ul className="space-y-2.5">
                    {course.outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span
                          className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold mt-0.5"
                          style={{ background: `${accent}15`, color: accent }}
                        >
                          ✓
                        </span>
                        <span className="text-sm text-slate-700 leading-relaxed">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              {/* Syllabus preview */}
              <Reveal delay={0.1}>
                <div className="card-3d p-6">
                  <h3
                    className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
                    style={{ color: accent, fontFamily: 'var(--font-grotesk)' }}
                  >
                    <Layers className="w-4 h-4" />
                    Syllabus — {course.modules} modules, {course.lessons} lessons
                  </h3>
                  <div className="space-y-3">
                    {syllabus.map((mod) => (
                      <div key={mod.num} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                        <div
                          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white font-extrabold text-sm"
                          style={{ background: accent, fontFamily: 'var(--font-jakarta)' }}
                        >
                          {mod.num}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900">{mod.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <strong style={{ color: accent }}>Build:</strong> {mod.project} · {mod.lessons.length} lessons
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            {/* RIGHT: Checkout panel (2 cols) — sticky on desktop */}
            <div className="lg:col-span-2">
              <Reveal delay={0.15}>
                <div className="card-3d p-6 lg:sticky lg:top-28">
                  {/* Price + ratio selection */}
                  <h3
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    Choose your batch
                  </h3>

                  {/* Ratio options */}
                  <div className="space-y-3 mb-6">
                    {/* 1:4 option */}
                    <button
                      onClick={() => setRatio('1:4')}
                      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                        ratio === '1:4'
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${ratio === '1:4' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Users className="w-5 h-5" strokeWidth={2.2} />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              1:4 Cohort
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              1 teacher per 4 students · learn with peers
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-extrabold" style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}>
                            ${course.price}
                          </div>
                          {course.originalPrice && (
                            <div className="text-[10px] font-bold line-through text-red-500">${course.originalPrice}</div>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* 1:1 option */}
                    <button
                      onClick={() => setRatio('1:1')}
                      className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                        ratio === '1:1'
                          ? 'border-violet-500 bg-violet-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${ratio === '1:1' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <User className="w-5 h-5" strokeWidth={2.2} />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              1:1 Personal
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                Premium
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              1 teacher dedicated to you · flexible scheduling
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-lg font-extrabold" style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}>
                            ${course.price + 100}
                          </div>
                          {course.originalPrice && (
                            <div className="text-[10px] font-bold line-through text-red-500">${course.originalPrice}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="rounded-2xl bg-slate-50 p-4 mb-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Course</span>
                      <span className="font-bold text-slate-900">{course.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Level</span>
                      <span className="font-bold text-slate-900">{course.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Batch type</span>
                      <span className="font-bold" style={{ color: ratio === '1:1' ? '#7C3AED' : '#2563EB' }}>
                        {ratio === '1:1' ? '1:1 Personal' : '1:4 Cohort'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-bold text-slate-900">{course.durationWeeks} weeks · {course.lessons} lessons</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Next cohort</span>
                      <span className="font-bold text-slate-900">{course.nextCohort}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-extrabold" style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}>
                        ${displayPrice}
                      </span>
                    </div>
                  </div>

                  {/* CTA → Razorpay */}
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile btn-tactile-primary w-full px-6 py-4 text-base"
                    style={{ background: accent }}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Reserve your seat
                    <ArrowRight className="w-5 h-5" />
                  </a>

                  {/* Trust badges */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      14-day refund
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Secure checkout
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center mt-3 leading-relaxed">
                    You'll be redirected to Razorpay's secure payment page. Your seat is confirmed instantly after payment.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
