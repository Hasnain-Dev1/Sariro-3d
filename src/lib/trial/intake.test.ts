import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeIntake, stepsDone, micHeard, FEELING } from './intake';

test('a save only changes what it sends', () => {
  const stored = { experience: 'new' as const, interests: ['games'], feeling: 2 };
  assert.deepEqual(mergeIntake(stored, { micOk: true }), { ...stored, micOk: true });
  assert.deepEqual(mergeIntake(stored, { experience: 'some', interests: undefined }), { ...stored, experience: 'some' });
  assert.deepEqual(mergeIntake(null, { warmUp: { correct: 2, total: 3 } }), { warmUp: { correct: 2, total: 3 } });
});

test('which steps are done', () => {
  assert.deepEqual(stepsDone(null), { about: false, sound: false, warmup: false });
  assert.deepEqual(stepsDone({ interests: ['ai'] }), { about: true, sound: false, warmup: false });
  assert.deepEqual(stepsDone({ micOk: false, warmUp: { correct: 0, total: 3 } }), { about: false, sound: false, warmup: true });
  assert.deepEqual(stepsDone({ feeling: 4, micOk: true, warmUp: { correct: 3, total: 3 } }), { about: true, sound: true, warmup: true });
});

test('the microphone has to hear a voice, not a knock or a hiss', () => {
  assert.equal(micHeard([0.01, 0.02, 0.015, 0.01, 0.02]), false, 'background hiss');
  assert.equal(micHeard([0.01, 0.3, 0.01, 0.01]), false, 'one knock');
  assert.equal(micHeard([0.01, 0.06, 0.08, 0.07, 0.05, 0.02]), true, 'a word');
});

test('every feeling from 1 to 5 has a face', () => {
  for (let i = 1; i <= 5; i++) assert.ok(FEELING[i].emoji && FEELING[i].label);
});
