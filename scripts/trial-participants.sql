-- ============================================================================
-- SARIRO — more than one child in a trial class
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it found.
-- Requires scripts/trial-booking.sql and scripts/class-feedback.sql first.
--
-- A trial can hold several children. The feedback side has assumed that from
-- the start — class_feedback is one row per author PER CHILD, and payGate()
-- withholds a teacher's pay until every child in the class is written up.
--
-- The booking side never caught up. bookings.trial_student_id holds exactly
-- one child, so a trial with three children in it could not be recorded, and
-- the per-child machinery had nothing to be per-child about.
--
-- ── Why a join table and not three bookings ─────────────────────────────────
-- Three bookings would be three classes: three slots in the teacher's diary,
-- three attendance rows, and — because the trial fee is per CLASS — three lots
-- of pay for one hour of work. It is one class with three children in it, and
-- the schema should say so.
--
-- ── trial_student_id stays ──────────────────────────────────────────────────
-- It is not replaced, it is demoted to "the first child", and everything that
-- reads it keeps working. A one-child trial writes both, so nothing that
-- already exists has to be migrated or dual-read. The participants table is
-- the truth when it has rows and the single column is the fallback when it
-- does not — which is what the backfill below makes true for every trial
-- booked before today.
-- ============================================================================

set search_path = public, extensions;

create table if not exists public.trial_participants (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  added_by    uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- The same child twice in one class is one child.
  constraint uq_trial_participant unique (booking_id, student_id)
);

create index if not exists trial_participants_booking_idx on public.trial_participants (booking_id);
create index if not exists trial_participants_student_idx on public.trial_participants (student_id);

comment on table public.trial_participants is
  'Every child in one trial class. bookings.trial_student_id remains as the first child so existing reads keep working. See lib/dashboard/class-feedback.ts for why feedback is per child.';

-- ── Backfill, so the table is the truth for every trial ─────────────────────
insert into public.trial_participants (booking_id, student_id)
select b.id, b.trial_student_id
  from public.bookings b
 where b.is_trial = true
   and b.trial_student_id is not null
on conflict (booking_id, student_id) do nothing;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.trial_participants enable row level security;

-- A teacher sees who is coming to their class; a child sees the class they are
-- in. Nobody sees a roster they are not part of — a parent has no business
-- knowing which other children are in a trial.
drop policy if exists participants_involved_read on public.trial_participants;
create policy participants_involved_read
  on public.trial_participants
  for select
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.bookings b
       where b.id = booking_id and b.teacher_id = auth.uid()
    )
  );

drop policy if exists participants_staff_all on public.trial_participants;
create policy participants_staff_all
  on public.trial_participants
  for all
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
  )
  with check (
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

-- ── What is there now ───────────────────────────────────────────────────────
do $$
declare
  v_trials  integer := 0;
  v_parts   integer := 0;
  v_multi   integer := 0;
begin
  select count(*) into v_trials from public.bookings where is_trial = true;
  select count(*) into v_parts  from public.trial_participants;
  select count(*) into v_multi from (
    select booking_id from public.trial_participants group by booking_id having count(*) > 1
  ) x;

  raise notice '── trial-participants ─────────────────────────────────';
  raise notice 'trial classes            : %', v_trials;
  raise notice 'children across them     : %', v_parts;
  raise notice 'classes with more than 1 : %', v_multi;
  raise notice '';
  raise notice 'A teacher is paid once per CLASS, not once per child — but the';
  raise notice 'pay is held until every child in it has been written up.';
end $$;
