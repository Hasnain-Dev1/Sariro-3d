# Sariro — Engineering Handoff / Context

> **Purpose:** paste-able context so a new chat (or a new engineer) can continue
> without losing what has been built. Companion docs: `SARIRO-VISION.md`,
> `STAGE-2-PLAN.md`, `STAGE-2-BUILD.md`, `PLATFORM-PLAN.md`,
> `IMPROVEMENT-PLAN.md`, `UI-2077-PLAN.md`.
> **Last updated:** 30 Aug 2026, at commit `74590f8` + uncommitted enrol flow.

---

## 0. Start here — what to do next

The founder's most recent instructions, in their words, ordered:

1. **Backend first, then frontend.**
2. **Write the curriculum** — a real course outline for every subject, every
   grade (this is the big one; see §7).
3. **Merge `/explore` and `/courses` into ONE page.** A visitor should pick
   coding, maths, science, physics, chemistry from a single place. Clicking
   coding opens the existing coding-course look.
4. **New homepage + course-page copy.** The old taglines sell coding; the
   product is now multi-subject. Needs catchy lines that carry that.
5. **UI pass** — currently reads as cluttered and "all black and white". Make it
   friendlier and easier for a newcomer to parse.

Two smaller things noted from a live screenshot:
- Copy fixed already: "we'll find a batch that fits your timings **before you
  pay anything**" → "**Once you enrol**, we'll find a batch that fits your
  timings."
- **Public Speaking looked missing.** It is not — it exists and renders on
  `/subjects`. But `/subjects/[subject]` only cross-links the five *grade*
  subjects, so focus courses are invisible from a subject page. Worth fixing.

---

## 1. What this project is

**Sariro** — Next.js 16 (App Router, Turbopack) + React 19 + TypeScript +
Tailwind v4 + Supabase, deployed on **Hostinger** at **https://sariro.com**.

- Repo: `D:\DREAM\sariro-3d`, branch `main`.
- **Two push remotes on one `origin`** — a single `git push origin main` updates
  both `Mimo2k/sariro` and `Hasnain-Dev1/Sariro-3d`.

### Non-negotiable conventions
- **Never commit or push without being asked.** Permission is per-action; an
  earlier "push it" is not standing consent. Short commit messages, and
  **no `Co-Authored-By` trailer**.
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

`AUTHORED_TITLES` in `curriculum.ts` is **empty**. Everything renders as
"Lesson N" / "Module N". **Filling it is task §7.**

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

## 7. THE BIG TASK — write the curriculum

Fill `AUTHORED_TITLES` in `src/lib/school/curriculum.ts`:

```ts
AUTHORED_TITLES['mathematics:8'] = {
  modules: [
    { title: 'Number & Place Value', lessons: ['...', '...', ...] },
    // 8 modules × 6 lessons = 48 slots
  ],
};
```

**Scale:** 6 subjects × their grades + 7 focus courses ≈ **2,592 slots**, of
which 46 per grade are real lessons.

**Rules:**
- Slots 24 and 48 are tests — the builder overrides those titles automatically,
  so authored lesson titles at those positions are ignored.
- Module titles should match what a school board actually covers for that grade.
- Run `npx tsx scripts/audit-school-curriculum.ts` after — it fails if any grade
  is not exactly 48 slots / 2 tests, or if a subject claims a strand the map
  does not have.

**Suggested order:** Mathematics 6–10 first (most demand), then Physics and
Chemistry 9–12 (entrance-exam pressure), then English, then the rest.

---

## 8. Open decisions (founder's, not engineering's)

| # | Decision | Blocks |
|---|---|---|
| **D1** | Public promise: wide "learn anything" vs honest-narrow | homepage copy (§0.4) |
| D2 | Merge `/explore` + `/courses`: which URL survives? | §0.3 |
| D3 | What to cut from each dashboard below the fold | Phase B completion |
| D4 | WhatsApp vs email for class reminders | needs a Meta/Twilio account |
| D5 | `web-201` sells 42 lessons, has 1 written | content or copy |

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
- **No tests at all.** `mastery.ts` and `identity.ts` deserve them first.
- Nav is 12 items. Merging Explore/Courses (§0.3) helps.
- `prisma@8.0.0-rc.12` is in dependencies — a release candidate.

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

Needed: **`RAZORPAY_KEY_SECRET`**, **`RAZORPAY_CURRENCY=USD`**.
Optional: `NEXT_PUBLIC_SITE_URL`, `DEMO_CLASS_NOTIFY_EMAIL`.

See `.env.example` — it documents every variable and what breaks without it.
Production values live in **Hostinger's env config**; local `.env` does nothing
for sariro.com.
