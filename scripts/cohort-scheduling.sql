-- ============================================================================
-- SARIRO — Recurring class scheduling (foundation)
-- ============================================================================
-- A per-cohort recurring rule (teacher + start date + weekday(s) + time in an
-- IANA timezone + 1 or 2 classes/week). Concrete `bookings` are generated from
-- it as exact UTC instants (DST-correct, computed per occurrence).
--
-- Safe to run more than once (IF NOT EXISTS everywhere).
-- ============================================================================

create table if not exists public.cohort_schedules (
  id                uuid primary key default gen_random_uuid(),
  cohort_id         uuid not null references public.cohorts(id) on delete cascade,
  teacher_id        uuid not null references public.profiles(id),
  start_date        date not null,
  days_of_week      int[] not null,               -- 0=Sun .. 6=Sat; 1 entry (1/wk) or 2 (2/wk)
  time_local        time not null,                -- wall-clock start time, anchored to `timezone`
  duration_min      int  not null default 60,
  timezone          text not null,                -- IANA tz (e.g. 'Asia/Kolkata') — makes generation DST-correct
  classes_per_week  int  not null default 1 check (classes_per_week in (1, 2)),
  status            text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_cohort_schedules_cohort  on public.cohort_schedules(cohort_id);
create index if not exists idx_cohort_schedules_teacher on public.cohort_schedules(teacher_id);

-- Pause windows — for a whole batch (student_id null) or a single kid.
create table if not exists public.schedule_pauses (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.cohort_schedules(id) on delete cascade,
  scope        text not null check (scope in ('batch', 'student')),
  student_id   uuid references public.profiles(id),   -- null when scope = 'batch'
  pause_start  date not null,
  pause_end    date not null,
  reason       text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_schedule_pauses_schedule on public.schedule_pauses(schedule_id);

-- Link generated bookings back to their schedule, and add the Phase B join-time field.
alter table public.bookings add column if not exists schedule_id       uuid references public.cohort_schedules(id) on delete set null;
alter table public.bookings add column if not exists teacher_started_at timestamptz;

create index if not exists idx_bookings_schedule on public.bookings(schedule_id);

-- ============================================================================
-- Rollback (if ever needed):
--   alter table public.bookings drop column if exists schedule_id;
--   alter table public.bookings drop column if exists teacher_started_at;
--   drop table if exists public.schedule_pauses;
--   drop table if exists public.cohort_schedules;
-- ============================================================================
