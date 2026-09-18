import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CalendarDays, LayoutGrid } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { MagneticButton, ParallaxOrb, Reveal, SplitText, StickyScrollSection } from '@/components/brand/effects-kit';
import LearnChooser from '@/app/courses/learn-chooser';
import CatalogHashForward from '@/app/courses/catalog-hash-forward';

/**
 * SARIRO — /courses: what do you want to learn?
 * ============================================================================
 * The chooser, and only the chooser. Every card opens its own page — the school
 * subjects under /subjects, Public Speaking under /subjects/focus, and Coding &
 * AI at /courses/coding (founder, 18 Sep 2026: coding was the one card that
 * scrolled to a catalogue at the bottom of this page instead).
 *
 * The coding catalogue's old addresses still work: /courses?level=Beginner is
 * redirected here on the server, /courses#catalog in the browser.
 */

export const metadata: Metadata = {
  title: 'Learn — live classes in every subject | Sariro',
  description:
    'Maths, science, English, public speaking, and coding & AI — every class live, capped at four learners, taught by a mentor who knows your name.',
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { level } = await searchParams;
  if (typeof level === 'string' && level) redirect(`/courses/coding?level=${encodeURIComponent(level)}`);

  return (
    <BrandLayout>
      <CatalogHashForward />
      <PageHero
        eyebrow="Live, mentored, small batches"
        accentColor="#2563EB"
        breadcrumb="Learn"
        variant="courses"
        title={
          <>
            Maths, science, English, coding — <span className="gradient-text">taught by someone who knows your name.</span>
          </>
        }
        subtitle="No video dumps. No copy-paste tutorials. Every Sariro class is live, capped at four learners, and taught by a mentor who notices when you are stuck."
      >
        <Link href="#learn" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm">
          <LayoutGrid className="w-4 h-4" />
          Pick a subject
        </Link>
        <Link href="/pricing" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          See pricing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ====== The one chooser: every subject, coding included, opens its own page ====== */}
      <div id="learn" className="scroll-mt-20">
        <LearnChooser />
      </div>

      {/* ====== Sticky story section ====== */}
      <StickyScrollSection pinHeight="160vh">
        <div className="text-center max-w-3xl px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            The Sariro difference
          </span>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="We don't sell recordings. We teach people." highlight="teach people." highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.2}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every cohort ends with you owning something real — a project, a portfolio, a way of thinking you can&apos;t unlearn.
            </p>
          </Reveal>
        </div>
      </StickyScrollSection>

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.12)" size={400} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="One price. No surprises." highlight="No surprises." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Every cohort includes live sessions, recordings, mentor feedback, and community access. 14-day money-back guarantee on every enrollment.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton as="a" href="/pricing" strength={0.25} className="btn-tactile btn-tactile-primary px-6 py-3.5">
                See pricing
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton as="a" href="/events" strength={0.25} className="btn-tactile btn-tactile-light px-6 py-3.5">
                <CalendarDays className="w-4 h-4" />
                View next cohorts
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
