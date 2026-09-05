-- ============================================================================
-- SARIRO — phone verification for the free class booking
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- A free class costs a mentor half an hour. Until now anyone could book one by
-- typing any ten digits, and the only way to find out the number was fake was
-- for a seller to ring it.
--
-- ── Why the rules live here and not in the API route ────────────────────────
-- Every SMS costs money, and a code that can be guessed is not verification.
-- The three rules that make this work — how often a number may be sent to, how
-- many guesses a code gets, and how long it lives — are enforced by these
-- functions, not by the caller. A second code path added later gets them for
-- free instead of having to remember them.
--
-- ── The code is never stored ────────────────────────────────────────────────
-- Only a bcrypt hash of it. Six digits is a million possibilities, which is
-- nothing to a machine with the hashes — but the hashes are what a leaked
-- backup contains, and a bcrypt hash of a code that expired ten minutes ago is
-- worth nothing to anybody.
--
-- Guessing is stopped by the attempt cap instead: five wrong answers and the
-- code is dead, so a million possibilities means a one-in-two-hundred-thousand
-- chance per code rather than a certainty given time.
--
-- ── Rate limits ─────────────────────────────────────────────────────────────
--   30 seconds  between codes to the same number
--   5 codes     per number per day
--   5 attempts  per code
--   10 minutes  before a code expires
--
-- The daily cap is the one that protects the SMS balance. Without it, a script
-- pointed at the form sends until the account is empty, and then no parent gets
-- a code — including the ones who paid.
-- ============================================================================

create extension if not exists pgcrypto;
set search_path = public, extensions;

create table if not exists public.phone_verifications (
  -- E.164, always. See lib/phone/india.ts: a number typed four ways is one
  -- phone, and storing it as typed makes it four rows that never match.
  phone            text primary key,

  otp_hash         text,
  expires_at       timestamptz,
  attempts         integer not null default 0,

  -- Cleared whenever a new code is issued: verifying an old code must not keep
  -- a number verified forever once somebody starts changing it.
  verified_at      timestamptz,

  last_sent_at     timestamptz,
  -- Reset when sent_day rolls over, so the cap is per day without a cron job.
  sent_today       integer not null default 0,
  sent_day         date,

  last_ip          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.phone_verifications is
  'One row per phone number. Holds a bcrypt hash of the current OTP, never the code. Written only by request_phone_otp() and verify_phone_otp().';

create index if not exists phone_verifications_verified_idx
  on public.phone_verifications (verified_at) where verified_at is not null;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Enabled with NO policy: nothing reaches this table from a browser under any
-- role. Everything goes through the security definer functions below, which is
-- what makes the rate limits unavoidable rather than merely usual.
alter table public.phone_verifications enable row level security;
revoke all on public.phone_verifications from anon, authenticated;

-- ============================================================================
-- request_phone_otp — may this number be sent a code, and store its hash
-- ============================================================================
-- Returns what the caller needs to decide what to do next, and nothing about
-- the code itself.
--
--   allowed        send the SMS
--   retry_after    seconds to wait, when it is too soon
--   reason         'ok' | 'cooldown' | 'daily_cap'
create or replace function public.request_phone_otp(
  p_phone text,
  p_otp   text,
  p_ip    text default null
)
returns table (allowed boolean, retry_after integer, reason text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row      public.phone_verifications;
  v_now      timestamptz := now();
  v_today    date := (v_now at time zone 'Asia/Kolkata')::date;
  v_cooldown constant integer := 30;
  v_daily    constant integer := 5;
  v_ttl      constant interval := interval '10 minutes';
  v_wait     integer;
  v_count    integer;
begin
  select * into v_row from public.phone_verifications where phone = p_phone for update;

  if found then
    -- Too soon since the last one.
    if v_row.last_sent_at is not null then
      v_wait := v_cooldown - floor(extract(epoch from (v_now - v_row.last_sent_at)))::integer;
      if v_wait > 0 then
        return query select false, v_wait, 'cooldown'::text;
        return;
      end if;
    end if;

    -- The day boundary is India's, because that is where the numbers are.
    v_count := case when v_row.sent_day = v_today then v_row.sent_today else 0 end;
    if v_count >= v_daily then
      return query select false, 0, 'daily_cap'::text;
      return;
    end if;
  else
    v_count := 0;
  end if;

  insert into public.phone_verifications as pv (
    phone, otp_hash, expires_at, attempts, verified_at,
    last_sent_at, sent_today, sent_day, last_ip, updated_at
  ) values (
    p_phone, crypt(p_otp, gen_salt('bf', 8)), v_now + v_ttl, 0, null,
    v_now, v_count + 1, v_today, p_ip, v_now
  )
  on conflict (phone) do update set
    otp_hash     = excluded.otp_hash,
    expires_at   = excluded.expires_at,
    attempts     = 0,
    -- A new code un-verifies the number. Otherwise somebody who verified once
    -- stays verified while a different person is being sent codes for it.
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
-- verify_phone_otp — one guess, counted
-- ============================================================================
--   verified   the number is now verified
--   reason     'ok' | 'no_code' | 'expired' | 'too_many_attempts' | 'wrong'
--   attempts_left  what to tell the person
create or replace function public.verify_phone_otp(
  p_phone text,
  p_otp   text
)
returns table (verified boolean, reason text, attempts_left integer)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row        public.phone_verifications;
  v_max        constant integer := 5;
begin
  select * into v_row from public.phone_verifications where phone = p_phone for update;

  if not found or v_row.otp_hash is null then
    return query select false, 'no_code'::text, 0;
    return;
  end if;

  -- Already verified and no newer code outstanding: saying yes again is
  -- correct and saves a person who double-submitted from being told no.
  if v_row.verified_at is not null then
    return query select true, 'ok'::text, v_max;
    return;
  end if;

  if v_row.expires_at < now() then
    return query select false, 'expired'::text, 0;
    return;
  end if;

  if v_row.attempts >= v_max then
    return query select false, 'too_many_attempts'::text, 0;
    return;
  end if;

  -- Counted BEFORE the comparison, so a caller that crashes mid-way has still
  -- spent the guess. An attempt cap that only counts successful round trips is
  -- not a cap.
  update public.phone_verifications
     set attempts = attempts + 1, updated_at = now()
   where phone = p_phone;

  if v_row.otp_hash = crypt(p_otp, v_row.otp_hash) then
    update public.phone_verifications
       set verified_at = now(),
           -- The code has done its job. Keeping it lets a leaked backup replay.
           otp_hash = null,
           updated_at = now()
     where phone = p_phone;
    return query select true, 'ok'::text, v_max;
    return;
  end if;

  return query select false, 'wrong'::text, greatest(0, v_max - (v_row.attempts + 1));
end;
$$;

-- ============================================================================
-- phone_is_verified — the question the booking route asks
-- ============================================================================
-- Deliberately separate, and deliberately not something the browser can call:
-- the booking route must establish this for itself rather than believe a flag
-- the form sent it.
--
-- Verification lasts an hour. Long enough to finish a form, short enough that
-- a shared machine does not hand the next person a verified number.
create or replace function public.phone_is_verified(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.phone_verifications
     where phone = p_phone
       and verified_at is not null
       and verified_at > now() - interval '1 hour'
  );
$$;

-- ============================================================================
-- Grants
-- ============================================================================
-- Only the service role. These functions are reached from our API routes,
-- which hold the SMS key; a browser that could call request_phone_otp() could
-- spend the SMS balance directly.
revoke execute on function public.request_phone_otp(text, text, text) from public, anon, authenticated;
revoke execute on function public.verify_phone_otp(text, text)        from public, anon, authenticated;
revoke execute on function public.phone_is_verified(text)             from public, anon, authenticated;

grant execute on function public.request_phone_otp(text, text, text) to service_role;
grant execute on function public.verify_phone_otp(text, text)        to service_role;
grant execute on function public.phone_is_verified(text)             to service_role;
