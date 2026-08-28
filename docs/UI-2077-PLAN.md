# Sariro — UI Plan: "2077, Ultra Smooth" (light theme)

> Build plan only. Nothing here is built yet.
> Scope: `/explore` and `/explore/[strand]` first — the flagship surfaces.
> Companion: `IMPROVEMENT-PLAN.md` §4.

---

## The premise

- **Futuristic ≠ dark and glowing.** Dark was rejected: the site is light
  everywhere, so a dark map reads as a *different website*, not a different world.
- In a light theme, "expensive" comes from **precision** — deliberate spacing,
  motion with real physics, confident type hierarchy.
- Vision §11 is the constraint: *"avoid excessive gradients and flashy effects…
  should still look excellent in five years."* Neon ages in eighteen months.
- **The budget:** mobile PageSpeed 38 → 76 was earned by *removing* things.
  Nothing in this plan spends it back. The premium-feeling parts are nearly free;
  the cheap-looking parts (particles, shaders, glows) are what costs.

---

## A. Motion — the biggest tell, nearly free

- Replace **easing curves with spring physics** everywhere on the map.
  - framer-motion is already a dependency — this changes `transition` objects,
    adds no bundle weight.
  - House spring: `{ type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }`
  - Cards should **settle with weight**, not slide to a stop.
- Define the spring once in a shared constant (`src/lib/motion.ts`) so every
  surface moves the same way. Inconsistent motion is what makes a site feel
  assembled rather than designed.
- **Stagger on reveal:** domain sections cascade at ~40 ms, capped at 3 so the
  tenth domain doesn't wait a second to appear.
- **Hover = physical, not decorative.** Card lifts ~2px with the spring, hairline
  border sharpens, accent edge fades in. No scale transforms on text (blurs it).
- **Reduced-motion is honoured**, not as an afterthought: `prefers-reduced-motion`
  drops every spring to an opacity fade. Already a site convention.

## B. View Transitions — map → strand

- The strand card the learner clicks **becomes** the page header on the detail
  page. One effect, disproportionate perceived sophistication.
- Native View Transitions API — no library, degrades silently to a normal
  navigation where unsupported. Zero cost on unsupported browsers.
- Shared element pairs: card title → `<h1>`, accent edge → domain eyebrow.
- **Cheap fallback if it fights Next's router:** match the strand page's entry
  animation to the card's position so it reads as continuous anyway.

## C. Light depth — the "2077" surface, done in white

- **Shadow as light, not grey.** Current cards use a grey drop shadow; replace
  with a two-layer shadow — a tight neutral contact shadow plus a wide, very low
  opacity shadow tinted with the domain accent.
- **Hairline borders** (`1px` at low opacity) do the structural work; the shadow
  only implies elevation.
- **One accent glow per domain**, using the colours already defined in
  `explore-map.tsx` (`ACCENTS`). Never more than one glow in view at rest.
- `glass-panel` already exists in `globals.css` — use it for the sticky search
  bar only. Never over body text; it hurts legibility and looks dated fast.
- **Gradients:** at most one, very wide, very low contrast, behind the hero.
  Nothing rainbow, nothing animated.

## D. Typography — hierarchy, not new fonts

- Fonts are already trimmed 12 → 7 weights for performance. **Work within them.**
- Increase **scale contrast**: hero larger, body unchanged, metadata smaller.
  Timid type is what makes a page read as a template.
- Tighter tracking on headlines (`-0.02em`), generous body line-height (~1.65).
- **Numbers get their own treatment** — tabular figures for "17 of 68 strands",
  "24 lessons". Numerals that shift width while animating look broken.

## E. Search that feels alive

- Currently correct but inert. Three changes:
  - Results **reflow with the house spring**, staggered.
  - The count **morphs** ("68" → "17") rather than snapping.
  - Empty state fades in rather than appearing — it's the one moment the product
    admits it has nothing, and it should feel considered.
- Debounce is unnecessary: filtering is in-memory over 68 items.

## F. The strand page

- Hero: bigger type, accent eyebrow, keywords as quiet chips (already close).
- **The stage ladder is the most "2077" moment available** — four stages,
  foundation → advanced. Render as a connected vertical track with the learner's
  eventual position markable later. This is where mastery will surface in S4, so
  build the shape now and fill it with data later.
- "Start this" is the page's centre of gravity: give it real presence, not a
  default button. It should feel like a decision.
- Course cards and mentor-led block get the same card treatment as the map.

## G. The gate — non-negotiable

- Anything heavier than the above goes behind the existing
  `use-heavy-visuals` hook: **non-touch, ≥1024px, no reduced-motion**.
- Phones get the **identical design** minus GPU cost. That is exactly the pattern
  that earned 38 → 76 and it is not being relaxed.
- **No new infinite CSS animations under 1024px.** Eleven of them once pinned
  Speed Index at 11 s; that mistake is not being repeated.

---

## Build order when the switch flips

1. `src/lib/motion.ts` — house spring + stagger constants *(foundation for all of it)*
2. Motion + hover physics on `/explore` cards
3. Light-depth shadow/border system (shared card class)
4. Typography scale pass on both surfaces
5. Search: spring reflow + morphing count
6. Strand page: hero, stage ladder, "Start this" presence
7. View Transitions map → strand *(last — it's the one that can fight the router)*

Steps 1–4 are the bulk of the perceived change. Step 7 is the showpiece.

## Verification for each step

- `npx tsc --noEmit` → 0 errors, `npx next build` → exit 0
- Render check on `/explore` and both strand shapes (course-backed + mentor-led)
- **Mobile viewport check** — confirm no new animation runs under 1024px
- `/explore` must stay `○ (Static)` in the build output

---

## Explicitly NOT doing

- Dark mode for the map *(rejected — off-theme)*
- Particles, shaders, animated gradients, neon
- Any new font or font weight
- Any new animation library
- Anything that adds a runtime DB call to the map
