-- ============================================================================
-- SARIRO — a student can be enrolled in a school subject or a focus course
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- ── The third table with this bug ───────────────────────────────────────────
-- `level` started life as one of the three coding levels and grew a CHECK
-- constraint saying so. Then school subjects and focus courses shipped, and the
-- constraint has been widened one table at a time as each one broke in
-- production:
--
--   purchase_intents   30 Aug — scripts/purchase-intent-school-levels.sql
--   cohorts                   — scripts/cohort-levels.sql
--   enrollments        this file
--
-- So the failure was: a Public Speaking cohort could be created, and then the
-- enrollment into it was refused by chk_enr_level. Confirming the purchase
-- returned "Unknown error", because the Supabase error object is not an
-- `Error` and the catch that reported it only read `Error.message`.
--
-- The visible symptom was that Public Speaking had zero enrolments and the
-- whole authored course was unreachable — 46 lessons and a Speaking Lab that
-- nobody could open.
--
-- ── The last section prints any table this is still true of ─────────────────
-- Three times is enough to stop fixing these one at a time. The DO block at the
-- bottom names every remaining check constraint on a `level` column that would
-- refuse 'focus', so a fourth one shows up here rather than in a support
-- message.
-- ============================================================================

do $$
declare
  v_name text;
begin
  -- Find whatever check constraint governs `level`, whatever it is called.
  select con.conname into v_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
   where nsp.nspname = 'public'
     and rel.relname = 'enrollments'
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%level%'
   limit 1;

  if v_name is not null then
    execute format('alter table public.enrollments drop constraint %I', v_name);
    raise notice 'Dropped the old level constraint (%).', v_name;
  else
    raise notice 'No existing level constraint — adding one.';
  end if;
end $$;

alter table public.enrollments
  add constraint chk_enr_level check (
    lower(level) in ('elementary', 'beginner', 'intermediate', 'advanced')
    or level = 'focus'
    -- grade-1 … grade-12 and group-1 … group-12. Anchored and bounded so a
    -- typo like `grade-70` is still refused: the point is to widen the set,
    -- not to stop checking.
    or level ~ '^(grade|group)-(1[0-2]|[1-9])$'
  );

comment on constraint chk_enr_level on public.enrollments is
  'Coding levels, focus, or grade-N / group-N for N in 1..12. Matches chk_pi_level on purchase_intents and chk_cohort_level on cohorts, so an order, the batch that filled it and the enrolment that resulted all describe the same product.';

-- ============================================================================
-- Anything else still refusing a focus course
-- ============================================================================
-- Read-only. Raises a notice per table that has a check constraint on a level
-- column which does not mention 'focus'. Look at the output of this script.
do $$
declare
  r record;
  v_found integer := 0;
begin
  for r in
    select rel.relname as table_name,
           con.conname  as constraint_name,
           pg_get_constraintdef(con.oid) as def
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%level%'
       and pg_get_constraintdef(con.oid) not ilike '%focus%'
  loop
    v_found := v_found + 1;
    raise notice 'STILL NARROW: %.% — %', r.table_name, r.constraint_name, r.def;
  end loop;

  if v_found = 0 then
    raise notice 'Every level constraint in the schema now accepts focus courses.';
  else
    raise notice '% constraint(s) above would still refuse a focus course.', v_found;
  end if;
end $$;
