-- ════════════════════════════════════════════════════════════════
-- SARIRO — Student v2 migration
--
-- Adds:
--   1. lesson_progress table — per-lesson completion tracking
--   2. cohort_materials.materials_url column — alternative simpler
--      column if you don't want a separate materials table.
--
-- Depends on: enrollments table (already migrated in v1.0 batch).
-- Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1. lesson_progress table -----------------------------------------------------
create table if not exists public.lesson_progress (
  id             uuid primary key default gen_random_uuid(),
  enrollment_id  uuid not null references public.enrollments(id) on delete cascade,
  module_num     text not null,
  lesson_name    text not null,
  completed_at   timestamptz not null default now(),
  -- Each lesson can be marked complete only once per enrollment
  unique (enrollment_id, module_num, lesson_name)
);

comment on table  public.lesson_progress is 'Per-lesson completion records for student v2 dashboards.';
comment on column public.lesson_progress.module_num is 'Module number from the syllabus (e.g. "01", "02").';
comment on column public.lesson_progress.lesson_name is 'Lesson title from the syllabus.';

-- 1a. Indexes
create index if not exists idx_lesson_progress_enrollment
  on public.lesson_progress(enrollment_id);

create index if not exists idx_lesson_progress_completed_at
  on public.lesson_progress(completed_at desc);

-- 1b. RLS
alter table public.lesson_progress enable row level security;

-- Students can CRUD their own rows
drop policy if exists "lesson_progress_owner_all" on public.lesson_progress;
create policy "lesson_progress_owner_all"
  on public.lesson_progress for all
  using (
    exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.enrollments e
      where e.id = enrollment_id and e.user_id = auth.uid()
    )
  );

-- Teachers can read progress for students in their cohorts
drop policy if exists "lesson_progress_teacher_read" on public.lesson_progress;
create policy "lesson_progress_teacher_read"
  on public.lesson_progress for select
  using (
    exists (
      select 1
      from public.enrollments e
      join public.bookings b on b.cohort_id = e.cohort_id
      where e.id = enrollment_id
        and b.teacher_id = auth.uid()
    )
  );

-- Admins / super_admins can read all
drop policy if exists "lesson_progress_admin_read" on public.lesson_progress;
create policy "lesson_progress_admin_read"
  on public.lesson_progress for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.role in ('admin','super_admin')
             or p.is_admin = true or p.is_super_admin = true)
    )
  );

-- 2. cohort_materials.materials_url column ------------------------------------
-- Adds an alternative materials_url column to the existing cohorts table.
-- (If you already have a separate cohort_materials table, you can skip
--  this — both approaches are supported by the student data layer.)

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cohorts'
      and column_name = 'materials_url'
  ) then
    alter table public.cohorts
      add column materials_url text;
    comment on column public.cohorts.materials_url is 'Optional single URL for cohort materials (recordings, slides, etc.).';
  end if;
end $$;

-- 3. Verification --------------------------------------------------------------
-- select count(*) as lesson_progress_rows from public.lesson_progress;
-- select id, materials_url from public.cohorts limit 5;
