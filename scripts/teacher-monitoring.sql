-- ============================================================================
-- SARIRO — teacher monitoring
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §29-32, §83. Nothing existed for this: the only matches for "monitoring"
-- in the codebase were the health endpoint and an unrelated string.
--
-- ── Why the scores are columns and not JSON ─────────────────────────────────
-- A JSON blob would be quicker to write and useless to query. "What is this
-- teacher's average on doubt handling across the last six months" is the whole
-- point of collecting this, and it has to be answerable in SQL rather than by
-- pulling every row into the app and reducing it there. Nine columns is not a
-- lot of columns.
--
-- ── Why every score is nullable ─────────────────────────────────────────────
-- An observer who did not see a category should leave it blank, not guess. A
-- forced 5/10 for "technical execution" in a class with no technical component
-- is worse than no number: it drags the average toward the middle and looks
-- like an observation. `overall_score` is computed from whatever was actually
-- filled in.
--
-- ── §83: monitoring is never just a score ───────────────────────────────────
-- Every row points at the exact class it came from, so a teacher can click a
-- score and see which lesson produced it, and who was watching.
-- ============================================================================

create table if not exists public.teacher_monitoring (
  id           uuid primary key default gen_random_uuid(),

  -- Who was observed, and in which class. The booking is what makes this
  -- auditable: a score with no class behind it is an opinion.
  teacher_id   uuid not null references auth.users(id) on delete cascade,
  booking_id   uuid references public.bookings(id) on delete set null,
  cohort_id    uuid references public.cohorts(id) on delete set null,

  -- Who did the observing. Kept even if they later leave.
  observer_id  uuid references auth.users(id) on delete set null,
  observed_on  date not null default current_date,

  -- §30. Each 1-10, each optional — see the note above on blanks.
  concept_clarity       smallint check (concept_clarity      between 1 and 10),
  teaching_quality      smallint check (teaching_quality     between 1 and 10),
  student_engagement    smallint check (student_engagement   between 1 and 10),
  communication         smallint check (communication        between 1 and 10),
  time_management       smallint check (time_management      between 1 and 10),
  doubt_handling        smallint check (doubt_handling       between 1 and 10),
  classroom_management  smallint check (classroom_management between 1 and 10),
  technical_execution   smallint check (technical_execution  between 1 and 10),
  student_interaction   smallint check (student_interaction  between 1 and 10),

  -- Averaged over the categories that were actually scored, to one decimal.
  -- Generated rather than written by the app: two callers computing the same
  -- average two ways is how a teacher ends up seeing 8.2 on one screen and
  -- 8.3 on another.
  overall_score numeric(3,1) generated always as (
    round(
      (
        coalesce(concept_clarity,0) + coalesce(teaching_quality,0) +
        coalesce(student_engagement,0) + coalesce(communication,0) +
        coalesce(time_management,0) + coalesce(doubt_handling,0) +
        coalesce(classroom_management,0) + coalesce(technical_execution,0) +
        coalesce(student_interaction,0)
      )::numeric
      / nullif(
        (concept_clarity is not null)::int + (teaching_quality is not null)::int +
        (student_engagement is not null)::int + (communication is not null)::int +
        (time_management is not null)::int + (doubt_handling is not null)::int +
        (classroom_management is not null)::int + (technical_execution is not null)::int +
        (student_interaction is not null)::int, 0
      ), 1)
  ) stored,

  -- §30/§32. What the teacher reads to understand the number.
  strengths    text,
  improvements text,
  action_items text,
  notes        text,

  created_at   timestamptz not null default now()
);

-- "My scores over time" and "this teacher's history" are the two reads.
create index if not exists teacher_monitoring_teacher_idx
  on public.teacher_monitoring (teacher_id, observed_on desc);
create index if not exists teacher_monitoring_booking_idx
  on public.teacher_monitoring (booking_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- A teacher reads their own record and nobody else's. Admins and above write.
alter table public.teacher_monitoring enable row level security;

drop policy if exists teacher_monitoring_own_read on public.teacher_monitoring;
create policy teacher_monitoring_own_read
  on public.teacher_monitoring for select
  using (auth.uid() = teacher_id);

drop policy if exists teacher_monitoring_staff_read on public.teacher_monitoring;
create policy teacher_monitoring_staff_read
  on public.teacher_monitoring for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('admin', 'super_admin', 'hr')
    )
  );

drop policy if exists teacher_monitoring_staff_write on public.teacher_monitoring;
create policy teacher_monitoring_staff_write
  on public.teacher_monitoring for insert
  with check (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

drop policy if exists teacher_monitoring_staff_update on public.teacher_monitoring;
create policy teacher_monitoring_staff_update
  on public.teacher_monitoring for update
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );
