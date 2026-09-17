-- ============================================================================
-- SARIRO — URGENT: close two holes found by security-db-audit.sql (17 Sep 2026)
-- ============================================================================
-- Run this NOW, before Saturday. One transaction. Safe to run more than once.
-- It changes no data — only who may call two functions and who may edit a class.
--
-- 1. ANYBODY COULD MARK ANY EMAIL "VERIFIED" — and then be signed into it
--    request_email_otp(email, code) takes the code FROM THE CALLER and stores
--    it. It was meant for our server only, but a revoke "from public" does not
--    remove Supabase's own grants to anon/authenticated, so any browser could:
--      request_email_otp('<anybody>@…', '123456') → verify_email_otp(same) →
--      book a free class with that address → signed straight into that account.
--    (The phone versions were revoked correctly in phone-otp.sql and are fine.)
--    Our API routes call these with the service role, which keeps access.
--
-- 2. ANY SIGNED-IN USER COULD EDIT ANY CLASS
--    Policy bookings_all_update was USING (true) for every signed-in user —
--    and anybody can sign up. That includes a class's Google Meet link: a
--    stranger could point children's classes at their own meeting, cancel
--    classes, or mark them completed (which moves credits and teacher pay).
--    Now: the class's own teacher, or an admin / super admin. The app's browser
--    screens only ever did those two things (teacher-data.ts: a teacher's
--    status/reschedule of their own class; admin-data.ts: an admin reassigning
--    a teacher). Everything else goes through our API with the service role.
--
-- ============================================================================

begin;

-- ── 1. Email-code functions: our server only ────────────────────────────────
revoke all on function public.request_email_otp(text, text, text) from public, anon, authenticated;
revoke all on function public.verify_email_otp(text, text)        from public, anon, authenticated;
revoke all on function public.email_is_verified(text)             from public, anon, authenticated;
grant execute on function public.request_email_otp(text, text, text) to service_role;
grant execute on function public.verify_email_otp(text, text)        to service_role;
grant execute on function public.email_is_verified(text)             to service_role;

-- ── 2. Who may edit a class ─────────────────────────────────────────────────
-- Security definer so the check reads profiles without tripping profiles' own
-- policies (see scripts/fix-rls-recursion.sql for what that recursion does).
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

drop policy if exists bookings_all_update on public.bookings;
drop policy if exists bookings_teacher_or_admin_update on public.bookings;
create policy bookings_teacher_or_admin_update on public.bookings
  for update to authenticated
  using      (teacher_id = auth.uid() or public.sariro_is_admin())
  with check (teacher_id = auth.uid() or public.sariro_is_admin());

commit;

-- One result set. Expect: the three email columns false, the old policy gone,
-- and update_policies listing only policies that are not "true" for everyone.
select
  has_function_privilege('anon', 'public.request_email_otp(text, text, text)', 'EXECUTE')          as visitor_can_request_email_code,
  has_function_privilege('authenticated', 'public.request_email_otp(text, text, text)', 'EXECUTE') as signed_in_can_request_email_code,
  has_function_privilege('anon', 'public.verify_email_otp(text, text)', 'EXECUTE')                 as visitor_can_verify_email_code,
  has_function_privilege('anon', 'public.email_is_verified(text)', 'EXECUTE')                      as visitor_can_check_email,
  exists (select 1 from pg_policy where polrelid = 'public.bookings'::regclass and polname = 'bookings_all_update') as old_update_policy_still_there,
  (select string_agg(format('%s: %s', polname, coalesce(pg_get_expr(polqual, polrelid), '(none)')), ' | ')
     from pg_policy where polrelid = 'public.bookings'::regclass and polcmd in ('w', '*'))            as update_policies;
