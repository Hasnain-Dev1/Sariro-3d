-- ============================================================================
-- SARIRO — the pay rates, readable by the people they apply to
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Run AFTER scripts/teacher-pay-from-settings.sql.
--
-- V2 §35: "Show exact configured rates. Do not hardcode the values. Rates must
-- come from the teacher payout/tier configuration."
--
-- ── Why a function and not a query in the app ───────────────────────────────
-- The rates are resolved by setting_num('pay_tier2_1on1', 250) — a configured
-- value with a code default behind it. An app that read app_settings directly
-- would have to repeat those defaults, and the day somebody changed the default
-- in the trigger the teacher's screen would keep showing the old one. A rate
-- displayed that differs from the rate paid is worse than showing no rate: it
-- is a number a teacher will plan around and then be wrong about.
--
-- So the display asks the database the same question the trigger asks, through
-- the same function, and the two cannot drift.
--
-- The defaults below are copied from create_teacher_earning_on_complete(). They
-- are the only duplication left, and they are here so that a rate is still
-- shown on a fresh install where nothing has been configured yet.
-- ============================================================================

create or replace function public.teacher_pay_rates()
returns table (
  tier        int,
  rate_1on1   numeric,
  rate_group  numeric,
  group_bonus numeric
)
language sql
stable
as $$
  select
    t.tier,
    public.setting_num('pay_tier' || t.tier || '_1on1',
      case t.tier when 1 then 300 when 2 then 250 else 225 end),
    public.setting_num('pay_tier' || t.tier || '_group',
      case t.tier when 1 then 300 when 2 then 275 else 250 end),
    public.setting_num('pay_group_bonus', 25)
  from (select unnest(array[1, 2, 3]) as tier) t
  order by t.tier;
$$;

grant execute on function public.teacher_pay_rates() to authenticated, service_role;

-- ── A teacher's own tier, without exposing the rest of their profile ────────
create or replace function public.my_teacher_tier()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(teacher_tier, 3) from public.profiles where id = auth.uid();
$$;

grant execute on function public.my_teacher_tier() to authenticated;
