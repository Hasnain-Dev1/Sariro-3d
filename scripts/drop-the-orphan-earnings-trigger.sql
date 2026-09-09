-- ============================================================================
-- SARIRO — the trigger that has been quietly eating every pay rule we wrote
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- ── What was happening ──────────────────────────────────────────────────────
-- There are TWO triggers on bookings that create teacher_earnings rows:
--
--     trg_auto_create_earning          -> auto_create_teacher_earning()
--     trg_teacher_earning_on_complete  -> create_teacher_earning_on_complete()
--
-- Postgres fires triggers in ALPHABETICAL ORDER by name. "auto" sorts before
-- "teacher", so the first one wins the race every time. It inserts a row, and
-- the second one — the maintained one, the one four separate migrations have
-- carefully improved — reaches its own line:
--
--     if exists (select 1 from public.teacher_earnings
--                where booking_id = new.id) then return new; end if;
--
-- and returns without doing anything. No error. No log line. The correct
-- function runs to completion and changes nothing.
--
-- ── What that cost ──────────────────────────────────────────────────────────
-- auto_create_teacher_earning() has no trial guard and no late-join logic at
-- all, which matches the symptoms exactly:
--
--     a completed TRIAL       -> earning row created  (should be skipped)
--     a class  8 minutes late -> penalty 0            (rule says ₹100)
--     a class 39 minutes late -> penalty 0            (rule says ₹100)
--
-- Eight minutes was the tell. The old rule charged 5–10 minutes and the new
-- one charges anything over 5, so NO version of the maintained function has
-- ever returned 0 for eight minutes. It was never running.
--
-- Which means the late-join penalty has never once applied, on any class,
-- since the day it was written. The real class on 6 September started 39
-- minutes late and was paid in full — not because the rule was wrong, but
-- because the rule was never reached.
--
-- ── Why this drops the trigger and keeps the function ───────────────────────
-- auto_create_teacher_earning() appears in no file in this repository. It was
-- created by hand, or by a script that no longer exists, and has never been
-- tracked or updated. Dropping the TRIGGER stops it firing; keeping the
-- FUNCTION means nothing is destroyed and this is one statement to undo.
-- ============================================================================

set search_path = public, extensions;

drop trigger if exists trg_auto_create_earning on public.bookings;

comment on function public.auto_create_teacher_earning() is
  'ORPHANED 2026-09-09. Superseded by create_teacher_earning_on_complete(), which is the one scripts/teacher-*.sql maintain. Its trigger fired first (alphabetical order) and silently suppressed every pay rule — no trial guard, no late-join penalty. Do not re-attach it. See scripts/drop-the-orphan-earnings-trigger.sql.';

-- ── One table. Every trigger left on bookings, and what it will do. ─────────
-- Exactly one row should say "WRITES EARNINGS", and it must be
-- trg_teacher_earning_on_complete.
select t.tgname::text as trigger_name,
       p.proname::text as calls_function,
       case
         when p.prosrc ilike '%insert into%teacher_earnings%'
           then 'WRITES EARNINGS'
         else 'other'
       end as role,
       case
         when p.proname = 'create_teacher_earning_on_complete'
           then 'trial_guard=' || (p.prosrc like '%coalesce(new.is_trial, false)%')::text ||
                '  uncapped_penalty=' || (p.prosrc like '%v_late_min > 5 then%')::text
         else ''
       end as checks
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'public.bookings'::regclass
  and not t.tgisinternal
order by t.tgname;
