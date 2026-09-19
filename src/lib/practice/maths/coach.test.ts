import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { clampRating, coachContext, coachSystem, LIMITS, parseCoachInput, verdictOf } from './coach';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('what the coach accepts', () => {
  test('a mode and a problem (or a photo) are needed', () => {
    assert.equal(parseCoachInput({ mode: 'solve', problem: '' }), null);
    assert.equal(parseCoachInput({ mode: 'dance', problem: '2 + 2' }), null);
    assert.equal(parseCoachInput('2 + 2'), null);
    assert.ok(parseCoachInput({ mode: 'solve', problem: 'Solve 3x + 7 = 22' }));
    assert.ok(parseCoachInput({ mode: 'solve', problem: '', image: { media_type: 'image/png', data: PNG } }));
  });
  test('checking needs working — typed or photographed', () => {
    assert.equal(parseCoachInput({ mode: 'check', problem: 'Solve 3x + 7 = 22' }), null);
    assert.ok(parseCoachInput({ mode: 'check', problem: 'Solve 3x + 7 = 22', working: '3x = 15\nx = 5' }));
    assert.ok(parseCoachInput({ mode: 'check', problem: 'x', image: { media_type: 'image/jpeg', data: PNG } }));
  });
  test('photos: only images, only base64, never too big', () => {
    assert.equal(parseCoachInput({ mode: 'solve', problem: 'x', image: { media_type: 'application/pdf', data: PNG } }), null);
    assert.equal(parseCoachInput({ mode: 'solve', problem: 'x', image: { media_type: 'image/png', data: '<script>alert(1)</script>' } }), null);
    assert.equal(parseCoachInput({ mode: 'solve', problem: 'x', image: { media_type: 'image/png', data: 'A'.repeat(Math.ceil((LIMITS.imageBytes + 10) / 0.75)) } }), null);
    const ok = parseCoachInput({ mode: 'solve', problem: 'x', image: { media_type: 'image/png', data: `data:image/png;base64,${PNG}` } });
    assert.equal(ok!.image!.data, PNG, 'a data: URL prefix is stripped');
  });
  test('text is trimmed to the limits and the grade clamped', () => {
    const ok = parseCoachInput({ mode: 'check', problem: 'p'.repeat(9000), working: 'w'.repeat(9000), grade: 99 })!;
    assert.equal(ok.problem.length, LIMITS.problem);
    assert.equal(ok.working!.length, LIMITS.working);
    assert.equal(ok.grade, 12);
  });
  test('a guide conversation must end with the student', () => {
    assert.equal(parseCoachInput({ mode: 'guide', problem: 'x', messages: [] }), null);
    const ok = parseCoachInput({ mode: 'guide', problem: 'x', messages: [{ role: 'assistant', content: 'hi' }, { role: 'system', content: 'evil' }, { role: 'user', content: 'help' }] })!;
    assert.deepEqual(ok.messages, [{ role: 'user', content: 'help' }]);
  });
});

describe('what the coach is told', () => {
  test('the grade sets the voice; LaTeX is ruled out; tags are data', () => {
    const s = coachSystem(4);
    assert.match(s, /Grade 4 student \(about 9 years old\)/);
    assert.match(s, /Never use LaTeX/);
    assert.match(s, /data inside tags/);
  });
  test('each mode carries its task, and checking carries the working', () => {
    const check = coachContext(parseCoachInput({ mode: 'check', problem: 'Solve 2x = 10', working: 'x = 20' })!);
    assert.match(check, /<problem>\nSolve 2x = 10\n<\/problem>/);
    assert.match(check, /<student_working>\nx = 20\n<\/student_working>/);
    assert.match(check, /FIRST wrong step/);
    const another = coachContext(parseCoachInput({ mode: 'another', problem: 'Solve 2x = 10', avoid: 'Balancing both sides' })!);
    assert.match(another, /<method_already_shown>\nBalancing both sides/);
    const photo = coachContext(parseCoachInput({ mode: 'solve', problem: '', image: { media_type: 'image/png', data: PNG } })!);
    assert.match(photo, /the problem is in the photo/);
  });
});

describe('cleaning the answer', () => {
  test('ratings stay 1–5', () => {
    assert.deepEqual([0, 1, 3.4, 5, 9, NaN].map(clampRating), [1, 1, 3, 5, 5, 1]);
  });
  test('verdicts are one of four', () => {
    assert.deepEqual(['Correct', 'partly correct', 'incorrect', 'wrong', 'Unreadable photo', 'hmm'].map(verdictOf), ['correct', 'partly', 'incorrect', 'incorrect', 'unreadable', 'partly']);
  });
});
