-- ============================================================================
-- SARIRO — tell one demo request from another
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- ── What this is for ────────────────────────────────────────────────────────
-- The booking form asked exactly one question about what someone wanted:
-- `course_interest`, a flat list of fifteen CODING courses. A parent booking a
-- free class for Class 8 maths — the thing most of the site now sells — found
-- nothing in that list describing what they wanted, and left it on "No
-- preference".
--
-- So every booking arrived looking the same. Nobody could tell:
--   • which subject the class should be about;
--   • which grade or course inside that subject;
--   • whether the learner is a nine-year-old, an undergraduate, or somebody in
--     work paying for themselves.
--
-- That last one decides who teaches the class, how long it runs and what it is
-- worth, and it was never captured at all.
--
-- ── Why four columns and not one ────────────────────────────────────────────
-- `subject` + `focus` is what they want to study; `learner_stage` +
-- `learner_grade` is who is studying. They look alike for a school child and
-- are genuinely different for everyone else — a working professional taking
-- Calculus, an undergraduate revisiting Grade 11 physics. Collapsing them would
-- throw away the distinction the fields exist to capture.
--
-- `course_interest` is kept and still written. Existing rows have it, the admin
-- list reads it, and dropping a column to avoid a nullable one is how history
-- gets lost.
-- ============================================================================

alter table public.demo_class_requests
  -- Slug of a school subject, or 'coding' / 'public-speaking'.
  add column if not exists subject text,
  -- What inside that subject: 'grade-8', a focus-course slug ('calculus'), or a
  -- coding track id ('web'). Free-form on purpose — the shape depends on the
  -- subject, and a CHECK here would need updating every time the catalogue does.
  add column if not exists focus text,
  add column if not exists learner_stage text,
  add column if not exists learner_grade smallint;

-- These two ARE worth constraining: they are the fields the business reads to
-- decide who a booking is, and a typo'd stage silently becomes a fourth
-- category nobody notices.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_demo_learner_stage'
  ) then
    alter table public.demo_class_requests
      add constraint chk_demo_learner_stage
      check (
        learner_stage is null
        or learner_stage in ('school', 'undergraduate', 'postgraduate', 'professional')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_demo_learner_grade'
  ) then
    alter table public.demo_class_requests
      add constraint chk_demo_learner_grade
      check (learner_grade is null or (learner_grade between 1 and 12));
  end if;
end $$;

-- "How many of last month's enquiries were school children?" is the question
-- this table now exists to answer, so it is the one that gets an index.
create index if not exists demo_requests_stage_idx
  on public.demo_class_requests (learner_stage);
create index if not exists demo_requests_subject_idx
  on public.demo_class_requests (subject);
