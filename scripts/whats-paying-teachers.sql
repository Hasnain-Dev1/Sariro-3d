-- ============================================================================
-- SARIRO — what is actually creating teacher_earnings rows?
-- ============================================================================
-- Read-only. Writes nothing. Returns three small tables. Paste them back.
--
-- Why this exists: the migration reports as installed (the function source
-- contains the trial guard) and yet a completed trial STILL produces an
-- earning row, and a class 8 minutes late still scores a penalty of 0 —
-- which is not the new rule and not the old one either.
--
-- Both facts cannot be true of one function. So either the trigger calls a
-- different function than we think, or a second trigger is inserting the row
-- first and the real one then stops at its own idempotency check.
-- ============================================================================

-- 1) EVERY trigger on bookings, and the function each one calls.
--    Looking for a second one that writes earnings.
select t.tgname                                    as trigger_name,
       p.proname                                   as calls_function,
       case t.tgenabled when 'O' then 'enabled'
                        when 'D' then 'DISABLED'
                        else t.tgenabled::text end as state
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'public.bookings'::regclass
  and not t.tgisinternal
order by t.tgname;

-- 2) EVERY function anywhere that inserts into teacher_earnings.
--    More than one that fires on completion is the bug.
select n.nspname                                        as schema,
       p.proname                                        as function_name,
       p.prosrc like '%is_trial%'                       as has_trial_guard,
       p.prosrc like '%v_late_min > 5 then%'            as has_uncapped_penalty,
       p.prosrc like '%v_late_min > 5 and v_late_min <= 10%' as has_10min_ceiling
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prosrc ilike '%insert into public.teacher_earnings%'
   or p.prosrc ilike '%insert into teacher_earnings%'
order by n.nspname, p.proname;

-- 3) The live source of the one we think is running, so we can read it.
select pg_get_functiondef('public.create_teacher_earning_on_complete()'::regprocedure) as live_source;
