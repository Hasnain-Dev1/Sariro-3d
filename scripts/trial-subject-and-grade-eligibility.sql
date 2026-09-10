-- ============================================================================
-- SARIRO — what a trial is ABOUT, and who is allowed to teach it
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- A trial booking has never recorded a subject. It stores a teacher, a time
-- and a room, which means a parent asking for Mathematics and a parent asking
-- for Public Speaking produce identical records — and the booking page offered
-- every free half hour any teacher had, to everybody.
--
-- The first thing that would tell anyone the match was wrong is the class
-- itself, with the family watching. §6, §7, §9 and §14 all exist to prevent
-- exactly that.
--
-- ── What this adds ──────────────────────────────────────────────────────────
--   bookings.trial_subject      what the class is about
--   profiles.trial_min_grade    the youngest a teacher will take for a trial
--   profiles.trial_max_grade    the oldest
--
-- Subject eligibility already existed: teacher_course_assignments(track, level)
-- has been there all along with an admin screen behind it, and is reused
-- rather than duplicated. Only the GRADE range is new.
--
-- ── Why the range is nullable, and what null means ──────────────────────────
-- Null means "any grade". Nobody has filled these in, and the opposite default
-- would make every teacher ineligible for everything the moment this ships —
-- an empty booking page for every visitor, caused by a column nobody knew they
-- had to populate.
-- ============================================================================

set search_path = public, extensions;

alter table public.bookings
  add column if not exists trial_subject text;

comment on column public.bookings.trial_subject is
  'Course/track slug the trial is for. Matches cohorts.track and the catalogue in lib/dashboard/course-options.ts.';

alter table public.profiles
  add column if not exists trial_min_grade smallint,
  add column if not exists trial_max_grade smallint;

comment on column public.profiles.trial_min_grade is
  'Youngest grade this teacher takes for trials. NULL means any — see lib/trial/subjects.ts.';
comment on column public.profiles.trial_max_grade is
  'Oldest grade this teacher takes for trials. NULL means any.';

alter table public.profiles drop constraint if exists profiles_trial_grade_range;
alter table public.profiles
  add constraint profiles_trial_grade_range check (
    (trial_min_grade is null or trial_min_grade between 1 and 12)
    and (trial_max_grade is null or trial_max_grade between 1 and 12)
    -- A range with the ends the wrong way round matches nothing, and would
    -- silently remove a teacher from every search.
    and (trial_min_grade is null or trial_max_grade is null or trial_min_grade <= trial_max_grade)
  );

-- The subject filter runs on every public slot request.
create index if not exists teacher_course_assignments_track_idx
  on public.teacher_course_assignments(track);
create index if not exists bookings_trial_subject_idx
  on public.bookings(trial_subject) where is_trial = true;

-- ── One table. Whether anybody can actually be matched. ────────────────────
select 'teachers who can take a trial' as fact,
       count(*)::text as value
  from public.profiles
 where (role = 'teacher' or is_teacher = true)
   and timezone is not null and meet_url is not null
union all
select 'subjects with at least one approved teacher',
       count(distinct track)::text
  from public.teacher_course_assignments
 where track is not null
union all
select 'teachers with a trial grade range set',
       count(*)::text || ' (NULL means any grade, which is fine)'
  from public.profiles
 where trial_min_grade is not null or trial_max_grade is not null
union all
select 'trial bookings carrying a subject',
       count(*) filter (where trial_subject is not null)::text || ' of ' || count(*)::text
  from public.bookings where is_trial = true
union all
select 'subjects offered on the booking page',
       string_agg(distinct track, ', ' order by track)
  from public.teacher_course_assignments where track is not null;
