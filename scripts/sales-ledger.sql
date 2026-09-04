-- ============================================================================
-- SARIRO — the sales ledger, derived from invoices
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Run AFTER scripts/invoices.sql.
--
-- ── The idea this is built around ───────────────────────────────────────────
-- A sale cannot be recorded without an invoice. Give the ledger an invoice
-- number and it takes the student, the course, the amount, the currency, the
-- country and the GST treatment from the invoice itself. Nobody retypes a
-- figure, so nobody can mistype one, and the books cannot disagree with the
-- document the customer was sent.
--
-- That only works because invoices are generated in-house and stored. It is
-- the whole return on having built them.
--
-- ── Why invoice_number is the primary key ───────────────────────────────────
-- Sellers, HR and super-admins can all record a sale, and the same sale will
-- sometimes be pushed twice by two people who each think it is theirs to log.
-- Making the invoice number the key means the second attempt is refused by the
-- database rather than caught by a check somebody might forget to write.
--
-- ── A refund is a state of a sale, not a second row ─────────────────────────
-- The obvious alternative is a second ledger row with a negative amount. That
-- reads well in a list and badly everywhere else: the same sale then appears
-- twice, "how many sales this month" needs a filter to be correct, and nothing
-- stops a refund existing without the sale it reverses.
--
-- A refund belongs to exactly one sale, so it lives on that row. Net revenue is
-- amount − coalesce(refund_amount, 0), and it cannot be computed wrongly.
-- ============================================================================

create table if not exists public.sales (
  -- The receipt number. One sale, one invoice, one row.
  invoice_number   text primary key,
  invoice_id       uuid references public.invoices(id) on delete set null,

  -- Copied from the invoice at the moment of recording. Copied rather than
  -- joined because an invoice is a statement about a moment, and the ledger
  -- must keep saying what was sold even if anything upstream is ever corrected.
  student_name     text not null,
  student_email    text,
  course_name      text not null,
  country          text,
  state            text,

  amount           numeric(12,2) not null check (amount >= 0),
  currency_code    text not null,
  currency_symbol  text not null,
  -- The GST column asked for: opted in or out, so the books filter on it.
  gst_included     boolean not null default false,
  taxable          numeric(12,2),
  total_tax        numeric(12,2),

  sold_on          date not null,
  -- WHO MADE THE SALE. Distinct from who typed it in — a seller's number is
  -- their own whether they logged it or HR did.
  seller_id        uuid references auth.users(id) on delete set null,
  recorded_by      uuid references auth.users(id) on delete set null,
  notes            text,

  -- ── The refund, if there is one ────────────────────────────────────────
  refunded_at      timestamptz,
  refund_amount    numeric(12,2) check (refund_amount is null or refund_amount >= 0),
  refund_reason    text,
  refunded_by      uuid references auth.users(id) on delete set null,

  created_at       timestamptz not null default now()
);

create index if not exists sales_sold_on_idx on public.sales (sold_on desc);
create index if not exists sales_seller_idx  on public.sales (seller_id, sold_on desc);
create index if not exists sales_gst_idx     on public.sales (gst_included);

-- ============================================================================
-- record_sale — the only way a sale enters the books
-- ============================================================================
-- Everything except the seller and a note comes from the invoice. Refuses an
-- invoice number that does not exist, which is the rule that makes the ledger
-- trustworthy: no invoice, no sale.
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
    raise exception 'No invoice numbered %. Generate the invoice first — a sale cannot be recorded without one.', p_invoice_number
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
    v_inv.customer_country, null,
    v_inv.total, v_inv.currency_code, v_inv.currency_symbol,
    v_inv.include_gst, v_inv.taxable, v_inv.total_tax,
    v_inv.invoice_date, p_seller_id, auth.uid(),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================================
-- record_refund — reverses a sale that is already on the books
-- ============================================================================
create or replace function public.record_refund(
  p_invoice_number text,
  p_amount         numeric default null,
  p_reason         text    default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales;
  v_amt  numeric;
begin
  select * into v_sale from public.sales where invoice_number = p_invoice_number for update;
  if not found then
    raise exception 'Invoice % is not in the sales ledger, so there is nothing to refund.', p_invoice_number
      using errcode = 'no_data_found';
  end if;
  if v_sale.refunded_at is not null then
    raise exception 'Invoice % has already been refunded.', p_invoice_number
      using errcode = 'unique_violation';
  end if;

  -- A full refund unless a smaller amount is named.
  v_amt := coalesce(p_amount, v_sale.amount);
  if v_amt <= 0 or v_amt > v_sale.amount then
    raise exception 'A refund must be more than zero and no more than the % that was charged.', v_sale.amount;
  end if;

  update public.sales
     set refunded_at = now(),
         refund_amount = v_amt,
         refund_reason = nullif(trim(coalesce(p_reason, '')), ''),
         refunded_by = auth.uid()
   where invoice_number = p_invoice_number
  returning * into v_sale;

  return v_sale;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Customer names and revenue. Sellers see their own; HR and above see all.
alter table public.sales enable row level security;

drop policy if exists sales_read on public.sales;
create policy sales_read
  on public.sales for select
  using (
    seller_id = auth.uid()
    or recorded_by = auth.uid()
    or exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'admin', 'super_admin')
    )
  );

-- No insert or update policy: rows arrive only through the functions above,
-- which is what keeps every sale tied to a real invoice and every refund tied
-- to a real sale.
revoke execute on function public.record_sale(text, uuid, text) from public, anon;
revoke execute on function public.record_refund(text, numeric, text) from public, anon;
grant  execute on function public.record_sale(text, uuid, text) to authenticated, service_role;
grant  execute on function public.record_refund(text, numeric, text) to authenticated, service_role;
