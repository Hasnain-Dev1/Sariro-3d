-- SARIRO — Student name management
-- =================================
-- Adds a single flag that lets an admin / super-admin LOCK a student's name so
-- the student can no longer change it themselves from Settings. Default false,
-- so existing behaviour (students may edit their own name) is preserved until
-- an admin deliberately locks a given account.
--
-- Safe to run more than once (IF NOT EXISTS).
--
-- Who writes what:
--   • The student edits their OWN full_name from /settings (RLS: own row only)
--     — but only while name_locked = false.
--   • An admin/super-admin edits ANY student's full_name and flips name_locked
--     via the service-role route POST /api/admin/update-student-name (bypasses
--     RLS, gated to admin/super-admin server-side). Students can never set
--     name_locked themselves.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name_locked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.name_locked IS
  'When true, the user cannot change their own full_name from Settings; only an admin/super-admin can. Set via /api/admin/update-student-name.';

-- ── Real enforcement (not just UI) ─────────────────────────────────────────
-- Without this, a savvy user could still change their own full_name by calling
-- Supabase directly, since RLS lets them update their own profile row. This
-- trigger blocks a full_name change while the row is locked UNLESS the caller
-- is the service role (i.e. the admin route). The service role also bypasses
-- RLS, so admins keep full control; only self-service edits are stopped.
CREATE OR REPLACE FUNCTION public.enforce_name_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.name_locked
     AND NEW.full_name IS DISTINCT FROM OLD.full_name
     AND COALESCE(auth.role(), '') <> 'service_role'
  THEN
    RAISE EXCEPTION 'This name is locked by an administrator and cannot be changed here.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_name_lock ON public.profiles;
CREATE TRIGGER trg_enforce_name_lock
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_name_lock();
