-- ════════════════════════════════════════════════════════════════
-- SARIRO — RLS Recursion Fix (v1.1 patch)
-- ════════════════════════════════════════════════════════════════
-- PROBLEM: enrollments and bookings SELECT policies reference each
-- other (enrollments checks bookings.cohort_id WHERE teacher_id,
-- bookings checks enrollments.cohort_id WHERE user_id) → Postgres
-- throws "infinite recursion detected in policy" error.
--
-- FIX: Replace the cross-referencing subqueries with SECURITY DEFINER
-- helper functions. SECURITY DEFINER functions run with the privileges
-- of the function owner (postgres), so they BYPASS RLS entirely —
-- no recursion possible.
--
-- Safe to run multiple times. Idempotent.
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. Create helper functions (SECURITY DEFINER = bypasses RLS)
-- ────────────────────────────────────────────────────────────────

-- Returns true if the current user is a teacher of the given cohort
CREATE OR REPLACE FUNCTION public.is_teacher_of_cohort(cohort_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE cohort_id = cohort_uuid AND teacher_id = auth.uid()
  );
$$;

-- Returns true if the current user is a student in the given cohort
CREATE OR REPLACE FUNCTION public.is_student_in_cohort(cohort_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE cohort_id = cohort_uuid AND user_id = auth.uid()
  );
$$;

-- Returns array of cohort IDs the current user belongs to
-- (either as a student via enrollments OR as a teacher via bookings)
CREATE OR REPLACE FUNCTION public.user_cohort_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    ARRAY_AGG(DISTINCT cohort_id) FILTER (WHERE cohort_id IS NOT NULL),
    ARRAY[]::UUID[]
  )
  FROM (
    SELECT cohort_id FROM public.enrollments
    WHERE user_id = auth.uid() AND cohort_id IS NOT NULL
    UNION
    SELECT cohort_id FROM public.bookings
    WHERE teacher_id = auth.uid() AND cohort_id IS NOT NULL
  ) AS combined;
$$;

-- ────────────────────────────────────────────────────────────────
-- 2. Drop the recursive cross-reference policies
-- ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS enrollments_select_own_or_admin ON public.enrollments;
DROP POLICY IF EXISTS bookings_select_own_or_admin    ON public.bookings;
DROP POLICY IF EXISTS cohorts_select_own_or_admin     ON public.cohorts;

-- ────────────────────────────────────────────────────────────────
-- 3. Recreate policies using helper functions (NO recursion)
-- ────────────────────────────────────────────────────────────────

-- Students see own. Teachers see enrollments in cohorts they teach. Admins see all.
CREATE POLICY enrollments_select_own_or_admin
  ON public.enrollments FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('admin','super_admin')
    OR user_id = auth.uid()
    OR (cohort_id IS NOT NULL AND public.is_teacher_of_cohort(cohort_id))
  );

-- Students see bookings for their cohort. Teachers see their own. Admins see all.
CREATE POLICY bookings_select_own_or_admin
  ON public.bookings FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('admin','super_admin')
    OR teacher_id = auth.uid()
    OR (cohort_id IS NOT NULL AND public.is_student_in_cohort(cohort_id))
  );

-- Students see their own cohort. Teachers see cohorts they teach. Admins see all.
CREATE POLICY cohorts_select_own_or_admin
  ON public.cohorts FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('admin','super_admin')
    OR id = ANY(public.user_cohort_ids())
  );

-- ────────────────────────────────────────────────────────────────
-- 4. Grant execute on helper functions to authenticated users
-- ────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.is_teacher_of_cohort(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_student_in_cohort(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_cohort_ids() TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 5. Verify — should return 3 (the 3 recreated policies)
-- ────────────────────────────────────────────────────────────────
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cohorts','enrollments','bookings')
  AND policyname LIKE '%select_own_or_admin%'
ORDER BY tablename;
