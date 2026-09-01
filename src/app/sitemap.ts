import type { MetadataRoute } from 'next';
import { TRACKS } from '@/lib/sariro-data';

/**
 * SARIRO — sitemap.xml
 *
 * Generated dynamically at build time. Lists:
 *   - All static public pages (home, courses, pricing, legal, etc.)
 *   - All track course-path pages (/course-path/[trackId])
 *
 * Auth-gated pages (/dashboard/*, /auth/*, /checkout, /payment-*,
 * /settings, /certificate/*) are excluded — they shouldn't be indexed.
 *
 * The site URL is read from NEXT_PUBLIC_SITE_URL, falling back to the
 * Vercel auto-detected URL. For local dev, http://localhost:3000 is used.
 */

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/courses', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/courses/elementary', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/courses/beginner', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/courses/intermediate', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/courses/advanced', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/story', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/events', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/resources', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/refunds', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${baseUrl}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // Dynamic course-path entries — one per track.
  const trackEntries: MetadataRoute.Sitemap = TRACKS.map((t) => ({
    url: `${baseUrl}/course-path/${t.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...trackEntries];
}
