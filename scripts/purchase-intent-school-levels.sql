-- =============================================================================
-- SARIRO — let purchase_intents record a school order
-- =============================================================================
-- Checkout returned a 500 on every school subject and focus course:
--
--   23514  new row for relation "purchase_intents"
--          violates check constraint "chk_pi_level"
--
-- `purchase_intents.level` predates the school products and is constrained to
-- the four CODING levels. The school branch of `create-order` writes
-- `grade-7`, `group-11` or `focus`, and the database refused every one.
--
-- Nobody found out until today because neither path had ever run in production:
-- the enrol flow was built but never deployed, and coding checkout used to open
-- a static Razorpay link without touching this table at all.
--
-- ── Why widen the constraint rather than add columns ─────────────────────────
-- Adding `subject` / `grade` / `scope` columns would model this better, and is
-- the right move if school orders ever need to be queried by grade. Today they
-- do not: `track` already holds the subject slug and `level` holds the scope in
-- a form an admin can read in the dashboard. Widening is one line and reversible;
-- new columns are a schema commitment made under time pressure at the point of
-- sale. Take the small change now, model it properly when there is a reason to.
--
-- ── Why this is safe to run ──────────────────────────────────────────────────
-- Postgres VALIDATES a new CHECK against every existing row. If any current row
-- would fail the new rule, the statement errors and NOTHING changes — no partial
-- state, no lost data. So the worst case is an error message, not a broken table.
--
-- See the old definition before you run this, if you want it for the record:
--
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.purchase_intents'::regclass;
--
-- Idempotent. Safe to re-run.
--   Supabase → SQL Editor → paste → Run
-- =============================================================================

alter table public.purchase_intents
  drop constraint if exists chk_pi_level;

alter table public.purchase_intents
  add constraint chk_pi_level check (
    -- Coding tracks, as before. Case-insensitive because `normalizeLevel`
    -- title-cases them but older rows may not be.
    lower(level) in ('elementary', 'beginner', 'intermediate', 'advanced')

    -- A focus course: 48 classes on one topic, not tied to a grade.
    or level = 'focus'

    -- One school year, or a whole three-year group. The grade is required and
    -- must be real — `grade-` with nothing after it means the checkout lost the
    -- grade somewhere, and that should fail loudly rather than record a sale
    -- against a product nobody can identify.
    or level ~ '^(grade|group)-(1[0-2]|[1-9])$'
  );

comment on constraint chk_pi_level on public.purchase_intents is
  'Coding levels, focus, or grade-N / group-N for N in 1..12. Widened 30 Aug 2026 — the original allowed only coding levels, so every school checkout returned a 500.';
