# Sariro — Platform Plan: Flow, Scale, and a Premium Feel

> Written from the **buyer's** point of view, not the builder's.
> Companion: `STAGE-2-BUILD.md` (the map), `IMPROVEMENT-PLAN.md` (speed/security),
> `UI-2077-PLAN.md` (the look).

---

## 0. The premise

Premium is not decoration. Premium is **the next action being obvious, and the
system being right.** Two things break that today, and neither is cosmetic:

- A student can press **Join Class** for a class that is tomorrow.
- An admin list of 250,000 batches does not get slow. It gets **wrong**.

Everything below serves one sentence: *every role opens their dashboard and knows
what to do in under three seconds, whether the system holds 9 students or a
million.*

---

## 1. Assumptions (overrule any of these)

Three questions are unanswered; work proceeds on these assumptions rather than
waiting.

| # | Assumption | Why |
|---|---|---|
| A1 | **1:1 paths are AI-proposed, mentor-approved** | Matches the autonomy tiers already agreed in `STAGE-2-PLAN` §6.4 — AI never decides a child's education alone. |
| A2 | **One student dashboard, radically simpler for everyone** | A six-year-old and a busy adult want the same thing: one obvious next action. Two surfaces doubles the work and halves the polish. |
| A3 | **Assignment notifications are in-app first** | The `notifications` table already exists and is written by the enrol and payment flows. Email/WhatsApp later. |

---

## 2. The 1:1 / 1:4 split — the product decision that unlocks the rest

The founder's proposal, and it resolves a genuine contradiction: personalisation
does not scale, and pre-made content does not differentiate.

| | **1:4 batch** | **1:1** |
|---|---|---|
| Content | fixed pre-made course | path assembled from the capability map |
| Schedule | fixed cohort | learner-shaped |
| Economics | scales linearly, high margin | scarce mentor time, premium price |
| Sold on | price and proof | "we build your path" |
| Moat | none — and that is fine | the learner model + a human |

**Both ride the same spine.** A 1:4 batch travels *one fixed line* through the
map; a 1:1 gets a *route drawn per person*. The map already models this — the
line is a subset of the graph.

`ratio: '1:4' | '1:1'` already exists in `course-path/[id]/page.tsx`, but only as
a pricing toggle. It becomes a **product boundary**: it decides whether a learner
gets a fixed sequence or a mentor-shaped route.

**The risk to price around:** 1:1 mentor hours are the scarce resource. If 1:1
becomes the aspirational tier, demand outruns mentors and either quality drops or
waitlists appear. Solve with price and cohort caps *before* marketing pushes it —
not with code.

---

## 3. Where the buyer's journey actually breaks

Each item below was verified in the code, not assumed.

### 3.1 Student — "Join Class" is a trap
`disabled={joining || !hasCredits || joined}`
(`src/app/dashboard/student/page.tsx:589`) — there is **no time condition at
all**, and `/api/student/join-class` says so in its own comment: *"student is
free to join a class whenever they like."*

A child with a class tomorrow at 17:30 presses Join today, sits in an empty Meet,
and concludes nobody came. **This is the single most expensive bug in the
product** — it destroys trust at the exact moment a new customer is deciding.

**Fix:** Join always leads somewhere useful. If the class is not imminent, it
opens a **"Your next class"** page: the date, the time in the learner's own
timezone, a live countdown, the teacher's name, and what the lesson is. The Meet
link appears only inside the join window.

### 3.2 Student — the dashboard is too complex to be a first experience
1,178 lines of dashboard. A six-year-old's first session should not begin with
navigation.

**Fix:** one hero card that answers *what happens next*, and everything else
below the fold or behind a link. If the learner has to choose, the page has
already failed.

### 3.3 Teacher — does not know what is next
`fetchTeacherBookings('upcoming')` returns a list; the dashboard is 1,797 lines
around it. The teacher's actual question — *what is my next class, with whom, and
which batch* — has no dedicated answer.

**Fix:** the top of the teacher dashboard is a single **Next Class** card: time,
countdown, batch code, student names, lesson title, and one button. Everything
else is secondary.

### 3.4 Admin — assigned in silence, then asked to find a needle
Two separate failures:

- **Nobody tells them.** Assignment writes no notification, though the
  `notifications` table exists and is already used by `admin/enroll` and the
  Razorpay flows.
- **They cannot find the batch.** With 250 batches on the same course, the
  scheduling UI offers no batch code, no search, no filter.

**Fix:** notify on assignment; make batch code the primary identifier everywhere
a batch appears; add search and filters to every list.

### 3.5 Admin lists silently lie — the real scale bug
`.limit(200)` and `.limit(2000)` with no `.range()`, no cursor, no total count
(`src/lib/dashboard/admin-data.ts:789`, `:1176`).

This is worse than slow. Past the cap, rows simply are not there, and **the admin
has no way to know.** A support agent tells a paying parent "you have no
bookings" because row 2,001 was never fetched.

**Fix:** cursor pagination, server-side search, and a visible total. Never a bare
`.limit()` on a list a human reads.

### 3.6 Seller — acts into the void
`src/app/dashboard/seller/page.tsx` is 43 lines that embed the admin's
`SellerLeads` component, and its toast handler is `console.log`. A seller updates
a lead and **receives no feedback whatsoever**.

**Fix:** real toasts (`sonner` is already a dependency), then a seller-shaped
screen: my leads, what is overdue, what closed today.

### 3.7 HR — a smaller version of the same problem
588 lines, no clear "what needs me today".

**Fix:** a queue, not a catalogue. Open items first.

### 3.8 Super Admin — can create, cannot see
1,698 lines weighted toward creation. The role's actual job is **oversight**:
which batches exist, which are unassigned, which teachers are overloaded, which
classes were missed.

**Fix:** a system-health view first: unassigned batches, classes without
attendance, teachers over capacity, credits about to run out.

---

## 4. The one-screen principle

Every dashboard obeys the same rule:

> **Above the fold answers "what do I do right now". Everything else is one click
> away, never two.**

| Role | Their one question |
|---|---|
| Student | When is my next class, and am I ready? |
| Teacher | What is my next class, with whom, and what do I teach? |
| Admin | What is waiting on me today? |
| Super Admin | What is broken or unattended in the system? |
| HR | Who needs a decision from me? |
| Seller | Which lead is going cold? |

Current dashboards total ~7,500 lines across six roles. The goal is not to add —
it is to **subtract until the first screen answers one question.**

---

## 5. Scale: a ceiling, not a build target

250k batches is a **capability ceiling**, confirmed as hypothetical. That makes
the posture cheap and specific:

> **Build so nothing forbids 250k. Do not build the 250k machine.**

At nine students, building the machine is how a startup dies before arriving.
Four rules cover it:

1. **No unbounded or silently-capped list queries.** Cursor pagination + explicit
   total. A truncated list must announce that it is truncated.
2. **Search happens in Postgres, not in JavaScript.** No `.filter()` over a
   fetched array on any list that can grow.
3. **Every foreign key and every filtered column is indexed.** `bookings`,
   `enrollments`, `cohorts` first — they carry the volume.
4. **Every list has a stable identifier a human can say out loud.** Batch code,
   not a UUID. This is what makes 250 identical-course batches navigable, and it
   is a *design* fix, not an infrastructure one.

Follow these and 250k is a hosting question later, not a rewrite.

---

## 6. Phases

### Phase A — stop losing customers (days)
The bugs that cost money **today**, at nine students.
1. **Next-class page + join window** (§3.1)
2. **Teacher's Next Class card** (§3.3)
3. **Notify admin on assignment** (§3.4)
4. **Seller toasts** (§3.6) — 20 minutes, removes an invisible-failure surface

*Exit test:* no role can take an action and be left unsure whether it worked, and
no student can join a class that is not happening.

### Phase B — one screen per role
Rebuild the top of each dashboard around its one question (§4). Subtract, don't
add.

*Exit test:* a new user of each role knows what to do without being told.

### Phase C — lists that tell the truth
Cursor pagination, server-side search, batch codes everywhere, indexes.

*Exit test:* seed 250k rows in a scratch project; every list stays usable and no
list lies about what it contains.

### Phase D — the 1:1 / 1:4 split
Product boundary, path assembly for 1:1, fixed sequence for 1:4.

*Exit test:* two learners on the same course, one 1:1 and one 1:4, get genuinely
different experiences.

---

## 7. Ordering, and the honest argument for it

Phase A is worth more than Phase C **today** and less than Phase C **in a year**.

At nine students, a broken Join button costs real customers this week; a list cap
of 2,000 costs nothing. But every week Phase C is deferred, more code is written
against patterns that break at scale — so C is *designed for* in Phase A (rule 4
above: batch codes, no bare limits in new code) and *implemented* after B.

Do not reverse this. Building pagination for 250k batches while the Join button
loses the nine customers you have is the most common way ambitious products die.
