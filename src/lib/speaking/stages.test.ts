import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { allSpeakingLessons } from './modules';
import { soundPattern } from './sounds';
import { JUNIOR_LESSONS, STAGES, STAGE_ORDER, stageFor, stageLesson, juniorLesson } from './stages';
import { homeworkFor, showcaseMissions, STAGE_RULES } from './quest/homework';
import { dailyQuest, rankFor } from './quest/engine';
import { SHOWCASES } from './quest/worlds';

const lessons = allSpeakingLessons();
const words = (s: string) => s.trim().split(/\s+/).length;

describe('stages from grades', () => {
  test('every grade has a stage', () => {
    assert.equal(stageFor(1), 'foundation');
    assert.equal(stageFor(3), 'foundation');
    assert.equal(stageFor(4), 'primary');
    assert.equal(stageFor(6), 'primary');
    assert.equal(stageFor(7), 'middle');
    assert.equal(stageFor(10), 'senior');
    assert.equal(stageFor(12), 'senior');
    assert.equal(stageFor(13), 'adult');
    assert.equal(stageFor(14), 'adult');
    assert.equal(stageFor(null), 'middle');
  });

  test('five stages, junior for grades 1–6 only', () => {
    assert.deepEqual(STAGE_ORDER, ['foundation', 'primary', 'middle', 'senior', 'adult']);
    assert.deepEqual(STAGE_ORDER.filter((s) => STAGES[s].junior), ['foundation', 'primary']);
  });
});

describe('the junior course', () => {
  test('every written lesson has a junior version, and nothing extra', () => {
    const numbers = lessons.map((l) => l.number).sort((a, b) => a - b);
    assert.deepEqual(JUNIOR_LESSONS.map((j) => j.number).sort((a, b) => a - b), numbers);
  });

  for (const j of JUNIOR_LESSONS) {
    test(`lesson ${j.number}: readable, finishable, and real`, () => {
      assert.ok(j.idea.length >= 2 && j.idea.length <= 3, 'two or three short paragraphs');
      for (const p of j.idea) assert.ok(words(p) <= 60, `a paragraph of ${words(p)} words is too long for Grade 3`);
      assert.ok(words(j.oneLine) <= 30, 'one line a child can repeat');
      assert.equal(j.drills.length, 2);
      assert.deepEqual(j.drills.map((d) => d.id), [`ps-j-${j.number}-a`, `ps-j-${j.number}-b`]);
      for (const d of j.drills) {
        assert.ok((d.targetSeconds ?? 0) >= 8 && (d.targetSeconds ?? 0) <= 90, `${d.id} length`);
        if (d.passage) assert.ok(words(d.passage) <= 60 && !/\d/.test(d.passage), `${d.id} passage is short and has no digits`);
      }
      assert.ok(j.realWorld.length > 10 && j.homeTip.length > 20);
      for (const p of j.soundLab ?? []) assert.ok(soundPattern(p), `unknown sound ${p}`);
    });
  }
});

describe('stageLesson', () => {
  const base = lessons.find((l) => l.number === 4)!;

  test('juniors get the junior lesson under the same title, key and slot', () => {
    const young = stageLesson(base, 'primary');
    assert.equal(young.title, base.title);
    assert.equal(young.key, base.key);
    assert.equal(young.oneLine, juniorLesson(4)!.oneLine);
    assert.ok(young.homeTip);
    assert.deepEqual(young.extraDrills, []);
  });

  test('Sprouts get shorter drills than Explorers', () => {
    const sprout = stageLesson(base, 'foundation').drills;
    const explorer = stageLesson(base, 'primary').drills;
    sprout.forEach((d, i) => assert.ok((d.targetSeconds ?? 0) <= (explorer[i].targetSeconds ?? 0)));
  });

  test('from Grade 7 up, the full lesson, untouched', () => {
    for (const s of ['middle', 'senior', 'adult'] as const) {
      const l = stageLesson(base, s);
      assert.equal(l.oneLine, base.oneLine);
      assert.deepEqual(l.drills, base.drills);
      assert.equal(l.homeTip, undefined);
    }
  });
});

describe('homework by stage', () => {
  test('same mission ids at every stage, so a child who moves up keeps their record', () => {
    for (const l of lessons) {
      const ids = (s: Parameters<typeof homeworkFor>[1]) => new Set(homeworkFor(l, s).map((m) => m.id));
      const teen = ids('senior');
      for (const s of STAGE_ORDER) for (const id of ids(s)) assert.ok(teen.has(id) || id.includes(':sound:'), `${id} at ${s} is not a teen mission id`);
    }
  });

  test('Sprouts: no writing, fewer tries, gentler marks', () => {
    const hw = homeworkFor(lessons[0], 'foundation');
    assert.ok(!hw.some((m) => m.kind === 'write'));
    const speak = hw.find((m) => m.id.endsWith(':speak'))!;
    assert.equal(speak.attempts, STAGE_RULES.foundation.speak[0]);
    assert.ok(speak.pass < homeworkFor(lessons[0], 'senior').find((m) => m.id.endsWith(':speak'))!.pass);
  });

  test('Explorers write, but less', () => {
    const w = homeworkFor(lessons[0], 'primary').find((m) => m.kind === 'write')!;
    assert.equal(w.goal?.min, 25);
  });

  test('showcases: Sprouts perform without a script; everyone performs', () => {
    for (const s of SHOWCASES) {
      assert.ok(!showcaseMissions(s, 'foundation').some((m) => m.kind === 'write'));
      for (const st of STAGE_ORDER) assert.ok(showcaseMissions(s, st).some((m) => m.kind === 'speak'));
    }
  });
});

test('daily quests and ranks for younger learners', () => {
  // Across a fortnight, Sprouts are never asked to write.
  for (let d = 1; d <= 14; d++) {
    const key = `2026-09-${String(d).padStart(2, '0')}`;
    assert.notEqual(dailyQuest(key, 'foundation').kind, 'write');
  }
  assert.equal(rankFor(0, 'foundation').title, 'Seedling');
  assert.equal(rankFor(0, 'senior').title, 'Whisperer');
  assert.equal(rankFor(900, 'primary').level, rankFor(900, 'adult').level, 'same thresholds, different names');
});
