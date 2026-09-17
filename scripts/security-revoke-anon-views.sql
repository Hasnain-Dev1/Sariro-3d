-- ============================================================================
-- SARIRO — close three views that anybody could read (17 Sep 2026)
-- ============================================================================
-- Views run as their owner, so row security does not apply to them: whoever
-- holds a grant reads every row. Supabase grants the signed-out role (anon)
-- access to new objects by default, and these three kept it.
--
--   teacher_leaderboard              every teacher's id, name, photo and class
--                                    counts — readable by anybody with the
--                                    public site key, signed in or not. Signed-in
--                                    dashboards (student and teacher leaderboards)
--                                    still read it; only the signed-out grant goes.
--   purchase_intent_mismatches       who bought what at which price. Not read by
--   teacher_cancellations_this_month the app at all (only the service role, which
--                                    keeps its access) — closed to anon AND to
--                                    signed-in users, so a student cannot read
--                                    other families' purchases.
--
-- Safe to run more than once. One transaction.
-- ============================================================================

begin;

revoke all on public.teacher_leaderboard              from anon;
revoke all on public.purchase_intent_mismatches       from anon, authenticated;
revoke all on public.teacher_cancellations_this_month from anon, authenticated;

commit;

-- Every column should read false except leaderboard_signed_in (true).
select
  has_table_privilege('anon', 'public.teacher_leaderboard', 'SELECT')                       as leaderboard_signed_out,
  has_table_privilege('authenticated', 'public.teacher_leaderboard', 'SELECT')              as leaderboard_signed_in,
  has_table_privilege('anon', 'public.purchase_intent_mismatches', 'SELECT')                as purchases_signed_out,
  has_table_privilege('authenticated', 'public.purchase_intent_mismatches', 'SELECT')       as purchases_signed_in,
  has_table_privilege('anon', 'public.teacher_cancellations_this_month', 'SELECT')          as cancellations_signed_out,
  has_table_privilege('authenticated', 'public.teacher_cancellations_this_month', 'SELECT') as cancellations_signed_in;
