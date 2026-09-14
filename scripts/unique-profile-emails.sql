-- ============================================================================
-- SARIRO — one email, one account
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- Sign-in emails (auth.users) were always unique — Supabase refuses a second
-- account with the same address. profiles.email is a COPY, and nothing kept the
-- copy honest. The free-class form wrote whatever address was verified onto
-- whoever was signed in, so staff booking a trial for a family while logged in
-- had the family's email written over their own profile. On 14 Sep 2026 three
-- addresses sat on seven profiles, one of them a super admin's.
--
-- The booking finds a family's account by that copy, so the wrong copy could
-- book a child's trial into a staff account. The app now checks both places
-- (src/lib/account/email-identity.ts). This makes the database refuse it:
--
--   1. repair     every profile's email becomes its own sign-in email
--   2. dedupe     a phone-only account (no sign-in email) keeps an address only
--                 if no other profile holds it
--   3. guard      a profile's email can only ever be its sign-in email —
--                 whatever a form, a route or a hand-typed UPDATE tries to set
--   4. sync       changing the sign-in email changes the profile with it
--   5. unique     one profile per address, case-insensitive
--
-- Phones are NOT made unique, on purpose: siblings share a parent's number,
-- and each child is their own account (see src/lib/trial/account.ts).
-- ============================================================================

set search_path = public;

-- ── 1. Repair ───────────────────────────────────────────────────────────────
-- The verified flag followed the wrong address too, so it is reset to what the
-- sign-in record actually knows.
update public.profiles p
   set email          = lower(btrim(u.email)),
       email_verified = (u.email_confirmed_at is not null)
  from auth.users u
 where u.id = p.id
   and nullif(btrim(u.email), '') is not null
   and p.email is distinct from lower(btrim(u.email));

-- Blank and mixed-case copies on accounts with no sign-in email.
update public.profiles
   set email = nullif(lower(btrim(email)), '')
 where email is not null
   and email is distinct from nullif(lower(btrim(email)), '');

-- ── 2. Dedupe ───────────────────────────────────────────────────────────────
-- After the repair, a shared address can only be on phone-only accounts (or on
-- one real owner plus phone-only copies). The owner keeps it; otherwise the
-- oldest profile does. Nothing is deleted — the copy is cleared.
with ranked as (
  select p.id,
         row_number() over (
           partition by lower(p.email)
           order by (lower(btrim(u.email)) = lower(p.email)) desc nulls last, p.created_at asc
         ) as rn
    from public.profiles p
    left join auth.users u on u.id = p.id
   where p.email is not null
)
update public.profiles p
   set email = null, email_verified = false
  from ranked r
 where r.id = p.id
   and r.rn > 1;

-- ── 3. Guard ────────────────────────────────────────────────────────────────
create or replace function public.profiles_email_follows_sign_in()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  sign_in text;
begin
  select nullif(lower(btrim(u.email)), '') into sign_in from auth.users u where u.id = new.id;
  if sign_in is not null then
    new.email := sign_in;                              -- never somebody else's address
  else
    new.email := nullif(lower(btrim(new.email)), '');  -- phone-only: normalised
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_email_follows_sign_in on public.profiles;
create trigger profiles_email_follows_sign_in
  before insert or update of email on public.profiles
  for each row execute function public.profiles_email_follows_sign_in();

-- ── 4. Sync ─────────────────────────────────────────────────────────────────
create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;  -- the guard normalises it
  end if;
  return new;
end;
$$;

drop trigger if exists sync_profile_email_from_auth on auth.users;
create trigger sync_profile_email_from_auth
  after update of email on auth.users
  for each row execute function public.sync_profile_email_from_auth();

-- ── 5. Unique ───────────────────────────────────────────────────────────────
create unique index if not exists profiles_email_unique
  on public.profiles (lower(email))
  where email is not null;

-- ── The one table ───────────────────────────────────────────────────────────
-- Expect: emails_still_shared 0, profiles_not_matching_sign_in 0, all three true.
select
  (select count(*) from public.profiles where email is not null)                        as profiles_with_email,
  (select count(*) from (select lower(email) from public.profiles where email is not null
                          group by 1 having count(*) > 1) d)                            as emails_still_shared,
  (select count(*) from public.profiles p join auth.users u on u.id = p.id
    where nullif(btrim(u.email), '') is not null
      and p.email is distinct from lower(btrim(u.email)))                                as profiles_not_matching_sign_in,
  exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'profiles_email_unique') as unique_index_present,
  exists (select 1 from pg_trigger where tgname = 'profiles_email_follows_sign_in')      as guard_present,
  exists (select 1 from pg_trigger where tgname = 'sync_profile_email_from_auth')        as sync_present;
