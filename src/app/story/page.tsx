'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Heart, Rocket, Eye, Users, Globe, Zap, HelpCircle, Ban, Hammer } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import { Reveal, SplitText, TiltCard, MagneticButton, CountUp, ParallaxOrb } from '@/components/brand/effects-kit';
import { BRAND, HERO_STATS } from '@/lib/sariro-data';

const CHAPTERS = [
  { num: '01', title: 'The Question', body: 'It started with a question that would not go away: why do smart students graduate unable to build anything real? They pass exams. They can recite definitions. But ship a working AI feature? Freeze. The question sat in the back of Mimo\'s mind for twelve years.', accent: '#7C3AED', icon: HelpCircle },
  { num: '02', title: 'The Refusal', body: 'Mimo spent 12 years watching this — in classrooms, in bootcamps, in corporate training rooms. Watching smart people leave with certificates and zero confidence. The industry kept saying "more tutorials, more videos, more bootcamps." Mimo refused. Tutorials teach typing. They do not teach thinking.', accent: '#06B6D4', icon: Ban },
  { num: '03', title: 'The Bet', body: 'So Mimo made a bet: teach thinking, not typing. Build a brand that respects curiosity over credentials, projects over playlists, questions over answers. Cohort-based. Mentor-led. Project-first. Plain language. No jargon. No gatekeeping. Sariro was the name. The bet was that students would actually learn.', accent: '#F59E0B', icon: Sparkles },
  // The numbers here are Mimo's career before Sariro, not Sariro's results.
  // Framed as what he brought TO the bet rather than what the bet returned.
  { num: '04', title: 'The Record', body: 'He was not guessing. Across twelve years before Sariro, Mimo had taught 5,000+ students from 65 countries, published 36 research papers and filed 7 patents. A history teacher he taught became an engineer. A 16-year-old built her first working model. A principal started a club. The proof was never the numbers — it was the learners those numbers stood for.', accent: '#16A34A', icon: Hammer },
  { num: '05', title: 'The Future', body: 'The next chapter is not ours to write. It is yours. If you are curious — really curious, the kind of curious that keeps you up at night — you belong here. Sariro is not a course. It is not a platform. It is a movement of people who refuse to watch the future happen to them.', accent: '#EC4899', icon: Globe },
];

const VALUES = [
  { title: 'Thinking over typing', body: 'Anyone can copy a tutorial. We teach you to think — to break problems apart, to ask the right questions, to reason about systems.', accent: '#7C3AED', icon: Sparkles },
  { title: 'Understand, don’t memorise', body: 'A grade is a receipt for remembering. We teach until the reasoning holds on its own, so the next grade gets easier instead of harder.', accent: '#F59E0B', icon: Rocket },
  { title: 'Accessible by design', body: 'No subject should be gatekept by jargon. We teach in plain language. An 8-year-old and a grandpa should both be able to follow along.', accent: '#16A34A', icon: Heart },
  { title: 'Community, not customers', body: 'Once you are in, you are in. Lifetime community access, mentorship opportunities, and a network that shows up when you ship — and when you stumble.', accent: '#06B6D4', icon: Users },
];

export default function StoryPage() {
  return (
    <BrandLayout>
      <PageHero
        eyebrow="Our story"
        accentColor="#7C3AED"
        breadcrumb="Story"
        variant="story"
        title={<>It started with a <span className="gradient-text">question</span> that would not go away.</>}
        subtitle="Why do smart students graduate unable to build anything real? This is the story of how that question became Sariro — and how a refusal to teach the easy way became a movement."
      >
        <Link href="/about" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          Meet the founder
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/courses" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm">
          <Sparkles className="w-4 h-4" />
          Join a cohort
        </Link>
      </PageHero>

      {/* 5 chapters */}
      <section className="relative py-14 sm:py-20 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(124, 58, 237, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(37, 99, 235, 0.3) 0%, transparent 50%)' }} />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>— The journey —</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Five chapters.{' '}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">One transformation.</span>
            </h2>
          </Reveal>
          <div className="space-y-8">
            {CHAPTERS.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <Reveal key={ch.num} delay={i * 0.1} y={50}>
                  <div
                    className="relative rounded-3xl p-8 sm:p-10 border border-white/10 overflow-hidden group cursor-pointer transition-all duration-300 hover:border-white/30 hover:scale-[1.02] active:scale-[0.99]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: `0 0 0 0 ${ch.accent}00`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 20px 60px -15px ${ch.accent}80, 0 0 0 1px ${ch.accent}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 0 0 ${ch.accent}00`;
                    }}
                  >
                    {/* Hover glow overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${ch.accent}25 0%, transparent 60%)`,
                      }}
                    />
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" style={{ background: ch.accent }} />
                    <div className="absolute top-4 right-6 text-7xl font-extrabold opacity-10 group-hover:opacity-20 transition-opacity duration-500 select-none" style={{ fontFamily: 'var(--font-jakarta)', color: ch.accent }}>{ch.num}</div>
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                        style={{ background: `linear-gradient(135deg, ${ch.accent}, ${ch.accent}99)`, boxShadow: `0 10px 25px -5px ${ch.accent}80` }}
                      >
                        <Icon className="w-6 h-6 text-white" strokeWidth={2.4} />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 group-hover:text-white transition-colors" style={{ fontFamily: 'var(--font-jakarta)' }}>{ch.title}</h3>
                      <p className="text-base sm:text-lg text-slate-300 leading-relaxed">{ch.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#14100C" toColor="#FFFFFF" />

      {/* Values */}
      <section className="relative py-14 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={400} speed={100} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.06)" size={320} speed={-70} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>What we stand for</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="Four values we refuse to compromise." highlight="refuse to compromise." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 0.1}>
                  <TiltCard className="card-3d p-6 h-full" maxTilt={6}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${v.accent}15`, color: v.accent }}>
                      <Icon className="w-6 h-6" strokeWidth={2.2} />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>{v.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{v.body}</p>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#FBF9F6" />

      {/* Impact numbers */}
      <section className="relative py-14 sm:py-20 mesh-bg-soft-violet overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.10)" size={380} speed={90} position="top-20 right-10" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>The proof</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="Numbers that started with one student." highlight="one student." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {HERO_STATS.map((s, i) => {
              const accents = ['#2563EB', '#16A34A', '#7C3AED', '#F59E0B'];
              const accent = accents[i % accents.length];
              return (
                <Reveal key={s.label} delay={i * 0.1}>
                  <div className="relative rounded-2xl p-6 text-center overflow-hidden" style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: accent }} />
                    <div className="relative">
                      <div className="text-4xl sm:text-5xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)', color: accent }}>
                        <CountUp value={s.value} suffix={s.suffix} duration={2} />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2" style={{ fontFamily: 'var(--font-grotesk)' }}>{s.label}</div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={0.4}>
            <p className="text-center mt-8 text-slate-500 italic">"Every number on this page started with one student who decided to take a class. We are still counting." — {BRAND.founder}</p>
          </Reveal>
        </div>
      </section>

      <WaveDivider3D fromColor="#FBF9F6" toColor="#FFFFFF" />

      {/* Closing CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="The next chapter is yours." highlight="yours." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto">Sariro is not a course you take. It is a community you join. A way of thinking you adopt. A future you build.</p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <MagneticButton as="a" href="/courses" strength={0.2} className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm">
                <Zap className="w-4 h-4" />
                Start your chapter
              </MagneticButton>
              <MagneticButton as="a" href="/about" strength={0.2} className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm">
                Meet the team
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
