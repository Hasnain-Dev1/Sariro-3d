import { buildOgImage } from '@/lib/og/brand-frame';
import { TRACKS } from '@/lib/sariro-data';

/**
 * Dynamic OG image for /course-path/[id].
 *
 * Next.js file-based OG convention: when placed at
 * `app/course-path/[id]/opengraph-image.tsx`, Next.js auto-generates
 * the image at build time (or request time) for each value of `id`
 * returned by `generateStaticParams`, and injects the meta tag into
 * the corresponding page's <head>.
 *
 * We export `generateStaticParams` so all track OG images are
 * pre-rendered at build time (faster for users, cheaper for Vercel).
 */

export const alt = 'Sariro Course Path';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return TRACKS.map((t) => ({ id: t.id }));
}

interface OgProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePathOgImage({ params }: OgProps) {
  const { id } = await params;
  const track = TRACKS.find((t) => t.id === id);

  if (!track) {
    // Fallback — shouldn't happen because generateStaticParams constrains
    // the IDs, but defensive.
    return buildOgImage({
      eyebrow: 'Course path',
      title: 'Sariro Course Path',
      subtitle: 'Live, mentored classes.',
      accent: 'amber',
      footerRight: 'sariro.com',
    });
  }

  return buildOgImage({
    eyebrow: `${track.levels.length} levels · 1:4 or 1:1 cohort`,
    title: track.name,
    subtitle: track.tagline,
    accent: track.accent,
    footerRight: `sariro.com/course-path/${track.id}`,
  });
}
