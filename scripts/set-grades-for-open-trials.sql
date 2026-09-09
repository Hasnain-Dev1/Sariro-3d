-- ============================================================================
-- SARIRO — the trials nobody can join, and how to open them
-- ============================================================================
-- Run in the Supabase SQL editor. Read-only as written. Ends with ONE table.
--
-- scripts/trial-grade-band.sql reported:
--
--     profiles with a grade                 0 of 14
--     trial seats with a grade              0 of 9
--     upcoming trials that cannot be banded 4
--
-- Every trial booked before grades existed has a child in it and nothing that
-- says what level they are. That is NOT the same as an empty slot:
--
--   · an empty slot is OPEN   — the next child to book sets the band
--   · a class with an unknown level is UNKNOWN, and the booking routes now
--     refuse to add anybody to it
--
-- Treating unknown as open is exactly how a grade 1 gets seated with a grade
-- 10, so those four classes keep the children they have and take no more until
-- somebody says what level they are teaching at. The class itself still runs
-- perfectly well — only joining is closed.
--
-- ── To open one ─────────────────────────────────────────────────────────────
-- Set the grade on the child already in it. The UPDATE is written out below,
-- commented, because it is a judgement about a real child and not something a
-- script should guess.
-- ============================================================================

set search_path = public, extensions;

-- ── The four, and who is in them ───────────────────────────────────────────
select to_char(b.slot_start, 'Dy DD Mon HH24:MI')      as class,
       coalesce(p.full_name, p.email, tp.student_id::text) as child,
       coalesce(p.grade::text, '— none —')             as profile_grade,
       coalesce(tp.grade::text, '— none —')            as seat_grade,
       tp.student_id::text                             as student_id
  from public.bookings b
  join public.trial_participants tp on tp.booking_id = b.id
  left join public.profiles p on p.id = tp.student_id
 where b.is_trial = true
   and b.status not in ('cancelled')
   and b.slot_end > now()
   and not exists (
     select 1 from public.trial_participants x
      where x.booking_id = b.id and x.grade is not null
   )
 order by b.slot_start, child;

-- ── To open a class, set the grade for the child already in it ─────────────
-- Copy the student_id from the table above, choose the grade, and run BOTH.
-- The seat grade is what bands the class; the profile grade is so the next
-- booking for that child is filled in for you.
--
--   update public.trial_participants
--      set grade = 6                                   -- <- their grade
--    where student_id = '00000000-0000-0000-0000-000000000000'::uuid;
--
--   update public.profiles
--      set grade = 6                                   -- <- the same grade
--    where id = '00000000-0000-0000-0000-000000000000'::uuid;
--
-- Re-run this file afterwards: the class should drop out of the table above.
