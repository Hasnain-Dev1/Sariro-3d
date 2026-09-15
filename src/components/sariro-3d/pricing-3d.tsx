'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Check, Sparkles, Tag } from 'lucide-react';
import { DISCOUNT_LABEL, DISCOUNT_DEADLINE, discountActive } from '@/lib/sariro-data';
import Link from 'next/link';
import { usePriceLine } from '@/components/pricing/site-prices-provider';
import CurrencySwitch from '@/components/pricing/currency-switch';
import { SplitText3D } from './scroll-effects';
import CodingPricing from '@/components/home/coding-pricing';

export default function Pricing3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  // Rupees for a family in India, dollars for everybody else.
  const group = usePriceLine('1:4');
  const oneToOne = usePriceLine('1:1');

  /**
   * Set after mount, never during render.
   *
   * discountActive() reads the clock, and anything derived from the clock at
   * render time gives the server and the browser different answers — React does
   * not patch attribute mismatches up, it leaves the subtree half-hydrated.
   * Starting false means the honest state (no urgency banner) is what renders
   * if JS never arrives, which is the right way round for a claim about a
   * deadline.
   */
  const [showDiscount, setShowDiscount] = useState(false);
  useEffect(() => {
    setShowDiscount(discountActive());
  }, []);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  // Parallax background orbs
  const orb1Y = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [-80, 80]);

  return (
    <section id="pricing" ref={sectionRef} data-hide-sticky-cta data-chapter="pricing" data-chapter-label="Pricing" className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-white to-slate-50">
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
        {/* Only while the offer is genuinely live. This banner ran for twenty
            days past its own deadline, shouting urgency about a date that had
            gone — see discountActive() in sariro-data.ts. An expired countdown
            does not just fail to persuade; it tells a careful reader that
            nothing else on the page is checked either. */}
        {showDiscount && (
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
        )}

        {/* ── What most families actually buy ──────────────────────────────
            The three cards below this are coding tiers at $199-$699. They were
            the whole of the pricing section, on the homepage of a school whose
            volume product is live school classes from $39.99 a month.

            A parent scrolling here saw the most expensive, least relevant thing
            we sell and concluded Sariro was a pricey AI bootcamp. The cheapest
            and most relevant offer was not on the page at all.

            Figures come from lib/school/pricing.ts, the same module the school
            checkout prices from, so this cannot drift away from what is
            charged. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="mb-12 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-2"
                style={{ fontFamily: 'var(--font-grotesk)', color: '#16A34A' }}
              >
                School subjects · Grades 1–12 · Public Speaking, any age
              </p>
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Maths, Science, Physics, Chemistry, Biology,
                <br className="hidden sm:block" /> English and Public Speaking
              </h3>
              <p className="text-[15px] text-slate-600 mt-2.5 leading-[1.6]">
                Live classes, once a week, on your child&rsquo;s own syllabus — and Public
                Speaking for any age. Priced by the month, not a course fee up front.
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className="text-[12.5px] font-semibold uppercase tracking-wider text-slate-500">
                From
              </p>
              <p
                className="text-4xl font-extrabold text-slate-900 leading-none tabular-nums"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {group.perMonth}
                <span className="text-base font-bold text-slate-500"> /month</span>
              </p>
              <p className="text-[13px] text-slate-500 mt-1.5 tabular-nums">
                One to one: {oneToOne.perMonth}/month
              </p>
              <CurrencySwitch className="mt-2.5" />
              <Link
                href="/courses"
                className="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                See subjects &amp; grades
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* The coding & AI ladder — a different product shape: a course you buy
            once, not a month you renew. Its own component now; see
            components/home/coding-pricing.tsx for why the old cards went. */}
        <CodingPricing />

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
