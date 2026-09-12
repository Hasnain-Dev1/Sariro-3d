-- ══════════════════════════════════════════════════════════════════════════
-- SARIRO — the two reasons a TRIAL is called off
-- ══════════════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL editor. It is safe to run twice.
--
-- ── Why ─────────────────────────────────────────────────────────────────────
-- bookings.cancel_type lists the five reasons a PAID class is ever cancelled:
-- student_1to1, teacher_leave, doubt_session, group_blocked, admin. A trial is
-- none of them, so every attempt to cancel one was refused by the CHECK — and
-- refused silently, because the error was never read.
--
-- The damage was specific and bad: the child's seat was deleted, the booking
-- stayed 'scheduled', and the class sat on a teacher's calendar with nobody in
-- it. Found by cancelling a real trial against this database and looking.
--
-- Two reasons are added:
--   trial_cancelled   the family called it off themselves
--   trial_superseded  they rebooked the same course and grade, and this is the
--                     booking the new one replaced
--
-- ── Deploy order does not matter ────────────────────────────────────────────
-- The code now retries without the label when the CHECK refuses it, so a trial
-- is cancelled either way. Running this only restores the label.
-- ══════════════════════════════════════════════════════════════════════════

-- The existing constraint was created inline with the column, so its name is
-- whatever Postgres chose. Find it by what it checks rather than by guessing.
do $$
declare c record;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.bookings'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%cancel_type%'
  loop
    execute format('alter table public.bookings drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.bookings
  add constraint bookings_cancel_type_check
  check (cancel_type is null or cancel_type in (
    'student_1to1',
    'teacher_leave',
    'doubt_session',
    'group_blocked',
    'admin',
    -- Trials.
    'trial_cancelled',
    'trial_superseded'
  ));

notify pgrst, 'reload schema';

-- ── One SELECT, so the editor shows the result that matters ────────────────
select
  conname                              as constraint_name,
  pg_get_constraintdef(oid)            as definition
from pg_constraint
where conrelid = 'public.bookings'::regclass
  and conname = 'bookings_cancel_type_check';
