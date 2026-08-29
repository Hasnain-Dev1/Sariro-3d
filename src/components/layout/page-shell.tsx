import type { ReactNode } from 'react';

/**
 * SARIRO — Page layout primitives
 * =========================================================
 * Alignment is not a detail; it is most of what "well designed" means. A reader
 * cannot articulate why a page feels amateur, but their eye tracks the left edge
 * of the content down the page, and every time that edge moves the page feels
 * slightly broken.
 *
 * Before this existed, one page used four different container widths — 768px,
 * 896px, 1024px, 1152px — and three different section rhythms. Every section
 * boundary shifted the text edge. That is the entire "things are not aligned"
 * feeling, and no amount of prettier cards fixes it.
 *
 * ── Two widths. Not three, not five. ───────────────────────────────────────
 *   WIDE      grids of cards — the map, subject listings
 *   DEFAULT   documents — detail pages, forms, anything read top to bottom
 *
 * **One width per page.** Pick by what the page IS, then never change it
 * mid-scroll. A document page does not get a wide section for one grid.
 *
 * Prose caps at 65ch inside either container: line length is a legibility
 * constraint, not a layout one, so it is applied to the text and never by
 * shrinking the container it sits in.
 */

type Width = 'default' | 'wide';

const WIDTH: Record<Width, string> = {
  default: 'max-w-4xl',
  wide: 'max-w-6xl',
};

/**
 * Horizontal container. Gutters are identical at both widths so the text edge
 * is the only thing that ever differs between pages.
 */
export function Container({
  width = 'default',
  className = '',
  children,
}: {
  width?: Width;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${WIDTH[width]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

/**
 * Vertical rhythm. One scale, three steps — because a page with five different
 * section paddings reads as accidental, and one with a single padding reads as
 * monotonous.
 *
 *   tight    stacked panels that belong together
 *   base     the default; almost everything
 *   loose    a section that should feel like a new chapter
 */
type Rhythm = 'tight' | 'base' | 'loose';

const RHYTHM: Record<Rhythm, string> = {
  tight: 'py-10 sm:py-14',
  base: 'py-14 sm:py-20',
  loose: 'py-20 sm:py-28',
};

/** Background tones. Alternating them is what gives a long page structure. */
type Tone = 'white' | 'muted' | 'none';

const TONE: Record<Tone, string> = {
  white: 'bg-white',
  muted: 'bg-slate-50',
  none: '',
};

export function Section({
  rhythm = 'base',
  tone = 'white',
  divided = true,
  width = 'default',
  className = '',
  children,
}: {
  rhythm?: Rhythm;
  tone?: Tone;
  /** Hairline top border. The cheapest way to make sections read as sections. */
  divided?: boolean;
  width?: Width;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`${RHYTHM[rhythm]} ${TONE[tone]} ${divided ? 'border-t border-slate-100' : ''} ${className}`}
    >
      <Container width={width}>{children}</Container>
    </section>
  );
}

/**
 * Section heading + optional standfirst, always the same shape.
 *
 * Having one component for this is why every section on every page has the same
 * distance between its title and its body — the kind of consistency nobody
 * notices and everybody feels.
 */
export function SectionHeading({
  title,
  children,
  className = '',
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-8 ${className}`}>
      <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-slate-900">
        {title}
      </h2>
      {children && <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mt-2">{children}</p>}
    </div>
  );
}
