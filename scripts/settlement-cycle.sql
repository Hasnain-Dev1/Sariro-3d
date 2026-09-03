-- ============================================================================
-- SARIRO — settlement cycle: opens on the 1st, settles itself on the 5th
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §41-42. Replaces "the cycle closes on the 30th", which paid a variable
-- number of days depending on the month and had no defined behaviour at all for
-- a teacher who simply never clicked Settle.
--
-- ── What changes ────────────────────────────────────────────────────────────
-- A settlement now belongs to a named calendar month. That is the point of the
-- `period_month` column: without it, "which month is this settlement for?" is
-- answered by inspecting the class dates inside it, which stops working the
-- moment a class is rescheduled across a month boundary.
--
-- ── Why the type is recorded ────────────────────────────────────────────────
-- §42 asks for settlement type, time, amount and reason. A teacher looking at
-- last month's payout should be able to see that they did not settle it and the
-- system did — otherwise an automatic payout looks like an unexplained one.
-- ============================================================================

alter table public.teacher_settlements
  -- '2026-08'. Sortable, unambiguous, and stable under rescheduling.
  add column if not exists period_month text,
  -- 'manual' when the teacher clicked, 'auto' when the 5th arrived first.
  add column if not exists settlement_type text not null default 'manual'
    check (settlement_type in ('manual', 'auto')),
  add column if not exists settled_at timestamptz,
  -- Free text, written by whatever settled it. §42 asks for the reason.
  add column if not exists auto_reason text;

-- One settlement per teacher per month. This is the constraint that makes the
-- automatic run safe to repeat: a second attempt collides instead of paying
-- twice. Everything else in the cycle is written to rely on it.
create unique index if not exists teacher_settlements_month_uniq
  on public.teacher_settlements (teacher_id, period_month)
  where period_month is not null;

create index if not exists teacher_settlements_month_idx
  on public.teacher_settlements (period_month);

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Existing settlements predate the column. Their month is derived from
-- period_start, read in IST so a settlement that began at 19:00 UTC on the 31st
-- is not filed under the following month.
update public.teacher_settlements
   set period_month = to_char((period_start at time zone 'UTC' at time zone 'Asia/Kolkata'), 'YYYY-MM')
 where period_month is null
   and period_start is not null;
