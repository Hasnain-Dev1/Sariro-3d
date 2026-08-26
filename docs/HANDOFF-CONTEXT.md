# Sariro — Engineering Handoff / Context

> **Purpose:** paste-able context so a new chat (or a new engineer) can continue
> without losing what's been built. Companion docs: `SARIRO-VISION.md`,
> `STAGE-2-PLAN.md`.
> **Last updated:** end of the session ending at commit `29b13ff`.

---

## 1. What this project is

**Sariro** — an AI/technology education platform. Next.js (App Router) +
TypeScript + Supabase, deployed on **Hostinger** at **https://sariro.com**.

- Repo: `D:\DREAM\sariro-3d`, branch `main`.
- **Two push remotes on one `origin`** — a single `git push origin main` updates
  both `Mimo2k/sariro` and `Hasnain-Dev1/Sariro-3d`.

### Stack notes
- Next.js 16 (Turbopack), React 19, Tailwind v4, framer-motion, three.js/R3F.
- Supabase: browser client (RLS-enforced) + service-role client (server routes only).
- `next.config.ts` sets `typescript.ignoreBuildErrors: true` → **`next build`
  does NOT type-check.** Always run `npx tsc --noEmit` separately.
- ESLint has most rules off (incl. `no-unused-vars`) — don't rely on lint to catch things.

---

## 2. Working conventions (followed all session)

- **Verify, don't assume:** run `npx tsc --noEmit` *and* `npx next build` before
  every commit. Both must exit 0.
- **Never commit/push unless explicitly asked.** The user says "commit and push".
- **Cross-user writes go through service-role API routes**, never the browser
  client (RLS blocks them). Pattern: CSRF (`assertSameOrigin`) → IP blocklist →
  rate limit → auth → role check *from the caller's own profile row* → validate →
  act. See `src/app/api/admin/update-role/route.ts` as the reference.
- Migrations are hand-run SQL in `scripts/*.sql` (idempotent, `IF NOT EXISTS`).
  **The user runs them manually in Supabase** — always tell them which file.
- Code should read like its surroundings; comments explain *why*, not *what*.

---

## 3. Current product surface

**Roles:** student · parent · teacher · seller · hr · admin · super_admin.

**Dashboards:** `/dashboard/{student,teacher,admin,super-admin,hr,seller}` +
sub-pages (lessons, leaderboard, support, doubt-sessions, teacher-pay, parents).

**Public:** `/`, `/courses` (+ `/courses/{elementary,beginner,intermediate,advanced}`),
`/course-path/[id]`, `/pricing`, `/schools`, `/events`, `/about`, `/story`,
`/resources`, `/faq`, `/contact`, `/welcome`, legal pages.

**Auth:** `/auth/sign-in`, `/auth/sign-up` (Google One Tap, GitHub OAuth, email+password).

---

## 4. Curriculum asset (important for Stage 2)

`src/lib/curriculum/` — **61 lesson files** across 3 built courses, all conforming
to the `StructuredLesson` type in `types.ts` (concept / miniProject / finalProject
/ quiz / homework; 5-tab viewer).

| Folder | Course | id | Status |
|---|---|---|---|
| `momentum/` | Web Builder Pro — Beginner | `web-101` | 30 lessons, complete |
| `orbit/` | Web Builder Pro — Intermediate | `web-201` | pre-existing |
| `compass/` | Agent Architect — Beginner | `agent-101` | 30 lessons, complete |

**Compass was rewritten twice this project:**
1. TypeScript/Node → **Python** (whole course), and Module 5 redesigned around a
   real **Streamlit** deployment (was Next.js/Vercel).
2. Anthropic Claude SDK → **provider-agnostic `openai` package**
   (`chat.completions`), because OpenAI/Groq/Gemini all expose OpenAI-compatible
   endpoints — same code, swap `base_url`. Embeddings moved off `voyageai` onto
   OpenAI's embeddings API. **Zero Claude/Anthropic references remain.**

⚠️ **Unresolved / parked:** removing React from Beginner+Intermediate tiers
(keeping it Advanced-only) was raised, three clarifying questions were dismissed
with "wait for next instruction", and it was **never decided**. Do not act on it
without explicit direction.

---

## 5. Key subsystems (do not break — see STAGE-2-PLAN §4)

- **Scheduling:** `cohort_schedules` + generated `bookings`; per-day times;
  reschedule (single + whole-batch "Change schedule" with apply-from date/break);
  cancel with "move to a specific day"; **teacher double-booking conflict checks**
  on all creation/reschedule paths.
- **Credits:** 1 credit = 1 class. Granted on enrolment (idempotent per
  enrollment). **Deducted on class completion** in
  `/api/teacher/complete-class` — guarded by a per-booking `class_consumed`
  transaction so retries never double-charge. *(The DB trigger the old code
  assumed existed was never actually there — that was the "credits not
  deducting" bug.)*
- **Attendance:** unlocks **25 min after class start** (not after it ends).
- **Teacher join/no-show:** "Join Meet" calls `/api/teacher/start-class` **before**
  opening the link, recording `teacher_started_at` — this is what stopped real
  joins being flagged as no-shows. Genuine late-join penalties (3–10 min) still apply.
- **Projects/review:** `project_submissions` + `submission_feedback`. Review is
  **three-way — Complete / Partial / Invalid** → full / half / zero points
  (leaderboard 15 / 8 / 0). Dedicated **"Project Reviews"** section on the teacher
  dashboard lists pending submissions across all classes.
- **Student name management:** admins/super-admins can rename a student and
  **lock** self-editing; enforced by a DB trigger (`enforce_name_lock`), not just UI.

---

## 6. Migrations already run in Supabase

All of `scripts/*.sql`. Most recently confirmed run by the user:
- `student-name-management.sql` — `profiles.name_locked` + `enforce_name_lock` trigger ✅
- `project-review-partial.sql` — `partial` status + rescored `student_leaderboard` ✅

---

## 7. Performance work (all verified with real measurements)

**Mobile PageSpeed: 38 → 76.** What actually moved it:

1. **WebGL gating** (`src/lib/use-heavy-visuals.ts`) — the homepage mounted 4+
   three.js canvases. Now they mount **only on non-touch, ≥1024px, non-reduced-
   motion** devices. Phones get identical design minus WebGL. *(38 → 67)*
2. **Freezing infinite CSS animations under 1024px** — profiling found **11
   infinite animations running at once**, so Lighthouse never saw the viewport
   "settle" and Speed Index was pinned at ~11 s. *(69 → 76, SI 11.1 → 8.9 s,
   LCP 5.4 → 3.9 s)*
3. Lazy-loading three.js out of `brand-layout` (it was in **every** public page's
   bundle, incl. `/privacy`, `/checkout`).
4. Removing an `opacity:0` full-page fade in `PageTransition` that blocked first paint.
5. Homepage below-the-fold sections code-split; font weights 12 files → 7.
6. Service worker (`public/sw.js`) — precaches static assets; **allowlist** of
   public marketing pages only. Deliberately never caches `/api/*`,
   `/dashboard/*`, `/auth/*`, checkout or payment pages.
7. Student dashboard: 7 sequential Supabase queries → 3 parallel waves.

**Known ceiling:** **TTFB ≈ 946 ms** on Hostinger — ~half of the 2.0 s FCP, and a
hard floor on the score. Recommended next step is **Cloudflare (free) in front of
sariro.com** (edge-cache HTML → TTFB < 100 ms), with cache **bypass** rules for
`/dashboard/*` and `/api/*`. *This is infra, not code — user action.*

---

## 8. Recent commits (newest first)

```
29b13ff fix(seo): og:image pointed at localhost, so shared links had no preview
badd69c feat(admin+auth): add Change Schedule to admin dashboard; redesign auth screens
9368f71 perf: trim font weights from 12 files to 7
d5c075f perf(mobile): freeze infinite decorative animations to unpin Speed Index
2031b18 perf: stop opacity:0 fade-ins from blocking first paint
ea61d35 perf(mobile): mount decorative WebGL only on capable desktop devices
6811a88 feat(credits+reviews): deduct credit on complete; three-way project review
e6b209a feat(enroll): pick batch on manual enroll + unlock prior lessons for joiners
13e725f feat(dashboards): next-class-only, calendar attendance, student rename+lock
4239ec0 perf: code-split homepage sections + service worker
e456822 perf(student-dashboard): parallelize sequential Supabase queries
6a5b49f perf: lazy-load three.js/WebGL off every page
08fbbca fix(class-ops): student join, teacher no-show, attendance gate, conflicts
c48eb99 fix(courses): make full syllabus modal public, not gated by sign-in
```

---

## 9. Gotchas worth knowing

- **`metadataBase` was falling back to `http://localhost:3000`** in production, so
  every shared link had a broken preview. Fixed in `29b13ff` — production domain
  is now the default; `NEXT_PUBLIC_SITE_URL` still overrides. *(After deploying,
  social platforms cache old previews — use FB Debugger / LinkedIn Post Inspector
  to force a re-scrape.)*
- `.env` is gitignored; `NEXT_PUBLIC_SITE_URL` is **not** set on the server (the
  code no longer needs it, but setting it is still cleaner).
- `.claude/` is gitignored — a local `launch.json` for the dev server won't be committed.
- Auth pages render a **duplicate zero-size DOM copy** in dev — that's a React
  streaming-SSR (`div#S:0`) artifact, **not a bug**. Only one copy is visible.
- Recurring past bug: **single-quoted TS strings containing an apostrophe** break
  `tsc`. Use double quotes for those strings.
- Windows/Git Bash: `git` warns `LF will be replaced by CRLF` on every commit — harmless.
- Dev server is slow to boot (~30 s + per-route compile); production build ~4 min.

---

## 10. Where Stage 2 starts

Read **`STAGE-2-PLAN.md`**. Short version:

- **Do NOT delete the curriculum.** It becomes *inventory*, not *the product*.
- The atom shifts **Course → Capability**.
- **Phase 0 first** (invisible, breaks nothing): build the capability taxonomy,
  tag the 61 existing lessons, stand up `learner_capability_mastery`, backfill
  from existing data, and print a real mastery profile for a real student.
- Biggest strategic risk to decide before marketing widens: **the vision promises
  "learn anything" but 100% of current content is coding/AI.**
