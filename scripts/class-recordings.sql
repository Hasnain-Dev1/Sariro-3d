-- ============================================================================
-- SARIRO — the class recording, and the attendance it gates
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- ── What this is for ────────────────────────────────────────────────────────
-- Recordings exist today for exactly one thing: doubt sessions. A normal class
-- — the thing every student actually buys — has nowhere to put one. So:
--
--   • a teacher who records a class has nowhere to submit the link;
--   • a student who missed a class has nothing to watch;
--   • and nothing anywhere knows whether a class was recorded at all.
--
-- V2 §17-21 asks for the recording to be captured DURING attendance marking and
-- revealed only once that marking is finished. This adds the two columns that
-- makes that possible, plus the per-student note §16 asks for.
--
-- ── Why finalisation is its own timestamp ───────────────────────────────────
-- `session_attendance` already records each student's status one row at a time,
-- and a teacher marking a roster of four produces four rows over several
-- seconds. That is not the same event as "the teacher has finished with this
-- class", and the recording must not appear to a student halfway through.
--
-- `attendance_finalized_at` on the booking is that second event: set once, by
-- an explicit action, and only when a recording URL is present. Everything the
-- student sees keys off it rather than off the presence of attendance rows.
--
-- ── What this does NOT do ───────────────────────────────────────────────────
-- It does not touch the existing per-student attendance endpoint, the lesson
-- automation hanging off it, or any penalty rule. Marking attendance keeps
-- working exactly as it does today; finalising is a new step layered on top.
-- ============================================================================

alter table public.bookings
  -- The link a teacher submits. Free-form: Meet, Drive, Zoom and Loom all
  -- produce different shapes, and a CHECK here would reject a valid one the
  -- day the team changes tools.
  add column if not exists recording_url text,
  -- Set once, when the teacher finishes marking AND a recording exists.
  -- Null means "still in progress" — which is what hides the recording.
  add column if not exists attendance_finalized_at timestamptz,
  add column if not exists attendance_finalized_by uuid references auth.users(id) on delete set null;

alter table public.session_attendance
  -- §16: "The teacher must be able to add a unique note for each student."
  -- Per student, per class — "joined 8 minutes late", not a class-wide remark.
  add column if not exists note text;

-- The student calendar asks "which of my classes are finalised?" on every
-- render, and the teacher dashboard asks the inverse.
create index if not exists bookings_finalized_idx
  on public.bookings (attendance_finalized_at);

-- ── The rule, enforced in the database ──────────────────────────────────────
-- §18 says a teacher must not be able to finalise without a recording. The API
-- enforces that too, but an API check is a promise and a constraint is a fact:
-- anything that writes this table — a future script, an admin tool, a fix
-- applied by hand at midnight — is held to the same rule.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'chk_finalized_needs_recording') then
    alter table public.bookings
      add constraint chk_finalized_needs_recording
      check (
        attendance_finalized_at is null
        or (recording_url is not null and length(trim(recording_url)) > 0)
      );
  end if;
end $$;
