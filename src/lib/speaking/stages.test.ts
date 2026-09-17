import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, STAGE_ORDER, stageFor } from './stages';
import { showcasesFor, speakingLessonAt, speakingLessons } from './courses';
import { homeworkFor, showcaseMissions, STAGE_RULES } from './quest/homework';
import { dailyQuest, rankFor } from './quest/engine';

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

describe('homework by stage', () => {
  const first = (s: (typeof STAGE_ORDER)[number]) => speakingLessons(s)[0];

  test('each course keeps its own record: mission ids are scoped to the band', () => {
    const all = STAGE_ORDER.flatMap((s) => speakingLessons(s).flatMap((l) => homeworkFor(l).map((m) => m.id)));
    assert.equal(new Set(all).size, all.length, 'two missions share an id');
    for (const s of STAGE_ORDER) for (const l of speakingLessons(s)) for (const m of homeworkFor(l)) assert.ok(m.id.startsWith(`hw:${s}:`), m.id);
  });

  test('older bands are asked for more', () => {
    const speak = (s: (typeof STAGE_ORDER)[number]) => homeworkFor(first(s)).find((m) => m.id.endsWith(':speak'))!;
    assert.ok(speak('foundation').pass < speak('primary').pass);
    assert.ok(speak('primary').pass < speak('middle').pass);
    assert.ok(speak('middle').pass < speak('adult').pass);
    const write = (s: (typeof STAGE_ORDER)[number]) => homeworkFor(first(s)).find((m) => m.kind === 'write')!.goal!.min!;
    assert.ok(write('primary') < write('middle') && write('middle') < write('senior') && write('senior') <= write('adult'));
  });

  test('the writing mission uses the lesson’s own prompt', () => {
    const l = first('adult');
    const w = homeworkFor(l).find((m) => m.kind === 'write')!;
    assert.equal(w.prompt, l.writePrompt);
  });

  test('Sprouts: no writing, fewer tries, gentler marks', () => {
    for (const l of speakingLessons('foundation')) assert.ok(!homeworkFor(l).some((m) => m.kind === 'write'), l.title);
    const speak = homeworkFor(first('foundation')).find((m) => m.id.endsWith(':speak'))!;
    assert.equal(speak.attempts, STAGE_RULES.foundation.speak[0]);
    assert.ok(speak.pass < homeworkFor(first('senior')).find((m) => m.id.endsWith(':speak'))!.pass);
  });

  test('Explorers write, but less', () => {
    const w = homeworkFor(first('primary')).find((m) => m.kind === 'write')!;
    assert.equal(w.goal?.min, 30);
  });

  test('showcases: Sprouts perform without a script; everyone performs their own course’s showcase', () => {
    for (const s of showcasesFor('foundation')) assert.ok(!showcaseMissions(s, 'foundation').some((m) => m.kind === 'write'));
    for (const st of STAGE_ORDER) {
      for (const s of showcasesFor(st)) assert.ok(showcaseMissions(s, st).some((m) => m.kind === 'speak'));
    }
    assert.equal(new Set(STAGE_ORDER.map((st) => showcasesFor(st)[1].name)).size, STAGE_ORDER.length, 'five different final showcases');
  });
});

describe('five courses, not one course five ways', () => {
  test('the same slot is a different lesson in every course', () => {
    for (const [m, i] of [[1, 0], [3, 2], [7, 0]] as const) {
      const titles = STAGE_ORDER.map((s) => speakingLessonAt(s, m, i)!.title);
      assert.equal(new Set(titles).size, STAGE_ORDER.length, `slot ${m}:${i}: ${titles.join(' | ')}`);
    }
  });

  test('moving up a group means new lesson names', () => {
    for (let b = 1; b < STAGE_ORDER.length; b++) {
      const before = new Set(speakingLessons(STAGE_ORDER[b - 1]).map((l) => l.title.toLowerCase()));
      const after = speakingLessons(STAGE_ORDER[b]).map((l) => l.title.toLowerCase());
      const repeated = after.filter((t) => before.has(t));
      assert.ok(repeated.length <= 2, `${STAGE_ORDER[b]} repeats ${STAGE_ORDER[b - 1]}: ${repeated.join(', ')}`);
    }
  });
});

test('daily quests and ranks for every age', () => {
  // Across a fortnight, Sprouts are never asked to write.
  for (let d = 1; d <= 14; d++) {
    const key = `2026-09-${String(d).padStart(2, '0')}`;
    assert.notEqual(dailyQuest(key, 'foundation').kind, 'write');
  }
  assert.equal(rankFor(0, 'foundation').title, 'Seedling');
  assert.equal(rankFor(0, 'senior').title, 'Whisperer');
  assert.equal(rankFor(0, 'adult').title, 'Starter');
  assert.equal(rankFor(900, 'primary').level, rankFor(900, 'adult').level, 'same thresholds, different names');
});
