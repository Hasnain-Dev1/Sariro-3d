import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { allocate, missedBetween, type MissedLesson } from './allocation';

/**
 * SARIRO — what a payment buys when a child has fallen behind
 * ============================================================================
 * A family pays, and in the same instant the system decides how much of that
 * money is for classes they will attend and how much is for classes they
 * already missed. Get it wrong in one direction and a child is refused a class
 * they paid for; wrong in the other and the school teaches for free.
 *
 * The worked example throughout is the founder's: Rahul, group class, ran out
 * after lesson 15, group moved on to 18, buys 5 credits.
 */

const lessons = (...ns: number[]): MissedLesson[] =>
  ns.map((n) => ({ lessonNumber: n, lessonTitle: `Lesson ${n}` }));

describe('a group student — the founder’s example', () => {
  const rahul = () =>
    allocate({
      kind: 'group',
      creditsAdded: 5,
      unfundedMissed: lessons(16, 17),
      groupCurrentLesson: 18,
      lastCompletedLesson: 15,
    });

  test('2 go to catch-up, 3 stay as main', () => {
    const a = rahul();
    assert.equal(a.catchupAdded, 2);
    assert.equal(a.mainAdded, 3);
  });

  test('he rejoins the group at 18, not at 16', () => {
    // The group does not move backwards for anybody. He returns to the class
    // that is actually happening and takes 16 and 17 separately.
    assert.equal(rahul().resumeAtLesson, 18);
    assert.equal(rahul().canResume, true);
  });

  test('the funded lessons are the real ones, not a count', () => {
    // "catchup_credit = 2" cannot tell a teacher what to teach.
    assert.deepEqual(rahul().fundedLessons.map((l) => l.lessonNumber), [16, 17]);
    assert.equal(rahul().stillUnfunded.length, 0);
  });

  test('the message says all three numbers a parent needs', () => {
    const m = rahul().message;
    assert.match(m, /5 credits added/);
    assert.match(m, /missed 2 classes/);
    assert.match(m, /3 credits are available/);
    assert.match(m, /lesson 18/);
  });
});

describe('one to one — no split, ever', () => {
  test('every credit is a main credit even after a long gap', () => {
    // Nothing ran on without them. Splitting would invent a debt: charging for
    // a catch-up session covering a lesson nobody taught in their absence.
    const a = allocate({
      kind: 'one_to_one',
      creditsAdded: 8,
      unfundedMissed: lessons(18, 19, 20),
      lastCompletedLesson: 17,
    });
    assert.equal(a.mainAdded, 8);
    assert.equal(a.catchupAdded, 0);
    assert.equal(a.fundedLessons.length, 0);
  });

  test('they restart at the lesson after the one they finished', () => {
    const a = allocate({ kind: 'one_to_one', creditsAdded: 4, unfundedMissed: [], lastCompletedLesson: 17 });
    assert.equal(a.resumeAtLesson, 18);
    assert.match(a.message, /lesson 18/);
    assert.match(a.message, /where you left off/);
  });

  test('a student who never completed anything starts at lesson 1', () => {
    const a = allocate({ kind: 'one_to_one', creditsAdded: 4, unfundedMissed: [], lastCompletedLesson: null });
    assert.equal(a.resumeAtLesson, 1);
  });
});

describe('when the payment is smaller than the debt', () => {
  const short = () =>
    allocate({
      kind: 'group',
      creditsAdded: 3,
      unfundedMissed: lessons(21, 22, 23, 24, 25),
      groupCurrentLesson: 26,
      lastCompletedLesson: 20,
    });

  test('all of it goes to catch-up and regular classes stay paused', () => {
    const a = short();
    assert.equal(a.catchupAdded, 3);
    assert.equal(a.mainAdded, 0);
    assert.equal(a.canResume, false);
    assert.equal(a.resumeAtLesson, null);
  });

  test('the lessons it could not cover are still tracked', () => {
    // Forgetting them would quietly write off two classes the family paid for
    // in every sense except the one that counts.
    assert.deepEqual(short().stillUnfunded.map((l) => l.lessonNumber), [24, 25]);
  });

  test('the oldest missed lessons are funded first', () => {
    assert.deepEqual(short().fundedLessons.map((l) => l.lessonNumber), [21, 22, 23]);
  });

  test('the message says how many more are needed, not just "add more"', () => {
    const m = short().message;
    assert.match(m, /still paused/);
    assert.match(m, /2 missed classes are still to be covered/);
    assert.match(m, /at least one more credit/);
  });

  test('a later payment funds the remaining debt before anything else', () => {
    const first = short();
    const second = allocate({
      kind: 'group',
      creditsAdded: 5,
      unfundedMissed: first.stillUnfunded,
      groupCurrentLesson: 26,
      lastCompletedLesson: 20,
    });
    assert.equal(second.catchupAdded, 2, 'the two outstanding lessons come first');
    assert.equal(second.mainAdded, 3);
    assert.equal(second.canResume, true);
    assert.equal(second.resumeAtLesson, 26);
  });

  test('exactly enough to clear the debt leaves nothing to attend with', () => {
    const a = allocate({
      kind: 'group', creditsAdded: 5, unfundedMissed: lessons(21, 22, 23, 24, 25),
      groupCurrentLesson: 26, lastCompletedLesson: 20,
    });
    assert.equal(a.mainAdded, 0);
    assert.equal(a.canResume, false, 'paid off the past, nothing left for the future');
    assert.equal(a.stillUnfunded.length, 0);
  });
});

describe('nothing missed', () => {
  test('a student who simply ran out gets the lot as main credits', () => {
    const a = allocate({
      kind: 'group', creditsAdded: 10, unfundedMissed: [],
      groupCurrentLesson: 12, lastCompletedLesson: 11,
    });
    assert.equal(a.mainAdded, 10);
    assert.equal(a.catchupAdded, 0);
    assert.equal(a.canResume, true);
    assert.doesNotMatch(a.message, /catch-up/, 'no catch-up language when nothing was missed');
  });
});

describe('inputs that should not break anything', () => {
  test('zero credits changes nothing and says so', () => {
    const a = allocate({ kind: 'group', creditsAdded: 0, unfundedMissed: lessons(4, 5), groupCurrentLesson: 6 });
    assert.equal(a.mainAdded, 0);
    assert.equal(a.catchupAdded, 0);
    assert.equal(a.canResume, false);
    assert.equal(a.message, 'No credits were added.');
  });

  test('a negative or fractional amount cannot create credits', () => {
    assert.equal(allocate({ kind: 'group', creditsAdded: -5, unfundedMissed: [] }).mainAdded, 0);
    assert.equal(allocate({ kind: 'group', creditsAdded: 2.9, unfundedMissed: [] }).mainAdded, 2);
    assert.equal(allocate({ kind: 'group', creditsAdded: NaN, unfundedMissed: [] }).mainAdded, 0);
  });

  test('an unknown group lesson still resumes rather than blocking', () => {
    // Not knowing which lesson the group is on is our gap, not the family's.
    const a = allocate({ kind: 'group', creditsAdded: 4, unfundedMissed: [], groupCurrentLesson: null });
    assert.equal(a.canResume, true);
    assert.equal(a.resumeAtLesson, null);
    assert.match(a.message, /continue as normal/);
  });

  test('the input list is never mutated', () => {
    const missed = lessons(1, 2, 3);
    allocate({ kind: 'group', creditsAdded: 2, unfundedMissed: missed, groupCurrentLesson: 4 });
    assert.equal(missed.length, 3);
  });

  test('main + catch-up always equals what was paid for', () => {
    // The property that must hold for every input: no credit is created or
    // lost in the split.
    for (const credits of [0, 1, 3, 7, 12]) {
      for (const missedCount of [0, 1, 4, 9]) {
        const a = allocate({
          kind: 'group', creditsAdded: credits,
          unfundedMissed: lessons(...Array.from({ length: missedCount }, (_, i) => i + 1)),
          groupCurrentLesson: 50,
        });
        assert.equal(a.mainAdded + a.catchupAdded, credits, `${credits} credits, ${missedCount} missed`);
        assert.equal(a.fundedLessons.length, a.catchupAdded);
        assert.equal(a.fundedLessons.length + a.stillUnfunded.length, missedCount);
      }
    }
  });
});

describe('missedBetween — the group is the source of truth', () => {
  test('everything strictly between the two, exclusive both ends', () => {
    // Stopped after 20, group about to teach 27 → missed 21..26.
    assert.deepEqual(
      missedBetween(20, 27).map((l) => l.lessonNumber),
      [21, 22, 23, 24, 25, 26]
    );
  });

  test('the lesson they are coming back to is not a missed lesson', () => {
    assert.deepEqual(missedBetween(15, 16).map((l) => l.lessonNumber), []);
  });

  test('a group that has not moved means nothing was missed', () => {
    assert.deepEqual(missedBetween(15, 15), []);
  });

  test('a group somehow behind the student produces nothing, not negatives', () => {
    assert.deepEqual(missedBetween(20, 12), []);
  });

  test('unknown either end is an empty list, not a guess', () => {
    assert.deepEqual(missedBetween(null, 20), []);
    assert.deepEqual(missedBetween(20, null), []);
    assert.deepEqual(missedBetween(undefined, undefined), []);
  });

  test('titles come from the syllabus when one is available', () => {
    const out = missedBetween(20, 23, (n) => `Lesson ${n} title`);
    assert.equal(out[0].lessonTitle, 'Lesson 21 title');
    assert.equal(out.length, 2);
  });
});
