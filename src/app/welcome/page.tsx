'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, Rocket, ArrowRight, Star, Users, CheckCircle2, Calendar,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import ProofPoints from '@/components/brand/proof-points';
import SelfServeBooking from '@/components/trial/self-serve-booking';

/* ════════════════════════════════════════════════════════════════════════
   Welcome Page — /welcome
   ════════════════════════════════════════════════════════════════════════
   Sections:
   1. Hero — "Try Sariro — Free Demo Class"
   2. Why take a demo — 3 benefit cards
   3. All testimonials — full grid
   4. Book a free class — the same self-serve form as /free-class
   5. Footer CTA — "Not ready? Browse courses"
   ════════════════════════════════════════════════════════════════════════ */

export default function WelcomePage() {
  return (
    <BrandLayout>
      {/* =================== HERO =================== */}
      <PageHero
        eyebrow="Free Demo Class"
        accentColor="#F59E0B"
        breadcrumb="Welcome"
        variant="about"
        title={
          <>
            Try Sariro <span className="gradient-text">for free.</span>
          </>
        }
        subtitle="Meet your teacher. Build something real in 30 minutes. Ask anything. No credit card, no commitment — just a taste of how Sariro teaches."
      >
        <a href="#book" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm" style={{ background: '#F59E0B' }}>
          <Rocket className="w-4 h-4" />
          Book my demo class
        </a>
        <a href="#why" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          <Star className="w-4 h-4" />
          What happens in the class
        </a>
      </PageHero>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F0FDF4" />

      {/* =================== BOOK A FREE CLASS =================== */}
      <section id="book" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-green-50/50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <Calendar className="w-3 h-3" />
              BOOK A FREE CLASS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Pick a time, and it&apos;s booked
            </h2>
            <p className="text-base text-slate-600">
              Tell us your time zone, choose a time that suits you, and the class is confirmed on the spot — no waiting for a call back.
            </p>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-semibold text-slate-600">
              {[
                '30 minutes',
                'A real mentor, live',
                'No credit card',
                /* No "no sales call" promise here: a counsellor does ring
                   after the class, and a promise the product then breaks
                   costs more than it wins. */
              ].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <SelfServeBooking />
        </div>
      </section>

      <WaveDivider3D fromColor="#F0FDF4" toColor="#FFFBEB" />

      {/* =================== WHY TAKE A DEMO =================== */}
      <section id="why" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-amber-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <Sparkles className="w-3 h-3" />
              WHY TAKE A DEMO
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
              30 minutes that could change everything
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              You won&apos;t just watch a video. You&apos;ll build something real, with a real teacher, in real time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BenefitCard
              icon={<Users className="w-6 h-6" />}
              color="blue"
              title="Meet your teacher"
              description="Not a sales rep. Not a bot. An actual Sariro mentor who teaches the course. Ask them anything — about the curriculum, their background, or whether Sariro is right for you."
            />
            <BenefitCard
              icon={<Rocket className="w-6 h-6" />}
              color="amber"
              title="Build something real"
              description="In 30 minutes, you'll write actual code (or build a Scratch project) and ship something — a tiny game, a working webpage, or your first AI prompt. You keep what you build."
            />
            <BenefitCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="green"
              title="No pressure, no catch"
              description="No credit card. No 'free trial that auto-charges.' If Sariro isn't for you, we'll still have given you a real learning experience. That's the deal."
            />
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFBEB" toColor="#FFFFFF" />

      {/* Was a grid of six testimonials attributed to named people who
          arrived with the site template — "Dr. Lena Okafor, Principal,
          Lakeside Academy" and the like. A quote a named person did not say is
          a fabricated endorsement, and the page that asks somebody to book is
          the worst possible place to put one. See proof-points.tsx. */}
      <ProofPoints />

      <WaveDivider3D fromColor="#FFFFFF" toColor="#FFFFFF" />

      {/* =================== FOOTER CTA =================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Not ready to book?
          </h2>
          <p className="text-base text-slate-600 mb-6">
            Browse our courses, read our story, or just poke around. We&apos;ll be here when you&apos;re ready.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/courses" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm">
              Browse courses
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/about" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
              Read our story
            </Link>
            <Link href="/pricing" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Benefit Card
   ════════════════════════════════════════════════════════════════════════ */

function BenefitCard({
  icon,
  color,
  title,
  description,
}: {
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'green';
  title: string;
  description: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="card-3d p-6 h-full"
    >
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}
