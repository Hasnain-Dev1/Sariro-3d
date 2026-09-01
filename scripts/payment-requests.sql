-- ============================================================================
-- SARIRO — stop dropping the people who are trying to pay you
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- ── What this fixes ─────────────────────────────────────────────────────────
-- /contact's submit handler was, verbatim:
--
--     // Simulate async send (no backend required for this demo)
--     await new Promise((r) => setTimeout(r, 900));
--     toast.success('Message sent!', { description: "we'll reply within 24 hours" });
--
-- It waited 900ms, promised a reply within 24 hours, and threw the message
-- away. Nothing was written anywhere. Nobody was emailed.
--
-- That would be bad on its own. What made it expensive is where it sat in the
-- funnel: checkout's "Request bank details" button linked straight into that
-- form. So a buyer who picked bank transfer — someone at the payment step, with
-- their wallet already out — filled in a form, was thanked, and vanished.
--
-- This table is where those land instead, and HR reads them from the dashboard.
--
-- ── Why one table for two things ────────────────────────────────────────────
-- Bank-transfer requests and ordinary contact messages arrive through the same
-- form and need the same handling: someone reads it, someone replies, someone
-- marks it done. `kind` keeps them filterable without a second inbox to forget
-- to check.
-- ============================================================================

create table if not exists public.payment_requests (
  id           uuid primary key default gen_random_uuid(),

  -- 'bank_transfer' arrives from checkout and is money waiting to be collected.
  -- 'contact' is everything else from /contact.
  kind         text not null default 'contact'
               check (kind in ('bank_transfer', 'contact')),

  -- Who is asking. Email is the only reliable way back to them, so it is the
  -- one contact field that is required.
  full_name    text,
  email        text not null,
  phone        text,

  subject      text,
  message      text,

  -- What they were buying when they chose bank transfer. Carried from the
  -- checkout query string so HR can quote the right amount without a
  -- back-and-forth. Null for a general contact message.
  product_slug text,
  scope_label  text,
  cadence      text,
  ratio        text,

  -- Set from the request, not the client: a buyer who is signed in is matched
  -- to their account without being asked to type their email twice.
  user_id      uuid references auth.users(id) on delete set null,

  status       text not null default 'new'
               check (status in ('new', 'in_progress', 'done')),
  handled_by   uuid references auth.users(id) on delete set null,
  handled_at   timestamptz,
  staff_notes  text,

  created_at   timestamptz not null default now()
);

-- The inbox is read newest-first and filtered by state, which is what these
-- two indexes serve. `kind` is indexed because "show me only the money" is the
-- query that matters on a busy day.
create index if not exists payment_requests_created_idx on public.payment_requests (created_at desc);
create index if not exists payment_requests_status_idx  on public.payment_requests (status);
create index if not exists payment_requests_kind_idx    on public.payment_requests (kind);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Nothing here is public. The table holds names, emails and phone numbers of
-- people who have not signed up for anything, so the default is no access and
-- staff are named explicitly.
--
-- Inserts do NOT go through a client policy: they run through the service-role
-- API route, which is where validation and rate limiting live. A public insert
-- policy would turn a form on the open internet into a writable table.
alter table public.payment_requests enable row level security;

drop policy if exists payment_requests_staff_read on public.payment_requests;
create policy payment_requests_staff_read
  on public.payment_requests for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and p.role in ('hr', 'admin', 'super_admin')
    )
  );

drop policy if exists payment_requests_staff_update on public.payment_requests;
create policy payment_requests_staff_update
  on public.payment_requests for update
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and p.role in ('hr', 'admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and p.role in ('hr', 'admin', 'super_admin')
    )
  );

-- ── stamp handled_at when someone actually picks it up ──────────────────────
create or replace function public.touch_payment_request_handled()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and new.status <> 'new' then
    new.handled_at := coalesce(new.handled_at, now());
    new.handled_by := coalesce(new.handled_by, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists payment_requests_handled on public.payment_requests;
create trigger payment_requests_handled
  before update on public.payment_requests
  for each row execute function public.touch_payment_request_handled();
