'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  School,
  Handshake,
  Briefcase,
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
import { BRAND, EMAILS } from '@/lib/sariro-data';

/* Map the icon name string from EMAILS data to a real icon component. */
const EMAIL_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Mail,
  LifeBuoy,
  School,
  Handshake,
  Briefcase,
  Sparkles,
};

/* Contact info cards (right column) — these are NON-email quick facts. */
const INFO_CARDS = [
  {
    icon: Clock,
    title: 'Response time',
    value: 'Within 24 hours',
    sub: 'Mon–Fri. Weekends are for building.',
    accent: '#2563EB',
  },
  {
    icon: CalendarClock,
    title: 'Office hours',
    value: '9am – 6pm PT',
    sub: 'Async-friendly. We reply across timezones.',
    accent: '#7C3AED',
  },
  {
    icon: MapPin,
    title: 'Where we are',
    value: 'San Francisco · Remote-first',
    sub: 'Worldwide. We\'ve taught in 65 countries.',
    accent: '#F59E0B',
  },
];

const SUBJECTS = [
  { value: 'general', label: 'General question' },
  { value: 'course', label: 'Course enrollment' },
  { value: 'school', label: 'School / district partnership' },
  { value: 'scholarship', label: 'Scholarship request' },
  { value: 'press', label: 'Press / media' },
  { value: 'other', label: 'Something else' },
];

export default function ContactPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <ContactPageInner />
    </Suspense>
  );
}

function ContactPageInner() {
  const params = useSearchParams();
  /**
   * Checkout sends bank-transfer buyers here with the product on the query
   * string (`?intent=bank-transfer&product=…&scope=…&pay=…&ratio=…`). Carrying
   * it into the message means HR can quote the right amount without a round
   * trip, and the buyer does not have to describe what they are buying.
   */
  const isBankTransfer = params.get('intent') === 'bank-transfer';
  const productSlug = params.get('product') ?? '';
  const scopeLabel = params.get('scope') ?? '';
  const cadence = params.get('pay') ?? '';
  const ratio = params.get('ratio') ?? '';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    website: '', // honeypot — see the API route
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Set once, after mount: reading the query string during render would make
  // the server and client disagree about the initial field values.
  useEffect(() => {
    if (!isBankTransfer) return;
    setForm((f) => ({
      ...f,
      subject: f.subject || 'billing',
      message:
        f.message ||
        `I would like to pay by bank transfer${scopeLabel ? ` for ${scopeLabel}` : ''}${
          cadence ? ` (${cadence})` : ''
        }. Please send me the account details and a reference.`,
    }));
  }, [isBankTransfer, scopeLabel, cadence]);

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
    // This used to be `await new Promise(r => setTimeout(r, 900))` followed by a
    // success toast — 900ms of theatre, and the message thrown away. It now
    // actually goes somewhere, and the toast only claims success if it did.
    try {
      const res = await fetch('/api/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: isBankTransfer ? 'bank_transfer' : 'contact',
          full_name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
          product_slug: productSlug,
          scope_label: scopeLabel,
          cadence,
          ratio,
          website: form.website,
        }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!json.ok) {
        setSubmitting(false);
        toast.error(
          json.errors?.[0] ?? 'That did not send. Please try again, or email us directly.'
        );
        return;
      }
    } catch {
      setSubmitting(false);
      toast.error('That did not send — check your connection and try again.');
      return;
    }
    setSubmitting(false);
    setSent(true);
    toast.success('Message sent!', {
      description: `Thanks ${form.name.split(' ')[0]} — we'll reply within 24 hours.`,
    });
    setForm({ name: '', email: '', phone: '', website: '', subject: '', message: '' });
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
      <section id="form" className="relative py-14 sm:py-20 overflow-hidden">
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

                      {/* Phone. Optional in general, but the fastest way to
                          settle a bank transfer is a two-minute call, so it is
                          asked for prominently when that is why they are here. */}
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          Phone {isBankTransfer ? <span className="text-slate-400 normal-case font-semibold">— fastest way to settle a transfer</span> : <span className="text-slate-400 normal-case font-semibold">— optional</span>}
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+91 98765 43210"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="h-11"
                        />
                      </div>

                      {/* Honeypot: hidden from people, irresistible to bots.
                          A filled value makes the API return success without
                          writing anything, so a bot cannot tell it failed. */}
                      <div className="hidden" aria-hidden>
                        <label htmlFor="website">Website</label>
                        <input
                          id="website"
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={form.website}
                          onChange={(e) => setForm({ ...form, website: e.target.value })}
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
              {/* ====== Email directory (5 mailboxes) ====== */}
              <Reveal>
                <div className="mb-2">
                  <h2
                    className="text-xl font-extrabold text-slate-900 mb-1"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Email directory
                  </h2>
                  <p className="text-sm text-slate-500">Pick the inbox that fits. Each one reaches a real human.</p>
                </div>
              </Reveal>

              <StaggerGroup className="space-y-3" stagger={0.08}>
                {EMAILS.map((email) => {
                  const Icon = EMAIL_ICONS[email.icon] ?? Mail;
                  return (
                    <StaggerItem key={email.id}>
                      <TiltCard className="h-full" maxTilt={4}>
                        <a
                          href={`mailto:${email.address}`}
                          className="block card-3d p-4 group hover:-translate-y-1 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${email.accent}15`, color: email.accent }}
                            >
                              <Icon className="w-5 h-5" strokeWidth={2.2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                                  style={{ background: email.accent, fontFamily: 'var(--font-grotesk)' }}
                                >
                                  {email.label}
                                </span>
                              </div>
                              <div
                                className="text-sm font-extrabold text-slate-900 truncate"
                                style={{ fontFamily: 'var(--font-jakarta)' }}
                              >
                                {email.address}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 leading-snug">{email.purpose}</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                          </div>
                        </a>
                      </TiltCard>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>

              {/* ====== Other ways to reach us (non-email quick facts) ====== */}
              <Reveal delay={0.2}>
                <div className="mb-2 mt-6">
                  <h2
                    className="text-xl font-extrabold text-slate-900 mb-1"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Other ways to reach us
                  </h2>
                  <p className="text-sm text-slate-500">Quick facts before you hit send.</p>
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
                    </div>
                  );
                  return (
                    <StaggerItem key={card.title}>
                      <TiltCard className="h-full" maxTilt={5}>
                        <div className="block card-3d p-5 group">{content}</div>
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
                    background: 'linear-gradient(135deg, #16A34A 0%, #1A1611 100%)',
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

      <WaveDivider3D fromColor="#FFFFFF" toColor="#FBF9F6" />

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
      <section className="relative py-12 mesh-bg-soft-green overflow-hidden">
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

      <WaveDivider3D fromColor="#FBF9F6" toColor="#FFFFFF" />

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
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
