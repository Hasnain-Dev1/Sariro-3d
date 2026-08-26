# Sariro Stage 2 — From Course Platform → Learning System

> **Plan only. Nothing here is built yet.**
> Companion docs: `SARIRO-VISION.md` (the philosophy), `HANDOFF-CONTEXT.md`
> (current technical state).

---

## 0. The question that started this: "Do we remove the curriculum?"

**No. Removing it would be a serious mistake — and it isn't what the vision asks for.**

Reasons:

1. **It's the only currently monetisable asset.** 61 lesson files across 3 built
   courses, with live paying students, live batches, scheduled classes, teachers
   being paid, and credits in circulation. Deleting it deletes the business.
2. **The vision does not say "no content."** It says the *learner*, not the
   *catalog*, is the entry point. The vision's own examples ("aerospace engineer →
   maths, physics, programming, projects…") describe assembling content per
   learner. That still requires content to assemble.
3. **A journey with nothing underneath it is a demo.** "Personalised learning"
   with an empty library is a chatbot, not a school.

### What actually changes

The curriculum stops being **the product** and becomes **the inventory**.

```
BEFORE (course-centric)
  Learner → browses catalog → enrols in Course → completes Modules → "73% complete"
  The atom is the COURSE.

AFTER (learner-centric)
  Learner states a GOAL
      ↓  AI planner + mentor
  JOURNEY (personal sequence of milestones)
      ↓  each milestone targets
  CAPABILITIES (skills / concepts)
      ↓  evidenced by
  CONTENT UNITS  ← the existing lessons/projects live HERE
  The atom is the CAPABILITY.
```

**One-line summary of Stage 2:** *don't delete anything — build a new layer above
the curriculum, and change the front door.*

---

## 1. The three things that make it stop feeling like an ed-tech platform

If only three things ship, ship these. They flip the product's identity using
content that already exists.

1. **Intent-first entry.** The front door asks *"What do you want to learn / become?"*
   instead of showing a course grid.
2. **A capability + mastery model.** Progress is expressed as *what you can do*
   ("Problem Solving — 81%"), never as *% of a course consumed*.
3. **One real personalised journey.** A generated, mentor-adjustable path made of
   existing lessons — proving the machine works before scaling content.

Everything else is elaboration.

---

## 2. Data model — the new spine

The single most important new structure is the **capability graph**. Without it,
no personalisation, no mastery, no recommendations are possible.

### 2.1 `capabilities`
A taxonomy of skills/concepts, domain-agnostic from day one.
```
id · slug · name · domain (maths | programming | science | business | communication | meta)
· description · parent_id (hierarchy) · prerequisite_ids[]
```
Examples: `algebraic-reasoning`, `loops-and-iteration`, `systems-thinking`,
`technical-communication`, `independent-learning`.

> **Meta-capabilities matter most.** Problem solving, critical thinking,
> independent learning, creativity, communication — these are what the vision
> actually promises and what parents are shown. Model them explicitly.

### 2.2 `content_capabilities` (join)
Maps every existing lesson/project → the capabilities it develops.
```
content_ref (course_id + module_num + lesson_name)  ·  capability_id  ·  weight
```
This is the migration that makes 61 existing lessons usable by the new system.
**No lesson content needs rewriting** — only tagging.

### 2.3 `learner_capability_mastery`
Replaces "% complete" as the source of truth for progress.
```
learner_id · capability_id · level (0–100) · confidence · last_evidence_at · evidence_count
```
Evidence sources (already exist in the product!):
- project submission + **teacher review outcome** (complete / partial / invalid)
- attendance + participation
- quiz results
- mentor observation
- self-assessment

### 2.4 `learner_goals`
```
id · learner_id · statement ("become an aerospace engineer") · status · created_at
```

### 2.5 `journeys` + `milestones`
```
journeys:   id · learner_id · goal_id · title · status · generated_by (ai|mentor) · version
milestones: id · journey_id · order · title · target_capability_ids[] · status · content_refs[]
```
AI generates; **a mentor can always override.** Never fully automate a child's
education path with no human in the loop.

---

## 3. Phased plan (additive, non-breaking)

> **Hard rule for every phase: the running business keeps working.** Live batches,
> schedules, credits, teacher pay, attendance and reviews must not break. Build
> beside, migrate gradually, delete last.

### Phase 0 — Spine (no visible UI change)
- Create `capabilities` taxonomy (start ~40–60 capabilities, incl. meta ones).
- Tag existing 61 lessons → capabilities (`content_capabilities`).
- Create `learner_capability_mastery`; backfill from existing
  `lesson_progress` + `project_submissions` + `session_attendance`.
- **Ship nothing to users.** This is pure foundation.
- *Exit test:* for any current student you can print a real mastery profile.

### Phase 1 — Change the front door
- Landing hero → *"Learn anything. Become anything."* + intent input.
- `/start` intent-capture flow → writes a `learner_goal`.
- Student dashboard: replace "% course complete" with **Your growth** (mastery)
  + "Continue your journey".
- Keep the course pages reachable (SEO + direct enrolment still works).
- *Exit test:* a new visitor never sees a course grid before stating an intent.

### Phase 2 — Journeys + AI planner
- `journeys` / `milestones` tables.
- AI planner: `goal + current mastery → next milestones`, drawing on tagged content.
- Mentor review/adjust UI.
- *Exit test:* two learners with different goals get genuinely different paths.

### Phase 3 — Projects & portfolio as first-class  ← *cheap win, infra exists*
- `project_submissions` + the three-way review (complete/partial/invalid) is
  **already built** (see HANDOFF).
- Elevate to a public **learner portfolio**: "I built this."
- Feed review outcomes into mastery as evidence.

### Phase 4 — Parent growth view  ← *also cheap, data exists after Phase 0*
- Replace lesson counts with capability growth deltas + qualitative mentor notes.
- *Exit test:* a parent sees "Problem Solving ↑14%", not "8 lessons completed".

### Phase 5 — Domain expansion (the big bet)
- Add non-coding domains. **Only after** the capability/journey machine is proven.
- See the honest risk in §5.

---

## 4. What NOT to touch

These are hard-won and orthogonal to the pivot. **Leave them alone.**

- Batch / cohort scheduling, reschedule + cancel engine, conflict checks
- Credits (grant, deduct-on-complete, adjustments)
- Attendance, teacher earnings, penalties, no-show/late-join logic
- Teacher training gates, course eligibility, admin/HR tooling
- Auth, roles, RLS, impersonation, security middleware
- The performance work (WebGL gating, code-splitting, service worker)

A learner-first school **still** needs live classes scheduled and teachers paid.
This layer survives the pivot untouched.

---

## 5. Honest risks — read before committing

### 5.1 The promise/inventory gap (biggest risk)
The vision says *"not a coding platform"* and shows physics/astrophysics/business
examples. **100% of current content is coding/AI.**

If the homepage promises "learn anything" and a learner arrives wanting physics,
they find nothing → broken trust, refunds, churn. And the vision itself says
parent trust is the emotional core.

**Recommended near-term position:** keep the *philosophy* fully learner-first, but
keep the *public promise* honest about current depth, e.g.
> "Start with technology and AI — learn the way you actually learn."

Widen the promise as inventory widens. Don't sell astrophysics before it exists.
**This is a decision for you, not me — but shipping the wide promise early is the
single most likely way to damage the brand.**

### 5.2 Scope
The full vision is a multi-year, multi-team endeavour. Attempting all of it at once
produces nothing shippable. Phases 0–2 are the minimum that changes the identity.

### 5.3 Personalisation quality
A bad AI-generated path is worse than a good fixed one. Mitigations: mentor in the
loop, start with a small number of well-modelled goals, prefer "next best step"
over generating an entire 3-year plan on day one.

### 5.4 Cold start
A brand-new learner has zero mastery data. Needs a light diagnostic ("show me
where you are") that doesn't feel like an exam — the vision explicitly rejects
exam-feel.

### 5.5 SEO / acquisition
Course pages are likely current organic traffic. Don't delete those routes when
the front door changes — keep them as entry points that funnel into intent capture.

---

## 6. Open decisions (yours to make)

1. **Public promise now** — wide ("learn anything") or honest-narrow ("technology
   & AI, learner-first") until inventory widens? *(Recommendation: narrow.)*
2. **First non-coding domain** — maths? science? communication? Determines the
   first content investment.
3. **Do existing courses stay purchasable as courses?** *(Recommendation: yes,
   during transition — it's the revenue.)*
4. **How much can AI decide unsupervised** vs. always mentor-reviewed?
5. **Pricing model** — per-course today. Does a journey/subscription replace it?
   This is a business-model change, not just UI.
6. **Age positioning** — vision says all ages; current ops (parents, batches,
   kids) is school-age. Do adults get a different surface?

---

## 7. Recommended immediate next step

**Phase 0 only.** Specifically:

1. Draft the capability taxonomy (~40–60, including meta-capabilities).
2. Tag the 61 existing lessons against it.
3. Stand up `learner_capability_mastery` + backfill from existing data.
4. Prove it: print a real mastery profile for a real current student.

That is invisible to users, breaks nothing, and is a prerequisite for every other
phase. It also immediately reveals how much of the vision current content can
actually support — which informs decision #1 and #2 above with evidence instead
of guesswork.

---

## 8. The test for every Stage 2 feature

> **Does this make the learner more capable, more curious, more independent, or
> more capable of learning?**

If a proposed feature only increases completion, screen time, or catalog size —
it belongs to the old model. Cut it.
