-- SARIRO — a phone number changes only by proving the new one, once a week
-- ============================================================================
-- The founder's policy (15 Sep 2026): a number is proved once, and changing it
-- means proving the new number — at most once a week.
--
-- Until now the browser wrote profiles.phone directly (Settings, the profile
-- modal), so anybody could type any number onto their account, and RLS — which
-- lets a user update their own row — was the only rule. The app now changes a
-- number only through /api/account/phone, which checks the code and the week
-- (src/lib/phone/account-phone.ts). This makes that the ONLY way:
--
--   1. profiles.phone_changed_at — when a number was last replaced.
--   2. A trigger refusing any change to phone, phone_verified,
--      phone_country_code or phone_changed_at that comes from a signed-in
--      browser (the `authenticated` / `anon` database roles). The server's
--      service role, Supabase's own auth service and the SQL editor are not
--      affected, so sign-up, trial booking and admin tools keep working.
--   3. The same on INSERT: a browser cannot create a profile that claims a
--      verified phone.
--
-- Safe to run more than once. Nothing is deleted. Ends with ONE SELECT to check.

alter table public.profiles
  add column if not exists phone_changed_at timestamptz;

comment on column public.profiles.phone_changed_at is
  'When the phone number was last replaced by a different one. A number changes at most once a week, only through /api/account/phone.';

-- Not SECURITY DEFINER on purpose: `current_user` must be the caller's role
-- (authenticated / anon from the browser; service_role from our server).
create or replace function public.guard_profile_phone()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.phone_verified := false;
    new.phone_changed_at := null;
    return new;
  end if;

  if new.phone is distinct from old.phone
     or new.phone_verified is distinct from old.phone_verified
     or new.phone_country_code is distinct from old.phone_country_code
     or new.phone_changed_at is distinct from old.phone_changed_at
  then
    raise exception 'A phone number can only be changed by verifying the new number in Settings.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_phone on public.profiles;
create trigger trg_guard_profile_phone
  before insert or update on public.profiles
  for each row
  execute function public.guard_profile_phone();

-- ── Check ───────────────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'profiles' and column_name = 'phone_changed_at') as changed_at_column_should_be_1,
  (select count(*) from pg_trigger
     where tgname = 'trg_guard_profile_phone' and not tgisinternal) as guard_trigger_should_be_1,
  (select count(*) from public.profiles where phone_verified) as accounts_with_verified_phone,
  (select count(*) from public.profiles where phone is null or btrim(phone) = '') as accounts_with_no_phone;
