import { buildOgImage } from '@/lib/og/brand-frame';

/**
 * Default OG image — used by the home page and as a fallback for any
 * route that doesn't define its own opengraph-image.tsx.
 *
 * File name `opengraph-image.tsx` is a Next.js convention — placed at
 * the app root, it's automatically picked up and the meta tag injected
 * into the layout's <head>.
 */

export const alt = 'Sariro — live classes in maths, science, English and coding';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function HomeOgImage() {
  return buildOgImage({
    eyebrow: 'Live classes, four to a room',
    title: 'Teaching the future.',
    subtitle: 'Maths, science, English and coding. Grades 1 to 12, taught live by mentors who know your name.',
    accent: 'amber',
    footerRight: 'sariro.com',
  });
}
