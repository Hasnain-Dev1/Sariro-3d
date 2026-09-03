-- ============================================================================
-- SARIRO — company expenses
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §53-54. Greenfield: no file anywhere in the repo mentioned expenses.
--
-- ── Currency ────────────────────────────────────────────────────────────────
-- Amounts are in ₹, matching the rest of the company-side money — teacher pay,
-- penalties, incentives and settlements are all rupees. Student fees are in
-- dollars and live in a different part of the system entirely; nothing here
-- should ever be added to one of those without converting first.
--
-- ── Why amount is numeric and not integer paise ─────────────────────────────
-- The teacher payout tables already use numeric for money, and one money type
-- across the company books matters more than the theoretical tidiness of
-- storing minor units. Matching what exists beats being right in isolation.
--
-- ── Approval is a state, not a boolean ──────────────────────────────────────
-- §53 lists "approval status" alongside "approved by". A rejected expense is
-- not an absent one — it is a decision somebody made and may have to defend, so
-- it stays on the books with its reason.
-- ============================================================================

create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),

  title          text not null,
  amount         numeric(12,2) not null check (amount >= 0),
  spent_on       date not null default current_date,

  -- Free text rather than an enum: the categories a small company actually
  -- uses change faster than migrations ship, and a rejected category means a
  -- real expense goes unrecorded.
  category       text,
  description    text,
  reason         text,

  vendor         text,
  payment_method text,
  document_url   text,
  notes          text,

  status         text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  approved_by    uuid references auth.users(id) on delete set null,
  approved_at    timestamptz,

  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- The two reads: "this month's expenses" and "what needs approving".
create index if not exists expenses_spent_on_idx on public.expenses (spent_on desc);
create index if not exists expenses_status_idx   on public.expenses (status);

-- ── Stamp the approver when the decision is made ────────────────────────────
create or replace function public.touch_expense_approval()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and new.status <> 'pending' then
    new.approved_at := coalesce(new.approved_at, now());
    new.approved_by := coalesce(new.approved_by, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_approval on public.expenses;
create trigger expenses_approval
  before update on public.expenses
  for each row execute function public.touch_expense_approval();

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Company financial records. HR and above only — a teacher or student has no
-- business reading what the company spent on anything.
alter table public.expenses enable row level security;

drop policy if exists expenses_staff_read on public.expenses;
create policy expenses_staff_read
  on public.expenses for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'admin', 'super_admin')
    )
  );

drop policy if exists expenses_staff_write on public.expenses;
create policy expenses_staff_write
  on public.expenses for insert
  with check (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'admin', 'super_admin')
    )
  );

-- Approving is a narrower right than recording: HR logs what was spent,
-- super_admin signs it off.
drop policy if exists expenses_staff_update on public.expenses;
create policy expenses_staff_update
  on public.expenses for update
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'super_admin')
    )
  );
