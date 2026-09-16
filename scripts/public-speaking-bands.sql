-- SARIRO — Public Speaking as five courses, one per age band
-- ============================================================================
-- The founder's call, 16 Sep 2026: Public Speaking is sold, enrolled, batched
-- and taught as five courses —
--
--   band-foundation  Grades 1–3          band-senior  Grades 10–12
--   band-primary     Grades 4–6          band-adult   UG, PG & professionals
--   band-middle      Grades 7–9
--
-- The track stays `public-speaking`; the band is the LEVEL, the way a school
-- subject's grade is (src/lib/speaking/bands.ts). Three tables refuse any
-- level they do not know, so without this every Public Speaking order, batch
-- and enrolment fails:
--
--   purchase_intents  chk_pi_level      — checkout would 500 at "Pay"
--   cohorts           chk_cohort_level  — "New course" could not make the batch
--   enrollments       chk_enr_level     — a paid order could not enrol the child
--
-- Each constraint is rebuilt with everything it allowed before, plus the five
-- bands. `focus` stays valid: anything bought before today still reads.
-- Nothing is deleted or rewritten. Safe to run more than once.
-- Ends with ONE SELECT to check.

alter table public.purchase_intents drop constraint if exists chk_pi_level;
alter table public.purchase_intents
  add constraint chk_pi_level check (
    lower(level) in ('elementary', 'beginner', 'intermediate', 'advanced')
    or level = 'focus'
    or level ~ '^(grade|group)-(1[0-2]|[1-9])$'
    or level ~ '^band-(foundation|primary|middle|senior|adult)$'
  );
comment on constraint chk_pi_level on public.purchase_intents is
  'Coding levels, focus, grade-N / group-N for N in 1..12, or a Public Speaking band (band-foundation … band-adult). Bands added 16 Sep 2026.';

alter table public.cohorts drop constraint if exists chk_cohort_level;
alter table public.cohorts
  add constraint chk_cohort_level check (
    lower(level) in ('elementary', 'beginner', 'intermediate', 'advanced')
    or level = 'focus'
    or level ~ '^(grade|group)-(1[0-2]|[1-9])$'
    or level ~ '^band-(foundation|primary|middle|senior|adult)$'
  );
comment on constraint chk_cohort_level on public.cohorts is
  'Coding levels, focus, grade-N / group-N for N in 1..12, or a Public Speaking band. Matches chk_pi_level and chk_enr_level.';

alter table public.enrollments drop constraint if exists chk_enr_level;
alter table public.enrollments
  add constraint chk_enr_level check (
    lower(level) in ('elementary', 'beginner', 'intermediate', 'advanced')
    or level = 'focus'
    or level ~ '^(grade|group)-(1[0-2]|[1-9])$'
    or level ~ '^band-(foundation|primary|middle|senior|adult)$'
  );
comment on constraint chk_enr_level on public.enrollments is
  'Coding levels, focus, grade-N / group-N for N in 1..12, or a Public Speaking band. Matches chk_pi_level and chk_cohort_level.';

-- ── Check ───────────────────────────────────────────────────────────────────
-- Each _should_be_1 column: the constraint exists and allows bands.
-- other_level_checks_should_be_0: any OTHER check on a level column in these
-- tables or teacher_course_assignments — which would still refuse a band.
select
  (select count(*) from pg_constraint where conname = 'chk_pi_level'
     and pg_get_constraintdef(oid) like '%band-%') as purchase_intents_should_be_1,
  (select count(*) from pg_constraint where conname = 'chk_cohort_level'
     and pg_get_constraintdef(oid) like '%band-%') as cohorts_should_be_1,
  (select count(*) from pg_constraint where conname = 'chk_enr_level'
     and pg_get_constraintdef(oid) like '%band-%') as enrollments_should_be_1,
  (select count(*) from pg_constraint con
     join pg_class rel on rel.oid = con.conrelid
     join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname in ('purchase_intents', 'cohorts', 'enrollments', 'teacher_course_assignments')
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%level%'
      and con.conname not in ('chk_pi_level', 'chk_cohort_level', 'chk_enr_level')) as other_level_checks_should_be_0,
  (select count(*) from public.enrollments where track = 'public-speaking' and level = 'focus') as ps_enrolments_still_on_old_single_course;
