import type { Transition, Variants } from 'framer-motion';

/**
 * SARIRO — House motion
 * =========================================================
 * One place that decides how everything moves.
 *
 * Motion quality is the single biggest "this was designed, not assembled" tell,
 * and it is nearly free — framer-motion is already a dependency, so this changes
 * transition objects rather than adding bundle weight. What makes a site feel
 * cheap is not the absence of animation; it is *inconsistent* animation, where
 * every surface eases differently because each was tuned by hand.
 *
 * Springs, not curves. A cubic-bezier arrives at its destination and stops dead —
 * correct, and lifeless. A spring carries momentum and settles, which is what
 * physical objects do and what the eye reads as expensive.
 *
 * ── The performance contract ──────────────────────────────────────────────
 * Mobile PageSpeed went 38 → 76 by *removing* motion: WebGL gated to capable
 * desktops, eleven infinite animations frozen under 1024px because Lighthouse
 * never saw the viewport settle. Nothing here reintroduces that:
 *
 *   · every animation here is FINITE — it runs once and stops
 *   · only `transform` and `opacity` are animated (compositor-only, no layout)
 *   · reduced-motion collapses every spring to a plain fade
 *
 * Anything heavier than this belongs behind `use-heavy-visuals`.
 */

/**
 * The house spring. Tuned to settle in ~400ms with a hint of overshoot —
 * enough to feel physical, not enough to look bouncy.
 */
export const SPRING: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

/** Snappier, for things that respond directly to a pointer (hover, press). */
export const SPRING_QUICK: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 32,
  mass: 0.6,
};

/** Softer and slower, for large surfaces where overshoot would read as wobble. */
export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 28,
  mass: 1,
};

/**
 * Cascade delay for a list of sections.
 *
 * Capped deliberately: with ten domains an uncapped 40ms stagger makes the last
 * one wait almost half a second, which reads as jank rather than choreography.
 */
export function staggerDelay(index: number, step = 0.04, cap = 3): number {
  return Math.min(index, cap) * step;
}

/** Standard reveal: rise and fade, once, when scrolled into view. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/** For items reflowing inside a list (search results). Scale, so reflow reads as
 *  the same objects rearranging rather than new ones appearing. */
export const reflowVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
};

/**
 * Viewport config for scroll reveals. `once` matters: re-animating on every
 * scroll past is the difference between polish and nausea.
 */
export const VIEWPORT = { once: true, margin: '-60px' } as const;

/**
 * Reduced-motion fallback. Callers spread this instead of a spring when the user
 * has asked for less movement — the content still arrives, it just does not move.
 */
export const REDUCED: Transition = { duration: 0.2, ease: 'easeOut' };
