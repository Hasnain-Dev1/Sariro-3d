-- ============================================================================
-- SARIRO — fresh start, step 1 of 2: WHAT WOULD BE REMOVED (read-only)
-- ============================================================================
-- Changes nothing. Run this first and read the numbers; then run
-- scripts/fresh-start-wipe.sql, which removes exactly these rows.
--
-- Counted on 15 Sep 2026 from the live database: 17 trial classes, 21 trial
-- seats, 19 leads, 53 lead history rows, 14 demo requests, 4 enrolments.
-- If today's numbers are wildly bigger, real families have started using the
-- site — stop and check before wiping anything.
-- ============================================================================

select
  -- Trials
  (select count(*) from public.bookings where is_trial = true)                                    as trial_classes,
  (select count(*) from public.trial_participants)                                                as trial_seats,
  (select count(*) from public.trial_intakes)                                                     as trial_prep_answers,
  (select count(*) from public.class_feedback f
     join public.bookings b on b.id = f.booking_id where b.is_trial = true)                       as trial_write_ups,
  (select count(*) from public.session_attendance a
     join public.bookings b on b.id = a.booking_id where b.is_trial = true)                       as trial_attendance_marks,
  (select count(*) from public.teacher_earnings e
     join public.bookings b on b.id = e.booking_id where b.is_trial = true)                       as teacher_pay_rows_for_trials,
  (select count(*) from public.demo_class_requests)                                               as demo_class_requests,
  -- Leads
  (select count(*) from public.student_leads)                                                     as leads,
  (select count(*) from public.lead_history)                                                      as lead_history,
  (select count(*) from public.lead_notes)                                                        as lead_notes,
  (select count(*) from public.lead_reminders)                                                     as lead_reminders,
  (select count(*) from public.lead_transfers)                                                     as lead_transfers,
  -- Kids' course assignments
  (select count(*) from public.enrollments)                                                       as enrolments,
  (select count(*) from public.project_submissions)                                               as project_submissions,
  (select count(*) from public.lesson_progress)                                                   as lesson_progress_rows,
  (select count(*) from public.class_schedules)                                                   as class_schedule_rows,
  -- Kept, shown so nobody wonders
  (select count(*) from public.invoices)                                                          as invoices_kept,
  (select count(*) from public.sales)                                                             as sales_kept,
  (select count(*) from public.profiles)                                                          as accounts_kept,
  (select count(*) from public.teacher_course_assignments)                                        as teacher_eligibility_kept,
  (select count(*) from public.cohorts)                                                           as batches_kept,
  (select count(*) from public.credits)                                                           as credit_balances_kept;
