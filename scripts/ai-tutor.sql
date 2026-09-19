-- ============================================================================
-- SARIRO — the Code Lab's AI tutor: a daily limit per learner (19 Sep 2026)
-- ============================================================================
-- Every question to the AI tutor costs money, so each learner gets a number of
-- questions a day (TUTOR_DAILY_LIMIT on the server, 20 if unset). This table
-- counts them, one row per learner per day.
--
--   ai_tutor_usage   (user_id, day, calls)
--   ai_tutor_take(user, limit)   counts one question and returns the new
--                                total — or NULL when the learner is already
--                                at the limit. Atomic: two questions sent at
--                                the same moment can never both squeeze past.
--
-- Only the server touches this: row security is on with NO policies, and the
-- function is callable by the service role alone. A learner cannot read,
-- reset or raise their own count.
--
-- Until this runs, the AI tutor stays OFF (it fails closed, so there is never
-- an unmetered bill) and the lab's built-in guide answers instead.
-- Safe to run more than once. One transaction.
-- ============================================================================

begin;

create table if not exists public.ai_tutor_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Kolkata')::date,
  calls integer not null default 0 check (calls >= 0),
  primary key (user_id, day)
);

alter table public.ai_tutor_usage enable row level security;
revoke all on public.ai_tutor_usage from public, anon, authenticated;

create or replace function public.ai_tutor_take(p_user uuid, p_limit integer)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.ai_tutor_usage as u (user_id, day, calls)
  values (p_user, (now() at time zone 'Asia/Kolkata')::date, 1)
  on conflict (user_id, day) do update set calls = u.calls + 1
  where u.calls < p_limit
  returning calls;
$$;

revoke all on function public.ai_tutor_take(uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_tutor_take(uuid, integer) to service_role;

commit;

-- ── Check (one result set) ──────────────────────────────────────────────────
select
  to_regclass('public.ai_tutor_usage') is not null                                   as has_table,
  (select relrowsecurity from pg_class where oid = 'public.ai_tutor_usage'::regclass) as rls_on,
  has_function_privilege('authenticated', 'public.ai_tutor_take(uuid, integer)', 'execute') as learners_can_call,
  has_function_privilege('service_role', 'public.ai_tutor_take(uuid, integer)', 'execute')  as server_can_call;
-- Expected: true, true, false, true
