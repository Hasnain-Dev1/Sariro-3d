-- ============================================================================
-- SARIRO — a cohort can be a school grade, not only a coding level
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §4-6. The New Course flow now creates every kind of class we sell:
-- coding tracks by level, school subjects by grade, and focus courses.
--
-- ── The problem this pre-empts ──────────────────────────────────────────────
-- purchase_intents.level had exactly this constraint and it broke every school
-- checkout with a 500 — see scripts/purchase-intent-school-levels.sql, which
-- widened it on 30 Aug. cohorts.level was never touched, so if it carries the
-- same coding-only check, creating a Mathematics Grade 7 cohort fails the same
-- way. This applies the same widening, and does nothing if the constraint was
-- never there.
--
-- ── The shape, matching purchase_intents exactly ────────────────────────────
--   elementary | beginner | intermediate | advanced   coding tracks
--   grade-1 … grade-12                                one school year
--   group-1 … group-12                                a three-year group
--   focus                                             a specialisation
--
-- `track` holds the subject slug in every case: a coding track id, a school
-- subject slug, or a specialisation slug. Two tables describing the same sale
-- must agree, or a cohort and the order that filled it are talking about
-- different products.
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
     and rel.relname = 'cohorts'
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%level%'
   limit 1;

  if v_name is not null then
    execute format('alter table public.cohorts drop constraint %I', v_name);
    raise notice 'Dropped the old level constraint (%).', v_name;
  else
    raise notice 'No existing level constraint — adding one.';
  end if;
end $$;

alter table public.cohorts
  add constraint chk_cohort_level check (
    lower(level) in ('elementary', 'beginner', 'intermediate', 'advanced')
    or level = 'focus'
    -- The grade is required and must be real. `grade-` with nothing after it
    -- means something upstream lost the grade, and that should fail loudly
    -- rather than create a cohort nobody can be placed into.
    or level ~ '^(grade|group)-(1[0-2]|[1-9])$'
  );

comment on constraint chk_cohort_level on public.cohorts is
  'Coding levels, focus, or grade-N / group-N for N in 1..12. Matches chk_pi_level on purchase_intents so a cohort and the order that filled it describe the same product.';
