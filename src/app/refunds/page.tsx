import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { BRAND } from '@/lib/sariro-data';

export const metadata = {
  title: 'Refund Policy — Sariro',
  description: 'Our 14-day money-back guarantee and refund process for Sariro cohorts.',
};

export default function RefundsPage() {
  return (
    <BrandLayout>
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 mb-6 transition-colors"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <RotateCcw className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <span
                className="block text-xs font-bold uppercase tracking-[0.18em] text-green-600 mb-1"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Legal
              </span>
              <h1
                className="text-3xl sm:text-4xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Refund Policy
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-10" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Last updated: June 30, 2026
          </p>

          {/* The guarantee highlight */}
          <div
            className="rounded-2xl p-6 sm:p-8 mb-10 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #16A34A 0%, #1A1611 100%)' }}
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
              <h2
                className="text-2xl font-extrabold mb-2"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                14-day money-back guarantee
              </h2>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                Not the right fit? Get a full refund within 14 days of cohort start — no questions, no friction. Email <a href="mailto:support@sariro.com" className="underline font-bold">support@sariro.com</a> and we'll process your refund within 5 business days.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                1. The 14-Day Window
              </h2>
              <p className="text-sm sm:text-base">
                Every Sariro cohort enrollment comes with a 14-day money-back guarantee starting from the cohort's first live session. If at any point during those 14 days you decide Sariro isn't for you, email <a href="mailto:support@sariro.com" className="text-blue-600 font-bold underline">support@sariro.com</a> with your enrollment details and we'll issue a full refund. You don't need to give a reason — "it's not for me" is enough.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                2. After 14 Days
              </h2>
              <p className="text-sm sm:text-base mb-3">
                Refunds requested after the 14-day window are pro-rated based on sessions attended:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
                <li><strong>Days 15–30:</strong> 70% refund if you've attended ≤ 50% of live sessions</li>
                <li><strong>Days 31–50% of cohort:</strong> 40% refund if you've attended ≤ 50% of live sessions</li>
                <li><strong>After 50% of cohort:</strong> No refund, but you retain lifetime access to recordings and community</li>
              </ul>
              <p className="text-sm sm:text-base mt-3">
                "Attended" includes live presence OR watching the session recording within 7 days of the live session.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                3. How to Request a Refund
              </h2>
              <ol className="list-decimal pl-6 space-y-2 text-sm sm:text-base">
                <li>Email <a href="mailto:support@sariro.com" className="text-blue-600 font-bold underline">support@sariro.com</a> with the subject "Refund request — [Course name]"</li>
                <li>Include your full name and the email you used to enroll</li>
                <li>We'll confirm receipt within 24 hours (Mon–Fri)</li>
                <li>Refund is processed back to your original payment method within 5 business days</li>
                <li>You'll receive a confirmation email once the refund is processed</li>
              </ol>
              <p className="text-sm sm:text-base mt-3">
                Depending on your bank, it may take an additional 3–10 days for the refund to appear on your statement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                4. Cohort Transfers (Instead of Refund)
              </h2>
              <p className="text-sm sm:text-base">
                If you can't make the cohort dates but still want to take the course, you can defer to the next cohort of the same course for free — as long as you request it before your original cohort starts. Email <a href="mailto:support@sariro.com" className="text-blue-600 font-bold underline">support@sariro.com</a> with "Cohort transfer" in the subject. One free transfer per enrollment; additional transfers are $25 each.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                5. School Pro & Custom Packages
              </h2>
              <p className="text-sm sm:text-base">
                School Pro packages have a separate refund clause in the signed contract. Typically: full refund if cancelled 30+ days before the semester start, 50% refund if cancelled 14–29 days before, no refund if cancelled within 14 days. Custom enterprise contracts follow the terms negotiated in the master service agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                6. Non-Refundable Items
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
                <li>Scholarship awards (no money was paid)</li>
                <li>Donations to the Sariro Open Knowledge Fund</li>
                <li>Merchandise (unless defective — then eligible for exchange)</li>
                <li>1:1 mentor sessions already completed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                7. Account Termination
              </h2>
              <p className="text-sm sm:text-base">
                If your account is terminated due to violations of our <Link href="/terms" className="text-blue-600 font-bold underline">Terms of Service</Link> (cheating, harassment, IP theft, etc.), no refund will be issued. You will lose access to all cohort content, recordings, and the community immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                8. Questions?
              </h2>
              <p className="text-sm sm:text-base">
                Email <a href="mailto:support@sariro.com" className="text-blue-600 font-bold underline">support@sariro.com</a> — we reply within 24 hours, Monday through Friday. For scholarship-related questions, email <a href="mailto:contact@sariro.com" className="text-blue-600 font-bold underline">contact@sariro.com</a>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-500">
            <Link href="/terms" className="hover:text-slate-900 underline">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-900 underline">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-slate-900 underline">Contact</Link>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
