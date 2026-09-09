-- ============================================================================
-- SARIRO — two holes in teacher pay, both of them real money
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it found.
--
-- ⚠️  READ THIS BEFORE EDITING THIS FILE ⚠️
-- Five files in scripts/ define create_teacher_earning_on_complete(), each a
-- full `create or replace`. Whichever ran LAST is the one that is live:
--
--     teacher-earnings-autocalc.sql        (base rates)
--       → teacher-earnings-late-penalty.sql  (adds the late-join penalty)
--         → teacher-pay-noshow-halfpay.sql     (adds student-no-show half pay)
--           → teacher-pay-from-settings.sql      (rates from app_settings)
--             → THIS FILE
--
-- This one is built on teacher-pay-from-settings.sql and keeps everything it
-- does. An earlier draft of this file was built on the late-penalty version
-- two generations back; running it would have silently deleted the editable
-- per-tier rates AND the student-no-show half-pay rule, with no error and no
-- visible symptom until somebody looked at a payslip. If you write the next
-- one of these, start from whichever file is at the bottom of that list.
--
-- ── Hole 1: a class 39 minutes late cost nothing ────────────────────────────
-- The payout screen tells every teacher:
--
--     "More than 5 minutes after the scheduled start — ₹100"
--
-- No upper bound. The trigger implemented `> 5 and <= 10`, on the assumption
-- that anything later would be finalised as a no-show by the app instead. When
-- that does not happen — nobody runs the no-show finaliser, or the teacher
-- marks the class complete first — the class falls between the two rules and
-- is paid in full.
--
-- The first real class on this system did exactly that: scheduled 08:55,
-- teacher started 09:34, penalty ₹0, paid in full. Thirty-nine minutes late
-- and free.
--
-- A rule a teacher reads and then watches go unenforced teaches them which
-- other rules to ignore. So the ceiling goes: over the grace is over the
-- grace, however late. The no-show rule (−₹1,000, for a class nobody
-- attended) is untouched and still lives in the app.
--
-- ── Hole 2: a trial would have been paid as a full class ────────────────────
-- A trial pays a flat fee, written by /api/trial/feedback once every child has
-- been written up. This trigger fires on ANY booking reaching 'completed' and
-- knows nothing about trials: cohort_id is null, so it falls through to the
-- 1:1 branch and inserts the full rate — and it fires FIRST, so the feedback
-- route then finds a row already there and skips. Two and a half times the
-- trial rate, with the flat fee, the pay gate and the lead-stage move all
-- never running.
--
-- Verified against live data before writing this: a trial marked completed
-- produced a ₹300 earning row. Nothing real has been overpaid yet — no trial
-- has completed — and this closes it before one does.
--
-- ── Why the trigger yields rather than learning about trials ────────────────
-- Trial pay is not just a different number. It is held until every child has
-- feedback written (payGate in lib/dashboard/class-feedback.ts), it moves the
-- lead to its final stage, and its amount is configurable in
-- trial_pay_settings. Teaching a Postgres trigger all of that would give us
-- two implementations of one policy, which is how they drift apart.
-- The route owns trials; the trigger owns everything else.
-- ============================================================================

set search_path = public, extensions;

-- Unchanged from teacher-pay-from-settings.sql; repeated so this file stands
-- on its own if it is ever run against a fresh database.
create or replace function public.setting_num(p_key text, p_default numeric)
returns numeric language sql stable as $$
  select coalesce((select nullif(value, '')::numeric from public.app_settings where key = p_key), p_default);
$$;

create or replace function public.create_teacher_earning_on_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier          int;
  v_ratio         text;
  v_track         text;
  v_level         text;
  v_student_count int;
  v_is_group      boolean;
  v_base          numeric := 0;
  v_bonus         numeric := 0;
  v_penalty       numeric := 0;
  v_penalty_reason text := null;
  v_late_min      numeric;
  v_withheld      numeric := 0;
begin
  if new.status is distinct from 'completed' then return new; end if;
  if old.status is not distinct from 'completed' then return new; end if;
  if exists (select 1 from public.teacher_earnings where booking_id = new.id) then return new; end if;

  -- NEW: a trial is paid by /api/trial/feedback — flat fee, held until every
  -- child has been written up. Paying it here pays the wrong amount, at the
  -- wrong moment, and blocks the route that does it properly.
  if coalesce(new.is_trial, false) then return new; end if;

  select coalesce(teacher_tier, 3) into v_tier from public.profiles where id = new.teacher_id;
  if v_tier is null then v_tier := 3; end if;

  select c.ratio, c.track, c.level into v_ratio, v_track, v_level
  from public.cohorts c where c.id = new.cohort_id;
  v_is_group := coalesce(v_ratio, '1:1') <> '1:1';

  select greatest(count(*), 1) into v_student_count
  from public.enrollments e where e.cohort_id = new.cohort_id and e.status = 'active';

  -- Base rate from settings (falls back to original code defaults). KEPT.
  if v_is_group then
    v_base := public.setting_num(
      'pay_tier' || v_tier || '_group',
      case v_tier when 1 then 300 when 2 then 275 else 250 end);
    if v_student_count >= 4 then v_bonus := public.setting_num('pay_group_bonus', 25); end if;
  else
    v_base := public.setting_num(
      'pay_tier' || v_tier || '_1on1',
      case v_tier when 1 then 300 when 2 then 250 else 225 end);
  end if;

  -- Late join. Five minutes of grace, then ₹100 — with NO upper bound, which
  -- is what the payout screen has always promised. The `<= 10` that used to be
  -- here is the change. See lib/dashboard/late-penalty.ts, the TypeScript half
  -- of this same rule, which /api/trial/feedback uses for trials.
  if new.teacher_started_at is not null and new.slot_start is not null then
    v_late_min := round(extract(epoch from (new.teacher_started_at - new.slot_start)) / 60.0);
    if v_late_min > 5 then
      v_penalty := 100;
      v_penalty_reason := 'Late join (' || v_late_min::text || ' min)';
    end if;
  end if;

  -- 1:1 student no-show → withhold half the base (claimable via doubt session). KEPT.
  if not v_is_group and exists (
    select 1 from public.session_attendance a
    where a.booking_id = new.id and a.status = 'absent'
  ) then
    v_withheld := round(v_base * 0.5);
    v_penalty := v_penalty + v_withheld;
    v_penalty_reason := coalesce(v_penalty_reason || '; ', '')
      || 'Student no-show — half withheld (claim via doubt session)';
  end if;

  insert into public.teacher_earnings (
    teacher_id, booking_id, class_date, lesson_name, track, level,
    ratio, student_count, base_amount, bonus_amount, penalty_amount, penalty_reason,
    net_amount, amount, status
  ) values (
    new.teacher_id, new.id, coalesce(new.slot_start, now()), new.lesson_name, v_track, v_level,
    coalesce(v_ratio, '1:1'), v_student_count, v_base, v_bonus, v_penalty, v_penalty_reason,
    greatest(v_base + v_bonus - v_penalty, 0), greatest(v_base + v_bonus - v_penalty, 0), 'pending'
  );

  return new;
end;
$$;

drop trigger if exists trg_teacher_earning_on_complete on public.bookings;
create trigger trg_teacher_earning_on_complete
after update of status on public.bookings
for each row
when (new.status = 'completed')
execute function public.create_teacher_earning_on_complete();

-- ============================================================================
-- ── DID IT WORK? ────────────────────────────────────────────────────────────
-- ============================================================================
-- This ends with a SELECT, on purpose. Earlier versions ended with `do $$`
-- blocks that raise NOTICE, and NOTICEs go to the Messages tab, not the
-- results grid — so the editor reported "Success. No rows returned" whether
-- the migration had taken or not, twice, and nobody could tell the difference.
--
-- The rows below are read from the function that is ACTUALLY installed
-- (pg_proc.prosrc), not from this file. Every `check` column must say OK.
--
-- If you see FAILED anywhere: the editor probably ran only part of this file.
-- Supabase runs the SELECTED text when there is a selection — click once in
-- the editor to clear any highlight, then Run again.
-- ============================================================================
select *
from (
  select
    1 as ord,
    'trials skipped' as rule,
    case when prosrc like '%is_trial%' then 'OK' else 'FAILED — this file did not take' end as check
  from pg_proc where proname = 'create_teacher_earning_on_complete'
  union all
  select 2, 'late penalty uncapped',
    case when prosrc like '%<= 10%' then 'FAILED — still capped at 10 min' else 'OK' end
  from pg_proc where proname = 'create_teacher_earning_on_complete'
  union all
  -- These two must survive. An earlier draft of this file was built on an
  -- ancestor that had neither, and would have deleted both silently.
  select 3, 'settings-driven rates KEPT',
    case when prosrc like '%setting_num%' then 'OK' else 'FAILED — REGRESSION, do not leave it here' end
  from pg_proc where proname = 'create_teacher_earning_on_complete'
  union all
  select 4, 'no-show half pay KEPT',
    case when prosrc like '%half withheld%' then 'OK' else 'FAILED — REGRESSION, do not leave it here' end
  from pg_proc where proname = 'create_teacher_earning_on_complete'
  union all
  -- Already-settled classes this rule would have caught. Deliberately NOT
  -- corrected automatically: reducing a teacher's visible pay without telling
  -- them is how you lose a teacher. Have the conversation, then adjust.
  select 5, 'late classes paid in full (fix by hand)',
    coalesce((
      select count(*)::text || ' — see the second result set'
      from public.bookings b
      join public.teacher_earnings e on e.booking_id = b.id
      where b.teacher_started_at is not null
        and b.slot_start is not null
        and extract(epoch from (b.teacher_started_at - b.slot_start)) / 60.0 > 5
        and coalesce(e.penalty_amount, 0) = 0
    ), '0')
) t
order by ord;
