-- ════════════════════════════════════════════════════════════════
-- SARIRO — Teacher v2 migration
--
-- Adds session-level tooling for teachers:
--   1. session_notes — free-form notes per (booking, teacher)
--   2. session_attendance — per-student attendance per booking
--
-- Depends on: bookings table (already migrated in v1.0 batch).
-- Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1. session_notes table -------------------------------------------------------
create table if not exists public.session_notes (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  teacher_id   uuid not null references auth.users(id) on delete cascade,
  content      text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table  public.session_notes is 'Teacher free-form notes attached to a specific booking/session.';
comment on column public.session_notes.content is 'Markdown-friendly text body.';

-- 1a. Indexes
create index if not exists idx_session_notes_booking
  on public.session_notes(booking_id);
create index if not exists idx_session_notes_teacher
  on public.session_notes(teacher_id);

-- 1b. One note per (booking, teacher)
drop constraint if exists session_notes_booking_teacher_unique on public.session_notes;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_notes_booking_teacher_unique'
  ) then
    alter table public.session_notes
      add constraint session_notes_booking_teacher_unique
      unique (booking_id, teacher_id);
  end if;
end $$;

-- 1c. RLS
alter table public.session_notes enable row level security;

-- Teachers can CRUD their own notes
drop policy if exists "session_notes_owner_all" on public.session_notes;
create policy "session_notes_owner_all"
  on public.session_notes for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- Admins can read all notes
drop policy if exists "session_notes_admin_read" on public.session_notes;
create policy "session_notes_admin_read"
  on public.session_notes for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.role in ('admin','super_admin')
             or p.is_admin = true or p.is_super_admin = true)
    )
  );

-- 1d. Touch trigger
create or replace function public.touch_session_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_session_notes_touch on public.session_notes;
create trigger trg_session_notes_touch
  before update on public.session_notes
  for each row
  execute function public.touch_session_notes_updated_at();

-- 2. session_attendance table -------------------------------------------------
create table if not exists public.session_attendance (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'unknown'
                check (status in ('present','absent','late','excused','unknown')),
  note         text,
  recorded_at  timestamptz not null default now(),
  recorded_by  uuid references auth.users(id) on delete set null,
  -- One record per (booking, user)
  unique (booking_id, user_id)
);

comment on table  public.session_attendance is 'Per-student attendance for a specific booking/session.';
comment on column public.session_attendance.status is 'Attendance status: present, absent, late, excused, unknown.';

-- 2a. Indexes
create index if not exists idx_session_attendance_booking
  on public.session_attendance(booking_id);
create index if not exists idx_session_attendance_user
  on public.session_attendance(user_id);

-- 2b. RLS
alter table public.session_attendance enable row level security;

-- Teachers assigned to the booking can CRUD attendance
drop policy if exists "session_attendance_teacher_all" on public.session_attendance;
create policy "session_attendance_teacher_all"
  on public.session_attendance for all
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.teacher_id = auth.uid()
    )
  );

-- Students can READ their own attendance
drop policy if exists "session_attendance_student_read" on public.session_attendance;
create policy "session_attendance_student_read"
  on public.session_attendance for select
  using (user_id = auth.uid());

-- Admins can read all attendance
drop policy if exists "session_attendance_admin_read" on public.session_attendance;
create policy "session_attendance_admin_read"
  on public.session_attendance for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.role in ('admin','super_admin')
             or p.is_admin = true or p.is_super_admin = true)
    )
  );

-- 3. Verification --------------------------------------------------------------
-- select count(*) as session_notes from public.session_notes;
-- select count(*) as session_attendance from public.session_attendance;
