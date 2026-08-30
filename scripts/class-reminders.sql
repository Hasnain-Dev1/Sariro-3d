-- =============================================================================
-- SARIRO — Class reminders
-- =============================================================================
-- Nothing in this product runs on a timer. Every notification so far is sent by
-- a human doing something — enrolling a student, cancelling a class, assigning a
-- teacher. That means the single most useful message a learning platform can
-- send ("your class starts in 30 minutes") has never been sent at all, and a
-- learner's only defence against forgetting is their own memory.
--
-- This adds the one column that makes reminders safe to send from a cron:
-- somewhere to record that a booking has already been reminded.
--
-- ── Why a column and not a table ──────────────────────────────────────────────
-- A reminder is a fact ABOUT a booking, exactly one per booking, and it dies
-- with the booking. A separate table would need its own foreign key, its own
-- cascade and its own cleanup, to store a single timestamp. When the product
-- eventually sends more than one kind of reminder (24 hours before, 30 minutes
-- before, WhatsApp as well as in-app), that is the moment to promote this to a
-- table — not before.
--
-- ── Why this column is what makes it safe ─────────────────────────────────────
-- The cron route CLAIMS a booking by stamping `reminder_sent_at` before it
-- sends anything, and only claims rows where it is still null. Two overlapping
-- cron runs therefore cannot both send: the second one finds nothing to claim.
-- Without this, a cron that runs every 10 minutes against a 35-minute window
-- would remind the same class three times.
--
-- Idempotent. Safe to re-run.
--   Supabase → SQL Editor → paste → Run
-- =============================================================================

alter table public.bookings
  add column if not exists reminder_sent_at timestamptz;

comment on column public.bookings.reminder_sent_at is
  'When the "your class is starting soon" reminder was sent. NULL = not yet sent. Claimed by /api/cron/class-reminders before sending, so overlapping cron runs cannot double-send.';

-- The cron asks exactly one question: "which scheduled bookings start soon and
-- have not been reminded?" This partial index is that question. It stays small
-- because rows leave it as soon as they are reminded or stop being scheduled,
-- so it does not grow with history the way a full index on slot_start would.
create index if not exists idx_bookings_reminder_due
  on public.bookings (slot_start)
  where reminder_sent_at is null and status = 'scheduled';
