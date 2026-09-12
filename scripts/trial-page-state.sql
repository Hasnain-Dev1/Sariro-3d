-- ══════════════════════════════════════════════════════════════════════════
-- SARIRO — /my-class in one round trip
-- ══════════════════════════════════════════════════════════════════════════
-- Run this in the Supabase SQL editor. It is safe to run twice.
--
-- ── Why ─────────────────────────────────────────────────────────────────────
-- The trial page needs four things: who they are, whether they have enrolled
-- since, the class itself, and the teacher's name. Asked separately that is
-- three sequential waits on the database — measured at 2.4 SECONDS from the
-- office, because each round trip to Supabase costs 550–1250ms from here.
--
-- The family sees that delay at the exact moment they finish booking, which is
-- the moment they most want to see their countdown.
--
-- Postgres can answer all four in one query. The page calls this function and
-- falls back to the old separate queries if it is missing, so deploying the
-- code before running this is safe — merely slow.
--
-- ── Why security definer, and why nobody but the server may call it ─────────
-- It takes a user id as an argument, so anybody able to call it with somebody
-- else's id would read that person's class and teacher. Execute is therefore
-- revoked from anon and authenticated and granted only to service_role, which
-- is never in a browser. The route has already proved who the caller is.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.trial_page_state(p_user uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'profile', (
      select row_to_json(p)
      from (select full_name, email, timezone from public.profiles where id = p_user) p
    ),
    'enrolled', (
      select count(*) from public.enrollments where user_id = p_user
    ),
    'trial', (
      select row_to_json(t)
      from (
        select
          b.id,
          b.slot_start,
          b.slot_end,
          b.status,
          b.google_meet_url,
          b.trial_subject,
          -- The level THIS child was seated at, not the class's.
          tp.grade            as seat_grade,
          teacher.full_name   as teacher_name,
          teacher.meet_url    as teacher_meet_url
        from public.bookings b
        -- A trial holds four children: the one it was opened for is named on
        -- the booking, the rest are in trial_participants. Both count.
        left join public.trial_participants tp
          on tp.booking_id = b.id and tp.student_id = p_user
        left join public.profiles teacher
          on teacher.id = b.teacher_id
        where b.is_trial is true
          and b.status is distinct from 'cancelled'
          and (
            b.trial_student_id = p_user
            or exists (
              select 1 from public.trial_participants x
              where x.booking_id = b.id and x.student_id = p_user
            )
          )
        order by b.slot_start desc
        limit 1
      ) t
    )
  );
$$;

comment on function public.trial_page_state(uuid) is
  'Everything /my-class needs, in one round trip: profile, enrolment count, the latest live trial with its teacher. Server-only (service_role).';

revoke all on function public.trial_page_state(uuid) from public;
revoke all on function public.trial_page_state(uuid) from anon;
revoke all on function public.trial_page_state(uuid) from authenticated;
grant execute on function public.trial_page_state(uuid) to service_role;

-- PostgREST caches the list of callable functions; this tells it to look again,
-- so the page can use the function the moment this script finishes.
notify pgrst, 'reload schema';

-- ── One SELECT, so the editor shows the result that matters ────────────────
select
  p.proname                                             as function,
  pg_get_function_identity_arguments(p.oid)             as arguments,
  p.prosecdef                                           as security_definer,
  coalesce(
    array_to_string(
      array(
        select r.rolname
        from pg_roles r
        where has_function_privilege(r.rolname, p.oid, 'EXECUTE')
          and r.rolname in ('anon', 'authenticated', 'service_role')
        order by r.rolname
      ),
      ', '
    ),
    '(none)'
  )                                                     as may_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'trial_page_state';
