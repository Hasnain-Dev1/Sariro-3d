import type { Metadata } from 'next';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { DOMAINS } from '@/lib/capabilities/taxonomy';
import { CONTENT_TAGS } from '@/lib/capabilities/content-tags';
import { listContentUnits } from '@/lib/curriculum/identity';
import ExploreMap, { type MapDomain } from '@/app/explore/explore-map';

/**
 * SARIRO — /explore
 * =========================================================
 * The map, made visible. This is the front door to the actual product: not a
 * catalog of what we sell, but an outline of what a person can become capable
 * of, with the honest state of each part shown rather than hidden.
 *
 * Rendered entirely from code (`taxonomy.ts` + `content-tags.ts`), so the page
 * is fully static — no database round trip, no TTFB cost on a site whose known
 * performance ceiling is already server response time. The database copy of the
 * same map exists for the learner model to join evidence against, not for this.
 */

export const metadata: Metadata = {
  title: 'Explore — everything you could become',
  description:
    'The Sariro map: ten domains and sixty-eight strands of human capability. Not a course catalog — an outline of what you can learn, at whatever depth you are at.',
};

/**
 * Lessons per strand, and their titles, from the authored content tags.
 * Titles feed search: a learner typing "memory" should reach the strand whose
 * lessons teach it, even though no strand is called that.
 */
function contentByStrand(): Map<string, { count: number; titles: string[] }> {
  const units = new Map(listContentUnits().map((u) => [u.unitKey, u.name]));
  const byStrand = new Map<string, { count: number; titles: string[] }>();

  for (const [unitKey, tags] of Object.entries(CONTENT_TAGS)) {
    for (const [slug] of tags) {
      const entry = byStrand.get(slug) ?? { count: 0, titles: [] };
      entry.count += 1;
      const title = units.get(unitKey);
      if (title) entry.titles.push(title);
      byStrand.set(slug, entry);
    }
  }
  return byStrand;
}

export default function ExplorePage() {
  const content = contentByStrand();

  const domains: MapDomain[] = DOMAINS.map((d) => ({
    slug: d.slug,
    name: d.name,
    description: d.description,
    isMeta: !!d.isMeta,
    strands: d.strands.map((s) => {
      const found = content.get(s.slug);
      return {
        slug: s.slug,
        name: s.name,
        description: s.description,
        lessonCount: found?.count ?? 0,
        searchTerms: [...s.keywords, ...(found?.titles ?? [])].join(' ').toLowerCase(),
      };
    }),
  }));

  const strandCount = domains.reduce((n, d) => n + d.strands.length, 0);

  return (
    <BrandLayout>
      <PageHero
        eyebrow="The Map"
        title={
          <>
            Everything you
            <br />
            could become.
          </>
        }
        subtitle={`${DOMAINS.length} domains. ${strandCount} strands of human capability. You do not pick a course — you pick a direction, and go as deep as you want.`}
        breadcrumb="Explore"
        variant="resources"
        accentColor="#7C3AED"
      />

      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-slate-600 text-[15px] leading-relaxed">
            Every other platform pushes every learner down the same pre-planned course. This is the
            alternative: a map, not a syllabus. There is no beginner version and no advanced version
            — a ten-year-old and a forty-year-old enter the same strand at different depths, and
            neither is in the wrong place.
          </p>
        </div>
      </section>

      <ExploreMap domains={domains} />
    </BrandLayout>
  );
}
