/**
 * SARIRO — sections that carry their own buttons
 * ============================================================================
 * Floating things — the cookie notice, the "try a class" bar — sit at the
 * bottom of the screen, which is exactly where a card's button lands as it
 * scrolls into view. Over the homepage pricing cards that meant a floating
 * notice took the click and the button beneath "did not work".
 *
 * A section whose buttons matter marks itself `data-hide-sticky-cta`, and every
 * floating element asks this before it takes up room.
 */
export const OWN_BUTTONS_ATTR = 'data-hide-sticky-cta';

/** Whether any marked section is on screen right now. Client-only. */
export function overOwnButtons(): boolean {
  if (typeof document === 'undefined') return false;
  const marked = document.querySelectorAll(`[${OWN_BUTTONS_ATTR}]`);
  for (const el of marked) {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return true;
  }
  return false;
}
