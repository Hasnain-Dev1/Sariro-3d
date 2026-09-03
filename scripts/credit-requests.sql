-- ============================================================================
-- SARIRO — credit requests, and the approval that is the only way credits move
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §50-52, and the principle behind them in §79.
--
-- ── The problem this fixes ──────────────────────────────────────────────────
-- Today `adjustCredits()` changes a student's balance the moment somebody asks.
-- §50 is explicit that this is wrong: "When a new credit is requested, DO NOT
-- immediately increase student credits." A balance that moves before anyone
-- approved it is a balance nobody can defend afterwards — and credits are the
-- thing the student paid for.
--
-- So: a request is a row. The balance does not move. HR decides. Only the
-- approval writes the transaction, and it writes it in the same statement that
-- moves the balance, so the two can never disagree.
--
-- ── Why the approval is a database function and not API code ────────────────
-- §79 says the balance has one authoritative source. If the "insert a
-- transaction, then update the balance" pair lives in a route handler, then a
-- crash between the two lines leaves a transaction with no balance change, or
-- the reverse — and a second route added later will do it slightly differently.
-- One function, one transaction, one place to read.
-- ============================================================================

create table if not exists public.credit_requests (
  id                 uuid primary key default gen_random_uuid(),

  student_id         uuid not null references auth.users(id) on delete cascade,
  requested_amount   numeric(10,2) not null check (requested_amount > 0),
  -- §52 wants the balance the decision was made against. Captured at request
  -- time because by the time HR looks, classes may have consumed more.
  balance_at_request numeric(10,2),

  reason             text,
  -- Which course/batch this is for. Nullable: a general top-up belongs to no
  -- single enrolment.
  enrollment_id      uuid references public.enrollments(id) on delete set null,
  cohort_id          uuid references public.cohorts(id) on delete set null,

  requested_by       uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),

  status             text not null default 'requested'
                     check (status in ('requested', 'approved', 'rejected')),
  -- HR may approve a different number than was asked for. §52 lists requested
  -- and approved as separate facts for exactly this reason.
  approved_amount    numeric(10,2),
  decided_by         uuid references auth.users(id) on delete set null,
  decided_at         timestamptz,
  hr_notes           text
);

-- The review queue, and "what happened to the one I raised".
create index if not exists credit_requests_pending_idx
  on public.credit_requests (created_at desc) where status = 'requested';
create index if not exists credit_requests_student_idx
  on public.credit_requests (student_id, created_at desc);
create index if not exists credit_requests_requester_idx
  on public.credit_requests (requested_by, created_at desc);

-- ── Link the money back to the decision ─────────────────────────────────────
-- §93: "For every credit — who requested/approved it and why?" Without this the
-- transaction is an orphan number and the answer is a guess.
alter table public.credit_transactions
  add column if not exists related_request_id uuid references public.credit_requests(id) on delete set null;

create index if not exists credit_tx_request_idx
  on public.credit_transactions (related_request_id) where related_request_id is not null;

-- ============================================================================
-- APPROVE — the only path by which an approved request becomes credits
-- ============================================================================
-- Returns the new balance. Raises rather than silently doing nothing, because a
-- double-click that quietly grants twice is the failure that matters here.
create or replace function public.approve_credit_request(
  p_request_id uuid,
  p_amount     numeric default null,
  p_notes      text    default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req      public.credit_requests;
  v_amount   numeric;
  v_balance  numeric;
begin
  -- Locked so two approvers clicking at once cannot both pass the status check.
  select * into v_req from public.credit_requests where id = p_request_id for update;
  if not found then
    raise exception 'credit request % not found', p_request_id;
  end if;
  if v_req.status <> 'requested' then
    raise exception 'credit request % is already %', p_request_id, v_req.status;
  end if;

  v_amount := coalesce(p_amount, v_req.requested_amount);
  if v_amount <= 0 then
    raise exception 'approved amount must be greater than zero';
  end if;

  -- Balance first, so a failure here aborts the whole thing rather than
  -- leaving an approved request that never paid out.
  update public.credits
     set balance = balance + v_amount, updated_at = now()
   where user_id = v_req.student_id
  returning balance into v_balance;

  if v_balance is null then
    insert into public.credits (user_id, balance, updated_at)
    values (v_req.student_id, v_amount, now())
    returning balance into v_balance;
  end if;

  -- 'admin_adjustment' rather than a new type: the existing column has a
  -- settled set of values and the request link below carries the real meaning.
  insert into public.credit_transactions
    (user_id, amount, type, description, related_enrollment_id, related_request_id, created_by)
  values
    (v_req.student_id, v_amount, 'admin_adjustment',
     coalesce(nullif(trim(v_req.reason), ''), 'Credit request approved'),
     v_req.enrollment_id, v_req.id, auth.uid());

  update public.credit_requests
     set status = 'approved',
         approved_amount = v_amount,
         decided_by = auth.uid(),
         decided_at = now(),
         hr_notes = coalesce(p_notes, hr_notes)
   where id = p_request_id;

  return v_balance;
end;
$$;

-- ============================================================================
-- REJECT — the balance does not move, and the request stays on the books
-- ============================================================================
-- §51: "Retain rejected request." A rejection is a decision somebody may have
-- to explain to a parent later.
create or replace function public.reject_credit_request(
  p_request_id uuid,
  p_notes      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_status text;
begin
  select status into v_status from public.credit_requests where id = p_request_id for update;
  if not found then
    raise exception 'credit request % not found', p_request_id;
  end if;
  if v_status <> 'requested' then
    raise exception 'credit request % is already %', p_request_id, v_status;
  end if;

  update public.credit_requests
     set status = 'rejected',
         decided_by = auth.uid(),
         decided_at = now(),
         hr_notes = coalesce(p_notes, hr_notes)
   where id = p_request_id;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.credit_requests enable row level security;

-- A student sees requests about them; whoever raised one sees it through to a
-- decision (§52: "Teachers should be able to see the status of requests they
-- submitted"); HR and above see everything.
drop policy if exists credit_requests_read on public.credit_requests;
create policy credit_requests_read
  on public.credit_requests for select
  using (
    student_id = auth.uid()
    or requested_by = auth.uid()
    or exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'admin', 'super_admin')
    )
  );

-- Staff raise requests. A student asking for their own credits is a sales
-- conversation, not a form.
drop policy if exists credit_requests_create on public.credit_requests;
create policy credit_requests_create
  on public.credit_requests for insert
  with check (
    requested_by = auth.uid()
    and exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and (p.role in ('teacher', 'hr', 'admin', 'super_admin', 'seller') or p.is_teacher = true)
    )
  );

-- Deciding goes through the functions above, never a bare update — that is what
-- keeps the balance and the transaction in step.
drop policy if exists credit_requests_decide on public.credit_requests;
create policy credit_requests_decide
  on public.credit_requests for update
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'super_admin')
    )
  );

revoke execute on function public.approve_credit_request(uuid, numeric, text) from public, anon;
revoke execute on function public.reject_credit_request(uuid, text) from public, anon;
grant  execute on function public.approve_credit_request(uuid, numeric, text) to authenticated, service_role;
grant  execute on function public.reject_credit_request(uuid, text) to authenticated, service_role;
