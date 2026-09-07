-- ============================================================================
-- SARIRO — staff can see which teacher is trained for what
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints the policies it
-- found before and after, so the state is visible rather than assumed.
--
-- The capability chips went in and showed nothing. Not a rendering bug: the
-- browser cannot READ teacher_course_assignments. The service role sees eight
-- rows; a browser key sees zero. Row-level security is on and there is no
-- policy that lets an admin, HR or a seller look at somebody else's row.
--
-- So fetchTeachersWithAssignments returned every teacher with an empty
-- assignment list, and every chip rendered as "not eligible for anything yet".
-- The data was there the whole time.
--
-- ── Why this is read-only for staff ─────────────────────────────────────────
-- Writes already go through /api/admin/teacher-assignments, which runs as the
-- service role and checks the caller is an admin. Granting write here would
-- put a second, weaker door on the same room — and eligibility decides who is
-- allowed in front of a class.
--
-- ── Why a teacher can see their own ─────────────────────────────────────────
-- Their dashboard asks "what am I cleared to teach?", which is the question
-- they have most often after "what is next". That read is about themselves and
-- needs no admin.
-- ============================================================================

set search_path = public, extensions;

do $$
declare r record;
begin
  raise notice '── before ─────────────────────────────────────────────';
  for r in
    select tablename, policyname, cmd
      from pg_policies
     where schemaname = 'public'
       and tablename in ('teacher_course_assignments', 'parent_course_assignments')
     order by tablename, policyname
  loop
    raise notice '  % / % (%)', rpad(r.tablename, 28), r.policyname, r.cmd;
  end loop;
  if not found then
    raise notice '  (no policies at all — with RLS on, that means nobody can read it)';
  end if;

  for r in
    select relname, relrowsecurity
      from pg_class
     where relname in ('teacher_course_assignments', 'parent_course_assignments')
  loop
    raise notice '  RLS on %: %', rpad(r.relname, 28), r.relrowsecurity;
  end loop;
end $$;

alter table public.teacher_course_assignments enable row level security;

-- A teacher reads their own eligibility.
drop policy if exists tca_own_read on public.teacher_course_assignments;
create policy tca_own_read
  on public.teacher_course_assignments
  for select
  using (teacher_id = auth.uid());

-- Staff read everyone's. This is the one that was missing, and it is why the
-- chips were blank on every admin, HR and seller screen.
drop policy if exists tca_staff_read on public.teacher_course_assignments;
create policy tca_staff_read
  on public.teacher_course_assignments
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

-- Same table, same problem, for the parent side.
alter table public.parent_course_assignments enable row level security;

drop policy if exists pca_own_read on public.parent_course_assignments;
create policy pca_own_read
  on public.parent_course_assignments
  for select
  using (parent_id = auth.uid());

drop policy if exists pca_staff_read on public.parent_course_assignments;
create policy pca_staff_read
  on public.parent_course_assignments
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

-- ── A trial student can see their own trial ────────────────────────────────
-- Every existing bookings policy reaches a student through cohort_id ->
-- enrollments. A trial has NO cohort — that is the whole design — so a child
-- with a trial booked could not read the booking that has their name on it,
-- and the page told them "there is no class on your account yet".
--
-- Additive and narrow: it only ever grants a booking that names the caller,
-- either directly or through the participants table. Nothing else widens.
alter table public.bookings enable row level security;

drop policy if exists bookings_trial_student_read on public.bookings;
create policy bookings_trial_student_read
  on public.bookings
  for select
  using (
    trial_student_id = auth.uid()
    or exists (
      select 1 from public.trial_participants tp
       where tp.booking_id = bookings.id
         and tp.student_id = auth.uid()
    )
  );

do $$
declare
  r record;
  v_rows integer;
begin
  raise notice '';
  raise notice '── bookings policies ──────────────────────────────────';
  for r in
    select policyname, cmd from pg_policies
     where schemaname = 'public' and tablename = 'bookings'
     order by policyname
  loop
    raise notice '  % (%)', rpad(r.policyname, 34), r.cmd;
  end loop;

  raise notice '';
  raise notice '── after ──────────────────────────────────────────────';
  for r in
    select tablename, policyname, cmd
      from pg_policies
     where schemaname = 'public'
       and tablename in ('teacher_course_assignments', 'parent_course_assignments')
     order by tablename, policyname
  loop
    raise notice '  % / % (%)', rpad(r.tablename, 28), r.policyname, r.cmd;
  end loop;

  select count(*) into v_rows from public.teacher_course_assignments;
  raise notice '';
  raise notice 'eligibility rows in the table: %', v_rows;
  raise notice '';
  raise notice 'Reload a dashboard — the chips should now name the subjects';
  raise notice 'each teacher is cleared for. Green is trained, amber is not.';
end $$;
