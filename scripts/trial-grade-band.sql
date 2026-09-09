-- ============================================================================
-- SARIRO — a grade 1 and a grade 10 in the same half hour
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- A trial holds four children and, until now, any four. The seat maths was
-- right and the teaching was impossible: one lesson cannot serve a six-year-old
-- learning to read and a fifteen-year-old doing board revision — and the trial
-- is the half hour that decides whether a family buys anything.
--
-- ── What this adds ──────────────────────────────────────────────────────────
--   profiles.grade            1–12, the grade a learner is in
--   trial_participants.grade  the grade they were in WHEN they joined that
--                             class, so a band stays correct after a child
--                             moves up a year
--
-- The rule itself lives in lib/trial/grade-band.ts and is enforced at both
-- booking routes. The first child to book a slot fixes it at their grade ± 1:
-- a grade 6 opens a 5–7 class, and after that only 5, 6 and 7 may join.
--
-- ── Why the grade is copied onto the participant row ────────────────────────
-- profiles.grade is what the child is in TODAY. A class booked in March for
-- April must keep the band it was sold with, and in September every child in
-- the country moves up a year. Reading the band off profiles would silently
-- re-band every historical class on the day the school year turns over.
-- ============================================================================

set search_path = public, extensions;

alter table public.profiles
  add column if not exists grade smallint;

alter table public.profiles
  drop constraint if exists profiles_grade_range;
alter table public.profiles
  add constraint profiles_grade_range
  check (grade is null or (grade between 1 and 12));

comment on column public.profiles.grade is
  'School grade 1-12. Used to band trial classes: see lib/trial/grade-band.ts.';

alter table public.trial_participants
  add column if not exists grade smallint;

alter table public.trial_participants
  drop constraint if exists trial_participants_grade_range;
alter table public.trial_participants
  add constraint trial_participants_grade_range
  check (grade is null or (grade between 1 and 12));

comment on column public.trial_participants.grade is
  'The grade this child was in when they joined THIS class. Copied at booking rather than read from profiles, so a band survives the child moving up a year.';

-- Back-fill what we can from the demo requests, which have been collecting a
-- grade all along. Only where the participant row has none, so nothing already
-- recorded is overwritten.
update public.trial_participants tp
   set grade = d.learner_grade
  from public.bookings b
  join public.demo_class_requests d on d.id = b.demo_request_id
 where tp.booking_id = b.id
   and tp.grade is null
   and d.learner_grade between 1 and 12;

-- ── One table. Where the grades stand. ─────────────────────────────────────
select 'profiles with a grade' as fact,
       count(*) filter (where grade is not null)::text || ' of ' || count(*)::text as value
  from public.profiles where role = 'student' or is_student = true
union all
select 'trial seats with a grade',
       count(*) filter (where grade is not null)::text || ' of ' || count(*)::text
  from public.trial_participants
union all
select 'upcoming trials that cannot be banded',
       count(*)::text
  from public.bookings b
 where b.is_trial = true
   and b.status not in ('cancelled')
   and b.slot_end > now()
   and not exists (
     select 1 from public.trial_participants tp
      where tp.booking_id = b.id and tp.grade is not null
   );
