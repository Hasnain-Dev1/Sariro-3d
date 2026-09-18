import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sheetFor, lessonQuizFor, modulesFor, markPaper, SHEET_QUESTIONS, QUIZ_QUESTIONS, SHEETS_PER_MODULE, sheetDifficulty } from './tests';
import type { Response } from '../check';
import type { Item } from '../types';

const rightAnswer = (item: Item): Response => {
  switch (item.answer.kind) {
    case 'choice': return { kind: 'choice', index: item.answer.options.indexOf(item.answerText) };
    case 'order': return { kind: 'order', order: item.answer.correct };
    case 'coefficients': return { kind: 'coefficients', values: item.answer.correct };
    default: return { kind: 'text', text: item.answerText };
  }
};

describe('test sheets', () => {
  test('every grade has 8 modules, each with topics to test', () => {
    for (let g = 1; g <= 12; g++) {
      const mods = modulesFor(g);
      assert.equal(mods.length, 8, `grade ${g}`);
      for (const m of mods) assert.ok(m.topics.length > 0, `grade ${g} module ${m.num}`);
    }
  });
  test('a sheet is the same paper every time, and different sheets differ', () => {
    const a = sheetFor(7, 3, 4);
    const b = sheetFor(7, 3, 4);
    assert.deepEqual(a.items.map((i) => i.prompt), b.items.map((i) => i.prompt));
    assert.notDeepEqual(sheetFor(7, 3, 5).items.map((i) => i.prompt), a.items.map((i) => i.prompt));
    assert.equal(a.id, 'maths:sheet:g7:m3:s4');
  });
  test('every sheet of every module of every grade is full, unique and answerable', () => {
    for (let g = 1; g <= 12; g++) {
      for (let m = 1; m <= 8; m++) {
        for (let s = 1; s <= SHEETS_PER_MODULE; s++) {
          const paper = sheetFor(g, m, s);
          assert.equal(paper.items.length, SHEET_QUESTIONS, `${paper.id} has ${paper.items.length}`);
          assert.equal(new Set(paper.items.map((i) => i.prompt)).size, paper.items.length, `${paper.id} repeats a question`);
          const report = markPaper(paper, paper.items.map(rightAnswer), 600);
          assert.equal(report.score, 100, `${paper.id}: own answers scored ${report.score}`);
        }
      }
    }
  });
  test('sheets get harder', () => {
    assert.deepEqual([1, 3, 4, 7, 8, 10].map(sheetDifficulty), [1, 1, 2, 2, 3, 3]);
  });
});

describe('lesson quizzes', () => {
  test('a quiz is on the lesson, and a retake is a fresh paper', () => {
    const fractions = modulesFor(6).find((m) => /fraction/i.test(m.title))!;
    const q1 = lessonQuizFor(6, fractions.num, 'Adding fractions with different denominators', 1);
    const q2 = lessonQuizFor(6, fractions.num, 'Adding fractions with different denominators', 2);
    assert.ok(q1.items.length >= QUIZ_QUESTIONS - 2);
    assert.ok(q1.items.every((i) => i.topic.includes('fraction')), q1.items.map((i) => i.topic).join(','));
    assert.notDeepEqual(q1.items.map((i) => i.prompt), q2.items.map((i) => i.prompt));
    assert.equal(q1.minutes, 10);
  });
});

describe('the report', () => {
  const paper = sheetFor(8, 2, 5);
  test('marks, counts blanks, and splits by topic', () => {
    const responses = paper.items.map((item, i) => (i < 5 ? rightAnswer(item) : i < 8 ? { kind: 'text' as const, text: '999999' } : null));
    const r = markPaper(paper, responses, 20 * 60);
    assert.equal(r.correct, 5);
    assert.equal(r.unanswered, paper.items.length - 8);
    assert.equal(r.score, Math.round((5 / paper.items.length) * 100));
    assert.equal(r.byTopic.reduce((s, l) => s + l.total, 0), paper.items.length);
    assert.ok(r.advice.some((a) => /left blank/.test(a)));
  });
  test('running out of time is said', () => {
    const r = markPaper(paper, paper.items.map(rightAnswer), 45 * 60);
    assert.equal(r.finishedInTime, false);
    assert.ok(r.advice.some((a) => /ran out of time/.test(a)));
  });
});
