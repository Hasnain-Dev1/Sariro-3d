-- ============================================================================
-- SARIRO — GST paid on expenses (input tax credit)
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- The founder, 15 Sep 2026: keep track of the GST we pay on expenses, so it
-- can be claimed back against the GST on our invoices, and show input GST,
-- output GST and the total.
--
--   gst_amount     GST inside the bill, in ₹ (the expense amount includes it)
--   gst_rate       the rate on the bill, for the record (5, 12, 18, 28)
--   vendor_gstin   the supplier's GSTIN — a bill without one cannot be claimed
--   bill_number    the supplier's invoice number, as the return asks for it
--   itc_claimable  false for blocked credits (e.g. food, personal use), so the
--                  GST is recorded but not deducted
--
-- Until this runs, expenses still save — the GST fields are simply dropped,
-- and the screen says so.
-- ============================================================================

alter table public.expenses add column if not exists gst_amount    numeric(12,2) not null default 0;
alter table public.expenses add column if not exists gst_rate      numeric(5,2);
alter table public.expenses add column if not exists vendor_gstin  text;
alter table public.expenses add column if not exists bill_number   text;
alter table public.expenses add column if not exists itc_claimable boolean not null default true;

alter table public.expenses drop constraint if exists expenses_gst_amount_check;
alter table public.expenses add constraint expenses_gst_amount_check
  check (gst_amount >= 0 and gst_amount <= amount);

-- One result set, so the editor shows it.
select
  count(*) filter (where column_name in ('gst_amount', 'gst_rate', 'vendor_gstin', 'bill_number', 'itc_claimable')) as gst_columns_should_be_5
from information_schema.columns
where table_schema = 'public' and table_name = 'expenses';
