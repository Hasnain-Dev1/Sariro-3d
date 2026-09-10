-- ============================================================================
-- SARIRO — proving the email, the way the phone is already proved
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- The trial booking page collects an email and does nothing to check it. That
-- is fine while the email is optional decoration and not fine now: the spec
-- makes it a step, and the address becomes how the family signs in afterwards.
-- An unverified address there means an account nobody can get into, and a typo
-- means an account belonging to somebody else entirely.
--
-- ── Deliberately the same shape as phone_verifications ──────────────────────
-- Same table layout, same two functions, same rate limits, same hashing. Two
-- verification systems that drift are two sets of rules to reason about, and
-- the second one always ends up the weaker. Anything learned about one applies
-- to the other.
--
-- The rate limits are the point, and they live HERE rather than in the route:
--   · 30 seconds between codes for one address
--   · 5 codes a day for one address, on India's day boundary
--   · 5 wrong guesses and that code is dead
--   · codes expire after 10 minutes
--   · stored as a bcrypt hash, never in the clear
--
-- A limit enforced in a route is a limit that a second route forgets. In the
-- database it is unavoidable.
-- ============================================================================

set search_path = public, extensions;

create extension if not exists pgcrypto;

create table if not exists public.email_verifications (
  email        text primary key,
  otp_hash     text not null,
  expires_at   timestamptz not null,
  attempts     integer not null default 0,
  verified_at  timestamptz,
  last_sent_at timestamptz,
  sent_today   integer not null default 0,
  sent_day     date,
  last_ip      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.email_verifications is
  'One row per email address being verified. Mirrors phone_verifications exactly — same limits, same hashing, same functions.';

/* No policies, deliberately. Only the security-definer functions below touch
   this table, so an anon key can never read a hash or a send count. */
alter table public.email_verifications enable row level security;

-- ============================================================================
-- request_email_otp — may this address be sent a code right now?
-- ============================================================================
create or replace function public.request_email_otp(
  p_email text,
  p_otp   text,
  p_ip    text default null
)
returns table (allowed boolean, retry_after integer, reason text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row      public.email_verifications;
  v_now      timestamptz := now();
  v_today    date := (v_now at time zone 'Asia/Kolkata')::date;
  v_cooldown constant integer := 30;
  v_daily    constant integer := 5;
  v_ttl      constant interval := interval '10 minutes';
  v_wait     integer;
  v_count    integer;
begin
  select * into v_row from public.email_verifications where email = p_email for update;

  if found then
    if v_row.last_sent_at is not null then
      v_wait := v_cooldown - floor(extract(epoch from (v_now - v_row.last_sent_at)))::integer;
      if v_wait > 0 then
        return query select false, v_wait, 'cooldown'::text;
        return;
      end if;
    end if;

    -- India's day boundary, because that is where the families are.
    v_count := case when v_row.sent_day = v_today then v_row.sent_today else 0 end;
    if v_count >= v_daily then
      return query select false, 0, 'daily_cap'::text;
      return;
    end if;
  else
    v_count := 0;
  end if;

  insert into public.email_verifications as ev (
    email, otp_hash, expires_at, attempts, verified_at,
    last_sent_at, sent_today, sent_day, last_ip, updated_at
  ) values (
    p_email, crypt(p_otp, gen_salt('bf', 8)), v_now + v_ttl, 0, null,
    v_now, v_count + 1, v_today, p_ip, v_now
  )
  on conflict (email) do update set
    otp_hash     = excluded.otp_hash,
    expires_at   = excluded.expires_at,
    attempts     = 0,
    -- A new code un-verifies the address, for the same reason it does on the
    -- phone: otherwise somebody who verified once stays verified while codes
    -- are being sent to a different person's inbox.
    verified_at  = null,
    last_sent_at = excluded.last_sent_at,
    sent_today   = excluded.sent_today,
    sent_day     = excluded.sent_day,
    last_ip      = excluded.last_ip,
    updated_at   = excluded.updated_at;

  return query select true, 0, 'ok'::text;
end;
$$;

-- ============================================================================
-- verify_email_otp — one guess, counted
-- ============================================================================
--   reason  'ok' | 'no_code' | 'expired' | 'too_many_attempts' | 'wrong'
create or replace function public.verify_email_otp(
  p_email text,
  p_otp   text
)
returns table (verified boolean, reason text, attempts_left integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row     public.email_verifications;
  v_max     constant integer := 5;
  v_now     timestamptz := now();
begin
  select * into v_row from public.email_verifications where email = p_email for update;

  if not found then
    return query select false, 'no_code'::text, 0;
    return;
  end if;

  if v_row.expires_at < v_now then
    return query select false, 'expired'::text, 0;
    return;
  end if;

  if v_row.attempts >= v_max then
    return query select false, 'too_many_attempts'::text, 0;
    return;
  end if;

  -- The guess is counted BEFORE it is judged, so a crash between the two
  -- cannot hand out a free attempt.
  update public.email_verifications
     set attempts = attempts + 1, updated_at = v_now
   where email = p_email;

  if v_row.otp_hash = crypt(p_otp, v_row.otp_hash) then
    update public.email_verifications
       set verified_at = v_now, updated_at = v_now
     where email = p_email;
    return query select true, 'ok'::text, v_max - v_row.attempts - 1;
    return;
  end if;

  return query select false, 'wrong'::text, v_max - v_row.attempts - 1;
end;
$$;

-- ============================================================================
-- email_is_verified — asked of the DATABASE, never of the request body
-- ============================================================================
-- The booking route calls this rather than trusting a flag in the POST. A
-- claim in a request body has proved nothing, and this is the boundary between
-- "somebody typed an address" and "somebody read a code we sent to it".
create or replace function public.email_is_verified(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.email_verifications
     where email = lower(trim(p_email))
       and verified_at is not null
       -- An hour. Long enough to finish a booking, short enough that a shared
       -- machine does not leave somebody else verified.
       and verified_at > now() - interval '1 hour'
  );
$$;

revoke all on function public.request_email_otp(text, text, text) from public;
revoke all on function public.verify_email_otp(text, text) from public;
grant execute on function public.request_email_otp(text, text, text) to service_role;
grant execute on function public.verify_email_otp(text, text) to service_role;
grant execute on function public.email_is_verified(text) to service_role, authenticated, anon;

-- ── One table. Whether the pieces are actually there. ──────────────────────
select 'email_verifications table' as fact,
       case when to_regclass('public.email_verifications') is not null then 'yes' else 'NO' end as value
union all
select 'request_email_otp',
       case when exists (select 1 from pg_proc where proname = 'request_email_otp') then 'yes' else 'NO' end
union all
select 'verify_email_otp',
       case when exists (select 1 from pg_proc where proname = 'verify_email_otp') then 'yes' else 'NO' end
union all
select 'email_is_verified',
       case when exists (select 1 from pg_proc where proname = 'email_is_verified') then 'yes' else 'NO' end
union all
select 'addresses verified so far',
       coalesce((select count(*)::text from public.email_verifications where verified_at is not null), '0');
