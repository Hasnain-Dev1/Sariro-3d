-- ============================================================================
-- SARIRO — Human-readable batch codes on cohorts
-- ============================================================================
-- Adds cohorts.batch_code (e.g. "B-0001") so a batch has a short, stable id that
-- staff can reference and map to its enrolled kids. Existing rows are backfilled;
-- new rows get a code automatically. Idempotent.
-- ============================================================================

create sequence if not exists public.cohort_batch_seq;

alter table public.cohorts add column if not exists batch_code text;

-- Backfill any rows that don't have a code yet.
update public.cohorts
   set batch_code = 'B-' || lpad(nextval('public.cohort_batch_seq')::text, 4, '0')
 where batch_code is null;

create unique index if not exists idx_cohorts_batch_code on public.cohorts(batch_code);

-- Auto-assign a code on insert when one isn't provided.
create or replace function public.set_cohort_batch_code()
returns trigger language plpgsql as $$
begin
  if new.batch_code is null then
    new.batch_code := 'B-' || lpad(nextval('public.cohort_batch_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cohorts_batch_code on public.cohorts;
create trigger trg_cohorts_batch_code
  before insert on public.cohorts
  for each row execute function public.set_cohort_batch_code();

-- ============================================================================
-- Rollback:
--   drop trigger if exists trg_cohorts_batch_code on public.cohorts;
--   drop function if exists public.set_cohort_batch_code();
--   alter table public.cohorts drop column if exists batch_code;
--   drop sequence if exists public.cohort_batch_seq;
-- ============================================================================
