-- ============================================================================
-- SARIRO — URGENT #2: what a signed-in user may WRITE (17 Sep 2026)
-- ============================================================================
-- From scripts/security-policy-dump.sql, run by the founder. Anybody can sign
-- up, so "any signed-in user" means anybody on the internet. Run today.
-- One transaction; safe to run more than once; changes no data.
--
-- V-024  A USER COULD MAKE THEMSELVES SUPER ADMIN
--        profiles_self_update lets a user update EVERY column of their own row,
--        and nothing in the database protects the role columns. From any
--        browser console:  profiles.update({ role: 'super_admin' })  — and every
--        admin API believes profiles.role. Also teacher_rate, seller_base_salary,
--        phone (skipping the WhatsApp code), reporting managers, tiers...
--        Fix: a trigger that lets a signed-in user change only what the site's
--        own screens change — full_name, timezone, track, email,
--        profile_completed, avatar_url. Everything else changes through our API
--        (service role), which the trigger does not touch.
--
-- V-025  STUDENTS COULD SET THEIR OWN CREDIT BALANCE
--        credits.students_update_own_credits. No screen uses it; balances only
--        change through our API and database triggers. Removed.
--
-- V-026  STUDENTS COULD ENROL THEMSELVES, OR MOVE INTO ANY BATCH, WITHOUT PAYING
--        enrollments_insert_own lets a user insert an enrolment for themselves;
--        enrollments_update_own_completion lets them edit every column of their
--        own (cohort_id, status, track, level). The site's screens only ever:
--        an ADMIN adds an enrolment (admin-data.ts), and a student marks the
--        completion popup seen or drops a course (student-data.ts,
--        global-upsell-popup.tsx). Fix: inserts by admins only; a student's own
--        update may change only completion_shown_at, or status to 'dropped'.
--
-- V-027  ANYBODY COULD CREATE A CLASS
--        bookings_all_insert is WITH CHECK (true): a class with any teacher, in
--        any batch, with any Meet link — shown to those children as their class.
--        The site's screens only insert as the teacher of that class
--        (teacher-data.ts createBooking) or as an admin (admin-data.ts).
--
-- Rollback for any single part is at the bottom, commented out.
-- ============================================================================

begin;

-- ── Needs sariro_is_admin() from security-urgent-lockdown.sql; recreated here
--    so this file also stands alone.
create or replace function public.sariro_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid()
       and (p.role in ('admin', 'super_admin') or p.is_admin = true or p.is_super_admin = true)
  );
$$;
revoke all on function public.sariro_is_admin() from public, anon;
grant execute on function public.sariro_is_admin() to authenticated, service_role;

-- ── V-024: profiles — a signed-in user changes only their own harmless fields ─
-- current_user is 'authenticated' (or 'anon') only for requests from a browser.
-- Our API (service_role), the SQL editor (postgres) and security-definer
-- functions run as other roles and are not affected.
create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allowed constant text[] := array['full_name', 'timezone', 'track', 'email', 'profile_completed', 'avatar_url', 'updated_at'];
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    -- A new account's own row: never born with a role or pay.
    if coalesce(new.role, 'student') <> 'student'
       or new.is_admin is true or new.is_super_admin is true or new.is_hr is true
       or new.is_seller is true or new.is_teacher is true
       or new.teacher_rate is not null or new.seller_base_salary is not null then
      raise exception 'Only an administrator can set roles or pay.' using errcode = '42501';
    end if;
    return new;
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'That change has to be made by an administrator.' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- "__" so it runs before any other trigger on the table and judges exactly
-- what the browser asked for.
drop trigger if exists __guard_profile_self_update on public.profiles;
create trigger __guard_profile_self_update
  before insert or update on public.profiles
  for each row execute function public.guard_profile_self_update();

-- ── V-025: credits ──────────────────────────────────────────────────────────
drop policy if exists students_update_own_credits on public.credits;

-- ── V-026: enrollments ──────────────────────────────────────────────────────
drop policy if exists enrollments_insert_own on public.enrollments;
drop policy if exists enrollments_insert_admin on public.enrollments;
create policy enrollments_insert_admin on public.enrollments
  for insert to authenticated
  with check (public.sariro_is_admin());

create or replace function public.guard_enrollment_self_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  allowed constant text[] := array['completion_shown_at', 'status', 'updated_at'];
begin
  if current_user not in ('authenticated', 'anon') or public.sariro_is_admin() then
    return new;
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed)
     or (new.status is distinct from old.status and new.status <> 'dropped') then
    raise exception 'That change has to be made by an administrator.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists __guard_enrollment_self_update on public.enrollments;
create trigger __guard_enrollment_self_update
  before update on public.enrollments
  for each row execute function public.guard_enrollment_self_update();

-- ── V-027: bookings — only the class's own teacher, or an admin, creates one ─
drop policy if exists bookings_all_insert on public.bookings;
drop policy if exists bookings_teacher_or_admin_insert on public.bookings;
create policy bookings_teacher_or_admin_insert on public.bookings
  for insert to authenticated
  with check (teacher_id = auth.uid() or public.sariro_is_admin());

commit;

-- ── Check, and every remaining write rule for signed-in users to review ─────
-- First rows: the four fixes (expect true, true, false, false, false).
-- Then one row per INSERT/UPDATE/DELETE/ALL policy on any table that browsers
-- can reach and that is not limited to admins — send this back for review.
select * from (
  select 1 as ord, 'check' as kind, 'profile guard installed' as name,
         exists (select 1 from pg_trigger where tgname = '__guard_profile_self_update')::text as detail
  union all select 1, 'check', 'enrolment guard installed',
         exists (select 1 from pg_trigger where tgname = '__guard_enrollment_self_update')::text
  union all select 1, 'check', 'students_update_own_credits still there',
         exists (select 1 from pg_policy where polrelid = 'public.credits'::regclass and polname = 'students_update_own_credits')::text
  union all select 1, 'check', 'enrollments_insert_own still there',
         exists (select 1 from pg_policy where polrelid = 'public.enrollments'::regclass and polname = 'enrollments_insert_own')::text
  union all select 1, 'check', 'bookings_all_insert still there',
         exists (select 1 from pg_policy where polrelid = 'public.bookings'::regclass and polname = 'bookings_all_insert')::text
  union all
  select 2, 'write policy', format('%s.%s [%s]', c.relname, p.polname,
           case p.polcmd when 'a' then 'INSERT' when 'w' then 'UPDATE' when 'd' then 'DELETE' else 'ALL' end),
         format('roles=%s | using=%s | check=%s',
           (select string_agg(case when r = 0 then 'public' else r::regrole::text end, ',') from unnest(p.polroles) r),
           coalesce(pg_get_expr(p.polqual, p.polrelid), '-'),
           coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '-'))
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and p.polcmd in ('a', 'w', 'd', '*')
     and coalesce(pg_get_expr(p.polqual, p.polrelid), '') !~ '(current_user_role\(\)|sariro_is_admin\(\))'
     and coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') !~ '(current_user_role\(\)|sariro_is_admin\(\))'
     and exists (select 1 from unnest(p.polroles) r where r = 0 or r in ('anon'::regrole, 'authenticated'::regrole))
) out
order by ord, name;

-- ── Rollback (only if a screen breaks; run the one block you need) ───────────
-- drop trigger if exists __guard_profile_self_update on public.profiles;
-- drop trigger if exists __guard_enrollment_self_update on public.enrollments;
-- create policy enrollments_insert_own on public.enrollments for insert to authenticated
--   with check ((user_id = auth.uid()) or (current_user_role() = any (array['admin','super_admin'])));
-- create policy bookings_all_insert on public.bookings for insert to authenticated with check (true);
-- (students_update_own_credits is not restored: nothing used it.)
