import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { roomsFor, hasPracticeRoom } from './rooms';
import { masteryOf, suggestTopics, difficultyFor } from './mastery';

const room = (list: ReturnType<typeof roomsFor>, id: string) => list.find((r) => r.room.id === id)!;

describe('which rooms a learner has', () => {
  test('a grade-7 maths enrolment opens maths at grade 7, and nothing else', () => {
    const rooms = roomsFor([{ track: 'mathematics', status: 'active', level: 'grade-7' }]);
    assert.equal(room(rooms, 'maths').allowed, true);
    assert.equal(room(rooms, 'maths').grade, 7);
    assert.equal(room(rooms, 'maths').courseName, 'Maths · Grade 7');
    assert.equal(room(rooms, 'physics').allowed, false);
    assert.equal(room(rooms, 'physics').lapsed, false);
  });
  test('coding opens for any coding track, at the course level', () => {
    const rooms = roomsFor([{ track: 'python', status: 'active', level: 'Beginner' }]);
    assert.equal(room(rooms, 'coding').allowed, true);
    assert.equal(room(rooms, 'coding').grade, 2);
  });
  test('a dropped course is lapsed, not open; completed stays open', () => {
    assert.equal(room(roomsFor([{ track: 'chemistry', status: 'dropped', level: 'grade-9' }]), 'chemistry').lapsed, true);
    assert.equal(room(roomsFor([{ track: 'chemistry', status: 'completed', level: 'grade-9' }]), 'chemistry').allowed, true);
  });
  test('a focus course uses the profile grade, or a sensible one', () => {
    assert.equal(room(roomsFor([{ track: 'calculus', status: 'active', level: 'focus' }], null), 'maths').grade, 11);
    assert.equal(room(roomsFor([{ track: 'algebra-1', status: 'active', level: 'focus' }], 7), 'maths').grade, 7);
  });
  test('the latest enrolment wins', () => {
    const rooms = roomsFor([
      { track: 'mathematics', status: 'completed', level: 'grade-6', created_at: '2026-01-01' },
      { track: 'mathematics', status: 'active', level: 'grade-7', created_at: '2026-09-01' },
    ]);
    assert.equal(room(rooms, 'maths').grade, 7);
  });
  test('hasPracticeRoom', () => {
    assert.equal(hasPracticeRoom([{ track: 'public-speaking', status: 'active', level: 'band-middle' }]), false);
    assert.equal(hasPracticeRoom([{ track: 'web', status: 'active', level: 'Beginner' }]), true);
    assert.equal(hasPracticeRoom(null), false);
  });
});

describe('mastery', () => {
  const at = (days: number) => new Date(Date.UTC(2026, 8, 1 + days)).toISOString();
  const now = Date.UTC(2026, 8, 20);
  test('levels climb with good recent scores, over more than one day', () => {
    assert.equal(masteryOf('t', [], now).level, 0);
    assert.equal(masteryOf('t', [{ topic: 't', score: 40, createdAt: at(1) }], now).level, 1);
    assert.equal(masteryOf('t', [{ topic: 't', score: 70, createdAt: at(1) }], now).level, 2);
    const strong = [85, 90, 80].map((s, i) => ({ topic: 't', score: s, createdAt: at(1) + i }));
    assert.equal(masteryOf('t', strong.map((a, i) => ({ ...a, createdAt: at(1).replace('00:00', `0${i}:00`) })), now).level, 3);
    const mastered = [95, 92, 100].map((s, i) => ({ topic: 't', score: s, createdAt: at(i) }));
    assert.equal(masteryOf('t', mastered, now).level, 4);
  });
  test('due after the review gap its level earns', () => {
    const m = masteryOf('t', [{ topic: 't', score: 40, createdAt: at(18) }], now);
    assert.equal(m.due, true); // level 1 reviews after a day; this was 2 days ago
  });
  test('suggestions put weak due topics first, then untried', () => {
    const attempts = [{ topic: 'weak', score: 30, createdAt: at(10) }, { topic: 'good', score: 95, createdAt: at(18) }];
    const s = suggestTopics(['good', 'new', 'weak'], attempts, now).map((m) => m.topic);
    assert.deepEqual(s.slice(0, 2), ['weak', 'new']);
  });
  test('difficulty follows level', () => {
    assert.equal(difficultyFor(0), 1);
    assert.equal(difficultyFor(2), 2);
    assert.equal(difficultyFor(4), 3);
  });
});
