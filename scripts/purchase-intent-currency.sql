-- =============================================================================
-- SARIRO — Record what a customer was actually charged
-- =============================================================================
-- `purchase_intents` stores track, level, ratio and status — but **no amount and
-- no currency**. So when a course displayed at $199 was charged as INR 199,
-- there was no row anywhere that could have revealed it. The defect was
-- invisible by construction.
--
-- These columns make every checkout self-describing: what we quoted, in which
-- currency, and what we sent to the gateway. Reconciling a bank statement
-- against intent becomes a query instead of an investigation.
--
-- Idempotent. Safe to re-run.
--   Supabase → SQL Editor → paste → Run
-- =============================================================================

-- The price the customer saw, in whole units (199 = $199).
alter table public.purchase_intents
  add column if not exists display_price numeric(10, 2);

-- The currency that price was expressed in, ISO 4217 ('USD', 'INR').
alter table public.purchase_intents
  add column if not exists display_currency text;

-- What was actually sent to the gateway, in minor units (19900 = $199.00).
-- Stored separately from display_price on purpose: if they ever disagree, that
-- disagreement is the bug, and it should be visible rather than derived away.
alter table public.purchase_intents
  add column if not exists charge_amount_minor bigint;

alter table public.purchase_intents
  add column if not exists charge_currency text;

comment on column public.purchase_intents.display_price is
  'Price shown to the customer, whole units. 199 = $199.';
comment on column public.purchase_intents.charge_amount_minor is
  'Amount sent to the payment gateway in minor units. 19900 = $199.00. If this disagrees with display_price x 100, something is wrong.';

-- Currency codes are three letters or nothing. A malformed code is how a
-- gateway silently falls back to its account default.
alter table public.purchase_intents drop constraint if exists purchase_intents_currency_shape;
alter table public.purchase_intents add constraint purchase_intents_currency_shape
  check (
    (display_currency is null or display_currency ~ '^[A-Z]{3}$')
    and (charge_currency is null or charge_currency ~ '^[A-Z]{3}$')
  );

create index if not exists purchase_intents_currency_idx
  on public.purchase_intents (charge_currency, created_at desc);

-- ── the reconciliation view ──────────────────────────────────────────────────
-- Any intent where the quoted price and the charged amount disagree. On a
-- healthy system this returns nothing; anything here is money going astray.
create or replace view public.purchase_intent_mismatches as
select
  id,
  user_id,
  track,
  level,
  ratio,
  status,
  display_price,
  display_currency,
  charge_amount_minor,
  charge_currency,
  created_at
from public.purchase_intents
where display_price is not null
  and charge_amount_minor is not null
  and (
    charge_currency is distinct from display_currency
    or charge_amount_minor <> round(display_price * 100)
  )
order by created_at desc;
