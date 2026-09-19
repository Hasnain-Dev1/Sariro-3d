import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { battleScore, bossFor, bossTopic, damageFor, newBattle, nextTier, starsFrom, strike, timeLimit, BOSS_HP } from './boss';
import { modulesFor } from '../maths/tests';
import { gradeTopics } from '../maths/topics';

describe('bosses', () => {
  test('each module of a grade has its own boss', () => {
    const names = Array.from({ length: 10 }, (_, i) => bossFor(i + 1).name);
    assert.equal(new Set(names).size, 10);
  });
  test('every module of every grade has questions to fight with', () => {
    for (let g = 1; g <= 12; g++) {
      for (const m of modulesFor(g)) {
        const pool = m.topics.length ? m.topics : gradeTopics(g);
        assert.ok(pool.length > 0, `g${g} m${m.num}`);
        for (const t of pool) {
          const kind = t.make(1, 1).answer.kind;
          assert.ok(kind !== 'order' && kind !== 'coefficients', `${t.key} needs an input the battle does not have`);
        }
      }
    }
  });
  test('damage: 10 slow, 20 instant, +50% on a long streak', () => {
    assert.equal(damageFor(0, 30, 0), 10);
    assert.equal(damageFor(30, 30, 0), 20);
    assert.equal(damageFor(30, 30, 10), 30);
  });
  test('time runs shorter as the tier rises and the boss gets angry', () => {
    assert.ok(timeLimit(1, false) > timeLimit(2, false));
    assert.ok(timeLimit(2, false) > timeLimit(2, true));
    assert.ok(timeLimit(3, true) >= 15);
  });
});

describe('a battle', () => {
  test('fast right answers win in a handful of hits', () => {
    let b = newBattle();
    let hits = 0;
    while (!b.over) { b = strike(b, true, 30, 30).battle; hits += 1; }
    assert.equal(b.won, true);
    assert.ok(hits >= 4 && hits <= 6, `${hits} hits`);
    assert.equal(battleScore(b), 100);
  });
  test('slow right answers still win, just later', () => {
    let b = newBattle();
    let hits = 0;
    while (!b.over) { b = strike(b, true, 0, 30).battle; hits += 1; }
    assert.ok(b.won && hits <= 10, `${hits} hits`);
  });
  test('three wrong answers lose; the score is the damage done', () => {
    let b = strike(newBattle(), true, 30, 30).battle;
    for (let i = 0; i < 3; i++) b = strike(b, false, 0, 30).battle;
    assert.equal(b.over, true);
    assert.equal(b.won, false);
    assert.equal(battleScore(b), BOSS_HP - b.hp);
    assert.equal(strike(b, true, 30, 30).battle, b, 'nothing happens after the end');
  });
  test('a wrong answer breaks the streak', () => {
    let b = strike(strike(newBattle(), true, 30, 30).battle, true, 30, 30).battle;
    assert.equal(b.combo, 2);
    b = strike(b, false, 0, 30).battle;
    assert.equal(b.combo, 0);
  });
});

describe('the trophy shelf', () => {
  test('stars come from wins only, per grade', () => {
    const at = '2026-09-19T00:00:00Z';
    const attempts = [
      { topic: bossTopic(7, 3, 1), score: 100, createdAt: at },
      { topic: bossTopic(7, 3, 2), score: 100, createdAt: at },
      { topic: bossTopic(7, 3, 3), score: 80, createdAt: at },
      { topic: bossTopic(7, 5, 1), score: 60, createdAt: at },
      { topic: bossTopic(8, 1, 3), score: 100, createdAt: at },
      { topic: 'maths:game:meteor-storm', score: 100, createdAt: at },
    ];
    const stars = starsFrom(attempts, 7);
    assert.equal(stars.get(3), 2);
    assert.equal(stars.has(5), false);
    assert.equal(stars.size, 1);
    assert.equal(nextTier(0), 1);
    assert.equal(nextTier(2), 3);
    assert.equal(nextTier(3), 3);
  });
});
