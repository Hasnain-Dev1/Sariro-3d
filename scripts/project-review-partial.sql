-- SARIRO — Project review: three-way outcome (complete / partial / invalid)
-- =========================================================================
-- Review used to be binary (approved | resubmit). This adds a third outcome,
-- 'partial', worth HALF the project points, and rescores the leaderboard so:
--   complete (approved) → full points, capstone marked done
--   partial             → half points, capstone NOT done
--   invalid (resubmit)  → zero points, must resubmit
--
-- Safe to run more than once.

-- ── 1. Allow the new 'partial' status ─────────────────────────────────────
ALTER TABLE public.project_submissions
  DROP CONSTRAINT IF EXISTS project_submissions_status_check;
ALTER TABLE public.project_submissions
  ADD CONSTRAINT project_submissions_status_check
  CHECK (status IN ('submitted', 'approved', 'partial', 'resubmit'));

-- ── 2. Rescore the student leaderboard so 'partial' earns half ────────────
-- Full = 15 (approved). Half = 8 (partial, or approved-with-flagged-feedback,
-- which already scored 8). Zero = anything else (submitted/resubmit).
CREATE OR REPLACE VIEW student_leaderboard AS
WITH
  project_pts AS (
    SELECT
      s.user_id,
      s.enrollment_id,
      s.cohort_id_via_booking AS cohort_id,
      MAX(s.speed_points) AS speed_points,
      SUM(
        CASE
          WHEN s.status = 'approved' THEN
            CASE
              WHEN EXISTS (
                SELECT 1 FROM submission_feedback f
                WHERE f.submission_id = s.id AND f.approved = false
              ) THEN 8
              ELSE 15
            END
          WHEN s.status = 'partial' THEN 8
          ELSE 0
        END
      ) AS approval_points,
      COUNT(DISTINCT s.id) AS projects_submitted
    FROM (
      SELECT
        ps.*,
        b.cohort_id AS cohort_id_via_booking
      FROM project_submissions ps
      LEFT JOIN bookings b ON b.id = ps.booking_id
    ) s
    WHERE s.submitted_at >= now() - INTERVAL '90 days'
    GROUP BY s.user_id, s.enrollment_id, s.cohort_id_via_booking
  ),
  attendance_pts AS (
    SELECT
      sa.student_id AS user_id,
      SUM(
        CASE
          WHEN sa.status = 'present' THEN 10
          WHEN sa.status = 'late' THEN -3
          ELSE 0
        END
      ) AS attendance_points,
      COUNT(DISTINCT sa.id) AS classes_attended
    FROM session_attendance sa
    WHERE sa.marked_at >= now() - INTERVAL '90 days'
       OR sa.marked_at IS NULL
    GROUP BY sa.student_id
  )
SELECT
  p.id AS user_id,
  p.full_name,
  p.avatar_url,
  e.id AS enrollment_id,
  COALESCE(e.cohort_id, pp.cohort_id) AS cohort_id,
  e.track,
  e.level,
  COALESCE(pp.speed_points, 0) AS speed_points,
  COALESCE(pp.approval_points, 0) AS approval_points,
  COALESCE(ap.attendance_points, 0) AS attendance_points,
  (COALESCE(pp.speed_points, 0)
   + COALESCE(pp.approval_points, 0)
   + COALESCE(ap.attendance_points, 0)) AS total_points,
  COALESCE(pp.projects_submitted, 0) AS projects_submitted,
  COALESCE(ap.classes_attended, 0) AS classes_attended
FROM profiles p
JOIN enrollments e ON e.user_id = p.id AND e.status = 'active'
LEFT JOIN project_pts pp ON pp.user_id = p.id AND pp.enrollment_id = e.id
LEFT JOIN attendance_pts ap ON ap.user_id = p.id
WHERE (p.role = 'student' OR p.is_student = true)
ORDER BY total_points DESC;

GRANT SELECT ON student_leaderboard TO authenticated;
