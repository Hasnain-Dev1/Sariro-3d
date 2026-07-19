-- ════════════════════════════════════════════════════════════════
-- SARIRO — app_settings table
--
-- Single-row-per-key settings store. Backs the super-admin pricing
-- editor + any other app-wide tunables (Razorpay links, prices, etc.).
--
-- Run this in Supabase SQL editor (or via `psql`).
-- Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1. Table ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key         text primary key,
  value       text not null default '',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

comment on table  public.app_settings is 'App-wide key/value settings (Razorpay links, prices, feature flags, etc.).';
comment on column public.app_settings.key is 'Stable identifier — e.g. razorpay_links, price_beginner.';
comment on column public.app_settings.value is 'String value. Complex values stored as JSON.';
comment on column public.app_settings.updated_by is 'The super-admin who last wrote this row.';

-- 2. Indexes -------------------------------------------------------------------
-- (PK already indexes `key` — no additional indexes needed for this size.)

-- 3. Updated_at trigger --------------------------------------------------------
create or replace function public.touch_app_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_settings_touch on public.app_settings;
create trigger trg_app_settings_touch
  before update on public.app_settings
  for each row
  execute function public.touch_app_settings_updated_at();

-- 4. RLS policies --------------------------------------------------------------
alter table public.app_settings enable row level security;

-- 4a. Anyone (incl. anon) can READ — the public pricing page needs live links.
drop policy if exists "app_settings_read_all" on public.app_settings;
create policy "app_settings_read_all"
  on public.app_settings for select
  using (true);

-- 4b. Only super_admins can WRITE.
drop policy if exists "app_settings_write_super_admin" on public.app_settings;
create policy "app_settings_write_super_admin"
  on public.app_settings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.role = 'super_admin' or p.is_super_admin = true)
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.role = 'super_admin' or p.is_super_admin = true)
    )
  );

-- 5. Seed data -----------------------------------------------------------------
-- These mirror the code-level defaults in src/lib/dashboard/settings-data.ts
-- so the pricing page works out of the box. Super-admin edits will upsert.

insert into public.app_settings (key, value) values
  ('razorpay_links', '{"Beginner":"https://pages.razorpay.com/sarirobeginner","Intermediate":"https://pages.razorpay.com/sarirointermediate","Advanced":"https://pages.razorpay.com/sariroadvanced"}'),
  ('razorpay_links_premium', '{"Beginner":"https://pages.razorpay.com/sarirobeginnerpremium","Intermediate":"https://pages.razorpay.com/sarirointermediatepremium","Advanced":"https://pages.razorpay.com/sariroadvancedpremium"}'),
  ('price_beginner', '199'),
  ('price_intermediate', '299'),
  ('price_advanced', '699'),
  ('price_beginner_1on1', '299'),
  ('price_intermediate_1on1', '399'),
  ('price_advanced_1on1', '899'),
  ('price_beginner_original', '398'),
  ('price_intermediate_original', '854'),
  ('price_advanced_original', '2330')
on conflict (key) do nothing;

-- 6. Verification --------------------------------------------------------------
-- select key, left(value, 60) as preview, updated_at
--   from public.app_settings
--   order by key;
