-- ============================================================================
-- SARIRO — fresh start, step 2 of 2: REMOVE TEST TRIALS, LEADS AND ENROLMENTS
-- ============================================================================
-- The founder, 15 Sep 2026: "remove all course assigned and clear the course
-- assignment data entirely from all kids so we can have fresh data, and remove
-- all data from the trial in database so we can get fresh leads — all testing
-- leads and assignments can be entirely removed for now."
--
-- ⚠ THIS DELETES DATA AND CANNOT BE UNDONE.
--   1. Check Supabase → Database → Backups shows a recent backup.
--   2. Run scripts/fresh-start-preview.sql and read the numbers.
--   3. Then run this whole file. It is ONE transaction: if any statement fails,
--      nothing at all is removed.
--
-- REMOVED
--   Trials   every trial class, its seats, prep answers, write-ups, attendance,
--            notes, points, monitoring, catch-ups and doubt sessions, the teacher
--            pay rows created for those trials, and every demo-class request
--   Leads    every lead with its history, notes, reminders and transfers
--   Kids     every enrolment (course assignment), with the lesson progress,
--            class schedules and project submissions that belong to it
--
-- KEPT — deliberately
--   Accounts (students, teachers, sellers, staff) — nobody is deleted or signed out
--   Invoices and the sales ledger — invoice numbers must stay one unbroken series;
--            a sale that pointed at a lead simply no longer does
--   Teacher course eligibility (which courses each teacher may teach)
--   Batches (cohorts) and their regular classes, credit balances, prices, settings
--   If batches or credit balances should go too, that is a separate script — ask.
-- ============================================================================

-- ── Why the triggers are switched off, briefly ───────────────────────────────
-- The first run (15 Sep) stopped at lead_notes: its trigger refuses every
-- DELETE, on purpose — a seller's note is the record of what was believed at
-- the time. Other tables here have triggers that react to changes (points on
-- attendance, notifications, history rows). For a deliberate wipe of test data
-- those must not fire, so the app's own triggers are disabled on ONLY the tables
-- emptied below, and enabled again before COMMIT. Foreign-key checks are not
-- affected ("trigger user" leaves them on), so anything left dangling still
-- stops the whole transaction. If anything fails, the triggers come back on with
-- the rollback, exactly as they were.

begin;

do $$
declare t text;
begin
  foreach t in array array[
    'trial_intakes', 'trial_participants', 'class_feedback', 'session_attendance', 'session_notes',
    'point_transactions', 'teacher_monitoring', 'catchup_lessons', 'doubt_sessions', 'teacher_earnings',
    'lead_reminders', 'lead_notes', 'lead_history', 'lead_transfers', 'student_leads', 'demo_class_requests',
    'bookings', 'submission_feedback', 'project_submissions', 'lesson_progress', 'class_schedules', 'enrollments'
  ] loop
    execute format('alter table public.%I disable trigger user', t);
  end loop;
end $$;

create temporary table _trial_bookings on commit drop as
  select id from public.bookings where is_trial = true;

-- ── Trials: everything hanging off a trial class, then the classes ──────────
delete from public.trial_intakes       where booking_id in (select id from _trial_bookings);
delete from public.trial_participants  where booking_id in (select id from _trial_bookings);
delete from public.class_feedback      where booking_id in (select id from _trial_bookings);
delete from public.session_attendance  where booking_id in (select id from _trial_bookings);
delete from public.session_notes       where booking_id in (select id from _trial_bookings);
delete from public.point_transactions  where booking_id in (select id from _trial_bookings);
delete from public.teacher_monitoring  where booking_id in (select id from _trial_bookings);
delete from public.catchup_lessons     where booking_id in (select id from _trial_bookings);
delete from public.doubt_sessions      where booking_id in (select id from _trial_bookings);
delete from public.teacher_earnings    where booking_id in (select id from _trial_bookings);
update public.credit_transactions set related_booking_id = null where related_booking_id in (select id from _trial_bookings);
update public.project_submissions set booking_id = null         where booking_id in (select id from _trial_bookings);

-- ── Leads ───────────────────────────────────────────────────────────────────
update public.sales set lead_id = null where lead_id is not null;   -- the sale and its invoice stay
delete from public.lead_reminders;
delete from public.lead_notes;
delete from public.lead_history;
delete from public.lead_transfers;
delete from public.student_leads;
delete from public.demo_class_requests;

delete from public.bookings where id in (select id from _trial_bookings);

-- ── Kids' course assignments ────────────────────────────────────────────────
delete from public.submission_feedback;                              -- only exists for submissions, all of which go
delete from public.project_submissions;                              -- enrollment_id is NOT NULL: every one belongs to an enrolment
delete from public.lesson_progress;                                  -- likewise
delete from public.class_schedules;                                  -- likewise
update public.credit_requests     set enrollment_id = null         where enrollment_id is not null;
update public.credit_transactions set related_enrollment_id = null where related_enrollment_id is not null;
update public.profiles            set current_cohort_id = null     where current_cohort_id is not null;
delete from public.enrollments;

-- ── Every guard back on before anything is committed ────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'trial_intakes', 'trial_participants', 'class_feedback', 'session_attendance', 'session_notes',
    'point_transactions', 'teacher_monitoring', 'catchup_lessons', 'doubt_sessions', 'teacher_earnings',
    'lead_reminders', 'lead_notes', 'lead_history', 'lead_transfers', 'student_leads', 'demo_class_requests',
    'bookings', 'submission_feedback', 'project_submissions', 'lesson_progress', 'class_schedules', 'enrollments'
  ] loop
    execute format('alter table public.%I enable trigger user', t);
  end loop;
end $$;

commit;

-- One result set, so the editor shows it: every number should be 0 except the
-- kept ones, and lead_notes_guard_on must say true.
select
  (select bool_and(tgenabled <> 'D') from pg_trigger
     where tgrelid = 'public.lead_notes'::regclass and not tgisinternal) as lead_notes_guard_on,
  (select count(*) from public.bookings where is_trial = true) as trial_classes_left,
  (select count(*) from public.trial_participants)             as trial_seats_left,
  (select count(*) from public.student_leads)                  as leads_left,
  (select count(*) from public.demo_class_requests)            as demo_requests_left,
  (select count(*) from public.enrollments)                    as enrolments_left,
  (select count(*) from public.invoices)                       as invoices_kept,
  (select count(*) from public.profiles)                       as accounts_kept,
  (select count(*) from public.teacher_course_assignments)     as teacher_eligibility_kept;
