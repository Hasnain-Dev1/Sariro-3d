import Link from 'next/link';
import { ArrowRight, Rocket, ShieldCheck } from 'lucide-react';

/**
 * SARIRO — the last thing on a page that was trying to sell something
 * =========================================================
 * Every subject and focus page ended by listing OTHER subjects. A visitor who
 * had just read a full year's curriculum, decided it was right, and reached the
 * bottom was offered… a sideways link. The moment they were most convinced was
 * the moment the page stopped asking.
 *
 * This is the ask, at the point of highest intent.
 *
 * ── Two doors, deliberately unequal ─────────────────────────────────────────
 * The free class is the loud one. It costs the visitor nothing, it is the only
 * claim on the site that proves itself, and it converts the undecided — who are
 * almost everyone. "Enrol now" is present and quieter, for the minority who
 * arrived already sure. Leading with the price converts those few and loses the
 * rest.
 *
 * ── Why the refund line is here ─────────────────────────────────────────────
 * The last thing read before a decision should be the thing that makes the
 * decision cheap to reverse. It is true, it is already the policy, and it
 * removes the objection that stops a parent who is otherwise ready.
 */

export default function ClosingAsk({
  accent,
  /** "Mathematics — Grade 7", "Organic Chemistry". Makes the ask specific. */
  productName,
  /** Where "Enrol" goes — already carries the grade/cadence they picked. */
  enrolHref,
}: {
  accent: string;
  productName: string;
  enrolHref: string;
}) {
  return (
    <section className="py-14 sm:py-20 border-t border-slate-100" style={{ background: `${accent}08` }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-[2rem] font-bold tracking-[-0.02em] text-slate-900 mb-3">
          Not sure yet? Sit in on a class.
        </h2>
        <p className="prose-measure mx-auto text-slate-600 text-[15px] leading-[1.65] mb-8">
          Watch how {productName} is actually taught before you decide anything. A real lesson with
          a real mentor — no card, no sales call, and no obligation afterwards.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/welcome#book"
            className="inline-flex items-center justify-center gap-2 h-13 px-7 py-3.5 rounded-xl text-slate-900 text-[15px] font-extrabold hover:scale-[1.03] transition-transform shadow-lg w-full sm:w-auto"
            style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' }}
          >
            <Rocket className="w-5 h-5" />
            Book a free class
          </Link>

          <Link
            href={enrolHref}
            className="inline-flex items-center justify-center gap-2 h-13 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-[15px] font-semibold hover:border-slate-400 transition-colors w-full sm:w-auto"
          >
            Enrol now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-6 inline-flex items-center gap-2 text-[13px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          If the batch timings do not suit you, you get a full refund.
        </p>
      </div>
    </section>
  );
}
