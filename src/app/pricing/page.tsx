'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  X,
  ShieldCheck,
  Wallet,
  Users,
  Sparkles,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  TiltCard,
  MagneticButton,
  SplitText,
  CountUp,
  ParallaxOrb,
  StickyScrollSection,
} from '@/components/brand/effects-kit';
import { PRICING_TIERS } from '@/lib/sariro-data';

const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
  cyan: '#06B6D4',
};

/* Trust badges */
const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: '14-day money-back',
    body: 'Not the right fit? Get a full refund within 14 days — no questions, no friction.',
    accent: '#16A34A',
  },
  {
    icon: Wallet,
    title: 'No hidden fees',
    body: 'One price covers everything: live sessions, recordings, mentor feedback, community.',
    accent: '#2563EB',
  },
  {
    icon: Users,
    title: 'Lifetime community',
    body: 'Once you finish a Builder-tier cohort, you\'re in the alumni Slack forever — no renewal.',
    accent: '#7C3AED',
  },
];

/* Comparison rows: feature × tier (Starter / Builder / School Pro) */
const COMPARISON: { label: string; values: (boolean | string)[] }[] = [
  { label: 'Cohort enrollment', values: ['1 cohort', '1 advanced cohort', 'Full-semester'] },
  { label: 'Live sessions + recordings', values: [true, true, true] },
  { label: 'Community access', values: ['During cohort', 'Lifetime', 'School-wide'] },
  { label: 'Portfolio projects reviewed', values: ['1', '3', 'Unlimited'] },
  { label: '1:1 mentor sessions', values: [false, '3 sessions', 'Quarterly'] },
  { label: 'Career strategy session', values: [false, true, true] },
  { label: 'Priority event invites', values: [false, true, true] },
  { label: 'Teacher training', values: [false, false, 'Up to 10 staff'] },
  { label: 'Custom learning portal', values: [false, false, true] },
  { label: 'CSTA / IB alignment docs', values: [false, false, true] },
  { label: 'Dedicated success manager', values: [false, false, true] },
  { label: 'Certificate of completion', values: [true, true, true] },
];

export default function PricingPage() {
  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'Pricing — Sariro | Simple, Honest, No Surprises';
  }, []);

  return (
    <BrandLayout>
      <PageHero
        eyebrow="Simple honest pricing"
        accentColor="#2563EB"
        breadcrumb="Pricing"
        variant="pricing"
        title={
          <>
            One price. <span className="gradient-text">No surprises.</span>
          </>
        }
        subtitle="Every cohort includes live sessions, recordings, mentor feedback, and community access. 14-day money-back guarantee on every enrollment — no questions asked."
      >
        <Link href="#tiers" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm">
          <Sparkles className="w-4 h-4" />
          Compare plans
        </Link>
        <Link href="/contact" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          <MessageCircle className="w-4 h-4" />
          Talk to our team
        </Link>
      </PageHero>

      {/* ====== Pricing tiers ====== */}
      <section id="tiers" className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color="rgba(37, 99, 235, 0.10)" size={420} speed={120} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={340} speed={-90} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 3D stage wrapper */}
          <div style={{ perspective: '1500px' }}>
          <StaggerGroup
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch"
            stagger={0.12}
          >
            {PRICING_TIERS.map((tier) => {
              const accent = ACCENT_HEX[tier.accent] ?? '#2563EB';
              const isPopular = tier.popular;

              return (
                <StaggerItem key={tier.id}>
                  <div
                    className="relative h-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isPopular ? 'translateZ(30px) scale(1.05)' : 'translateZ(0)',
                      zIndex: isPopular ? 10 : 1,
                    }}
                  >
                  <TiltCard className="h-full" maxTilt={isPopular ? 6 : 4}>
                    {/* Glow under popular card */}
                    {isPopular && (
                      <div
                        className="absolute -inset-4 rounded-3xl blur-2xl opacity-30 pointer-events-none"
                        style={{ background: accent }}
                      />
                    )}

                    <div
                      className={`relative h-full card-3d p-6 sm:p-7 flex flex-col ${
                        isPopular ? 'border-2' : ''
                      }`}
                      style={isPopular ? { borderColor: accent } : undefined}
                    >
                      {/* Popular ribbon */}
                      {isPopular && (
                        <div
                          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5"
                          style={{
                            background: accent,
                            fontFamily: 'var(--font-grotesk)',
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          Most popular
                        </div>
                      )}

                      {/* Tier header */}
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${accent}15`, color: accent }}
                          >
                            <span className="font-extrabold text-sm" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              {tier.name[0]}
                            </span>
                          </div>
                          <h3
                            className="text-xl font-extrabold text-slate-900"
                            style={{ fontFamily: 'var(--font-jakarta)' }}
                          >
                            {tier.name}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{tier.tagline}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-6 pb-6 border-b border-slate-100">
                        {tier.price === null ? (
                          <div className="flex items-baseline gap-2">
                            <span
                              className="text-4xl font-extrabold"
                              style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}
                            >
                              Custom
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-500">$</span>
                            <span
                              className="text-5xl font-extrabold"
                              style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}
                            >
                              <CountUp value={tier.price} duration={2} />
                            </span>
                            <span className="text-sm text-slate-500">/ {tier.period}</span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 flex-1 mb-6">
                        {tier.features.map((f, fi) => {
                          const isHeader = fi === 1 && tier.id === 'builder';
                          return (
                            <li
                              key={fi}
                              className={`flex items-start gap-2.5 text-sm ${
                                isHeader ? 'font-bold text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              <Check
                                className="w-4 h-4 mt-0.5 shrink-0"
                                style={{ color: accent }}
                                strokeWidth={3}
                              />
                              {f}
                            </li>
                          );
                        })}
                      </ul>

                      {/* CTA */}
                      <div
                        className={`rounded-xl overflow-hidden ${isPopular ? '' : ''}`}
                        style={
                          isPopular
                            ? { background: accent, boxShadow: `0 10px 0 -1px ${accent}cc, 0 18px 30px -12px ${accent}55` }
                            : undefined
                        }
                      >
                        <MagneticButton
                          as="a"
                          href="/contact"
                          strength={0.2}
                          className={`btn-tactile w-full px-5 py-3 text-sm justify-center ${
                            isPopular ? 'btn-tactile-primary' : 'btn-tactile-light'
                          }`}
                        >
                          {tier.cta}
                          <ArrowRight className="w-4 h-4" />
                        </MagneticButton>
                      </div>
                    </div>
                  </TiltCard>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
          </div>

          {/* Below-grid note */}
          <Reveal>
            <p className="text-center text-xs text-slate-500 mt-8">
              All prices in USD. Stripe-secured checkout. Need an invoice for your school or employer? <Link href="/contact" className="text-blue-600 font-bold underline">Get in touch</Link>.
            </p>
          </Reveal>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Trust badges ====== */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(22, 163, 74, 0.10)" size={360} speed={80} position="top-20 left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Why people trust us
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="We earn your trust before you pay a cent." highlight="trust" highlightClassName="gradient-text" />
            </h2>
          </div>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.12}>
            {TRUST_BADGES.map((b) => (
              <StaggerItem key={b.title}>
                <TiltCard className="card-3d p-6 h-full" maxTilt={7}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${b.accent}15`, color: b.accent }}
                  >
                    <b.icon className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <h3
                    className="text-lg font-extrabold text-slate-900 mb-2"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{b.body}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Sticky comparison ====== */}
      <StickyScrollSection pinHeight="160vh">
        <div className="text-center max-w-3xl px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Side-by-side
          </span>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="Compare every feature, line by line." highlight="every feature," highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.2}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              No asterisks. No fine print. Scroll on for the full breakdown below.
            </p>
          </Reveal>
        </div>
      </StickyScrollSection>

      {/* ====== Comparison table ====== */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop table */}
          <Reveal>
            <div className="hidden md:block card-3d overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-5 text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      Feature
                    </th>
                    {PRICING_TIERS.map((tier) => {
                      const accent = ACCENT_HEX[tier.accent];
                      return (
                        <th
                          key={tier.id}
                          className="text-center p-5 text-sm font-extrabold"
                          style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {tier.name}
                            {tier.popular && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: accent, fontFamily: 'var(--font-grotesk)' }}>
                                POPULAR
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, ri) => (
                    <tr
                      key={row.label}
                      className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    >
                      <td className="p-4 text-sm font-medium text-slate-700">{row.label}</td>
                      {row.values.map((v, vi) => (
                        <td key={vi} className="p-4 text-center">
                          {typeof v === 'boolean' ? (
                            v ? (
                              <Check className="w-5 h-5 mx-auto" style={{ color: ACCENT_HEX[PRICING_TIERS[vi].accent] }} strokeWidth={3} />
                            ) : (
                              <X className="w-4 h-4 mx-auto text-slate-300" />
                            )
                          ) : (
                            <span className="text-sm font-bold text-slate-900">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* Mobile: stacked cards (one per tier) */}
          <div className="md:hidden space-y-6">
            {PRICING_TIERS.map((tier) => {
              const accent = ACCENT_HEX[tier.accent];
              return (
                <div key={tier.id} className="card-3d p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-lg font-extrabold"
                      style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}
                    >
                      {tier.name}
                    </h3>
                    {tier.popular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: accent, fontFamily: 'var(--font-grotesk)' }}>
                        POPULAR
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5">
                    {COMPARISON.map((row, ri) => {
                      const v = row.values[PRICING_TIERS.indexOf(tier)];
                      return (
                        <li key={ri} className="flex items-start justify-between gap-3 text-sm">
                          <span className="text-slate-600">{row.label}</span>
                          <span className="font-bold text-slate-900 text-right shrink-0">
                            {typeof v === 'boolean' ? (
                              v ? <Check className="w-4 h-4" style={{ color: accent }} strokeWidth={3} /> : <X className="w-4 h-4 text-slate-300" />
                            ) : v}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== FAQ ====== */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={360} speed={90} position="bottom-10 right-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Common questions
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Before you ask." />
            </h2>
          </div>

          <StaggerGroup className="space-y-4" stagger={0.08}>
            {[
              {
                q: 'Do you offer scholarships?',
                a: 'Yes. We reserve 15% of every cohort for needs-based scholarships. Email contact@sariro.com with a one-paragraph note about your situation.',
              },
              {
                q: 'Can my employer pay for this?',
                a: 'Absolutely. We send proper invoices and accept POs from companies. Most Builder-tier enrollments are now reimbursed through L&D budgets.',
              },
              {
                q: 'What if I miss a live session?',
                a: 'Every session is recorded and posted within 24 hours. You still get the project feedback even if you attend async.',
              },
              {
                q: 'Is the School Pro price really custom?',
                a: 'It depends on student count, training depth, and duration. Most schools land between $8K–$25K for a full semester. Book a call for a real quote.',
              },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="glass-panel rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {item.q}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Still unsure? Let's talk." highlight="Let's talk." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Book a 15-minute call. We'll help you pick the right tier — or tell you honestly if Sariro isn't the right fit.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton as="a" href="/contact" strength={0.25} className="btn-tactile btn-tactile-primary px-6 py-3.5">
                <MessageCircle className="w-4 h-4" />
                Talk to our team
              </MagneticButton>
              <MagneticButton as="a" href="/courses" strength={0.25} className="btn-tactile btn-tactile-light px-6 py-3.5">
                Browse courses
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
