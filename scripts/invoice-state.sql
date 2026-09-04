-- ============================================================================
-- SARIRO — the customer's state, and places not on any list
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Run AFTER scripts/invoices.sql.
--
-- Two additions.
--
-- ── The state name, not only its code ───────────────────────────────────────
-- The invoice already stored customer_state_code, which is what decides
-- CGST+SGST versus IGST. It did not store the name, so an invoice reprinted
-- later showed "19" or nothing where a state should be. A tax invoice names the
-- place of supply in words.
--
-- ── Somewhere we have not sold to yet ───────────────────────────────────────
-- No country list is complete, and the one place a missing entry hurts most is
-- the document a customer keeps. Rather than guess at every jurisdiction, the
-- picker offers Other and the person types it. The column is free text because
-- that is what it is: the name of a place, as written by somebody who knows it
-- better than a dropdown does.
-- ============================================================================

alter table public.invoices
  -- Written out, e.g. 'West Bengal' or 'Selangor'. The code stays alongside it
  -- because the code is what the tax treatment is computed from.
  add column if not exists customer_state text;

comment on column public.invoices.customer_state is
  'Place of supply in words. customer_state_code drives the CGST/SGST vs IGST decision; this is what the invoice prints.';

alter table public.sales
  add column if not exists state text;

-- issue_invoice() predates this column, so it is re-created here to carry it.
-- Everything else about the function is unchanged; only customer_state is added.
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
  v_fy := case when extract(month from v_date) >= 4
               then extract(year from v_date)::int
               else extract(year from v_date)::int - 1 end;

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
    payment_status, payment_reference, invoice_date, issued_by
  ) values (
    'SARIRO-INV-' || v_fy::text || '-' || lpad(v_serial::text, 4, '0'),
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
    coalesce(p_invoice->>'payment_status', 'Paid'),
    nullif(p_invoice->>'payment_reference', ''),
    v_date,
    auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- record_sale() copies the state across to the ledger.
create or replace function public.record_sale(
  p_invoice_number text,
  p_seller_id      uuid default null,
  p_notes          text default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
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
    sold_on, seller_id, recorded_by, notes
  ) values (
    v_inv.invoice_number, v_inv.id,
    v_inv.customer_name, v_inv.customer_email, v_inv.course_name,
    v_inv.customer_country, v_inv.customer_state,
    v_inv.total, v_inv.currency_code, v_inv.currency_symbol,
    v_inv.include_gst, v_inv.taxable, v_inv.total_tax,
    v_inv.invoice_date, p_seller_id, auth.uid(),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ── Looking an invoice up before recording the sale ──────────────────────────
-- A seller is about to type an invoice number into the enrolment form, and
-- ought to see what that number is before confirming — otherwise they confirm
-- blind and a transposed digit becomes somebody else's sale.
--
-- Sellers cannot read public.invoices (it holds customer addresses and phone
-- numbers; that table is HR and above). So this returns the four fields the
-- confirmation actually needs and nothing else: who, what, how much, and
-- whether it has already been recorded. Security definer, because the point is
-- to answer without handing over the table.
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
  already_recorded boolean
)
language sql
security definer
set search_path = public
as $$
  select i.invoice_number, i.customer_name, i.course_name,
         i.total, i.currency_code, i.currency_symbol, i.include_gst, i.invoice_date,
         exists (select 1 from public.sales s where s.invoice_number = i.invoice_number)
    from public.invoices i
   where i.invoice_number = p_invoice_number;
$$;

revoke execute on function public.invoice_preview(text) from public, anon;
grant  execute on function public.invoice_preview(text) to authenticated, service_role;
