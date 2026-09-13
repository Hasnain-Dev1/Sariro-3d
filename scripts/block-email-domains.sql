-- ══════════════════════════════════════════════════════════════════════════
-- SARIRO — no account from these email domains, however it is attempted
-- ══════════════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL editor. It is safe to run twice.
--
-- ── Why a trigger, and not just the forms ───────────────────────────────────
-- The booking form and the API routes already refuse these domains, with a
-- friendly message (src/lib/email/disposable.ts). But an account is also made
-- by Google sign-in, and by anybody calling Supabase directly with the public
-- key — neither of which ever passes through our code. A competitor's staff
-- member signing in with their work Google account would sail straight in.
--
-- A BEFORE INSERT trigger on auth.users is the one place every route to an
-- account has to go through. It refuses the row, so the account never exists.
--
-- ── Adding a domain later ───────────────────────────────────────────────────
--   insert into public.blocked_email_domains (domain, reason)
--   values ('example.com', 'why');
-- No deploy needed for the hard block. Add it to disposable.ts too, so the
-- form says why instead of showing a generic error.
--
-- ── What this does NOT do ───────────────────────────────────────────────────
-- Existing accounts on these domains are left alone — nothing is deleted. The
-- last SELECT lists them, so a person can decide.
-- ══════════════════════════════════════════════════════════════════════════

create table if not exists public.blocked_email_domains (
  domain      text primary key check (domain = lower(domain) and domain not like '%@%'),
  reason      text,
  created_at  timestamptz not null default now()
);

comment on table public.blocked_email_domains is
  'Email domains no account may be created with. Enforced by a trigger on auth.users; mirrored in src/lib/email/disposable.ts for friendly form errors.';

insert into public.blocked_email_domains (domain, reason) values
  ('94an.com',           'throwaway inbox'),
  ('fusioninbox.com',    'throwaway inbox'),
  ('fpklm.com',          'throwaway inbox'),
  ('ooynib.com',         'throwaway inbox'),
  ('codingal.com',       'competitor'),
  ('brightchamps.com',   'competitor'),
  ('98thpercentile.com', 'competitor')
on conflict (domain) do nothing;

-- Nobody reads or writes this from a browser. No policies means no access,
-- except through the definer function below and the service role.
alter table public.blocked_email_domains enable row level security;

-- ── The rule, in one function ───────────────────────────────────────────────
-- The domain is taken from the LAST @, and subdomains belong to their parent:
-- mail.94an.com is 94an.com's.
create or replace function public.email_domain_blocked(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with d as (
    select lower(substring(trim(coalesce(p_email, '')) from '@([^@]+)$')) as domain
  )
  select exists (
    select 1
      from public.blocked_email_domains b, d
     where d.domain is not null
       and (d.domain = b.domain or d.domain like '%.' || b.domain)
  );
$$;

create or replace function public.refuse_blocked_email_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null and public.email_domain_blocked(new.email) then
    raise exception 'Accounts cannot be created with this email domain.'
      using errcode = 'P0001',
            hint = 'Listed in public.blocked_email_domains.';
  end if;
  return new;
end;
$$;

-- On insert (every new account) and on a change of address, so an existing
-- account cannot simply be moved onto a blocked domain afterwards.
drop trigger if exists refuse_blocked_email_account on auth.users;
create trigger refuse_blocked_email_account
  before insert or update of email on auth.users
  for each row
  execute function public.refuse_blocked_email_account();

-- ── One SELECT, so the editor shows the result that matters ────────────────
select
  (select count(*) from public.blocked_email_domains)                              as domains_blocked,
  (select count(*) from pg_trigger
    where tgname = 'refuse_blocked_email_account' and not tgisinternal)            as trigger_present,
  public.email_domain_blocked('someone@94an.com')                                  as check_94an,
  public.email_domain_blocked('staff@codingal.com')                                as check_codingal,
  public.email_domain_blocked('parent@gmail.com')                                  as check_gmail_is_allowed,
  (select string_agg(email, ', ')
     from auth.users
    where public.email_domain_blocked(email))                                      as existing_accounts_on_blocked_domains;
