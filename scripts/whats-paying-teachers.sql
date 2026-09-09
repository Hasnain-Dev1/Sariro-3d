-- ============================================================================
-- SARIRO — what is actually creating teacher_earnings rows?
-- ============================================================================
-- ONE query. ONE result table. Read-only, writes nothing.
--
-- Two earlier attempts at this failed for the same reason twice: a script with
-- several statements shows only the LAST result in the Supabase grid, and a
-- script ending in `raise notice` shows nothing at all. So everything below is
-- a single SELECT and every fact comes back as a row.
--
-- ── What we know ────────────────────────────────────────────────────────────
-- The live source of create_teacher_earning_on_complete() is correct: it has
-- the trial guard and the uncapped late penalty. Verified by reading it back.
--
-- And yet, against the live database:
--     a completed TRIAL      -> earning row created (guard says skip)
--     a class  8 minutes late -> penalty 0 (rule says 100)
--
-- Eight minutes is the tell. The old rule charged 5–10 minutes; the new one
-- charges anything over 5. No version of this function has ever returned 0 for
-- eight minutes late, so the row is not being written by this function.
--
-- Inserting a booking already 'completed' produces nothing; flipping it
-- scheduled -> completed produces the row. So it is an UPDATE trigger. This
-- finds out which one.
-- ============================================================================

select kind, name, detail
from (
  -- Every trigger on bookings and the function it calls. A second one that
  -- writes earnings would insert first, and the real function would then stop
  -- at its own `if exists ... return new` — which looks exactly like this bug.
  select 1 as ord,
         'trigger on bookings' as kind,
         t.tgname::text        as name,
         p.proname::text || '()  [' ||
           case t.tgenabled when 'O' then 'enabled'
                            when 'D' then 'DISABLED'
                            else t.tgenabled::text end || ']' as detail
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  where t.tgrelid = 'public.bookings'::regclass
    and not t.tgisinternal

  union all

  -- Every function anywhere that writes teacher_earnings, and what it contains.
  select 2,
         'writes teacher_earnings',
         n.nspname::text || '.' || p.proname::text,
         'trial_guard=' || (p.prosrc like '%coalesce(new.is_trial, false)%')::text ||
         '  uncapped=' || (p.prosrc like '%v_late_min > 5 then%')::text ||
         '  capped10=' || (p.prosrc like '%v_late_min <= 10%')::text
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where p.prosrc ilike '%insert into%teacher_earnings%'

  union all

  -- Anything else that fires on bookings from a rule or a foreign table.
  select 3,
         'rule on bookings',
         r.rulename::text,
         '(rewrite rule)'
  from pg_rules r
  where r.schemaname = 'public' and r.tablename = 'bookings'
    and r.rulename <> '_RETURN'
) x
order by ord, name;
