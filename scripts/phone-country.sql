-- ============================================================================
-- SARIRO — the country a person is in, kept apart from the code you dial them on
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it changed.
--
-- We had been reading a country OFF a phone number, and it does not work.
--
-- The Rakhecha family are in India and carry a Nepali number. Four accounts,
-- all +977 9709123454. For a while one of them said +91, because somebody
-- reasoned "they are in India, so their number starts +91" — and those exact
-- ten digits under +91 belong to a stranger in India. That is where a class
-- reminder would have gone.
--
-- So the dialling code and the country are now two columns. The code says
-- which network to ring. It says nothing about where somebody lives, where
-- they are billed, or which timezone their class is in.
--
-- ── What this adds ──────────────────────────────────────────────────────────
--   profiles.phone_country_code   ISO 3166-1 alpha-2 — 'IN', 'NP', 'PK'
--
-- ISO, not a dial code, because +1 is both the United States and Canada. A
-- column that cannot tell them apart is a column that quietly relabels every
-- Canadian customer as American.
--
-- ── What it backfills, and what it refuses to ───────────────────────────────
-- Only where the dial code is unambiguous. +91 is India and nothing else, so
-- that is filled in. +1 is left NULL on purpose: guessing between two
-- countries is exactly the class of mistake this migration exists to stop, and
-- an honest NULL can be asked about later while a wrong value never gets
-- questioned again.
--
-- Numbers with no country code at all are left alone and listed at the end.
-- ============================================================================

set search_path = public, extensions;

alter table public.profiles
  add column if not exists phone_country_code text;

comment on column public.profiles.phone_country_code is
  'ISO 3166-1 alpha-2 of the phone number''s country. Separate from the number on purpose: the dial code is not evidence of where the person lives. See lib/phone/countries.ts.';

-- Only the two-letter shape, so a dial code cannot be written here by mistake.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_profiles_phone_country_code'
  ) then
    alter table public.profiles
      add constraint chk_profiles_phone_country_code
      check (phone_country_code is null or phone_country_code ~ '^[A-Z]{2}$');
  end if;
end $$;

create index if not exists profiles_phone_country_idx
  on public.profiles (phone_country_code)
  where phone_country_code is not null;

do $$
declare
  v_filled integer := 0;
  v_amb    integer := 0;
  v_bare   integer := 0;
  r        record;
begin
  -- ── Backfill from unambiguous dial codes only ────────────────────────────
  -- Longest first, so +977 is never read as +9 followed by a stray 77.
  update public.profiles p
     set phone_country_code = m.code
    from (values
      ('+977', 'NP'), ('+880', 'BD'), ('+974', 'QA'), ('+973', 'BH'),
      ('+971', 'AE'), ('+968', 'OM'), ('+966', 'SA'), ('+965', 'KW'),
      ('+254', 'KE'), ('+243', 'CD'), ('+234', 'NG'),
      ('+94', 'LK'), ('+92', 'PK'), ('+91', 'IN'), ('+65', 'SG'),
      ('+64', 'NZ'), ('+61', 'AU'), ('+60', 'MY'), ('+49', 'DE'),
      ('+44', 'GB'), ('+33', 'FR'), ('+27', 'ZA')
    ) as m(dial, code)
   where p.phone like m.dial || '%'
     and p.phone_country_code is null;
  get diagnostics v_filled = row_count;

  raise notice '── phone-country ──────────────────────────────────────';
  raise notice 'country filled in from the dial code : %', v_filled;

  -- ── +1 is deliberately not guessed ───────────────────────────────────────
  select count(*) into v_amb
    from public.profiles
   where phone like '+1%' and phone_country_code is null;
  if v_amb > 0 then
    raise notice '';
    raise notice '% number(s) start +1 — United States or Canada, left NULL rather than guessed:', v_amb;
    for r in
      select coalesce(full_name, email, '(unnamed)') as who, phone
        from public.profiles
       where phone like '+1%' and phone_country_code is null
    loop
      raise notice '  %  %', rpad(r.who, 26), r.phone;
    end loop;
  end if;

  -- ── Anything still without a code ────────────────────────────────────────
  raise notice '';
  raise notice 'Numbers with no country code at all — ask, do not assume:';
  for r in
    select coalesce(full_name, email, '(unnamed)') as who, phone
      from public.profiles
     where phone is not null and btrim(phone) <> '' and btrim(phone) not like '+%'
  loop
    v_bare := v_bare + 1;
    raise notice '  %  %', rpad(r.who, 26), r.phone;
  end loop;
  if v_bare = 0 then
    raise notice '  (none)';
  end if;

  -- ── Where everybody ended up ─────────────────────────────────────────────
  raise notice '';
  raise notice 'Accounts by country:';
  for r in
    select coalesce(phone_country_code, '—') as cc, count(*) as n
      from public.profiles
     where phone is not null and btrim(phone) <> ''
     group by 1 order by 2 desc
  loop
    raise notice '  %  %', rpad(r.cc, 4), r.n;
  end loop;

  raise notice '';
  raise notice 'Only IN can be sent an SMS — apitxt.com delivers to India only.';
  raise notice 'Every other country needs email confirmation instead.';
end $$;
