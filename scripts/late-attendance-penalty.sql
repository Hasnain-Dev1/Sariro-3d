-- ============================================================================
-- SARIRO — the third penalty: attendance marked late
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Run AFTER teacher-pay-from-settings.sql.
--
-- V2 §22 lists three penalties. Two existed:
--
--   late join > 5 min      −₹100    ✓ (the grace was wrong; fixed separately)
--   no-show                −₹1,000  ✓
--   late attendance        −₹100    ← this one was never built
--
-- §38 already prints all three on the teacher's own payout screen, and §86
-- lists it as an automation. So the rule has been shown to teachers and
-- enforced against none of them.
--
-- ── Why it matters more than the amount suggests ────────────────────────────
-- Unmarked attendance is not a paperwork problem. It silently breaks three
-- things at once: the student's credit is never consumed, the teacher's own
-- earning is never created, and the lesson never advances — so a child's
-- progress bar stops moving for a class they actually attended.
--
-- The ₹100 is not really the point. Being asked about it the same week is.
--
-- ── The deadline ────────────────────────────────────────────────────────────
-- §22 says "after the allowed deadline" without naming one. Twenty-four hours
-- from the end of the class, configurable, because a teacher finishing a 9pm
-- class should not be penalised for marking it over breakfast — but a week
-- later is a different thing entirely.
--
--   app_settings: attendance_deadline_hours   (default 24)
--
-- ── Idempotent, and order-independent ───────────────────────────────────────
-- A class can be finalised before or after it is marked completed, so the
-- earning may not exist when attendance is finalised. The trigger fires on
-- both changes and the function refuses to apply the same penalty twice, so
-- whichever order they happen in, it lands exactly once.
-- ============================================================================

create or replace function public.apply_late_attendance_penalty(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking   public.bookings;
  v_deadline  numeric;
  v_hours     numeric;
  v_amount    numeric;
  v_earning   public.teacher_earnings;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then return; end if;

  -- Nothing to judge until the class has ended and attendance has been closed.
  if v_booking.attendance_finalized_at is null or v_booking.slot_end is null then
    return;
  end if;

  v_deadline := public.setting_num('attendance_deadline_hours', 24);
  v_hours := extract(epoch from (v_booking.attendance_finalized_at - v_booking.slot_end)) / 3600.0;
  if v_hours <= v_deadline then
    return;  -- Marked in time.
  end if;

  v_amount := public.setting_num('penalty_late_attendance', 100);

  select * into v_earning
    from public.teacher_earnings
   where booking_id = p_booking_id
   limit 1;

  -- The earning has not been created yet — the class is not marked completed.
  -- The trigger will fire again when it is, and this will run then.
  if not found then return; end if;

  -- Already applied. Checked on the reason rather than a flag column so this
  -- works on rows written before the column would have existed.
  if coalesce(v_earning.penalty_reason, '') ilike '%late attendance%' then
    return;
  end if;

  -- A settled earning is not editable — §88, and the teacher has already been
  -- paid against it. The penalty becomes its own line in the next settlement
  -- instead, which is what a payroll correction actually looks like.
  if v_earning.status = 'settled' then
    insert into public.teacher_earnings (
      teacher_id, booking_id, class_date, lesson_name, track, level,
      ratio, student_count, base_amount, bonus_amount,
      penalty_amount, penalty_reason, net_amount, amount, status
    ) values (
      v_earning.teacher_id, null, v_booking.slot_start,
      coalesce(v_booking.lesson_name, 'Class') || ' — late attendance',
      v_earning.track, v_earning.level, v_earning.ratio, v_earning.student_count,
      0, 0,
      v_amount,
      'Late attendance (' || round(v_hours) || 'h after the class, deadline ' || round(v_deadline) || 'h)',
      -v_amount, -v_amount, 'pending'
    );
    return;
  end if;

  update public.teacher_earnings
     set penalty_amount = coalesce(penalty_amount, 0) + v_amount,
         penalty_reason = trim(both ' ,' from
           coalesce(penalty_reason || ', ', '') ||
           'Late attendance (' || round(v_hours) || 'h after the class, deadline ' || round(v_deadline) || 'h)'),
         net_amount = coalesce(net_amount, amount, 0) - v_amount,
         amount = coalesce(amount, 0) - v_amount,
         updated_at = now()
   where id = v_earning.id;
end;
$$;

-- ── The trigger ─────────────────────────────────────────────────────────────
-- Fires on both the finalisation stamp and the status change, because either
-- can happen first and the penalty must land exactly once regardless.
create or replace function public.trg_late_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.apply_late_attendance_penalty(new.id);
  return new;
exception when others then
  -- A penalty must never stop a teacher closing a class. Attendance is what
  -- moves credits, pay and a child's progress; the deduction is the small half.
  return new;
end;
$$;

drop trigger if exists trg_booking_late_attendance on public.bookings;
create trigger trg_booking_late_attendance
  after update of attendance_finalized_at, status on public.bookings
  for each row execute function public.trg_late_attendance();

revoke execute on function public.apply_late_attendance_penalty(uuid) from public, anon;
grant  execute on function public.apply_late_attendance_penalty(uuid) to service_role;

-- ── The two knobs, so nobody has to edit this file to change the rule ───────
insert into public.app_settings (key, value)
values ('attendance_deadline_hours', '24'), ('penalty_late_attendance', '100')
on conflict (key) do nothing;
