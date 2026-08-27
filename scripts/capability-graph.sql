-- =============================================================================
-- SARIRO — Capability Map  (Stage 2 · S0)
-- =============================================================================
-- The outline of everything a learner can become capable of. Not a curriculum:
-- no content lives here, and most nodes will never have a lesson attached.
--
-- Idempotent. Safe to re-run. Run this BEFORE capability-seed.generated.sql.
--
--   Supabase → SQL Editor → paste → Run
-- =============================================================================

-- ── the map ──────────────────────────────────────────────────────────────────
create table if not exists public.capabilities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  kind         text not null check (kind in ('domain', 'strand', 'capability')),
  domain_slug  text not null,
  parent_slug  text references public.capabilities (slug) on update cascade on delete cascade,
  description  text not null default '',
  is_meta      boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists capabilities_parent_idx on public.capabilities (parent_slug);
create index if not exists capabilities_domain_idx on public.capabilities (domain_slug);
create index if not exists capabilities_kind_idx   on public.capabilities (kind);

-- ── content attaches here, and mostly will not ───────────────────────────────
-- A lesson develops one or more capabilities, with a weight saying how much.
-- unit_key is the canonical content id from src/lib/curriculum/identity.ts.
create table if not exists public.content_capabilities (
  unit_key        text not null,
  capability_slug text not null references public.capabilities (slug) on update cascade on delete cascade,
  weight          numeric(3, 2) not null default 1.00 check (weight > 0 and weight <= 1),
  created_at      timestamptz not null default now(),
  primary key (unit_key, capability_slug)
);

create index if not exists content_capabilities_slug_idx on public.content_capabilities (capability_slug);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- The map is the public promise — anyone may read it, signed in or not. Nobody
-- writes it through the API: there are deliberately no insert/update/delete
-- policies, so only the service role (which bypasses RLS) can change the map,
-- and only by running a generated seed file that was reviewed as a diff.
alter table public.capabilities         enable row level security;
alter table public.content_capabilities enable row level security;

drop policy if exists capabilities_public_read on public.capabilities;
create policy capabilities_public_read
  on public.capabilities for select
  using (true);

drop policy if exists content_capabilities_public_read on public.content_capabilities;
create policy content_capabilities_public_read
  on public.content_capabilities for select
  using (true);

-- ── keep updated_at honest ───────────────────────────────────────────────────
create or replace function public.touch_capabilities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists capabilities_touch_updated_at on public.capabilities;
create trigger capabilities_touch_updated_at
  before update on public.capabilities
  for each row execute function public.touch_capabilities_updated_at();

-- ── sanity ───────────────────────────────────────────────────────────────────
-- A domain is a root; everything else must hang off something.
alter table public.capabilities drop constraint if exists capabilities_root_shape;
alter table public.capabilities add constraint capabilities_root_shape
  check ((kind = 'domain' and parent_slug is null) or (kind <> 'domain' and parent_slug is not null));
