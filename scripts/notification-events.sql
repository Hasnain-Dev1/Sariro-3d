-- ============================================================================
-- SARIRO — the notifications that actually fire
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Run LAST — after settlement-cycle.sql and auto-settle-in-db.sql, whose
-- columns these triggers read. Out of order they degrade to silence rather than
-- breaking anything, but in order they actually notify.
--
-- V2 §75 lists what each role should be told; §86 lists the moments that should
-- generate it. The bell, the dropdown and the notifications table were already
-- built — what was missing is anything writing to them. A notification centre
-- that stays empty trains people to stop looking at it, which is worse than not
-- having one.
--
-- ── Why triggers rather than API code ───────────────────────────────────────
-- Every event below is already a database write made from more than one place:
-- a penalty is written by the completion trigger, a settlement by the teacher,
-- by the app and by pg_cron. Hanging the notification off the row means it
-- fires however the row got there. Putting it in one API route would mean the
-- automatic settlement on the 5th told nobody.
--
-- ── Never let a notification break the thing it is about ────────────────────
-- Each trigger swallows its own errors. A malformed notification must not roll
-- back a settlement or a penalty — being told about your pay matters, being
-- paid matters more.
-- ============================================================================

-- ── Helper: write one, and never fail the caller ────────────────────────────
create or replace function public.notify_user(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_message text default null,
  p_link    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then return; end if;
  insert into public.notifications (user_id, type, title, message, link, is_read)
  values (p_user_id, p_type, p_title, p_message, p_link, false);
exception when others then
  -- Deliberately swallowed. See the note at the top.
  return;
end;
$$;

-- ============================================================================
-- §75 — "Penalty generated"
-- ============================================================================
-- Fires when an earning is written carrying a deduction. The reason travels
-- with it, because §23 is explicit that a teacher must never see a bare
-- "Penalty ₹300" without knowing which class caused it.
create or replace function public.notify_on_penalty()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.penalty_amount, 0) > 0 then
    perform public.notify_user(
      new.teacher_id,
      'penalty_generated',
      '₹' || round(new.penalty_amount)::text || ' deducted',
      coalesce(new.penalty_reason, 'A deduction was applied')
        || ' — class on ' || to_char(new.class_date at time zone 'Asia/Kolkata', 'DD Mon'),
      '/dashboard/teacher#earnings'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_penalty on public.teacher_earnings;
create trigger trg_notify_on_penalty
  after insert on public.teacher_earnings
  for each row execute function public.notify_on_penalty();

-- ============================================================================
-- §75 — "Settlement available" / settled
-- ============================================================================
-- Especially important for the automatic run: money moving on a teacher's
-- behalf, with no click of theirs, must not be something they discover later.
create or replace function public.notify_on_settlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_user(
    new.teacher_id,
    'settlement_created',
    case when new.settlement_type = 'auto'
         then 'We settled ' || coalesce(new.period_month, 'last month') || ' for you'
         else coalesce(new.period_month, 'Your month') || ' settled' end,
    '₹' || round(coalesce(new.total_amount, 0))::text
      || ' across ' || coalesce(new.total_classes, 0)::text || ' classes.'
      || case when new.settlement_type = 'auto'
              then ' Settled automatically on the 5th because it had not been settled.'
              else '' end
      || case when coalesce(new.raw_amount, 0) < 0
              then ' Deductions exceeded earnings this period, so it was recorded at ₹0 — HR will be in touch.'
              else '' end,
    '/dashboard/teacher#earnings'
  );
  return new;
exception when others then
  -- This reads period_month, settlement_type and raw_amount, all added by
  -- earlier migrations. Run out of order, a missing column would otherwise
  -- abort the INSERT itself — so a teacher would fail to be paid because we
  -- could not tell them they had been. The notification is the expendable half.
  return new;
end;
$$;

drop trigger if exists trg_notify_on_settlement on public.teacher_settlements;
create trigger trg_notify_on_settlement
  after insert on public.teacher_settlements
  for each row execute function public.notify_on_settlement();

-- ============================================================================
-- §75 — "Monitoring result"
-- ============================================================================
-- §32: "Teachers should understand why they received their score." Telling them
-- a score exists is the first half of that; the link carries them to the rest.
do $$
begin
  if to_regclass('public.teacher_monitoring') is null then
    raise notice 'teacher_monitoring not found — skipping its notification trigger.';
    return;
  end if;

  execute $fn$
    create or replace function public.notify_on_monitoring()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $inner$
    begin
      perform public.notify_user(
        new.teacher_id,
        'monitoring_result',
        'Your class was observed',
        case when new.overall_score is null
             then 'Feedback has been recorded on one of your classes.'
             else 'Overall score ' || new.overall_score::text || '/10. Open it to see the detail.' end,
        '/dashboard/teacher#monitoring'
      );
      return new;
    end;
    $inner$;
  $fn$;

  execute 'drop trigger if exists trg_notify_on_monitoring on public.teacher_monitoring';
  execute 'create trigger trg_notify_on_monitoring after insert on public.teacher_monitoring
           for each row execute function public.notify_on_monitoring()';
end $$;

-- ============================================================================
-- §75, §86 — "Low credits"
-- ============================================================================
-- Fires on the crossing, not on every class. A student whose balance sits at 2
-- for three weeks should be told once, not nine times — a warning repeated
-- until it is background noise has stopped being a warning.
create or replace function public.notify_on_low_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(old.balance, 0) >= 4 and coalesce(new.balance, 0) < 4 then
    perform public.notify_user(
      new.user_id,
      'low_credits',
      case when coalesce(new.balance, 0) <= 0
           then 'You are out of credits'
           else 'Only ' || round(new.balance)::text || ' credits left' end,
      case when coalesce(new.balance, 0) <= 0
           then 'Top up to keep your classes running.'
           else 'One credit is one class. Top up before they run out.' end,
      '/dashboard/student'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_low_credits on public.credits;
create trigger trg_notify_on_low_credits
  after update of balance on public.credits
  for each row execute function public.notify_on_low_credits();

revoke execute on function public.notify_user(uuid, text, text, text, text) from public, anon;
grant  execute on function public.notify_user(uuid, text, text, text, text) to service_role;
