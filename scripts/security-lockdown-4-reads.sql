-- ============================================================================
-- SARIRO — lock-down #4: who may READ people, classes and batches (17 Sep 2026)
-- ============================================================================
-- Until now three rules were USING (true) for every signed-in user — and
-- anybody can sign up:
--   profiles_all_read   every parent's and student's email and phone, grades,
--                       teacher pay rates, seller salaries
--   bookings_all_read   every class, including its Google Meet and recording link
--   cohorts_all_read    every batch, including its Meet link
--
-- Replaced with what each screen actually reads (checked in the code, 17 Sep):
--   staff (admin, super admin, HR, seller)  everything, as before
--   a student   their own profile; the classes of their batches; the teacher of
--               those classes and of their trials; their classmates (the
--               student dashboard lists classmates by name)
--   a teacher   the classes and students of batches they teach; their trial
--               students; their own reporting admin and HR (teacher-managers)
--   anybody     the people they share a conversation with (messages)
-- The existing bookings_trial_student_read rule (a trial's own students) stays.
-- Leaderboards read through their views and are not affected.
--
-- Our API routes use the service role and are not affected at all.
-- One transaction. Changes no data. Rollback at the bottom.
-- ============================================================================

begin;

-- ── Who may see a person ────────────────────────────────────────────────────
-- Security definer: it reads enrollments, bookings, trial_participants,
-- profiles and conversation_members without their own rules getting in the way
-- (and without the profiles rule calling itself).
create or replace function public.sariro_can_see_profile(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- somebody in one of my batches (my classmates, my students)
    exists (select 1 from public.enrollments e
             where e.user_id = p_other and e.cohort_id in (select unnest(public.user_cohort_ids())))
    -- somebody who teaches one of my batches
    or exists (select 1 from public.bookings b
                where b.teacher_id = p_other and b.cohort_id in (select unnest(public.user_cohort_ids())))
    -- the teacher of my trial
    or exists (select 1 from public.bookings b
                where b.teacher_id = p_other
                  and (b.trial_student_id = auth.uid()
                       or exists (select 1 from public.trial_participants tp
                                   where tp.booking_id = b.id and tp.student_id = auth.uid())))
    -- a student in a trial I teach
    or exists (select 1 from public.bookings b
                where b.teacher_id = auth.uid()
                  and (b.trial_student_id = p_other
                       or exists (select 1 from public.trial_participants tp
                                   where tp.booking_id = b.id and tp.student_id = p_other)))
    -- my own reporting admin or HR
    or exists (select 1 from public.profiles me
                where me.id = auth.uid() and p_other in (me.reporting_admin_id, me.reporting_hr_id))
    -- somebody I share a conversation with
    or exists (select 1 from public.conversation_members m1
                 join public.conversation_members m2 on m2.conversation_id = m1.conversation_id
                where m1.user_id = auth.uid() and m2.user_id = p_other);
$$;
revoke all on function public.sariro_can_see_profile(uuid) from public, anon;
grant execute on function public.sariro_can_see_profile(uuid) to authenticated, service_role;

-- ── profiles ────────────────────────────────────────────────────────────────
drop policy if exists profiles_all_read on public.profiles;
drop policy if exists profiles_related_read on public.profiles;
create policy profiles_related_read on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or (select public.current_user_role()) in ('admin', 'super_admin', 'hr', 'seller')
    or public.sariro_can_see_profile(id)
  );

-- ── bookings (classes) ──────────────────────────────────────────────────────
drop policy if exists bookings_all_read on public.bookings;
drop policy if exists bookings_involved_read on public.bookings;
create policy bookings_involved_read on public.bookings
  for select to authenticated
  using (
    teacher_id = auth.uid()
    or cohort_id in (select unnest(public.user_cohort_ids()))
    or (select public.current_user_role()) in ('admin', 'super_admin', 'hr', 'seller')
  );

-- ── cohorts (batches) ───────────────────────────────────────────────────────
drop policy if exists cohorts_all_read on public.cohorts;
drop policy if exists cohorts_involved_read on public.cohorts;
create policy cohorts_involved_read on public.cohorts
  for select to authenticated
  using (
    id in (select unnest(public.user_cohort_ids()))
    or (select public.current_user_role()) in ('admin', 'super_admin', 'hr', 'seller')
  );

commit;

-- ── Test: what one real student and one real staff member would now see ─────
-- Pretends to be each of them for a moment (the role switch and the pretend
-- sign-in last only inside the block). The last result set is the answer:
-- the student should see a handful of profiles (themselves, classmates,
-- teachers) — not profiles_total — and the super admin every row.
create temporary table if not exists _who_sees (viewer text, profiles_visible bigint, classes_visible bigint, batches_visible bigint, profiles_total bigint);
truncate _who_sees;

do $$
declare
  v_student uuid := (select id from public.profiles
                      where coalesce(role, 'student') = 'student'
                        and not coalesce(is_admin, false) and not coalesce(is_super_admin, false)
                        and not coalesce(is_hr, false) and not coalesce(is_seller, false) and not coalesce(is_teacher, false)
                      order by created_at desc limit 1);
  v_staff uuid := (select id from public.profiles where role = 'super_admin' or is_super_admin limit 1);
  v_total bigint := (select count(*) from public.profiles);
  v_who uuid;
  v_label text;
  p bigint; b bigint; c bigint;
begin
  foreach v_label in array array['a student', 'the super admin'] loop
    v_who := case when v_label = 'a student' then v_student else v_staff end;
    continue when v_who is null;
    perform set_config('request.jwt.claims', json_build_object('sub', v_who, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_who::text, true);
    execute 'set local role authenticated';
    select count(*) into p from public.profiles;
    select count(*) into b from public.bookings;
    select count(*) into c from public.cohorts;
    execute 'reset role';
    insert into _who_sees values (v_label, p, b, c, v_total);
  end loop;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

select * from _who_sees;

-- ── Rollback (only if a dashboard breaks) ────────────────────────────────────
-- begin;
-- drop policy if exists profiles_related_read on public.profiles;
-- drop policy if exists bookings_involved_read on public.bookings;
-- drop policy if exists cohorts_involved_read on public.cohorts;
-- create policy profiles_all_read on public.profiles for select to authenticated using (true);
-- create policy bookings_all_read on public.bookings for select to authenticated using (true);
-- create policy cohorts_all_read  on public.cohorts  for select to authenticated using (true);
-- commit;
