-- ============================================================================
-- SARIRO — the price book (pricing & profitability calculator)
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- What it stores: the assumptions management prices with (teacher rates, CAC,
-- reserves, GST, the gateway), the seller price ladder for every plan (public
-- price, the two offers, the manager-approved floor) and the cohort being
-- modelled — one JSON document, plus every earlier version of it.
--
-- Why a table of its own and not app_settings: floors and the cost of a teacher
-- are not something a customer should be able to read. These two tables have
-- RLS switched on and NO policies, so only the service role — the API routes,
-- after they have checked the caller is HR or the super admin — can touch them.
-- A seller receives the ladder through /api/seller/prices, which strips out
-- every cost and the mathematical minimum.
--
-- Until this has run, the calculator still works on its defaults; it just
-- cannot save, and sellers see the default price list.
-- ============================================================================

create table if not exists public.price_book (
  id          text primary key default 'current' check (id = 'current'),
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null
);

create table if not exists public.price_book_history (
  id          bigint generated always as identity primary key,
  data        jsonb not null,
  note        text,
  changed_at  timestamptz not null default now(),
  changed_by  uuid references public.profiles(id) on delete set null
);

create index if not exists price_book_history_changed_at_idx
  on public.price_book_history (changed_at desc);

alter table public.price_book enable row level security;
alter table public.price_book_history enable row level security;

revoke all on public.price_book from anon, authenticated;
revoke all on public.price_book_history from anon, authenticated;

-- One result set, so the editor shows it (Supabase only displays the last one).
select
  (select count(*) from information_schema.tables
     where table_schema = 'public' and table_name in ('price_book', 'price_book_history')) as tables_present,
  (select bool_and(relrowsecurity) from pg_class
     where relname in ('price_book', 'price_book_history') and relnamespace = 'public'::regnamespace) as rls_on,
  (select count(*) from pg_policies
     where schemaname = 'public' and tablename in ('price_book', 'price_book_history')) as policies_should_be_0;
