-- ============================================================================
-- SARIRO — Role hierarchy: one reporting Admin + one reporting HR per teacher
-- ============================================================================
-- Set on teacher profiles. A student's "scope" is derived from their cohort's
-- teacher (no separate mapping). Idempotent; safe to run more than once.
-- ============================================================================

alter table public.profiles add column if not exists reporting_admin_id uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists reporting_hr_id    uuid references public.profiles(id) on delete set null;

create index if not exists idx_profiles_reporting_admin on public.profiles(reporting_admin_id);
create index if not exists idx_profiles_reporting_hr    on public.profiles(reporting_hr_id);

-- ============================================================================
-- Rollback:
--   alter table public.profiles drop column if exists reporting_admin_id;
--   alter table public.profiles drop column if exists reporting_hr_id;
-- ============================================================================
