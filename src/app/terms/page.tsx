import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { BRAND } from '@/lib/sariro-data';

export const metadata = {
  title: 'Terms of Service — Sariro',
  description: 'The terms that govern your use of Sariro\'s live, mentored learning platform.',
};

export default function TermsPage() {
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
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <span
                className="block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-1"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Legal
              </span>
              <h1
                className="text-3xl sm:text-4xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Terms of Service
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-10" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Last updated: June 30, 2026
          </p>

          <div className="space-y-8 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                1. Acceptance of Terms
              </h2>
              <p className="text-sm sm:text-base">
                By accessing or using Sariro's website, courses, cohorts, community spaces, or any related services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not access or use the Services. These Terms form a legally binding agreement between you and {BRAND.name} ("Sariro," "we," "us," or "our").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                2. Eligibility
              </h2>
              <p className="text-sm sm:text-base">
                You must be at least 14 years old to enroll in a Sariro cohort. Students aged 14–17 must have parental or legal guardian consent before enrolling. By enrolling, you represent and warrant that you meet these age requirements and have the legal capacity to enter into this agreement. For school partnerships, the contracting party must be an authorized representative of the school or district.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                3. Enrollment & Payment
              </h2>
              <p className="text-sm sm:text-base mb-3">
                When you enroll in a Sariro cohort, you purchase a seat in a specific cohort of a specific course. Pricing is listed on the /pricing page and on each course card. Payment is processed securely through Razorpay at the time of enrollment. Your seat is confirmed only after successful payment.
              </p>
              <p className="text-sm sm:text-base">
                Cohort dates, curriculum, and mentor assignments are subject to change with at least 7 days' notice. If we cancel a cohort, you will receive a full refund or a free transfer to the next cohort, at your choice. Refund eligibility is governed by our separate <Link href="/refunds" className="text-blue-600 font-bold underline">Refund Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                4. Your Account
              </h2>
              <p className="text-sm sm:text-base">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at <a href={`mailto:${BRAND.email}`} className="text-blue-600 font-bold underline">{BRAND.email}</a> of any unauthorized use. We are not liable for any loss arising from unauthorized account access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                5. Acceptable Use
              </h2>
              <p className="text-sm sm:text-base mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base">
                <li>Share, sell, or redistribute cohort recordings, slides, or any paid Sariro content</li>
                <li>Use the Services to build a competing education product without written permission</li>
                <li>Harass, discriminate against, or disrupt other students, mentors, or staff in cohort spaces</li>
                <li>Attempt to hack, scrape, or reverse-engineer the Sariro platform</li>
                <li>Submit plagiarized or AI-generated work as your own without disclosure (per our academic honesty policy)</li>
                <li>Use Sariro's name, logo, or content for commercial purposes without written permission</li>
              </ul>
              <p className="text-sm sm:text-base mt-3">
                Violations may result in immediate account termination without refund. Serious violations (cheating, harassment, IP theft) may result in permanent ban from all Sariro services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                6. Intellectual Property
              </h2>
              <p className="text-sm sm:text-base mb-3">
                All Sariro course content — including videos, slides, code templates, project briefs, and written materials — is owned by Sariro and protected by copyright law. Your enrollment grants you a personal, non-transferable, non-exclusive license to access this content for your own learning during and after the cohort.
              </p>
              <p className="text-sm sm:text-base">
                Projects you build during a cohort are <strong>yours</strong>. You retain full ownership of your portfolio work. Sariro may showcase anonymized student projects in marketing materials only with your explicit written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                7. Disclaimers
              </h2>
              <p className="text-sm sm:text-base">
                Sariro provides educational services only. We do not guarantee employment outcomes, specific salary levels, or that you will pass any certification exam. Testimonials on our site represent individual experiences and are not promises of future results. The Services are provided "as is" without warranties of any kind, express or implied.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                8. Limitation of Liability
              </h2>
              <p className="text-sm sm:text-base">
                To the maximum extent permitted by law, Sariro's total liability arising out of or relating to these Terms or the Services shall not exceed the amount you paid to Sariro in the 6 months preceding the claim. We are not liable for indirect, incidental, consequential, or punitive damages.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                9. Changes to These Terms
              </h2>
              <p className="text-sm sm:text-base">
                We may update these Terms from time to time. Material changes will be communicated by email to enrolled students at least 14 days before taking effect. Continued use of the Services after changes take effect constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                10. Contact
              </h2>
              <p className="text-sm sm:text-base">
                Questions about these Terms? Email us at <a href={`mailto:${BRAND.email}`} className="text-blue-600 font-bold underline">{BRAND.email}</a> or visit our <Link href="/contact" className="text-blue-600 font-bold underline">contact page</Link>. We reply to every message within 24 hours, Monday through Friday.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-slate-900 underline">Privacy Policy</Link>
            <Link href="/refunds" className="hover:text-slate-900 underline">Refund Policy</Link>
            <Link href="/contact" className="hover:text-slate-900 underline">Contact</Link>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
