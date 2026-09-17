-- ============================================================================
-- SARIRO — clear every batch, step 1 of 2: WHAT WOULD BE REMOVED (read-only)
-- ============================================================================
-- Changes nothing. Run this first and read the numbers; then run
-- scripts/clear-batches-wipe.sql, which removes exactly these rows.
--
-- Counted on 17 Sep 2026 from the live database: 6 batches, 4 batch schedules,
-- 73 batch classes, 3 enrolments, 2 attendance marks, 1 doubt session tied to a
-- batch, 1 unpaid teacher pay row. If today's numbers are much bigger, real
-- families have started classes — stop and check before wiping anything.
--
-- unexpected_links must be NULL. Anything listed there is a table pointing at a
-- batch, class or enrolment that the wipe does not know about; the wipe refuses
-- to run while it is not NULL.
-- ============================================================================

select
  -- Batches
  (select count(*) from public.cohorts)                                                  as batches,
  (select count(*) from public.cohort_schedules)                                         as batch_schedules,
  (select count(*) from public.cohort_schedule_days)                                     as schedule_day_rows,
  (select count(*) from public.schedule_pauses)                                          as schedule_pauses,
  (select count(*) from public.bookings where coalesce(is_trial, false) = false)         as batch_classes,
  (select count(*) from public.bookings where coalesce(is_trial, false) = false
     and status = 'completed')                                                           as batch_classes_already_taught,
  (select count(*) from public.session_attendance a
     join public.bookings b on b.id = a.booking_id where coalesce(b.is_trial, false) = false) as attendance_marks,
  (select count(*) from public.teacher_earnings e
     join public.bookings b on b.id = e.booking_id
    where coalesce(b.is_trial, false) = false and e.settlement_id is null)               as unpaid_teacher_pay_rows,
  (select count(*) from public.teacher_earnings e
     join public.bookings b on b.id = e.booking_id
    where coalesce(b.is_trial, false) = false and e.settlement_id is not null)           as paid_teacher_pay_rows_kept,
  (select count(*) from public.doubt_sessions where cohort_id is not null
      or booking_id in (select id from public.bookings where coalesce(is_trial, false) = false)) as batch_doubt_sessions,
  (select count(*) from public.catchup_lessons where cohort_id is not null
      or booking_id in (select id from public.bookings where coalesce(is_trial, false) = false)) as batch_catchups,
  -- Kids' courses
  (select count(*) from public.enrollments)                                              as enrolments,
  (select count(*) from public.lesson_progress)                                          as lesson_progress_rows,
  (select count(*) from public.class_schedules)                                          as class_schedule_rows,
  (select count(*) from public.project_submissions)                                      as project_submissions,
  -- Kept, shown so nobody wonders
  (select count(*) from public.bookings where is_trial = true)                           as trial_classes_kept,
  (select count(*) from public.teacher_course_assignments)                               as teacher_training_kept,
  (select count(*) from public.credits)                                                  as credit_balances_kept,
  (select count(*) from public.purchase_intents)                                         as purchase_requests_kept,
  (select count(*) from public.invoices)                                                 as invoices_kept,
  (select count(*) from public.profiles)                                                 as accounts_kept,
  -- Safety: every foreign key into these tables that the wipe does not handle
  (select string_agg(format('%s.%s -> %s', c.conrelid::regclass, a.attname, c.confrelid::regclass), ', ')
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
      ))                                                                                 as unexpected_links;
