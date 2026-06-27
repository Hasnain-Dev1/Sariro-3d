'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  PhoneCall,
  FlaskConical,
  Trophy,
  BookOpen,
  Cpu,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LifeBuoy,
  CheckCircle2,
  Users,
  Clock,
  MapPin,
  Quote,
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

/* ---------------------------------------------------------------
   School packages — 4 offerings, each with icon, scale, deliverables
--------------------------------------------------------------- */
const PACKAGES = [
  {
    id: 'workshop',
    title: 'Workshop',
    tagline: 'A single-day AI spark for your campus.',
    icon: FlaskConical,
    accent: '#16A34A',
    duration: '1 day · 3–6 hrs',
    students: 'Up to 40 students',
    deliverables: [
      'Hands-on AI build session',
      'No-code + light-code tracks',
      'Take-home project repo',
      'Post-workshop resource pack',
    ],
    bestFor: 'Spark curiosity, test the waters',
  },
  {
    id: 'hackathon',
    title: 'Hackathon',
    tagline: '48 hours. Real problem. Real AI solutions.',
    icon: Trophy,
    accent: '#F59E0B',
    duration: '2–3 days',
    students: '50–200 participants',
    deliverables: [
      'Theme + dataset curation',
      'Mentor judges from industry',
      'Prize structure & swag',
      'Demo day + showcase',
    ],
    bestFor: 'Build culture, recruit talent',
  },
  {
    id: 'curriculum',
    title: 'Curriculum',
    tagline: 'Full-semester AI course, ready to teach.',
    icon: BookOpen,
    accent: '#2563EB',
    duration: '8–16 weeks',
    students: 'Cohort or full class',
    deliverables: [
      'CSTA / IB-aligned syllabus',
      'Slide decks + lesson plans',
      'Auto-graded problem sets',
      'Capstone project rubric',
    ],
    bestFor: 'Embed AI into your program',
  },
  {
    id: 'ai-lab',
    title: 'AI Lab',
    tagline: 'A permanent makerspace for AI on campus.',
    icon: Cpu,
    accent: '#7C3AED',
    duration: 'Year-round',
    students: 'Whole school access',
    deliverables: [
      'Hardware & GPU access setup',
      'Project library + challenges',
      'Quarterly student showcase',
      'Ongoing Sariro mentor visits',
    ],
    bestFor: 'Make AI a school signature',
  },
];

const PROCESS = [
  {
    n: 1,
    title: 'Discovery call',
    body: 'A 30-minute call where we learn your goals, your students, your constraints. No pitch — just listening.',
    icon: PhoneCall,
    accent: '#16A34A',
  },
  {
    n: 2,
    title: 'Custom curriculum',
    body: 'We design a syllabus around your school — your standards, your timeline, your students\' level.',
    icon: ClipboardList,
    accent: '#2563EB',
  },
  {
    n: 3,
    title: 'Teacher training',
    body: 'Your teachers co-teach with us. By the end, they own the material — they don\'t need us forever.',
    icon: GraduationCap,
    accent: '#7C3AED',
  },
  {
    n: 4,
    title: 'Ongoing support',
    body: 'Quarterly check-ins, resource updates, and a direct line when something breaks or a student needs more.',
    icon: LifeBuoy,
    accent: '#F59E0B',
  },
];

const SCHOOL_OUTCOMES = [
  { value: 12, suffix: '+', label: 'School partners', icon: Users },
  { value: 2000, suffix: '+', label: 'Students reached', icon: GraduationCap },
  { value: 4, suffix: ' wks', label: 'Avg. setup time', icon: Clock },
  { value: 0, custom: 'CSTA', label: 'Standards aligned', icon: CheckCircle2 },
];

export default function SchoolsPage() {
  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'Schools — Sariro | Bring AI to Your Campus';
  }, []);

  return (
    <BrandLayout>
      <PageHero
        eyebrow="For schools & districts"
        accentColor="#16A34A"
        breadcrumb="Schools"
        variant="schools"
        title={
          <>
            Bring AI literacy to your <span className="gradient-text">entire campus.</span>
          </>
        }
        subtitle="From a single workshop to a year-round AI lab — we partner with schools to deliver curriculum that meets students where they are, aligned to CSTA and IB standards, with teacher training included."
      >
        <Link href="#packages" className="btn-tactile btn-tactile-green px-5 py-3 text-sm">
          <BookOpen className="w-4 h-4" />
          Explore packages
        </Link>
        <Link href="/contact" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          <PhoneCall className="w-4 h-4" />
          Book a discovery call
        </Link>
      </PageHero>

      {/* ====== Stats strip ====== */}
      <section className="relative -mt-4 pb-12 overflow-hidden">
        <ParallaxOrb color="rgba(22, 163, 74, 0.10)" size={360} speed={80} position="top-10 -left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4" stagger={0.1}>
            {SCHOOL_OUTCOMES.map((s) => (
              <StaggerItem key={s.label}>
                <TiltCard className="glass-panel rounded-2xl p-5 text-center h-full" maxTilt={6}>
                  <s.icon className="w-5 h-5 mx-auto text-green-600 mb-2" />
                  <div
                    className="text-2xl sm:text-3xl font-extrabold text-slate-900"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {s.custom ? (
                      s.custom
                    ) : (
                      <CountUp value={s.value} suffix={s.suffix} duration={1.8} />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {s.label}
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ====== Packages grid ====== */}
      <section id="packages" className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(37, 99, 235, 0.10)" size={420} speed={100} position="top-20 -right-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={320} speed={-80} position="bottom-10 left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-green-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Four ways to engage
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Pick the package that fits your campus." highlight="your campus." highlightClassName="gradient-text" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                Every package is customizable. Start small with a workshop, grow into a full AI lab — or jump straight in.
              </p>
            </Reveal>
          </div>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-6" stagger={0.1}>
            {PACKAGES.map((pkg) => (
              <StaggerItem key={pkg.id}>
                <TiltCard className="card-3d p-6 sm:p-7 h-full group" maxTilt={5}>
                  <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div className="relative shrink-0">
                      <div
                        className="absolute inset-0 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity"
                        style={{ background: pkg.accent }}
                      />
                      <div
                        className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: `${pkg.accent}15`, color: pkg.accent }}
                      >
                        <pkg.icon className="w-7 h-7" strokeWidth={2.2} />
                      </div>
                    </div>

                    {/* Header */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="text-xl font-extrabold text-slate-900"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          {pkg.title}
                        </h3>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{
                            background: `${pkg.accent}15`,
                            color: pkg.accent,
                            fontFamily: 'var(--font-grotesk)',
                          }}
                        >
                          {pkg.duration}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{pkg.tagline}</p>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        Reach
                      </div>
                      <div className="text-sm font-bold text-slate-900">{pkg.students}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        Best for
                      </div>
                      <div className="text-sm font-bold text-slate-900">{pkg.bestFor}</div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <ul className="mt-5 space-y-2">
                    {pkg.deliverables.map((d, di) => (
                      <li key={di} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: pkg.accent }} />
                        {d}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/contact"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold transition-colors group/cta"
                    style={{ color: pkg.accent, fontFamily: 'var(--font-grotesk)' }}
                  >
                    Get a quote
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1" />
                  </Link>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Process steps ====== */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={380} speed={90} position="top-10 right-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-green-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              How it works
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="From first call to first class in four steps." highlight="four steps." highlightClassName="gradient-text" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                No procurement maze. No 12-month rollout. We move at the speed of your students.
              </p>
            </Reveal>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-green-500 via-blue-500 to-amber-500 opacity-30" />

            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.12}>
              {PROCESS.map((step) => (
                <StaggerItem key={step.n} className="relative">
                  {/* Number badge */}
                  <div className="relative mx-auto mb-5 w-24 h-24">
                    <div
                      className="absolute inset-0 rounded-full blur-lg opacity-30"
                      style={{ background: step.accent }}
                    />
                    <div
                      className="relative w-24 h-24 rounded-full bg-white border-2 flex items-center justify-center shadow-lg"
                      style={{ borderColor: `${step.accent}30` }}
                    >
                      <step.icon className="w-8 h-8" style={{ color: step.accent }} strokeWidth={2.2} />
                    </div>
                    <div
                      className="absolute -top-1 -right-1 w-7 h-7 rounded-full text-white text-xs font-extrabold flex items-center justify-center shadow-md"
                      style={{ background: step.accent, fontFamily: 'var(--font-grotesk)' }}
                    >
                      {step.n}
                    </div>
                  </div>

                  <div className="text-center px-2">
                    <h3
                      className="text-lg font-extrabold text-slate-900 mb-2"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Sticky story ====== */}
      <StickyScrollSection pinHeight="150vh">
        <div className="text-center max-w-3xl px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-green-600 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Why schools choose us
          </span>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="Teachers who own it. Students who lead." highlight="lead." highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.2}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We don't sell you a forever-dependency. We train your teachers, hand over the keys, and stay close when you need us.
            </p>
          </Reveal>
        </div>
      </StickyScrollSection>

      {/* ====== Testimonial ====== */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(22, 163, 74, 0.10)" size={400} speed={100} position="top-10 left-10" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="glass-panel rounded-3xl p-8 sm:p-12 relative overflow-hidden">
              <Quote className="absolute top-6 left-6 w-16 h-16 text-green-500/15" />
              <div className="relative">
                <p className="text-xl sm:text-2xl font-semibold text-slate-800 leading-relaxed" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  "We brought Sariro in for a semester-long AI lab. The teacher training alone was worth it. Our students now lead the school's AI ethics club — they started it themselves."
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    L
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Dr. Lena Okafor</div>
                    <div className="text-sm text-slate-500">Principal · Lakeside Academy</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(22, 163, 74, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-bold uppercase tracking-wider text-green-600 mb-5" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <CalendarCheck className="w-3.5 h-3.5" />
              Next discovery slots: this week
            </div>
          </Reveal>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="Let's design AI education for your campus." highlight="your campus." highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Book a 30-minute discovery call. We'll listen, ask the right questions, and send you a custom proposal within 48 hours — no obligation.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton as="a" href="/contact" strength={0.25} className="btn-tactile btn-tactile-green px-6 py-3.5">
                <PhoneCall className="w-4 h-4" />
                Book a discovery call
              </MagneticButton>
              <MagneticButton as="a" href="/pricing" strength={0.25} className="btn-tactile btn-tactile-light px-6 py-3.5">
                See school pricing
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </div>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> CSTA & IB aligned</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Teacher training included</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Remote or in-person</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-green-600" /> Worldwide</span>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
