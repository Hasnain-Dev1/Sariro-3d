-- ============================================================================
-- SARIRO — points, streaks and the things they unlock
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §56-57.
--
-- ── Two rules this schema enforces rather than trusts ───────────────────────
--
-- 1. Points are never money, in either direction. They cannot be bought, and
--    they cannot be turned into credits. The moment a child can convert
--    engagement into class time, "well done for coming" becomes a discount and
--    a parent is right to ask what they actually paid for. Rewards are
--    cosmetic — §57 says so, and `rewards.category` has no non-cosmetic value
--    to choose from.
--
-- 2. A balance only moves through a transaction. Same rule as credits (§79),
--    for the same reason: a number nobody can trace is a number nobody can
--    defend when a child says theirs is wrong.
--
-- ── Streaks are computed, not stored ────────────────────────────────────────
-- A stored streak is wrong the moment a class is cancelled, rescheduled or
-- back-dated, and it goes wrong silently. It is derived from attendance at
-- read time instead — the same rows that award the points.
-- ============================================================================

create table if not exists public.student_points (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  balance         integer not null default 0 check (balance >= 0),
  -- Never decreases. What the badges and levels are earned against, so spending
  -- on a cosmetic never costs a learner their standing.
  lifetime_earned integer not null default 0 check (lifetime_earned >= 0),
  updated_at      timestamptz not null default now()
);

create table if not exists public.point_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- Positive to earn, negative to spend.
  amount      integer not null check (amount <> 0),
  reason      text not null,
  kind        text not null default 'earn'
              check (kind in ('earn', 'spend', 'adjustment')),
  -- What caused it, when there is something to point at.
  booking_id  uuid references public.bookings(id) on delete set null,
  reward_key  text,
  created_at  timestamptz not null default now()
);

create index if not exists point_tx_user_idx
  on public.point_transactions (user_id, created_at desc);
-- One award per learner per class, enforced rather than checked in code.
create unique index if not exists point_tx_one_per_class
  on public.point_transactions (user_id, booking_id)
  where booking_id is not null and kind = 'earn';

-- ── The catalogue ───────────────────────────────────────────────────────────
create table if not exists public.rewards (
  key         text primary key,
  name        text not null,
  description text,
  -- Cosmetic categories only. There is deliberately no 'credit' or 'discount'.
  category    text not null
              check (category in ('theme', 'background', 'avatar', 'badge', 'effect')),
  cost        integer not null check (cost > 0),
  active      boolean not null default true,
  sort_order  integer not null default 100
);

create table if not exists public.student_rewards (
  user_id     uuid not null references auth.users(id) on delete cascade,
  reward_key  text not null references public.rewards(key) on delete cascade,
  unlocked_at timestamptz not null default now(),
  -- At most one equipped per category, enforced by the index below.
  equipped    boolean not null default false,
  primary key (user_id, reward_key)
);

create index if not exists student_rewards_user_idx
  on public.student_rewards (user_id);

-- ============================================================================
-- EARNING — awarded when attendance is marked, once per class
-- ============================================================================
create or replace function public.award_points(
  p_user_id uuid,
  p_amount  integer,
  p_reason  text,
  p_booking uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_amount <= 0 then return; end if;

  insert into public.point_transactions (user_id, amount, reason, kind, booking_id)
  values (p_user_id, p_amount, p_reason, 'earn', p_booking);

  insert into public.student_points (user_id, balance, lifetime_earned, updated_at)
  values (p_user_id, p_amount, p_amount, now())
  on conflict (user_id) do update
    set balance = public.student_points.balance + p_amount,
        lifetime_earned = public.student_points.lifetime_earned + p_amount,
        updated_at = now();
exception
  -- The unique index rejected a second award for the same class. Correct, and
  -- not an error worth failing attendance over.
  when unique_violation then return;
end;
$$;

-- §56 — "Students can earn points for attending class."
create or replace function public.award_points_on_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('present', 'late') then
    perform public.award_points(
      new.student_id,
      case when new.status = 'present' then 10 else 5 end,
      case when new.status = 'present' then 'Attended a class' else 'Joined a class late' end,
      new.booking_id
    );
  end if;
  return new;
exception when others then
  -- Points must never be the reason attendance fails to save.
  return new;
end;
$$;

drop trigger if exists trg_award_points_on_attendance on public.session_attendance;
create trigger trg_award_points_on_attendance
  after insert or update of status on public.session_attendance
  for each row execute function public.award_points_on_attendance();

-- ============================================================================
-- SPENDING — the only way a balance goes down
-- ============================================================================
create or replace function public.redeem_reward(p_reward_key text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_reward  public.rewards;
  v_balance integer;
begin
  if v_user is null then raise exception 'not signed in'; end if;

  select * into v_reward from public.rewards where key = p_reward_key and active;
  if not found then raise exception 'that reward is not available'; end if;

  if exists (select 1 from public.student_rewards where user_id = v_user and reward_key = p_reward_key) then
    raise exception 'you already have that one';
  end if;

  -- Locked so two quick taps cannot both pass the balance check.
  select balance into v_balance from public.student_points where user_id = v_user for update;
  if v_balance is null or v_balance < v_reward.cost then
    raise exception 'not enough points';
  end if;

  update public.student_points
     set balance = balance - v_reward.cost, updated_at = now()
   where user_id = v_user;

  insert into public.point_transactions (user_id, amount, reason, kind, reward_key)
  values (v_user, -v_reward.cost, 'Unlocked ' || v_reward.name, 'spend', p_reward_key);

  insert into public.student_rewards (user_id, reward_key) values (v_user, p_reward_key);

  return v_balance - v_reward.cost;
end;
$$;

-- One equipped item per category — swapping is a swap, not a stack.
create or replace function public.equip_reward(p_reward_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_category text;
begin
  if v_user is null then raise exception 'not signed in'; end if;

  select r.category into v_category
    from public.student_rewards sr
    join public.rewards r on r.key = sr.reward_key
   where sr.user_id = v_user and sr.reward_key = p_reward_key;
  if not found then raise exception 'you have not unlocked that yet'; end if;

  update public.student_rewards sr
     set equipped = false
    from public.rewards r
   where sr.reward_key = r.key
     and sr.user_id = v_user
     and r.category = v_category;

  update public.student_rewards
     set equipped = true
   where user_id = v_user and reward_key = p_reward_key;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.student_points     enable row level security;
alter table public.point_transactions enable row level security;
alter table public.rewards            enable row level security;
alter table public.student_rewards    enable row level security;

drop policy if exists points_own_read on public.student_points;
create policy points_own_read on public.student_points for select
  using (user_id = auth.uid()
         or exists (select 1 from public.profiles p
                     where p.id = auth.uid() and p.role in ('teacher','hr','admin','super_admin')));

drop policy if exists point_tx_own_read on public.point_transactions;
create policy point_tx_own_read on public.point_transactions for select
  using (user_id = auth.uid()
         or exists (select 1 from public.profiles p
                     where p.id = auth.uid() and p.role in ('hr','admin','super_admin')));

-- The catalogue is public to signed-in users; only staff change it.
drop policy if exists rewards_read on public.rewards;
create policy rewards_read on public.rewards for select using (auth.uid() is not null);

drop policy if exists student_rewards_own on public.student_rewards;
create policy student_rewards_own on public.student_rewards for select
  using (user_id = auth.uid()
         or exists (select 1 from public.profiles p
                     where p.id = auth.uid() and p.role in ('teacher','hr','admin','super_admin')));

-- No direct writes from anywhere: balances and unlocks move only through the
-- functions above, which is what keeps a transaction behind every change.
revoke execute on function public.award_points(uuid, integer, text, uuid) from public, anon;
grant  execute on function public.award_points(uuid, integer, text, uuid) to service_role;
grant  execute on function public.redeem_reward(text) to authenticated;
grant  execute on function public.equip_reward(text) to authenticated;

-- ============================================================================
-- A starting catalogue
-- ============================================================================
-- Cosmetic, cheap enough to reach in a few weeks of turning up, and worded for
-- a child. Prices are round numbers because a 10-point class should divide into
-- them cleanly — a reward costing 147 teaches nothing about saving up.
insert into public.rewards (key, name, description, category, cost, sort_order) values
  ('theme_midnight',   'Midnight',        'A dark blue dashboard.',              'theme',      100, 10),
  ('theme_forest',     'Forest',          'Deep greens.',                        'theme',      100, 11),
  ('theme_sunrise',    'Sunrise',         'Warm oranges and pinks.',             'theme',      150, 12),
  ('bg_space',         'Deep space',      'Stars behind your dashboard.',        'background', 200, 20),
  ('bg_ocean',         'Ocean',           'Underwater blues.',                   'background', 200, 21),
  ('avatar_robot',     'Robot',           'A friendly robot avatar.',            'avatar',      75, 30),
  ('avatar_astronaut', 'Astronaut',       'Suited up.',                          'avatar',     125, 31),
  ('badge_streak_5',   'Five in a row',   'For five classes without missing.',   'badge',      250, 40),
  ('effect_confetti',  'Confetti',        'Celebrate finishing a lesson.',       'effect',     300, 50)
on conflict (key) do nothing;
