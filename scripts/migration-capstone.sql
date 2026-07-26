-- ════════════════════════════════════════════════════════════════════════════
-- SARIRO — Capstone + Submissions + Leaderboards — All-in-one migration
-- ════════════════════════════════════════════════════════════════════════════
-- Idempotent. No transaction wrapper (so partial failures don't roll back).
-- Already deployed to production Supabase (8 policies confirmed live).
--
-- IMPORTANT — schema discovery from production:
--   session_attendance uses: student_id (NOT user_id), marked_at (NOT recorded_at),
--                             marked_by (NOT recorded_by)
--   This view uses the correct column names.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Additive columns on existing tables ───────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS module_num INT,
  ADD COLUMN IF NOT EXISTS lesson_name TEXT;

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS capstone_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS capstone_evidence_url TEXT;

-- ─── 2. project_submissions table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id         UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  booking_id            UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_num            INT  NOT NULL,
  lesson_name           TEXT NOT NULL,
  capstone_step_title   TEXT NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  project_url           TEXT NOT NULL,
  demo_url              TEXT,
  reflection_tricky     TEXT,
  reflection_proud      TEXT,
  status                TEXT NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('submitted', 'approved', 'resubmit')),
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  speed_points          INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_submissions_per_lesson
  ON project_submissions(enrollment_id, module_num);
CREATE INDEX IF NOT EXISTS idx_submissions_user
  ON project_submissions(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_enrollment
  ON project_submissions(enrollment_id, module_num);
CREATE INDEX IF NOT EXISTS idx_submissions_status
  ON project_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_booking
  ON project_submissions(booking_id);

-- ─── 3. submission_feedback table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submission_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL UNIQUE REFERENCES project_submissions(id) ON DELETE CASCADE,
  teacher_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating          INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content         TEXT NOT NULL,
  approved        BOOLEAN NOT NULL DEFAULT true,
  review_points   INT NOT NULL DEFAULT 0,
  ontime_bonus    INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_teacher
  ON submission_feedback(teacher_id, created_at DESC);

-- ─── 4. updated_at trigger function + triggers ────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'touch_updated_at'
  ) THEN
    CREATE FUNCTION public.touch_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON project_submissions;
CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_feedback_updated_at ON submission_feedback;
CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON submission_feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─── 5. Enable RLS ────────────────────────────────────────────────────────
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_feedback ENABLE ROW LEVEL SECURITY;

-- ─── 6. RLS policies on project_submissions ───────────────────────────────
DROP POLICY IF EXISTS "students_select_own_submissions" ON project_submissions;
CREATE POLICY "students_select_own_submissions"
  ON project_submissions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "students_insert_own_submissions" ON project_submissions;
CREATE POLICY "students_insert_own_submissions"
  ON project_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "students_update_own_submissions" ON project_submissions;
CREATE POLICY "students_update_own_submissions"
  ON project_submissions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "teachers_read_cohort_submissions" ON project_submissions;
CREATE POLICY "teachers_read_cohort_submissions"
  ON project_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = project_submissions.booking_id
        AND b.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admins_all_submissions" ON project_submissions;
CREATE POLICY "admins_all_submissions"
  ON project_submissions FOR ALL
  USING (public.current_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.current_user_role() IN ('admin', 'super_admin'));

-- ─── 7. RLS policies on submission_feedback ───────────────────────────────
DROP POLICY IF EXISTS "students_read_own_feedback" ON submission_feedback;
CREATE POLICY "students_read_own_feedback"
  ON submission_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_submissions s
      WHERE s.id = submission_feedback.submission_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teachers_crud_own_feedback" ON submission_feedback;
CREATE POLICY "teachers_crud_own_feedback"
  ON submission_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM project_submissions s
      JOIN bookings b ON b.id = s.booking_id
      WHERE s.id = submission_feedback.submission_id
        AND b.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM project_submissions s
      JOIN bookings b ON b.id = s.booking_id
      WHERE s.id = submission_feedback.submission_id
        AND b.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admins_all_feedback" ON submission_feedback;
CREATE POLICY "admins_all_feedback"
  ON submission_feedback FOR ALL
  USING (public.current_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.current_user_role() IN ('admin', 'super_admin'));

-- ─── 8. student_leaderboard view (uses student_id + marked_at) ────────────
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

-- ─── 9. teacher_leaderboard view ──────────────────────────────────────────
CREATE OR REPLACE VIEW teacher_leaderboard AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.avatar_url,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) * 5 AS classes_points,
  COUNT(DISTINCT s.id) * 3 AS review_points,
  COUNT(DISTINCT CASE
    WHEN s.reviewed_at IS NOT NULL
    AND s.reviewed_at <= s.submitted_at + INTERVAL '48 hours'
    THEN s.id
  END) * 2 AS ontime_bonus,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) AS classes_taught,
  COUNT(DISTINCT s.id) AS projects_reviewed,
  CASE
    WHEN COUNT(DISTINCT s.id) = 0 THEN 0
    ELSE ROUND(
      100.0 * COUNT(DISTINCT CASE
        WHEN s.reviewed_at IS NOT NULL
        AND s.reviewed_at <= s.submitted_at + INTERVAL '48 hours'
        THEN s.id
      END) / COUNT(DISTINCT s.id)
    )
  END AS ontime_review_rate,
  (COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) * 5
   + COUNT(DISTINCT s.id) * 3
   + COUNT(DISTINCT CASE
       WHEN s.reviewed_at IS NOT NULL
       AND s.reviewed_at <= s.submitted_at + INTERVAL '48 hours'
       THEN s.id
     END) * 2) AS total_points
FROM profiles p
LEFT JOIN bookings b ON b.teacher_id = p.id
  AND b.slot_start >= now() - INTERVAL '90 days'
LEFT JOIN project_submissions s ON s.booking_id = b.id
  AND s.reviewed_at IS NOT NULL
WHERE (p.role = 'teacher' OR p.is_teacher = true)
GROUP BY p.id, p.full_name, p.avatar_url
ORDER BY total_points DESC;

GRANT SELECT ON teacher_leaderboard TO authenticated;

-- ─── 10. Audit log trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_submission_review()
RETURNS TRIGGER AS $func$
BEGIN
  IF (NEW.reviewed_at IS NOT NULL) AND (OLD.reviewed_at IS NULL OR OLD.reviewed_at <> NEW.reviewed_at) THEN
    INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, metadata)
    VALUES (
      COALESCE(NEW.reviewed_by, auth.uid()),
      'review_submission',
      'project_submission',
      NEW.id,
      jsonb_build_object(
        'status', NEW.status,
        'reviewed_at', NEW.reviewed_at,
        'module_num', NEW.module_num,
        'lesson_name', NEW.lesson_name
      )
    );
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_submission_review ON project_submissions;
CREATE TRIGGER trg_log_submission_review
  AFTER UPDATE OF reviewed_at, status ON project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.log_submission_review();

-- ─── 11. Auto-sync trigger (capstone_completed on approval) ───────────────
CREATE OR REPLACE FUNCTION public.sync_capstone_on_approval()
RETURNS TRIGGER AS $func$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    UPDATE lesson_progress
    SET
      capstone_completed = TRUE,
      capstone_evidence_url = NEW.project_url,
      completed_at = COALESCE(completed_at, now())
    WHERE enrollment_id = NEW.enrollment_id
      AND module_num::text = NEW.module_num::text;
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_capstone_on_approval ON project_submissions;
CREATE TRIGGER trg_sync_capstone_on_approval
  AFTER UPDATE OF status ON project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_capstone_on_approval();
