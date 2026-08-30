import type { Metadata } from 'next';
import { Suspense } from 'react';
import BrandLayout from '@/components/brand/brand-layout';
import EnrollClient, { EnrollFallback } from '@/app/enroll/enroll-client';

/**
 * SARIRO — /enroll
 * =========================================================
 * Checkout for school subjects and focus courses.
 *
 * Reached from the plan pickers on `/subjects/[subject]` and
 * `/subjects/focus/[topic]`, which previously pointed at `/contact` — a general
 * enquiry form, offered to someone who had just decided to buy.
 *
 * `noindex`: this page is meaningless without its query string, and an empty
 * "Complete your enrolment" in search results helps nobody.
 */

export const metadata: Metadata = {
  title: 'Complete your enrolment — Sariro',
  robots: { index: false, follow: false },
};

export default function EnrollPage() {
  return (
    <BrandLayout>
      {/* useSearchParams needs a Suspense boundary, or the whole route opts out
          of static rendering. */}
      <Suspense fallback={<EnrollFallback />}>
        <EnrollClient />
      </Suspense>
    </BrandLayout>
  );
}
