-- =============================================================================
-- SARIRO — Learner Goals  (Stage 2 · the map's front door)
-- =============================================================================
-- What a learner said they want to become capable of.
--
-- This is the first thing on the map a learner can actually DO. Until now
-- /explore was a display: 68 strands, nothing to press. A goal is the moment
-- intent stops being invisible.
--
-- It works for all 68 strands including the 51 with no content, which is the
-- point: at current volume a mentor fulfils each one by hand, and the goals
-- table becomes the demand evidence that decides what to build — and how to
-- price it — instead of guessing.
--
-- Idempotent. Safe to re-run.
--   Supabase → SQL Editor → paste → Run
-- =============================================================================

create table if not exists public.learner_goals (
  id              uuid primary key default gen_random_uuid(),
  learner_id      uuid not null references auth.users (id) on delete cascade,

  -- What they pointed at. A strand slug from the capability map.
  capability_slug text not null references public.capabilities (slug) on update cascade on delete cascade,

  -- Optional: the learner's own words. The vision's entry point is "what do you
  -- want to become?", and their phrasing is worth more to a mentor than a slug.
  statement       text,

  status          text not null default 'wanted'
                    check (status in ('wanted', 'planned', 'active', 'achieved', 'dropped')),

  -- Where they were standing when they pressed it. Tells us which surface
  -- actually converts, without any third-party analytics.
  source          text not null default 'explore'
                    check (source in ('explore', 'strand', 'onboarding', 'mentor', 'course')),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One live goal per learner per strand. Pressing "Start this" twice is
-- enthusiasm, not a second goal.
create unique index if not exists learner_goals_unique_idx
  on public.learner_goals (learner_id, capability_slug);

create index if not exists learner_goals_learner_idx on public.learner_goals (learner_id);
create index if not exists learner_goals_slug_idx    on public.learner_goals (capability_slug);
create index if not exists learner_goals_status_idx  on public.learner_goals (status);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- A learner reads and withdraws their own goals. Creation goes through the
-- service-role route so the capability slug is validated against the real map
-- and rate limiting applies — otherwise the table is a spam target.
alter table public.learner_goals enable row level security;

drop policy if exists learner_goals_own_read on public.learner_goals;
create policy learner_goals_own_read
  on public.learner_goals for select
  using (auth.uid() = learner_id);

drop policy if exists learner_goals_own_drop on public.learner_goals;
create policy learner_goals_own_drop
  on public.learner_goals for update
  using (auth.uid() = learner_id)
  with check (auth.uid() = learner_id);

-- ── keep updated_at honest ───────────────────────────────────────────────────
create or replace function public.touch_learner_goals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists learner_goals_touch_updated_at on public.learner_goals;
create trigger learner_goals_touch_updated_at
  before update on public.learner_goals
  for each row execute function public.touch_learner_goals_updated_at();

-- ── what to look at ──────────────────────────────────────────────────────────
-- Demand across the map, strongest first. This is the view that should decide
-- which of the 51 empty strands gets built next, and whether people are asking
-- for one strand or for a direction that spans several.
create or replace view public.strand_demand as
select
  c.slug,
  c.name,
  c.domain_slug,
  count(g.id)                                              as goal_count,
  count(g.id) filter (where g.status = 'wanted')           as waiting,
  count(g.id) filter (where g.status = 'active')           as active,
  max(g.created_at)                                        as latest_request
from public.capabilities c
left join public.learner_goals g on g.capability_slug = c.slug
where c.kind = 'strand'
group by c.slug, c.name, c.domain_slug
order by goal_count desc, c.name;
