# Sariro Stage 2 — Build Roadmap (How We Actually Build It)

> **This is the execution doc.** `SARIRO-VISION.md` = why. `STAGE-2-PLAN.md` = what.
> **This file = how, in what order, in which files.**
> Companion: `HANDOFF-CONTEXT.md` (current technical state).

---

## 1. What we are building toward

Not "a school with AI". Every one of those is copyable in a quarter — the content,
the UI, the mentor chatbot, the intent-first landing page.

The one asset a competitor cannot buy, scrape, clone or out-fund:

> **A longitudinal model of a specific human learner, fed by human mentors who see
> what no model can infer, that compounds in value the longer the learner stays.**

To copy two years of a child's evidence you must spend two years with that child.

Everything below exists to make that model **accumulate**, then make it
**visible** (parent trust), **actionable** (journeys) and **portable** (portfolio).

**The moment we are building toward — the north star for every slice:**

> A parent opens Sariro and reads a true paragraph about how their child thinks
> that no school has ever told them.

If a slice does not move us toward that moment, it is Stage 3.

---

## 2. Operating rules for the whole of Stage 2

Non-negotiable, inherited from how this codebase is already run:

1. **The running business never breaks.** Live batches, schedules, credits,
   teacher pay, attendance and reviews keep working through every slice.
   Build beside, migrate gradually, delete last.
2. **Additive schema only.** New tables, new columns. No destructive migration
   until a slice is proven in production.
3. **`npx tsc --noEmit` AND `npx next build` both exit 0** before any commit.
   `next build` does not type-check (`ignoreBuildErrors: true`).
4. **Cross-user writes go through service-role API routes**, never the browser
   client. Pattern: `assertSameOrigin` -> IP blocklist -> rate limit -> auth ->
   role check from caller's own profile row -> validate -> act.
   Reference: `src/app/api/admin/update-role/route.ts`.
5. **Migrations are hand-run.** Idempotent SQL in `scripts/*.sql`, run manually
   in Supabase by the founder. Every slice names its file.
6. **Nothing ships to users before S3.** S0-S2 are invisible foundation.
7. **Vocabulary is locked now** (cheap now, painful later):
   **Journey** (path) · **Milestone** (chunk) · **Capability** (skill) ·
   **Project** (artifact) · **Evidence** (a recorded observation).
   The word *course* survives only in URLs, DB columns and SEO copy.

---

## 3. Architecture — four layers

```
  L4  EXPERIENCE   intent entry · journey view · parent growth · portfolio · mentor console
        ^
  L3  REASONING    planner (goal + mastery -> next milestone) · mentor-in-the-loop review
        ^
  L2  LEARNER MODEL   capability mastery · evidence ledger · goals   <- THE MOAT
        ^
  L1  INVENTORY    content units (61 lessons) · projects · capability graph
```

Build strictly **bottom-up**. L3 built before L2 has nothing to reason over and
produces generic slop that makes the product feel *worse* than the fixed
curriculum we already have.

**The evidence ledger is the heart.** Mastery is not a number we set — it is a
number *derived* from an append-only log of observations. Append-only means we can
recompute the whole model when the scoring changes, replay history, and show a
parent *why* we believe something. A mutable `level` column can do none of that.

---

## 4. BLOCKER — solve before anything else: content identity

Recon finding. There are **two incompatible lesson identities in production**:

| | Source | Key | Used by |
|---|---|---|---|
| **Syllabus** | `src/lib/sariro-data.ts` — `modules[].lessons: string[]` | `module_num` **string** (`"02"`) + `lesson_name` **string** | `lesson_progress`, `session_attendance`, unlock logic |
| **Structured** | `src/lib/curriculum/*` — `StructuredLesson` | `courseId` + `moduleNum` **number** + `lessonIndex` **number** | the 5-tab lesson viewer |

`lesson_progress` rows are written from the **syllabus strings**
(`src/app/api/admin/schedule/manage/route.ts:94`,
`src/app/api/teacher/attendance/route.ts:311`), while the rich content is keyed by
**structured ordinals** (`src/lib/curriculum/index.ts` -> `getStructuredLesson`).

Consequence: **there is no reliable join between "what a student completed" and
"what that lesson taught."** Capability tagging and every backfill depend on that
join. Rename one syllabus lesson string and tags orphan silently.

### The fix (S0)

Introduce one canonical, immutable identifier:

```
content_unit_key = `${courseId}:${moduleNum}:${lessonIndex}`   e.g. web-101:2:4
```

- Add `unitKey` to `StructuredLesson` in `src/lib/curriculum/types.ts` — authored
  once, **never edited**, even if the title changes.
- Build `src/lib/curriculum/identity.ts`: resolves a syllabus
  `(course_id, module_num, lesson_name)` -> `unitKey`, by ordinal position within
  the module, with an explicit override map for mismatches.
- Ship `scripts/audit-content-identity.ts`: prints every syllabus lesson that
  fails to resolve. **This must reach zero unresolved before S1 starts.**

Do not skip this. Every later slice sits on this join.

### Status — identity layer BUILT, join is clean

`src/lib/curriculum/identity.ts` + `scripts/audit-content-identity.ts` are in.
Run: `npx tsx scripts/audit-content-identity.ts`

```
content units : 61      resolved : 61      blocking : 0
content gap   : 41      advisory : 31
```

**Two things the audit found on its first run:**

1. **A live bug, now fixed.** `agent-101` module 4 numbered its lessons
   `lessonIndex 1..6` while every other module is `0..5`. `flattenCourseLessons`
   emits 0-based indices, so in Compass module 4 a paying student saw *"This
   lesson has not been written yet"* on lesson 1, got the **wrong lesson content**
   for lessons 2-6 (all shifted by one), and could never reach
   *"Module 4 build — the reasoning agent"* at all. Fixed in
   `curriculum/compass/lesson-19..24.ts`.
2. **A content gap, not fixed — a business decision.** `web-201` (Orbit,
   Intermediate) advertises a **42-lesson** syllabus publicly and has **1 lesson
   authored**. The "61 lessons across 3 built courses" figure is real, but the
   distribution is 30 / 1 / 30. This does not block S1 — the identity layer is
   sound — but it is sold content that does not exist. See decision D5.

**31 advisory name drifts** are expected and harmless: the syllabus and the
authored lessons were written at different times (`"Landing page project"` vs
`"Module 1 build — the Momentum shell"`). They resolve correctly by position.

---

## 5. The slices

Each slice is independently shippable and independently revertible. Sizes are
rough engineering estimates, not commitments.

---

### S0 — Content identity + capability graph · invisible · ~1 week

**Goal:** one stable id per lesson, and a taxonomy to tag against.

Schema — `scripts/capability-graph.sql`:
```
capabilities        id · slug · name · domain · description · parent_id
                    · prerequisite_slugs[] · is_meta · created_at
content_units       unit_key (PK) · course_id · module_num · lesson_index
                    · title · kind (lesson|project) · active
content_capabilities  unit_key · capability_id · weight (0-1) · PK(unit_key, capability_id)
```

Code:
- `src/lib/curriculum/types.ts` — add `unitKey`
- `src/lib/curriculum/identity.ts` — syllabus <-> structured resolver (new)
- `src/lib/capabilities/taxonomy.ts` — taxonomy authored **in code**, seeded to DB
  by script, so it is reviewable in a diff (new)
- `scripts/audit-content-identity.ts`, `scripts/seed-capabilities.ts` (new)

**The map is the product. We are not writing curriculum.**

This was clarified after the first draft of this doc and it changes the shape of
S0. Sariro is not building dozens of courses — it is building the **outline of
everything a person can become capable of**, and letting each learner move
through it their own way. Every other platform pushes all learners down the same
pre-planned course; the map is the refusal to do that.

**KG → Advanced is not a level of the map.** Age is not a node. Every node
carries four **stages** instead, so a six-year-old and a thirty-five-year-old
enter the same node at different depths and neither is in the wrong place:

```
Number Sense
  foundation  counting, quantity, "5 is more than 3"
  developing  place value, operations, fractions
  proficient  ratio, proportion, negative numbers
  advanced    number theory, modular arithmetic
```

The map therefore never needs rebuilding as a learner grows — they move through
it, not out of it.

**Breadth before depth.** The promise is "learn anything"; a map that is deep
only on programming proves the opposite. So the spine is authored across every
domain first, and depth is added wherever real learners actually go.

**Content is optional scaffolding, not the product.** The 61 lessons attach to a
couple of dozen nodes. Most nodes will never have a lesson — because the delivery
system is the **mentor**, and Sariro already runs live classes, scheduling,
credits and teacher pay. "I want to learn fractions" is answered by a mentor
teaching it and the map recording what the learner became capable of, not by a
lesson someone must write first.

**Meta-capabilities are modelled first-class, not derived.** The tenth domain,
`learning-itself`, holds problem solving, critical thinking, independent
learning, creativity, focus, persistence, collaboration and metacognition. These
are what the vision promises, what parents are shown, and the only part of the
model that survives a learner changing field entirely.

**Exit test:** every one of the 61 lessons resolves to a `unit_key` and carries
at least one capability tag; zero unresolved syllabus lessons; taxonomy seeds
idempotently.

#### Status — spine BUILT

`src/lib/capabilities/taxonomy.ts` — **10 domains · 68 strands · 78 nodes.**

| Domain | Strands | | Domain | Strands |
|---|---|---|---|---|
| Mathematics | 7 | | Humanities | 7 |
| Science | 7 | | Arts | 6 |
| Technology | 7 | | Business & Economics | 7 |
| Engineering & Making | 6 | | Health & Body | 6 |
| Language & Communication | 7 | | **Learning Itself** *(meta)* | 8 |

Migrations to run in Supabase, in order:
1. `scripts/capability-graph.sql` — tables, indexes, RLS, shape constraint
2. `scripts/capability-seed.generated.sql` — the 78 nodes

Regenerate the seed after editing the taxonomy:
`npx tsx scripts/generate-capability-seed.ts`

**Slugs are permanent.** Learner evidence points at them; renaming one throws
away that person's history. Names and descriptions may change freely.

**Still open in S0:** tag the 61 lessons to strands (`content_capabilities`), and
author leaf capabilities with stages under the strands real journeys reach.

---

### S1 — Evidence ledger + mastery · invisible · ~1 week

**Goal:** the moat starts accumulating. Append-only, recomputable.

Schema — `scripts/learner-model.sql`:
```
learning_evidence   id · learner_id · capability_id · unit_key (nullable)
                    · source (project_review | attendance | quiz | mentor_note
                              | self_assessment | lesson_complete)
                    · source_ref · signal (-1..1) · weight · observed_at · recorded_by
                    APPEND-ONLY. Never updated, never deleted.

learner_capability_mastery   learner_id · capability_id · level (0-100)
                    · confidence (0-1) · evidence_count · last_evidence_at · computed_at
                    DERIVED. Fully rebuildable from learning_evidence.
```

Code:
- `src/lib/learner-model/evidence.ts` — one `recordEvidence()` entry point (new)
- `src/lib/learner-model/mastery.ts` — the scoring function, pure + unit-testable (new)
- `scripts/backfill-evidence.ts` — replay existing production data (new)

**Backfill sources (all verified to exist and be actively written today):**

| Table | Call sites | Becomes |
|---|---|---|
| `project_submissions` + `submission_feedback` | 13 + 8 | strongest signal — three-way review complete/partial/invalid -> +1.0 / +0.5 / 0 |
| `lesson_progress` | 12 | weak signal — exposure, not mastery |
| `session_attendance` | 9 | weak signal — participation |
| `student_leaderboard` | 4 | corroboration only |

**Scoring principle:** *demonstrated* beats *consumed*. A reviewed project outweighs
ten completed lessons. Confidence is a function of evidence count **and recency** —
a capability with one 8-month-old data point is low-confidence and must be shown
as such, never as a confident number.

**Exit test:** `scripts/backfill-evidence.ts` runs on production data and prints a
real mastery profile for a real named current student, and it is **recognisably
that student** to their teacher. If it isn't, the model is wrong — stop and fix
the model, not the code.

---

### S2 — The one-learner truth test · invisible · ~2 days · **GATE**

Not code. The cheapest way to find out whether the model is real.

1. Take one current student with real project reviews.
2. Generate their mastery profile from S1.
3. Hand-write the paragraph a parent would read.
4. Show it to their **teacher** first: *"is this true?"*
5. Then, if the teacher confirms, show the parent.

**Gate:** if the reaction is not *"you actually understand my child"*, **do not
proceed to S3.** Go back to the taxonomy and the scoring. No amount of engineering
fixes a wrong model, and every slice above this one inherits its errors.

---

### S3 — Parent growth view · **first user-visible slice** · ~1 week

Chosen as the first visible slice deliberately: it is the north-star moment, it
needs no AI, and the data exists the moment S1 lands.

- Replace lesson counts with capability growth deltas over a window
  (`Problem Solving +14%`) plus a mentor's qualitative observation.
- **Never AI-generated alone.** Anything a parent reads as a judgment of their
  child is mentor-written or mentor-approved. AI may draft; a human ships it.
- Mentor console: a low-friction "record an observation" control that writes
  `learning_evidence` with `source = mentor_note`. This is the input no
  competitor has — protect it with good UX, it is the moat's supply line.

Files: `src/app/dashboard/parents/*`, `src/lib/dashboard/teacher-data.ts`,
new `src/lib/learner-model/growth.ts`.

**Exit test:** a parent sees capability growth plus a true sentence about their
child's thinking, and zero lesson-completion counts.

---

### S4 — Learner profile + portfolio · ~1 week

Vision §16 assembled in one place — the artifact the whole product points at:
**About me · What I know · What I'm building · My growth · My journey.**

- `project_submissions` plus the three-way review already exist -> surface as a
  public, shareable portfolio. *"I built this"*, not *"I completed a course."*
- Student dashboard: **Your growth** (mastery) replaces `% course complete`.

Files: `src/app/dashboard/student/page.tsx`, `src/lib/dashboard/student-data.ts`,
new `src/app/profile/[handle]/page.tsx`.

**Exit test:** no surface in the student experience expresses progress as a
percentage of content consumed.

---

### S5 — Intent-first front door · ~1 week · **BLOCKED on decision D1**

- Landing hero -> philosophy, not a course grid.
- `/start` intent capture -> writes `learner_goals`.
- Existing `/courses/*` routes **stay live** — they are current organic traffic
  and direct enrolment. They become funnels into intent capture, not dead ends.
- Cold-start diagnostic: a light *"show me where you are"* that is **not an exam**
  — the vision explicitly rejects exam-feel. Without this, a brand-new learner has
  zero mastery and nothing to route on.

**Exit test:** a new visitor never sees a course grid before stating an intent,
and every legacy course URL still resolves.

---

### S6 — Journeys + planner · ~2 weeks · last, on purpose

Schema — `scripts/journeys.sql`: `learner_goals`, `journeys`, `milestones`.

Planner input: `goal + current mastery + capability prerequisites -> next milestone`.
Assembled from **already-tagged content units** — no new content required.

**AI autonomy tiers (hard rule):**
- *AI decides freely* — next step **within** a milestone (low stakes, high frequency)
- *AI proposes, mentor approves* — the journey itself (high stakes, low frequency)
- *AI never decides alone* — anything a parent reads as judgment of their child,
  and anything touching money, schedule or credits

Prefer **"next best step"** over generating a three-year plan on day one. A bad
generated path is worse than a good fixed one.

**Exit test:** two learners with different stated goals get genuinely different
paths, and a mentor can override any step.

---

### S7 — Maths, the first non-coding domain · after S6 proves the machine

Scoped by **journey demand, not curriculum completeness**: build only the maths
existing journeys actually route through — logic, functions, linear-algebra basics,
probability/stats. Adjacent to the AI/programming content that already exists.

Not competing with Khan on breadth or explanation quality. The point is that it is
*inside the journey, in the mastery profile, and known to the mentor.*
**Integration is the moat, not the content.** A learner mid-journey must never be
bounced off-platform — every hour learned elsewhere is a hole in the capability
graph, and holes break the model that everything else rests on.

---

## 6. Dependency order

```
S0 identity+graph -> S1 evidence+mastery -> S2 GATE -+-> S3 parent view
                                                     +-> S4 profile+portfolio
                                                     +-> S5 front door (needs D1) -> S6 journeys -> S7 maths
```

S3 and S4 are parallelisable after the S2 gate. S5 is blocked on a business
decision, not on engineering.

---

## 7. Do NOT touch

Hard-won, orthogonal to the pivot, and still required — a learner-first school
still needs live classes scheduled and teachers paid:

- Batch/cohort scheduling, reschedule + cancel engine, teacher conflict checks
- Credits (grant, deduct-on-complete via `class_consumed`, adjustments)
- Attendance gating, teacher earnings, late/no-show penalties, `start-class`
- Teacher training gates, course eligibility, admin/HR tooling
- Auth, roles, RLS, impersonation, security middleware
- The performance work (WebGL gating, code-splitting, service worker)

---

## 8. Decisions needed from the founder

Engineering is blocked on these, in this order:

| # | Decision | Blocks | Note |
|---|---|---|---|
| **D1** | **Public promise: wide ("Learn anything") or honest-narrow ("technology & AI, learner-first")?** | **S5** | `STAGE-2-PLAN.md` contradicts itself — §3 Phase 1 ships the wide hero, §5.1 and §6.1 both recommend narrow. Both cannot ship. |
| D2 | Pricing: per-course, or time/mentorship-based? | S5, S6 | Credits are already ~80% of a subscription. Per-course pricing structurally fights the vision. |
| D3 | Adult accounts: hide the parent surface? | S3 | Cheap conditional. A 35-year-old seeing "your parent can view your progress" churns instantly. |
| D4 | Is Community (vision §19 nav) in Stage 2 at all? | — | Currently in the vision's IA and in **no** phase of any plan. Needs to be scoped in or explicitly deferred. |
| **D5** | **`web-201` sells 42 lessons and has 1 written. Write the 41, or narrow the public syllabus?** | S7 | Found by the S0 audit. Not an engineering call. Whatever is chosen, the public syllabus and the authored content should agree. |

D1 is the only one blocking a slice that is otherwise ready to build.

---

## 8b. Dependency hygiene (found while running the S0 build gate)

`npx next build` was **failing on `main`** when S0 started, with no code change to
blame: `lucide-react` is pinned `^1.34.0`, and v1 **removed every brand icon**
(trademark reasons — they are not returning). `Twitter`, `Github`, `Linkedin`,
`Youtube` and `Facebook` disappeared from under the app.

Fixed by moving brand marks in-repo: `src/components/icons/brand-icons.tsx`.
Same call signature as a lucide icon, so `className="w-5 h-5"` still works, and
an upstream release can no longer delete them.

**Standing lesson:** a caret range on an icon set is a live dependency on someone
else's taste. Anything load-bearing and cosmetic belongs in the repo.

---

## 9. The test applied to every slice

> **Does this make the learner more capable, more curious, more independent, or
> more capable of learning?**

If a proposed feature only increases completion, screen time or catalog size, it
belongs to the old model. Cut it.
