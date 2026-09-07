-- ============================================================================
-- SARIRO — URGENT: bookings is unreadable, and I broke it
-- ============================================================================
-- Run this now. Safe to re-run. Prints what it found.
--
-- eligibility-visibility.sql added a policy letting a trial student read the
-- booking with their name on it. That policy queries trial_participants. The
-- trial_participants policy queries bookings. Postgres evaluates one to answer
-- the other, forever:
--
--     42P17: infinite recursion detected in policy for relation "bookings"
--
-- Every browser read of bookings now fails with a 500. That is the student
-- dashboard, the teacher calendar, the class list, the join button — the lot.
-- The service role is unaffected, which is why the API routes kept working and
-- the damage is invisible from the server side.
--
-- ── Why a SECURITY DEFINER function fixes it ────────────────────────────────
-- A policy cannot ask a question whose answer depends on itself. A function
-- marked SECURITY DEFINER runs as its owner and does NOT re-enter row-level
-- security, so the question is answered once and the cycle never forms.
--
-- Both functions below are deliberately narrow: they take a booking and a
-- user and answer one boolean about that pair. They cannot be used to read a
-- row, only to ask whether a specific person belongs to a specific class.
-- ============================================================================

set search_path = public, extensions;

-- ── The two questions that were causing the loop ───────────────────────────
create or replace function public.is_trial_participant(p_booking uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trial_participants tp
     where tp.booking_id = p_booking and tp.student_id = p_user
  );
$$;

create or replace function public.teaches_booking(p_booking uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bookings b
     where b.id = p_booking and b.teacher_id = p_user
  );
$$;

revoke all on function public.is_trial_participant(uuid, uuid) from public;
revoke all on function public.teaches_booking(uuid, uuid) from public;
grant execute on function public.is_trial_participant(uuid, uuid) to authenticated;
grant execute on function public.teaches_booking(uuid, uuid) to authenticated;

-- ── Rebuild both policies without the cycle ────────────────────────────────
drop policy if exists bookings_trial_student_read on public.bookings;
create policy bookings_trial_student_read
  on public.bookings
  for select
  using (
    trial_student_id = auth.uid()
    or public.is_trial_participant(id, auth.uid())
  );

drop policy if exists participants_involved_read on public.trial_participants;
create policy participants_involved_read
  on public.trial_participants
  for select
  using (
    student_id = auth.uid()
    or public.teaches_booking(booking_id, auth.uid())
  );

-- ── And a leaderboard the whole internet could read ────────────────────────
-- student_leaderboard is a VIEW, and a view does not carry the row-level
-- security of the tables underneath it. An unauthenticated caller holding the
-- anon key — which ships in the page source of every visit — could list
-- children by full name, with their cohort and their points.
--
-- The grant was written for `authenticated` only; anon had it anyway. Revoked
-- explicitly, because "it was never granted" is not the same as "it is not
-- granted".
revoke all on public.student_leaderboard from anon;
grant select on public.student_leaderboard to authenticated;

do $$
declare
  r record;
  v_left integer := 0;
begin
  raise notice '── recursive policies still present ───────────────────';
  for r in
    select c.relname, p.polname
      from pg_policy p join pg_class c on c.oid = p.polrelid
     where c.relname in ('bookings', 'trial_participants')
     order by c.relname, p.polname
  loop
    raise notice '  % / %', rpad(r.relname, 22), r.polname;
  end loop;

  raise notice '';
  raise notice '── who can read the leaderboard now ───────────────────';
  for r in
    select grantee, privilege_type
      from information_schema.role_table_grants
     where table_name = 'student_leaderboard'
     order by grantee
  loop
    raise notice '  %  %', rpad(r.grantee, 20), r.privilege_type;
    if r.grantee = 'anon' then v_left := v_left + 1; end if;
  end loop;

  raise notice '';
  if v_left > 0 then
    raise notice 'anon STILL has access to the leaderboard — tell Claude.';
  else
    raise notice 'anon can no longer read the leaderboard.';
  end if;
  raise notice '';
  raise notice 'Reload a student dashboard. Classes should appear again.';
end $$;
