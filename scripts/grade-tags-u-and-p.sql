-- ============================================================================
-- SARIRO — room on the grade scale for U and P
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
-- RUN THIS BEFORE deploying the code that offers U and P — until it runs, the
-- database refuses those grades and the booking of anyone who picks one would
-- fail.
--
-- Grades were 1–12 in every column that holds one. Sariro also teaches
-- undergraduates and working professionals, and there was nowhere to say so.
--
--   1 … 12   G1 … G12, a school grade
--   13       U — an undergraduate
--   14       P — a graduate, postgraduate or working professional
--
-- Same number line on purpose: the trial band (±1) and a teacher's grade range
-- already work on one number, so a G12 can share a trial with an
-- undergraduate, and an undergraduate with a professional, with no new rule.
-- lib/grade/tag.ts is the only place in the code that knows 13 and 14.
--
-- An UNKNOWN grade stays NULL. It is shown as "U" (the founder's rule), but it
-- is never stored as 13 — so the display can change without the data lying.
-- ============================================================================

set search_path = public, extensions;

-- A learner's own grade.
alter table public.profiles drop constraint if exists profiles_grade_range;
alter table public.profiles
  add constraint profiles_grade_range check (grade is null or (grade between 1 and 14));
comment on column public.profiles.grade is
  '1-12 = school grade (G1-G12); 13 = undergraduate (U); 14 = graduate/professional (P). NULL = not given. See lib/grade/tag.ts.';

-- The grade a child sat a trial at.
alter table public.trial_participants drop constraint if exists trial_participants_grade_range;
alter table public.trial_participants
  add constraint trial_participants_grade_range check (grade is null or (grade between 1 and 14));

-- The grade on a lead.
alter table public.student_leads drop constraint if exists student_leads_grade_range;
alter table public.student_leads
  add constraint student_leads_grade_range check (grade is null or (grade between 1 and 14));

-- A teacher's trial range. Widened so a teacher CAN be set to take U and P;
-- a teacher left at the default (NULL) already takes any grade.
alter table public.profiles drop constraint if exists profiles_trial_grade_range;
alter table public.profiles
  add constraint profiles_trial_grade_range check (
    (trial_min_grade is null or trial_min_grade between 1 and 14)
    and (trial_max_grade is null or trial_max_grade between 1 and 14)
    and (trial_min_grade is null or trial_max_grade is null or trial_min_grade <= trial_max_grade)
  );

-- ── One table. The four rules as the database now holds them. ─────────────
select conname as "constraint", pg_get_constraintdef(oid) as rule
  from pg_constraint
 where conname in ('profiles_grade_range', 'trial_participants_grade_range',
                   'student_leads_grade_range', 'profiles_trial_grade_range')
 order by conname;
