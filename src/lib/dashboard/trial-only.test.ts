import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardAccess, TRIAL_HOME } from './trial-only';

/**
 * SARIRO — "it will leak our dash"
 * ============================================================================
 * A free trial creates a real account, and that account was landing inside the
 * dashboard shell — sidebar and all. Anybody could see the whole product by
 * giving us a phone number.
 *
 * These tests are weighted towards the two ways this goes wrong in opposite
 * directions: letting a trial account in (the leak) and throwing a paying
 * student or a member of staff out (worse than the leak, day to day).
 */

describe('dashboardAccess', () => {
  test('a student with an enrolment gets the dashboard', () => {
    assert.equal(dashboardAccess({ profileLoaded: true, role: 'student', enrolmentCount: 1 }), 'allow');
  });

  test('a student with no enrolment is bounced — this is the leak', () => {
    assert.equal(dashboardAccess({ profileLoaded: true, role: 'student', enrolmentCount: 0 }), 'bounce');
  });

  test('an unknown count waits rather than guessing', () => {
    // Guessing 'allow' flashes the dashboard on screen for a trial account,
    // and a screenshot only needs one frame. Guessing 'bounce' throws a paying
    // student off their own dashboard over a network blip. Neither is
    // acceptable, so the caller holds the loading screen.
    assert.equal(dashboardAccess({ profileLoaded: true, role: 'student', enrolmentCount: null }), 'wait');
  });

  test('every kind of staff is let in with no enrolments at all', () => {
    // Bouncing staff would lock the whole company out of their own dashboards,
    // which is a fix considerably worse than the bug.
    for (const role of ['teacher', 'seller', 'hr', 'admin', 'super_admin']) {
      assert.equal(
        dashboardAccess({ profileLoaded: true, role, enrolmentCount: 0 }),
        'allow',
        `${role} must never be bounced`
      );
    }
  });

  test('staff are let in before the count is even known', () => {
    // No reason to make a teacher wait on a query about student enrolments.
    assert.equal(dashboardAccess({ profileLoaded: true, role: 'teacher', enrolmentCount: null }), 'allow');
  });

  test('a missing role is treated as a student, not as staff', () => {
    // Failing towards "not staff" is the safe direction: the worst case is a
    // person sees their trial page instead of an empty dashboard.
    assert.equal(dashboardAccess({ profileLoaded: true, role: null, enrolmentCount: 0 }), 'bounce');
    assert.equal(dashboardAccess({ profileLoaded: true, role: undefined, enrolmentCount: null }), 'wait');
  });

  test('a profile still loading WAITS — it never reads as a student', () => {
    // The production bug. getRole(null) answers 'student', which is right for
    // rendering and catastrophic for a decision: a super-admin whose profile
    // was still in flight read as a student with no enrolments and was thrown
    // off their own dashboard onto the trial page.
    assert.equal(
      dashboardAccess({ profileLoaded: false, role: 'student', enrolmentCount: 0 }),
      'wait'
    );
    assert.equal(
      dashboardAccess({ profileLoaded: false, role: null, enrolmentCount: 0 }),
      'wait'
    );
  });

  test('a loaded profile that really is a student with nothing still bounces', () => {
    assert.equal(
      dashboardAccess({ profileLoaded: true, role: 'student', enrolmentCount: 0 }),
      'bounce'
    );
  });

  test('the trial home is outside /dashboard, or the redirect loops', () => {
    assert.doesNotMatch(TRIAL_HOME, /^\/dashboard/);
    assert.match(TRIAL_HOME, /^\//);
  });
});
