import type { Metadata } from 'next';

/* The page itself is a client component, so its title lives here. */
export const metadata: Metadata = {
  title: 'Coding & AI — live, mentored, any age | Sariro',
  description:
    'Coding and AI in four tracks, sorted by what you can already do — from first steps to shipping applications people actually use. Live classes, at most four learners.',
};

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
