-- =============================================================================
-- SARIRO — Learner Model  (Stage 2 · S1)
-- =============================================================================
-- The moat. Everything else in Stage 2 reads from these two tables.
--
-- Two tables with deliberately different natures:
--
--   learning_evidence            APPEND-ONLY log of observations. The truth.
--   learner_capability_mastery   DERIVED rollup. Disposable, rebuildable.
--
-- Why append-only: the first version of the scoring WILL be wrong. If mastery is
-- a number we mutate, a scoring change silently rewrites every learner's past
-- and we can never explain to a parent why we believe something. With a ledger
-- we recompute from raw observations, replay history, and always answer "why".
-- Delete the rollup any time; the truth survives.
--
-- Idempotent. Safe to re-run.
--   Supabase → SQL Editor → paste → Run
-- =============================================================================

-- ── the ledger ───────────────────────────────────────────────────────────────
create table if not exists public.learning_evidence (
  id              uuid primary key default gen_random_uuid(),
  learner_id      uuid not null references auth.users (id) on delete cascade,
  capability_slug text not null references public.capabilities (slug) on update cascade on delete cascade,

  -- What was observed.
  source          text not null check (source in (
                    'project_review',    -- strongest: a human judged real work
                    'mentor_note',       -- a human said something no model could infer
                    'quiz',
                    'lesson_complete',   -- weak: exposure, not mastery
                    'attendance',        -- weak: presence, not mastery
                    'self_assessment'
                  )),
  -- Points back at the thing observed, e.g. a project_submissions id. Lets us
  -- show a parent the actual work behind a number, and makes the backfill
  -- idempotent without a second bookkeeping table.
  source_ref      text,
  unit_key        text,

  -- -1..1. Negative is legitimate: a learner can demonstrate they cannot yet do
  -- something, and pretending otherwise is how mastery models drift upward
  -- forever and stop meaning anything.
  signal          numeric(4, 3) not null check (signal >= -1 and signal <= 1),
  -- How much this observation counts. Content tag weight × source strength.
  weight          numeric(4, 3) not null default 1.000 check (weight > 0 and weight <= 1),

  note            text,
  observed_at     timestamptz not null default now(),
  recorded_by     uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists learning_evidence_learner_idx    on public.learning_evidence (learner_id);
create index if not exists learning_evidence_capability_idx on public.learning_evidence (capability_slug);
create index if not exists learning_evidence_observed_idx   on public.learning_evidence (observed_at desc);

-- Replaying a backfill must never double-count the same observation.
create unique index if not exists learning_evidence_dedupe_idx
  on public.learning_evidence (learner_id, capability_slug, source, source_ref)
  where source_ref is not null;

-- ── the rollup ───────────────────────────────────────────────────────────────
create table if not exists public.learner_capability_mastery (
  learner_id       uuid not null references auth.users (id) on delete cascade,
  capability_slug  text not null references public.capabilities (slug) on update cascade on delete cascade,

  level            numeric(5, 2) not null default 0 check (level >= 0 and level <= 100),
  -- How much we trust `level`. Low confidence must be SHOWN as low confidence:
  -- one stale data point rendered as a confident number is how a parent stops
  -- believing the whole product.
  confidence       numeric(4, 3) not null default 0 check (confidence >= 0 and confidence <= 1),

  evidence_count   integer not null default 0,
  last_evidence_at timestamptz,
  computed_at      timestamptz not null default now(),

  primary key (learner_id, capability_slug)
);

create index if not exists mastery_learner_idx on public.learner_capability_mastery (learner_id);

-- ── append-only, enforced ────────────────────────────────────────────────────
-- Not a convention — a rule. Nobody edits a learner's history, including admins
-- and including us. Corrections are new observations, the way a ledger works.
create or replace function public.learning_evidence_is_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'learning_evidence is append-only: % is not permitted. Record a new observation instead.', tg_op;
end;
$$;

drop trigger if exists learning_evidence_no_update on public.learning_evidence;
create trigger learning_evidence_no_update
  before update on public.learning_evidence
  for each row execute function public.learning_evidence_is_append_only();

drop trigger if exists learning_evidence_no_delete on public.learning_evidence;
create trigger learning_evidence_no_delete
  before delete on public.learning_evidence
  for each row execute function public.learning_evidence_is_append_only();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- A learner reads their own history and nothing else. All writes go through
-- service-role API routes, which is where role checks and validation live —
-- there are deliberately no insert policies, so the browser client cannot write
-- evidence about anyone, including its own user.
alter table public.learning_evidence          enable row level security;
alter table public.learner_capability_mastery enable row level security;

drop policy if exists learning_evidence_own_read on public.learning_evidence;
create policy learning_evidence_own_read
  on public.learning_evidence for select
  using (auth.uid() = learner_id);

drop policy if exists mastery_own_read on public.learner_capability_mastery;
create policy mastery_own_read
  on public.learner_capability_mastery for select
  using (auth.uid() = learner_id);

-- Parents, teachers and admins read other people's mastery through service-role
-- routes that check the relationship first (parent_course_assignments, cohort
-- membership, role). Encoding those joins as RLS policies would duplicate that
-- logic in two places and let one drift out of step with the other.
