import { buildOgImage } from '@/lib/og/brand-frame';

export const alt = 'Sariro Elementary Courses — Coding for absolute beginners';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function ElementaryOgImage() {
  return buildOgImage({
    eyebrow: 'Elementary · 12 weeks · 8 modules · 48 lessons',
    title: 'Start coding from zero.',
    subtitle: 'Python, Java, Web Basics, and Scratch + ML. Built for absolute beginners and kids. No experience needed.',
    accent: 'amber',
    footerRight: 'From $249 · sariro.com/courses/elementary',
  });
}
