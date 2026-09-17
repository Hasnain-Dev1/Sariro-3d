-- ============================================================================
-- SARIRO — database security audit (READ-ONLY)
-- ============================================================================
-- Changes nothing. One result set, so the Supabase editor shows all of it.
-- Paste the row back into docs/security (or to Claude) as evidence.
--
-- What each column means, and what "good" looks like:
--   tables_without_rls              every table here can be read/written by any
--                                   role that has a grant — should be empty
--   anon_writable_tables_no_rls     a signed-out visitor can change these — must
--                                   be empty
--   views_anon_can_read             views skip RLS (they run as their owner);
--                                   only genuinely public data belongs here
--   views_signed_in_can_read        same, for any signed-in user (students too)
--   policies_true_for_everyone      "using (true)" for anon/PUBLIC — public data only
--   policies_true_for_signed_in     "using (true)" for authenticated: every
--                                   student can see every row of these
--   definer_functions_anon_can_call SECURITY DEFINER functions a visitor can run
--                                   — each needs its own checks inside
-- Found by the 17 Sep 2026 pass without this script: anon could read
-- teacher_leaderboard (see scripts/security-revoke-anon-views.sql).
-- ============================================================================

select
  (select string_agg(c.relname, ', ' order by c.relname)
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity)            as tables_without_rls,

  (select string_agg(c.relname, ', ' order by c.relname)
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
      and has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE'))                          as anon_writable_tables_no_rls,

  (select string_agg(c.relname, ', ' order by c.relname)
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v', 'm')
      and has_table_privilege('anon', c.oid, 'SELECT'))                                        as views_anon_can_read,

  (select string_agg(c.relname, ', ' order by c.relname)
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v', 'm')
      and has_table_privilege('authenticated', c.oid, 'SELECT'))                               as views_signed_in_can_read,

  (select string_agg(format('%s.%s [%s]', c.relname, p.polname, p.polcmd), ', ' order by c.relname)
     from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and pg_get_expr(p.polqual, p.polrelid) = 'true'
      and (0::oid = any (p.polroles) or 'anon'::regrole::oid = any (p.polroles)))              as policies_true_for_everyone,

  (select string_agg(format('%s.%s [%s]', c.relname, p.polname, p.polcmd), ', ' order by c.relname)
     from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and pg_get_expr(p.polqual, p.polrelid) = 'true'
      and 'authenticated'::regrole::oid = any (p.polroles))                                    as policies_true_for_signed_in,

  (select string_agg(p.proname, ', ' order by p.proname)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE'))                                    as definer_functions_anon_can_call;
