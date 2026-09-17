-- SARIRO — payment links and autopay subscriptions, recorded
-- ============================================================================
-- Every payment link a seller, HR, an admin or the super admin makes from the
-- dashboard — a one-time Razorpay payment link, or an autopay link (a Razorpay
-- subscription that charges the family automatically) — gets a row here, with
-- who made it. The dashboard lists them from this table, filters by the
-- creator's email or phone, lets an admin end an autopay, and tells a student
-- in Settings how to pause or cancel an autopay made for their email or phone.
--
-- Rows are written only by the server (service role). No policies: nobody
-- reads this table with the anon or a user key.
--
-- Safe to run more than once. Run it BEFORE deploying the code that uses it.

create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('one_time', 'autopay')),
  razorpay_id text not null unique,
  razorpay_plan_id text,
  short_url text not null,
  status text not null,
  amount_inr numeric(12, 2) not null check (amount_inr > 0),
  frequency text check (frequency in ('monthly', 'quarterly', 'half_yearly', 'yearly')),
  total_count integer check (total_count between 1 and 120),
  paid_count integer not null default 0 check (paid_count >= 0),
  amount_paid_inr numeric(12, 2) not null default 0 check (amount_paid_inr >= 0),
  ratio text check (ratio in ('1:4', '1:1')),
  months integer,
  description text not null default '',
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_email text,
  lead_id uuid references public.student_leads(id) on delete set null,
  below_floor boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_by_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete set null,
  constraint payment_links_autopay_shape check (
    (kind = 'autopay' and frequency is not null and total_count is not null)
    or (kind = 'one_time' and frequency is null and total_count is null)
  )
);

create index if not exists payment_links_created_at_idx on public.payment_links (created_at desc);
create index if not exists payment_links_created_by_idx on public.payment_links (created_by);
create index if not exists payment_links_customer_email_idx on public.payment_links (lower(customer_email));
create index if not exists payment_links_customer_phone_idx on public.payment_links (customer_phone);

alter table public.payment_links enable row level security;

-- Check: one result set (Supabase shows only the last one).
select
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'payment_links') as table_should_be_1,
  (select count(*) from pg_indexes where schemaname = 'public' and tablename = 'payment_links') as indexes_should_be_at_least_5,
  (select relrowsecurity::int from pg_class where oid = 'public.payment_links'::regclass) as rls_should_be_1;
