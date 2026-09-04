-- ============================================================================
-- SARIRO — which region a batch runs for
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §8: manual enrolment selects a country, then shows compatible batches with
-- the country on each card.
--
-- ── What the field is actually for ──────────────────────────────────────────
-- Not billing — the invoice carries its own country, taken from the customer at
-- the time of sale. This is about the clock.
--
-- A batch is a fixed weekly slot in one timezone. A child in Dubai offered a
-- batch that meets at 09:00 IST is being offered a 07:30 class, and a child in
-- California is being offered one at 20:30 the previous day. Both enrol, both
-- stop coming, and nothing in the product ever says why.
--
-- Country is the coarse version of that question, and coarse is right here: an
-- admin placing a child does not want to reason about UTC offsets, they want to
-- see "this batch is for India" beside a batch code.
--
-- ── Nullable on purpose ─────────────────────────────────────────────────────
-- Existing batches have no country and inventing one for them would be worse
-- than leaving it blank. A batch with no country is shown to everybody, which
-- is exactly how the product behaved before this column existed.
-- ============================================================================

alter table public.cohorts
  add column if not exists country text;

-- Manual enrolment filters on it, and the list is short, so this is enough.
create index if not exists cohorts_country_idx
  on public.cohorts (country) where country is not null;

comment on column public.cohorts.country is
  'Region this batch is scheduled for, so a child is not offered a class at 3am their time. Null means unrestricted — shown to everybody. Not used for tax; the invoice takes its own country from the customer.';
