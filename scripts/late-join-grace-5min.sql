-- ============================================================================
-- SARIRO — the late-join grace is five minutes, not three
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run — it no-ops if already
-- applied.
--
-- ── The bug ─────────────────────────────────────────────────────────────────
-- V2 §22 is explicit:
--
--     "If teacher joins more than 5 minutes after scheduled start: ₹100
--      penalty. Joining within 5 minutes should not trigger the late-join
--      penalty."
--
-- The live trigger fines from 3 minutes:
--
--     if v_late_min > 3 and v_late_min <= 10 then v_penalty := 100;
--
-- So a teacher who joined 3 minutes 30 seconds late was fined ₹100 for
-- something the written policy allows. That is real money taken from a real
-- person's pay against the stated rule, and §38 puts the "> 5 minutes" rule on
-- the teacher's own payout screen — so the app has been showing one rule and
-- charging another.
--
-- ── Why this patches rather than re-creates ─────────────────────────────────
-- create_teacher_earning_on_complete() has been redefined three times
-- (teacher-earnings-late-penalty → noshow-halfpay → pay-from-settings), and
-- which one is live depends on the order they were run. Pasting a body here
-- would silently roll back whichever refinements came after it — deleting the
-- half-pay rule or the settings-driven rates without anybody noticing.
--
-- So this reads the function that is actually live, changes the one comparison,
-- and puts it back. Everything else about it is preserved exactly.
--
-- ── This does not revisit past penalties ────────────────────────────────────
-- Rows already in teacher_earnings are left alone: §88 says historical
-- financial records are not overwritten. Any teacher fined under the old
-- threshold should be corrected through the incentive/adjustment path, which
-- leaves an audit trail. The query at the bottom finds them.
-- ============================================================================

do $$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'create_teacher_earning_on_complete'
   limit 1;

  if v_def is null then
    raise exception 'create_teacher_earning_on_complete() not found — run the teacher earnings migrations first';
  end if;

  if position('v_late_min > 3' in v_def) = 0 then
    if position('v_late_min > 5' in v_def) > 0 then
      raise notice 'Already on the 5-minute grace. Nothing to do.';
    else
      -- Do not guess. A shape we do not recognise gets a human, not a rewrite.
      raise exception 'Late-join comparison not found in the live function. Inspect it by hand before changing pay logic.';
    end if;
  else
    execute replace(v_def, 'v_late_min > 3', 'v_late_min > 5');
    raise notice 'Late-join grace moved from 3 minutes to 5.';
  end if;
end $$;

-- ── Who was charged under the old rule ──────────────────────────────────────
-- Read-only. Run it to see whether anybody is owed a correction; the minutes
-- come from the reason string the trigger wrote at the time.
--
-- select e.id, e.teacher_id, p.full_name, e.class_date, e.penalty_reason,
--        e.penalty_amount, e.status
--   from public.teacher_earnings e
--   left join public.profiles p on p.id = e.teacher_id
--  where e.penalty_reason like 'Late join%'
--    and (regexp_replace(e.penalty_reason, '\D', '', 'g'))::int between 4 and 5
--  order by e.class_date desc;
