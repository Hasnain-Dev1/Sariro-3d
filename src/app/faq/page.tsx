'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MessageCircle,
  ArrowRight,
  HelpCircle,
  LifeBuoy,
  GraduationCap,
  DollarSign,
  BookOpen,
  Cpu,
  X,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import {
  Reveal,
  SplitText,
  TiltCard,
  ParallaxOrb,
} from '@/components/brand/effects-kit';

/* ---------------------------------------------------------------
   FAQ data — 12 items across 4 categories
--------------------------------------------------------------- */
type Category = 'Getting Started' | 'Pricing' | 'Learning' | 'Technical';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: Category;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'prerequisites',
    question: 'Do I need any prior coding experience to join a cohort?',
    answer:
      'Nope. Our "AI Foundations: Thinking in Systems" course assumes zero coding background — we start from how to reason about a problem before touching a keyboard. For intermediate and advanced courses, you should be comfortable writing small scripts in Python, but we provide a free prep checklist to get you there before day one.',
    category: 'Getting Started',
  },
  {
    id: 'pricing',
    question: 'How much does a Sariro cohort cost, and what is included?',
    answer:
      'Cohorts range from $99 for short workshops to $399 for advanced tracks — one flat price, no upsells. Every cohort includes live sessions, recordings, mentor-reviewed projects, lifetime community access, and a verifiable certificate of completion.',
    category: 'Pricing',
  },
  {
    id: 'scholarships',
    question: 'Do you offer scholarships or financial aid?',
    answer:
      'Yes. We set aside 15% of every cohort for need-based scholarships and another 5% for students from underrepresented regions. Apply through the contact form with a one-paragraph note about your situation — we reply within 72 hours and never make anyone justify their need in public.',
    category: 'Pricing',
  },
  {
    id: 'refunds',
    question: 'What is your refund policy if a cohort is not the right fit?',
    answer:
      'Every enrollment comes with a 14-day, no-questions-asked money-back guarantee. If you attend the first two sessions and decide Sariro is not for you, email support@sariro.com and we refund 100% within 5 business days. No forms, no friction, no awkward exit interviews.',
    category: 'Pricing',
  },
  {
    id: 'schedule',
    question: 'When do cohorts meet, and how long is each session?',
    answer:
      'Most cohorts meet twice a week for 90 minutes, scheduled in UTC-friendly evening slots that work for both India and the Americas. Every session is recorded and posted within 6 hours, so you can catch up across any time zone without falling behind on cohort discussion.',
    category: 'Learning',
  },
  {
    id: 'format',
    question: 'What format do courses take — live, recorded, or hybrid?',
    answer:
      'All Sariro cohorts are live and mentored, never pre-recorded video dumps. Each session mixes a short teach-block, a live build-along, and a Q&A where you can interrupt with questions. Recordings are a backup, not the product — the magic happens when you show up in real time.',
    category: 'Learning',
  },
  {
    id: 'certificate',
    question: 'Is the certificate worth anything to employers or schools?',
    answer:
      'Our certificate verifies that you attended live, completed every project, and passed a final review by a senior mentor — not just that you clicked play on a video. Alumni have used it to land ML internships, switch careers, and earn academic credit at partner universities, but its real value is the portfolio you build alongside it.',
    category: 'Getting Started',
  },
  {
    id: 'mentor-access',
    question: 'How much direct access do I get to mentors and to Mimo?',
    answer:
      'Every cohort has a dedicated mentor who reviews your projects within 48 hours and runs weekly office hours. Builder-tier students get three 1:1 sessions, and Mimo personally hosts a monthly AMA across all cohorts — plus you can always email founder@sariro.com and he actually reads it.',
    category: 'Learning',
  },
  {
    id: 'missed-sessions',
    question: 'What happens if I miss a live session?',
    answer:
      'Recordings are posted within 6 hours with chapter markers and downloadable slides, so you never lose the content. Your mentor also runs a weekly catch-up office hour where you can ask anything from the missed session, and the cohort Discord stays active between sessions for async help.',
    category: 'Learning',
  },
  {
    id: 'international',
    question: 'I am an international student — can I still enroll and participate?',
    answer:
      'Absolutely. We have taught students across 65 nationalities and design every cohort to work across time zones, currencies, and bandwidth constraints. Payments are processed in USD but we support regional pricing on request, and scholarships are explicitly prioritized for students from emerging markets.',
    category: 'Getting Started',
  },
  {
    id: 'age',
    question: 'Is there an age requirement to enroll in a Sariro cohort?',
    answer:
      'Our standard cohorts are designed for learners 16 and up, but younger students are welcome with a parent or guardian co-enrolled. We also run dedicated high-school and middle-school tracks through our Schools program, where the curriculum is adapted for ages 12 to 18 with age-appropriate projects and safeguarding built in.',
    category: 'Getting Started',
  },
  {
    id: 'after-cohort',
    question: 'What happens after my cohort ends — am I on my own?',
    answer:
      'Never. Every student gets lifetime access to the Sariro community Discord, alumni project showcases, and ongoing monthly AMAs. You can audit any future cohort of the same course for free, and our alumni network actively hires, mentors, and collaborates with each other long after graduation.',
    category: 'Learning',
  },
];

/* ---------------------------------------------------------------
   Category config — colors + icons + counts
--------------------------------------------------------------- */
const CATEGORY_CONFIG: Record<
  Category,
  { accent: string; icon: typeof HelpCircle }
> = {
  'Getting Started': { accent: '#2563EB', icon: GraduationCap },
  Pricing: { accent: '#16A34A', icon: DollarSign },
  Learning: { accent: '#7C3AED', icon: BookOpen },
  Technical: { accent: '#06B6D4', icon: Cpu },
};

type FilterKey = 'All' | Category;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Getting Started', label: 'Getting Started' },
  { key: 'Pricing', label: 'Pricing' },
  { key: 'Learning', label: 'Learning' },
  { key: 'Technical', label: 'Technical' },
];

export default function FAQPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterKey>('All');

  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'FAQ — Sariro | Frequently Asked Questions';
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        activeCategory === 'All' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  // Reset search clear button visibility
  const hasQuery = query.trim().length > 0;

  return (
    <BrandLayout>
      <PageHero
        eyebrow="Frequently asked"
        accentColor="#06B6D4"
        breadcrumb="FAQ"
        variant="contact"
        title={
          <>
            Questions, <span className="gradient-text">answered.</span>
          </>
        }
        subtitle="Everything you need to know before joining a Sariro cohort — prerequisites, pricing, scholarships, refunds, schedule, and what happens after you graduate. Search, filter, and if your question is not here, just ask us."
      >
        <a href="#faq-list" className="btn-tactile px-5 py-3 text-sm text-white" style={{ background: '#06B6D4', boxShadow: '0 10px 0 -1px #0E7490, 0 18px 30px -12px rgba(6,182,212,0.55)', fontFamily: 'var(--font-grotesk)' }}>
          <HelpCircle className="w-4 h-4" />
          Jump to answers
        </a>
        <Link href="/contact" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          <MessageCircle className="w-4 h-4" />
          Ask us directly
        </Link>
      </PageHero>

      {/* ====== Search + Filter + Accordion ====== */}
      <section id="faq-list" className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color="rgba(6, 182, 212, 0.10)" size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={340} speed={-90} position="bottom-10 -right-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center mb-8">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              The answers
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Find what you're looking for." highlight="looking for." highlightClassName="gradient-text" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600 max-w-xl mx-auto">
                Type a question, pick a category, or just scroll — every answer is written by a human who has actually taught the cohort.
              </p>
            </Reveal>
          </div>

          {/* Search input */}
          <Reveal delay={0.1}>
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <Input
                type="search"
                placeholder="Search FAQs — try 'scholarship', 'refund', 'schedule'..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-14 pl-12 pr-12 text-base rounded-2xl border-slate-200 bg-white shadow-sm focus-visible:border-cyan-400 focus-visible:ring-cyan-400/30"
                aria-label="Search frequently asked questions"
              />
              {hasQuery && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </Reveal>

          {/* Filter pills */}
          <Reveal delay={0.15}>
            <div
              className="flex flex-wrap p-1.5 rounded-2xl glass-panel gap-1 mb-8"
              role="tablist"
              aria-label="Filter FAQs by category"
            >
              {FILTERS.map((f) => {
                const active = activeCategory === f.key;
                const count =
                  f.key === 'All'
                    ? FAQ_ITEMS.length
                    : FAQ_ITEMS.filter((i) => i.category === f.key).length;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveCategory(f.key)}
                    role="tab"
                    aria-selected={active}
                    className={`relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 flex-1 sm:flex-initial justify-center ${
                      active
                        ? 'text-white shadow-lg'
                        : 'text-slate-700 hover:text-cyan-600'
                    }`}
                    style={
                      active
                        ? {
                            background:
                              'linear-gradient(to right, #06B6D4, #2563EB)',
                            boxShadow: '0 12px 24px -10px rgba(6,182,212,0.55)',
                            fontFamily: 'var(--font-grotesk)',
                          }
                        : { fontFamily: 'var(--font-grotesk)' }
                    }
                  >
                    <span className="relative flex items-center gap-1.5 sm:gap-2 justify-center">
                      <span className="whitespace-nowrap">{f.label}</span>
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
          </Reveal>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-xs text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {filtered.length} {filtered.length === 1 ? 'answer' : 'answers'} found
            </p>
            {(activeCategory !== 'All' || hasQuery) && (
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setQuery('');
                }}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Accordion list */}
          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              <motion.div
                key={`${activeCategory}-${query}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="rounded-3xl" maxTilt={2} glare={false}>
                  <div className="card-3d p-2 sm:p-4">
                    <Accordion type="single" collapsible className="w-full">
                      {filtered.map((item) => {
                        const cfg = CATEGORY_CONFIG[item.category];
                        const Icon = cfg.icon;
                        return (
                          <AccordionItem
                            key={item.id}
                            value={item.id}
                            className="rounded-2xl mb-2 last:mb-0 border border-slate-100 overflow-hidden data-[state=open]:border-cyan-200 transition-colors"
                          >
                            <AccordionTrigger className="px-4 sm:px-5 py-4 hover:no-underline hover:bg-slate-50/60 rounded-2xl group">
                              <span className="flex items-start gap-3 text-left">
                                <span
                                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ background: `${cfg.accent}15`, color: cfg.accent }}
                                >
                                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                                </span>
                                <span className="flex flex-col gap-1.5">
                                  <span
                                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md self-start"
                                    style={{
                                      background: `${cfg.accent}12`,
                                      color: cfg.accent,
                                      fontFamily: 'var(--font-grotesk)',
                                    }}
                                  >
                                    {item.category}
                                  </span>
                                  <span
                                    className="text-sm sm:text-base font-bold text-slate-900 leading-snug"
                                    style={{ fontFamily: 'var(--font-jakarta)' }}
                                  >
                                    {item.question}
                                  </span>
                                </span>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 sm:px-5 pb-5 pl-16">
                              <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                                {item.answer}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                </TiltCard>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-slate-400" />
                </div>
                <h3
                  className="text-xl font-extrabold text-slate-900 mb-2"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  No matches — yet.
                </h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
                  We could not find an FAQ that matches your search. Try a different keyword, or just send us the question directly.
                </p>
                <Link href="/contact" className="btn-tactile btn-tactile-light px-5 py-2.5 text-sm">
                  <MessageCircle className="w-4 h-4" />
                  Ask us directly
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(6, 182, 212, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
              <LifeBuoy className="w-8 h-8 text-white" strokeWidth={2.2} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Still have questions?" highlight="questions?" highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              We read every message ourselves — no bots, no tickets, no "5–7 business days." Drop us a line and we'll reply within 24 hours, often much faster.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className="btn-tactile px-6 py-3.5 text-white" style={{ background: 'linear-gradient(to right, #06B6D4, #2563EB)', boxShadow: '0 10px 0 -1px #0E7490, 0 18px 30px -12px rgba(6,182,212,0.55)' }}>
                <MessageCircle className="w-4 h-4" />
                Get in touch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/courses" className="btn-tactile btn-tactile-light px-6 py-3.5">
                Browse courses
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
