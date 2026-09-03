-- ============================================================================
-- SARIRO — Editable per-tier teacher pay (rates from app_settings)
-- ============================================================================
-- Supersedes teacher-pay-noshow-halfpay.sql. The earnings trigger now reads the
-- base rates from app_settings so a super-admin can edit pay per tier live,
-- falling back to the original code defaults when a key isn't set.
--
-- Setting keys (all optional; numeric):
--   pay_tier1_1on1, pay_tier2_1on1, pay_tier3_1on1
--   pay_tier1_group, pay_tier2_group, pay_tier3_group
--   pay_group_bonus            (bonus when a group has >= 4 active kids)
--
-- Idempotent. Run AFTER teacher-pay-noshow-halfpay.sql + app-settings.sql.
-- ============================================================================

-- Numeric setting lookup with a default.
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

  select coalesce(teacher_tier, 3) into v_tier from public.profiles where id = new.teacher_id;
  if v_tier is null then v_tier := 3; end if;

  select c.ratio, c.track, c.level into v_ratio, v_track, v_level
  from public.cohorts c where c.id = new.cohort_id;
  v_is_group := coalesce(v_ratio, '1:1') <> '1:1';

  select greatest(count(*), 1) into v_student_count
  from public.enrollments e where e.cohort_id = new.cohort_id and e.status = 'active';

  -- Base rate from settings (falls back to original code defaults).
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

  -- Late-join penalty (unchanged).
  if new.teacher_started_at is not null and new.slot_start is not null then
    v_late_min := extract(epoch from (new.teacher_started_at - new.slot_start)) / 60.0;
    -- §22: the grace is five minutes. Was 3, which fined teachers for something
    -- the written policy allows — see scripts/late-join-grace-5min.sql.
    if v_late_min > 5 and v_late_min <= 10 then
      v_penalty := 100;
      v_penalty_reason := 'Late join (' || round(v_late_min)::text || ' min)';
    end if;
  end if;

  -- 1:1 student no-show → withhold half the base (claimable via doubt session).
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
    v_base + v_bonus - v_penalty, v_base + v_bonus - v_penalty, 'pending'
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
