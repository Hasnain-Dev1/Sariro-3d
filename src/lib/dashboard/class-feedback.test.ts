import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ratingSummary, teacherRating, recentRating, payGate, leadSignal, byPriority,
  checkFeedback, MIN_REMARK_CHARS, type ClassFeedback,
} from './class-feedback';

/**
 * SARIRO — two opinions about one class, kept apart
 * ============================================================================
 * This decides three things that cost real money: whether a teacher gets paid,
 * what a teacher's public standing is, and which parent a seller rings first.
 *
 * The rule underneath all of it is that the two sides never mix. A teacher
 * rating a child says nothing about the teacher, and a parent rating the class
 * says nothing about the child. Averaging them produces a number that means
 * nothing and that nobody can argue with.
 */

const fb = (over: Partial<ClassFeedback> = {}): ClassFeedback => ({
  booking_id: 'b1',
  author_id: 'a1',
  author_role: 'student',
  subject_student_id: 's1',
  rating: 5,
  remarks: 'Really enjoyed it, she was engaged the whole hour.',
  created_at: '2026-09-07T10:00:00Z',
  ...over,
});

describe('averaging ratings', () => {
  test('a straightforward average, to one decimal', () => {
    const r = ratingSummary([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);
    assert.equal(r.average, 4.3);
    assert.equal(r.count, 3);
  });

  test('the distribution counts each star', () => {
    const r = ratingSummary([{ rating: 5 }, { rating: 5 }, { rating: 1 }]);
    assert.deepEqual(r.distribution, [1, 0, 0, 0, 2]);
  });

  test('nobody has rated yet is null, not zero', () => {
    // Zero would render as a one-star teacher who has never been rated.
    assert.equal(ratingSummary([]).average, null);
    assert.equal(ratingSummary(null).average, null);
    assert.equal(ratingSummary(undefined).count, 0);
  });

  /* An out-of-range rating is a bug upstream. Letting it into the average
     turns a visible bug into an invisible one that drags a score down. */
  test('impossible ratings are ignored rather than averaged in', () => {
    const r = ratingSummary([{ rating: 5 }, { rating: 0 }, { rating: 6 }, { rating: -3 }]);
    assert.equal(r.average, 5);
    assert.equal(r.count, 1);
  });

  test('nulls, decimals and NaN do not count', () => {
    const r = ratingSummary([{ rating: null }, { rating: 4.5 }, { rating: NaN }, { rating: 4 }]);
    assert.equal(r.count, 1);
    assert.equal(r.average, 4);
  });
});

describe('a teacher’s standing comes only from students', () => {
  /* Otherwise a teacher raises their own score by being generous to children. */
  test('the teacher’s own ratings are excluded', () => {
    const rows = [
      fb({ author_role: 'student', rating: 3 }),
      fb({ author_role: 'teacher', rating: 5 }),
      fb({ author_role: 'teacher', rating: 5 }),
    ];
    assert.equal(teacherRating(rows).average, 3);
    assert.equal(teacherRating(rows).count, 1);
  });

  test('no student feedback means no standing yet', () => {
    assert.equal(teacherRating([fb({ author_role: 'teacher', rating: 5 })]).average, null);
  });
});

describe('how they are doing lately', () => {
  const NOW = Date.parse('2026-09-07T00:00:00Z');
  const at = (daysAgo: number, rating: number) =>
    fb({ rating, created_at: new Date(NOW - daysAgo * 86_400_000).toISOString() });

  /* An all-time average stops moving: a teacher who was poor in month one and
     excellent since looks mediocre forever, and the improvement is invisible. */
  test('old ratings drop out of the recent figure', () => {
    const rows = [at(400, 1), at(400, 1), at(10, 5), at(5, 5)];
    assert.equal(ratingSummary(rows).average, 3);
    assert.equal(recentRating(rows, 90, NOW).average, 5);
  });

  test('a broken timestamp is not counted as recent', () => {
    assert.equal(recentRating([fb({ created_at: 'nonsense' })], 90, NOW).count, 0);
  });

  test('exactly on the boundary still counts', () => {
    assert.equal(recentRating([at(90, 4)], 90, NOW).count, 1);
  });
});

describe('the pay gate', () => {
  const kids = [{ id: 's1', name: 'Anaya' }, { id: 's2', name: 'Rohan' }];
  const written = (id: string) =>
    fb({ author_role: 'teacher', subject_student_id: id, rating: 4, remarks: 'Followed along well and asked good questions.' });

  test('every child written up unlocks the pay', () => {
    const g = payGate(kids, [written('s1'), written('s2')]);
    assert.equal(g.unlocked, true);
    assert.equal(g.message, '');
  });

  /* "The class went well" is worthless to a seller with two families to ring.
     One write-up per child, or no pay. */
  test('one child missing holds it, and names them', () => {
    const g = payGate(kids, [written('s1')]);
    assert.equal(g.unlocked, false);
    assert.deepEqual(g.missing, ['Rohan']);
    assert.match(g.message, /Write up Rohan/);
  });

  test('several missing are all listed', () => {
    const g = payGate(kids, []);
    assert.equal(g.unlocked, false);
    assert.match(g.message, /Anaya, Rohan/);
  });

  test('a rating with no remark does not count as written up', () => {
    const g = payGate(kids, [fb({ author_role: 'teacher', subject_student_id: 's1', rating: 4, remarks: 'good' })]);
    assert.equal(g.unlocked, false);
    assert.deepEqual(g.missing, ['Anaya', 'Rohan']);
  });

  test('a remark with no rating does not count either', () => {
    const g = payGate([kids[0]], [
      fb({ author_role: 'teacher', subject_student_id: 's1', rating: null, remarks: 'She was excellent throughout the hour.' }),
    ]);
    assert.equal(g.unlocked, false);
  });

  test('the student’s own feedback cannot unlock the teacher’s pay', () => {
    const g = payGate([kids[0]], [fb({ author_role: 'student', subject_student_id: 's1' })]);
    assert.equal(g.unlocked, false);
  });

  /* A missing roster is somebody else's data problem. Withholding pay for it
     punishes the teacher for it. */
  test('no roster does not hold a teacher’s money', () => {
    assert.equal(payGate([], []).unlocked, true);
  });
});

describe('which parent to ring first', () => {
  const teacherSays = (interest: 'hot' | 'warm' | 'cold', rating = 4) =>
    fb({ author_role: 'teacher', rating, interest_level: interest, remarks: 'Engaged and quick to pick things up.' });

  test('hot beats warm beats cold', () => {
    const hot = leadSignal([teacherSays('hot')]).score;
    const warm = leadSignal([teacherSays('warm')]).score;
    const cold = leadSignal([teacherSays('cold')]).score;
    assert.ok(hot > warm && warm > cold, `${hot} / ${warm} / ${cold}`);
  });

  test('a delighted parent lifts the score', () => {
    const low = leadSignal([teacherSays('warm'), fb({ rating: 2 })]).score;
    const high = leadSignal([teacherSays('warm'), fb({ rating: 5 })]).score;
    assert.ok(high > low);
  });

  /* A class nobody wrote up needs chasing, not writing off — so it is marked
     silent rather than scored zero and buried. */
  test('nobody has said anything is silent, not cold', () => {
    const s = leadSignal([]);
    assert.equal(s.silent, true);
    assert.equal(s.temperature, 'unknown');
    assert.match(s.reasons[0], /nobody has written/i);
  });

  test('a sharp disagreement is flagged for a human', () => {
    const s = leadSignal([teacherSays('warm', 5), fb({ rating: 2 })]);
    assert.ok(s.reasons.some((r) => /disagreed/i.test(r)), s.reasons.join(' | '));
  });

  test('the score never leaves 0-100', () => {
    for (const rows of [
      [teacherSays('cold', 1), fb({ rating: 1 })],
      [teacherSays('hot', 5), fb({ rating: 5 })],
    ]) {
      const s = leadSignal(rows);
      assert.ok(s.score >= 0 && s.score <= 100, `${s.score}`);
    }
  });

  test('every score comes with a reason a seller can read', () => {
    const s = leadSignal([teacherSays('hot'), fb({ rating: 5 })]);
    assert.ok(s.reasons.length >= 2);
    assert.equal(s.teacherRating, 4);
    assert.equal(s.studentRating, 5);
  });

  test('silent classes sort above cold ones — they need chasing', () => {
    const rows = [
      { id: 'cold', f: [teacherSays('cold', 1)] },
      { id: 'silent', f: [] as ClassFeedback[] },
      { id: 'hot', f: [teacherSays('hot', 5)] },
    ];
    const order = byPriority(rows, (r) => leadSignal(r.f)).map((r) => r.id);
    assert.equal(order[0], 'silent');
    assert.equal(order[1], 'hot');
    assert.equal(order[2], 'cold');
  });
});

describe('what may be saved', () => {
  const long = 'She followed the whole lesson and asked two good questions.';

  test('a teacher needs a rating and real words', () => {
    assert.equal(checkFeedback('teacher', 4, long).ok, true);
    assert.equal(checkFeedback('teacher', 4, 'good').ok, false);
    assert.equal(checkFeedback('teacher', null, long).ok, false);
  });

  test('the teacher is told how many more characters, and why', () => {
    const r = checkFeedback('teacher', 4, 'good');
    assert.match(r.problem, new RegExp(String(MIN_REMARK_CHARS - 4)));
    assert.match(r.problem, /seller rings the parent/i);
  });

  /* Demanding a paragraph from a parent is how you get no feedback at all. */
  test('a parent may rate without writing anything', () => {
    assert.equal(checkFeedback('student', 5, '').ok, true);
  });

  test('but a parent still has to pick a rating', () => {
    assert.equal(checkFeedback('student', null, 'Lovely class').ok, false);
    assert.equal(checkFeedback('student', 0, '').ok, false);
    assert.equal(checkFeedback('student', 6, '').ok, false);
  });

  test('whitespace is not words', () => {
    assert.equal(checkFeedback('teacher', 4, '                            ').ok, false);
  });
});
