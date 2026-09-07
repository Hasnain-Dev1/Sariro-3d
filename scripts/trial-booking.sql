-- ============================================================================
-- SARIRO — when a teacher is free, and booking a trial into it
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it found.
--
-- Two things did not exist and one of them was quietly blocking the rest:
--
--   · a teacher had nowhere to say "Monday 5-6 and 8-10", so nobody could tell
--     which slots were offerable and every trial was arranged by message
--   · a trial had nowhere to live, so it could not appear in a calendar, could
--     not be attended, and could not pay anybody
--
-- ── Why a trial is a booking and not its own table ──────────────────────────
-- bookings.cohort_id is nullable — checked against the live database, not
-- assumed. So a trial can be a booking with no cohort, and it inherits every
-- thing that already works: the teacher's calendar, the attendance flow, the
-- lateness rules, the earnings trigger. A parallel trial_classes table would
-- have meant re-implementing all of that and then keeping two copies in step.
--
-- What a trial needs on top is a student who is not reached through an
-- enrolment, and a way to say "this one is a trial".
--
-- ── Minutes from midnight ───────────────────────────────────────────────────
-- start_minute / end_minute, not a time column. Overlap and subtraction become
-- integer comparisons that a timezone cannot get wrong, and it matches
-- lib/scheduling/availability.ts exactly, which is where the arithmetic is
-- tested. The timezone lives on profiles.timezone: a window means 5pm WHERE
-- THE TEACHER IS, and storing an offset per row would go wrong twice a year in
-- opposite directions in different countries.
--
-- Half-open: a window covers [start, end). 17:00-18:00 and 18:00-19:00 do not
-- overlap. Getting that wrong double-books a teacher on the hour, every hour.
-- ============================================================================

set search_path = public, extensions;

-- ── 1. When a teacher is available ──────────────────────────────────────────
create table if not exists public.teacher_availability (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references public.profiles(id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_minute smallint not null check (start_minute >= 0    and start_minute <  1440),
  end_minute   smallint not null check (end_minute   >  0    and end_minute   <= 1440),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint chk_availability_order check (end_minute > start_minute),
  -- 30 minutes is the shortest window worth offering; below that it is not a
  -- class. Mirrors MIN_WINDOW_MINUTES in lib/scheduling/availability.ts.
  constraint chk_availability_length check (end_minute - start_minute >= 30),
  -- The same window saved twice is one window, not two.
  constraint uq_availability unique (teacher_id, weekday, start_minute, end_minute)
);

create index if not exists teacher_availability_teacher_idx
  on public.teacher_availability (teacher_id, weekday);

comment on table public.teacher_availability is
  'Weekly recurring windows a teacher is willing to teach in, as minutes from midnight in their own profiles.timezone. See lib/scheduling/availability.ts.';

-- ── 2. A trial is a booking with no cohort ──────────────────────────────────
alter table public.bookings
  add column if not exists is_trial boolean not null default false;

alter table public.bookings
  add column if not exists trial_student_id uuid references public.profiles(id) on delete set null;

alter table public.bookings
  add column if not exists demo_request_id uuid references public.demo_class_requests(id) on delete set null;

alter table public.bookings
  add column if not exists booked_by uuid references public.profiles(id) on delete set null;

comment on column public.bookings.is_trial is
  'A free trial class. Has no cohort_id; the student is on trial_student_id instead of through an enrolment.';

-- A trial must name its student, or nobody knows who is expected.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_trial_has_student') then
    alter table public.bookings
      add constraint chk_trial_has_student
      check (is_trial = false or trial_student_id is not null or demo_request_id is not null);
  end if;
end $$;

create index if not exists bookings_trial_idx
  on public.bookings (is_trial, slot_start) where is_trial = true;

create index if not exists bookings_trial_student_idx
  on public.bookings (trial_student_id) where trial_student_id is not null;

-- ── 3. Who may see and change what ──────────────────────────────────────────
alter table public.teacher_availability enable row level security;

-- A teacher owns their own hours. Nobody else writes them: an admin who
-- disagrees with a teacher's availability needs to have a conversation, not
-- edit the row underneath them.
drop policy if exists availability_own_write on public.teacher_availability;
create policy availability_own_write
  on public.teacher_availability
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- Everyone who books reads them. A seller cannot offer a slot they cannot see.
drop policy if exists availability_staff_read on public.teacher_availability;
create policy availability_staff_read
  on public.teacher_availability
  for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and (
           p.role in ('hr', 'admin', 'super_admin', 'seller')
           or p.is_admin = true or p.is_super_admin = true
           or p.is_hr = true or p.is_seller = true
         )
    )
  );

-- ── 4. What is there now ────────────────────────────────────────────────────
do $$
declare
  v_teachers integer := 0;
  v_windows  integer := 0;
  r          record;
begin
  select count(*) into v_windows from public.teacher_availability;
  select count(*) into v_teachers
    from public.profiles
   where role = 'teacher' or is_teacher = true;

  raise notice '── trial-booking ──────────────────────────────────────';
  raise notice 'availability windows saved : %', v_windows;
  raise notice 'teachers on the books      : %', v_teachers;

  if v_windows = 0 then
    raise notice '';
    raise notice 'No teacher has set their hours yet, so no trial can be booked.';
    raise notice 'Each teacher does this once, in Settings -> Availability.';
  end if;

  raise notice '';
  raise notice 'Teachers, and whether they have said when they are free:';
  for r in
    select p.full_name,
           p.timezone,
           (select count(*) from public.teacher_availability a where a.teacher_id = p.id) as windows
      from public.profiles p
     where p.role = 'teacher' or p.is_teacher = true
     order by p.full_name
  loop
    raise notice '  %  tz=%  windows=%',
      rpad(coalesce(r.full_name, '(unnamed)'), 26),
      rpad(coalesce(r.timezone, 'NOT SET'), 18),
      r.windows;
  end loop;

  raise notice '';
  raise notice 'A teacher with no timezone cannot be booked safely — their';
  raise notice '5pm is unknown. Ask them to set it in Settings.';
end $$;
