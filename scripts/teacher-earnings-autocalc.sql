-- ============================================================================
-- SARIRO — Teacher earnings auto-calc (Phase A)
-- ============================================================================
-- Creates a teacher_earnings row automatically when a booking is marked
-- 'completed'. Fires as a Postgres trigger so it works no matter HOW the
-- status changes (teacher dashboard direct update, server, or HR) — a client
-- cannot bypass it, which matters for money integrity.
--
-- Scope of THIS file (Phase A):
--   * base earning on class completion  (tier x ratio + full-group bonus)
--   * penalty_amount is left at 0 here — late-join / no-show penalties are
--     Phase B (they need teacher join-time tracking + a scheduled checker).
--   * HR can still add/override penalty_amount + bonus_amount afterward.
--
-- Idempotent: re-completing the same booking will NOT create a second earning.
-- Safe to run more than once (CREATE OR REPLACE + DROP TRIGGER IF EXISTS).
--
-- >>> CONFIRM THE RATE NUMBERS in the clearly-marked block below before running. <<<
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
begin
  -- Guard: only act on a transition INTO 'completed'.
  if new.status is distinct from 'completed' then
    return new;
  end if;
  if old.status is not distinct from 'completed' then
    return new;  -- was already completed; nothing to do
  end if;

  -- Idempotency: never create a second earning for the same booking.
  if exists (select 1 from public.teacher_earnings where booking_id = new.id) then
    return new;
  end if;

  -- Teacher tier (1/2/3). Default to 3 (lowest rate) if unset.
  select coalesce(teacher_tier, 3) into v_tier
  from public.profiles where id = new.teacher_id;
  if v_tier is null then v_tier := 3; end if;

  -- Cohort info (ratio / track / level).
  select c.ratio, c.track, c.level
    into v_ratio, v_track, v_level
  from public.cohorts c where c.id = new.cohort_id;

  v_is_group := coalesce(v_ratio, '1:1') <> '1:1';

  -- Student count = active enrollments in this cohort (min 1).
  select greatest(count(*), 1) into v_student_count
  from public.enrollments e
  where e.cohort_id = new.cohort_id and e.status = 'active';

  -- ==========================================================================
  -- RATE MATRIX  —  *** PROPOSED DEFAULTS: confirm / edit these numbers ***
  --   1:1  (confirmed): tier1 300, tier2 250, tier3 225
  --   group base:       tier1 300, tier2 275, tier3 250   (spans your ~250-325)
  --   full-group bonus: +25 when 4+ students             (=> up to 325)
  -- ==========================================================================
  if v_is_group then
    v_base := case v_tier when 1 then 300 when 2 then 275 else 250 end;
    if v_student_count >= 4 then
      v_bonus := 25;
    end if;
  else
    v_base := case v_tier when 1 then 300 when 2 then 250 else 225 end;
  end if;
  -- ==========================================================================

  insert into public.teacher_earnings (
    teacher_id, booking_id, class_date, lesson_name, track, level,
    ratio, student_count, base_amount, bonus_amount, penalty_amount,
    net_amount, amount, status
  ) values (
    new.teacher_id,
    new.id,
    coalesce(new.slot_start, now()),
    new.lesson_name,
    v_track,
    v_level,
    coalesce(v_ratio, '1:1'),
    v_student_count,
    v_base,
    v_bonus,
    0,                       -- penalty (Phase B)
    v_base + v_bonus,        -- net_amount
    v_base + v_bonus,        -- amount (kept in sync with net for legacy reads)
    'pending'
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
-- Rollback (if ever needed):
--   drop trigger if exists trg_teacher_earning_on_complete on public.bookings;
--   drop function if exists public.create_teacher_earning_on_complete();
-- ============================================================================
