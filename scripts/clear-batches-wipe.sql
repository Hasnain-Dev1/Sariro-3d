-- ============================================================================
-- SARIRO — clear every batch, step 2 of 2: REMOVE BATCHES AND KIDS' COURSES
-- ============================================================================
-- The founder, 17 Sep 2026: "clear all course assignment data so right now
-- there should not be any batch in existence and all students should not have
-- any batch assigned or course, so we have clean data."
--
-- ⚠ THIS DELETES DATA AND CANNOT BE UNDONE.
--   1. Check Supabase → Database → Backups shows a recent backup.
--   2. Run scripts/clear-batches-preview.sql and read the numbers
--      (unexpected_links must be NULL).
--   3. Then run this whole file. It is ONE transaction: if any statement fails,
--      nothing at all is removed.
--
-- REMOVED
--   Batches  every batch (cohort), its schedule, schedule days and pauses, and
--            every batch class — with the attendance, notes, write-ups,
--            monitoring, catch-ups and doubt sessions tied to those classes or
--            batches, and the UNPAID teacher pay rows for them
--   Kids     every enrolment (course assignment), with its lesson progress,
--            class schedules and project submissions
--
-- KEPT — deliberately
--   Accounts (students, teachers, sellers, staff) — nobody is deleted or signed out
--   Trial classes (they are not batches; any link from one to a batch is cleared)
--   Teacher course training / eligibility, so batches can be scheduled again
--   Credit balances and their history, student points and their history
--            (the link to the removed class is cleared, the amounts stay)
--   Teacher pay rows already in a settlement (link cleared, the pay record stays)
--   Purchase requests (Pending enrolments) — approving one creates a course again
--   Invoices, sales, payment links, leads, prices, settings, support tickets
-- ============================================================================

-- ── Why the triggers are switched off, briefly ───────────────────────────────
-- Same as scripts/fresh-start-wipe.sql (15 Sep): some tables here have triggers
-- that refuse deletes or react to changes (points, notifications, history,
-- balances). For a deliberate wipe of test data those must not fire, so the
-- app's own triggers are disabled on ONLY the tables changed below, and enabled
-- again before COMMIT. Foreign-key checks are not affected ("trigger user"
-- leaves them on), so anything left dangling still stops the whole transaction.
-- profiles is left alone: its update below touches a column no guard watches.

begin;

-- ── Refuse to run if something else points at a batch, class or enrolment ──
do $$
declare links text;
begin
  select string_agg(format('%s.%s -> %s', c.conrelid::regclass, a.attname, c.confrelid::regclass), ', ')
    into links
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
   where c.contype = 'f'
     and c.confrelid in ('public.cohorts'::regclass, 'public.cohort_schedules'::regclass, 'public.bookings'::regclass,
                         'public.enrollments'::regclass, 'public.project_submissions'::regclass)
     and not exists (
       select 1 from unnest(array[
         'cohorts', 'cohort_schedules', 'cohort_schedule_days', 'schedule_pauses', 'bookings', 'class_feedback',
         'session_attendance', 'session_notes', 'trial_intakes', 'trial_participants', 'teacher_monitoring',
         'catchup_lessons', 'doubt_sessions', 'teacher_earnings', 'point_transactions', 'credit_transactions',
         'student_leads', 'support_queries', 'credit_requests', 'profiles', 'enrollments', 'lesson_progress',
         'class_schedules', 'project_submissions', 'submission_feedback'
       ]) t where to_regclass('public.' || t) = c.conrelid
     );
  if links is not null then
    raise exception 'Stopped, nothing removed: tables this script does not know about point at batches: %', links;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'class_feedback', 'session_attendance', 'session_notes', 'trial_intakes', 'trial_participants',
    'teacher_monitoring', 'catchup_lessons', 'doubt_sessions', 'teacher_earnings', 'point_transactions',
    'credit_transactions', 'student_leads', 'support_queries', 'credit_requests',
    'bookings', 'schedule_pauses', 'cohort_schedule_days', 'cohort_schedules',
    'submission_feedback', 'project_submissions', 'lesson_progress', 'class_schedules', 'enrollments', 'cohorts'
  ] loop
    execute format('alter table public.%I disable trigger user', t);
  end loop;
end $$;

create temporary table _batch_classes on commit drop as
  select id from public.bookings where coalesce(is_trial, false) = false;

-- ── Everything hanging off a batch class or a batch ─────────────────────────
delete from public.class_feedback      where booking_id in (select id from _batch_classes);
delete from public.session_attendance  where booking_id in (select id from _batch_classes);
delete from public.session_notes       where booking_id in (select id from _batch_classes);
delete from public.trial_intakes       where booking_id in (select id from _batch_classes);
delete from public.trial_participants  where booking_id in (select id from _batch_classes);
delete from public.teacher_monitoring  where booking_id in (select id from _batch_classes) or cohort_id is not null;
delete from public.catchup_lessons     where booking_id in (select id from _batch_classes) or cohort_id is not null;
delete from public.doubt_sessions      where booking_id in (select id from _batch_classes) or cohort_id is not null;
delete from public.teacher_earnings    where booking_id in (select id from _batch_classes) and settlement_id is null;
update public.teacher_earnings    set booking_id = null          where booking_id in (select id from _batch_classes);  -- paid: keep the record
update public.point_transactions  set booking_id = null          where booking_id in (select id from _batch_classes);  -- points stay earned
update public.credit_transactions set related_booking_id = null  where related_booking_id in (select id from _batch_classes);
update public.student_leads       set booking_id = null          where booking_id in (select id from _batch_classes);
update public.support_queries     set cohort_id = null           where cohort_id is not null;
update public.credit_requests     set cohort_id = null, enrollment_id = null where cohort_id is not null or enrollment_id is not null;
update public.profiles            set current_cohort_id = null   where current_cohort_id is not null;
-- A trial never belongs to a batch, but if one was ever linked, unlink it.
update public.bookings            set cohort_id = null, schedule_id = null
 where coalesce(is_trial, false) = true and (cohort_id is not null or schedule_id is not null);

delete from public.bookings where id in (select id from _batch_classes);

-- ── Batch schedules ─────────────────────────────────────────────────────────
delete from public.schedule_pauses;
delete from public.cohort_schedule_days;
delete from public.cohort_schedules;

-- ── Kids' courses ───────────────────────────────────────────────────────────
delete from public.submission_feedback;                              -- only exists for submissions, all of which go
delete from public.project_submissions;                              -- enrollment_id is NOT NULL: every one belongs to an enrolment
delete from public.lesson_progress;                                  -- likewise
delete from public.class_schedules;                                  -- likewise
update public.credit_transactions set related_enrollment_id = null where related_enrollment_id is not null;
delete from public.enrollments;

-- ── The batches themselves ──────────────────────────────────────────────────
delete from public.cohorts;

-- ── Every guard back on before anything is committed ────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'class_feedback', 'session_attendance', 'session_notes', 'trial_intakes', 'trial_participants',
    'teacher_monitoring', 'catchup_lessons', 'doubt_sessions', 'teacher_earnings', 'point_transactions',
    'credit_transactions', 'student_leads', 'support_queries', 'credit_requests',
    'bookings', 'schedule_pauses', 'cohort_schedule_days', 'cohort_schedules',
    'submission_feedback', 'project_submissions', 'lesson_progress', 'class_schedules', 'enrollments', 'cohorts'
  ] loop
    execute format('alter table public.%I enable trigger user', t);
  end loop;
end $$;

commit;

-- One result set, so the editor shows it: every *_left is 0, guards_back_on is
-- true, and the kept numbers match the preview.
select
  coalesce((select bool_and(tg.tgenabled <> 'D') from pg_trigger tg
     where not tg.tgisinternal
       and tg.tgrelid in ('public.bookings'::regclass, 'public.cohorts'::regclass, 'public.enrollments'::regclass,
                          'public.credit_transactions'::regclass, 'public.point_transactions'::regclass,
                          'public.teacher_earnings'::regclass, 'public.session_attendance'::regclass)), true) as guards_back_on,
  (select count(*) from public.cohorts)                                      as batches_left,
  (select count(*) from public.cohort_schedules)                             as batch_schedules_left,
  (select count(*) from public.bookings where coalesce(is_trial, false) = false) as batch_classes_left,
  (select count(*) from public.enrollments)                                  as enrolments_left,
  (select count(*) from public.lesson_progress)                              as lesson_progress_left,
  (select count(*) from public.bookings where is_trial = true)               as trial_classes_kept,
  (select count(*) from public.teacher_course_assignments)                   as teacher_training_kept,
  (select count(*) from public.credits)                                      as credit_balances_kept,
  (select count(*) from public.purchase_intents)                             as purchase_requests_kept,
  (select count(*) from public.profiles)                                     as accounts_kept;
