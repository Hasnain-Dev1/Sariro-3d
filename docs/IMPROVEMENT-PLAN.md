# Sariro — Improvement Plan: Speed · Quality · Flow · UI · Security

> Companion to `STAGE-2-BUILD.md` (what we're building). This is about how well
> the thing we already have actually works.
> Every item below was checked against the codebase, not assumed.

---

## The one rule that governs all five

**Mobile PageSpeed went 38 → 76 by removing things.** WebGL gated to non-touch
≥1024px, eleven infinite animations frozen under 1024px, three.js lazy-loaded off
every page. That score is the budget. Any "2077" idea that spends it back is
rejected on sight — and the good news is that the expensive-feeling parts of a
premium UI (motion quality, typography, restraint) are nearly free, while the
cheap-looking parts (particles, glows, shaders) are what actually costs.

---

## 1. SPEED

### 1.1 The ceiling is TTFB, and it is not a code problem — **do this first**
`TTFB ≈ 946 ms` on Hostinger: roughly half of a 2.0 s FCP, and a hard floor under
every other optimisation. No amount of frontend work moves it.

**Fix:** Cloudflare (free tier) in front of sariro.com, edge-caching HTML.
Expected TTFB < 100 ms. Cache **bypass** rules are mandatory for:
`/dashboard/*`, `/api/*`, `/auth/*`, checkout and payment routes.

Infra, not code. Highest impact/effort ratio available anywhere in this document.

### 1.2 Keep the new surfaces static
`/explore` and all 68 `/explore/[strand]` pages build as `○ (Static)` — they
render from `taxonomy.ts` + `content-tags.ts`, no database round trip. The DB copy
of the map exists for the learner model to join against, not for rendering.

**Rule going forward:** the map never gets a runtime DB call. If a future feature
needs live data on it (e.g. "3 learners started this"), fetch it client-side after
paint so the static shell still serves instantly.

### 1.3 Build time is an iteration tax
The production build has hung twice at "Finalizing page optimization", and Next
itself warns: *"Slow filesystem detected… if `D:\DREAM\sariro-3d\.next` is a
network drive, consider moving it to a local folder."*

**Fix:** test a build with the repo on `C:`. If it's dramatically faster, move it.
This costs nothing and pays back on every deploy.

### 1.4 Watch the strand-page count
68 prerendered pages each pull the full `BrandLayout` (three.js, framer-motion).
Fine at 68. At 500+ capabilities it won't be. **Revisit when leaf capabilities are
authored** — likely switch to ISR at that point, not before.

---

## 2. QUALITY

### 2.1 Turn the type-checker back on — **the window is open right now**
`next.config.ts` sets `typescript.ignoreBuildErrors: true`, so `next build` does
**not** type-check. That was a reasonable escape hatch when the repo had 18 type
errors. It has **zero** today.

**Fix:** flip it to `false`. From that moment a type error cannot reach
production, and nobody has to remember to run `tsc` separately. This is only
possible because the repo is clean *now* — leave it and the errors creep back and
the window shuts.

### 2.2 There are no tests
Not one. The mastery scoring — the function that decides what a parent is told
about their child — was validated with a throwaway script that no longer exists.

**Fix, in priority order:**
1. `mastery.ts` — pure and dependency-free by design, so it needs no framework
   setup. Ten behavioural assertions already written once: demonstrated beats
   consumed, one observation ≠ confidence, invalid pulls down, decay floors at
   0.5. Restore them as a real test file.
2. `identity.ts` — the syllabus↔structured join. Already caught one live bug
   (Compass module 4). A regression here silently mis-attributes learning.
3. `content-tags.ts` validation — already runs in the seed generator; wire it into
   CI so a bad tag can't be committed.

No test runner is installed. `vitest` is the cheap choice for pure functions.

### 2.3 Lint is decorative
Most rules are off, including `no-unused-vars`. Nothing catches dead imports or
unreachable code.

**Fix:** turn on a *small* set that catches real bugs —
`no-unused-vars` (warn), `no-floating-promises`, `no-misused-promises`. Not a
style crusade; a style crusade in a live repo generates noise and gets muted.

### 2.4 Pin the release-candidate dependency
`prisma@8.0.0-rc.12` is in production dependencies after the mass upgrade. Your
data path is Supabase, not Prisma, so the blast radius is small — but an RC ORM
should not be in a payments app's lockfile.

**Fix:** pin to the latest stable Prisma, or remove it if nothing imports it.

### 2.5 Two lesson identity systems still coexist
`identity.ts` bridges them safely, and `content-units.lock.json` makes a reorder
show up as a reviewable diff. But the syllabus (`sariro-data.ts`, strings) and the
structured curriculum (ordinals) remain two sources of truth.

**Not urgent** — the bridge is tested and audited. Worth collapsing when the
curriculum next gets edited substantially.

---

## 3. FLOW

### 3.1 The homepage still sells the old product
`/explore` says "a map of everything you could become". The homepage still opens
as a course site. A visitor meets the old pitch first and the new one second.

**Blocked on decision D1** (wide "Learn anything" vs honest-narrow). Nothing else
in this document is blocked on it, but this is.

### 3.2 The loop closes, and it's verified
`/explore` → strand → "Start this" → sign-up (`?next=` is honoured all the way
through `sign-in-buttons.tsx` → `/auth/callback`) → back to the strand → goal
saved. Course pages link back to their strands. **No dead ends.**

### 3.3 What happens *after* a goal is recorded — the real gap
Today: a row lands in `learner_goals`, and nothing visible happens. No
confirmation email, no mentor notification, no admin queue. At 9 students you can
watch the table by hand, but the learner sees a green box and then silence.

**Fix, cheapest first:**
1. An admin view over the `strand_demand` view — already built, nothing renders it.
2. Notify staff when a goal is created (`notifications` table already exists).
3. Show the learner their own goals somewhere — the beginning of §16's learner
   profile.

### 3.4 The student dashboard still speaks the old language
`% course complete`, lesson counts. The vision says never make completion the
achievement. This is S4 and it needs mastery data, which needs evidence, which
starts accruing now.

---

## 4. UI — "2077", in a light theme

Dark was the wrong instinct and you called it: the site is light everywhere, so a
dark map reads as a different website, not a different world.

**The premise:** futuristic ≠ dark and glowing. In a light theme, "expensive"
comes from *precision* — spacing that's obviously deliberate, motion with real
physics, type with confident scale contrast. Vision §11 already says it: *"avoid
excessive gradients and flashy effects… it should still look excellent in five
years."* A neon UI ages in eighteen months.

### 4.1 Motion — the single biggest tell (nearly free)
Replace easing curves with **spring physics**. Cards should settle with weight,
not slide to a stop. framer-motion is already a dependency; this is changing
`transition` objects, not adding libraries.

### 4.2 View Transitions on map → strand
The card you click **becomes** the page header. One effect, enormous perceived
sophistication, natively supported, degrades silently where unsupported. This does
more for "2077" than any shader.

### 4.3 Light depth done properly
Layered whites, hairline borders, and a *single* soft accent glow per domain —
using the domain colours already in `explore-map.tsx`. Shadow as light, not as
grey. Glass (`glass-panel` already exists) used sparingly and never over text.

### 4.4 Typography with real hierarchy
Bigger jumps between levels, tighter tracking on headlines, generous line height
in body. Fonts are already trimmed to 7 weights — work within them, don't add.

### 4.5 Search that feels alive
Results reflowing with staggered spring; the "17 of 68" count morphing rather than
snapping. Currently correct but inert.

### 4.6 The gate
Anything heavier than the above goes behind the existing `use-heavy-visuals` hook
(non-touch, ≥1024px, no reduced-motion). Phones get the identical design minus the
GPU cost — the exact pattern that earned 38 → 76.

---

## 5. SECURITY — "hacker should cry"

### What is already genuinely good
Better than most production apps this size:
- **CSP, HSTS** (2 years, `includeSubDomains`, `preload`), `X-Frame-Options: DENY`
- **RLS on every new table**, read-your-own-only policies
- **Service-role route pattern**: CSRF → IP blocklist → rate limit → auth → role
  check *from the caller's own row* → validate → act
- **CSRF origin check verified working** — a cross-origin POST to
  `/api/learner/goals` returns `403 origin_mismatch`
- **Honeypot fields** on public POST routes
- **DB-level enforcement, not UI-level**: `enforce_name_lock`, and the
  append-only trigger on `learning_evidence` that blocks UPDATE and DELETE for
  everyone including admins

### 5.1 CSP allows `unsafe-inline` **and** `unsafe-eval` in `script-src`
This is the most serious finding. Together they defeat most of what a CSP is for:
an injected `<script>` or a successful XSS executes normally. The comment says
"Next.js eval in dev" — but the header ships to production.

**Fix:** nonce-based CSP. Generate a per-request nonce in middleware, stamp it on
Next's script tags, drop `unsafe-inline`/`unsafe-eval` in production. Non-trivial
with Turbopack, and worth it: it's the difference between a CSP that stops an
attack and one that documents an intention.

### 5.2 Rate limiting is in-memory and resets on restart
`src/lib/rate-limit/index.ts` keeps buckets, the blocklist and violation counters
in module-level `Map`s. Consequences:
- **every deploy or restart clears every block** — an attacker just waits, or
  triggers one
- it cannot work across more than one process or instance

**Fix:** move buckets and blocklist to Postgres (a table with a TTL index) or
Upstash Redis. Postgres is free here since Supabase is already the dependency.

### 5.3 `ignoreBuildErrors: true` is a security setting too
A type error is how a null slips into an auth check. See §2.1 — same fix, and it
is currently free to make.

### 5.4 `connect-src` allows `raw.githubusercontent.com`
Present so drei can load HDRI environment maps. It means a third-party host is
allowlisted for network access on every page.

**Fix:** vendor the HDRIs into `/public` and drop the entry. Also removes a
runtime dependency on GitHub being up.

### 5.5 No dependency auditing
A caret range on `lucide-react` silently broke the production build when v1
removed brand icons — and 40 packages were majorly upgraded in one uncommitted
change. There is no `npm audit` in any pipeline.

**Fix:** `npm audit` in CI; consider Dependabot. Pin anything load-bearing.

### 5.6 Service-role key hygiene
`SUPABASE_SERVICE_ROLE_KEY` is in `.env` (gitignored, correct). It bypasses RLS
entirely, so it must never reach a client bundle — currently it doesn't, since
only `src/lib/supabase/server.ts` reads it.

**Fix:** add a CI grep that fails the build if the key name appears in any file
under a `'use client'` directive. Cheap insurance against a future mistake.

---

## Recommended order

| # | Item | Effort | Impact |
|---|---|---|---|
| 1 | Cloudflare in front (§1.1) | infra, ~1 h | **largest speed win available** |
| 2 | `ignoreBuildErrors: false` (§2.1) | 5 min | window is open **now** |
| 3 | Rate limiting off in-memory (§5.2) | ~half day | real, exploitable today |
| 4 | Motion + view transitions (§4.1–4.2) | ~1 day | the "2077" feel, no perf cost |
| 5 | Tests for `mastery.ts` + `identity.ts` (§2.2) | ~half day | protects the moat |
| 6 | Nonce CSP (§5.1) | ~1 day | biggest hardening |
| 7 | Goal follow-through (§3.3) | ~half day | closes the loop for real learners |

Items 1 and 2 are today. Everything else is a normal week.
