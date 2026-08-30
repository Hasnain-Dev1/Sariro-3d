import { redirect } from 'next/navigation';

/**
 * SARIRO — /enroll
 * =========================================================
 * There were two checkouts. `/enroll` sold school subjects and focus courses;
 * `/checkout` sold coding tracks. They disagreed about how you pay, whether you
 * could choose a class size, whether bank transfer was offered, and — most
 * seriously — where the price came from: `/enroll` priced on the server,
 * `/checkout` handed Razorpay a static link with a hard-coded amount.
 *
 * `/checkout` is now the only one and handles all three. This route stays alive
 * because the subject and focus pages link to it, and because a checkout URL a
 * customer has open in a tab should never 404.
 *
 * The query string is forwarded verbatim — `subject`, `focus`, `grade`, `scope`,
 * `pay` and `ratio` all mean the same thing on the other side, so a link mid-
 * purchase survives the move.
 *
 * Temporary (307), not permanent: if school enrolment ever needs its own flow
 * again — a school-specific onboarding step, say — we want that decision back
 * without having told every browser this URL is gone for good.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EnrollPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    // A repeated param (?grade=7&grade=8) arrives as an array. Keep the first:
    // the checkout resolver reads single values, and silently dropping the
    // parameter would land the buyer on "we couldn't find that course".
    query.set(key, Array.isArray(value) ? (value[0] ?? '') : value);
  }

  const qs = query.toString();
  redirect(qs ? `/checkout?${qs}` : '/checkout');
}
