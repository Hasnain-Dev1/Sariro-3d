-- ══════════════════════════════════════════════════════════════════════════
-- SARIRO — a sale is credited to a seller; a lead is owned by a seller
-- ══════════════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL editor. It is safe to run twice.
--
-- ── Why ─────────────────────────────────────────────────────────────────────
-- "Record a sale" offered every seller, HR, admin and super-admin to credit a
-- sale to, and the lead pipeline's "Assign" offered admins and super-admins.
-- Thirteen of eighteen leads ended up owned by the CEO's and the dev account's
-- profiles — accounts no seller can see — and sales could be credited to people
-- who do not earn a seller's incentive.
--
-- The dropdowns are fixed in the app (src/lib/seller/who-sells.ts). This makes
-- the rule hold for every other way in: record_sale() accepts any user id it is
-- given, and so does a direct update from the browser console.
--
-- ── The rule ────────────────────────────────────────────────────────────────
-- A seller is a profile with role = 'seller' or is_seller = true. Nobody at all
-- (NULL) is always allowed — "not attributed" is a real answer for a sale, and
-- an unassigned lead is visible in the unassigned queue.
--
-- ── What it does NOT touch ──────────────────────────────────────────────────
-- Rows that already credit a non-seller are left exactly as they are; the
-- triggers fire only when the seller column is written. The final SELECT
-- lists them so a person can decide.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.is_seller_profile(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = p_id
       and (role = 'seller' or is_seller is true)
  );
$$;

-- ── Sales ───────────────────────────────────────────────────────────────────
create or replace function public.refuse_non_seller_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.seller_id is not null and not public.is_seller_profile(new.seller_id) then
    raise exception 'A sale can only be credited to a seller.'
      using errcode = 'P0001',
            hint = 'Choose a seller, or leave the sale unattributed.';
  end if;
  return new;
end;
$$;

drop trigger if exists refuse_non_seller_sale on public.sales;
create trigger refuse_non_seller_sale
  before insert or update of seller_id on public.sales
  for each row
  execute function public.refuse_non_seller_sale();

-- ── Leads ───────────────────────────────────────────────────────────────────
create or replace function public.refuse_non_seller_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_seller is not null and not public.is_seller_profile(new.assigned_seller) then
    raise exception 'A lead can only be assigned to a seller.'
      using errcode = 'P0001',
            hint = 'Choose a seller, or leave the lead unassigned.';
  end if;
  return new;
end;
$$;

drop trigger if exists refuse_non_seller_lead on public.student_leads;
create trigger refuse_non_seller_lead
  before insert or update of assigned_seller on public.student_leads
  for each row
  execute function public.refuse_non_seller_lead();

-- ── One SELECT, so the editor shows the result that matters ────────────────
select
  (select count(*) from pg_trigger where tgname in ('refuse_non_seller_sale', 'refuse_non_seller_lead') and not tgisinternal)
                                                                               as triggers_present,
  (select count(*) from public.sales
    where seller_id is not null and not public.is_seller_profile(seller_id))  as existing_sales_credited_to_non_sellers,
  (select string_agg(invoice_number, ', ') from public.sales
    where seller_id is not null and not public.is_seller_profile(seller_id))  as those_invoices,
  (select count(*) from public.student_leads
    where assigned_seller is not null and not public.is_seller_profile(assigned_seller))
                                                                               as existing_leads_owned_by_non_sellers;
