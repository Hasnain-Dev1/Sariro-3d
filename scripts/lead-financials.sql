-- ============================================================================
-- SARIRO — Lead sale-value tracking
-- ============================================================================
-- Adds the seller-entered sale figures to a lead. `due` is always derived
-- (sale_value - amount_paid) — not stored — so it can never drift.
-- Idempotent; safe to run more than once.
-- ============================================================================

alter table public.student_leads add column if not exists sale_value  numeric not null default 0;
alter table public.student_leads add column if not exists amount_paid numeric not null default 0;

-- ============================================================================
-- Rollback:
--   alter table public.student_leads drop column if exists sale_value;
--   alter table public.student_leads drop column if exists amount_paid;
-- ============================================================================
