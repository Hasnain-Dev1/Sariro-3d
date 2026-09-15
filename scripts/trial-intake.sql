-- ============================================================================
-- SARIRO — what a family tells us before their free class
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- /my-class now asks a family three small things before the trial: where the
-- child is with the subject and what they are into, whether their microphone
-- works, and a three-question warm-up. The answers go straight to the teacher's
-- trial playbook (/dashboard/teacher/trial-playbook), which uses them to choose
-- the path the class starts on — so the teacher walks in knowing the child likes
-- games and got the warm-up right, instead of spending five minutes finding out.
--
-- ── One row per child per trial ─────────────────────────────────────────────
-- A trial can hold several children (scripts/trial-participants.sql), and each
-- has their own answers. The shape of `intake` is TrialIntake in
-- src/lib/trial/playbooks/types.ts; the route cleans it before it is written.
--
-- ── Who can read and write ──────────────────────────────────────────────────
-- Nobody directly. RLS is on with no policies, so only the service role — the
-- API route /api/trial/intake — touches it, after checking that the caller is
-- in that trial (to write) or is its teacher or staff (to read). A child's
-- answers are not something another family's browser should be able to query.
-- ============================================================================

set search_path = public;

create table if not exists public.trial_intakes (
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  intake      jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (booking_id, student_id)
);

comment on table public.trial_intakes is
  'A family''s answers before a trial (experience, interests, feeling, question, warm-up, mic check). Written and read only through /api/trial/intake. Shape: TrialIntake in src/lib/trial/playbooks/types.ts.';

alter table public.trial_intakes enable row level security;

-- ── The one table ───────────────────────────────────────────────────────────
select
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'trial_intakes') as table_present,
  (select relrowsecurity from pg_class where oid = 'public.trial_intakes'::regclass)                           as rls_on,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'trial_intakes')               as policies,
  (select count(*) from public.trial_intakes)                                                                  as rows_so_far;
