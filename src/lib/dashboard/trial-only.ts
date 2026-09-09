/**
 * SARIRO — a trial is not a login to the product
 * ============================================================================
 * A free trial creates a real account. Until now that account landed on
 * /dashboard/student, and the trial page was rendered INSIDE the dashboard
 * shell — so anyone who booked a free class got the sidebar with it: Practice
 * Room, Leaderboard, My Lessons, Messages, Browse Courses, Settings.
 *
 * Anybody could see the whole product by giving us a phone number. A
 * competitor books a trial and screenshots the navigation.
 *
 * So a student with no enrolment does not enter /dashboard at all. They get
 * /my-class: their countdown, their join button, and nothing else on it.
 *
 * ── Why enrolment and not "did they pay" ────────────────────────────────────
 * Enrolment is the thing that already gates every other student feature, and
 * it is what the dashboard is FOR. A child with no enrolment has no lessons,
 * no schedule, no classmates and no progress; the dashboard has nothing to
 * show them even setting the leak aside.
 *
 * ── Why staff are never bounced ─────────────────────────────────────────────
 * Teachers, sellers, HR and admins have no enrolments either. Bouncing them to
 * a trial page would lock every member of staff out of their own dashboard,
 * which is the kind of fix that is worse than the bug.
 */

export type DashboardAccess = 'allow' | 'bounce' | 'wait';

/** Where a student with no enrolment goes instead. Not under /dashboard. */
export const TRIAL_HOME = '/my-class';

export interface AccessInput {
  /** From getRole(profile). */
  role: string | null | undefined;
  /**
   * How many enrolments they have. `null` means we do not know yet — still
   * loading, or the query failed.
   */
  enrolmentCount: number | null;
  /**
   * Whether the profile has actually arrived.
   *
   * This is not a nicety. getRole(null) returns 'student' — a sensible default
   * for rendering, and a disastrous one for a security decision. Without this
   * flag a super-admin whose profile was still in flight read as a student
   * with no enrolments and was thrown out of their own dashboard onto the
   * trial page. That is exactly what happened in production.
   *
   * A role derived from a missing profile is not a role. It is a placeholder,
   * and nothing may be decided on it.
   */
  profileLoaded: boolean;
}

/**
 * Whether this person may see the dashboard.
 *
 * 'wait' is a real answer, not a placeholder. Guessing while the count is
 * unknown gets it wrong in one of two expensive directions: guess 'allow' and
 * the dashboard flashes on screen for a trial account — which is the exact
 * leak this exists to stop, and a screenshot only needs one frame. Guess
 * 'bounce' and a paying student is thrown off their own dashboard by a network
 * blip. So the caller holds the loading screen until the answer is real.
 */
export function dashboardAccess({
  role, enrolmentCount, profileLoaded,
}: AccessInput): DashboardAccess {
  /* Nothing is decided on a role we have not actually read. getRole(null)
     answers 'student', which is the right thing to render and the wrong thing
     to act on — see AccessInput.profileLoaded. */
  if (!profileLoaded) return 'wait';

  // Anyone who is not a student is staff, and staff always have a dashboard.
  if (role && role !== 'student') return 'allow';

  // A student we cannot classify yet.
  if (enrolmentCount === null) return 'wait';

  return enrolmentCount > 0 ? 'allow' : 'bounce';
}
