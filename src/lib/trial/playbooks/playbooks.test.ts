import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { trialSubjects } from '@/lib/trial/subjects';
import { optionsFor } from '@/lib/dashboard/course-options';
import { soundPattern } from '@/lib/speaking/sounds';
import { PLAYBOOKS, playbookFor } from './index';
import { rankPaths, bandOf, startingLevel, warmUpsFor, cleanIntake } from './recommend';
import type { Level } from './types';

const LEVELS: Level[] = ['new', 'some', 'strong'];

describe('every trial a family can book has a plan', () => {
  test('one playbook per trial subject, and no playbook for a subject nobody can book', () => {
    const offered = trialSubjects().map((s) => s.value).sort();
    const planned = PLAYBOOKS.map((p) => p.subject).sort();
    assert.deepEqual(planned, offered);
  });

  test('a trial booked on a specific coding track still gets the coding plan', () => {
    const track = optionsFor('coding')[0].value;
    assert.equal(playbookFor(track)?.subject, 'coding');
    assert.equal(playbookFor('Mathematics')?.subject, 'mathematics');
    assert.equal(playbookFor(''), null);
    assert.equal(playbookFor('underwater-basket-weaving'), null);
  });
});

for (const p of PLAYBOOKS) {
  describe(`${p.title} playbook`, () => {
    test('real alternatives: at least three paths, unique ids, and every level has somewhere to go', () => {
      assert.ok(p.paths.length >= 3, `${p.paths.length} paths`);
      assert.equal(new Set(p.paths.map((x) => x.id)).size, p.paths.length);
      for (const level of LEVELS) assert.ok(p.paths.some((x) => x.levels.includes(level)), `no path for “${level}”`);
    });

    test('every path is complete and fits a thirty-minute trial', () => {
      const interestIds = new Set(p.intake.interests.map((i) => i.id));
      for (const path of p.paths) {
        assert.ok(path.steps.length >= 3, `${path.id} steps`);
        const minutes = path.steps.reduce((n, s) => n + s.minutes, 0);
        assert.ok(minutes >= 14 && minutes <= 20, `${path.id} core is ${minutes} minutes`);
        assert.ok(path.levels.length > 0 && path.bands.length > 0, path.id);
        assert.ok(path.ifStuck.length > 0 && path.ifFlying.length > 0 && path.showOff && path.win, path.id);
        for (const i of path.interests) assert.ok(interestIds.has(i), `${path.id} points at unknown interest “${i}”`);
        for (const tool of path.tools ?? []) {
          if (tool.href) assert.match(tool.href, /^(https:\/\/|\/)/, `${path.id} tool link`);
          for (const s of tool.soundLab ?? []) assert.ok(soundPattern(s), `${path.id} unknown sound “${s}”`);
        }
      }
      // Opening, core, close: the whole class stays near thirty minutes.
      const longest = Math.max(...p.paths.map((x) => x.steps.reduce((n, s) => n + s.minutes, 0)));
      assert.ok(p.opening.minutes + longest + p.close.minutes <= 32);
    });

    test('warm-ups have a right answer and an explanation, and diagnosis covers all three levels', () => {
      assert.ok(p.intake.warmUps.length >= 3);
      for (const w of p.intake.warmUps) {
        assert.ok(w.answer >= 0 && w.answer < w.options.length, w.q);
        assert.ok(w.explain.length > 10, w.q);
      }
      assert.ok(p.diagnose.length >= 2);
      for (const d of p.diagnose) assert.deepEqual([...new Set(d.listenFor.map((l) => l.means))].sort(), [...LEVELS].sort(), d.ask);
      assert.deepEqual(p.intake.experience.map((e) => e.id), LEVELS);
      for (const level of LEVELS) assert.ok(p.parentTalk[level].length > 40);
      assert.ok(p.intake.interests.length >= 3 && p.avoid.length >= 2);
    });
  });
}

describe('choosing a path', () => {
  const coding = playbookFor('coding')!;

  test('grade bands', () => {
    assert.equal(bandOf(2), 'foundation');
    assert.equal(bandOf(5), 'primary');
    assert.equal(bandOf(8), 'middle');
    assert.equal(bandOf(11), 'senior');
    assert.equal(bandOf(13), 'adult');
    assert.equal(bandOf(null), null);
  });

  test('a young beginner who likes games starts on the Scratch game', () => {
    const top = rankPaths(coding, { grade: 3, intake: { experience: 'new', interests: ['games'] } })[0];
    assert.equal(top.path.id, 'scratch-catch');
    assert.ok(top.reasons.some((r) => /games/.test(r)));
  });

  test('a teenager into AI who already codes gets the chatbot, and paths for small children go last', () => {
    const ranked = rankPaths(coding, { grade: 11, intake: { experience: 'some', interests: ['ai'] } });
    assert.equal(ranked[0].path.id, 'python-chatbot');
    const firstOff = ranked.findIndex((r) => r.offBand);
    assert.ok(firstOff > 0 && ranked.slice(firstOff).every((r) => r.offBand), 'off-band paths are all at the end');
    assert.equal(ranked.length, coding.paths.length, 'nothing is hidden');
  });

  test('with nothing known, every path is offered in the written order', () => {
    const ranked = rankPaths(coding, { grade: null });
    assert.deepEqual(ranked.map((r) => r.path.id), rankPaths(coding, { grade: undefined }).map((r) => r.path.id));
    assert.ok(ranked.every((r) => !r.offBand));
  });

  test('the warm-up nudges the starting level', () => {
    assert.equal(startingLevel(null), 'some');
    assert.equal(startingLevel({ experience: 'new', warmUp: { correct: 3, total: 3 } }), 'some');
    assert.equal(startingLevel({ experience: 'strong', warmUp: { correct: 0, total: 3 } }), 'some');
    assert.equal(startingLevel({ experience: 'some', warmUp: { correct: 2, total: 3 } }), 'some');
  });

  test('warm-ups for a child: their band first, three of them', () => {
    const young = warmUpsFor(coding, 3);
    assert.equal(young.length, 3);
    assert.ok(young[0].bands?.includes('foundation'));
    assert.ok(warmUpsFor(coding, 11).every((w) => !w.bands || w.bands.includes('senior')));
  });

  test('what a family sends is cleaned before anyone trusts it', () => {
    const clean = cleanIntake(coding, {
      experience: 'expert', interests: ['games', 'games', 'hacking', 7], feeling: 9, question: '  Can I make Minecraft?  ',
      warmUp: { correct: 5, total: 3 }, micOk: 'yes',
    });
    assert.deepEqual(clean, { interests: ['games'], question: 'Can I make Minecraft?' });
    assert.deepEqual(cleanIntake(coding, { experience: 'new', feeling: 4, warmUp: { correct: 2, total: 3 }, micOk: true }),
      { experience: 'new', feeling: 4, warmUp: { correct: 2, total: 3 }, micOk: true });
    assert.deepEqual(cleanIntake(null, 'junk'), {});
  });
});
