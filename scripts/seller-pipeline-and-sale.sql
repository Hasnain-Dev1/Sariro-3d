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
       count(*)::text || ' of 10'
  from public.app_settings where key like 'seller_%'
union all
select 'active sellers',
       count(*)::text from public.profiles where role = 'seller' or is_seller = true;
