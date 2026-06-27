'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  Clock,
  MapPin,
  CalendarClock,
  Send,
  MessageCircle,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Globe,
  LifeBuoy,
  UserPlus,
  Code2,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { BRAND } from '@/lib/sariro-data';

/* Contact info cards (right column) — all 5 email channels */
const INFO_CARDS = [
  {
    icon: Mail,
    title: 'General',
    value: BRAND.emails.contact,
    sub: 'Course & partnership questions.',
    accent: '#16A34A',
    href: `mailto:${BRAND.emails.contact}`,
  },
  {
    icon: LifeBuoy,
    title: 'Support',
    value: BRAND.emails.support,
    sub: 'Technical help, access issues, refunds.',
    accent: '#2563EB',
    href: `mailto:${BRAND.emails.support}`,
  },
  {
    icon: UserPlus,
    title: 'Careers / HR',
    value: BRAND.emails.hr,
    sub: 'Join the team, partnerships, hiring.',
    accent: '#7C3AED',
    href: `mailto:${BRAND.emails.hr}`,
  },
  {
    icon: Sparkles,
    title: 'Talk to Mimo',
    value: BRAND.emails.founder,
    sub: 'Direct line to the founder.',
    accent: '#F59E0B',
    href: `mailto:${BRAND.emails.founder}`,
  },
  {
    icon: Code2,
    title: 'Dev / Tech',
    value: BRAND.emails.dev,
    sub: 'Platform bugs, integrations, API.',
    accent: '#06B6D4',
    href: `mailto:${BRAND.emails.dev}`,
  },
  {
    icon: CalendarClock,
    title: 'Office hours',
    value: '9am – 6pm UTC',
    sub: 'India-friendly. We reply within 24 hours.',
    accent: '#EC4899',
  },
];

const SUBJECTS = [
  { value: 'general', label: 'General question', email: BRAND.emails.contact },
  { value: 'course', label: 'Course enrollment', email: BRAND.emails.contact },
  { value: 'school', label: 'School / district partnership', email: BRAND.emails.contact },
  { value: 'support', label: 'Technical support', email: BRAND.emails.support },
  { value: 'scholarship', label: 'Scholarship request', email: BRAND.emails.contact },
  { value: 'careers', label: 'Careers / hiring', email: BRAND.emails.hr },
  { value: 'dev', label: 'Developer / API', email: BRAND.emails.dev },
  { value: 'founder', label: 'Direct to Mimo', email: BRAND.emails.founder },
  { value: 'other', label: 'Something else', email: BRAND.emails.contact },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'Contact — Sariro | Get in Touch';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in every field before sending.');
      return;
    }
    if (!form.email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    // Find the correct email based on subject
    const subjectData = SUBJECTS.find((s) => s.value === form.subject);
    const targetEmail = subjectData?.email || BRAND.emails.contact;
    // Simulate async send
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSent(true);
    toast.success('Message sent!', {
      description: `Thanks ${form.name.split(' ')[0]} — we'll reply within 24 hours to ${targetEmail}.`,
    });
    // Also open mailto as a fallback so the query actually reaches the right inbox
    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(`[Sariro] ${subjectData?.label || form.subject}`)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.open(mailtoUrl, '_blank');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <BrandLayout>
      <SonnerToaster position="top-center" richColors closeButton />

      <PageHero
        eyebrow="Get in touch"
        accentColor="#16A34A"
        breadcrumb="Contact"
        variant="contact"
        title={
          <>
            Let's <span className="gradient-text">talk.</span>
          </>
        }
        subtitle="Questions about a course, a school partnership, a scholarship, or just want to say hi? We reply to every message within 24 hours — even the weird ones."
      >
        <a href="#form" className="btn-tactile btn-tactile-green px-5 py-3 text-sm">
          <Send className="w-4 h-4" />
          Send a message
        </a>
        <a href={`mailto:${BRAND.email}`} className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          <Mail className="w-4 h-4" />
          {BRAND.email}
        </a>
      </PageHero>

      {/* ====== Two-column body: form + info ====== */}
      <section id="form" className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color="rgba(22, 163, 74, 0.10)" size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(245, 158, 11, 0.08)" size={320} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* LEFT: form (3 cols) */}
            <Reveal className="lg:col-span-3">
              <div className="card-3d p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      className="text-xl font-extrabold text-slate-900"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      Send us a message
                    </h2>
                    <p className="text-sm text-slate-500">We read every one. Promise.</p>
                  </div>
                </div>

                {sent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3
                      className="text-2xl font-extrabold text-slate-900 mb-2"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      Message sent.
                    </h3>
                    <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                      Thanks for reaching out. We'll reply to your inbox within 24 hours — usually much faster.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="btn-tactile btn-tactile-light px-5 py-3 text-sm"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Ada Lovelace"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="ada@school.edu"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="h-11"
                          required
                        />
                      </div>
                    </div>

                    {/* Subject select */}
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.subject}
                        onValueChange={(v) => setForm({ ...form, subject: v })}
                      >
                        <SelectTrigger id="subject" className="h-11 w-full">
                          <SelectValue placeholder="What's this about?" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us what you're thinking about — the more context, the better the reply."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="min-h-[140px] resize-y"
                        required
                      />
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="btn-tactile btn-tactile-green w-full h-12 text-sm"
                    >
                      {submitting ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-slate-500 text-center">
                      By sending, you agree to our friendly{' '}
                      <Link href="/contact" className="underline hover:text-green-600">privacy policy</Link>.
                      We never sell your data.
                    </p>
                  </form>
                )}
              </div>
            </Reveal>

            {/* RIGHT: info cards (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <Reveal>
                <div className="mb-2">
                  <h2
                    className="text-xl font-extrabold text-slate-900 mb-1"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Other ways to reach us
                  </h2>
                  <p className="text-sm text-slate-500">Pick whatever's easiest for you.</p>
                </div>
              </Reveal>

              <StaggerGroup className="space-y-4" stagger={0.1}>
                {INFO_CARDS.map((card) => {
                  const content = (
                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${card.accent}15`, color: card.accent }}
                      >
                        <card.icon className="w-5 h-5" strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
                          style={{ fontFamily: 'var(--font-grotesk)' }}
                        >
                          {card.title}
                        </div>
                        <div
                          className="text-base font-extrabold text-slate-900 truncate"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          {card.value}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
                      </div>
                      {card.href && (
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all shrink-0" />
                      )}
                    </div>
                  );
                  return (
                    <StaggerItem key={card.title}>
                      <TiltCard className="h-full" maxTilt={5}>
                        {card.href ? (
                          <a
                            href={card.href}
                            className="block card-3d p-5 group hover:-translate-y-1 cursor-pointer"
                          >
                            {content}
                          </a>
                        ) : (
                          <div className="block card-3d p-5 group">{content}</div>
                        )}
                      </TiltCard>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>

              {/* Quick action: book a call */}
              <Reveal delay={0.3}>
                <div
                  className="rounded-2xl p-6 text-white relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #16A34A 0%, #0F172A 100%)',
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                  <div className="relative">
                    <PhoneCall className="w-7 h-7 mb-3" />
                    <h3
                      className="text-lg font-extrabold mb-1"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      Rather just talk?
                    </h3>
                    <p className="text-sm text-white/90 mb-4">
                      Book a free 30-minute discovery call. No pitch — just answers.
                    </p>
                    <Link
                      href="#form"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-white/90 transition-colors"
                      style={{ fontFamily: 'var(--font-grotesk)' }}
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      Book a slot
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Sticky story ====== */}
      <StickyScrollSection pinHeight="150vh">
        <div className="text-center max-w-3xl px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-green-600 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            The Sariro guarantee
          </span>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="Every message gets a real reply. From a real human. Within 24 hours." highlight="real human." highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.2}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              No bots. No tickets. No "we'll get back to you in 5–7 business days." Just us, reading what you wrote and writing back.
            </p>
          </Reveal>
        </div>
      </StickyScrollSection>

      {/* ====== Trust strip ====== */}
      <section className="relative py-12 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(37, 99, 235, 0.08)" size={360} speed={90} position="top-10 right-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-4" stagger={0.1}>
            {[
              { icon: Clock, value: 24, suffix: 'h', prefix: '<', label: 'Reply time' },
              { icon: CheckCircle2, value: 100, suffix: '%', label: 'Messages answered' },
              { icon: Globe, value: 65, suffix: '', label: 'Countries served' },
              { icon: MessageCircle, value: 12000, suffix: '+', label: 'Conversations had' },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <TiltCard className="glass-panel rounded-2xl p-5 text-center h-full" maxTilt={5}>
                  <s.icon className="w-5 h-5 mx-auto text-green-600 mb-2" />
                  <div
                    className="text-2xl font-extrabold text-slate-900"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} duration={1.8} />
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

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(22, 163, 74, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Don't want to wait? Start now." highlight="Start now." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Browse our courses, check pricing, or read the blog while you wait for our reply. Sariro is open knowledge — take what you need.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton as="a" href="/courses" strength={0.25} className="btn-tactile btn-tactile-primary px-6 py-3.5">
                Browse courses
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton as="a" href="/resources" strength={0.25} className="btn-tactile btn-tactile-light px-6 py-3.5">
                Read the blog
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
