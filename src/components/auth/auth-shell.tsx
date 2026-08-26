'use client';

import Link from 'next/link';
import { GraduationCap, ArrowLeft, type LucideIcon } from 'lucide-react';
import { BRAND } from '@/lib/sariro-data';

/* ═══════════════════════════════════════════════════════════════════════
   AuthShell — shared split-screen layout for sign-in / sign-up.

   Desktop: a dark brand panel on the left (value props + real social proof)
   beside a clean, focused form panel on the right — the layout premium
   products use, instead of one small card floating in an empty void.
   Mobile: the brand panel collapses to a compact header so the form stays
   the whole focus and nothing scrolls needlessly.

   Both auth pages share this, so they read as ONE product; only the accent
   colour, copy and highlights differ. Deliberately pure CSS (no WebGL, no
   infinite animation) to keep these routes fast.
   ═══════════════════════════════════════════════════════════════════════ */

export interface AuthHighlight {
  icon: LucideIcon;
  title: string;
  body: string;
}

export default function AuthShell({
  accent,
  eyebrow,
  panelTitle,
  panelSubtitle,
  highlights,
  formTitle,
  formSubtitle,
  children,
  footer,
  legalAction,
}: {
  /** Tailwind-ish accent tokens driving the panel + focus colours. */
  accent: {
    from: string;      // gradient start (brand panel)
    to: string;        // gradient end
    glow: string;      // decorative orb colour
    chipBg: string;    // eyebrow chip bg
    chipText: string;  // eyebrow chip text
  };
  eyebrow: string;
  panelTitle: React.ReactNode;
  panelSubtitle: string;
  highlights: AuthHighlight[];
  formTitle: string;
  formSubtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  legalAction: string;
}) {
  return (
    <div className="min-h-screen w-full bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ───────── Brand panel (desktop) ───────── */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16"
        style={{ background: `linear-gradient(150deg, ${accent.from} 0%, ${accent.to} 100%)` }}
      >
        {/* Decorative glow + grid — static, no animation */}
        <div
          className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full blur-[130px] pointer-events-none"
          style={{ background: accent.glow, opacity: 0.28 }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
          aria-hidden="true"
        />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 group w-fit">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-extrabold text-xl text-white leading-none" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {BRAND.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/55 font-semibold mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              AI Education
            </div>
          </div>
        </Link>

        {/* Message + highlights */}
        <div className="relative max-w-lg">
          <div
            className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] mb-6"
            style={{ background: accent.chipBg, color: accent.chipText, fontFamily: 'var(--font-grotesk)' }}
          >
            {eyebrow}
          </div>
          <h2
            className="text-4xl xl:text-[2.75rem] font-extrabold text-white leading-[1.1] mb-4"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            {panelTitle}
          </h2>
          <p className="text-white/65 text-[15px] leading-relaxed mb-10">{panelSubtitle}</p>

          <ul className="space-y-5">
            {highlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3.5">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center mt-0.5">
                  <h.icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {h.title}
                  </div>
                  <div className="text-[13px] text-white/55 leading-snug">{h.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof — real numbers from the site */}
        <div className="relative flex items-center gap-8 pt-8 border-t border-white/10">
          {[
            { v: '5,000+', l: 'Students taught' },
            { v: '65+', l: 'Nationalities' },
            { v: '4.9/5', l: 'Average rating' },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {s.v}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/45 font-semibold mt-0.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ───────── Form panel ───────── */}
      <main className="relative flex flex-col justify-center px-5 sm:px-8 py-10 sm:py-14 lg:px-14 xl:px-20">
        {/* Back link — small, unobtrusive, always available */}
        <Link
          href="/"
          className="absolute top-6 left-5 sm:left-8 lg:left-14 xl:left-20 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to site
        </Link>

        {/* Compact brand header — mobile only (panel is hidden there) */}
        <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8 mt-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.glow} 100%)` }}
          >
            <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-extrabold text-lg text-slate-900 leading-none" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {BRAND.name}
            </div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400 font-semibold mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              AI Education
            </div>
          </div>
        </Link>

        <div className="w-full max-w-[400px] mx-auto lg:mx-0">
          <h1
            className="text-[28px] sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            {formTitle}
          </h1>
          <p className="text-sm text-slate-500 mb-8">{formSubtitle}</p>

          {children}

          <div className="mt-7 text-center lg:text-left text-sm text-slate-500">{footer}</div>

          <p className="mt-8 text-[11px] text-slate-400 leading-relaxed text-center lg:text-left">
            By {legalAction} you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-slate-600">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-600">Privacy Policy</Link>.
            We never sell your data.
          </p>
        </div>
      </main>
    </div>
  );
}
