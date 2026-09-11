-- ============================================================================
-- SARIRO — the desk a lead sits on, and the sale at the end of it
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- Everything between "a family booked a free class" and "somebody was paid a
-- commission for it" currently happens in a seller's head. There is no record
-- of a call being made, no reminder to make the next one, no history of who
-- was told to close which lead, and no arithmetic anywhere that turns sales
-- into the money a seller is owed.
--
-- ── What is deliberately NOT here ───────────────────────────────────────────
-- Most of the pipeline already exists and is not touched:
--
--   · student_leads + lead_history  — the lead and its chronology
--   · sales + invoices              — the money, already numbered and taxed
--   · teacher_course_assignments    — subject eligibility (WORKING, left alone)
--   · profiles.trial_min/max_grade  — grade eligibility (WORKING, left alone)
--   · credits.catchup_balance       — the two balances (WORKING, left alone)
--   · catchup_lessons               — per-lesson catch-up, already per-lesson
--   · credit_transactions_payment_once / catchup_lessons_once /
--     uq_trial_participant          — three idempotency guards already shipped
--
-- Adding a second table for any of those would be the "four hand-written lists
-- of lead stages" bug again, where the fourth was stale and nobody could tell.
--
-- ── The three genuinely missing things ──────────────────────────────────────
--   1. a seller's logbook, which must never lose a note
--   2. a reminder that fires, so following up is not a memory exercise
--   3. a sale that can be punched exactly once, locking who gets paid for it
-- ============================================================================

set search_path = public, extensions;

-- ══════════════════════════════════════════════════════════════════════════
-- 1. THE LOGBOOK — append-only, and enforced by the database
-- ══════════════════════════════════════════════════════════════════════════
-- student_leads.notes is a single text column. Every write replaces the last
-- one, so a seller adding "called, no answer" erases "father asked us to ring
-- after 7pm". That column stays where it is for legacy rows; new notes go
-- here, one row per note, forever.
--
-- Append-only is a TRIGGER, not a convention. A convention is a comment that
-- somebody's `.update()` ignores at 2am, and the note it overwrote is not
-- recoverable — there is no previous version to go back to.

create table if not exists public.lead_notes (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.student_leads(id) on delete cascade,
  author_id    uuid references public.profiles(id) on delete set null,
  author_role  text,
  note         text not null,
  -- The seller's own read of how hot this is. Not the same as leadSignal(),
  -- which is computed from the teacher's write-up — one is a judgment, the
  -- other is evidence, and collapsing them loses the disagreement.
  priority     text not null default 'normal',
  category     text,
  created_at   timestamptz not null default now()
);

alter table public.lead_notes drop constraint if exists lead_notes_priority_check;
alter table public.lead_notes
  add constraint lead_notes_priority_check check (priority in ('high', 'medium', 'normal'));

alter table public.lead_notes drop constraint if exists lead_notes_not_empty;
alter table public.lead_notes
  add constraint lead_notes_not_empty check (length(btrim(note)) > 0);

create index if not exists lead_notes_lead_idx on public.lead_notes(lead_id, created_at desc);

-- The whole point of the table.
create or replace function public.lead_notes_are_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'lead_notes is append-only: a note cannot be % once written', tg_op
    using hint = 'Add a new note. The old one is the record of what was believed at the time.';
end;
$$;

drop trigger if exists lead_notes_no_update on public.lead_notes;
create trigger lead_notes_no_update
  before update or delete on public.lead_notes
  for each row execute function public.lead_notes_are_append_only();

comment on table public.lead_notes is
  'Append-only seller logbook. One row per note; UPDATE and DELETE are refused by trigger.';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. REMINDERS — because "I will ring them Thursday" is not a system
-- ══════════════════════════════════════════════════════════════════════════
-- Upcoming / Due / Overdue are NOT stored. They are due_at compared to now,
-- and storing them would need a job to walk every row at midnight and would be
-- wrong for the hours between. Only the states a human causes are stored:
-- pending, completed, cancelled.

create table if not exists public.lead_reminders (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.student_leads(id) on delete cascade,
  -- The note that prompted it, when there was one. A reminder can also stand
  -- alone ("ring back Tuesday") with nothing to say yet.
  note_id       uuid references public.lead_notes(id) on delete set null,
  -- Whose reminder it is. Denormalised from the lead on purpose: a lead that
  -- is transferred must not silently move somebody else's alarm clock.
  seller_id     uuid references public.profiles(id) on delete set null,
  due_at        timestamptz not null,
  status        text not null default 'pending',
  body          text,
  completed_at  timestamptz,
  completed_by  uuid references public.profiles(id) on delete set null,
  cancelled_at  timestamptz,
  cancelled_by  uuid references public.profiles(id) on delete set null,
  -- The claim column. Stamped BEFORE the notification is written, so two
  -- overlapping cron runs cannot both fire the same reminder. Same mechanism
  -- as bookings.reminder_sent_at, which has been correct in production.
  notified_at   timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.lead_reminders drop constraint if exists lead_reminders_status_check;
alter table public.lead_reminders
  add constraint lead_reminders_status_check check (status in ('pending', 'completed', 'cancelled'));

-- The query the cron runs every few minutes: what is due and unclaimed.
create index if not exists lead_reminders_due_idx
  on public.lead_reminders(due_at)
  where status = 'pending' and notified_at is null;

create index if not exists lead_reminders_seller_idx
  on public.lead_reminders(seller_id, due_at) where status = 'pending';

create index if not exists lead_reminders_lead_idx on public.lead_reminders(lead_id, due_at);

comment on column public.lead_reminders.notified_at is
  'Claimed by the reminder cron before sending. NULL means not yet fired.';

-- ══════════════════════════════════════════════════════════════════════════
-- 3. TRANSFERS — who moved this lead, and why
-- ══════════════════════════════════════════════════════════════════════════
-- lead_history already records that `assigned_seller` changed. It records it
-- as two text values and a free-text note, which is enough to display and not
-- enough to compute with: "how many leads were taken off this seller in
-- September" cannot be answered by parsing prose.

create table if not exists public.lead_transfers (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.student_leads(id) on delete cascade,
  from_seller  uuid references public.profiles(id) on delete set null,
  to_seller    uuid references public.profiles(id) on delete set null,
  changed_by   uuid references public.profiles(id) on delete set null,
  reason       text,
  created_at   timestamptz not null default now()
);

create index if not exists lead_transfers_lead_idx on public.lead_transfers(lead_id, created_at desc);
create index if not exists lead_transfers_to_idx   on public.lead_transfers(to_seller, created_at desc);

comment on table public.lead_transfers is
  'Structured history of pre-sale lead reassignment. After a sale is punched, sales.seller_locked refuses further moves.';

-- ══════════════════════════════════════════════════════════════════════════
-- 4. THE SALE — punched once, attributed forever
-- ══════════════════════════════════════════════════════════════════════════
-- `sales` already exists and already carries seller_id, the invoice and the
-- money. What it cannot currently say is which LEAD it came from, when it was
-- confirmed as opposed to merely recorded, and whether the attribution is
-- still open to argument.

alter table public.sales
  add column if not exists lead_id       uuid references public.student_leads(id) on delete set null,
  add column if not exists punched_at    timestamptz,
  add column if not exists punched_by    uuid references public.profiles(id) on delete set null,
  add column if not exists seller_locked boolean not null default false;

comment on column public.sales.punched_at is
  'When HR confirmed the sale. NULL means recorded but not yet counted towards anybody''s commission.';
comment on column public.sales.seller_locked is
  'True once punched. Normal HR and seller users can no longer change seller_id.';

create index if not exists sales_lead_idx   on public.sales(lead_id);
create index if not exists sales_seller_idx on public.sales(seller_id, punched_at);

-- One invoice is one sale. Without this, running the punch twice — a double
-- click, a retried request, two HR users on the same screen — pays the
-- commission twice and there is no way afterwards to tell which one was real.
create unique index if not exists sales_invoice_once
  on public.sales(invoice_id) where invoice_id is not null;

-- ── 4b. The seller's half of the handoff ───────────────────────────────────
-- "I have closed this — HR, please invoice it." A different question from the
-- lead's stage (which is about the family) and from trial_status (which is
-- about the class), so it gets its own column rather than another meaning
-- overloaded onto one that already has two.
alter table public.student_leads
  add column if not exists sale_stage text;

alter table public.student_leads drop constraint if exists student_leads_sale_stage_check;
alter table public.student_leads
  add constraint student_leads_sale_stage_check
  check (sale_stage is null or sale_stage in ('ready_for_hr', 'punched'));

comment on column public.student_leads.sale_stage is
  'NULL = not closed. ready_for_hr = seller confirmed, HR must invoice. punched = HR confirmed; attribution locked.';

create index if not exists student_leads_sale_stage_idx
  on public.student_leads(sale_stage) where sale_stage is not null;

-- ══════════════════════════════════════════════════════════════════════════
-- 4c. PUNCH THE SALE — all of it, or none of it
-- ══════════════════════════════════════════════════════════════════════════
-- The spec's word is "atomically", and it is not decoration. Punching a sale
-- touches four tables, and every partial outcome is a real business failure:
--
--   ledger written, lead not moved      → seller chases a family who has paid
--   lead moved, ledger not written      → nobody is ever paid commission
--   attribution not locked              → the sale can still be moved later
--   punched twice                       → the commission is paid twice
--
-- A route doing four PostgREST calls in a row has four chances to stop half
-- way — a timeout, a deploy, a closed laptop. Only the database can promise
-- all-or-nothing, so the whole thing is one function.
--
-- ── Idempotent by construction ──────────────────────────────────────────────
-- `sales.punched_at is null` is the guard. A second call finds the row already
-- punched and returns it unchanged rather than raising: HR double-clicking
-- Confirm should see success, not an error they have to interpret. The
-- unique index on invoice_id is the backstop underneath.
create or replace function public.punch_sale(
  p_invoice_number text,
  p_lead_id        uuid default null,
  p_seller_id      uuid default null,
  p_notes          text default null
)
returns public.sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv    public.invoices;
  v_row    public.sales;
  v_seller uuid;
begin
  select * into v_inv from public.invoices where invoice_number = p_invoice_number;
  if not found then
    raise exception 'No invoice numbered %. Generate the invoice first — a sale cannot be punched without one.', p_invoice_number
      using errcode = 'no_data_found';
  end if;

  select * into v_row from public.sales where invoice_number = p_invoice_number;

  -- Already punched. Returned as-is: this is the double-click, and it is not
  -- an error. Nothing is counted a second time.
  if found and v_row.punched_at is not null then
    return v_row;
  end if;

  -- Who is credited. An explicit seller wins (HR may correct it at this exact
  -- moment and no later); otherwise the lead's own seller; otherwise whatever
  -- the ledger row already carried.
  v_seller := coalesce(
    p_seller_id,
    (select assigned_seller from public.student_leads where id = p_lead_id),
    v_row.seller_id
  );

  if found then
    update public.sales
       set seller_id     = v_seller,
           lead_id       = coalesce(p_lead_id, lead_id),
           punched_at    = now(),
           punched_by    = auth.uid(),
           seller_locked = true,
           notes         = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes)
     where invoice_number = p_invoice_number
       and punched_at is null
    returning * into v_row;
  else
    insert into public.sales (
      invoice_number, invoice_id,
      student_name, student_email, course_name, country, state,
      amount, currency_code, currency_symbol,
      gst_included, taxable, total_tax,
      sold_on, seller_id, recorded_by, notes,
      lead_id, punched_at, punched_by, seller_locked
    ) values (
      v_inv.invoice_number, v_inv.id,
      v_inv.customer_name, v_inv.customer_email, v_inv.course_name,
      v_inv.customer_country, null,
      v_inv.total, v_inv.currency_code, v_inv.currency_symbol,
      v_inv.include_gst, v_inv.taxable, v_inv.total_tax,
      v_inv.invoice_date, v_seller, auth.uid(),
      nullif(trim(coalesce(p_notes, '')), ''),
      p_lead_id, now(), auth.uid(), true
    )
    returning * into v_row;
  end if;

  -- The lead, in the same transaction. `enrolled` is this codebase's name for
  -- the spec's "Sale Done" — the same stage, not a second one.
  if p_lead_id is not null then
    update public.student_leads
       set stage        = 'enrolled',
           sale_stage   = 'punched',
           sale_value   = coalesce(sale_value, v_inv.total),
           amount_paid  = coalesce(amount_paid, 0) + v_inv.total,
           last_updated = now(),
           updated_at   = now()
     where id = p_lead_id;

    insert into public.lead_history (lead_id, action, old_value, new_value, performed_by, performed_by_role, notes)
    values (p_lead_id, 'stage_changed', 'final', 'enrolled', auth.uid(), 'hr',
            'Sale punched · ' || v_inv.invoice_number);
  end if;

  return v_row;
end;
$$;

comment on function public.punch_sale is
  'Atomically confirm a sale: ledger row, lead → enrolled, attribution locked. Idempotent on an already-punched invoice.';

-- ══════════════════════════════════════════════════════════════════════════
-- 5. INCENTIVES — one entitlement per seller per month
-- ══════════════════════════════════════════════════════════════════════════
-- The tiers do not stack: thirty sales is an entitlement of 12,000, not
-- 5,000 + 12,000. That is arithmetic and lives in TypeScript. What lives here
-- is the request HR approves, and the constraint that stops there being two of
-- them for one month — which is the only way the same money gets paid twice.

create table if not exists public.seller_incentive_requests (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references public.profiles(id) on delete cascade,
  -- 'YYYY-MM' in Asia/Kolkata. See monthWindow() in lib/leads/seller-assignment.ts —
  -- a sale at 2am on the 1st in Delhi belongs to the new month, and UTC disagrees.
  month_key      text not null,
  sales_count    integer not null default 0,
  -- The tier that was reached, in sales. 15 or 30; 0 for a per-sale-only month.
  tier_sales     integer not null default 0,
  -- What the arithmetic said at the moment the threshold was crossed. Frozen,
  -- so a later refund cannot silently change a number HR already approved.
  amount         numeric(12,2) not null default 0,
  breakdown      jsonb,
  status         text not null default 'pending',
  decided_by     uuid references public.profiles(id) on delete set null,
  decided_at     timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.seller_incentive_requests drop constraint if exists seller_incentive_status_check;
alter table public.seller_incentive_requests
  add constraint seller_incentive_status_check check (status in ('pending', 'approved', 'rejected'));

-- The guard. One row per seller per month, whatever fires the threshold check.
create unique index if not exists seller_incentive_once
  on public.seller_incentive_requests(seller_id, month_key);

create index if not exists seller_incentive_pending_idx
  on public.seller_incentive_requests(status, created_at desc);

-- ══════════════════════════════════════════════════════════════════════════
-- 6. A SELLER'S BASE PAY — per person, with a company default
-- ══════════════════════════════════════════════════════════════════════════
-- Nullable. NULL means "whatever the company default is", so raising everyone
-- is one settings row rather than an UPDATE across the table, and a seller
-- hired on different terms is one column rather than an exception in code.

alter table public.profiles
  add column if not exists seller_base_salary numeric(12,2);

comment on column public.profiles.seller_base_salary is
  'Monthly base pay for a seller, in INR. NULL means use app_settings.seller_base_salary_default.';

alter table public.profiles drop constraint if exists profiles_seller_base_salary_check;
alter table public.profiles
  add constraint profiles_seller_base_salary_check
  check (seller_base_salary is null or seller_base_salary >= 0);

-- ══════════════════════════════════════════════════════════════════════════
-- 7. THE NUMBERS HR CAN CHANGE WITHOUT A DEPLOY
-- ══════════════════════════════════════════════════════════════════════════
-- Seeded, not overwritten: `on conflict do nothing` means re-running this file
-- cannot undo a rate somebody has since changed on the HR screen.

insert into public.app_settings (key, value) values
  ('seller_base_salary_default',        '10000'),
  ('seller_incentive_tier1_sales',      '15'),
  ('seller_incentive_tier1_amount',     '5000'),
  ('seller_incentive_tier2_sales',      '30'),
  ('seller_incentive_tier2_amount',     '12000'),
  -- Above the top tier the shape changes from a flat entitlement to per-sale.
  ('seller_incentive_above_per_sale',   '500'),
  -- Per-sale bonuses on value. The 50k bonus REPLACES the 20k one; it does not
  -- add to it. See lib/seller/incentives.ts, which is where that is enforced.
  ('seller_bonus_sale_20k_threshold',   '20000'),
  ('seller_bonus_sale_20k_amount',      '200'),
  ('seller_bonus_sale_50k_threshold',   '50000'),
  ('seller_bonus_sale_50k_amount',      '2000')
on conflict (key) do nothing;

-- ══════════════════════════════════════════════════════════════════════════
-- 8. WHERE THE CLASS STANDS — pinned, so a typo cannot invent a queue
-- ══════════════════════════════════════════════════════════════════════════
-- student_leads.trial_status is free text and drives the seller's queues. A
-- route writing 'noshow' instead of 'no_show' would not fail; the lead would
-- simply never appear in Missed Trials, which is exactly the class of silent
-- absence this codebase keeps producing.
--
-- 'slot_assistance' is the family who said none of the offered times work.
-- They have no booking — inventing one to represent a class that will not
-- happen puts a ghost in the teacher's calendar and in the trial counts.

alter table public.student_leads drop constraint if exists student_leads_trial_status_check;
alter table public.student_leads
  add constraint student_leads_trial_status_check
  check (trial_status is null or trial_status in (
    'booked',
    'attended',
    'no_show',
    'slot_assistance',
    'final_conversation_pending'
  ));

create index if not exists student_leads_trial_status_idx
  on public.student_leads(trial_status) where trial_status is not null;

-- ══════════════════════════════════════════════════════════════════════════
-- 9. THE EVENT LOG — for the things that have no home
-- ══════════════════════════════════════════════════════════════════════════
-- Deliberately NOT a second copy of lead_history or admin_audit_logs. Those
-- two each own their story and keep it:
--
--   lead_history      — a lead's stage changed, and who changed it
--   admin_audit_logs  — a person with power did something
--
-- Neither can hold "this student's main credit hit zero" or "this catch-up
-- went overdue", because no lead and no admin was involved. Those events
-- currently exist only as a mutated column — student_status went from active
-- to paused and the previous value is gone. This table is where the ones with
-- nowhere else to go are written, once, in order.

create table if not exists public.domain_events (
  id            bigserial primary key,
  event         text not null,
  -- What it happened to. Kept loose on purpose: a student, a booking, a
  -- catch-up lesson and a seller month are not one foreign key.
  subject_type  text,
  subject_id    uuid,
  actor_id      uuid references public.profiles(id) on delete set null,
  payload       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists domain_events_event_idx   on public.domain_events(event, created_at desc);
create index if not exists domain_events_subject_idx on public.domain_events(subject_type, subject_id, created_at desc);

comment on table public.domain_events is
  'Append-only log for events with no other home (credit exhausted, auto-resumed, catch-up overdue, sale punched, incentive earned). Lead stage changes stay in lead_history; admin actions stay in admin_audit_logs.';

-- ══════════════════════════════════════════════════════════════════════════
-- 10. A SELLER'S OWN INCENTIVE REQUEST — asked for, not computed
-- ══════════════════════════════════════════════════════════════════════════
-- The tier entitlement is worked out and requested automatically, one per
-- seller per month. A seller also needs to be able to ask for something the
-- tiers cannot see — a school deal that took three weeks — the way a teacher
-- already can. Same table, same HR decision, told apart by `kind`.
--
-- The one-per-month rule now applies to the computed kind only. A partial
-- unique index says exactly that: a full one would limit a seller to a single
-- ask per month, and none at all would let the computed entitlement be
-- written twice — which is the only way the same money gets paid twice.
alter table public.seller_incentive_requests
  add column if not exists kind         text not null default 'tier',
  add column if not exists reason       text,
  add column if not exists requested_by uuid references public.profiles(id) on delete set null;

alter table public.seller_incentive_requests drop constraint if exists seller_incentive_kind_check;
alter table public.seller_incentive_requests
  add constraint seller_incentive_kind_check check (kind in ('tier', 'manual'));

drop index if exists public.seller_incentive_once;
create unique index if not exists seller_incentive_tier_once
  on public.seller_incentive_requests(seller_id, month_key) where kind = 'tier';

-- ══════════════════════════════════════════════════════════════════════════
-- 11. SELLER SETTLEMENTS — the cycle teachers already have
-- ══════════════════════════════════════════════════════════════════════════
-- Opens on the 1st; settles itself on the 5th at 10:00 IST if the seller has
-- not pressed Settle. A teacher's settlement bundles per-class earning rows. A
-- seller has none — their month is a base salary plus whatever incentive HR
-- approved — so the function is new, and the calendar is shared.
create table if not exists public.seller_settlements (
  id                uuid primary key default gen_random_uuid(),
  seller_id         uuid not null references public.profiles(id) on delete cascade,
  period_month      text not null,
  period_start      timestamptz not null,
  period_end        timestamptz not null,
  -- Frozen when settled. A base salary raised in November must not rewrite
  -- what October's payslip said.
  base_amount       numeric(12,2) not null default 0,
  incentive_amount  numeric(12,2) not null default 0,
  incentive_count   integer not null default 0,
  total_amount      numeric(12,2) not null default 0,
  settlement_type   text not null default 'manual',
  auto_reason       text,
  payment_status    text not null default 'seller_settled',
  requested_at      timestamptz not null default now(),
  settled_at        timestamptz not null default now(),
  approved_by       uuid references public.profiles(id) on delete set null,
  approved_at       timestamptz,
  paid_at           timestamptz,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.seller_settlements drop constraint if exists seller_settlements_type_check;
alter table public.seller_settlements
  add constraint seller_settlements_type_check check (settlement_type in ('manual', 'auto'));

alter table public.seller_settlements drop constraint if exists seller_settlements_payment_check;
alter table public.seller_settlements
  add constraint seller_settlements_payment_check
  check (payment_status in ('seller_settled', 'admin_settled', 'processing', 'paid'));

-- One settlement per seller per month. What makes an hourly schedule safe to
-- run 720 times a month, and a double-click on Settle harmless.
create unique index if not exists seller_settlements_month_once
  on public.seller_settlements(seller_id, period_month);
create index if not exists seller_settlements_status_idx
  on public.seller_settlements(payment_status, period_month desc);

-- Which settlement paid an incentive. Null means approved and still owed.
alter table public.seller_incentive_requests
  add column if not exists settlement_id uuid references public.seller_settlements(id) on delete set null;
create index if not exists seller_incentive_unsettled_idx
  on public.seller_incentive_requests(seller_id, status) where settlement_id is null;

-- The first month this system pays. Without it, the schedule's first run would
-- settle August — a month already paid some other way — and put a ₹10,000
-- "owed" row in front of HR that nobody owes.
insert into public.app_settings (key, value) values
  ('seller_settlement_start_month', '2026-09')
on conflict (key) do nothing;

-- ── settle_seller_month — the single writer of seller settlements ──────────
-- Returns the settlement id, or null when there was nothing to write: already
-- settled, before the start month, or not a seller. lib/seller/payout.ts
-- previews exactly this rule for the screen — change one, change both.
create or replace function public.settle_seller_month(
  p_seller_id uuid,
  p_month     text,
  p_type      text default 'auto',
  p_reason    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start_ist timestamp;
  v_start     timestamptz;
  v_end       timestamptz;
  v_first     text;
  v_default   numeric;
  v_base      numeric;
  v_inc       numeric;
  v_n         int;
  v_id        uuid;
begin
  if p_type not in ('manual', 'auto') then
    raise exception 'settlement type must be manual or auto, got %', p_type;
  end if;
  if p_month !~ '^\d{4}-\d{2}$' then
    raise exception 'month must be YYYY-MM, got %', p_month;
  end if;

  select value into v_first from public.app_settings where key = 'seller_settlement_start_month';
  if v_first ~ '^\d{4}-\d{2}$' and p_month < v_first then
    return null;
  end if;

  if exists (select 1 from public.seller_settlements
              where seller_id = p_seller_id and period_month = p_month) then
    return null;
  end if;

  -- The month as wall-clock time in India, then as real instants.
  v_start_ist := to_timestamp(p_month || '-01', 'YYYY-MM-DD')::timestamp;
  v_start     := v_start_ist at time zone 'Asia/Kolkata';
  v_end       := (v_start_ist + interval '1 month') at time zone 'Asia/Kolkata';

  select case when value ~ '^\d+(\.\d+)?$' then value::numeric end
    into v_default
    from public.app_settings where key = 'seller_base_salary_default';

  -- Only a seller draws a seller's pay. An admin who merely holds leads is
  -- refused here as well as in the app.
  select coalesce(seller_base_salary, v_default, 10000)
    into v_base
    from public.profiles
   where id = p_seller_id and (role = 'seller' or is_seller = true);
  if v_base is null then
    return null;
  end if;

  -- Every approved, unpaid incentive up to and including this month — so one
  -- HR approves on 7 October for a September sale is not stranded because
  -- September has already closed.
  select count(*), coalesce(sum(amount), 0)
    into v_n, v_inc
    from public.seller_incentive_requests
   where seller_id = p_seller_id
     and status = 'approved'
     and settlement_id is null
     and month_key <= p_month;

  insert into public.seller_settlements (
    seller_id, period_month, period_start, period_end,
    base_amount, incentive_amount, incentive_count, total_amount,
    settlement_type, auto_reason, payment_status, requested_at, settled_at
  ) values (
    p_seller_id, p_month, v_start, v_end,
    v_base, v_inc, v_n, v_base + v_inc,
    p_type,
    case
      when p_reason is not null then p_reason
      when p_type = 'auto' then 'Not settled by the 5th — settled automatically at 10:00 IST.'
      else null
    end,
    'seller_settled', now(), now()
  )
  returning id into v_id;

  update public.seller_incentive_requests
     set settlement_id = v_id, updated_at = now()
   where seller_id = p_seller_id
     and status = 'approved'
     and settlement_id is null
     and month_key <= p_month;

  return v_id;
exception
  -- The unique index caught a concurrent run. That is the guard working.
  when unique_violation then
    return null;
end;
$$;

-- ── auto_settle_sellers_due — what the schedule calls ───────────────────────
-- Decides for itself whether it is time. Running it on the 3rd does nothing;
-- running it late catches up rather than skipping somebody's month.
create or replace function public.auto_settle_sellers_due()
returns table (settled_sellers int, month text, ran boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now_ist timestamp := (now() at time zone 'Asia/Kolkata');
  v_due_ist timestamp;
  v_month   text;
  v_seller  uuid;
  v_n       int := 0;
begin
  v_due_ist := date_trunc('month', v_now_ist) + interval '4 days' + interval '10 hours';
  v_month   := to_char(date_trunc('month', v_now_ist) - interval '1 month', 'YYYY-MM');

  if v_now_ist < v_due_ist then
    return query select 0, v_month, false;
    return;
  end if;

  -- Every seller, not only those with sales: a base salary is owed either way.
  for v_seller in
    select id from public.profiles where role = 'seller' or is_seller = true
  loop
    if public.settle_seller_month(v_seller, v_month, 'auto', null) is not null then
      v_n := v_n + 1;
    end if;
  end loop;

  return query select v_n, v_month, true;
end;
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- 12. NOTHING HERE IS REACHABLE FROM A BROWSER
-- ══════════════════════════════════════════════════════════════════════════
-- A table created in `public` without row-level security is readable AND
-- writable by the anon key, and the anon key ships in every page's JavaScript.
-- Every table in this file is only ever touched by API routes that check the
-- caller's role first and then use the service key — so RLS goes on with no
-- policies at all, and only the server can reach them. A seller's logbook, a
-- family's phone number and somebody's payslip are not public data.
alter table public.lead_notes                enable row level security;
alter table public.lead_reminders            enable row level security;
alter table public.lead_transfers            enable row level security;
alter table public.seller_incentive_requests enable row level security;
alter table public.domain_events             enable row level security;
alter table public.seller_settlements        enable row level security;

-- Functions are executable by PUBLIC unless revoked, and PostgREST exposes
-- every one of them at /rest/v1/rpc/<name>. Left alone, anybody holding the
-- anon key could punch a sale and lock its commission to a seller of their
-- choosing. The app calls these through the service client after its own
-- role check; nothing else needs to.
revoke execute on function public.punch_sale(text, uuid, uuid, text) from public, anon, authenticated;
grant  execute on function public.punch_sale(text, uuid, uuid, text) to service_role;
revoke execute on function public.settle_seller_month(uuid, text, text, text) from public, anon, authenticated;
grant  execute on function public.settle_seller_month(uuid, text, text, text) to service_role;
revoke execute on function public.auto_settle_sellers_due() from public, anon, authenticated;
grant  execute on function public.auto_settle_sellers_due() to service_role;

-- The schedule — only if pg_cron is on. Teacher settlement already uses it,
-- but a missing extension must not fail everything above it in this file.
do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'sariro-auto-settle-sellers';
    perform cron.schedule('sariro-auto-settle-sellers', '5 * * * *',
                          'select public.auto_settle_sellers_due();');
  end if;
end
$do$;

-- ── One table. What actually exists now. ───────────────────────────────────
select 'lead_notes'                as object, count(*)::text as rows from public.lead_notes
union all
select 'lead_reminders',              count(*)::text from public.lead_reminders
union all
select 'lead_transfers',              count(*)::text from public.lead_transfers
union all
select 'seller_incentive_requests',   count(*)::text from public.seller_incentive_requests
union all
select 'domain_events',               count(*)::text from public.domain_events
union all
select 'sales rows needing a punch',
       count(*) filter (where punched_at is null)::text || ' of ' || count(*)::text
  from public.sales
union all
select 'sellers with a custom base salary',
       count(*)::text from public.profiles where seller_base_salary is not null
union all
select 'incentive settings seeded',
       count(*)::text || ' of 11'
  from public.app_settings where key like 'seller_%'
union all
select 'active sellers',
       count(*)::text from public.profiles where role = 'seller' or is_seller = true
union all
select 'seller settlements',          count(*)::text from public.seller_settlements
union all
select 'seller payouts start from',
       coalesce((select value from public.app_settings where key = 'seller_settlement_start_month'), 'not set')
union all
select 'automatic seller settlement',
       case when exists (select 1 from pg_extension where extname = 'pg_cron')
            then 'scheduled hourly'
            else 'pg_cron is off — enable it, then run this file again' end
union all
select 'new tables locked to the server',
       count(*)::text || ' of 6'
  from pg_tables
 where schemaname = 'public'
   and rowsecurity
   and tablename in ('lead_notes', 'lead_reminders', 'lead_transfers',
                     'seller_incentive_requests', 'domain_events', 'seller_settlements');
