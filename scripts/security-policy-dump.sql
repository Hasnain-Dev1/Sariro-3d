-- ============================================================================
-- SARIRO — every read/write rule on the tables that hold people and classes
-- (READ-ONLY)
-- ============================================================================
-- Changes nothing. One result set: one row per policy, then one row per helper
-- function those policies call. Export it for review. These policies were
-- created in Supabase directly, so the scripts folder does not show them.
-- ============================================================================

select * from (
  select
    'policy'::text                                                     as kind,
    c.relname                                                          as table_or_function,
    p.polname                                                          as name,
    case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT' when 'w' then 'UPDATE'
                  when 'd' then 'DELETE' else 'ALL' end                as command,
    case when p.polpermissive then 'permissive' else 'RESTRICTIVE' end as mode,
    (select string_agg(case when r = 0 then 'public' else r::regrole::text end, ', ')
       from unnest(p.polroles) r)                                      as roles,
    pg_get_expr(p.polqual, p.polrelid)                                 as using_expr,
    pg_get_expr(p.polwithcheck, p.polrelid)                            as with_check_expr
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('profiles', 'bookings', 'cohorts', 'enrollments', 'trial_participants',
                      'cohort_schedules', 'session_attendance', 'credits', 'credit_transactions')

  union all

  select
    'function', p.proname, pg_get_function_identity_arguments(p.oid),
    case when p.prosecdef then 'SECURITY DEFINER' else 'invoker' end, null, null,
    pg_get_functiondef(p.oid), null
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('current_user_role', 'teaches_booking', 'is_teacher_of_cohort', 'is_student_in_cohort',
                      'user_cohort_ids', 'is_trial_participant', 'is_seller_profile', 'is_staff', 'sariro_is_admin')
) dump
order by kind desc, table_or_function, command, name;
