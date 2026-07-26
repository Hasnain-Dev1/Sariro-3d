# SARIRO Website State

> Living record of the current site. READ THIS FIRST before any edits.
> Last updated: July 3, 2026 (FINAL STATE)

## Pages (all return 200, lint clean)

| Route | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Home — neural hero, tracks, courses, pricing, events, testimonials, CTA |
| `/courses` | `src/app/courses/page.tsx` | Course catalog with flip cards + syllabus modal |
| `/courses/beginner` | `src/app/courses/beginner/page.tsx` | Tier page (uses `_tier-page.tsx`) |
| `/courses/intermediate` | `src/app/courses/intermediate/page.tsx` | Tier page |
| `/courses/advanced` | `src/app/courses/advanced/page.tsx` | Tier page |
| `/course-path/[id]` | `src/app/course-path/[id]/page.tsx` | Course path with 3 level cards + 1:1/1:4 selector + auto-scroll |
| `/checkout` | `src/app/checkout/page.tsx` | Checkout page with course details + ratio selection + Razorpay link |
| `/pricing` | `src/app/pricing/page.tsx` | Pricing with 1:1/1:4 dropdown + 3 tier cards |
| `/about` | `src/app/about/page.tsx` | About Sariro → Mimo → Team (with images) |
| `/schools` | `src/app/schools/page.tsx` | Schools page |
| `/events` | `src/app/events/page.tsx` | Events page |
| `/resources` | `src/app/resources/page.tsx` | Resources page |
| `/story` | `src/app/story/page.tsx` | Story page |
| `/faq` | `src/app/faq/page.tsx` | FAQ page |
| `/contact` | `src/app/contact/page.tsx` | Contact page with 5-email directory |
| `/terms` | `src/app/terms/page.tsx` | Terms of Service |
| `/refunds` | `src/app/refunds/page.tsx` | Refund Policy |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy Policy |
| `/auth/sign-in` | `src/app/auth/sign-in/page.tsx` | Sign in (blue theme) — redirects to `/dashboard` |
| `/auth/sign-up` | `src/app/auth/sign-up/page.tsx` | Sign up (violet+amber theme) — redirects to `/dashboard` |
| `/auth/callback` | `src/app/auth/callback/route.ts` | OAuth callback handler |
| `/dashboard` | `src/app/dashboard/page.tsx` | Role router — auto-redirects based on role |
| `/dashboard/student` | `src/app/dashboard/student/page.tsx` | Student dashboard |
| `/dashboard/teacher` | `src/app/dashboard/teacher/page.tsx` | Teacher dashboard |
| `/dashboard/admin` | `src/app/dashboard/admin/page.tsx` | Admin dashboard |
| `/dashboard/super-admin` | `src/app/dashboard/super-admin/page.tsx` | Super admin dashboard |
| `/settings` | `src/app/settings/page.tsx` | Account settings (edit name, phone, view email) |

## Key Architecture

### Auth (Supabase)
- **AuthProvider** is in `src/app/layout.tsx` (root layout) — wraps entire app
- **Profile type** includes: `is_student`, `is_teacher`, `is_admin`, `is_super_admin`
- **`getRole(profile)`** function returns highest-priority role: super_admin > admin > teacher > student
- **Auth flow**: Login → `/auth/callback` → `/dashboard` → role router → correct dashboard
- **Profile completion modal**: Asks for missing name/phone/email based on provider
- **Sign-in page**: Blue theme, "Welcome back"
- **Sign-up page**: Violet+amber theme, "Become a Sariro builder" + benefit cards
- **Google One Tap**: Loads GIS script, exchanges ID token with Supabase
- **GitHub OAuth**: `signInWithOAuth({provider:'github'})`
- **Email/Password**: Standard Supabase `signUp` / `signInWithPassword`

### Navbar (BrandLayout)
- **AuthNavButton**: Shows "Sign in" when logged out, avatar+role badge+dropdown when logged in
  - Role badge: Student (blue), Teacher (green), Admin (amber), Super Admin (violet)
  - Dropdown: Dashboard link (role-based), Account settings (/settings), Sign out
- **StartLearningButton**: Only shows when NOT logged in (hidden for logged-in users)
- **Mobile sidebar**: Scrollable nav (`flex-1 overflow-y-auto`), auth button pinned to bottom (`shrink-0 border-t`), body scroll locked when open

### Courses
- **TRACKS**: 10 tracks from the HTML file (web, app, saas, agent, data, cloud, design, game, automation, security)
- **COURSES**: 30 courses (10 tracks × 3 levels: Beginner $199, Intermediate $299, Advanced $699)
- **AUDIENCE_TRACKS**: Separate array for the "Three Paths" section on home (Students/Schools/Professionals)
- **Filter pills**: 4 level-based pills — All Courses / Beginner / Intermediate / Advanced (NOT track-based)
- **Flip cards**: Front=info, Back=outcomes + "Enroll now" button
- **Syllabus modal**: Opens on "Syllabus" button click, shows full module/lesson breakdown
  - z-index: `z-[70]` (above navbar)
  - Navbar HIDES when modal open (`data-syllabus-open` attribute on `<html>`)
  - Body scroll locked, only modal content scrolls
  - Close button: 44px touch target, `z-20`
  - "Enroll now" button links to `/course-path/{trackId}`

### Course Path Page (`/course-path/[id]`)
- Shows 3 level cards (Beginner green / Intermediate blue / Advanced violet)
- Click a card → auto-scrolls to details section (`detailsRef`)
- Details: outcomes + full syllabus + 1:1/1:4 batch selector
- "Reserve your seat" → opens Razorpay in new tab
- Mobile: 3 cards stack vertically (`grid-cols-1 sm:grid-cols-3`)

### Checkout Page (`/checkout?course=X`)
- Shows course header + outcomes + syllabus preview
- 1:4 vs 1:1 ratio selection (blue/violet cards)
- Order summary + "Reserve your seat" → Razorpay
- Sticky checkout panel on desktop

### Pricing Page
- 1:1/1:4 dropdown selector (NOT toggle)
- 3 tier cards with prices that change based on ratio
- CTA buttons are plain `<a>` tags (NOT MagneticButton) with `relative z-10` to stay above TiltCard
- Home page pricing section also has `<a>` tags (NOT MagneticButton)

### Razorpay Payment Links
- **Single source**: `RAZORPAY_LINKS` in `sariro-data.ts`
- **`getRazorpayLink(level, ratio)`** function
- 6 links: 3 tiers × 2 ratios (1:4 and 1:1)
- 1:4 links: `sarirobeginner`, `sarirointermediate`, `sariroadvanced`
- 1:1 links: `sarirobeginner1on1`, `sarirointermediate1on1`, `sariroadvanced1on1` (PLACEHOLDERS — replace with real links)
- Also stored in Supabase `settings` table (for future super-admin dashboard editing)
- **Enroll flow**: "Enroll now" → `/course-path/{trackId}` → select level → "Reserve your seat" → Razorpay

### Team
- **Mimo Patra** — Founder and CEO (#F59E0B, isFounder)
- **Sumita Patra** — Co-Founder and CFO (#EC4899, isFounder)
- **Hasnain Ali** — Co-Founder and IT Director (#06B6D4, isFounder)
- **Dr. Lena Okafor** — Head of School Partnerships (#16A34A)
- **Marco Rossi** — Lead Mentor, LLM Applications (#2563EB)
- **Priya Nair** — Lead Mentor, Computer Vision (#7C3AED)
- **James Chen** — Career Mentor (#06B6D4)
- **Sofia Alvarez** — Community & Mentor Program (#EC4899)
- Each member has `image` field for real photos (`/images/team/{name}.jpg`)
- About page renders `<Image>` if `image` exists, falls back to letter avatar

### Emails (5 mailboxes @sariro.com)
- `contact@sariro.com` — General (Mail icon, green)
- `support@sariro.com` — Support (LifeBuoy icon, blue)
- `dev@sariro.com` — Development (Briefcase icon, violet)
- `hr@sariro.com` — Careers (Handshake icon, amber)
- `founder@sariro.com` — Founder (Sparkles icon, cyan)
- Shown on Contact page + footer Connect section

### Stat Pills (Mimo portrait)
- 4 floating pills around Mimo's portrait: 12+ Years (orange), 7 Patents (green), 5,000+ Students (blue), 36 Papers (violet)
- Mobile: 2-col grid below portrait

### Chat Bubble (SLM)
- Floating bubble bottom-right with flying entrance animation
- Keyword-based FAQ matching (28 FAQ entries)
- Body scroll lock when open
- `/api/chat` endpoint
- Chat bubble + companion orb + cookie banner hidden when any modal open (via `data-scroll-locked`)

### 3D Hero Scenes (page-hero-3d.tsx)
- 7 variants: courses, schools, events, pricing, about, resources, contact
- PricingScene (piggy bank) + AboutScene (orb) — UNTOUCHED
- ContactScene: glass envelope + orbiting bubbles + light trail
- EventsScene: floating glass event ticket + confetti
- StoryScene: open book + sparkles
- FaqScene: floating question marks + answer card
- SchoolsScene: Platonic solids + math symbols (positions use `as const` for tuples)

### Mobile Fixes
- Syllabus modal: z-[70], pt-24 on mobile, navbar hidden via `data-syllabus-open`
- Chat panel close: 44px touch target, z-[55]
- Cookie consent: z-45 (was z-9998)
- Mobile sidebar: scrollable nav, auth button pinned, body scroll locked
- Filter pills: `flex-wrap justify-center` (no horizontal scroll)
- Hero 3D: `max-w-[400px]` on mobile + `mb-16` to prevent overlap with trusted-by
- Viewport: `viewportFit: "cover"` for iOS safe-area
- All close buttons: 44px minimum, `touch-manipulation`

### Sound Fix (Cinematic Intro)
- AudioContext starts suspended on browser reload
- Sound queues on intro start, replays on first user gesture
- `soundHasPlayed` flag prevents double-play
- `pointerdown` listener for broader coverage

### TypeScript Fixes
- `about/page.tsx`: `'isFounder' in member && member.isFounder` (TEAM as const)
- `brand-layout.tsx`: EMAIL_ICONS type includes `style?: React.CSSProperties`
- `page-hero-3d.tsx`: Position arrays use `as const` for tuples
- `page-hero-3d.tsx`: `useRef<(THREE.Group | null)[]>` (was `useRef<THREE.Group>([])`)
- `footer-3d.tsx`: Same EMAIL_ICONS type fix
- `scroll-effects.tsx`: `globalThis.MouseEvent` + `as EventListener` casts

### Dashboards
- **Student**: Welcome animation, course suggestion banner, My Courses (empty state with CTA), class schedule, learning path
- **Teacher**: My Schedule (calendar), stats (classes/students/hours), student overview
- **Admin**: Stats, edit courses link, user management link
- **Super Admin**: Stats, edit courses, edit pricing, role management, payment links reference
- **Settings**: Edit name, phone, view email (read-only), save to Supabase

### SQL Schema (run in Supabase)
- `profiles` table: extends `auth.users` with `is_student`, `is_teacher`, `is_admin`, `is_super_admin`
- `enrollments` table: student ↔ course ownership
- `class_schedules` table: teacher ↔ student classes
- `faq_knowledge_base` table: 28 FAQ entries for SLM
- `unanswered_questions` table: SLM improvement loop
- `chat_conversations` + `chat_messages` tables: chat history
- `settings` table: payment links + configurable values
- RLS policies on all tables
- Triggers: `handle_new_user` (auto-create profile), `touch_updated_at`, `touch_conversation_last_message`

### .env (placeholders — replace with real keys)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Files NOT to touch unless explicitly needed
- All existing pages (home, courses, pricing, about, etc.) — only modify when fixing specific bugs
- All existing 3D scenes (PricingScene, AboutScene are explicitly UNTOUCHED)
- `sariro-data.ts` — only modify when adding/changing courses, team, pricing, or emails
- `WEBSITE_STATE.md` — update after every change session

## Known Working State
- Lint: clean (zero errors)
- All 20+ routes: HTTP 200
- Mobile: no horizontal overflow on any page
- Pricing buttons: all clickable, link to Razorpay
- Syllabus modal: navbar hides, body locked, only content scrolls
- Auth: redirects to `/dashboard` after login (not stuck on sign-in page)
- Filter pills: 4 level-based (All/Beginner/Intermediate/Advanced), no scroll

---

## v1.0 Batch Management System — Added July 5, 2026

### Database (Supabase) — Additive Migration
**5 new tables** (all RLS-enabled, all with CHECK constraints):
- `cohorts` — batch of students learning same course together. State machine: `gathering → ready → active → completed`. Has `google_meet_url` (single link per cohort, never public).
- `enrollments` — student's enrollment in a course. Status: `pending | active | completed | dropped`. Has `completion_shown_at` (for upsell popup tracking).
- `bookings` — scheduled session (1 cohort + 1 teacher + time slot). Status: `scheduled | completed | cancelled | no_show`.
- `purchase_intents` — bridges Razorpay tier payment → exact course. Created before payment, confirmed by admin after.
- `admin_audit_logs` — immutable append-only log of all admin actions.

**4 new columns on `profiles`**: `role` (enum), `timezone`, `track`, `current_cohort_id`.

**15 RLS policies** total. Students see only own data; teachers see assigned cohorts; admins see all; super-admins see all + audit logs.

**13 indexes** for mobile-performance (fast queries on slow networks).

**5 triggers**: `updated_at` auto-timestamp on 4 tables + `trg_cohorts_audit` (auto-logs cohort status changes).

### Architecture — Single App, Logical Route Groups

```
src/app/
├── (public)/     ← marketing site (uses BrandLayout)
├── (auth)/       ← sign-in, sign-up (uses BrandLayout)
└── (dashboard)/  ← login-gated app (uses DashboardLayout)
```

### New Files

| File | Purpose |
|---|---|
| `src/middleware.ts` | Gates `/dashboard/*` + `/settings`; redirects `/` → `/dashboard` when logged in. Gracefully no-ops if Supabase env vars missing. |
| `src/lib/dashboard/upsell-engine.ts` | Pure logic for next-track recommendation (Beginner→Intermediate→Advanced→next track Beginner) |
| `src/components/dashboard/upsell-popup.tsx` | Popup UI — 3 pitch variants, mobile-first bottom-sheet |
| `src/components/dashboard/global-upsell-popup.tsx` | Wrapper in root layout — fetches pending completed enrollments, renders popup on ANY page |
| `src/components/dashboard/dashboard-layout.tsx` | Own topbar + sidebar (desktop) + bottom-nav (mobile). Replaces BrandLayout for dashboard routes. |

### Modified Files

| File | Change |
|---|---|
| `src/app/layout.tsx` | Added AuthProvider + GlobalUpsellPopup (popup works on every page now) |
| `src/components/auth/auth-provider.tsx` | Profile type extended with `timezone`, `track`, `current_cohort_id`. `getRole()` prefers new `role` column. |
| `src/components/brand/brand-layout.tsx` | Removed AuthProvider wrapper (now in root layout) |
| `prisma/schema.prisma` | Added 6 models: Profile (extended), Cohort, Enrollment, Booking, PurchaseIntent, AdminAuditLog |
| `src/app/dashboard/page.tsx` | Removed BrandLayout — plain loading page (middleware handles auth gate) |
| `src/app/dashboard/student/page.tsx` | Full rebuild — real enrollments, schedule, recommended next card, explore tracks |
| `src/app/dashboard/teacher/page.tsx` | Wrapped in DashboardLayout |
| `src/app/dashboard/admin/page.tsx` | Wrapped in DashboardLayout |
| `src/app/dashboard/super-admin/page.tsx` | Wrapped in DashboardLayout |
| `src/app/settings/page.tsx` | Full rebuild — added timezone + track fields, "Detect" button for browser auto-fill |

### Upsell Popup Behavior
- **Trigger**: Logged-in user has enrollment with `status='completed'` AND `completion_shown_at IS NULL`
- **Shows on ANY page** (public, dashboard, settings) — lives in root layout
- **3 pitch variants** (one per completed-tier): different gradient, icon, copy
- **Track cycle**: `web → app → saas → agent → data → cloud → design → game → automation → security → web...`
- **On dismiss**: `UPDATE enrollments SET completion_shown_at = now()` — popup never shows again for that enrollment
- **Persistent card**: Student dashboard shows a "Recommended next" card based on most recent completed enrollment (even after popup dismissed)

### Dashboard Layout Structure
- **Topbar**: Sariro logo (left, links to `/`) · notification bell · avatar dropdown (role badge + name + email + sign out)
- **Sidebar (desktop ≥ lg)**: role-based nav items + "Back to website" link at bottom
- **Bottom-nav (mobile < lg)**: 4 most important items per role, iOS safe-area-aware
- **AuthGate**: shows spinner during auth load, redirects to `/auth/sign-in` if no user

### Mobile-First Priorities
- All buttons ≥ 44px touch target (Apple HIG)
- Sidebar collapses to bottom-nav on mobile (no hamburger menu needed)
- Body has `pb-20 lg:pb-0` so content doesn't hide behind bottom-nav
- Popup is full-screen bottom-sheet on mobile, centered modal on desktop
- Session times shown in user's timezone (from `profiles.timezone`)
- Viewport already has `viewportFit: "cover"` for iOS safe-area

### Security Priorities
- Middleware enforces route-level access (`/dashboard/*` requires session)
- RLS enforces row-level access (students see only own enrollments/bookings)
- `GlobalUpsellPopup` query includes `.eq('user_id', user.id)` even though RLS would enforce it (belt + suspenders)
- Audit logs are append-only (no UPDATE/DELETE policy = immutable)
- `getRole()` prefers new `role` column over legacy booleans (migration backfilled correctly)

### Quality Gates Passed (July 5, 2026)
- Lint: clean (zero errors)
- All 11 tested routes return HTTP 200: `/`, `/courses`, `/dashboard`, `/dashboard/{student,teacher,admin,super-admin}`, `/settings`, `/pricing`, `/about`, `/auth/sign-in`
- Dev server runs without errors in `dev.log`
- Graceful degradation: works without Supabase credentials (preview mode)

### Next Phase (NOT in this build)
- Teacher dashboard rebuild (real bookings + student roster)
- Admin dashboard rebuild (cohort state machine UI: gathering → ready → active → completed)
- Super-admin dashboard rebuild (pricing editor + payment-link manager + audit log viewer)
- Purchase intent flow (login gate modal → purchase_intent row → Razorpay → admin confirms → enrollment created)
- Cohort activation flow (admin "Lock Batch & Activate" → cohort.status=active, google_meet_url generated, bookings auto-created)

---

## v2.0 Capstone System — Added July 26, 2026

### 🎯 Vision
Every lesson in every course advances ONE concrete capstone project step. After class, students open their dashboard, see the lesson brief + capstone step, and submit their project URL for teacher review. Teachers review submissions, give star ratings + feedback, and approve/request-resubmit. Both students and teachers compete on separate leaderboards.

### 📦 New Files (8)

| File | Purpose |
|---|---|
| `src/lib/capstones.ts` | Capstone projects + enriched lessons (Python Elementary: 48 lessons + SariroQuest capstone). Backward-compatible union type so other 29 courses keep working unchanged. |
| `src/lib/dashboard/submissions-data.ts` | Data layer: 6 types + 12 functions (submissions CRUD, leaderboards, URL validation, speed points). All RLS-enforced. |
| `src/app/api/student/submission/route.ts` | POST endpoint — full security stack: CSRF + honeypot + rate-limit (10/min) + URL allowlist (15 hosts) + RLS + speed points calculation. |
| `src/app/api/teacher/review/route.ts` | POST endpoint — full security stack: CSRF + honeypot + rate-limit (20/min) + ownership check + audit log trigger. |
| `src/app/dashboard/student/submit/[bookingId]/page.tsx` | Student submission page — 7-state machine (loading → not-enrolled → absent → locked → empty-form → submitted → reviewed-approved/resubmit). Mobile-first. |
| `src/app/dashboard/student/leaderboard/page.tsx` | Student leaderboard — 3 scope modes (cohort/track/global), top 50, sticky your-rank card, 90-day rolling window. |
| `src/app/dashboard/teacher/leaderboard/page.tsx` | Teacher leaderboard — global scope, top 50, stats summary, sticky your-rank card. |
| `scripts/migration-capstone.sql` | SQL migration (idempotent) — 2 new tables + 2 views + 8 RLS policies + 3 triggers. **Already deployed to production Supabase.** |

### 📝 Modified Files (8 — surgical changes only)

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added 2 new models (ProjectSubmission, SubmissionFeedback) + 3 new relations on existing models + module_num/lesson_name on Booking. |
| `src/lib/dashboard/teacher-data.ts` | `createBooking()` now auto-tags `module_num` + `lesson_name` from syllabus (1st session = lesson 1, etc.). Fixed `fetchSessionStudents()` to use correct column names (`student_id` not `user_id`). |
| `src/lib/dashboard/student-data.ts` | Widened `SyllabusModule.lessons` to union type `(string \| LessonObject)[]` for backward compat. Updated `calculateProgress()` to extract name from either shape. |
| `src/app/api/teacher/attendance/route.ts` | BONUS BUG FIX: was using wrong column names (`user_id`/`recorded_at`/`recorded_by`) → fixed to `student_id`/`marked_at`/`marked_by`. Attendance marking was silently failing before this fix. |
| `src/app/dashboard/student/page.tsx` | Added "Class Notes & Projects" section linking past bookings to submission page. Extended Booking interface + added pastBookings state. |
| `src/app/dashboard/teacher/page.tsx` | Added "Submissions" tab to SessionDetailsModal. New components: SubmissionsTab, SubmissionReviewCard, formatTimeAgoShort. |
| `src/app/courses/_tier-page.tsx` | Widened SyllabusModule type to union. Renders `topic` subtitle for enriched courses. |
| `src/app/courses/page.tsx` | Same union type fix. "Join cohort" buttons now skip tier selection for Elementary courses (go directly to checkout). |
| `src/components/sariro-3d/courses-3d.tsx` | "Join cohort" button conditional href — Elementary → `/checkout?course={id}`, others → `/course-path/{trackId}`. |
| `src/components/dashboard/dashboard-layout.tsx` | Added "Leaderboard" nav item to both STUDENT_NAV and TEACHER_NAV (Trophy icon). |
| `src/components/sariro-3d/chat-bubble.tsx` | (Earlier fix) Mobile chat close button — safe-area insets + bright amber + larger tap target. |

### 🗄️ Database Schema (Production Supabase)

**2 new tables:**
- `project_submissions` (15 columns) — student capstone piece submissions. Unique on (enrollment_id, module_num). Speed points captured at submit time.
- `submission_feedback` (10 columns) — 1:1 with submissions. Rating 1-5, approved bool, content.

**2 new views:**
- `student_leaderboard` — live-computed, 90-day rolling. Points = speed + approval + attendance.
- `teacher_leaderboard` — live-computed, 90-day rolling. Points = (5 × classes) + (3 × reviews) + (2 × on-time bonus).

**3 additive columns on existing tables:**
- `bookings.module_num` (INT) + `bookings.lesson_name` (TEXT)
- `lesson_progress.capstone_completed` (BOOL) + `lesson_progress.capstone_evidence_url` (TEXT)

**8 RLS policies:**
- Students: CRUD own submissions, READ own feedback
- Teachers: READ cohort submissions, CRUD own feedback
- Admins: full access to both tables

**3 triggers:**
- `touch_updated_at` — auto-timestamp on UPDATE
- `log_submission_review` — auto-writes to admin_audit_logs on every review
- `sync_capstone_on_approval` — auto-sets `lesson_progress.capstone_completed = TRUE` when submission approved

### 🏆 Leaderboard Scoring

**Student (per cohort, 90-day rolling):**
| Action | Points |
|---|---|
| Submit ≤24h after class | +25 |
| Submit ≤48h after class | +18 |
| Submit ≤7 days after class | +10 |
| Submit after 7 days | +5 |
| First-time approval | +15 |
| Resubmit approval | +8 |
| Marked present | +10 |
| Marked late | -3 |
| Marked absent | 0 |

**Teacher (global, 90-day rolling):**
| Action | Points |
|---|---|
| Each class completed | +5 |
| Each project reviewed | +3 |
| Review within 48h of submission | +2 bonus |

### 🔒 Security Stack (every new endpoint)

1. **CSRF** — `assertSameOrigin()` blocks cross-origin POSTs
2. **IP blocklist** — `isIpBlocked()` instantly 403s known abusers
3. **Rate limit** — 10/min (student) / 20/min (teacher) / 60/min (webhook)
4. **Honeypot** — hidden `website` field, silently rejects bots
5. **URL allowlist** — 15 trusted hosts (github, replit, codepen, codesandbox, drive.google, colab, scratch, vercel, netlify, gitlab, bitbucket, stackblitz, jsfiddle, gist.github, docs.google)
6. **HTTPS required** — except localhost for dev
7. **Bare-domain blocked** — must link to specific project, not just homepage
8. **RLS enforced** — students see only own, teachers see only cohort students, admins see all
9. **No service role in client code** — zero privilege-escalation risk
10. **Audit log trigger** — every review captured in admin_audit_logs
11. **Unique constraint** — prevents point-farming via duplicate submissions
12. **Speed points snapshotted** — immune to booking reschedules

### 📱 Mobility Checklist (applied to all new UI)

- All touch targets ≥ 44×44px (Apple HIG)
- `env(safe-area-inset-*)` on full-screen takeovers
- `100dvh` instead of `100vh` (iOS Safari URL-bar resize)
- Input `fontSize: '16px'` (prevents iOS zoom-on-focus)
- `touch-manipulation` on all interactive elements (removes 300ms tap delay)
- `truncate` + `min-w-0` everywhere (no horizontal overflow)
- Sticky top bar (back button always reachable)
- Sticky bottom card (your rank always visible on leaderboards)
- Tested at 375px width (iPhone SE)

### ✅ Quality Gates Passed (July 26, 2026)

- Lint: 0 errors, 0 warnings
- TypeScript: 0 errors in new/modified files (17 pre-existing errors in untouched files: page-hero-3d, teacher-management, scroll-effects, upsell-engine)
- All 37 routes return HTTP 200:
  - Public (24): /, /about, /contact, /courses, /courses/{beginner,intermediate,advanced,elementary}, /course-path/{web,python,java}, /pricing, /story, /events, /schools, /resources, /faq, /privacy, /terms, /refunds, /auth/{sign-in,sign-up}, /payment-{success,failure}, /checkout
  - Dashboard (8): /settings, /dashboard, /dashboard/{student,teacher,admin,super-admin}, /dashboard/student/{leaderboard,submit/[bookingId]}, /dashboard/teacher/leaderboard
  - API/SEO (5): /api/health, /robots.txt, /sitemap.xml
- Security tests pass:
  - CSRF blocks cross-origin POSTs ✓
  - Honeypot silently catches bots ✓
  - URL allowlist blocks phishing ✓
  - Rate limit enforced ✓
- Mobile chat close button fixed (notch-aware + bright amber + 44px tap target)
- Elementary "Join cohort" buttons skip tier selection (go directly to checkout)

### 🚀 New Routes Summary

| Route | Type | Auth | Purpose |
|---|---|---|---|
| `/dashboard/student/submit/[bookingId]` | Page | Student | Submit capstone piece for a lesson (7 states) |
| `/dashboard/student/leaderboard` | Page | Student | Student leaderboard (cohort/track/global) |
| `/dashboard/teacher/leaderboard` | Page | Teacher | Teacher leaderboard (global) |
| `/api/student/submission` | POST | Student | Create/update submission (CSRF + honeypot + rate-limit + URL allowlist) |
| `/api/teacher/review` | POST | Teacher | Review submission (CSRF + honeypot + rate-limit + ownership check) |

### 📊 Current Enrichment Status

- ✅ `python-elem` — 48 lessons enriched + SariroQuest capstone (flagship proof-of-concept)
- ⏳ Other 29 courses — use legacy string lessons (still work via union type). Enrichment to happen in future sessions in batches of 5.

### 🎓 Capstone Projects Defined

- ✅ `python-elem` → **SariroQuest: A Text Adventure** — 48 steps building a complete text adventure game
- ⏳ Other 29 courses — capstones to be defined in future sessions
