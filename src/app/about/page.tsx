'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Sparkles,
  Lightbulb,
  Heart,
  Target,
  Quote,
  Linkedin,
  Twitter,
  Users,
  Rocket,
  Eye,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import { FloatingStatsCluster } from '@/components/brand/floating-stats-cluster';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  TiltCard,
  MagneticButton,
  SplitText,
  CountUp,
  ParallaxOrb,
} from '@/components/brand/effects-kit';
import { MIMO, BRAND } from '@/lib/sariro-data';

const PRINCIPLE_ICONS = [Brain, Target, Lightbulb, Heart];

const MIMO_NUMBERS = MIMO.numbers.map((n) => {
  const match = String(n.value).match(/^(\d+)/);
  if (match) return { ...n, numValue: parseInt(match[1], 10), original: n.value };
  return { ...n, numValue: null, original: n.value };
});

/* Team members (placeholder — replace with real team later) */
const TEAM = [
  { name: 'Mimo Patra', role: 'Founder & CEO', bio: 'AI educator, researcher, 7 patents. Teaches every cohort personally.', avatar: 'M', accent: '#F59E0B', email: BRAND.emails.founder, isFounder: true },
  { name: 'Lead Mentor', role: 'Senior AI Engineer', bio: 'Ships production AI systems by day, mentors Sariro cohorts by night.', avatar: 'L', accent: '#2563EB', email: BRAND.emails.contact },
  { name: 'Curriculum Lead', role: 'Education Design', bio: 'Former university professor. Designs every module to make thinking stick.', avatar: 'C', accent: '#7C3AED', email: BRAND.emails.contact },
  { name: 'Community Manager', role: 'Student Success', bio: 'Makes sure no student falls behind. Your first friend at Sariro.', avatar: 'S', accent: '#16A34A', email: BRAND.emails.support },
];

export default function AboutPage() {
  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'About — Sariro | Meet Founder & CEO Mimo Patra';
  }, []);

  return (
    <BrandLayout>
      {/* ============ HERO ============ */}
      <PageHero
        eyebrow="The brand"
        accentColor="#F59E0B"
        breadcrumb="About"
        variant="about"
        title={
          <>
            We're not building a course.{' '}
            <span className="gradient-text">We're building a future</span>{' '}
            where thinking comes first.
          </>
        }
        subtitle="Sariro exists because the world doesn't need more people who can copy code. It needs people who can think — who can break problems apart, ask the right questions, and build what doesn't exist yet."
      >
        <Link href="/courses" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm">
          <Sparkles className="w-4 h-4" />
          Explore Courses
        </Link>
        <Link href="/contact" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          Join the mission
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ============ BRAND STORY — What is Sariro? ============ */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.08)" size={400} speed={100} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.06)" size={320} speed={-70} position="bottom-10 -right-20" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
              What is Sariro?
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="A brand that refuses to teach you to type." highlight="type." highlightClassName="gradient-text" />
              <br />
              <SplitText text="We teach you to think." highlight="think." highlightClassName="gradient-text" delay={0.3} />
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-6">
              Sariro is an AI & technology education platform built on one belief: <span className="font-bold text-slate-900">AI education shouldn't be gatekept by jargon.</span> An 8-year-old and a grandpa should both be able to follow along — and walk away able to build.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
              We don't sell video dumps. We don't sell "follow along" tutorials. Every Sariro cohort is live, mentored, and ends with a real, shipped artifact — something you can show an employer, a client, or yourself and say: <span className="italic font-bold text-slate-900">"I built that."</span>
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Because the future doesn't belong to people who can call an API. It belongs to people who understand why it works — and what to do when it doesn't.
            </p>
          </Reveal>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ============ MISSION + VISION ============ */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.08)" size={380} speed={80} position="top-20 right-10" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Mission */}
            <Reveal>
              <TiltCard className="card-3d p-8 h-full" maxTilt={5}>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-5">
                  <Target className="w-6 h-6 text-amber-600" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Our Mission
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To teach AI the way it should be taught — by building real things, with real mentors, in cohorts small enough that every student matters. No fluff. No filler. No copying.
                </p>
              </TiltCard>
            </Reveal>
            {/* Vision */}
            <Reveal delay={0.1}>
              <TiltCard className="card-3d p-8 h-full" maxTilt={5}>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                  <Eye className="w-6 h-6 text-blue-600" strokeWidth={2.2} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Our Vision
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A world where AI literacy isn't a privilege — it's a baseline. Where every student, in every country, has access to education that teaches them to think, not just to type.
                </p>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ============ FOUNDER & CEO ============ */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.10)" size={420} speed={100} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.06)" size={340} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              The person behind it
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="Meet the Founder & CEO." highlight="CEO." highlightClassName="gradient-text" />
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* LEFT: Portrait */}
            <Reveal y={30} className="lg:col-span-5">
              <div className="relative max-w-sm mx-auto">
                {/* Glow frame */}
                <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-30 pointer-events-none" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #2563EB 100%)' }} />
                <div className="relative rounded-3xl overflow-hidden card-3d">
                  <Image
                    src="/images/mimo-portrait.png"
                    alt={`${MIMO.name} — Founder & CEO`}
                    width={640}
                    height={720}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  {/* Gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent">
                    <div className="text-white">
                      <div className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {MIMO.name}
                      </div>
                      <div className="text-sm font-bold text-amber-300 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        FOUNDER & CEO
                      </div>
                    </div>
                  </div>
                  {/* Badge: Founder */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    ★ Founder
                  </div>
                </div>
                {/* Social row */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-slate-700 hover:text-amber-600 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-slate-700 hover:text-amber-600 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href={`mailto:${BRAND.emails.founder}`} className="px-4 h-10 rounded-xl glass-panel flex items-center justify-center text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {BRAND.emails.founder}
                  </a>
                </div>
              </div>
            </Reveal>

            {/* RIGHT: Bio + living numbers */}
            <Reveal y={30} delay={0.1} className="lg:col-span-7">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {MIMO.bio.split('.')[0]}.
              </h3>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-4">
                {MIMO.bio.split('.').slice(1).join('.').trim()}
              </p>
              <p className="text-base text-slate-600 leading-relaxed mb-8">
                Mimo started Sariro after a decade watching smart students graduate unable to build anything real. The fix wasn't more tutorials — it was teaching thinking. Sariro is the result: cohort-based, project-first, mentor-led AI education that respects your time and your curiosity.
              </p>

              {/* Living numbers — bigger, more dramatic */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MIMO_NUMBERS.map((n, i) => {
                  const accents = ['#F59E0B', '#2563EB', '#7C3AED', '#16A34A'];
                  const accent = accents[i % accents.length];
                  return (
                    <Reveal key={n.label} delay={i * 0.1}>
                      <div className="relative rounded-2xl p-5 text-center overflow-hidden" style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}>
                        {/* Glow */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-2xl opacity-30" style={{ background: accent }} />
                        <div className="relative">
                          <div className="text-3xl sm:text-4xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)', color: accent }}>
                            {n.numValue !== null ? (
                              <CountUp value={n.numValue} suffix={String(n.original).replace(/^\d+/, '')} duration={2} />
                            ) : (
                              n.original
                            )}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                            {n.label}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {/* Floating stats cluster */}
              <div className="flex flex-col items-center pt-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Hover to explore the stats
                  </span>
                </div>
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
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ============ TEAM ============ */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(37, 99, 235, 0.08)" size={380} speed={90} position="top-20 left-10" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.06)" size={300} speed={-60} position="bottom-10 right-10" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              The team
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="Educators who actually teach." highlight="teach." highlightClassName="gradient-text" />
            </h2>
            <p className="mt-4 text-slate-600 max-w-xl mx-auto">
              Every person on this team has shipped real work. They're not career academics — they're builders who happen to teach.
            </p>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
            {TEAM.map((member) => (
              <StaggerItem key={member.name}>
                <TiltCard className="card-3d p-6 h-full text-center" maxTilt={6}>
                  {/* Avatar */}
                  <div className="relative mx-auto mb-4 w-16 h-16">
                    {member.isFounder && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-[8px] font-bold z-10" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        ★
                      </div>
                    )}
                    <div
                      className="w-full h-full rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${member.accent}, ${member.accent}99)`, fontFamily: 'var(--font-jakarta)' }}
                    >
                      {member.avatar}
                    </div>
                  </div>
                  {/* Name + Role */}
                  <h3 className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {member.name}
                  </h3>
                  <div className="text-xs font-bold uppercase tracking-wider mt-1 mb-3" style={{ fontFamily: 'var(--font-grotesk)', color: member.accent }}>
                    {member.role}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
                  {/* Email link */}
                  <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1 mt-4 text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    <Linkedin className="w-3 h-3" />
                    Connect
                  </a>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>

          {/* Join the team CTA */}
          <Reveal delay={0.3}>
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 mb-4">Want to join the team?</p>
              <a href={`mailto:${BRAND.emails.hr}`} className="btn-tactile btn-tactile-light px-6 py-3 text-sm">
                <Users className="w-4 h-4" />
                We're hiring → {BRAND.emails.hr}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ============ PRINCIPLES ============ */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.08)" size={380} speed={100} position="top-20 right-10" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.06)" size={320} speed={-70} position="bottom-10 left-10" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              The philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="Four ideas that shape every Sariro course." highlight="every Sariro course." highlightClassName="gradient-text" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                Not a manifesto. Just the four things Mimo refuses to compromise on.
              </p>
            </Reveal>
          </div>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-6" stagger={0.1}>
            {MIMO.principles.map((p, i) => {
              const Icon = PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length];
              const accent = ['#F59E0B', '#2563EB', '#7C3AED', '#16A34A'][i % 4];
              return (
                <StaggerItem key={p.title}>
                  <TiltCard className="card-3d p-7 h-full group" maxTilt={5}>
                    <div className="flex items-start gap-5">
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity" style={{ background: accent }} />
                        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${accent}15`, color: accent }}>
                          <Icon className="w-7 h-7" strokeWidth={2.2} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white" style={{ background: accent, fontFamily: 'var(--font-grotesk)' }}>
                            Principle {String(i + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          {p.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{p.body}</p>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ============ QUOTE ============ */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.12)" size={400} speed={100} position="top-10 left-10" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-30 pointer-events-none" style={{ background: '#F59E0B' }} />
              <div className="relative p-8 sm:p-14 text-center">
                <Quote className="w-12 h-12 text-amber-400 mx-auto mb-6" />
                <p className="text-2xl sm:text-3xl font-bold text-white leading-snug max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  "Anyone can copy a tutorial. We teach you to think — to break problems apart, to ask the right questions. The typing comes naturally after."
                </p>
                <div className="mt-6 text-amber-300 text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  — {MIMO.name}, Founder & CEO
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(245, 158, 11, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="The future is being built right now." highlight="built right now." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto">
              The question is whether you'll be the one building it — or the one watching. Sariro exists to make sure you're the builder.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/courses" className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm">
                <Rocket className="w-4 h-4" />
                Start building
              </Link>
              <a href={`mailto:${BRAND.emails.founder}`} className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm">
                Talk to Mimo directly
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
