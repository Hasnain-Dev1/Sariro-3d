-- ============================================================================
-- SARIRO — two holes in teacher pay, both of them real money
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it found.
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
-- teacher started 09:34, penalty ₹0, paid ₹250 in full.
--
-- A rule a teacher reads and then watches go unenforced teaches them which
-- other rules to ignore. So the ceiling goes: over the grace is over the
-- grace, however late. The no-show rule (−₹1,000, for a class nobody
-- attended) is untouched and still lives in the app.
--
-- ── Hole 2: a trial would have been paid as a full class ────────────────────
-- A trial pays ₹100 flat, written by /api/trial/feedback once every child has
-- been written up. But this trigger fires on ANY booking reaching 'completed'
-- and knows nothing about trials: cohort_id is null, so it falls through to
-- the 1:1 branch and inserts ₹225–₹300. It fires first, so the feedback route
-- then finds a row already there and skips — and the teacher is paid two and a
-- half times the trial rate, with the flat-fee logic never running at all.
--
-- No trial has completed yet, so nothing has been overpaid. This closes it
-- before the first one does.
--
-- ── Why the trigger yields rather than learning about trials ────────────────
-- Trial pay is not just a different number. It is held until every child in
-- the class has feedback written (payGate in lib/dashboard/class-feedback.ts),
-- it moves the lead to its final stage, and its amount is configurable in
-- trial_pay_settings. Teaching a Postgres trigger all of that would give us
-- two implementations of one policy, which is how they drift. The route owns
-- trials; the trigger owns everything else.
-- ============================================================================

set search_path = public, extensions;

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
begin
  if new.status is distinct from 'completed' then return new; end if;
  if old.status is not distinct from 'completed' then return new; end if;
  if exists (select 1 from public.teacher_earnings where booking_id = new.id) then return new; end if;

  -- A trial is paid by /api/trial/feedback: flat fee, held until every child
  -- has been written up. Paying it here would pay the wrong amount, at the
  -- wrong moment, and block the route that does it properly.
  if coalesce(new.is_trial, false) then return new; end if;

  select coalesce(teacher_tier, 3) into v_tier from public.profiles where id = new.teacher_id;
  if v_tier is null then v_tier := 3; end if;

  select c.ratio, c.track, c.level into v_ratio, v_track, v_level
  from public.cohorts c where c.id = new.cohort_id;
  v_is_group := coalesce(v_ratio, '1:1') <> '1:1';

  select greatest(count(*), 1) into v_student_count
  from public.enrollments e where e.cohort_id = new.cohort_id and e.status = 'active';

  -- Rate matrix (same defaults as the base trigger).
  if v_is_group then
    v_base := case v_tier when 1 then 300 when 2 then 275 else 250 end;
    if v_student_count >= 4 then v_bonus := 25; end if;
  else
    v_base := case v_tier when 1 then 300 when 2 then 250 else 225 end;
  end if;

  -- Late join. Five minutes of grace, then ₹100 — with NO upper bound, which
  -- is what the payout screen has always promised. See lib/dashboard/late-penalty.ts,
  -- the TypeScript half of this same rule.
  if new.teacher_started_at is not null and new.slot_start is not null then
    v_late_min := round(extract(epoch from (new.teacher_started_at - new.slot_start)) / 60.0);
    if v_late_min > 5 then
      v_penalty := 100;
      v_penalty_reason := 'Late join (' || v_late_min::text || ' min)';
    end if;
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

-- ── What is already on the books, unpenalised ───────────────────────────────
-- Deliberately NOT auto-corrected. Reducing a teacher's already-visible pay
-- without telling them is how you lose a teacher. It is listed so somebody can
-- have the conversation and adjust it deliberately.
do $$
declare
  r record;
  v_n integer := 0;
begin
  raise notice '── settled classes that started late but were not charged ──';
  for r in
    select b.id,
           b.slot_start,
           round(extract(epoch from (b.teacher_started_at - b.slot_start)) / 60.0) as late_min,
           e.net_amount,
           p.full_name
      from public.bookings b
      join public.teacher_earnings e on e.booking_id = b.id
      left join public.profiles p on p.id = b.teacher_id
     where b.teacher_started_at is not null
       and b.slot_start is not null
       and extract(epoch from (b.teacher_started_at - b.slot_start)) / 60.0 > 5
       and coalesce(e.penalty_amount, 0) = 0
     order by b.slot_start
  loop
    v_n := v_n + 1;
    raise notice '  %  %  % min late  paid ₹%  (%)',
      r.id, to_char(r.slot_start, 'YYYY-MM-DD HH24:MI'), r.late_min, r.net_amount,
      coalesce(r.full_name, 'unknown teacher');
  end loop;

  if v_n = 0 then
    raise notice '  none.';
  else
    raise notice '';
    raise notice '% class(es) above were paid in full despite a late start.', v_n;
    raise notice 'From now on the trigger charges them. These are left alone';
    raise notice 'on purpose — decide each one with the teacher, not silently.';
  end if;

  raise notice '';
  raise notice '── trials ─────────────────────────────────────────────────';
  raise notice 'completed trials with an earning row: %',
    (select count(*) from public.bookings b
       join public.teacher_earnings e on e.booking_id = b.id
      where b.is_trial = true);
  raise notice 'The trigger now leaves these to /api/trial/feedback.';
end $$;
