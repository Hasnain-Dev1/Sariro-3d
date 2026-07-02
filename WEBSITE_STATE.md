# SARIRO Website State

> Living record of the current site. READ THIS FIRST before any edits.
> Last updated: 2026-06-29 (session 4)

## Pages (all return 200, lint clean)

| Route | File | Accent | Hero 3D variant |
|---|---|---|---|
| `/` | `src/app/page.tsx` | — | Neural hero (separate component) |
| `/courses` | `src/app/courses/page.tsx` | blue #2563EB | courses (laptop+notebook+pen) |
| `/schools` | `src/app/schools/page.tsx` | green #16A34A | **math theme** (Platonic solids + symbols) |
| `/events` | `src/app/events/page.tsx` | violet #7C3AED | events (rooster+calendar+papers) |
| `/pricing` | `src/app/pricing/page.tsx` | blue #2563EB | pricing (piggy bank+coins) |
| `/about` | `src/app/about/page.tsx` | amber #F59E0B | about (AI orb + orbiting nodes) |
| `/resources` | `src/app/resources/page.tsx` | cyan #06B6D4 | resources (floating books + paper) |
| `/contact` | `src/app/contact/page.tsx` | green #16A34A | contact (child in thinking pose + 3 question marks + circling aeroplane) |
| `/faq` | `src/app/faq/page.tsx` | cyan #06B6D4 | (none — uses PageHero only) |
| `/story` | `src/app/story/page.tsx` | violet #7C3AED | (none) |
| `/*` | `src/app/not-found.tsx` | — | simple server component (no BrandLayout) |

## Component Architecture

- **BrandLayout** (`src/components/brand/brand-layout.tsx`) — wraps every page; provides navbar (10 items including FAQ+Story), footer, cinematic intro, cookie consent, mobile scroll-to-top, companion orb (desktop only), background particles, scroll hue shift
- **PageHero** (`src/components/brand/page-hero.tsx`) — hero header pattern with eyebrow + title + subtitle + accent glow + optional 3D variant
- **PageHero3D** (`src/components/brand/page-hero-3d.tsx`) — 7 themed 3D scenes (courses/schools/events/pricing/about/resources/contact)
- **CinematicIntro** (`src/components/brand/cinematic-intro.tsx`) — 6-phase loading: field (drifting particles) → network (neural sphere) → collapse → logo burst → typing SARIRO wordmark → done. Plays ONLY on full page reload (module-level flag), NOT on route navigation. Skip button + mute toggle at top-right. **Magical sound** via Web Audio API (ascending chime + low drone + sparkle + whoosh + final chime — no external files).
- **CookieConsent** (`src/components/brand/cookie-consent.tsx`) — bottom overlay, 4.2s delay, localStorage + cookie persistence
- **OryzoSection** (`src/components/brand/oryzo-section.tsx`) — "Journey" section on home page. Arrow+swipe navigation (NO pinned scroll). 4 chapters cross-fade. 3D AICore camera orbits by activeIndex. 5s auto-play, pause on hover.
- **Events3D** (`src/components/sariro-3d/events-3d.tsx`) — "Upcoming events" section on home page. Arrow+swipe navigation (NO pinned scroll). 3 event cards cross-fade. 5s auto-play, pause on hover.
- **EffectsKit** (`src/components/brand/effects-kit.tsx`) — Reveal, StaggerGroup, StaggerItem, TiltCard, MagneticButton, SplitText, CountUp, ParallaxOrb, StickyScrollSection (still available but only used on inner pages for short emphasis)

## Key Decisions (DO NOT REVERT)

1. **CinematicIntro MUST be mounted in BrandLayout** (top of return, inside SmoothScrollProvider). Was previously exported but never imported.
2. **CinematicIntro plays on FULL RELOAD only** — uses a module-level `hasPlayedInThisSession` flag. This flag persists across client-side route navigations (same JS context) but resets on full page reload (JS re-evaluates). User explicitly wanted: show on reload, NOT on route navigation.
3. **CinematicIntro is ELABORATE (6 phases)**: field (200 particles drift in space) → network (particles form a neural-network sphere with 20 nodes + edges + traveling pulses) → collapse (everything sucked to center) → logo (burst flash + graduation cap icon) → type (SARIRO wordmark types in letter-by-letter with 3D rotateX) → done. Mouse parallax during field phase. Camera orbits during network phase.
4. **CinematicIntro has MAGICAL SOUND** via Web Audio API (no external files). 5 sound layers: ascending chime (C5-E5-G5-C6), low drone (C3), high sparkle on network form, whoosh on logo burst, final chime on wordmark complete. Mute/unmute toggle button (Volume2/VolumeX icon) next to Skip. Browser autoplay policy handled: AudioContext resumes on first user gesture (click/key/touch).
5. **CookieConsent MUST be mounted in BrandLayout** (bottom of return). Stores choice in localStorage + cookie. Plays after a 4.2s delay so it doesn't clash with cinematic intro.
6. **NO pinned scroll on home page sections** — OryzoSection (Journey) and Events3D (Upcoming Events) both use arrow+swipe navigation now. Pattern: useState activeIdx + left/right arrow buttons + clickable dots + touch swipe handlers + 5s auto-play with pause on hover + AnimatePresence cross-fade.
7. **NO cubes ANYWHERE — ZERO EXCEPTIONS** — removed from About page (was RotatingCube3D) AND removed from SchoolsScene (was a Platonic solid cube). The SchoolsScene math cluster now uses: tetrahedron, torus (replaces cube), octahedron, dodecahedron, icosahedron. Do NOT add a cube to any scene for any reason — not as a Platonic solid, not as a dice, not as a decorative element. If you need a 6-faced shape, use a hexagonal prism or a torus instead.
8. **NO blank quotes** — the About page sticky quote (white text on white bg = invisible) was removed. The dark card quote below it (properly styled) remains.
9. **Story page 5 chapters have hover/tap glow** — each card glows in its accent color on hover (box-shadow + radial glow overlay + scale 1.02 + icon rotates 3deg + border brightens). Active state scales down to 0.99 for tap feedback.
10. **Hero 3D scroll behavior**: every hero scene uses `useScrollRotation()` hook → scroll DOWN rotates clockwise, scroll UP counter-clockwise. PricingScene keeps its own gentle auto-rotation (NOT scroll-driven).
11. **Discount display** (Summer 2026 launch pricing): all courses + Starter/Builder tiers show originalPrice (strikethrough), live price (CountUp), Save X% badge, "You save $X" line — ALL IN RED (#DC2626). Defined in `src/lib/sariro-data.ts` with `originalPrice` fields + `discountPercent()` helper + `DISCOUNT_LABEL` + `DISCOUNT_DEADLINE` constants.
12. **Filter pills**: PLAIN PILLS, no count badges. Active state uses gradient bg with brand colors. Inactive state uses `pill-tint-{accent}` CSS class (NOT slate-100).
13. **Section backgrounds**: NO gray anywhere. Use `mesh-bg-soft-{blue|green|violet|amber|cyan|red}` CSS utility classes for section splits. Defined in `src/app/globals.css`.
14. **FAQ + Story ARE in NAV_ITEMS** — both pages were previously unreachable (no nav links). Now in navbar (10 items), mobile menu, and footer (Learn column: Courses/Schools/Events/Pricing; Company column: About/Story/Resources/FAQ/Contact).
15. **404 page**: simple server component, NO BrandLayout wrap (avoids cascading errors on 404).
16. **Story + FAQ pages**: use plain text, NO unicode escape sequences for special characters (renders as literal text otherwise).
17. **Mobile UX**: hamburger menu 44x44px, no overflow, "Start learning" button hidden on mobile (`hidden lg:block`).
18. **Windows compatibility**: package.json scripts must work on Windows (no rm -rf, no POSIX-only commands).

## Arrow+Swipe Navigation Pattern (for OryzoSection + Events3D)

When building or modifying arrow+swipe sections, use this exact pattern:
```typescript
const [activeIdx, setActiveIdx] = useState(0);
const [paused, setPaused] = useState(false);
const touchStartX = useRef<number | null>(null);

const goNext = () => setActiveIdx((i) => (i + 1) % count);
const goPrev = () => setActiveIdx((i) => (i - 1 + count) % count);

// Auto-play every 5s, pause on hover
useEffect(() => {
  if (paused) return;
  const t = setInterval(() => setActiveIdx((i) => (i + 1) % count), 5000);
  return () => clearInterval(t);
}, [paused, count]);

// Touch handlers for mobile swipe
const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
const onTouchEnd = (e: React.TouchEvent) => {
  if (touchStartX.current === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX.current;
  if (Math.abs(dx) > 50) { dx > 0 ? goPrev() : goNext(); }
  touchStartX.current = null;
};
```
Section wrapper gets: `onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}`

UI elements:
- Left arrow: `absolute left-4 top-1/2 -translate-y-1/2` (ChevronLeft in 12x12 rounded glass button)
- Right arrow: `absolute right-4 top-1/2 -translate-y-1/2` (ChevronRight)
- Dots: `absolute bottom-12 left-1/2 -translate-x-1/2` (active = 32px wide blue, inactive = 8px white/30)
- Counter: `absolute top-20 right-8` (shows "0X / 0Y")

## Brand Tokens (from globals.css)

| Token | Value |
|---|---|
| Primary blue | #2563EB |
| Brand green | #16A34A |
| Violet | #7C3AED |
| Amber | #F59E0B |
| Cyan | #06B6D4 |
| Red (discount) | #DC2626 |
| Heading font | Plus Jakarta Sans (`var(--font-jakarta)`) |
| Body font | Inter |
| Button/badge font | Space Grotesk (`var(--font-grotesk)`) |
| Tactile buttons | `.btn-tactile`, `.btn-tactile-primary`, `.btn-tactile-green`, `.btn-tactile-light`, `.btn-tactile-deep` |
| Colorful mesh | `.mesh-bg`, `.mesh-bg-soft`, `.mesh-bg-soft-{accent}` |
| Colorful pills | `.pill-tint`, `.pill-tint-{accent}` |
| Gradient text | `.gradient-text` (blue→violet→green) |

## Data File (`src/lib/sariro-data.ts`)

Exports:
- `BRAND`, `NAV_LINKS`, `TRUSTED_BY`, `HERO_STATS`, `TRACKS`
- `COURSES` (6 items, each with `price` + `originalPrice`)
- `EVENTS` (3 items)
- `TESTIMONIALS` (6 items)
- `PRICING_TIERS` (3 items, Starter/Builder have `price`+`originalPrice`, School Pro has `price: null`)
- `MIMO` (bio, numbers[4], principles[4])
- `FOOTER_LINKS`
- `DISCOUNT_LABEL`, `DISCOUNT_DEADLINE`, `discountPercent(price, originalPrice)`

## Five emails (footer)
hello@sariro.ai, support@sariro.ai, schools@sariro.ai, partnerships@sariro.ai, careers@sariro.ai

## Scripts (package.json — Windows compatible)
- `dev`: next dev -p 3000
- `build`: next build
- `start`: next start -p 3000
- `lint`: eslint .

## Known Pre-existing Lint Warnings (leave alone)
- `brand-layout.tsx:65` — setState-in-effect in BrandNavbar
- `neural-hero-scene.tsx:133` — immutability mutation

## Files Modified in Session 4 (this session)
- `src/components/brand/cinematic-intro.tsx` — rewrote: 6-phase elaborate intro (field→network→collapse→logo→type→done), module-level flag for reload-only, magical sound via Web Audio API, mute toggle. **Mobile fix**: isMobile initialized from window.innerWidth BEFORE first render (no flash); 3D group offset groupY=-1.5 on mobile so neural network renders in bottom portion (logo stays at top).
- `src/components/brand/oryzo-section.tsx` — rewrote: arrow+swipe (was pinned scroll), kept 3D AICore. **Text fix**: removed `filter: blur(8px)` from AnimatePresence (mobile-buggy rendering), changed container from `minHeight: 320px` to fixed `height: 340px` (prevents layout collapse during mode="wait" gap), reduced font sizes slightly for mobile fit.
- `src/components/sariro-3d/events-3d.tsx` — rewrote: arrow+swipe (was pinned scroll)
- `src/app/about/page.tsx` — removed RotatingCube3D + CUBE_FACES + CubeFace + sticky quote; added principle highlights grid
- `src/app/story/page.tsx` — added hover/tap glow to 5 chapter cards

## Session 5+ Changes (all sessions after session 4)

### Hero button change
- Removed "Meet Mimo" button (was linking to /about)
- Added "Sign up!" button → links to `/auth/sign-up`

### Legal pages created
- `/terms` — Terms of Service (10 sections: acceptance, eligibility, enrollment, account, acceptable use, IP, disclaimers, liability, changes, contact)
- `/refunds` — Refund Policy (14-day money-back guarantee, pro-rata after 14 days, transfer policy, non-refundable items)
- `/privacy` — Privacy Policy (10 sections: data collection, usage, cookies, sharing, GDPR/CCPA rights, retention, security, children, changes, contact)
- All 3 linked from footer Company section + bottom bar

### Course tracks restructured (6 tracks, 16 courses)
**File: `src/lib/sariro-data.ts`** → `TRACKS` array + `COURSES` array

| Track | Beginner ($199) | Intermediate ($299) | Advanced ($699) |
|---|---|---|---|
| AI Engineer | Python with AI Foundations | Beyond Python: AI & Agents | Beyond Agents: Build SLMs & LLMs |
| Web Developer | Build Your First Website | Beyond Frontend: Node/SQL/APIs/React | Production Web: Docker/AWS/K8s/Security |
| Prompt Engineering | Prompt Engineering Mastery | — | — |
| GTM Engineering | AI-Powered Outbound | RevOps & Pipeline Engineering | AI GTM Platform Engineering |
| AI Security | Security Fundamentals | AI-Powered Security Tools | AI Red Team & Advanced SecOps |
| Data Intelligence | Data Thinking & Python Basics | AI Analytics & Machine Learning | Data Platform Engineering |

- Each track is a **continuous path** — no topic repeats across levels
- Beginner: 5 modules, 30 lessons (6 per module)
- Intermediate: 7 modules, 42 lessons (6 per module)
- Advanced: 16 modules, 96 lessons (6 per module)
- Filter buttons on home + courses page show 6 tracks (no "All" pill)

### Stat pills (Mimo portrait)
- Replaced 3D rotating cube on Mimo portrait with floating pill-shaped stat badges
- 4 pills: 12+ Years teaching (orange), 7 Patents filed (green), 5,000+ Students mentored (blue), 36 Papers published (violet)
- Mobile: pills stack in 2-col grid below portrait

### About page restructured
- Section 1: About Sariro (company narrative + stats + principles)
- Section 2: Meet Mimo Patra (portrait + stat pills + bio + principles)
- Section 3: The Team (6 members including Hasnain Ali as Lead Developer & Co-Founder)

### Pricing
- 3 tiers: Beginner ($199/$398), Intermediate ($299/$854), Expert ($699/$2330)
- 1:4 vs 1:1 dropdown: switches price AND Razorpay payment link
- 1:4 links: sarirobeginner, sarirointermediate, sariroadvanced
- 1:1 links: sarirobeginner1on1, sarirointermediate1on1, sariroadvanced1on1 (placeholder — swap with real links)

### Email directory (5 mailboxes @sariro.com)
- contact@sariro.com (General), support@sariro.com (Support), dev@sariro.com (Development), hr@sariro.com (Careers), founder@sariro.com (Founder)
- Shown on Contact page + footer Connect section

### Razorpay payment links
- `getRazorpayLink(level, ratio)` function in sariro-data.ts
- Home + Courses page "Join cohort" → links to `/courses/{level}` tier page
- Tier page "Reserve a seat" → opens Razorpay in new tab
- Pricing page CTA buttons → open Razorpay based on dropdown ratio

### Auth (Supabase)
- Google One Tap, GitHub OAuth, Email/Password
- Profile completion modal (asks for missing name/phone/email based on provider)
- AuthNavButton in navbar (Sign in / avatar dropdown)
- Sign-in page: blue theme, "Welcome back"
- Sign-up page: violet+amber theme, "Become a Sariro builder" + benefit cards

### Chat bubble (SLM)
- Floating bubble bottom-right with flying entrance animation
- Keyword-based FAQ matching (28 FAQ entries)
- Body scroll lock when open
- `/api/chat` endpoint

### Mobile fixes
- Chat panel close button: 44px touch target
- Syllabus modal close button: 44px touch target
- Syllabus modal: items-start on mobile (top not clipped)
- Cookie consent: z-index lowered to 45 (was 9998)
- Chat bubble + companion orb + cookie banner hidden when any modal open
- Mobile sidebar: body scroll lock when open
- Mobile sidebar: "Start Learning" button removed (hero "Explore Courses" is enough)
- Mobile sidebar: nav scrollable, auth button pinned to bottom

### Sound fix (cinematic intro)
- AudioContext starts suspended on browser reload (autoplay policy)
- Sound queues on intro start, replays on first user gesture (click/tap/keypress)
- `soundHasPlayed` flag prevents double-play
- `pointerdown` listener added for broader coverage

### 3D scene changes
- ContactScene: replaced cartoon child+plane with glass envelope + orbiting bubbles + light trail
- EventsScene: replaced rooster with floating glass event ticket + confetti
- StoryScene + FaqScene: new 3D variants added
- PricingScene + AboutScene: UNTOUCHED
