'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Check, Star, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { PRICING_TIERS, DISCOUNT_LABEL, DISCOUNT_DEADLINE, discountPercent } from '@/lib/sariro-data';
import { SplitText3D, MagneticButton, TiltCard3D } from './scroll-effects';

const ACCENT_MAP: Record<string, { text: string; bg: string; soft: string; border: string; gradient: string }> = {
  blue:   { text: 'text-blue-700',   bg: 'bg-blue-600',   soft: 'bg-blue-50',   border: 'border-blue-200',   gradient: 'from-blue-600 to-blue-800' },
  green:  { text: 'text-green-700',  bg: 'bg-green-600',  soft: 'bg-green-50',  border: 'border-green-200',  gradient: 'from-green-600 to-green-800' },
  violet: { text: 'text-violet-700', bg: 'bg-violet-600', soft: 'bg-violet-50', border: 'border-violet-200', gradient: 'from-violet-600 to-violet-800' },
};

export default function Pricing3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  // Parallax background orbs
  const orb1Y = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [-80, 80]);

  return (
    <section id="pricing" ref={sectionRef} data-chapter="pricing" data-chapter-label="Pricing" className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-white to-slate-50">
      {/* Parallax decorative orbs */}
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
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — Simple, honest pricing —
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <SplitText3D text="One price." highlight="price." highlightClassName="gradient-text" />
            <br />
            <SplitText3D text="No surprises." highlight="surprises." highlightClassName="gradient-text" delay={0.3} />
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            Every tier includes lifetime access to course recordings, the Sariro community, and a real portfolio project reviewed by a senior builder. 14-day money-back guarantee, no questions asked.
          </p>
        </motion.div>

        {/* Summer launch discount banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 mx-auto max-w-3xl rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
          style={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.10) 0%, rgba(239, 68, 68, 0.10) 100%)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' }}
          >
            <Tag className="w-6 h-6" strokeWidth={2.4} />
          </div>
          <div className="flex-1">
            <div
              className="text-xs font-bold uppercase tracking-[0.18em] mb-1"
              style={{ fontFamily: 'var(--font-grotesk)', color: '#DC2626' }}
            >
              Limited-time pricing
            </div>
            <h3
              className="text-lg sm:text-xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              {DISCOUNT_LABEL}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Locked in for every cohort starting before <span className="font-bold text-slate-900">{DISCOUNT_DEADLINE}</span>. After that, standard pricing resumes.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PRICING_TIERS.map((tier, i) => {
            const a = ACCENT_MAP[tier.accent] ?? ACCENT_MAP.blue;
            const pct = discountPercent(tier.price, tier.originalPrice);
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 50, rotateY: -8 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: i * 0.12 }}
                className={`relative ${tier.popular ? 'lg:-mt-6 lg:mb-6' : ''}`}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                  transform: tier.popular ? 'translateZ(30px) scale(1.05)' : 'translateZ(0px)',
                }}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-bold shadow-lg shadow-blue-500/40" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Most popular
                    </div>
                  </div>
                )}

                <TiltCard3D
                  className={`card-3d h-full ${tier.popular ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20' : ''}`}
                  maxTilt={tier.popular ? 6 : 10}
                >
                  <div className="p-8 h-full flex flex-col">
                    {/* Tier name */}
                    <div className="mb-2" style={{ transform: 'translateZ(30px)' }}>
                      <h3 className={`text-2xl font-extrabold ${a.text}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {tier.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{tier.tagline}</p>
                    </div>

                    {/* Price */}
                    <div className="my-6 py-4 border-y border-slate-100" style={{ transform: 'translateZ(20px)' }}>
                      {tier.price === null ? (
                        <div className="text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          Custom
                        </div>
                      ) : (
                        <div>
                          {pct > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md text-white shadow-sm"
                                style={{ background: '#DC2626', fontFamily: 'var(--font-grotesk)' }}
                              >
                                Save {pct}%
                              </span>
                              <span
                                className="text-xs font-bold uppercase tracking-wider line-through"
                                style={{ fontFamily: 'var(--font-grotesk)', color: '#DC2626' }}
                              >
                                ${tier.originalPrice}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              ${tier.price}
                            </span>
                            <span className="text-sm font-semibold text-slate-500">/ {tier.period}</span>
                          </div>
                          {pct > 0 && (
                            <p
                              className="text-xs font-bold mt-1.5"
                              style={{ fontFamily: 'var(--font-grotesk)', color: '#DC2626' }}
                            >
                              You save ${tier.originalPrice! - tier.price!}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1" style={{ transform: 'translateZ(15px)' }}>
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <span className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-md ${a.bg} flex items-center justify-center`}>
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </span>
                          <span className="font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA → courses page with level pre-selected */}
                    <MagneticButton
                      as="a"
                      href={`/courses?level=${tier.id === 'expert' ? 'Advanced' : (tier.id.charAt(0).toUpperCase() + tier.id.slice(1))}`}
                      strength={0.15}
                      className={`btn-tactile w-full justify-center px-5 py-3.5 text-sm ${
                        tier.popular ? 'btn-tactile-primary' :
                        tier.id === 'school-pro' ? 'btn-tactile-deep' :
                        'btn-tactile-light'
                      }`}
                    >
                      {tier.cta}
                      <ArrowRight className="w-4 h-4" />
                    </MagneticButton>
                  </div>
                </TiltCard3D>
              </motion.div>
            );
          })}
        </div>

        {/* Trust footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600"
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4 text-blue-600" />
            14-day money-back guarantee
          </span>
          <span className="inline-flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4 text-green-600" />
            No hidden fees
          </span>
          <span className="inline-flex items-center gap-2 font-semibold">
            <Check className="w-4 h-4 text-violet-600" />
            Lifetime community access
          </span>
        </motion.div>
      </div>
    </section>
  );
}
