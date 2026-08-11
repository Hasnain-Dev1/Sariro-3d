-- ============================================================================
-- SARIRO — Rescheduling, cancellation policy, pay, training gate, parents,
--          doubt sessions, and student support chat
-- ============================================================================
-- One migration for the whole "class operations policy" build. Idempotent and
-- safe to run more than once (IF NOT EXISTS / guarded DO blocks everywhere).
-- Run AFTER cohort-scheduling.sql, teacher-earnings-*.sql, role-hierarchy.sql.
-- ============================================================================

-- ── 1. Booking reschedule / cancel / pay bookkeeping ───────────────────────
alter table public.bookings add column if not exists reschedule_initiator text
  check (reschedule_initiator in ('student', 'teacher', 'admin'));
alter table public.bookings add column if not exists rescheduled_from   timestamptz;
alter table public.bookings add column if not exists reschedule_count   int not null default 0;
alter table public.bookings add column if not exists rescheduled_by     uuid references public.profiles(id);
alter table public.bookings add column if not exists rescheduled_at     timestamptz;

-- NOTE: bookings.cancelled_by already exists as a uuid in some environments
-- (the user who cancelled). We keep that meaning and store the ROLE separately.
alter table public.bookings add column if not exists cancel_actor_role  text
  check (cancel_actor_role in ('student', 'teacher', 'admin', 'hr', 'system'));
alter table public.bookings add column if not exists cancelled_by       uuid references public.profiles(id);
alter table public.bookings add column if not exists cancelled_at       timestamptz;
alter table public.bookings add column if not exists cancel_reason      text;
-- Why the class ended without being taught — drives teacher pay.
alter table public.bookings add column if not exists cancel_type        text
  check (cancel_type in ('student_1to1', 'teacher_leave', 'doubt_session', 'group_blocked', 'admin'));
-- Pay outcome for the teacher on a cancelled class.
alter table public.bookings add column if not exists pay_status         text
  check (pay_status in ('full', 'partial', 'zero'));

-- ── 2. Teacher course-training gate ────────────────────────────────────────
-- A teacher may VIEW curriculum for an assigned course, but can only be picked
-- in the scheduling tool once a super-admin marks their training complete.
alter table public.teacher_course_assignments add column if not exists training_completed_at timestamptz;
alter table public.teacher_course_assignments add column if not exists training_completed_by uuid references public.profiles(id);

-- ── 3. Parent role + parent course eligibility ─────────────────────────────
alter table public.profiles add column if not exists is_parent boolean not null default false;

create table if not exists public.parent_course_assignments (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  track       text not null,
  level       text not null,
  assigned_by uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (parent_id, track, level)
);
create index if not exists idx_parent_course_assignments_parent on public.parent_course_assignments(parent_id);

-- ── 4. Doubt sessions (HR-approved => full pay when conducted) ──────────────
create table if not exists public.doubt_sessions (
  id             uuid primary key default gen_random_uuid(),
  cohort_id      uuid references public.cohorts(id) on delete set null,
  booking_id     uuid references public.bookings(id) on delete set null,
  teacher_id     uuid not null references public.profiles(id),
  requested_by   uuid references public.profiles(id),
  status         text not null default 'requested'
                 check (status in ('requested', 'hr_approved', 'rejected', 'conducted', 'cancelled')),
  hr_approved_by uuid references public.profiles(id),
  hr_approved_at timestamptz,
  conducted_at   timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_doubt_sessions_teacher on public.doubt_sessions(teacher_id);
create index if not exists idx_doubt_sessions_status  on public.doubt_sessions(status);

-- ── 5. Student support chat (routes to the teacher's assigned admin) ────────
create table if not exists public.support_queries (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.profiles(id) on delete cascade,
  assigned_admin_id uuid references public.profiles(id),   -- resolved from teacher.reporting_admin_id
  cohort_id        uuid references public.cohorts(id) on delete set null,
  subject          text not null,
  status           text not null default 'open'
                   check (status in ('open', 'pending', 'resolved', 'closed')),
  last_message_at  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_support_queries_student on public.support_queries(student_id);
create index if not exists idx_support_queries_admin   on public.support_queries(assigned_admin_id);
create index if not exists idx_support_queries_status  on public.support_queries(status);

create table if not exists public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  query_id   uuid not null references public.support_queries(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id),
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_support_messages_query on public.support_messages(query_id, created_at);

-- ── 6. Monthly teacher self-serve cancellation counter (helper view) ───────
-- Counts a teacher's own cancellations in the current calendar month (UTC).
create or replace view public.teacher_cancellations_this_month as
  select teacher_id, count(*)::int as cancel_count
  from public.bookings
  where cancel_actor_role = 'teacher'
    and cancelled_at >= date_trunc('month', now())
  group by teacher_id;

-- ── 7. updated_at triggers (reuse shared helper) ───────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'touch_updated_at'
  ) then
    create function public.touch_updated_at()
    returns trigger language plpgsql as $fn$
    begin new.updated_at = now(); return new; end;
    $fn$;
  end if;
end $$;

drop trigger if exists trg_doubt_sessions_updated_at on public.doubt_sessions;
create trigger trg_doubt_sessions_updated_at before update on public.doubt_sessions
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_support_queries_updated_at on public.support_queries;
create trigger trg_support_queries_updated_at before update on public.support_queries
  for each row execute function public.touch_updated_at();

-- ── 8. RLS ─────────────────────────────────────────────────────────────────
alter table public.parent_course_assignments enable row level security;
alter table public.doubt_sessions            enable row level security;
alter table public.support_queries           enable row level security;
alter table public.support_messages          enable row level security;

-- Helper predicate inline: admin/super-admin.
-- parent_course_assignments: super-admin manages; a parent reads their own.
drop policy if exists pca_superadmin_all on public.parent_course_assignments;
create policy pca_superadmin_all on public.parent_course_assignments for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role = 'super_admin' or p.is_super_admin = true)))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role = 'super_admin' or p.is_super_admin = true)));
drop policy if exists pca_parent_read on public.parent_course_assignments;
create policy pca_parent_read on public.parent_course_assignments for select
  using (parent_id = auth.uid());

-- doubt_sessions: teacher sees own; admin/hr/super see all.
drop policy if exists ds_teacher_read on public.doubt_sessions;
create policy ds_teacher_read on public.doubt_sessions for select
  using (teacher_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('admin','super_admin','hr') or p.is_admin = true or p.is_super_admin = true or p.is_hr = true)));
drop policy if exists ds_staff_write on public.doubt_sessions;
create policy ds_staff_write on public.doubt_sessions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('admin','super_admin','hr') or p.is_admin = true or p.is_super_admin = true or p.is_hr = true)))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('admin','super_admin','hr') or p.is_admin = true or p.is_super_admin = true or p.is_hr = true)));

-- support_queries: student owner reads/creates; assigned admin + any admin reads.
drop policy if exists sq_student_rw on public.support_queries;
create policy sq_student_rw on public.support_queries for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
drop policy if exists sq_admin_read on public.support_queries;
create policy sq_admin_read on public.support_queries for select
  using (assigned_admin_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('admin','super_admin') or p.is_admin = true or p.is_super_admin = true)));
drop policy if exists sq_admin_update on public.support_queries;
create policy sq_admin_update on public.support_queries for update
  using (assigned_admin_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid()
    and (p.role in ('admin','super_admin') or p.is_admin = true or p.is_super_admin = true)));

-- support_messages: participants (query owner or assigned/any admin) read+insert.
drop policy if exists sm_participant_read on public.support_messages;
create policy sm_participant_read on public.support_messages for select
  using (exists (
    select 1 from public.support_queries q where q.id = support_messages.query_id
      and (q.student_id = auth.uid() or q.assigned_admin_id = auth.uid()
        or exists (select 1 from public.profiles p where p.id = auth.uid()
          and (p.role in ('admin','super_admin') or p.is_admin = true or p.is_super_admin = true)))));
drop policy if exists sm_participant_insert on public.support_messages;
create policy sm_participant_insert on public.support_messages for insert
  with check (sender_id = auth.uid() and exists (
    select 1 from public.support_queries q where q.id = support_messages.query_id
      and (q.student_id = auth.uid() or q.assigned_admin_id = auth.uid()
        or exists (select 1 from public.profiles p where p.id = auth.uid()
          and (p.role in ('admin','super_admin') or p.is_admin = true or p.is_super_admin = true)))));

-- ============================================================================
-- Rollback (if ever needed):
--   drop view if exists public.teacher_cancellations_this_month;
--   drop table if exists public.support_messages;
--   drop table if exists public.support_queries;
--   drop table if exists public.doubt_sessions;
--   drop table if exists public.parent_course_assignments;
--   alter table public.profiles drop column if exists is_parent;
--   alter table public.teacher_course_assignments drop column if exists training_completed_at, drop column if exists training_completed_by;
--   -- (bookings policy columns can be left in place; drop individually if required)
-- ============================================================================
