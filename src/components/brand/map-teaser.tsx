import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import { DOMAINS } from '@/lib/capabilities/taxonomy';
import { accentFor } from '@/lib/capabilities/accents';

/**
 * SARIRO — The map, on the homepage
 * =========================================================
 * The map was reachable only from a nav item. A visitor could land on the
 * homepage, read the whole course pitch, and leave without ever learning that
 * the thing which actually differentiates this product exists.
 *
 * Deliberately a teaser and not a second map: ten domain names, the honest
 * counts, one link. The homepage's job is to make someone want to look, not to
 * be the thing they look at.
 *
 * No WebGL, no client component, no motion — it renders inside a page whose
 * mobile score was fought for, and a static section costs that score nothing.
 */

export default function MapTeaser() {
  const strandCount = DOMAINS.reduce((n, d) => n + d.strands.length, 0);

  return (
    <section className="relative py-24 sm:py-32 bg-white">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <Compass className="w-5 h-5 text-violet-600" />
            <span
              className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              The Map
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-slate-900 mb-4"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            You don&apos;t pick a course. You pick a direction.
          </h2>

          <p className="text-slate-600 text-[16px] leading-[1.7]">
            Every other platform pushes every learner down the same pre-planned course. We built the
            opposite: {DOMAINS.length} domains and {strandCount} strands of human capability, with no
            beginner version and no advanced version. A ten-year-old and a forty-year-old enter the
            same strand at different depths.
          </p>
        </div>

        {/* Names only. The counts and the honest "mentor-led" labels live on the
            map itself — repeating them here would be a second map, badly. */}
        <div className="flex flex-wrap gap-2 mb-10">
          {DOMAINS.map((domain) => {
            const accent = accentFor(domain.slug);
            return (
              <span
                key={domain.slug}
                className="text-[13.5px] font-semibold px-3.5 py-2 rounded-xl border"
                style={{ color: accent, borderColor: `${accent}33`, background: `${accent}0A` }}
              >
                {domain.name}
              </span>
            );
          })}
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors"
        >
          Explore the map
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
