-- ============================================================================
-- SARIRO — Per-day class times (different time on different weekdays)
-- ============================================================================
-- The original design stored ONE `time_local` on cohort_schedules, applied to
-- every selected weekday. This adds a child table so each weekday of a schedule
-- can carry its own start time (and optional duration override).
--
-- BACKWARD COMPAT: existing schedules keep working. The generator falls back to
-- cohort_schedules.time_local for any weekday that has no child row.
--
-- Safe to run more than once (IF NOT EXISTS everywhere).
-- ============================================================================

create table if not exists public.cohort_schedule_days (
  id            uuid primary key default gen_random_uuid(),
  schedule_id   uuid not null references public.cohort_schedules(id) on delete cascade,
  day_of_week   int  not null check (day_of_week between 0 and 6),  -- 0=Sun .. 6=Sat
  time_local    time not null,                 -- wall-clock start, anchored to schedule.timezone
  duration_min  int,                           -- NULL = inherit cohort_schedules.duration_min
  created_at    timestamptz not null default now(),
  unique (schedule_id, day_of_week)
);

create index if not exists idx_cohort_schedule_days_schedule
  on public.cohort_schedule_days(schedule_id);

-- ── RLS: mirror cohort_schedules visibility ────────────────────────────────
alter table public.cohort_schedule_days enable row level security;

-- Admins / super-admins: full access.
drop policy if exists csd_admin_all on public.cohort_schedule_days;
create policy csd_admin_all on public.cohort_schedule_days
  for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('admin', 'super_admin') or p.is_admin = true or p.is_super_admin = true)
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('admin', 'super_admin') or p.is_admin = true or p.is_super_admin = true)
  ));

-- Teachers: read the day-rows for schedules they teach.
drop policy if exists csd_teacher_read on public.cohort_schedule_days;
create policy csd_teacher_read on public.cohort_schedule_days
  for select
  using (exists (
    select 1 from public.cohort_schedules s
    where s.id = cohort_schedule_days.schedule_id
      and s.teacher_id = auth.uid()
  ));

-- ============================================================================
-- Rollback:
--   drop table if exists public.cohort_schedule_days;
-- ============================================================================
