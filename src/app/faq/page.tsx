'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, MessageCircle, ArrowRight } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Reveal, SplitText, TiltCard, ParallaxOrb } from '@/components/brand/effects-kit';

type FAQ = { q: string; a: string; cat: string };

const FAQS: FAQ[] = [
  { q: "Do I need coding experience to join?", a: "No. Our AI Foundations course starts from zero. We teach thinking first, coding second. If you can use a web browser, you can start.", cat: "Getting Started" },
  { q: "What age groups do you accept?", a: "Students aged 14+ for standard cohorts. We also run specialized school programs for younger learners. No upper age limit — our oldest graduate was 67.", cat: "Getting Started" },
  { q: "Can international students join?", a: "Yes. We have students from 65+ countries. All sessions are in English. Cohort times are UTC-friendly for India, Europe, and Africa.", cat: "Getting Started" },
  { q: "How much do courses cost?", a: "Courses range from $199 to $699. All prices currently show 50-70% OFF the original rate. Payment plans available. 14-day money-back guarantee on every course.", cat: "Pricing" },
  { q: "Do you offer scholarships?", a: "Yes. We reserve 15% of every cohort for needs-based scholarships. Email contact@sariro.com with a one-paragraph note about your situation.", cat: "Pricing" },
  { q: "What is the refund policy?", a: "Full refund within 14 days of cohort start, no questions asked. After 14 days, pro-rated refunds based on sessions attended.", cat: "Pricing" },
  { q: "What if I miss a live session?", a: "All sessions are recorded and uploaded within 24 hours. You also get access to a cohort-only Discord for async questions. Missed sessions don't count against you.", cat: "Learning" },
  { q: "How are cohorts structured?", a: "Live sessions 2-3x per week, 90 minutes each. Plus 1:1 mentor sessions, async project work, and peer review. Total time commitment: 8-12 hours/week.", cat: "Learning" },
  { q: "Do I get a certificate?", a: "Yes. Every completed cohort includes a certificate with the course name, your project URL, and Mimo's signature. It's verifiable and LinkedIn-ready.", cat: "Learning" },
  { q: "What software do I need?", a: "A laptop (Mac/Windows/Linux), a modern browser, and a free GitHub account. We provide all other tools — Colab, VS Code extensions, API keys — during onboarding.", cat: "Technical" },
  { q: "Do I need a GPU?", a: "No. All course projects run on free cloud GPUs (Google Colab). If you want to run locally, we provide setup guides, but it's never required.", cat: "Technical" },
  { q: "What happens after the cohort ends?", a: "You keep lifetime access to recordings, community, and your project code. Many alumni join as mentors for future cohorts. Your learning doesn't stop when the cohort does.", cat: "Learning" },
];

const CATEGORIES = ["All", "Getting Started", "Pricing", "Learning", "Technical"];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  useEffect(() => { document.title = "FAQ — Sariro | Frequently Asked Questions"; }, []);

  const filtered = FAQS.filter(f => {
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === "All" || f.cat === activeCat;
    return matchSearch && matchCat;
  });

  return (
    <BrandLayout>
      <PageHero
        eyebrow="Answers"
        accentColor="#06B6D4"
        breadcrumb="FAQ"
        variant="faq"
        title={<>Questions, <span className="gradient-text">answered.</span></>}
        subtitle="Everything you need to know before joining a Sariro cohort. Can't find your answer? We reply within 24 hours."
      />

      <section className="relative py-14 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(6, 182, 212, 0.08)" size={400} speed={100} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.06)" size={320} speed={-70} position="bottom-10 -right-20" />
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Search */}
          <Reveal>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 py-6 text-base rounded-2xl border-slate-200"
              />
            </div>
          </Reveal>

          {/* Category filter */}
          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-2 mb-8">
              {CATEGORIES.map(cat => {
                const isActive = activeCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCat(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30' : 'pill-tint-cyan hover:bg-cyan-50'}`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* FAQ items */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No questions match your search. Try different keywords or <Link href="/contact" className="text-blue-600 font-bold">ask us directly</Link>.</p>
            </div>
          ) : (
            <Reveal delay={0.15}>
              <Accordion type="single" collapsible className="space-y-3">
                {filtered.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-0">
                    <TiltCard className="card-3d px-5 py-1" maxTilt={3}>
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <div className="flex items-start gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md pill-tint-cyan flex-shrink-0 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>{faq.cat}</span>
                          <span className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{faq.q}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-600 pb-4 pl-1">
                        {faq.a}
                      </AccordionContent>
                    </TiltCard>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          )}

          {/* Bottom CTA */}
          <Reveal delay={0.3}>
            <div className="text-center mt-12">
              <p className="text-slate-500 mb-4">Still have questions?</p>
              <Link href="/contact" className="btn-tactile btn-tactile-primary px-6 py-3 text-sm">
                <MessageCircle className="w-4 h-4" />
                Ask us directly
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
