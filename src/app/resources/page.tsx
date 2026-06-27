'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  FileText,
  PenSquare,
  Download,
  Newspaper,
  Mail,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
  BookOpen,
  FlaskConical,
  Cpu,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster as SonnerToaster } from 'sonner';
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

type FilterKey = 'All' | 'Papers' | 'Blog' | 'Downloads';

type ResourceType = 'Papers' | 'Blog' | 'Downloads';

const TYPE_META: Record<
  ResourceType,
  { icon: typeof FileText; accent: string; label: string }
> = {
  Papers: { icon: FileText, accent: '#7C3AED', label: 'Research paper' },
  Blog: { icon: PenSquare, accent: '#06B6D4', label: 'Blog post' },
  Downloads: { icon: Download, accent: '#16A34A', label: 'Download' },
};

const FILTERS: { key: FilterKey; label: string; icon: typeof FileText }[] = [
  { key: 'All', label: 'All', icon: Newspaper },
  { key: 'Papers', label: 'Papers', icon: FileText },
  { key: 'Blog', label: 'Blog', icon: PenSquare },
  { key: 'Downloads', label: 'Downloads', icon: Download },
];

/* Inline resource library — 8 items spanning all 3 types */
const RESOURCES: {
  id: string;
  title: string;
  type: ResourceType;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  tags: string[];
}[] = [
  {
    id: 'eval-frameworks',
    title: 'A practical framework for evaluating LLM applications in production',
    type: 'Papers',
    excerpt:
      'Why most "LLM evals" are theater, and a 5-layer framework for measuring what actually matters: correctness, latency, cost, safety, and user satisfaction.',
    date: 'Jun 2026',
    readTime: '24 min read',
    author: 'Mimo Patra',
    tags: ['LLM', 'Evals', 'Production'],
  },
  {
    id: 'prompting-patterns',
    title: '12 prompting patterns every AI engineer should know by heart',
    type: 'Blog',
    excerpt:
      'Stop vibes-prompting. These 12 patterns — from chain-of-thought to self-consistency — will make your prompts reproducible, testable, and shippable.',
    date: 'May 2026',
    readTime: '8 min read',
    author: 'Mimo Patra',
    tags: ['Prompting', 'Patterns', 'LLM'],
  },
  {
    id: 'rag-checklist-pdf',
    title: 'The Sariro RAG pre-launch checklist (PDF, 2 pages)',
    type: 'Downloads',
    excerpt:
      'A printable 2-page checklist covering the 24 things you must verify before shipping a retrieval-augmented generation system to real users.',
    date: 'May 2026',
    readTime: 'PDF · 2 pages',
    author: 'Sariro Team',
    tags: ['RAG', 'Checklist', 'PDF'],
  },
  {
    id: 'teaching-thinking',
    title: 'Teaching thinking, not typing: a pedagogy for AI literacy',
    type: 'Papers',
    excerpt:
      'A research-grounded argument for why AI education must prioritize systems thinking over syntax — with data from 3 cohorts and 1,200 students.',
    date: 'Apr 2026',
    readTime: '18 min read',
    author: 'Mimo Patra',
    tags: ['Pedagogy', 'Education', 'Research'],
  },
  {
    id: 'vector-db-shootout',
    title: 'Vector DB shootout: pgvector vs Pinecone vs Weaviate in 2026',
    type: 'Blog',
    excerpt:
      'We benchmarked the three most popular vector databases on the same RAG workload. The winner depends on three things — and they\'re not what you think.',
    date: 'Apr 2026',
    readTime: '11 min read',
    author: 'Sariro Team',
    tags: ['Vector DB', 'RAG', 'Benchmark'],
  },
  {
    id: 'mimo-starter-kit',
    title: 'Sariro AI Builder Starter Kit (GitHub template)',
    type: 'Downloads',
    excerpt:
      'A ready-to-clone Next.js + Python starter with RAG, evals, and a deploy button. Used by every Sariro cohort as their day-one scaffold.',
    date: 'Mar 2026',
    readTime: 'GitHub repo',
    author: 'Sariro Team',
    tags: ['Template', 'Starter', 'GitHub'],
  },
  {
    id: 'agents-reliability',
    title: 'On the reliability of autonomous AI agents: a field study',
    type: 'Papers',
    excerpt:
      'We deployed 7 agent architectures across 4 production workloads for 90 days. Here\'s what broke, what held, and what we\'d never ship again.',
    date: 'Mar 2026',
    readTime: '32 min read',
    author: 'Mimo Patra',
    tags: ['Agents', 'Reliability', 'Field study'],
  },
  {
    id: 'school-ai-curriculum',
    title: 'How to design a CSTA-aligned AI curriculum for grades 9–12',
    type: 'Blog',
    excerpt:
      'A walkthrough of the Sariro schools curriculum — module by module, learning objective by learning objective — with a free downloadable syllabus.',
    date: 'Feb 2026',
    readTime: '14 min read',
    author: 'Mimo Patra',
    tags: ['Schools', 'CSTA', 'Curriculum'],
  },
];

export default function ResourcesPage() {
  const [filter, setFilter] = useState<FilterKey>('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'Resources — Sariro | Free AI Learning Materials';
  }, []);

  const visible =
    filter === 'All' ? RESOURCES : RESOURCES.filter((r) => r.type === filter);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubscribed(true);
    toast.success('You\'re in! Check your inbox for a confirmation.', {
      description: 'We send one email every other Tuesday. No spam, ever.',
    });
    setEmail('');
  };

  return (
    <BrandLayout>
      <SonnerToaster position="top-center" richColors closeButton />

      <PageHero
        eyebrow="Free learning resources"
        accentColor="#06B6D4"
        breadcrumb="Resources"
        variant="resources"
        title={
          <>
            Papers, blog posts, <span className="gradient-text">and downloads.</span>
          </>
        }
        subtitle="Open knowledge from the Sariro team. Read the research, grab the templates, steal the checklists. No email gate on most of it — we believe AI education should be free."
      >
        <Link href="#library" className="btn-tactile px-5 py-3 text-sm text-white" style={{ background: '#06B6D4', boxShadow: '0 10px 0 -1px #0E7490, 0 18px 30px -12px rgba(6,182,212,0.55)', fontFamily: 'var(--font-grotesk)' }}>
          <BookOpen className="w-4 h-4" />
          Browse library
        </Link>
        <Link href="/courses" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          Take a course instead
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ====== Library ====== */}
      <section id="library" className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color="rgba(6, 182, 212, 0.10)" size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(20, 184, 166, 0.08)" size={320} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text="The library" />
              </h2>
              <Reveal delay={0.1}>
                <p className="text-sm text-slate-600 mt-1">
                  {visible.length} {visible.length === 1 ? 'resource' : 'resources'} ·
                  <span className="text-cyan-600 font-bold ml-1">updated bi-weekly</span>
                </p>
              </Reveal>
            </div>

            <div
              className="inline-flex p-1.5 rounded-2xl glass-panel gap-1 flex-wrap"
              role="tablist"
              aria-label="Filter resources by type"
            >
              {FILTERS.map((f) => {
                const active = filter === f.key;
                const count =
                  f.key === 'All'
                    ? RESOURCES.length
                    : RESOURCES.filter((r) => r.type === f.key).length;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    role="tab"
                    aria-selected={active}
                    className={`relative px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                      active ? 'text-white' : 'text-slate-700 hover:text-cyan-600'
                    }`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {active && (
                      <motion.span
                        layoutId="resource-filter-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30"
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

          {/* Resource grid */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {visible.map((r, i) => {
                const meta = TYPE_META[r.type];
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                  >
                    <TiltCard className="card-3d p-6 h-full group flex flex-col" maxTilt={6}>
                      {/* Top: badge + date */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: `${meta.accent}15`,
                            color: meta.accent,
                            fontFamily: 'var(--font-grotesk)',
                          }}
                        >
                          <meta.icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          {r.date}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        className="text-lg font-extrabold text-slate-900 leading-tight mb-2 group-hover:text-cyan-600 transition-colors"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {r.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                        {r.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                            style={{ fontFamily: 'var(--font-grotesk)' }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{r.readTime}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 mx-1" />
                          <span className="font-bold text-slate-700">{r.author}</span>
                        </div>
                        <Link
                          href="#"
                          className="inline-flex items-center gap-1 text-xs font-bold transition-colors group/cta"
                          style={{ color: meta.accent, fontFamily: 'var(--font-grotesk)' }}
                        >
                          Read more
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/cta:translate-x-1" />
                        </Link>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {visible.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No resources of this type yet.</p>
            </div>
          )}
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Sticky story ====== */}
      <StickyScrollSection pinHeight="150vh">
        <div className="text-center max-w-3xl px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            What we write about
          </span>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="Three pillars. No fluff." highlight="No fluff." highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.2}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Applied research, practical engineering, open tools. That's the entire editorial scope — promise.
            </p>
          </Reveal>
        </div>
      </StickyScrollSection>

      {/* ====== Topic pillars ====== */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={360} speed={90} position="top-10 right-10" />
        <ParallaxOrb color="rgba(22, 163, 74, 0.08)" size={300} speed={-70} position="bottom-10 left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.12}>
            {[
              {
                icon: FlaskConical,
                title: 'Applied research',
                accent: '#7C3AED',
                body: 'Field-tested findings from real Sariro cohorts and production deployments. We publish what works — and what didn\'t.',
              },
              {
                icon: PenSquare,
                title: 'Engineering blog',
                accent: '#06B6D4',
                body: 'Practical walkthroughs, patterns, and benchmarks. Read it Monday, ship it Tuesday.',
              },
              {
                icon: Cpu,
                title: 'Open tools',
                accent: '#16A34A',
                body: 'Templates, checklists, and starter kits under permissive licenses. Take them, fork them, use them at work.',
              },
            ].map((p) => (
              <StaggerItem key={p.title}>
                <TiltCard className="card-3d p-6 h-full" maxTilt={7}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${p.accent}15`, color: p.accent }}
                  >
                    <p.icon className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <h3
                    className="text-lg font-extrabold text-slate-900 mb-2"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.body}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Newsletter CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        {/* Accent glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-25 pointer-events-none" style={{ background: '#06B6D4' }} />
        <ParallaxOrb color="rgba(6, 182, 212, 0.10)" size={380} speed={90} position="top-10 -left-10" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                The Sariro Dispatch
              </div>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text="One email. Every other Tuesday." highlight="Every other Tuesday." highlightClassName="gradient-text" />
              </h2>
              <p className="text-base text-slate-600 max-w-xl mx-auto mb-7">
                The latest research, the best new tools, and one practical thing you can ship this week. No spam, no sales, no nonsense.
              </p>

              {subscribed ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    You're on the list.
                  </p>
                  <p className="text-sm text-slate-500">
                    Check your inbox for a confirmation link.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row items-stretch gap-2 max-w-md mx-auto"
                >
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="you@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-12 rounded-xl bg-white"
                      aria-label="Email address"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 px-5 rounded-xl text-sm font-bold text-white shrink-0"
                    style={{
                      background: '#06B6D4',
                      fontFamily: 'var(--font-grotesk)',
                    }}
                  >
                    Subscribe
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                  <CountUp value={8400} suffix="+" duration={2} /> readers
                </span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> Unsubscribe anytime</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" /> No spam, ever</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
