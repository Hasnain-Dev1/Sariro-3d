# Sariro — Engineering Handoff / Context

> **Purpose:** paste-able context so a new chat (or a new engineer) can continue
> without losing what has been built. Companion docs: `SARIRO-VISION.md`,
> `STAGE-2-PLAN.md`, `STAGE-2-BUILD.md`, `PLATFORM-PLAN.md`,
> `IMPROVEMENT-PLAN.md`, `UI-2077-PLAN.md`.
>
> **→ `FOUNDER-TODO.md` is the short list of things only the founder can do** —
> accounts, dashboards and decisions, with the exact steps for each. Nothing on
> it is blocked on engineering.
> **Last updated:** 30 Aug 2026, at commit `b023da4` + the security pass (§17).

---

## 0. Start here — what to do next

The founder's five ordered instructions from the last session are **all done**:

1. ~~Backend first, then frontend.~~ — followed throughout.
2. ~~**Write the curriculum**~~ — **COMPLETE. 48/48 subject-grades, 2,208
   lessons across 384 modules.** See §7 for the shape and the rules.
3. ~~**Merge `/explore` and `/courses`**~~ — `/courses` is now the single browse
   page (decision D2). `/subjects` index 307-redirects to `/courses#learn`;
   `/subjects/[subject]` and `/subjects/focus/[topic]` are unchanged. Nav
   dropped 12 items → 10.
4. ~~**New homepage + course-page copy**~~ — the promise is now *"Big enough to
   teach anything. Small enough to know your name."* Homepage was restructured
   to lead with subjects (§12).
5. ~~**UI pass**~~ — the site read "all black and white" because `slate-*` is
   used 2,580 times and Tailwind's slate is a *cold* grey. The ramp is
   redefined warm in one `@theme` block in `globals.css` (§13).

Also fixed: **Public Speaking is now visible** — all seven focus courses render
on the merged `/courses` page.

### Next up, in recommended order

| # | What | Why |
|---|---|---|
| 1 | ~~Class reminder~~ | **BUILT — needs two things only you can do.** See §15. |
| 2 | **Cloudflare in front** | Measured: TTFB 0.59–1.2 s, of which ~320 ms is connection setup and ~630 ms is transferring a **444 KB** homepage. Hostinger already runs a CDN (`Server: hcdn`), so the speed case is smaller than it looked — the stronger case is **security**: free WAF and edge rate limiting (§17). See `FOUNDER-TODO.md` §2. |
| 3 | ~~Student-side conflict check~~ | **DONE** — `studentConflicts` / `cohortStudentConflicts` in `schedule-ops-server.ts`, wired into both `POST /api/admin/schedule` and `POST /api/schedule/reschedule`. Returns 409 `student_conflict` naming the learners. |
| 4 | ~~`/pricing` school prices~~ | **DONE** — `/pricing` rendered only the coding tiers, so a parent clicking Pricing for maths saw a bootcamp price list. `src/app/pricing/school-pricing.tsx` adds the per-class pricing and the three cadences, sourced from `school/pricing.ts` so it cannot drift from the subject pages. |
| 5 | ~~Surface `student_conflict` in the admin UI~~ | **DONE, and it was worse than expected.** `schedule-batch` and `manage-batches` read `json.error` (the machine slug) and never `json.message`, so admins had *always* seen "teacher_conflict" instead of the sentence explaining it. Both now prefer `message`. |

---

## 1. What this project is

**Sariro** — Next.js 16 (App Router, Turbopack) + React 19 + TypeScript +
Tailwind v4 + Supabase, deployed on **Hostinger** at **https://sariro.com**.

- Repo: `D:\DREAM\sariro-3d`, branch `main`.
- **Two push remotes on one `origin`** — a single `git push origin main` updates
  both `Mimo2k/sariro` and `Hasnain-Dev1/Sariro-3d`.

### Non-negotiable conventions
- **Never commit or push without being asked.** Permission is per-action; an
  earlier "push it" is not standing consent. Short commit messages.
- **`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` is now wanted** on
  AI-assisted commits — the founder asked for it on 30 Aug 2026, reversing the
  earlier "no trailer" rule. Ask if unsure; do not silently revert to the old one.
- **Batch the work, push once.** The founder does not want a push per change —
  finish a meaningful chunk, then a single `git push origin main`.
- **`npx tsc --noEmit` and `npx next build` must both exit 0** before any commit.
  `ignoreBuildErrors` is now **`false`**, so the build type-checks — keep it that
  way; it was only flippable because the repo hit zero errors.
- **Cross-user writes go through service-role API routes.** Pattern:
  `assertSameOrigin` → IP blocklist → rate limit → auth → role check from the
  caller's own profile row → validate → act. Reference:
  `src/app/api/admin/update-role/route.ts`.
- Migrations are hand-written idempotent SQL in `scripts/*.sql`, **run manually
  in Supabase by the founder**. Always name the file.
- Windows/Git Bash: long heredocs sometimes fail — prefer the Write tool for
  large files. Python one-liners must avoid unicode in `print()` (cp1252).

---

## 2. The product model (this is the important part)

Three product lines share one spine.

```
CAPABILITY MAP  (/explore)          the promise: what a person can become
  10 domains, 68 strands            authored in code, seeded to Postgres
        |
        +-- SCHOOL SUBJECTS  (/subjects)      grade-based, 48 classes/grade
        +-- FOCUS COURSES    (/subjects/focus) single topic, 48 classes
        +-- CODING TRACKS    (/courses)        Elementary 48 / Beginner 30 /
                                               Intermediate 42 / Advanced 96
```

**Why the map exists:** every competitor pushes learners down one pre-planned
course. Sariro sells a *direction*. Age is not a level — every strand has four
stages (foundation → advanced), so a ten-year-old and a forty-year-old enter the
same strand at different depths.

**Grade language is for selling; capability language is for thinking.** A seller
says "aapka bacha class 8 mein hai?" — the system records strands.

### Key files
| | |
|---|---|
| `src/lib/capabilities/taxonomy.ts` | the map: 10 domains, 68 strands, keywords |
| `src/lib/capabilities/content-tags.ts` | 61 lessons → strands, 143 tags |
| `src/lib/school/curriculum.ts` | grade groups, 6 subjects, 7 focus courses, test slots |
| `src/lib/school/pricing.ts` | $6.99 / $9.99 per class, 3 cadences |
| `src/lib/curriculum/identity.ts` | the syllabus ↔ structured-lesson join |
| `src/lib/learner-model/` | evidence ledger + mastery scoring |
| `scripts/audit-*.ts` | guards that fail on bad data |

---

## 3. Curriculum shape (needed for §7)

**Grade groups** (non-overlapping, exactly 3 grades each):
`1–3 foundation` · `4–6 primary` · `7–9 middle` · `10–12 senior`

**Subjects × groups** — deliberately not a full matrix. Physics/Chemistry/Biology
start at grade 7; before that school teaches combined Science.

| Subject | 1–3 | 4–6 | 7–9 | 10–12 |
|---|---|---|---|---|
| Mathematics | ✓ | ✓ | ✓ | ✓ |
| Science | ✓ | ✓ | — | — |
| Physics | — | — | ✓ | ✓ |
| Chemistry | — | — | ✓ | ✓ |
| Biology | — | — | ✓ | ✓ |
| English | ✓ | ✓ | ✓ | ✓ |

**Coding is NOT here** — it is track-based and lives in `sariro-data.ts`.

**Focus courses** (48 classes, not grade-bound): Organic Chemistry · Mechanics ·
Calculus · Algebra 1 · Algebra 2 · Trigonometry · **Public Speaking**.

**Slot shape — memorise this:**
```
48 slots per grade = 46 lessons + 2 tests
tests at slot 24 (Mid-year) and slot 48 (Final)
a grade group (3 grades) therefore carries 6 tests
```
A test occupies a class slot rather than being added on top — so the parent's 48
classes stay 48, and the scheduler, credits and attendance need no special case.

`AUTHORED_TITLES` in `curriculum.ts` is **full — 48/48 subject-grades**. Nothing
renders as "Lesson N" any more. See §7 for the authoring rules before editing it.

---

## 4. Pricing (settled — do not re-litigate)

Flat worldwide, USD. Regional pricing was built and deliberately reversed.

```
$6.99 per class   1:4 group      →  $27.99 / month
$9.99 per class   1:1            →  $39.99 / month
```

Bundle totals = per-class × count, **rounded DOWN to end in 9**. Always down.

Three cadences, discount off the monthly total:

| | 48 classes (1:4) | 144 classes (1:4) |
|---|---|---|
| Monthly (0%) | $27.99 × 12 = $335.88 | $27.99 × 36 = $1,007.64 |
| Every 3 months (5%) | **$79** × 4 = $316 | **$79** × 12 = $948 |
| Pay in full (15%) | **$279** | **$849** |

Savings are quoted against the **monthly total**, never an invented list price —
a parent can verify it with a calculator.

---

## 5. Payments — current state

- Razorpay keys are being added by the founder. `RAZORPAY_KEY_ID` and
  `RAZORPAY_WEBHOOK_SECRET` are set; **`RAZORPAY_KEY_SECRET` and
  `RAZORPAY_CURRENCY=USD` still need confirming.** Without both, checkout
  returns 503 by design.
- Webhook URL: `https://sariro.com/api/razorpay/webhook`, events
  `payment.captured` + `payment.failed`.
- `app_settings` price keys were `price.beginner` (dot) while the code reads
  `price_beginner` (underscore) — **fixed**, rows renamed. Values are USD
  (199/299/699). Elementary and all 1:1 tiers still fall back to code defaults.
- **A currency guard exists** (`src/lib/pricing/currency.ts`): if the charge
  currency does not match the display currency (USD), checkout is refused rather
  than mis-charging. It cannot catch rupee *values* in a dollar-priced field.
- `purchase_intents` now records `display_price`, `display_currency`,
  `charge_amount_minor`, `charge_currency`, plus a
  `purchase_intent_mismatches` view.

### ⚠️ Uncommitted work in the tree right now
The **enrol flow**, built but not pushed:
- `src/app/enroll/page.tsx` + `enroll-client.tsx` — checkout for school products
- `create-order` extended to price school products (`kind: 'school'`)
- `razorpay-checkout.tsx` gained an `orderBody` override
- Subject/focus CTAs repointed from `/contact` to `/enroll`

**Why it was needed:** there was previously *no way to charge a school price* —
`create-order` only understood coding tracks, and the static Razorpay links have
fixed $199/$299/$699 prices. The client never sends an amount; the server prices
it, so a tampered request cannot change the charge.

Verified: monthly shows "Due today $27.99 · 12 payments in total $335.88";
full shows "$849 · Save $158.64".

---

## 6. What was built in the last session

**Stage 2 / the map**
- 10 domains, 68 strands seeded; 61 lessons tagged (143 tags, 17 strands covered)
- `/explore` + `/explore/[strand]` — search by subject words and lesson titles
- "Start this" → `learner_goals`, works on all 68 strands
- Evidence ledger (append-only, DB-enforced) + mastery scoring, wired into
  `teacher/review` and `teacher/attendance`

**Dashboards — every role now answers its question above the fold**
| Role | Answer |
|---|---|
| Student | "What happens next" card + `/dashboard/student/next-class` |
| Teacher | Next Class card — batch code + roster |
| Admin | "Needs you today" queue |
| Super Admin | System health (4 checks, nothing shown at zero) |
| HR | "Waiting on you" |
| Seller | real toasts (was `console.log` — no feedback at all) |

**Notifications** — `src/lib/notify/` writes in-app + optional email through one
path. Bell is Realtime (was a 30s poll), with a chime and desktop pop-up
(`lib/dashboard/alerts.ts`). Wired to assignments, cancellations, demo requests.

**Bugs fixed that were live**
- Students could join a class a day early and sit in an empty Meet
- Teacher join window was 5 min vs student 15 — students would arrive first
- Compass module 4 was 1-based: wrong lesson content served, one unreachable
- `lucide-react` v1 dropped brand icons → production build was failing
- Map cards rendered at `opacity: 0`; search kept filtered-out cards on screen
- 76 permanently-composited GPU layers → 6 (`will-change` on hover only)
- Lenis smooth scroll ran on phones, hijacking native scroll

**UI system** — one gutter (`px-4 sm:px-6 lg:px-8`), two rhythms, one heading
scale, one `.card` class (3 sizes) sharing tokens with legacy `.card-3d`.

---

## 7. The curriculum — DONE, and the rules for editing it

`AUTHORED_TITLES` in `src/lib/school/curriculum.ts` is complete:

| Subject | Grades | | Subject | Grades |
|---|---|---|---|---|
| Mathematics | 12/12 | | Chemistry | 6/6 |
| Science | 6/6 | | Biology | 6/6 |
| Physics | 6/6 | | English | 12/12 |

**48/48 subject-grades · 2,208 lessons · 384 modules.**

### Three rules before you touch it

1. **Modules 4 and 8 carry FIVE lessons, not six.** `testPositions(48)` puts the
   assessments at slots 24 and 48 — the last slots of those modules — and
   `buildGradeSyllabus` overrides those titles. A sixth entry there is silently
   discarded. `6×6 + 2×5 = 46 lessons + 2 tests = 48 slots.`
2. **Names are board-neutral on purpose.** Sariro sells worldwide at one flat USD
   price. The maths/science topic spine is near-identical across NCERT,
   Cambridge, Common Core and the IB, but the *vocabulary* is not. "Mensuration",
   "practical geometry" and "comparing quantities" are South-Asian textbook
   words; elsewhere they read as a foreign curriculum. "Area, Surface Area and
   Volume" is recognised by everyone **including** the CBSE parent looking for
   their mensuration chapter — the translation only fails in one direction, so
   always pick the global name.
3. **Apostrophes are the typographic `’` (U+2019)**, not `'`. Correct on the page
   and escape-free inside the single-quoted strings. There are many: Newton’s,
   Gauss’s, Mendel’s, Bayes’, the author’s purpose.

### The audit is now a real guard

`npx tsx scripts/audit-school-curriculum.ts` fails on: a grade that is not
exactly 48 slots / 2 tests; a strand a subject claims that the map lacks; wrong
module count; **wrong lessons-per-module** (it knows modules 4 and 8 expect 5);
empty titles; duplicate lesson titles within a grade; and authoring a grade a
subject is not offered for. Run it after every edit.

### Focus courses are authored too — 7/7

Keyed **`${slug}:0`**. No key-scheme change was needed: `/subjects/focus/[topic]`
already called `buildGradeSyllabus(spec.slug, 0)`, so grade 0 was the existing
sentinel for "not grade-bound". Only the audit had to learn that a `:0` key is a
focus course to be checked against `SPECIALISATIONS` rather than a broken subject.

The focus page also gained the module outline it never had — it used to go
straight from the price to the capability strands, so a visitor deciding whether
to spend $279 on Organic Chemistry could not see one thing they would be taught.

**Grand total: 55/55 — 48 subject-grades + 7 focus courses. Nothing anywhere
renders "Lesson N".**

---

## 8. Open decisions (founder's, not engineering's)

| # | Decision | Status |
|---|---|---|
| **D1** | Public promise: wide vs honest-narrow | **Resolved by the product.** Multi-subject is now a fact, so the promise is honest-broad: it names the subjects rather than claiming "learn anything". |
| D2 | Merge `/explore` + `/courses`: which URL survives? | **Decided: `/courses`** — it held ~18 internal links and the organic traffic. |
| D3 | What to cut from each dashboard below the fold | Open |
| D4 | WhatsApp vs email for class reminders | Open — needs a Meta/Twilio account |
| D5 | `web-201` sells 42 lessons, has 1 written | Open — still the only sold-but-unwritten content |

### Also settled this session

**`HERO_STATS` and `TRUSTED_BY` are real, and are the founder's, not the
platform's.** 5,000+ students, 65 nationalities, 36 papers, 7 patents, and the
Microsoft/Google/Apple/IIT marquee are Mimo's record from *before* Sariro. They
were being rendered unattributed in three places, which read as Sariro's own
results next to a nine-student business. All three now say so explicitly
(hero, `stats-3d.tsx`, `/story`). **Do not delete them as fake, and do not
un-attribute them.**

---

## 9. Known gaps

- **No class reminder** ("your class is in 30 minutes"). Highest-value thing not
  built. Needs a scheduled job — `pg_cron` or a Hostinger cron hitting a route.
  Nothing in the product currently runs on a timer.
- **No student-side scheduling conflict check.** Only `teacherHasConflict`
  exists. A learner in maths + physics + coding can be double-booked.
- **Rate limiting is in-memory** (`src/lib/rate-limit/index.ts`) — every deploy
  clears every block.
- **CSP allows `unsafe-inline` and `unsafe-eval`** in `script-src`, which defeats
  most of its purpose. Nonce-based CSP is the fix.
- **TTFB ≈ 946 ms** on Hostinger — Cloudflare in front is the single biggest
  speed win available. Bypass `/dashboard/*` and `/api/*`.
- **Tests exist now — 43 of them.** `npm test`. See §16. `mastery.ts` and
  `identity.ts` are still uncovered and are the next two worth doing.
- Nav is 12 items. Merging Explore/Courses (§0.3) helps.
- **Prisma is unused scaffolding.** `src/lib/db.ts` exports a `PrismaClient` that
  **nothing imports** — the app is Supabase throughout. `prisma/schema.prisma`
  still carries `User` and `Post` models from a Next.js starter alongside the
  real ones.
  The RC has been dealt with: the CLI was `^8.0.0-rc.12` while the client was
  `^7.10.0` — a release candidate *and* a major-version mismatch. Pinned to
  `^7.10.0` to match the client, which removed 353 packages.
  **Still open, and a founder call:** delete Prisma entirely, or keep the schema
  as documentation of the DB shape? It is dead weight either way, but the schema
  does partly describe real tables.

---

## 10. Migrations already run in Supabase

`capability-graph` · `capability-seed.generated` · `content-tags.generated` ·
`learner-model` · `learner-goals` · `purchase-intent-currency` ·
`complimentary-classes` — plus everything from earlier sessions.

**None outstanding.**

---

## 11. Env vars

Set: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, 4 ×
`HOSTINGER_MAIL_*`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_KEY_ID`.

Needed: **`RAZORPAY_KEY_SECRET`**, **`RAZORPAY_CURRENCY=USD`**,
**`CRON_SECRET`** (new — class reminders send nothing without it, see §15).
Optional: `NEXT_PUBLIC_SITE_URL`, `DEMO_CLASS_NOTIFY_EMAIL`, `ERROR_WEBHOOK_URL`.

Production values live in **Hostinger's env config**; local `.env` does nothing
for sariro.com.

> ⚠️ **`.env.example` is NOT in the repository.** `.gitignore` ignores `.env*`
> and then names `.env.example` explicitly again at line 37, so the file exists
> on the founder's machine and nowhere else — a new engineer cloning this repo
> gets no env template at all, which is why this section has to carry the list.
> `.env.example` holds no secrets by definition, so committing it is the normal
> convention and would fix this; that is a repo-policy call, not an engineering
> one, so it has been left alone. **If you un-ignore it, delete this warning.**

---

## 12. The homepage, restructured

It used to run eleven sections without once naming a subject — a parent could
read the whole page and never learn we teach maths. It opened with audience
tracks, the capability map, a WebGL AI core and a coding catalogue, all of which
answer questions asked *after* "do you teach what my child needs?" The closing
CTA said *"Stop watching AI happen. Start building it."*

New order follows a visitor's actual questions:

```
hero -> WHAT WE TEACH (new)  -> HOW IT WORKS (new) -> who is teaching
     -> who it is for -> the map -> proof -> price -> book a free class
```

- `src/components/home/subject-strip.tsx` (new) — all seven subjects, one click
  from the hero. Every card is a real destination, not a scroll anchor.
- `src/components/home/how-it-works.tsx` (new) — the mechanics, which existed
  nowhere on the site: book free -> tell us subject and grade -> we fit a batch
  to your timings -> one class a week, four to a room.
- **`Courses3D` was removed, not reordered.** It rendered a coding-only grid that
  `/courses` now owns and sells beside every other subject.

## 13. The warm palette — read before changing a colour

The site read "all black and white". The cause was **not** missing accent colour
— blue, green, amber, violet and cyan were all already there. It was that
`slate-*` is used **2,580 times** and Tailwind's slate is a *cold* grey with a
cyan cast. No amount of accent on top fixes the ground it sits on.

So the ramp itself is redefined in one `@theme` block in `src/app/globals.css`.
Every `text-slate-600`, `bg-slate-50` and `border-slate-200` already written —
and every one written from now on — is warm. **Reverting is deleting that block.**

- Lightness steps match Tailwind's originals, so hierarchy survives.
- Contrast was verified before landing: **zero WCAG threshold regressions**, and
  8 of 10 tested text/background pairs came out slightly *higher* contrast
  (`slate-500` on white: 4.76 → 4.91).
- The cost: the name "slate" now lies. Treat `slate-*` as "our neutral".
- Shadows, `--brand-deep`, the `.dark` block, the hero mesh and 61 hardcoded cold
  hexes across 22 component files were warmed to match — a cold shadow under a
  warm card is the tell that makes a warmed palette still feel synthetic.

## 14. Known behaviour worth not re-discovering

- **The Browser pane cannot screenshot scrolled positions on this site.** Heavy
  WebGL + parallax + sticky sections defeat its compositor; captures come back
  white while `elementFromPoint` shows real content at `opacity: 1`. Verify with
  `read_page` / `get_page_text` / computed styles instead. The first capture
  after each `navigate` does work.
- **`WelcomePopup` used to block every page every 6 seconds** for logged-out
  visitors, and neither X nor "Maybe later" wrote anything — only converting
  stopped it. It now writes `sessionStorage` and asks once per visit.
- The **cookie banner is fine** (`z-[45]` bottom bar, persists to localStorage +
  a 365-day cookie). It is not the thing that was covering the page.

## 15. Class reminders — BUILT, but not yet live

The first thing in this product that runs on a timer. Code is in; **two steps
are outstanding and both are yours.**

### Step 1 — run the migration
`scripts/class-reminders.sql` in Supabase → SQL Editor. Idempotent. It adds
`bookings.reminder_sent_at` plus a partial index. Until this runs, the route
returns `column bookings.reminder_sent_at does not exist` (verified).

### Step 2 — set `CRON_SECRET` and schedule it
Generate: `openssl rand -hex 32`, set it in Hostinger's env config, then a cron
every ~10 minutes:

```
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://sariro.com/api/cron/class-reminders
```

**The route fails closed.** With `CRON_SECRET` unset it returns 401 and sends
nothing — an unauthenticated endpoint that writes notifications to arbitrary
users is a spam vector, and a reminder at 3am costs more trust than a missed
class. Verified: no secret → 401 "route is disabled"; wrong secret → 401 "bad
secret"; correct secret → reaches the database.

### How it cannot double-send
It **claims** each booking by stamping `reminder_sent_at` before sending, and
only claims rows where it is still null. That update is the lock — two
overlapping cron runs cannot both claim the same row. Claiming happens *before*
the notification, which is the safe direction to fail: a claimed-but-undelivered
reminder is one missed message; delivered-but-unclaimed is the same message
every ten minutes.

### Knobs
| Param | Default | Notes |
|---|---|---|
| `windowMin` | 35 | Only needs to exceed the cron interval. Too small silently drops classes; too large just reminds slightly early. |
| `email` | off | **Decision D4 (WhatsApp vs email) is still open**, so this ships in-app only. `?email=1` when you decide. |
| `dryRun` | off | `?dryRun=1` lists what would be reminded without sending or claiming. Use this first in production. |

Students **and** the teacher are reminded — a teacher who forgets costs more,
because the whole batch sits in an empty room.

## 16. Tests — the first ones in the repository

```bash
npm test                 # 43 tests, ~2s, no database, no network
npm run audit:curriculum # the content guard, unchanged
```

Node's **built-in** test runner via `tsx`. No Vitest, no Jest, no config file —
this repo has already been bitten once by a dependency it did not control
(§8b, `lucide-react` deleting every brand icon), so the test stack adds exactly
one devDependency and nothing at runtime.

**`tsx` is now a declared devDependency.** It was not before, which meant every
`npx tsx scripts/audit-*.ts` — the gate this doc calls required — silently
fetched an unpinned version from the registry at run time, and did not work
offline at all.

### What is covered, and why these first

| File | Why |
|---|---|
| `school/pricing.test.ts` (21) | It decides what real people are charged. Everything else that breaks is embarrassing; this is the only module where a bug takes money from someone. |
| `school/curriculum.test.ts` (22) | The shape the scheduler, credits and attendance all assume. A parent buys 48 classes and must receive exactly 48 slots. |

The interesting assertions are the **properties**, not the fixed numbers:
rounding never goes up (except the one documented 3¢ case), more commitment
never costs more, a quoted saving always equals monthly-minus-lifetime, slot
numbers run 1..48 with no gaps, and an authored title can never overwrite an
assessment slot.

**The suite was verified to actually fail.** Changing `PRICE_PER_CLASS_GROUP`
from 6.99 to 7.99 broke 5 tests; the file was then restored from git. A test
suite nobody has watched fail is decoration.

### One thing the tests found
`4 × $6.99 = $27.96`, but the advertised monthly is `$27.99`. That is
**deliberate and documented** in `pricing.ts` — "a price ending in .96 looks
like a mistake, which costs more than three cents". The test now pins the
exception rather than asserting the naive multiple, so it cannot quietly grow
into a general licence to round customers up.

## 17. Security — what was audited, found and fixed (30 Aug 2026)

### FIXED — the CSP never reached a browser

Measured against the live site, not assumed:

```
local dev   →  Content-Security-Policy: default-src 'self'; script-src 'self' …
sariro.com  →  Content-Security-Policy: upgrade-insecure-requests
```

Hostinger's CDN (`Server: hcdn`) **replaces** that one header. Every other
security header from `next.config.ts` arrives intact — `X-Frame-Options`,
`nosniff`, `Referrer-Policy`, HSTS, `Permissions-Policy` — so this is a targeted
override of the CSP, not a general strip. The allowlist was written, reviewed,
and discarded at the edge.

**Fix:** the same policy is now also a `<meta http-equiv>` tag in the root
layout. It lives in the document body, so a CDN cannot rewrite it without
rewriting the HTML. Both are kept — if the override is ever removed the header
takes over and nothing changes. One source of truth in `src/lib/security/csp.ts`.

Verified before enforcing: zero CSP violations across `/`, `/courses`,
`/pricing`, `/subjects/[subject]`, `/about`; those pages reference **no external
origins at all** (fonts self-hosted via `next/font`).

**Worth asking Hostinger** whether that CSP override can be disabled. If it can,
the header is the better mechanism and the meta tag becomes belt-and-braces.

### FIXED — a scaffold route was live in production
`GET https://sariro.com/api` returned `{"message":"Hello, world!"}` — a Next.js
starter leftover. Harmless, but it is a public endpoint that signals an
unmaintained surface. Deleted.

### CHECKED — clean

| Check | Result |
|---|---|
| Service-role key in any client component | none — all 8 references are server-only |
| Service-role key in the built client bundle | **not present in `.next/static`** |
| API routes without an auth/permission gate | none. `lessons/content` and `lessons/list` return 401/403 via `resolveViewerProgress`; `exit-impersonation` is gated on the `sariro_impersonator` cookie and is idempotent by design |

### STILL OPEN — `unsafe-inline` / `unsafe-eval`
Both remain in `script-src`. They genuinely weaken the policy, but the step that
mattered was going from *no enforced policy* to *an enforced one* — a policy with
`unsafe-inline` still blocks every unlisted origin, which is what stops an
injected script exfiltrating anywhere. Nonce-based CSP with Next.js,
framer-motion and inline styles is a change that can break the whole site and
deserves its own session.

### STILL OPEN — rate limiting is per-instance
`src/lib/rate-limit/` is in-memory, so a deploy clears every block. Note what is
and is not worth persisting: a **60-second sliding window** is meaningless across
a restart; the **IP blocklist** is a durable judgment and is the only part worth
storing.

**Cloudflare's free tier solves this better than code can** — edge rate limiting
and WAF reject abuse before it ever reaches Hostinger, and survive deploys by
definition. That is the stronger argument for Cloudflare than speed (see
`FOUNDER-TODO.md` §2), because Hostinger already runs a CDN.
