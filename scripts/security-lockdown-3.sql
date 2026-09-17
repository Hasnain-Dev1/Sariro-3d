-- ============================================================================
-- SARIRO — lock-down #3: the remaining write rules (17 Sep 2026)
-- ============================================================================
-- From the "write policy" rows security-lockdown-2.sql returned. Each rule
-- below lets a signed-in user (anybody — sign-up is open), or a visitor, write
-- something only our server should write. For every one, the app's own writes
-- were checked in the code: they all go through API routes with the service
-- role, which row security does not apply to — so removing the browser's
-- permission changes nothing the site does. One transaction; changes no data.
--
-- MONEY
--   teacher_earnings.teachers_insert_own_earnings      a teacher could add pay rows for themselves
--   teacher_settlements.teachers_insert_own_settlements a teacher could add settlement (payout) rows
--   teacher_incentives.teachers_insert_own_incentives  a teacher could add bonuses, bypassing
--                                                      /api/teacher/earnings' amount checks
--   teacher_leaves.teachers_insert_own_leaves          a teacher could add a leave already
--                                                      "approved" / free of penalty (nothing
--                                                      in the app inserts leaves at all)
--   purchase_intents.pi_insert_own                     kept (checkout's fallback uses it) but
--                                                      only as a PENDING request for yourself
--   project_submissions (student's own row)            a student could mark their own project
--                                                      approved and award themselves points —
--                                                      /api/student/submission writes through the
--                                                      student's session, so a guard trigger holds
--                                                      exactly what that route writes
-- RECORDS
--   admin_audit_logs.audit_authenticated_insert        anybody could write fake audit entries,
--                                                      in any admin's name
-- PRIVATE CHAT (child safety)
--   conversation_members.conv_members_add              any teacher could add themselves to
--                                                      ANY conversation and read it
--   conversation_members.conv_members_mark_read        a member could move their membership row
--                                                      to another conversation (UPDATE with no
--                                                      check) — same result
--   (/api/messaging does both with the service role)
-- SPAM / UNUSED
--   demo_class_requests.public_insert_demo_requests    visitors could write leads straight into the
--                                                      database, skipping the form's rate limit and
--                                                      bot trap (/api/demo-class/request uses the
--                                                      service role)
--   unanswered_questions.unanswered_insert_own         }
--   chat_conversations.conv_insert_own / conv_update_own } an old chatbot's tables; nothing in the
--   chat_messages.msg_insert_own                        } app reads or writes them any more
--
-- Rollback lines are at the bottom, commented out.
-- ============================================================================

begin;

-- ── Money ───────────────────────────────────────────────────────────────────
drop policy if exists teachers_insert_own_earnings    on public.teacher_earnings;
drop policy if exists teachers_insert_own_settlements on public.teacher_settlements;
drop policy if exists teachers_insert_own_incentives  on public.teacher_incentives;
drop policy if exists teachers_insert_own_leaves      on public.teacher_leaves;

drop policy if exists pi_insert_own on public.purchase_intents;
drop policy if exists pi_insert_own_pending on public.purchase_intents;
create policy pi_insert_own_pending on public.purchase_intents
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and confirmed_at is null);

create or replace function public.guard_submission_self_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Only a student writing their own row from a browser/session. Teachers'
  -- reviews and our API's service role are not this.
  if current_user not in ('authenticated', 'anon') or new.user_id is distinct from auth.uid() then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'approved' then
    raise exception 'An approved project cannot be changed.' using errcode = '42501';
  end if;
  -- Exactly what /api/student/submission writes: submitted, not reviewed,
  -- speed points from calculateSpeedPoints (5, 10, 18 or 25).
  if new.status is distinct from 'submitted'
     or new.reviewed_at is not null or new.reviewed_by is not null
     or coalesce(new.speed_points, 0) not in (0, 5, 10, 18, 25) then
    raise exception 'Only a teacher can review a project.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists __guard_submission_self_write on public.project_submissions;
create trigger __guard_submission_self_write
  before insert or update on public.project_submissions
  for each row execute function public.guard_submission_self_write();

-- ── Records ─────────────────────────────────────────────────────────────────
drop policy if exists audit_authenticated_insert on public.admin_audit_logs;

-- ── Private chat ────────────────────────────────────────────────────────────
drop policy if exists conv_members_add       on public.conversation_members;
drop policy if exists conv_members_mark_read on public.conversation_members;

-- ── Spam / unused ───────────────────────────────────────────────────────────
drop policy if exists public_insert_demo_requests on public.demo_class_requests;
drop policy if exists unanswered_insert_own       on public.unanswered_questions;
drop policy if exists conv_insert_own             on public.chat_conversations;
drop policy if exists conv_update_own             on public.chat_conversations;
drop policy if exists msg_insert_own              on public.chat_messages;

commit;

-- One result set: every row should say false, except the two "installed" rows.
select * from (values
  ('teacher earnings insert (own)',        exists (select 1 from pg_policy where polname = 'teachers_insert_own_earnings')),
  ('teacher settlements insert (own)',     exists (select 1 from pg_policy where polname = 'teachers_insert_own_settlements')),
  ('teacher incentives insert (own)',      exists (select 1 from pg_policy where polname = 'teachers_insert_own_incentives')),
  ('teacher leaves insert (own)',          exists (select 1 from pg_policy where polname = 'teachers_insert_own_leaves')),
  ('purchase intent, any status (old)',    exists (select 1 from pg_policy where polname = 'pi_insert_own')),
  ('purchase intent pending-only INSTALLED', exists (select 1 from pg_policy where polname = 'pi_insert_own_pending')),
  ('submission guard INSTALLED',           exists (select 1 from pg_trigger where tgname = '__guard_submission_self_write')),
  ('audit log insert by anybody',          exists (select 1 from pg_policy where polname = 'audit_authenticated_insert')),
  ('chat: add any member',                 exists (select 1 from pg_policy where polname = 'conv_members_add')),
  ('chat: move membership row',            exists (select 1 from pg_policy where polname = 'conv_members_mark_read')),
  ('demo requests insert by visitors',     exists (select 1 from pg_policy where polname = 'public_insert_demo_requests')),
  ('unanswered questions insert',          exists (select 1 from pg_policy where polname = 'unanswered_insert_own')),
  ('old chatbot conversation writes',      exists (select 1 from pg_policy where polname in ('conv_insert_own', 'conv_update_own', 'msg_insert_own')))
) as t(rule, still_there);

-- ── Rollback (only if a screen breaks) ───────────────────────────────────────
-- drop trigger if exists __guard_submission_self_write on public.project_submissions;
-- create policy pi_insert_own on public.purchase_intents for insert to authenticated with check (user_id = auth.uid());
-- create policy conv_members_mark_read on public.conversation_members for update using (user_id = auth.uid());
-- create policy public_insert_demo_requests on public.demo_class_requests for insert with check (true);
