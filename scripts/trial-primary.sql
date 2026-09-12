-- ══════════════════════════════════════════════════════════════════════════
-- SARIRO — which trial counts, now, for a course and grade
-- ══════════════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL editor. It is safe to run twice.
--
-- ── Why ─────────────────────────────────────────────────────────────────────
-- A child may hold one live trial per course AND grade, and may book the pair
-- again: after sitting the first one (a retry), or by replacing an upcoming
-- one. Every booking they have ever made stays in their history — so nothing
-- in the table says which of them is the CURRENT one.
--
-- This column does. The newest booking for a pair is the primary; the ones it
-- replaced keep their rows, their status and their place in the history.
--
-- ── Deploy order does not matter ────────────────────────────────────────────
-- The code writes this column through bestEffort(). Before this script runs,
-- those writes fail and are logged, and bookings still work — the app simply
-- cannot mark a primary yet.
-- ══════════════════════════════════════════════════════════════════════════

alter table public.bookings
  add column if not exists is_primary_trial boolean;

comment on column public.bookings.is_primary_trial is
  'For trials only: the current booking for this student + course + grade. Earlier ones (cancelled, superseded or already sat) stay in history with false.';

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Until now one live trial per COURSE was the rule, so every trial that was
-- not cancelled is the current one for its pair. Cancelled trials never are.
update public.bookings
   set is_primary_trial = (status is distinct from 'cancelled')
 where is_trial is true
   and is_primary_trial is null;

-- Reading "the current trial for this child" should not scan the table.
create index if not exists bookings_primary_trial_idx
  on public.bookings (trial_student_id, trial_subject)
  where is_trial is true and is_primary_trial is true;

notify pgrst, 'reload schema';

-- ── One SELECT, so the editor shows the result that matters ────────────────
select
  (select count(*) from public.bookings where is_trial is true)                              as trials_total,
  (select count(*) from public.bookings where is_trial is true and is_primary_trial is true) as marked_primary,
  (select count(*) from public.bookings where is_trial is true and is_primary_trial is false) as marked_not_primary,
  (select count(*) from public.bookings where is_trial is true and is_primary_trial is null)  as still_unmarked,
  (select count(*) from pg_indexes where indexname = 'bookings_primary_trial_idx')            as index_present;
