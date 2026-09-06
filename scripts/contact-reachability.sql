-- ============================================================================
-- SARIRO — one number, one shape, and a verified flag that means something
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it changed.
--
-- Companion to lib/contact/reachability.ts, which added the rule that an
-- account with no usable phone number is Unknown and cannot be given a course.
-- The rule is only as good as the column it reads, and that column has two
-- problems this script fixes and one it can only report.
--
-- ── 1. phone_verified has never been true, for anybody ──────────────────────
-- The column exists. The Profile type declares it. Nothing has ever written
-- it. All twenty-two accounts say false, including the two numbers that went
-- through the OTP flow and passed. A column that always answers the same thing
-- is worse than a missing one, because code gets written against it.
--
-- phone_verifications already holds the truth — a verified_at timestamp per
-- number, canonically formatted. This copies it across.
--
-- ── 2. One number is stored in five different shapes ────────────────────────
--   9709123454        +91 6296914378      +916296914378
--   +977 9709123454   8296110149
--
-- Three of those are the same human. To any lookup they are three people: the
-- verification check misses, the duplicate-account check misses, and a seller
-- ringing round rings the same family twice.
--
-- Whitespace and dashes come out of anything that already carries a country
-- code. That is lossless — `+91 62969 14378` and `+916296914378` are the same
-- string with the same meaning — so it is done without asking.
--
-- ── 3. What this deliberately does NOT do ───────────────────────────────────
-- It does not put +91 on a bare ten-digit number.
--
-- On the live data that would be a real mistake, not a theoretical one.
-- `9709123454` sits on one profile with no country code, and the SAME ten
-- digits sit on two sibling profiles as `+977 9709123454` — Nepal. Guessing
-- India would move that family's number to a different country, and if some
-- Indian subscriber happens to hold those digits, we would eventually send
-- their class reminders to a stranger.
--
-- So bare numbers are listed at the end instead, for a person to confirm one
-- at a time. There are only a handful. A number is worth asking about.
-- ============================================================================

set search_path = public, extensions;

-- ── Faster lookups by number ───────────────────────────────────────────────
-- "Is this caller one of ours?" and the duplicate-account check both scan
-- profiles by phone, and there was no index on it.
create index if not exists profiles_phone_idx on public.profiles (phone)
  where phone is not null;

do $$
declare
  v_trimmed  integer := 0;
  v_verified integer := 0;
  v_bare     integer := 0;
  r          record;
begin
  -- ── 1. Squeeze the spaces and dashes out of international numbers ────────
  -- Only where a '+' country code is already present, so nothing is inferred.
  update public.profiles
     set phone = '+' || regexp_replace(phone, '[^0-9]', '', 'g')
   where phone is not null
     and btrim(phone) like '+%'
     and phone <> '+' || regexp_replace(phone, '[^0-9]', '', 'g');
  get diagnostics v_trimmed = row_count;

  -- ── 2. Carry the OTP results onto the profiles ───────────────────────────
  -- Matched on the canonical +91… form that phone_verifications stores, so a
  -- profile only matches once step 1 has put it in the same shape.
  --
  -- A bare number is NOT matched by assuming +91 for the comparison. The same
  -- ten digits exist on this database under +977, and marking a Nepali family
  -- verified because an Indian subscriber with those digits passed an OTP is
  -- the exact failure this whole file is about. Bare numbers stay unverified
  -- until somebody says which country they are — they are listed below.
  update public.profiles p
     set phone_verified = true
    from public.phone_verifications v
   where v.verified_at is not null
     and coalesce(p.phone_verified, false) = false
     and '+' || regexp_replace(p.phone, '[^0-9]', '', 'g') = v.phone;
  get diagnostics v_verified = row_count;

  raise notice '── contact-reachability ────────────────────────────────';
  raise notice 'reshaped to canonical E.164 : %', v_trimmed;
  raise notice 'marked phone_verified       : %', v_verified;

  -- ── 3. Report what a human has to decide ─────────────────────────────────
  raise notice '';
  raise notice 'Accounts with NO phone — Unknown, and cannot be given a course:';
  for r in
    select coalesce(full_name, '(no name)') as who, coalesce(email, '(no email)') as mail, role
      from public.profiles
     where phone is null or btrim(phone) = ''
     order by created_at
  loop
    raise notice '  %  %  [%]', rpad(r.who, 26), rpad(r.mail, 36), coalesce(r.role, '-');
  end loop;

  raise notice '';
  raise notice 'Numbers stored with no country code — confirm the country, then fix:';
  for r in
    select coalesce(full_name, '(no name)') as who, phone, coalesce(email, '') as mail
      from public.profiles
     where phone is not null
       and btrim(phone) <> ''
       and btrim(phone) not like '+%'
     order by full_name
  loop
    v_bare := v_bare + 1;
    raise notice '  %  %  %', rpad(r.who, 26), rpad(r.phone, 18), r.mail;
  end loop;
  raise notice '(% bare number(s). An Indian mobile becomes +91<10 digits>.)', v_bare;

  raise notice '';
  raise notice 'One number on more than one account (siblings, or one person twice):';
  for r in
    select regexp_replace(phone, '[^0-9]', '', 'g') as digits,
           count(*) as n,
           string_agg(coalesce(full_name, email, '?'), ', ') as who
      from public.profiles
     where phone is not null and btrim(phone) <> ''
     group by 1
    having count(*) > 1
     order by 2 desc
  loop
    raise notice '  %  ×%  →  %', rpad(r.digits, 16), r.n, r.who;
  end loop;
end $$;
