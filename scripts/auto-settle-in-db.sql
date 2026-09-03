-- ============================================================================
-- SARIRO — automatic settlement, scheduled inside the database
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Run AFTER scripts/settlement-cycle.sql.
--
-- V2 §42: "If teacher does not manually settle, automatically settle on the 5th
-- of the month at 10:00 AM IST."
--
-- ── Why this exists ─────────────────────────────────────────────────────────
-- The first version needed a cron job on the web host to call an HTTP endpoint.
-- That host's scheduler is not reachable, so the promise "you are paid on the
-- 5th" depended on infrastructure nobody could switch on.
--
-- Supabase can schedule work itself. pg_cron runs next to the data, needs no
-- web server to be awake, no secret to leak, and no network hop that can fail
-- silently at 10am on a Sunday.
--
-- ── One implementation, three callers ───────────────────────────────────────
-- settle_teacher_month() below is now the ONLY code that creates a settlement.
-- The teacher pressing Settle, the app noticing the 5th has passed, and this
-- schedule all call it. §78 says the same final figure must appear in the
-- teacher, HR and super-admin views; three separate implementations of "bundle
-- the month" is precisely how that stops being true.
--
-- ── Negative months ─────────────────────────────────────────────────────────
-- A month can come out negative when penalties exceed what was earned — it is
-- in the data today. Paying a negative amount would mean invoicing a teacher,
-- which is not a thing payroll does. So the settlement is capped at zero and
-- the true figure is kept beside it in `raw_amount`, visible and unhidden, for
-- HR to act on. Nothing is silently written off and nothing is silently
-- charged.
-- ============================================================================

alter table public.teacher_settlements
  -- What the month actually came to before the floor. Equal to total_amount in
  -- the ordinary case; lower only when penalties exceeded earnings.
  add column if not exists raw_amount numeric(12,2);

-- ============================================================================
-- settle_teacher_month — the single writer of settlements
-- ============================================================================
-- p_month is 'YYYY-MM' and names the month being closed. Returns the settlement
-- id, or null when there was nothing to settle or it was already done.
create or replace function public.settle_teacher_month(
  p_teacher_id uuid,
  p_month      text,
  p_type       text default 'auto',
  p_reason     text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start_ist timestamp;
  v_end_ist   timestamp;
  v_start     timestamptz;
  v_end       timestamptz;
  v_existing  uuid;
  v_count     int;
  v_raw       numeric;
  v_paid      numeric;
  v_id        uuid;
begin
  if p_type not in ('manual', 'auto') then
    raise exception 'settlement type must be manual or auto, got %', p_type;
  end if;

  -- The month's boundaries as wall-clock time in India, then as real instants.
  -- Doing it this way is what keeps a class at 23:30 IST on the 31st inside the
  -- month it was actually taught in.
  v_start_ist := to_timestamp(p_month || '-01', 'YYYY-MM-DD')::timestamp;
  v_end_ist   := v_start_ist + interval '1 month';
  v_start     := v_start_ist at time zone 'Asia/Kolkata';
  v_end       := v_end_ist   at time zone 'Asia/Kolkata';

  -- Already settled? Say nothing and change nothing. This is what makes an
  -- hourly schedule safe to run 720 times a month.
  select id into v_existing
    from public.teacher_settlements
   where teacher_id = p_teacher_id and period_month = p_month;
  if found then
    return null;
  end if;

  -- Everything up to the end of the month, not only what falls inside it: a
  -- class from August marked complete on 7 September creates its earning row
  -- after August closed, and filtering strictly would strand it forever.
  select count(*), coalesce(sum(coalesce(net_amount, amount, 0)), 0)
    into v_count, v_raw
    from public.teacher_earnings
   where teacher_id = p_teacher_id
     and status = 'pending'
     and settlement_id is null
     and class_date < v_end;

  if v_count = 0 then
    return null;
  end if;

  -- Capped at zero. See the note at the top of this file.
  v_paid := greatest(v_raw, 0);

  insert into public.teacher_settlements (
    teacher_id, period_month, period_start, period_end,
    total_classes, total_amount, raw_amount,
    status, payment_status, settlement_type, auto_reason,
    requested_at, settled_at
  ) values (
    p_teacher_id, p_month, v_start, v_end,
    v_count, v_paid, v_raw,
    'requested', 'teacher_settled', p_type,
    case
      when p_reason is not null then p_reason
      when p_type = 'auto' then 'Not settled by the 5th — settled automatically at 10:00 IST (§42).'
      else null
    end,
    now(), now()
  )
  returning id into v_id;

  update public.teacher_earnings
     set status = 'settled', settlement_id = v_id, settled_at = now()
   where teacher_id = p_teacher_id
     and status = 'pending'
     and settlement_id is null
     and class_date < v_end;

  return v_id;
exception
  -- The unique index caught a concurrent run. That is the guard working.
  when unique_violation then
    return null;
end;
$$;

-- ============================================================================
-- auto_settle_due — what the schedule calls
-- ============================================================================
-- Decides for itself whether it is time. Running it on the 3rd does nothing;
-- running it late catches up rather than skipping somebody's month. That is why
-- an hourly schedule is correct and no timezone arithmetic is needed anywhere
-- outside this function.
create or replace function public.auto_settle_due()
returns table (settled_teachers int, month text, ran boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now_ist   timestamp := (now() at time zone 'Asia/Kolkata');
  v_month     text;
  v_end       timestamptz;
  v_due_ist   timestamp;
  v_teacher   uuid;
  v_n         int := 0;
begin
  -- The 5th of this month at 10:00, India time.
  v_due_ist := date_trunc('month', v_now_ist) + interval '4 days' + interval '10 hours';

  -- The month that closed is the one before the current one.
  v_month := to_char(date_trunc('month', v_now_ist) - interval '1 month', 'YYYY-MM');
  v_end   := date_trunc('month', v_now_ist) at time zone 'Asia/Kolkata';

  if v_now_ist < v_due_ist then
    return query select 0, v_month, false;
    return;
  end if;

  for v_teacher in
    select distinct teacher_id
      from public.teacher_earnings
     where status = 'pending'
       and settlement_id is null
       and class_date < v_end
       and teacher_id is not null
  loop
    if public.settle_teacher_month(v_teacher, v_month, 'auto', null) is not null then
      v_n := v_n + 1;
    end if;
  end loop;

  return query select v_n, v_month, true;
end;
$$;

revoke execute on function public.settle_teacher_month(uuid, text, text, text) from public, anon;
revoke execute on function public.auto_settle_due() from public, anon;
grant  execute on function public.settle_teacher_month(uuid, text, text, text) to authenticated, service_role;
grant  execute on function public.auto_settle_due() to service_role;

-- ============================================================================
-- THE SCHEDULE
-- ============================================================================
-- If this errors, enable pg_cron first in the Supabase dashboard:
--   Database → Extensions → search "pg_cron" → enable.
create extension if not exists pg_cron with schema cron;

-- Hourly. The function decides whether it is due, so the hour this fires on
-- does not matter and the server's timezone never enters into it.
select cron.unschedule('sariro-auto-settle')
 where exists (select 1 from cron.job where jobname = 'sariro-auto-settle');

select cron.schedule('sariro-auto-settle', '0 * * * *', $cron$ select public.auto_settle_due(); $cron$);

-- ── Check it ────────────────────────────────────────────────────────────────
-- Scheduled jobs:            select * from cron.job;
-- Recent runs:               select * from cron.job_run_details
--                             where jobname = 'sariro-auto-settle'
--                             order by start_time desc limit 10;
-- Dry look at what is due:   select * from public.auto_settle_due();
--   (that one is NOT a dry run — it settles if due. Before the 5th it is safe
--    and returns ran = false.)
