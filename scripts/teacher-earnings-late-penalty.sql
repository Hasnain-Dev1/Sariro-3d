-- ============================================================================
-- SARIRO — Teacher earnings: add late-join penalty (Phase B)
-- ============================================================================
-- Replaces the completion trigger function so that, when a class completes,
-- a late join (recorded in bookings.teacher_started_at by "Start Class") is
-- penalised: 3–10 min late → −₹100. (>10 min never reaches 'completed' — it is
-- finalised as a no-show with a −₹1000 penalty by the app.)
--
-- Idempotent + safe to run more than once. Run AFTER teacher-earnings-autocalc.sql
-- and cohort-scheduling.sql (needs bookings.teacher_started_at).
-- ============================================================================

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

  -- Late-join penalty from the recorded teacher start time.
  if new.teacher_started_at is not null and new.slot_start is not null then
    v_late_min := extract(epoch from (new.teacher_started_at - new.slot_start)) / 60.0;
    if v_late_min > 3 and v_late_min <= 10 then
      v_penalty := 100;
      v_penalty_reason := 'Late join (' || round(v_late_min)::text || ' min)';
    end if;
  end if;

  insert into public.teacher_earnings (
    teacher_id, booking_id, class_date, lesson_name, track, level,
    ratio, student_count, base_amount, bonus_amount, penalty_amount, penalty_reason,
    net_amount, amount, status
  ) values (
    new.teacher_id, new.id, coalesce(new.slot_start, now()), new.lesson_name, v_track, v_level,
    coalesce(v_ratio, '1:1'), v_student_count, v_base, v_bonus, v_penalty, v_penalty_reason,
    v_base + v_bonus - v_penalty, v_base + v_bonus - v_penalty, 'pending'
  );

  return new;
end;
$$;

-- Trigger definition unchanged (already created by teacher-earnings-autocalc.sql);
-- re-assert it here so this file is self-sufficient.
drop trigger if exists trg_teacher_earning_on_complete on public.bookings;
create trigger trg_teacher_earning_on_complete
after update of status on public.bookings
for each row
when (new.status = 'completed')
execute function public.create_teacher_earning_on_complete();
