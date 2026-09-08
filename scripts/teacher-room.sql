-- ============================================================================
-- SARIRO — a trial you can actually join
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it found.
--
-- Every trial booked so far has google_meet_url = NULL. Every one of them.
-- A normal class gets its link from its cohort; a trial has no cohort, and
-- nothing else ever filled the gap. So the student dashboard reached the join
-- moment, found no link, and showed "Your mentor is setting up the link" —
-- forever, because nobody was.
--
-- The trial was booked, the teacher was expecting them, and there was no door.
--
-- ── Why the room lives on the teacher ───────────────────────────────────────
-- Generating a Meet link per booking needs Google Calendar API access, an OAuth
-- consent screen and a service account with domain delegation. That is a real
-- project. A teacher's personal room is a URL they already have, it never
-- expires, and it is the same room they use for every class they teach.
--
-- One column, set once by the teacher, and every trial they are booked for
-- from that moment has a door.
-- ============================================================================

set search_path = public, extensions;

alter table public.profiles
  add column if not exists meet_url text;

comment on column public.profiles.meet_url is
  'A teacher''s permanent class room (Google Meet / Zoom). Stamped onto trial bookings at booking time, because a trial has no cohort to inherit a link from.';

-- Loose on purpose: Meet, Zoom, Teams and Whereby all look different, and a
-- teacher who pastes a working link should not be argued with about its shape.
-- What is rejected is the thing that is definitely not a link.
alter table public.profiles
  drop constraint if exists profiles_meet_url_shape;
alter table public.profiles
  add constraint profiles_meet_url_shape
  check (meet_url is null or meet_url ~* '^https://[a-z0-9.-]+\.[a-z]{2,}(/|$)');

do $$
declare
  v_teachers integer;
  v_with_room integer;
  v_trials_no_link integer;
begin
  select count(*) into v_teachers
    from public.profiles where role = 'teacher' or is_teacher = true;
  select count(*) into v_with_room
    from public.profiles
   where (role = 'teacher' or is_teacher = true) and meet_url is not null;
  select count(*) into v_trials_no_link
    from public.bookings
   where is_trial = true and google_meet_url is null
     and status not in ('cancelled') and slot_end > now();

  raise notice '── teacher rooms ──────────────────────────────────────';
  raise notice 'teachers:                      %', v_teachers;
  raise notice 'teachers with a room set:      %', v_with_room;
  raise notice 'upcoming trials with NO link:  %', v_trials_no_link;
  raise notice '';

  if v_with_room = 0 then
    raise notice 'Nobody has set a room yet, which is expected — the column was';
    raise notice 'created a second ago. Each teacher sets theirs in Settings, and';
    raise notice 'saving it back-fills their own upcoming trials that have no link.';
  end if;
end $$;
