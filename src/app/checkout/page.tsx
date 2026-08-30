import type { Metadata } from 'next';
import { Suspense } from 'react';
import BrandLayout from '@/components/brand/brand-layout';
import CheckoutClient, { CheckoutFallback } from '@/app/checkout/checkout-client';

/**
 * SARIRO — /checkout
 * =========================================================
 * The only checkout. Every product ends here:
 *
 *   coding track   /checkout?course=web-101
 *   school grade   /checkout?subject=mathematics&grade=7&scope=grade&pay=monthly
 *   grade group    /checkout?subject=physics&grade=11&scope=group&pay=full
 *   focus course   /checkout?focus=calculus&pay=quarterly
 *
 * `/enroll` was the second one and now redirects here, preserving its query.
 *
 * This URL survived rather than `/enroll` because it is the one with inbound
 * links from the coding catalogue and the tier pages, and because "checkout" is
 * what the thing is — `/enroll` described only half of what it sold.
 *
 * `noindex`: meaningless without a query string, and an empty "Complete your
 * enrolment" in search results helps nobody.
 */

export const metadata: Metadata = {
  title: 'Complete your enrolment — Sariro',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <BrandLayout>
      {/* useSearchParams needs a Suspense boundary, or the whole route opts out
          of static rendering. */}
      <Suspense fallback={<CheckoutFallback />}>
        <CheckoutClient />
      </Suspense>
    </BrandLayout>
  );
}
