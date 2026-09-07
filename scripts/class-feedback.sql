-- ============================================================================
-- SARIRO — two opinions about one class, and the pay that depends on one
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it found.
--
-- A trial class produces the most valuable thing the company has: two
-- independent reads on whether a child and Sariro suit each other. The teacher
-- saw them work; the parent watched them enjoy it or not. A seller ringing
-- afterwards without both is guessing.
--
-- None of it was being captured anywhere.
--
-- ── One row per child, not one per class ────────────────────────────────────
-- A trial can hold several children. "The class went well" is worthless to a
-- seller with three families to ring, so the teacher writes one rating and one
-- remark PER CHILD and the seller gets three separate answers.
--
-- ── The two sides never mix ─────────────────────────────────────────────────
-- author_role says who is holding the pen, and the two are averaged separately
-- everywhere. A teacher rating a child says nothing about the teacher, and
-- letting the two into one average would let somebody raise their own standing
-- by being generous. See lib/dashboard/class-feedback.ts.
--
-- ── The teacher's is mandatory, the parent's is not ─────────────────────────
-- The teacher is paid for the class, and reporting on it is part of teaching
-- it — so pay is held until every child is written up. A parent owes us
-- nothing; a form that blocks a parent is a form that loses the parent.
-- ============================================================================

set search_path = public, extensions;

create table if not exists public.class_feedback (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references public.bookings(id) on delete cascade,
  author_id          uuid not null references public.profiles(id) on delete cascade,
  author_role        text not null check (author_role in ('teacher', 'student')),
  -- The child this is ABOUT. For a parent's own feedback, themselves.
  subject_student_id uuid references public.profiles(id) on delete set null,
  rating             smallint check (rating between 1 and 5),
  remarks            text,
  -- Teacher only, and the single most useful field a seller has.
  interest_level     text check (interest_level in ('hot', 'warm', 'cold')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- One person writes about one child once per class. Editing updates it.
  constraint uq_class_feedback unique (booking_id, author_id, subject_student_id)
);

create index if not exists class_feedback_booking_idx on public.class_feedback (booking_id);
create index if not exists class_feedback_subject_idx on public.class_feedback (subject_student_id);
create index if not exists class_feedback_role_idx    on public.class_feedback (author_role, created_at desc);

comment on table public.class_feedback is
  'What the teacher and the parent each said about a class. One row per author per child. Averaged separately by author_role — see lib/dashboard/class-feedback.ts.';

-- ── What a completed trial pays ─────────────────────────────────────────────
-- Flat, regardless of tier or ratio: a trial is the same half hour of work
-- whoever teaches it, and tying it to the course rate would make the cheapest
-- trials the least attractive to take.
create table if not exists public.trial_pay_settings (
  id          boolean primary key default true check (id),
  amount      numeric(10,2) not null default 100.00,
  updated_at  timestamptz not null default now()
);
insert into public.trial_pay_settings (id, amount)
  values (true, 100.00)
  on conflict (id) do nothing;

comment on table public.trial_pay_settings is
  'The flat fee for one completed trial class. One row, by construction.';

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.class_feedback enable row level security;

-- You write your own, about a class you were actually in.
drop policy if exists feedback_own_write on public.class_feedback;
create policy feedback_own_write
  on public.class_feedback
  for all
  using (author_id = auth.uid())
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.bookings b
       where b.id = booking_id
         and (b.teacher_id = auth.uid() or b.trial_student_id = auth.uid())
    )
  );

-- Staff read everything: this is what the seller acts on and what HR reviews.
-- Deliberately read-only — nobody edits somebody else's opinion of a class.
drop policy if exists feedback_staff_read on public.class_feedback;
create policy feedback_staff_read
  on public.class_feedback
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

-- ── What is there now ───────────────────────────────────────────────────────
do $$
declare
  v_fb     integer := 0;
  v_trials integer := 0;
  v_amount numeric;
begin
  select count(*) into v_fb from public.class_feedback;
  select count(*) into v_trials from public.bookings where is_trial = true;
  select amount into v_amount from public.trial_pay_settings where id;

  raise notice '── class-feedback ─────────────────────────────────────';
  raise notice 'feedback rows           : %', v_fb;
  raise notice 'trial classes booked    : %', v_trials;
  raise notice 'flat pay per trial      : Rs %', v_amount;
  raise notice '';
  raise notice 'A teacher is not paid for a trial until every child in it is';
  raise notice 'written up — a rating AND remarks. The seller rings the parent';
  raise notice 'off the back of those remarks, so "good" does not count.';
end $$;
