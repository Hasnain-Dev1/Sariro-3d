'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, Rocket, ArrowRight, ArrowLeft, Star, Clock, Users, CheckCircle2,
  Phone, Mail, Calendar, Globe, Loader2, User, GraduationCap, AlertCircle,
  ChevronDown,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import { TESTIMONIALS, TRACKS } from '@/lib/sariro-data';
import { HoneypotField } from '@/components/security/honeypot';

/* ════════════════════════════════════════════════════════════════════════
   Welcome Page — /welcome
   ════════════════════════════════════════════════════════════════════════
   Sections:
   1. Hero — "Try Sariro — Free Demo Class"
   2. Why take a demo — 3 benefit cards
   3. All testimonials — full grid
   4. Book A Demo Class form — auto-detects timezone + country code
   5. Footer CTA — "Not ready? Browse courses"
   ════════════════════════════════════════════════════════════════════════ */

export default function WelcomePage() {
  return (
    <BrandLayout>
      {/* =================== HERO =================== */}
      <PageHero
        eyebrow="Free Demo Class"
        accentColor="#F59E0B"
        breadcrumb="Welcome"
        variant="about"
        title={
          <>
            Try Sariro <span className="gradient-text">for free.</span>
          </>
        }
        subtitle="Meet your teacher. Build something real in 30 minutes. Ask anything. No credit card, no commitment — just a taste of how Sariro teaches."
      >
        <a href="#book" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm" style={{ background: '#F59E0B' }}>
          <Rocket className="w-4 h-4" />
          Book my demo class
        </a>
        <a href="#testimonials" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          <Star className="w-4 h-4" />
          See what students say
        </a>
      </PageHero>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#FFFBEB" />

      {/* =================== WHY TAKE A DEMO =================== */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-amber-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <Sparkles className="w-3 h-3" />
              WHY TAKE A DEMO
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
              30 minutes that could change everything
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              You won&apos;t just watch a video. You&apos;ll build something real, with a real teacher, in real time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BenefitCard
              icon={<Users className="w-6 h-6" />}
              color="blue"
              title="Meet your teacher"
              description="Not a sales rep. Not a bot. An actual Sariro mentor who teaches the course. Ask them anything — about the curriculum, their background, or whether Sariro is right for you."
            />
            <BenefitCard
              icon={<Rocket className="w-6 h-6" />}
              color="amber"
              title="Build something real"
              description="In 30 minutes, you'll write actual code (or build a Scratch project) and ship something — a tiny game, a working webpage, or your first AI prompt. You keep what you build."
            />
            <BenefitCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="green"
              title="No pressure, no catch"
              description="No credit card. No 'free trial that auto-charges.' If Sariro isn't for you, we'll still have given you a real learning experience. That's the deal."
            />
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFBEB" toColor="#FFFFFF" />

      {/* =================== TESTIMONIALS =================== */}
      <section id="testimonials" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <Star className="w-3 h-3 fill-current" />
              STUDENT VOICES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Don&apos;t take our word for it
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Real students. Real outcomes. Real projects shipped.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F0FDF4" />

      {/* =================== BOOK A DEMO CLASS FORM =================== */}
      <section id="book" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-green-50/50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <Calendar className="w-3 h-3" />
              BOOK A DEMO CLASS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Let&apos;s find your slot
            </h2>
            <p className="text-base text-slate-600">
              Fill this out and we&apos;ll call you within 24 hours to confirm. We auto-detected your timezone so you don&apos;t have to do the math.
            </p>
          </motion.div>

          <DemoClassForm />
        </div>
      </section>

      <WaveDivider3D fromColor="#F0FDF4" toColor="#FFFFFF" />

      {/* =================== FOOTER CTA =================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Not ready to book?
          </h2>
          <p className="text-base text-slate-600 mb-6">
            Browse our courses, read our story, or just poke around. We&apos;ll be here when you&apos;re ready.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/courses" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm">
              Browse courses
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/about" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
              Read our story
            </Link>
            <Link href="/pricing" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Benefit Card
   ════════════════════════════════════════════════════════════════════════ */

function BenefitCard({
  icon,
  color,
  title,
  description,
}: {
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'green';
  title: string;
  description: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="card-3d p-6 h-full"
    >
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Testimonial Card
   ════════════════════════════════════════════════════════════════════════ */

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  index: number;
}) {
  const accentColors: Record<string, string> = {
    blue: '#2563EB',
    green: '#16A34A',
    violet: '#7C3AED',
    amber: '#F59E0B',
    cyan: '#06B6D4',
  };
  const accent = accentColors[testimonial.accent] ?? '#2563EB';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      className="card-3d p-6 h-full flex flex-col"
    >
      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-sm text-slate-700 leading-relaxed mb-5 flex-1 italic">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0"
          style={{ background: accent, fontFamily: 'var(--font-jakarta)' }}
        >
          {testimonial.avatar}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {testimonial.name}
          </p>
          <p className="text-xs text-slate-500 truncate">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Demo Class Form — with auto-detect timezone + country code
   ════════════════════════════════════════════════════════════════════════ */

interface TimezoneInfo {
  timezone: string;
  countryCode: string;
  callingCode: string;
  offsetMinutes: number;
  city: string;
}

// Map of common timezones → country code + calling code + city
const TZ_TO_COUNTRY: Record<string, { country: string; calling: string; city: string }> = {
  'Asia/Karachi': { country: 'PK', calling: '+92', city: 'Karachi' },
  'Asia/Dhaka': { country: 'BD', calling: '+880', city: 'Dhaka' },
  'Asia/Kolkata': { country: 'IN', calling: '+91', city: 'Mumbai' },
  'Asia/Calcutta': { country: 'IN', calling: '+91', city: 'Mumbai' },
  'Asia/Dubai': { country: 'AE', calling: '+971', city: 'Dubai' },
  'Asia/Riyadh': { country: 'SA', calling: '+966', city: 'Riyadh' },
  'Asia/Singapore': { country: 'SG', calling: '+65', city: 'Singapore' },
  'Asia/Hong_Kong': { country: 'HK', calling: '+852', city: 'Hong Kong' },
  'Asia/Tokyo': { country: 'JP', calling: '+81', city: 'Tokyo' },
  'Asia/Seoul': { country: 'KR', calling: '+82', city: 'Seoul' },
  'Asia/Shanghai': { country: 'CN', calling: '+86', city: 'Shanghai' },
  'Asia/Manila': { country: 'PH', calling: '+63', city: 'Manila' },
  'Asia/Bangkok': { country: 'TH', calling: '+66', city: 'Bangkok' },
  'Asia/Jakarta': { country: 'ID', calling: '+62', city: 'Jakarta' },
  'Asia/Kuala_Lumpur': { country: 'MY', calling: '+60', city: 'Kuala Lumpur' },
  'Australia/Sydney': { country: 'AU', calling: '+61', city: 'Sydney' },
  'Pacific/Auckland': { country: 'NZ', calling: '+64', city: 'Auckland' },
  'Europe/London': { country: 'GB', calling: '+44', city: 'London' },
  'Europe/Paris': { country: 'FR', calling: '+33', city: 'Paris' },
  'Europe/Berlin': { country: 'DE', calling: '+49', city: 'Berlin' },
  'Europe/Madrid': { country: 'ES', calling: '+34', city: 'Madrid' },
  'Europe/Rome': { country: 'IT', calling: '+39', city: 'Rome' },
  'Europe/Amsterdam': { country: 'NL', calling: '+31', city: 'Amsterdam' },
  'Europe/Istanbul': { country: 'TR', calling: '+90', city: 'Istanbul' },
  'Europe/Moscow': { country: 'RU', calling: '+7', city: 'Moscow' },
  'America/New_York': { country: 'US', calling: '+1', city: 'New York' },
  'America/Chicago': { country: 'US', calling: '+1', city: 'Chicago' },
  'America/Denver': { country: 'US', calling: '+1', city: 'Denver' },
  'America/Los_Angeles': { country: 'US', calling: '+1', city: 'Los Angeles' },
  'America/Toronto': { country: 'CA', calling: '+1', city: 'Toronto' },
  'America/Vancouver': { country: 'CA', calling: '+1', city: 'Vancouver' },
  'America/Mexico_City': { country: 'MX', calling: '+52', city: 'Mexico City' },
  'America/Sao_Paulo': { country: 'BR', calling: '+55', city: 'São Paulo' },
  'America/Argentina/Buenos_Aires': { country: 'AR', calling: '+54', city: 'Buenos Aires' },
  'America/Bogota': { country: 'CO', calling: '+57', city: 'Bogotá' },
  'America/Lima': { country: 'PE', calling: '+51', city: 'Lima' },
  'America/Santiago': { country: 'CL', calling: '+56', city: 'Santiago' },
  'Africa/Cairo': { country: 'EG', calling: '+20', city: 'Cairo' },
  'Africa/Lagos': { country: 'NG', calling: '+234', city: 'Lagos' },
  'Africa/Johannesburg': { country: 'ZA', calling: '+27', city: 'Johannesburg' },
  'Africa/Nairobi': { country: 'KE', calling: '+254', city: 'Nairobi' },
};

function detectTimezone(): TimezoneInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const mapping = TZ_TO_COUNTRY[tz];

    // Calculate offset in minutes
    const now = new Date();
    const offsetMinutes = -now.getTimezoneOffset();

    if (mapping) {
      return {
        timezone: tz,
        countryCode: mapping.country,
        callingCode: mapping.calling,
        offsetMinutes,
        city: mapping.city,
      };
    }

    // Fallback: try to extract country from browser language
    const lang = navigator.language || 'en-US';
    const langCountry = lang.split('-')[1]?.toUpperCase();
    if (langCountry && langCountry.length === 2) {
      return {
        timezone: tz,
        countryCode: langCountry,
        callingCode: '+1', // fallback
        offsetMinutes,
        city: tz.split('/').pop()?.replace(/_/g, ' ') ?? 'Your city',
      };
    }

    return {
      timezone: tz,
      countryCode: 'US',
      callingCode: '+1',
      offsetMinutes,
      city: tz.split('/').pop()?.replace(/_/g, ' ') ?? 'Your city',
    };
  } catch {
    return {
      timezone: 'UTC',
      countryCode: 'US',
      callingCode: '+1',
      offsetMinutes: 0,
      city: 'Your city',
    };
  }
}

function DemoClassForm() {
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [courseInterest, setCourseInterest] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [tzInfo, setTzInfo] = useState<TimezoneInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Detect timezone on mount
  useEffect(() => {
    // Defer to avoid cascading renders (matches existing pattern)
    Promise.resolve().then(() => setTzInfo(detectTimezone()));
  }, []);

  // Generate next 7 days × 4 slots
  // Generate next 7 days for the date picker
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() + i + 1);
    date.setHours(0, 0, 0, 0);
    return {
      offset: i + 1,
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate().toString(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSubmitError(null);

    // Validation
    const fieldErrors: string[] = [];
    if (!studentName.trim() || studentName.trim().length < 2) {
      fieldErrors.push('Please enter your name (at least 2 characters)');
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      fieldErrors.push('Please enter a valid phone number (at least 7 digits)');
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldErrors.push('Please enter a valid email address');
    }
    if (!selectedSlot) {
      fieldErrors.push('Please pick a preferred time slot');
    }
    if (fieldErrors.length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/demo-class/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName.trim(),
          parent_name: parentName.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          course_interest: courseInterest || undefined,
          preferred_slot: selectedSlot,
          preferred_slot_window: getSlotWindowLabel(selectedSlot) || undefined,
          timezone: tzInfo?.timezone ?? 'UTC',
          timezone_offset: tzInfo?.offsetMinutes ?? 0,
          phone_country_code: tzInfo?.countryCode,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setSubmitError(json.message || json.error || 'Submission failed. Please try again.');
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error. Please try again.');
      setSubmitting(false);
    }
  };

  /* ─── Success screen ─── */
  if (success) {
    return <SuccessScreen
      studentName={studentName}
      phone={phone}
      selectedSlot={selectedSlot}
      tzInfo={tzInfo}
    />;
  }

  /* ─── Form ─── */
  return (
    <div className="card-3d p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <HoneypotField name="website" />

        {/* Timezone detection banner */}
        {tzInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-sm text-blue-800">
            <Globe className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                We detected you&apos;re in {tzInfo.city} ({tzInfo.countryCode}, UTC{tzInfo.offsetMinutes >= 0 ? '+' : ''}{tzInfo.offsetMinutes / 60})
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                We&apos;ll call you during your daytime hours. Phone country code: {tzInfo.callingCode}
              </p>
            </div>
          </div>
        )}

        {/* Student name */}
        <Field label="Student name" required icon={<User className="w-4 h-4" />}>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            maxLength={100}
            disabled={submitting}
            placeholder="e.g. Aarav Mehta"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
          />
        </Field>

        {/* Parent name (optional) */}
        <Field label="Parent name (if student is under 18)" icon={<Users className="w-4 h-4" />}>
          <input
            type="text"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            maxLength={100}
            disabled={submitting}
            placeholder="e.g. Priya Mehta"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
          />
        </Field>

        {/* Phone */}
        <Field label="Phone number" required icon={<Phone className="w-4 h-4" />}>
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-[11px] text-green-800 font-semibold leading-tight">
              Please double-check your number is correct — we&apos;ll send your <strong>AI-Ready Certificate</strong> and class details straight to it. A wrong number means you could miss them.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-700 font-semibold leading-tight">
              Please disable any VPN/Proxy to ensure accurate country code detection for your booking.
            </p>
          </div>
          <div className="flex">
            {/* Country code (auto-detected, editable) */}
            <input
              type="text"
              value={tzInfo?.callingCode ?? '+1'}
              readOnly
              className="min-h-[44px] w-20 rounded-l-xl border border-r-0 border-slate-300 px-3 py-2.5 text-base text-slate-500 bg-slate-50 font-bold"
              style={{ fontFamily: 'var(--font-grotesk)', fontSize: '16px' }}
              aria-label="Country code"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              disabled={submitting}
              placeholder="300 1234567"
              className="flex-1 min-h-[44px] rounded-r-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </div>
        </Field>

        {/* Email (optional) */}
        <Field label="Email (optional — we'll send a confirmation)" icon={<Mail className="w-4 h-4" />}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            disabled={submitting}
            placeholder="you@example.com"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
          />
        </Field>

        {/* Course interest (optional) */}
        <Field label="Course interest (optional)" icon={<GraduationCap className="w-4 h-4" />}>
          <div className="relative">
            <select
              value={courseInterest}
              onChange={(e) => setCourseInterest(e.target.value)}
              disabled={submitting}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 disabled:opacity-50 appearance-none pr-10"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            >
              <option value="">No preference — just want to try Sariro</option>
              {TRACKS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </Field>

        {/* Preferred time slot — 2-step: pick date, then pick time */}
        <Field label="Preferred time slot" required icon={<Calendar className="w-4 h-4" />}>
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Pick a day first, then choose an available time block.
              {tzInfo && (
                <span className="block mt-1 text-green-600 font-bold">
                  Times shown in your timezone ({tzInfo.timezone})
                </span>
              )}
            </p>

            {/* Step 1: Date picker — horizontal scrollable row of days */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                1. Select a day
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((day) => {
                  const isSelected = selectedDay === day.offset;
                  return (
                    <button
                      key={day.offset}
                      type="button"
                      onClick={() => { setSelectedDay(day.offset); setSelectedSlot(''); }}
                      disabled={submitting}
                      className={`shrink-0 min-w-[80px] p-2.5 rounded-xl border-2 transition-all min-h-[64px] touch-manipulation text-center ${
                        isSelected
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-slate-200 hover:border-green-300 bg-white'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        {day.weekday}
                      </p>
                      <p className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {day.dayNum}
                      </p>
                      <p className="text-[9px] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        {day.month}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Time slots for selected day */}
            {selectedDay !== null ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    2. Select a time block
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSelectedDay(null); setSelectedSlot(''); }}
                    disabled={submitting}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 min-h-[32px] touch-manipulation"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Change day
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIME_BLOCKS.map((block) => {
                    const slotDate = new Date(now);
                    slotDate.setDate(slotDate.getDate() + selectedDay);
                    slotDate.setHours(block.hour, 0, 0, 0);
                    const slotValue = slotDate.toISOString();
                    const isSelected = selectedSlot === slotValue;
                    return (
                      <button
                        key={block.hour}
                        type="button"
                        onClick={() => setSelectedSlot(slotValue)}
                        disabled={submitting}
                        className={`text-left p-3 rounded-xl border-2 transition-all min-h-[56px] touch-manipulation ${
                          isSelected
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : 'border-slate-200 hover:border-green-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              {block.label}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
                <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Pick a day above to see available time slots</p>
              </div>
            )}

            {/* Selected slot summary */}
            {selectedSlot && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-xs font-bold text-green-800">
                  {new Date(selectedSlot).toLocaleString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: tzInfo?.timezone,
                  })}
                </p>
              </div>
            )}
          </div>
        </Field>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>
        )}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[52px] rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-base font-extrabold flex items-center justify-center gap-2 touch-manipulation transition-colors"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Booking your demo...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" /> Book my free demo class
            </>
          )}
        </button>

        <p className="text-xs text-slate-500 text-center">
          We&apos;ll call you within 24 hours. No spam, ever.
        </p>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Success Screen — shown after successful submission
   ════════════════════════════════════════════════════════════════════════ */

function SuccessScreen({
  studentName,
  phone,
  selectedSlot,
  tzInfo,
}: {
  studentName: string;
  phone: string;
  selectedSlot: string;
  tzInfo: TimezoneInfo | null;
}) {
  // Show the day, then the time WINDOW the user selected (not a single exact
  // time) — a rep calls to confirm the precise slot within that window.
  const slotDate = new Date(selectedSlot);
  const dateLabel = isNaN(slotDate.getTime())
    ? selectedSlot
    : slotDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: tzInfo?.timezone,
      });
  const windowLabel = getSlotWindowLabel(selectedSlot);

  // Auto-scroll fix: when the form is replaced by this shorter confirmation,
  // the page shrinks and Lenis re-clamps scroll, dumping the viewport onto the
  // footer section. Bring the confirmation into view so the user actually sees
  // it. `behavior: 'auto'` places it instantly instead of animating around.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'auto', block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-3d p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-5 shadow-lg"
      >
        <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
      </motion.div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
        You&apos;re booked, {studentName.split(' ')[0]}! 🎉
      </h2>

      <p className="text-base text-slate-600 mb-6 max-w-md mx-auto">
        We&apos;ll call you within 24 hours at{' '}
        <strong className="text-slate-900">
          {tzInfo?.callingCode} {phone}
        </strong>{' '}
        {tzInfo?.countryCode && (
          <span className="text-sm text-slate-500">
            ({tzInfo.countryCode} — {tzInfo.city})
          </span>
        )}
        {' '}to confirm your demo class.
      </p>

      {/* Booking details card */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-left max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-2 text-green-800">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Your preferred window
          </span>
        </div>
        <p className="text-sm font-bold text-green-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {dateLabel}
        </p>
        {windowLabel && (
          <p className="text-sm font-bold text-green-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {windowLabel}
          </p>
        )}
        {tzInfo && (
          <p className="text-xs text-green-600 mt-1">
            {tzInfo.timezone} (UTC{tzInfo.offsetMinutes >= 0 ? '+' : ''}{tzInfo.offsetMinutes / 60})
          </p>
        )}
      </div>

      {/* Window disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 max-w-sm mx-auto flex items-start gap-2 text-left">
        <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-amber-800">
          Our representative will get over a call to confirm your slot in the window you selected.
        </p>
      </div>

      {/* What happens next */}
      <div className="text-left max-w-sm mx-auto mb-6 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
          What happens next
        </p>
        {[
          'We call you within 24h to confirm the exact time',
          'You get a Google Meet link + prep instructions',
          'Show up, meet your teacher, build something real',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {i + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link
          href="/auth/sign-up"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold touch-manipulation"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Sparkles className="w-4 h-4" />
          Sign in / Create account
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/courses"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold touch-manipulation"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          Browse courses while you wait
        </Link>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Want to tell us something before the call? Email{' '}
        <a href="mailto:contact@sariro.com" className="text-green-600 hover:text-green-700 underline">
          contact@sariro.com
        </a>
      </p>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Field wrapper
   ════════════════════════════════════════════════════════════════════════ */

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Time blocks — 4 slots per day
   ════════════════════════════════════════════════════════════════════════ */

const TIME_BLOCKS = [
  { hour: 10, label: 'Morning · 9:00 AM – 12:00 PM' },
  { hour: 13, label: 'Afternoon · 12:00 PM – 4:00 PM' },
  { hour: 17, label: 'Evening · 4:00 PM – 8:00 PM' },
  { hour: 20, label: 'Night · 8:00 PM – 11:00 PM' },
];

/* Returns the human time-window label (e.g. "Morning · 9:00 AM – 12:00 PM") for
   a selected slot ISO string, by matching its hour to TIME_BLOCKS. Slots are
   generated from TIME_BLOCKS, so the local hour uniquely identifies the block.
   Returns null if no block matches (defensive fallback). */
function getSlotWindowLabel(selectedSlot: string): string | null {
  const d = new Date(selectedSlot);
  if (isNaN(d.getTime())) return null;
  const block = TIME_BLOCKS.find((b) => b.hour === d.getHours());
  return block ? block.label : null;
}