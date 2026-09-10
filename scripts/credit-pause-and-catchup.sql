-- ============================================================================
-- SARIRO — two balances, and the lessons a group ran on without them
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- A credit is one class. When a family runs out, classes pause — but a GROUP
-- does not pause with them. It keeps going, so a child away for three weeks
-- comes back to a room that has moved on six lessons.
--
-- Paying again therefore buys two different things, and they cannot share a
-- balance: some of it pays for the lessons already missed, taught separately
-- in half-hour catch-up sessions, and the rest pays for carrying on with the
-- group. The arithmetic lives in lib/credits/allocation.ts (25 tests); this is
-- the shape it needs underneath.
--
-- A 1:1 student never splits. Nothing ran on without them — the curriculum
-- stopped where they left it — so every credit they buy is a main credit and
-- they restart at the next lesson.
--
-- ── The constraint that would have swallowed all of this ────────────────────
-- credit_transactions has a CHECK on `type` accepting exactly four values:
-- purchase, class_consumed, refund, admin_adjustment. Writing anything else
-- fails. Found by trying each type against production before writing a line of
-- code that depended on it — the same class of bug as student_leads_stage_check,
-- where the public booking form wrote a stage the database refused and no lead
-- was created for months.
--
-- The two genuinely new movements are added. The spec's other names —
-- CREDIT_PURCHASE, MANUAL_CREDIT_ADD, REGULAR_CLASS_DEBIT — are new names for
-- purchase, admin_adjustment and class_consumed, and are deliberately NOT
-- added: two names for one movement is how a ledger starts double-counting.
-- ============================================================================

set search_path = public, extensions;

-- ── 1. The second balance ───────────────────────────────────────────────────
alter table public.credits
  add column if not exists catchup_balance integer not null default 0;

comment on column public.credits.balance is
  'Main credits: one per ordinary class, spent when a class is marked complete.';
comment on column public.credits.catchup_balance is
  'Catch-Up Credits: one per lesson missed while paused, spent by a 30-minute catch-up session. Never called "doubt credits" anywhere a user can see.';

alter table public.credits drop constraint if exists credits_catchup_non_negative;
alter table public.credits
  add constraint credits_catchup_non_negative check (catchup_balance >= 0);

-- ── 2. The ledger has to say WHICH balance moved ────────────────────────────
alter table public.credit_transactions
  add column if not exists balance_kind text not null default 'main',
  -- §44. The same payment webhook firing twice must never buy two courses.
  add column if not exists payment_transaction_id text;

alter table public.credit_transactions drop constraint if exists credit_transactions_balance_kind_check;
alter table public.credit_transactions
  add constraint credit_transactions_balance_kind_check
  check (balance_kind in ('main', 'catchup'));

-- Partial, so the many rows with no payment reference do not collide on NULL.
create unique index if not exists credit_transactions_payment_once
  on public.credit_transactions(payment_transaction_id)
  where payment_transaction_id is not null;

-- The four that exist plus the two genuinely new movements. Probed against
-- production first; the previous list is a subset, so nothing already written
-- becomes invalid.
alter table public.credit_transactions drop constraint if exists credit_transactions_type_check;
alter table public.credit_transactions
  add constraint credit_transactions_type_check
  check (type in (
    'purchase',
    'class_consumed',
    'refund',
    'admin_adjustment',
    'catchup_allocation',      -- part of a purchase moved to the catch-up balance
    'catchup_session_debit'    -- a catch-up session was taught
  ));

-- ── 3. Being paused is a state with a clock on it ───────────────────────────
alter table public.profiles
  add column if not exists student_status text not null default 'active',
  add column if not exists credit_paused_at timestamptz,
  add column if not exists credit_grace_period_ends_at timestamptz;

alter table public.profiles drop constraint if exists profiles_student_status_check;
alter table public.profiles
  add constraint profiles_student_status_check
  check (student_status in ('active', 'paused_credit_issue', 'paused_credit_expired'));

comment on column public.profiles.credit_grace_period_ends_at is
  'Seven days from the pause. Until then the teacher, group, schedule and curriculum position are all held exactly as they were.';

-- ── 4. Every missed lesson, individually ────────────────────────────────────
-- "catchup_credit = 6" cannot tell a teacher what to teach. Six rows can.
create table if not exists public.catchup_lessons (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.profiles(id) on delete cascade,
  cohort_id         uuid references public.cohorts(id) on delete set null,
  teacher_id        uuid references public.profiles(id) on delete set null,
  track             text,
  level             text,
  lesson_number     integer not null,
  lesson_title      text,
  status            text not null default 'pending_scheduling',
  -- Its OWN clock. Five created together are five obligations, and scheduling
  -- two of them must not buy more time for the other three — otherwise an
  -- obligation can be deferred for ever, three days at a time.
  created_at        timestamptz not null default now(),
  scheduling_deadline timestamptz,
  -- The catch-up session itself, once one exists.
  booking_id        uuid references public.bookings(id) on delete set null,
  scheduled_at      timestamptz,
  completed_at      timestamptz,
  -- Which reminder the teacher has already had, so a scheduler running every
  -- ten minutes sends one message per stage rather than 144 a day.
  last_reminder     text,
  created_by        uuid references public.profiles(id) on delete set null,
  updated_at        timestamptz not null default now()
);

alter table public.catchup_lessons drop constraint if exists catchup_lessons_status_check;
alter table public.catchup_lessons
  add constraint catchup_lessons_status_check
  check (status in ('pending_scheduling', 'scheduled', 'completed', 'cancelled'));

-- One catch-up obligation per lesson per student. The same missed lesson must
-- never generate two catch-up credits, however many times a payment retries.
create unique index if not exists catchup_lessons_once
  on public.catchup_lessons(student_id, cohort_id, lesson_number)
  where status <> 'cancelled';

create index if not exists catchup_lessons_teacher_idx on public.catchup_lessons(teacher_id, status);
create index if not exists catchup_lessons_student_idx on public.catchup_lessons(student_id, status);
create index if not exists catchup_lessons_deadline_idx on public.catchup_lessons(scheduling_deadline)
  where status = 'pending_scheduling';

alter table public.catchup_lessons enable row level security;

drop policy if exists catchup_own on public.catchup_lessons;
create policy catchup_own on public.catchup_lessons
  for select using (
    student_id = auth.uid()
    or teacher_id = auth.uid()
    or exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and (p.is_admin or p.is_super_admin or p.is_hr
              or p.role in ('admin', 'super_admin', 'hr'))
    )
  );

-- ── 5. The business rules, in settings rather than in the code ──────────────
insert into public.app_settings (key, value) values
  ('credit_grace_period_days',        '7'),
  ('catchup_admin_escalation_hours',  '72'),
  ('catchup_hr_escalation_hours',     '120'),
  ('catchup_session_minutes',         '30'),
  ('catchup_teacher_incentive',       '200')
on conflict (key) do nothing;   -- never overwrite a number somebody has tuned

-- ── One table. Whether the shape is actually there. ────────────────────────
select 'credits.catchup_balance exists' as fact,
       case when exists (
         select 1 from information_schema.columns
          where table_name = 'credits' and column_name = 'catchup_balance'
       ) then 'yes' else 'NO' end as value
union all
select 'ledger accepts catchup_allocation',
       case when (select pg_get_constraintdef(oid) from pg_constraint
                   where conname = 'credit_transactions_type_check')
              like '%catchup_allocation%'
       then 'yes' else 'NO — ALLOCATION WRITES WILL BE REJECTED' end
union all
select 'catchup_lessons table', case when to_regclass('public.catchup_lessons') is not null then 'yes' else 'NO' end
union all
select 'students currently paused',
       count(*)::text from public.profiles where student_status <> 'active'
union all
select 'catch-up obligations outstanding',
       coalesce((select count(*)::text from public.catchup_lessons where status = 'pending_scheduling'), '0')
union all
select 'settings now configurable',
       count(*)::text || ' of 5'
  from public.app_settings
 where key in ('credit_grace_period_days','catchup_admin_escalation_hours',
               'catchup_hr_escalation_hours','catchup_session_minutes','catchup_teacher_incentive');
