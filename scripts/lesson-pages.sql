-- ============================================================================
-- SARIRO — Lesson content pages (per-course templates)
-- ============================================================================
-- ONE HTML page per lesson of each course (keyed by course_id + module + index),
-- shared by every cohort/student. Seeded as an empty <h1> stub; admins fill in
-- the real content later.
--
-- ACCESS MODEL:
--   Direct table reads are locked to admins/super-admins (the content editor).
--   Students and teachers NEVER read this table directly — they go through the
--   server APIs (/api/lessons/*) which use the service role AFTER checking:
--     • Student  → may read a page only if that lesson is CURRENT or COMPLETED
--                  for one of their active enrollments (no upcoming lessons).
--     • Teacher  → may read a page only for a course they are ELIGIBLE for
--                  (teacher_course_assignments), and only CURRENT or NEXT lesson.
--   Enforcing this in the API keeps the progress logic in one place instead of
--   encoding it in RLS.
--
-- Safe to run more than once (IF NOT EXISTS everywhere).
-- ============================================================================

create table if not exists public.lesson_pages (
  id            uuid primary key default gen_random_uuid(),
  course_id     text not null,                 -- e.g. 'python-elem'
  module_num    int  not null,                 -- 1-based module number
  lesson_index  int  not null,                 -- 0-based position within the module
  lesson_name   text not null,                 -- display name (matches syllabus)
  title         text,                          -- optional page title override
  html_content  text not null default '',      -- raw HTML body (seeded '<h1>{name}</h1>')
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (course_id, module_num, lesson_index)
);

create index if not exists idx_lesson_pages_course on public.lesson_pages(course_id);
create index if not exists idx_lesson_pages_lookup on public.lesson_pages(course_id, module_num, lesson_index);

-- ── updated_at trigger (reuse shared helper) ───────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'touch_updated_at'
  ) then
    create function public.touch_updated_at()
    returns trigger language plpgsql as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end $$;

drop trigger if exists trg_lesson_pages_updated_at on public.lesson_pages;
create trigger trg_lesson_pages_updated_at
  before update on public.lesson_pages
  for each row execute function public.touch_updated_at();

-- ── RLS: admin-only direct access; everyone else goes through the API ──────
alter table public.lesson_pages enable row level security;

drop policy if exists lesson_pages_admin_all on public.lesson_pages;
create policy lesson_pages_admin_all on public.lesson_pages
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

-- ============================================================================
-- Rollback:
--   drop table if exists public.lesson_pages;
-- ============================================================================
