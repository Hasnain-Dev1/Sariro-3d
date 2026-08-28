-- =============================================================================
-- SARIRO — Complimentary classes
-- =============================================================================
-- The 1:1 masterclass model opens with 3–4 diagnostic sessions the learner is
-- not charged for: the mentor works out how this person actually thinks before
-- deciding what they learn.
--
-- Without this flag those sessions silently consume paid credits.
-- `/api/teacher/complete-class` deducts one credit per active student on every
-- completion, unconditionally — so a learner who bought 12 classes and received
-- 4 diagnostics would get 8. That is a refund, and a bad first impression at the
-- exact moment trust is being built.
--
-- A complimentary class is a REAL class in every other respect: it is scheduled,
-- attended, marked, and **the teacher is paid for it**. The only difference is
-- that no credit is consumed. Teacher pay is deliberately untouched — those
-- hours cost the business, and pretending otherwise would hide the true margin
-- of the diagnostic model.
--
-- Idempotent. Safe to re-run.
--   Supabase → SQL Editor → paste → Run
-- =============================================================================

alter table public.bookings
  add column if not exists is_complimentary boolean not null default false;

comment on column public.bookings.is_complimentary is
  'True for classes the learner is not charged a credit for (e.g. the 3-4 diagnostic sessions that open a 1:1 masterclass). The teacher is still paid.';

-- Why it was free, for the admin who asks in six months.
alter table public.bookings
  add column if not exists complimentary_reason text;

-- Complimentary bookings are rare, so a partial index keeps it cheap while
-- making "show me every free class we have given" instant.
create index if not exists bookings_complimentary_idx
  on public.bookings (cohort_id, slot_start)
  where is_complimentary = true;

-- ── safety net ───────────────────────────────────────────────────────────────
-- Application code is the primary guard, but a credit must never be consumed for
-- a complimentary booking even if a future code path forgets. This blocks the
-- write at the database level, the same way `enforce_name_lock` and the
-- append-only evidence trigger do — UI-level rules get bypassed, DB rules don't.
create or replace function public.block_credit_on_complimentary()
returns trigger
language plpgsql
as $$
declare
  complimentary boolean;
begin
  if new.type <> 'class_consumed' or new.related_booking_id is null then
    return new;
  end if;

  select b.is_complimentary into complimentary
  from public.bookings b
  where b.id = new.related_booking_id;

  if complimentary then
    raise exception
      'Refusing to consume a credit for complimentary booking % — diagnostic and gifted classes are never charged.',
      new.related_booking_id;
  end if;

  return new;
end;
$$;

drop trigger if exists credit_tx_block_complimentary on public.credit_transactions;
create trigger credit_tx_block_complimentary
  before insert on public.credit_transactions
  for each row execute function public.block_credit_on_complimentary();
