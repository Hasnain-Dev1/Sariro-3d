'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Users, Clock, Star, Check } from 'lucide-react';
import SelfServeBooking from '@/components/trial/self-serve-booking';

/**
 * SARIRO — the page a paid ad lands on
 * ============================================================================
 * Somebody taps an ad in WhatsApp or Instagram and arrives here. That is a
 * different visitor from one who found the site and browsed to /welcome, and
 * the page has to be different too.
 *
 * ── The form is the page ────────────────────────────────────────────────────
 * The ad already did the selling. A visitor who taps it has decided to look,
 * and the job here is to not lose them between the tap and the booking. So the
 * form is above the fold on a phone rather than under a hero and three
 * sections of copy — the marketing page has those, and this is not the
 * marketing page.
 *
 * ── There is no navigation, on purpose ──────────────────────────────────────
 * Every link in a header is a way to leave. On an organic page that is a
 * service; on a page you paid for a click to reach, it is a leak. The only
 * links here go to the terms and privacy pages, because those have to exist.
 *
 * ── Why it is deliberately light ────────────────────────────────────────────
 * No 3D scene, no scroll animation, no hero canvas. Meta traffic is
 * overwhelmingly mobile and often on a poor connection, and the ad platform
 * charges more for a slow landing page. Everything here is text, one small
 * image and the form.
 */

const PROOF = [
  { icon: Users, title: 'Never more than four', body: 'Every class is capped at four students, so nobody sits at the back.' },
  { icon: Clock, title: 'Thirty minutes', body: 'One real lesson with a real teacher, not a sales call in disguise.' },
  { icon: ShieldCheck, title: 'Nothing to pay', body: 'No card, no commitment. Decide afterwards, or do not.' },
];

const WHAT_HAPPENS = [
  'You meet the teacher who would actually take the class.',
  'Your child works on something real — not a slideshow about the subject.',
  'You get an honest read on where they are, whether or not you sign up.',
];

export default function FreeClassPage() {
  return (
    <main className="min-h-screen bg-[#FBF9F6]">
      {/* Header: the mark, and nothing to click away with. */}
      <header className="px-5 pt-6 pb-2 max-w-lg mx-auto flex items-center gap-2.5">
        <Image
          src="/logo.svg"
          alt="Sariro"
          width={34}
          height={34}
          priority
          className="rounded-lg"
        />
        <span className="text-lg font-extrabold text-[#1A1611]" style={{ fontFamily: 'var(--font-jakarta)' }}>
          Sariro
        </span>
        <span className="ml-auto text-[11px] font-bold text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
          Live online classes
        </span>
      </header>

      <div className="max-w-lg mx-auto px-5 pb-16">
        {/* The promise, in as few words as it can be made. */}
        <section className="pt-4 pb-6">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-800 text-[11px] font-bold"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Star className="w-3 h-3 fill-green-700 text-green-700" />
            Free · no card needed
          </span>

          <h1
            className="mt-3 text-[30px] leading-[1.15] sm:text-4xl font-extrabold text-[#1A1611] tracking-tight"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Try Sariro once.
            <br />
            <span className="text-blue-700">Discover what your child’s regular class is missing.</span>
          </h1>

          {/* The founder's line. It makes the free class a comparison the
              parent runs themselves, against the class their child already
              sits in every week — which is the only comparison that matters. */}
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            Book a free class: thirty minutes with a real teacher, in a class of four or fewer.
            Maths, science, English, coding or public speaking — grades 1 to 12, and adults too.
          </p>
        </section>

        {/* The booking, above the fold on a phone. This is the whole page.

            It used to be a form that left details for a seller to ring. That
            is one human per booking, and it caps how many trials a day the
            company can run at however many calls somebody can make. The parent
            now picks a real time from a real diary and the class exists before
            they close the tab. */}
        <section id="book">
          <SelfServeBooking />
        </section>

        {/* Reassurance goes UNDER the form. Above it, it is just delay. */}
        <section className="mt-8 space-y-4">
          {PROOF.map((p) => (
            <div key={p.title} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E7DFD4] flex items-center justify-center shrink-0">
                <p.icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1A1611]" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {p.title}
                </p>
                <p className="text-[13px] text-slate-600 leading-relaxed mt-0.5">{p.body}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl bg-[#1A1611] p-5">
          <p
            className="text-[10px] font-bold uppercase tracking-wider text-amber-400"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            What actually happens
          </p>
          <ul className="mt-3 space-y-2.5">
            {WHAT_HAPPENS.map((line) => (
              <li key={line} className="flex gap-2.5 text-[13px] text-slate-200 leading-relaxed">
                <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* One honest line instead of invented testimonials. */}
        <p className="mt-8 text-[13px] text-slate-500 leading-relaxed text-center">
          Sariro is run by teachers, not a call centre. If the class is not right for your child, we will
          say so.
        </p>

        <footer className="mt-8 pt-6 border-t border-[#E7DFD4] text-center">
          <p className="text-[11px] text-slate-400">
            SARIRO PVT. LTD. · Bankura, West Bengal
          </p>
          <p className="mt-1.5 text-[11px] text-slate-400">
            <Link href="/terms" className="underline hover:text-slate-600">Terms</Link>
            {' · '}
            <Link href="/privacy" className="underline hover:text-slate-600">Privacy</Link>
            {' · '}
            <a href="mailto:support@sariro.com" className="underline hover:text-slate-600">support@sariro.com</a>
          </p>
        </footer>
      </div>
    </main>
  );
}
