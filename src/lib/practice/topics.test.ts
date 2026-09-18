import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MATHS_TOPICS, mathsTopicsFor } from './maths/topics';
import { checkAnswer, type Response } from './check';
import type { Item, Topic } from './types';

/** The response a learner would give by typing the item's own right answer. */
function responseFor(item: Item): Response {
  switch (item.answer.kind) {
    case 'choice': return { kind: 'choice', index: item.answer.options.indexOf(item.answerText) };
    case 'order': return { kind: 'order', order: item.answer.correct };
    case 'coefficients': return { kind: 'coefficients', values: item.answer.correct };
    default: return { kind: 'text', text: item.answerText };
  }
}

function exercise(topics: Topic[], label: string) {
  describe(label, () => {
    test('topic keys are unique and grades make sense', () => {
      const keys = topics.map((t) => t.key);
      assert.equal(new Set(keys).size, keys.length);
      for (const t of topics) assert.ok(t.grades[0] <= t.grades[1], t.key);
    });

    for (const topic of topics) {
      test(`${topic.key}: every question is well-formed and its own answer is right`, () => {
        for (let seed = 1; seed <= 60; seed++) {
          for (const d of [1, 2, 3] as const) {
            const item = topic.make(seed * 7919 + d, d);
            const where = `${topic.key} seed ${seed} d${d}: ${item.prompt}`;
            for (const text of [item.prompt, item.answerText, item.solution, ...item.hints, ...(item.short ? [item.short] : [])]) {
              assert.ok(text && !/NaN|undefined|Infinity|\[object/.test(text), `${where} → bad text "${text}"`);
            }
            if (item.answer.kind === 'choice') {
              assert.ok(item.answer.options.includes(item.answerText), `${where} → answer not among options`);
              assert.equal(new Set(item.answer.options).size, item.answer.options.length, `${where} → duplicate options`);
            }
            const verdict = checkAnswer(item.answer, responseFor(item));
            assert.equal(verdict.correct, true, `${where} → typed "${item.answerText}", got "${verdict.message}"`);
          }
        }
      });
    }

    test('the same seed makes the same question', () => {
      for (const t of topics) {
        const a = t.make(12345, 2);
        const b = t.make(12345, 2);
        assert.equal(a.prompt, b.prompt, t.key);
        assert.equal(a.answerText, b.answerText, t.key);
      }
    });
  });
}

exercise(MATHS_TOPICS, 'maths topics');

describe('maths topics for a lesson', () => {
  test('a fractions lesson in grade 6 picks fraction topics', () => {
    const keys = mathsTopicsFor(6, 'Fractions', 'Adding fractions with different denominators').map((t) => t.key);
    assert.ok(keys.includes('maths:fraction-add-sub'), keys.join(','));
    assert.ok(!keys.includes('maths:pythagoras'));
  });
  test('an unmatched lesson still gets the grade\'s topics', () => {
    assert.ok(mathsTopicsFor(9, 'Module 3', 'Lesson 14').length > 3);
  });
  test('every grade 1–12 has at least four topics', () => {
    for (let g = 1; g <= 12; g++) assert.ok(mathsTopicsFor(g).length >= 4, `grade ${g}`);
  });
});
