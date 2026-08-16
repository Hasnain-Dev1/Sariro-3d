-- ============================================================================
-- SARIRO — Diagnose "penalties not working" (run in Supabase SQL Editor)
-- ============================================================================
-- Penalties are produced by the DB trigger create_teacher_earning_on_complete()
-- which fires when a booking's status becomes 'completed'. If the LIVE function
-- is an older version (or was hand-edited), the late-join / no-show penalty
-- branches silently vanish while normal pay keeps working. These read-only
-- checks tell you exactly what's live. Nothing here writes data.
-- ============================================================================

-- 1) Does the live function still contain the penalty logic? Look for the
--    phrases 'Late join' and 'half withheld' in the returned source. If either
--    is MISSING, the trigger is stale → re-run the FIX at the bottom.
select pg_get_functiondef('public.create_teacher_earning_on_complete()'::regprocedure) as live_source;

-- 2) Is the trigger actually attached to bookings + enabled?
--    tgenabled 'O' = enabled. No row = the trigger is missing entirely.
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.bookings'::regclass
  and tgname = 'trg_teacher_earning_on_complete';

-- 3) Recent completed classes vs. whether an earning row exists for each.
--    Rows where earning_id IS NULL = the trigger did NOT fire (or errored).
select b.id as booking_id, b.status, b.slot_start, b.teacher_started_at,
       e.id as earning_id, e.penalty_amount, e.penalty_reason
from public.bookings b
left join public.teacher_earnings e on e.booking_id = b.id
where b.status in ('completed', 'no_show')
order by b.slot_start desc
limit 25;

-- 4) Are teachers recording a start time? Late penalty needs teacher_started_at.
--    Many NULLs on completed 1:1 classes = "Start Class" isn't being clicked,
--    so a late join can never be measured (this is workflow, not a bug).
select count(*) filter (where teacher_started_at is null) as completed_without_start_time,
       count(*)                                           as completed_total
from public.bookings
where status = 'completed';

-- ============================================================================
-- FIX — if check (1) is missing a penalty phrase or (2) returns no row, re-apply
-- the current trigger definition. It is the SAME logic as
-- scripts/teacher-pay-from-settings.sql (idempotent, safe to re-run):
--
--     -- paste & run the full body of scripts/teacher-pay-from-settings.sql
--
-- After running it, re-run checks (1) and (2) to confirm the penalty branches
-- and the trigger are present.
-- ============================================================================
