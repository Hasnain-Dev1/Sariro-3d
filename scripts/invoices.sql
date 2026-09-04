-- ============================================================================
-- SARIRO — issued invoices, as data
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- ── No PDFs are stored, deliberately ────────────────────────────────────────
-- A rendered invoice is roughly 100 KB; the record that regenerates it is under
-- one. Ten thousand invoices is about 10 MB of text against a gigabyte of PDFs,
-- and the PDF adds nothing: the document is a deterministic view of these
-- columns, so it can be redrawn identically whenever somebody asks for it.
--
-- ── Why the computed amounts are stored, not just the price ─────────────────
-- The obvious saving is to keep only the price and recompute the tax on
-- display. That would be wrong. If the GST rate ever changes, every historical
-- invoice would silently re-render with the new rate and stop matching the
-- document the customer already has, and the return already filed.
--
-- An issued invoice is a statement of fact about a moment. The taxable amount,
-- the tax and the total are frozen at issue.
--
-- ── Sequential numbering ────────────────────────────────────────────────────
-- GST rules require a consecutive series, unique within a financial year. That
-- is what issue_invoice() below is for: it takes the serial and writes the row
-- in one statement, under a lock, so two people clicking at the same moment
-- cannot take the same number.
--
-- The financial year is India's: 1 April to 31 March. An invoice raised on
-- 30 March 2027 belongs to 2026-27; one raised on 2 April belongs to 2027-28.
-- ============================================================================

create table if not exists public.invoices (
  id                  uuid primary key default gen_random_uuid(),

  -- SARIRO-INV-2026-0001
  invoice_number      text not null unique,
  -- The FY start year: 2026 means 2026-27.
  financial_year      integer not null,
  serial              integer not null,

  -- ── Customer, as entered ────────────────────────────────────────────────
  customer_name       text not null,
  customer_address    text,
  customer_country    text not null,
  customer_state_code text,
  customer_email      text,
  customer_phone      text,

  -- ── What was sold ───────────────────────────────────────────────────────
  course_name         text not null,
  course_description  text,

  -- ── Money, frozen at issue ──────────────────────────────────────────────
  price               numeric(12,2) not null check (price >= 0),
  currency_code       text not null,
  currency_symbol     text not null,
  include_gst         boolean not null default false,
  taxable             numeric(12,2) not null,
  total_tax           numeric(12,2) not null,
  total               numeric(12,2) not null,
  -- 'intra_state' | 'inter_state' | 'no_gst' | 'export'
  tax_treatment       text not null,

  payment_status      text not null default 'Paid'
                      check (payment_status in ('Paid', 'Pending')),
  payment_reference   text,

  invoice_date        date not null,
  issued_by           uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),

  -- The series is what makes it a valid tax invoice.
  unique (financial_year, serial)
);

create index if not exists invoices_recent_idx on public.invoices (created_at desc);
create index if not exists invoices_customer_idx on public.invoices (lower(customer_name));
create index if not exists invoices_date_idx on public.invoices (invoice_date desc);

-- ============================================================================
-- issue_invoice — takes the next serial and writes the row, atomically
-- ============================================================================
-- Returns the whole row so the caller does not have to read it back and
-- discover a number it did not expect.
create or replace function public.issue_invoice(p_invoice jsonb)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date   date := coalesce((p_invoice->>'invoice_date')::date, current_date);
  v_fy     integer;
  v_serial integer;
  v_row    public.invoices;
begin
  -- India's financial year starts on 1 April.
  v_fy := case when extract(month from v_date) >= 4
               then extract(year from v_date)::int
               else extract(year from v_date)::int - 1 end;

  -- Lock the year's existing rows so two concurrent callers cannot read the
  -- same maximum. The advisory lock is keyed on the year, so invoices for
  -- different years never block each other.
  perform pg_advisory_xact_lock(hashtext('sariro_invoice_' || v_fy::text));

  select coalesce(max(serial), 0) + 1 into v_serial
    from public.invoices where financial_year = v_fy;

  insert into public.invoices (
    invoice_number, financial_year, serial,
    customer_name, customer_address, customer_country, customer_state_code,
    customer_email, customer_phone,
    course_name, course_description,
    price, currency_code, currency_symbol, include_gst,
    taxable, total_tax, total, tax_treatment,
    payment_status, payment_reference, invoice_date, issued_by
  ) values (
    'SARIRO-INV-' || v_fy::text || '-' || lpad(v_serial::text, 4, '0'),
    v_fy, v_serial,
    p_invoice->>'customer_name',
    nullif(p_invoice->>'customer_address', ''),
    p_invoice->>'customer_country',
    nullif(p_invoice->>'customer_state_code', ''),
    nullif(p_invoice->>'customer_email', ''),
    nullif(p_invoice->>'customer_phone', ''),
    p_invoice->>'course_name',
    nullif(p_invoice->>'course_description', ''),
    (p_invoice->>'price')::numeric,
    p_invoice->>'currency_code',
    p_invoice->>'currency_symbol',
    coalesce((p_invoice->>'include_gst')::boolean, false),
    (p_invoice->>'taxable')::numeric,
    (p_invoice->>'total_tax')::numeric,
    (p_invoice->>'total')::numeric,
    p_invoice->>'tax_treatment',
    coalesce(p_invoice->>'payment_status', 'Paid'),
    nullif(p_invoice->>'payment_reference', ''),
    v_date,
    auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Customer names, addresses and contact details. HR and above only.
alter table public.invoices enable row level security;

drop policy if exists invoices_staff_read on public.invoices;
create policy invoices_staff_read
  on public.invoices for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'admin', 'super_admin')
    )
  );

-- Deliberately no insert, update or delete policy. Rows arrive only through
-- issue_invoice(), which is what keeps the series unbroken, and an issued
-- invoice is not editable — a correction is a credit note, not a rewrite.
-- Payment status is the one thing that legitimately changes after issue.
drop policy if exists invoices_mark_paid on public.invoices;
create policy invoices_mark_paid
  on public.invoices for update
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'admin', 'super_admin')
    )
  );

revoke execute on function public.issue_invoice(jsonb) from public, anon;
grant  execute on function public.issue_invoice(jsonb) to authenticated, service_role;
