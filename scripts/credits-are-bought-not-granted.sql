-- ============================================================================
-- SARIRO — a credit is something a family bought
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- A credit is one class. It is spent when a class is marked complete, and a
-- child cannot join a class without one — /api/student/join-class has enforced
-- that from the beginning.
--
-- It has never meant anything, because credits were being minted. TWO things
-- were granting them on enrolment:
--
--   1. the application    one credit per lesson in the course. Forty-two for a
--                         forty-two-lesson course, written as type 'purchase'
--                         with nobody having purchased anything. Removed in
--                         the same change as this file.
--
--   2. a database trigger  one more credit, on top. This one is not in any
--                          migration file in the repository — it was found in
--                          the transaction log, where every enrolment shows the
--                          pair:
--
--                            purchase  +1   "Credits granted for enrollment in agent intermediate"
--                            purchase  +41  "Enrollment credits — agent intermediate (42 lessons)"
--
-- Removing only the application half would leave every enrolment still handing
-- out a free class, and the gate that now refuses to schedule for a learner
-- with no credits would quietly never fire. This is the same shape as
-- trg_auto_create_earning, which sat in this database for months killing every
-- teacher pay rule: the code said one thing and the database did another.
--
-- ── What this does ──────────────────────────────────────────────────────────
-- Finds any trigger on public.enrollments whose function writes to credits or
-- credit_transactions, and drops the trigger. The FUNCTION is left in place
-- with a comment: dropping it would break a restore of any older migration
-- that still references it, and an orphaned function does nothing on its own.
--
-- Discovered rather than named, because the trigger's name is not knowable
-- from the repository — which is exactly the problem being fixed.
--
-- ── What it deliberately does NOT do ────────────────────────────────────────
-- Existing balances are left alone. Three real learners hold credits today
-- (42, 90 and 1); clawing those back would cancel classes families are
-- expecting. From here on the balance means what it says.
-- ============================================================================

set search_path = public, extensions;

do $$
declare
  t record;
  dropped int := 0;
begin
  for t in
    select tg.tgname, p.proname
      from pg_trigger tg
      join pg_class c on c.oid = tg.tgrelid
      join pg_proc  p on p.oid = tg.tgfoid
     where c.relname = 'enrollments'
       and not tg.tgisinternal
       and (p.prosrc like '%credit_transactions%' or p.prosrc like '%credits%')
  loop
    execute format('drop trigger if exists %I on public.enrollments', t.tgname);
    dropped := dropped + 1;
    raise notice 'dropped trigger % (function %)', t.tgname, t.proname;
    -- Left in place on purpose: an orphaned function fires for nobody, and
    -- dropping it would break any older migration that still references it.
    execute format(
      'comment on function public.%I() is %L',
      t.proname,
      'DISABLED ' || to_char(now(), 'YYYY-MM-DD') || ': granted credits on enrolment, which made the credit balance a copy of the syllabus length. Credits are created only where money is — the grant and adjust screens. Its trigger was dropped by scripts/credits-are-bought-not-granted.sql; do not re-attach it.'
    );
  end loop;

  if dropped = 0 then
    raise notice 'no credit-granting trigger on enrollments (already clean)';
  end if;
end $$;

-- ── One table. Whether anything can still mint a credit. ───────────────────
-- Every diagnostic ends in a single SELECT: the Supabase editor shows only the
-- last result set and sends `raise notice` to a tab nobody opens.
select 'credit-granting triggers left on enrollments' as fact,
       count(*)::text as value
  from pg_trigger tg
  join pg_class c on c.oid = tg.tgrelid
  join pg_proc  p on p.oid = tg.tgfoid
 where c.relname = 'enrollments'
   and not tg.tgisinternal
   and (p.prosrc like '%credit_transactions%' or p.prosrc like '%credits%')
union all
select 'learners holding credits',
       count(*)::text || ' (' || coalesce(sum(balance), 0)::text || ' classes)'
  from public.credits where balance > 0
union all
select 'active enrolments with NO credits',
       count(*)::text
  from public.enrollments e
 where e.status = 'active'
   and coalesce((select balance from public.credits c where c.user_id = e.user_id), 0) <= 0
union all
select 'credits granted by enrolment in the last 30 days',
       coalesce(sum(amount), 0)::text
  from public.credit_transactions
 where amount > 0
   and related_enrollment_id is not null
   and created_at > now() - interval '30 days';
