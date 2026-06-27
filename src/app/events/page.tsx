'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Video,
  MonitorPlay,
  Users,
  Clock,
  Ticket,
  Sparkles,
  Trophy,
  Mic,
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
  ParallaxOrb,
  StickyScrollSection,
} from '@/components/brand/effects-kit';
import { EVENTS } from '@/lib/sariro-data';

type FilterKey = 'All' | 'Cohort' | 'Hackathon' | 'Webinar';

const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
  cyan: '#06B6D4',
};

const FILTERS: { key: FilterKey; label: string; icon: typeof Users }[] = [
  { key: 'All', label: 'All events', icon: Sparkles },
  { key: 'Cohort', label: 'Cohorts', icon: Users },
  { key: 'Hackathon', label: 'Hackathons', icon: Trophy },
  { key: 'Webinar', label: 'Webinars', icon: Mic },
];

const TYPE_META: Record<
  string,
  { icon: typeof Users; label: string; accent: string }
> = {
  Cohort: { icon: Users, label: 'Live Cohort', accent: '#2563EB' },
  Hackathon: { icon: Trophy, label: 'Hackathon', accent: '#16A34A' },
  Webinar: { icon: Mic, label: 'Webinar', accent: '#7C3AED' },
};

const FORMAT_ICON: Record<string, typeof Video> = {
  Remote: Video,
  Hybrid: MonitorPlay,
  'In-Person': MapPin,
};

export default function EventsPage() {
  const [filter, setFilter] = useState<FilterKey>('All');

  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'Events — Sariro | Cohorts, Hackathons & Workshops';
  }, []);

  const visible =
    filter === 'All' ? EVENTS : EVENTS.filter((e) => e.type === filter);

  return (
    <BrandLayout>
      <PageHero
        eyebrow="Upcoming events"
        accentColor="#7C3AED"
        breadcrumb="Events"
        variant="events"
        title={
          <>
            Show up. Build something. <span className="gradient-text">Meet your people.</span>
          </>
        }
        subtitle="Cohorts, hackathons, and workshops — the live, in-person Sariro experiences where curiosity turns into community. Bring your laptop, leave with a project and a network."
      >
        <Link href="#schedule" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm" style={{ background: '#7C3AED', boxShadow: '0 10px 0 -1px #6D28D9, 0 18px 30px -12px rgba(124,58,237,0.55)' }}>
          <CalendarDays className="w-4 h-4" />
          See schedule
        </Link>
        <Link href="/courses" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          Browse courses
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ====== Filter + Event grid ====== */}
      <section id="schedule" className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.10)" size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(217, 70, 239, 0.08)" size={320} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text="What's coming up" />
              </h2>
              <Reveal delay={0.1}>
                <p className="text-sm text-slate-600 mt-1">
                  {visible.length} {visible.length === 1 ? 'event' : 'events'} on the calendar — pick your flavor.
                </p>
              </Reveal>
            </div>

            <div
              className="inline-flex p-1.5 rounded-2xl glass-panel gap-1 flex-wrap"
              role="tablist"
              aria-label="Filter events by type"
            >
              {FILTERS.map((f) => {
                const active = filter === f.key;
                const count =
                  f.key === 'All'
                    ? EVENTS.length
                    : EVENTS.filter((e) => e.type === f.key).length;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    role="tab"
                    aria-selected={active}
                    className={`relative px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                      active ? 'text-white' : 'text-slate-700 hover:text-violet-600'
                    }`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {active && (
                      <motion.span
                        layoutId="event-filter-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30"
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <f.icon className="w-3.5 h-3.5" />
                      {f.label}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event cards */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {visible.map((event, i) => {
                const accent = ACCENT_HEX[event.accent] ?? '#7C3AED';
                const typeMeta = TYPE_META[event.type] ?? TYPE_META.Cohort;
                const FormatIcon = FORMAT_ICON[event.format] ?? Video;
                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                  >
                    <TiltCard className="card-3d overflow-hidden h-full group" maxTilt={6}>
                      {/* Top accent band */}
                      <div
                        className="relative h-28 overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${accent} 0%, #0F172A 100%)`,
                        }}
                      >
                        {/* Decorative grid */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage:
                              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                          }}
                        />
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider"
                            style={{ fontFamily: 'var(--font-grotesk)' }}
                          >
                            <typeMeta.icon className="w-3 h-3" />
                            {typeMeta.label}
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
                            <FormatIcon className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-4 right-4 text-white/90 text-xs font-bold flex items-center gap-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          <CalendarDays className="w-3 h-3" />
                          {event.date}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-6">
                        <h3
                          className="text-lg font-extrabold text-slate-900 leading-tight mb-2"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          {event.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          {event.description}
                        </p>

                        {/* Meta */}
                        <div className="grid grid-cols-2 gap-2 mb-5">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MonitorPlay className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
                            <span>{event.format}</span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                              Price
                            </div>
                            <div
                              className="text-lg font-extrabold"
                              style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}
                            >
                              {event.price}
                            </div>
                          </div>
                          <button
                            className="px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-105"
                            style={{
                              background: accent,
                              fontFamily: 'var(--font-grotesk)',
                              boxShadow: `0 8px 0 -1px ${accent}99, 0 14px 24px -10px ${accent}55`,
                            }}
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            Reserve spot
                          </button>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {visible.length === 0 && (
            <div className="text-center py-20">
              <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No events of this type scheduled right now. Check back soon.</p>
            </div>
          )}
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Sticky story ====== */}
      <StickyScrollSection pinHeight="150vh">
        <div className="text-center max-w-3xl px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-violet-600 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Three ways to show up
          </span>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="Pick the format that fits your life." highlight="your life." highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.2}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Cohorts for depth. Hackathons for speed. Webinars for a taste. Every Sariro event leaves you with something tangible.
            </p>
          </Reveal>
        </div>
      </StickyScrollSection>

      {/* ====== Event types explainer ====== */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(37, 99, 235, 0.10)" size={380} speed={90} position="top-10 right-10" />
        <ParallaxOrb color="rgba(22, 163, 74, 0.08)" size={320} speed={-70} position="bottom-10 left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-violet-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Format breakdown
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Choose your speed." highlight="speed." highlightClassName="gradient-text" />
            </h2>
          </div>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.12}>
            {[
              {
                icon: Users,
                title: 'Cohorts',
                accent: '#2563EB',
                body: '8–12 week live programs. Small groups, real mentorship, a portfolio at the end. The flagship Sariro experience.',
                meta: '8–12 weeks · 30–40 students',
              },
              {
                icon: Trophy,
                title: 'Hackathons',
                accent: '#16A34A',
                body: '48-hour sprints with real datasets and real nonprofits. Form teams, ship something, win prizes — or just learn fast.',
                meta: '48 hrs · 50–200 builders',
              },
              {
                icon: Mic,
                title: 'Webinars',
                accent: '#7C3AED',
                body: '90-minute live workshops on a single skill. Bring your laptop, leave with a working artifact. Always free.',
                meta: '90 min · free for all',
              },
            ].map((t) => (
              <StaggerItem key={t.title}>
                <TiltCard className="card-3d p-6 h-full" maxTilt={7}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${t.accent}15`, color: t.accent }}
                  >
                    <t.icon className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <h3
                    className="text-lg font-extrabold text-slate-900 mb-2"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {t.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{t.body}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    <Clock className="w-3 h-3" />
                    {t.meta}
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Want the full experience? Take a course." highlight="Take a course." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Events are the appetizers. Cohorts are the meal. If you're ready to go deep, browse our 8-week flagship programs.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton as="a" href="/courses" strength={0.25} className="btn-tactile btn-tactile-primary px-6 py-3.5">
                View all courses
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton as="a" href="/pricing" strength={0.25} className="btn-tactile btn-tactile-light px-6 py-3.5">
                See pricing
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
