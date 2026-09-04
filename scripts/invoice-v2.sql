-- ============================================================================
-- SARIRO — invoice numbers that cannot be guessed, and money paid in parts
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Run AFTER scripts/invoices.sql, scripts/sales-ledger.sql, scripts/invoice-state.sql.
--
-- Four things.
--
-- ── 1. The number was guessable, and too long ───────────────────────────────
-- SARIRO-INV-2026-0001 tells anyone holding one invoice what every other
-- invoice is called. The next one is 0002. Someone can print a document with a
-- plausible number on it and there is nothing on the paper that says it is
-- fake — you have to go and look it up.
--
-- It was also twenty characters. Rule 46(b) of the CGST Rules caps a tax
-- invoice number at SIXTEEN, and requires it to be a consecutive serial number,
-- unique within a financial year. Both halves of that rule matter here: the
-- serial cannot be replaced with something random, because "consecutive" is the
-- legal requirement. So the serial stays, and an unguessable check code is
-- appended to it:
--
--     SR2627-0042-K7XQ        16 characters exactly
--     ││ │    │    └── HMAC-SHA256 of (year, serial) under a secret only the
--     ││ │    │        database holds. 32^4 ≈ 1.05 million possibilities.
--     ││ │    └─────── the consecutive serial the law asks for
--     ││ └──────────── financial year 2026-27
--     └┴────────────── Sariro
--
-- A forged number now fails in one second, offline, because the last four
-- characters cannot be computed without the key. verify_invoice_number() below
-- is what HR calls when a parent sends a screenshot.
--
-- What this does NOT do is hide how many invoices have been raised — it cannot,
-- because the serial is the part the law requires. Anyone who has an invoice
-- knows roughly where you are in the year. That is true of every GST-compliant
-- invoice in India and is not something a numbering scheme can fix.
--
-- ── 2. Money arrives in parts ───────────────────────────────────────────────
-- A parent pays half now and half in six weeks. Two things follow.
--
-- The invoice must say what the whole course costs, what had already been
-- paid, and what is being paid today — otherwise the second invoice looks like
-- a second course.
--
-- And the tax goes on TODAY'S amount, not the course total. Under GST the time
-- of supply for a service includes receipt of payment, so each receipt carries
-- its own tax. Charging the full course's GST on the first installment would
-- collect tax on money nobody has received.
--
-- So `price` keeps its meaning — the amount received on this invoice, which is
-- the taxable base — and course_total / previously_paid are context printed
-- beside it. The sales ledger therefore counts money received and can never
-- over-count a course that is only half paid.
--
-- ── 3. The transaction id, and the promise that it is used once ─────────────
-- The bank's UTR, the Razorpay payment id, the cheque number: the thing that
-- proves the money moved. Unique across every invoice, so the same payment
-- cannot be billed twice — which is the same guarantee the sales ledger makes
-- with the invoice number, one layer further down.
--
-- ── 4. New business versus a renewal ────────────────────────────────────────
-- A renewal does not go through a trial, and counting the two together makes
-- growth look like whatever churn happens to be. It is set on the invoice
-- rather than typed into the ledger, for the same reason as everything else
-- here: what HR already knows should not be asked again.
-- ============================================================================

-- hmac() and gen_random_bytes() live in pgcrypto. Supabase installs it into
-- `extensions`; a plain install lands in `public`. The functions below set a
-- search_path covering both, so either works.
create extension if not exists pgcrypto;

-- gen_random_bytes() below is pgcrypto's, and on Supabase pgcrypto lives in
-- `extensions`. The functions each set their own search_path; this one is for
-- the plain statements in this script.
set search_path = public, extensions;

-- ============================================================================
-- Dropped before re-creating, not replaced
-- ============================================================================
-- `create or replace function` refuses to change the columns a function
-- returns:
--
--     ERROR: cannot change return type of existing function
--     DETAIL: Row type defined by OUT parameters is different.
--
-- invoice_preview() gains three columns in this script, so it has to go first.
-- The others are dropped for the same reason even where they would survive a
-- replace, because issue_invoice() and record_sale() return whole table rows
-- and this script adds columns to both tables. Dropping loses their grants,
-- which is why every grant is re-issued at the bottom.
--
-- Nothing depends on these functions, so the drops are safe. They are also why
-- the whole script is safe to run again after a failure: the Supabase SQL
-- editor runs it in one transaction, so a failure anywhere leaves nothing
-- behind to conflict with the next attempt.
drop function if exists public.invoice_preview(text);
drop function if exists public.verify_invoice_number(text);
drop function if exists public.issue_invoice(jsonb);
drop function if exists public.record_sale(text, uuid, text);

-- ============================================================================
-- The signing key
-- ============================================================================
-- One row, generated once, never displayed. RLS is enabled with NO policy at
-- all: that means no client can read it under any role. The security definer
-- functions below run as the table's owner, which is how they can.
create table if not exists public.invoice_signing_key (
  id         integer primary key default 1 check (id = 1),
  secret     bytea  not null,
  created_at timestamptz not null default now()
);

alter table public.invoice_signing_key enable row level security;
revoke all on public.invoice_signing_key from anon, authenticated;

-- Generated once. Re-running this script must never mint a new key — every
-- invoice already issued would stop verifying.
insert into public.invoice_signing_key (id, secret)
select 1, gen_random_bytes(32)
where not exists (select 1 from public.invoice_signing_key where id = 1);

comment on table public.invoice_signing_key is
  'HMAC key behind the check code in every invoice number. Never rotate: rotating invalidates the code on every invoice already issued.';

-- ============================================================================
-- invoice_check_code — the unguessable tail
-- ============================================================================
create or replace function public.invoice_check_code(
  p_fy     integer,
  p_serial integer,
  p_len    integer default 4
)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  -- Crockford-style: no 0/O or 1/I, because this gets read off paper and
  -- typed back in by someone on the phone.
  v_alpha  constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_secret bytea;
  v_digest bytea;
  v_out    text := '';
  i        integer;
begin
  select secret into v_secret from public.invoice_signing_key where id = 1;
  if v_secret is null then
    raise exception 'The invoice signing key is missing. Re-run scripts/invoice-v2.sql.';
  end if;

  -- pgcrypto's hmac() takes (text,text,text) or (bytea,bytea,text) and nothing
  -- in between. The key is bytea, so the message is converted rather than the
  -- key cast to text, which would depend on bytea_output and stop matching if
  -- that setting ever changed.
  v_digest := hmac(convert_to(p_fy::text || ':' || p_serial::text, 'UTF8'), v_secret, 'sha256');

  -- Five bits per symbol, taken from the low bits of each byte. Truncating a
  -- MAC is standard practice and leaves every symbol uniformly distributed.
  for i in 0 .. greatest(p_len, 1) - 1 loop
    v_out := v_out || substr(v_alpha, (get_byte(v_digest, i) % 32) + 1, 1);
  end loop;

  return v_out;
end;
$$;

-- ============================================================================
-- invoice_number_for — SR2627-0042-K7XQ, sixteen characters
-- ============================================================================
create or replace function public.invoice_number_for(p_fy integer, p_serial integer)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_year   text := right(p_fy::text, 2) || right((p_fy + 1)::text, 2);  -- 2026-27 -> '2627'
  v_serial text := lpad(p_serial::text, 4, '0');
  v_code   integer;
begin
  -- 'SR' + 4 year + '-' + serial + '-' + code must fit in sixteen characters.
  -- As the serial grows the code gives way, never the serial: the serial is
  -- the legal requirement, the code is ours.
  v_code := 16 - (2 + 4 + 1 + length(v_serial) + 1);

  if v_code < 2 then
    return 'SR' || v_year || '-' || v_serial;
  end if;

  return 'SR' || v_year || '-' || v_serial || '-' || public.invoice_check_code(p_fy, p_serial, v_code);
end;
$$;

-- ============================================================================
-- verify_invoice_number — "a parent sent me this, is it ours?"
-- ============================================================================
-- Two separate answers, because they mean different things.
--
--   well_formed  the check code matches, so the number was minted by us
--   issued       a row with that number exists
--
-- well_formed false is a forgery. well_formed true with issued false should be
-- impossible and means something has gone wrong worth looking at.
create or replace function public.verify_invoice_number(p_number text)
returns table (
  well_formed   boolean,
  issued        boolean,
  customer_name text,
  course_name   text,
  total         numeric,
  currency_symbol text,
  invoice_date  date
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_clean  text := upper(trim(coalesce(p_number, '')));
  v_year   text;
  v_fy     integer;
  v_serial integer;
  v_ok     boolean := false;
  v_inv    public.invoices;
begin
  -- SR + 4 digits + '-' + serial (+ optional '-' + code)
  --
  -- Re-minting the number from the year and serial and comparing is the whole
  -- check: it proves the code, the padding and the shape all at once, and it
  -- can never drift from what issue_invoice() writes because it is the same
  -- function.
  if v_clean ~ '^SR[0-9]{4}-[0-9]+(-[0-9A-Z]{2,4})?$' then
    v_year   := substr(v_clean, 3, 4);
    v_fy     := 2000 + substr(v_year, 1, 2)::integer;
    v_serial := split_part(v_clean, '-', 2)::integer;
    v_ok     := public.invoice_number_for(v_fy, v_serial) = v_clean;
  end if;

  select * into v_inv from public.invoices i where i.invoice_number = v_clean;

  return query select
    v_ok,
    v_inv.id is not null,
    v_inv.customer_name,
    v_inv.course_name,
    v_inv.total,
    v_inv.currency_symbol,
    v_inv.invoice_date;
end;
$$;

-- ============================================================================
-- Columns
-- ============================================================================
alter table public.invoices
  -- 'full' | 'installment'
  add column if not exists payment_type    text not null default 'full',
  -- What the whole course costs. Only meaningful on an installment.
  add column if not exists course_total    numeric(12,2),
  -- What had already been received before this invoice.
  add column if not exists previously_paid numeric(12,2) not null default 0,
  -- UTR / Razorpay id / cheque number. Unique across every invoice.
  add column if not exists transaction_id  text,
  -- 'new' | 'renewal'
  add column if not exists sale_type       text not null default 'new';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_payment_type_check') then
    alter table public.invoices
      add constraint invoices_payment_type_check
      check (payment_type in ('full', 'installment'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_sale_type_check') then
    alter table public.invoices
      add constraint invoices_sale_type_check
      check (sale_type in ('new', 'renewal'));
  end if;

  -- An installment without a course total is a receipt, not an installment:
  -- there is nothing for "what is still owed" to be measured against.
  if not exists (select 1 from pg_constraint where conname = 'invoices_installment_total_check') then
    alter table public.invoices
      add constraint invoices_installment_total_check
      check (payment_type <> 'installment' or (course_total is not null and course_total > 0));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_previously_paid_check') then
    alter table public.invoices
      add constraint invoices_previously_paid_check
      check (previously_paid >= 0);
  end if;
end $$;

-- The same payment cannot be billed twice. Lowercased, because pay_ABC123 and
-- pay_abc123 are the same payment and only one of them is the real casing.
create unique index if not exists invoices_transaction_id_key
  on public.invoices (lower(transaction_id))
  where transaction_id is not null;

-- "Every invoice for this child" — the parent-says-we-paid lookup.
create index if not exists invoices_email_idx
  on public.invoices (lower(customer_email))
  where customer_email is not null;

-- ── What the gateway kept ───────────────────────────────────────────────────
-- Razorpay takes its cut before the money reaches the bank, and the rate is not
-- one number: it moves with the instrument (UPI, card, netbanking, an
-- international card) and with whatever was negotiated that quarter. So it is
-- recorded per transaction rather than assumed.
--
-- It is a cost Sariro bears, NOT something the customer is charged. The
-- customer paid `total`; the tax is on `total`; `net_received` is what actually
-- landed. Those are three different facts and the ledger keeps them apart —
-- which is the whole point, because "revenue" and "money in the bank" have
-- quietly differed by 2% every month until now.
--
-- Zero is a legitimate answer, for a bank transfer or cash, but it has to be
-- entered rather than assumed: a fee left at a default of zero is a fee nobody
-- noticed.
alter table public.invoices
  add column if not exists gateway_fee_percent numeric(6,3)  not null default 0,
  add column if not exists gateway_fee         numeric(12,2) not null default 0,
  add column if not exists net_received        numeric(12,2);

-- Rows issued before this column existed had no fee recorded, so what landed
-- was the whole total. Backfilled rather than left null so every report can
-- read one column without a coalesce that somebody will forget.
update public.invoices
   set net_received = total - gateway_fee
 where net_received is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_gateway_fee_check') then
    alter table public.invoices
      add constraint invoices_gateway_fee_check
      -- A fee larger than the payment is arithmetic nobody meant.
      check (gateway_fee >= 0 and gateway_fee <= total);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_gateway_pct_check') then
    alter table public.invoices
      add constraint invoices_gateway_pct_check
      check (gateway_fee_percent >= 0 and gateway_fee_percent <= 100);
  end if;
end $$;

alter table public.sales
  add column if not exists payment_type   text,
  add column if not exists sale_type      text,
  add column if not exists transaction_id text,
  add column if not exists course_total   numeric(12,2),
  add column if not exists gateway_fee    numeric(12,2) not null default 0,
  add column if not exists net_received   numeric(12,2);

update public.sales
   set net_received = amount - gateway_fee
 where net_received is null;

-- ============================================================================
-- issue_invoice — the new number, and the new fields
-- ============================================================================
create or replace function public.issue_invoice(p_invoice jsonb)
returns public.invoices
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_date    date    := coalesce((p_invoice->>'invoice_date')::date, current_date);
  v_txn     text    := nullif(trim(coalesce(p_invoice->>'transaction_id', '')), '');
  v_type    text    := coalesce(nullif(p_invoice->>'payment_type', ''), 'full');
  v_fy      integer;
  v_serial  integer;
  v_row     public.invoices;
  v_clash   text;
begin
  v_fy := case when extract(month from v_date) >= 4
               then extract(year from v_date)::int
               else extract(year from v_date)::int - 1 end;

  -- Checked before the serial is taken, so a rejected invoice does not burn a
  -- number out of the series.
  if v_txn is not null then
    select i.invoice_number into v_clash
      from public.invoices i
     where lower(i.transaction_id) = lower(v_txn)
     limit 1;
    if v_clash is not null then
      raise exception 'Transaction id % is already on invoice %. The same payment cannot be billed twice.', v_txn, v_clash
        using errcode = 'unique_violation';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext('sariro_invoice_' || v_fy::text));

  select coalesce(max(serial), 0) + 1 into v_serial
    from public.invoices where financial_year = v_fy;

  insert into public.invoices (
    invoice_number, financial_year, serial,
    customer_name, customer_address, customer_country, customer_state_code,
    customer_state, customer_email, customer_phone,
    course_name, course_description,
    price, currency_code, currency_symbol, include_gst,
    taxable, total_tax, total, tax_treatment,
    payment_type, course_total, previously_paid, transaction_id, sale_type,
    gateway_fee_percent, gateway_fee, net_received,
    payment_status, payment_reference, invoice_date, issued_by
  ) values (
    public.invoice_number_for(v_fy, v_serial),
    v_fy, v_serial,
    p_invoice->>'customer_name',
    nullif(p_invoice->>'customer_address', ''),
    p_invoice->>'customer_country',
    nullif(p_invoice->>'customer_state_code', ''),
    nullif(p_invoice->>'customer_state', ''),
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
    v_type,
    case when v_type = 'installment' then (p_invoice->>'course_total')::numeric else null end,
    coalesce((p_invoice->>'previously_paid')::numeric, 0),
    v_txn,
    coalesce(nullif(p_invoice->>'sale_type', ''), 'new'),
    coalesce((p_invoice->>'gateway_fee_percent')::numeric, 0),
    coalesce((p_invoice->>'gateway_fee')::numeric, 0),
    -- Derived here rather than trusted from the client, so the one figure the
    -- books are reconciled against cannot arrive already wrong.
    (p_invoice->>'total')::numeric - coalesce((p_invoice->>'gateway_fee')::numeric, 0),
    coalesce(p_invoice->>'payment_status', 'Paid'),
    nullif(p_invoice->>'payment_reference', ''),
    v_date,
    auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================================
-- record_sale — carries the new fields across
-- ============================================================================
-- Unchanged in every other respect: the invoice number is still the key, an
-- unknown number is still refused, and `amount` is still the invoice total —
-- which, for an installment, is the money actually received. The ledger counts
-- what arrived, never what was promised.
create or replace function public.record_sale(
  p_invoice_number text,
  p_seller_id      uuid default null,
  p_notes          text default null
)
returns public.sales
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_inv  public.invoices;
  v_row  public.sales;
begin
  select * into v_inv from public.invoices where invoice_number = p_invoice_number;
  if not found then
    raise exception 'No invoice numbered %. Generate the invoice first - a sale cannot be recorded without one.', p_invoice_number
      using errcode = 'no_data_found';
  end if;

  if exists (select 1 from public.sales where invoice_number = p_invoice_number) then
    raise exception 'Invoice % is already in the sales ledger.', p_invoice_number
      using errcode = 'unique_violation';
  end if;

  insert into public.sales (
    invoice_number, invoice_id,
    student_name, student_email, course_name, country, state,
    amount, currency_code, currency_symbol,
    gst_included, taxable, total_tax,
    payment_type, sale_type, transaction_id, course_total,
    gateway_fee, net_received,
    sold_on, seller_id, recorded_by, notes
  ) values (
    v_inv.invoice_number, v_inv.id,
    v_inv.customer_name, v_inv.customer_email, v_inv.course_name,
    v_inv.customer_country, v_inv.customer_state,
    v_inv.total, v_inv.currency_code, v_inv.currency_symbol,
    v_inv.include_gst, v_inv.taxable, v_inv.total_tax,
    v_inv.payment_type, v_inv.sale_type, v_inv.transaction_id, v_inv.course_total,
    v_inv.gateway_fee, coalesce(v_inv.net_received, v_inv.total - v_inv.gateway_fee),
    v_inv.invoice_date, p_seller_id, auth.uid(),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================================
-- invoice_preview — now says which installment it is
-- ============================================================================
create or replace function public.invoice_preview(p_invoice_number text)
returns table (
  invoice_number  text,
  customer_name   text,
  course_name     text,
  total           numeric,
  currency_code   text,
  currency_symbol text,
  include_gst     boolean,
  invoice_date    date,
  payment_type    text,
  course_total    numeric,
  previously_paid numeric,
  already_recorded boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select i.invoice_number, i.customer_name, i.course_name,
         i.total, i.currency_code, i.currency_symbol, i.include_gst, i.invoice_date,
         i.payment_type, i.course_total, i.previously_paid,
         exists (select 1 from public.sales s where s.invoice_number = i.invoice_number)
    from public.invoices i
   where i.invoice_number = p_invoice_number;
$$;

-- ============================================================================
-- Grants
-- ============================================================================
-- invoice_check_code is deliberately NOT granted: handing it out would let a
-- caller mint the code for any serial, which is the whole thing it protects.
revoke execute on function public.invoice_check_code(integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.invoice_number_for(integer, integer)          from public, anon, authenticated;

revoke execute on function public.verify_invoice_number(text) from public, anon;
grant  execute on function public.verify_invoice_number(text) to authenticated, service_role;

revoke execute on function public.issue_invoice(jsonb)              from public, anon;
grant  execute on function public.issue_invoice(jsonb)              to authenticated, service_role;
revoke execute on function public.record_sale(text, uuid, text)     from public, anon;
grant  execute on function public.record_sale(text, uuid, text)     to authenticated, service_role;
revoke execute on function public.invoice_preview(text)             from public, anon;
grant  execute on function public.invoice_preview(text)             to authenticated, service_role;
