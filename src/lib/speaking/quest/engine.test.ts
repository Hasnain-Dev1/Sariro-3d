import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { PracticeAttempt } from '@/lib/speaking/progress';
import { allSpeakingLessons } from '@/lib/speaking/modules';
import { soundPattern } from '@/lib/speaking/sounds';
import { ARENA } from './arena';
import { WORLDS, SHOWCASES, twisterFor } from './worlds';
import { homeworkFor, missionStatus, levelStatus, showcaseMissions, goalMet, LOG_KIND, type Mission } from './homework';
import { questState, streakOf, rankFor, dailyQuest, dayKey, XP } from './engine';

const lessons = allSpeakingLessons();
const IST = -330;
const at = (iso: string) => iso;

function attempt(drillId: string, score: number, createdAt: string, metrics: Record<string, number> = {}, kind: PracticeAttempt['kind'] = 'speaking'): PracticeAttempt {
  return { kind, drillId, score, metrics, createdAt };
}

/** Enough passing tries to clear a mission, one per minute. */
function clear(m: Mission, day: string, score = 80): PracticeAttempt[] {
  const metrics = m.goal ? { [m.goal.key]: m.goal.min ?? (m.goal.max !== undefined ? 0 : 0) } : {};
  if (m.goal?.key === 'wpm') metrics.wpm = 140;
  if (m.goal?.key === 'words') metrics.words = 200;
  return Array.from({ length: m.attempts }, (_, i) => attempt(m.id, score, `${day}T10:0${i}:00Z`, metrics, LOG_KIND[m.kind]));
}

describe('the course as a map', () => {
  test('eight worlds, one per module', () => {
    assert.deepEqual(WORLDS.map((w) => w.num), [1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('every lesson has a class game, and no game points at a lesson that does not exist', () => {
    const numbers = new Set(lessons.map((l) => l.number));
    for (const l of lessons) assert.ok(ARENA[l.number], `lesson ${l.number} “${l.title}” has no class game`);
    for (const n of Object.keys(ARENA).map(Number)) assert.ok(numbers.has(n), `game for missing lesson ${n}`);
    assert.ok(!ARENA[24] && !ARENA[48], 'the assessment slots are showcases, not lessons');
  });

  test('every lesson has a warm-up twister', () => {
    for (const l of lessons) assert.ok(twisterFor(l.number).text.length > 10);
  });
});

describe('homework', () => {
  test('every lesson has speaking, listening and writing, each with tries and a pass mark', () => {
    const ids = new Set<string>();
    for (const l of lessons) {
      const hw = homeworkFor(l);
      const kinds = new Set(hw.map((m) => m.kind));
      assert.ok(kinds.has('speak') && kinds.has('listen') && kinds.has('write'), l.key);
      for (const m of hw) {
        assert.ok(!ids.has(m.id), `duplicate mission id ${m.id}`);
        ids.add(m.id);
        assert.ok(m.attempts >= 1 && m.attempts <= 5, m.id);
        assert.ok(m.pass >= 50 && m.pass <= 95, m.id);
        if (m.kind === 'speak') assert.equal(m.drill?.id, m.id, 'speaking attempts must log under the mission id');
        if (m.kind === 'listen') assert.ok(m.passage && m.passage.split(' ').length >= 8, m.id);
        if (m.kind === 'sound') assert.ok(soundPattern(m.pattern!), m.id);
      }
    }
  });

  test('a lesson with Sound Lab patterns gets a sound mission for each', () => {
    const l = lessons.find((x) => x.soundLab?.includes('q'))!;
    assert.ok(homeworkFor(l).some((m) => m.kind === 'sound' && m.pattern === 'q'));
  });

  /* Grades 7–9's marks: speak 65, listen and write 70. The arithmetic below is
     written against them; the older bands ask more (see stages.test.ts). */
  const hw = homeworkFor(lessons[0], 'middle');
  const speak = hw.find((m) => m.kind === 'speak')!;

  test('passing needs the tries AND a passing score', () => {
    const two = [attempt(speak.id, 90, at('2026-09-01T10:00:00Z'), { wpm: 140 }), attempt(speak.id, 92, at('2026-09-01T10:05:00Z'), { wpm: 140 })];
    assert.equal(missionStatus(speak, two).passed, false, 'two great tries of three is not done');
    assert.equal(missionStatus(speak, two).triesLeft, 1);
    const three = [...two, attempt(speak.id, 40, at('2026-09-01T10:09:00Z'), { wpm: 140 })];
    const s = missionStatus(speak, three);
    assert.equal(s.passed, true);
    assert.equal(s.stars, 3);
    assert.equal(s.records[0].score, 40, 'records are newest first');
  });

  test('a silent recording cannot pass, however the score came out', () => {
    const silent = [0, 1, 2].map((i) => attempt(speak.id, 99, `2026-09-01T10:0${i}:00Z`, {}));
    assert.equal(missionStatus(speak, silent).passed, false);
  });

  test('stars: one for a pass, two for pass+10, three for 90', () => {
    const rows = (score: number) => [0, 1, 2].map((i) => attempt(speak.id, score, `2026-09-01T10:0${i}:00Z`, { wpm: 140 }));
    assert.equal(missionStatus(speak, rows(66)).stars, 1);
    assert.equal(missionStatus(speak, rows(76)).stars, 2);
    assert.equal(missionStatus(speak, rows(91)).stars, 3);
    assert.equal(missionStatus(speak, rows(50)).stars, 0);
  });

  test('goals with a ceiling', () => {
    assert.equal(goalMet({ key: 'fillersPerMin', max: 4, label: '' }, { fillersPerMin: 3 }), true);
    assert.equal(goalMet({ key: 'fillersPerMin', max: 4, label: '' }, { fillersPerMin: 6 }), false);
    assert.equal(goalMet({ key: 'fillersPerMin', max: 4, label: '' }, {}), false);
  });

  test('a level clears only when every mission passes, and is as good as its weakest mission', () => {
    const attempts = hw.flatMap((m, i) => clear(m, '2026-09-02', i === 0 ? 95 : 72));
    const st = levelStatus(hw, attempts);
    assert.equal(st.cleared, true);
    assert.equal(st.stars, 1);
    assert.equal(levelStatus(hw, attempts.slice(1)).cleared, false);
  });

  test('showcases have a performance with a filler ceiling', () => {
    for (const s of SHOWCASES) {
      const perf = showcaseMissions(s).find((m) => m.kind === 'speak')!;
      assert.equal(perf.goal?.key, 'fillersPerMin');
    }
  });
});

describe('streaks', () => {
  const rows = (...days: string[]) => days.map((d) => attempt('x', 50, `${d}T06:00:00Z`));
  const now = Date.parse('2026-09-14T08:00:00Z');

  test('counts back from today, or from yesterday while today is still open', () => {
    assert.deepEqual(streakOf(rows('2026-09-12', '2026-09-13', '2026-09-14'), now, IST), { current: 3, best: 3, today: true });
    assert.deepEqual(streakOf(rows('2026-09-12', '2026-09-13'), now, IST), { current: 2, best: 2, today: false });
    assert.equal(streakOf(rows('2026-09-10', '2026-09-11'), now, IST).current, 0);
  });

  test('uses the learner’s own day, not UTC', () => {
    // 20:00 UTC on the 13th is 01:30 on the 14th in India.
    const late = [attempt('x', 50, '2026-09-13T20:00:00Z')];
    assert.equal(dayKey(Date.parse('2026-09-13T20:00:00Z'), IST), '2026-09-14');
    assert.equal(streakOf(late, now, IST).today, true);
  });

  test('best remembers an old run', () => {
    assert.equal(streakOf(rows('2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-09-14'), now, IST).best, 4);
  });
});

test('ranks', () => {
  assert.equal(rankFor(0).title, 'Whisperer');
  assert.equal(rankFor(299).title, 'Whisperer');
  assert.equal(rankFor(300).title, 'Voice');
  assert.equal(rankFor(50000).next, null);
  assert.ok(Math.abs(rankFor(550).progress - 0.5) < 1e-9);
});

test('the daily quest is the same all day and rotates through kinds', () => {
  assert.deepEqual(dailyQuest('2026-09-14'), dailyQuest('2026-09-14'));
  const kinds = new Set(['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'].map((d) => dailyQuest(d).kind));
  assert.ok(kinds.size >= 4);
  for (const d of ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']) {
    const q = dailyQuest(d);
    assert.equal(q.id, `dq:${d}`);
    if (q.kind === 'speak') assert.equal(q.drill?.id, q.id);
  }
});

describe('questState', () => {
  const now = Date.parse('2026-09-14T08:00:00Z');

  test('nothing done is a clean start', () => {
    const s = questState([], lessons, { now, offsetMinutes: IST });
    assert.equal(s.xp, 0);
    assert.equal(s.rank.title, 'Whisperer');
    assert.equal(s.totalLevels, 46);
    assert.equal(s.levelsCleared, 0);
    assert.ok(s.badges.every((b) => !b.earned));
    assert.ok(s.showcases.every((x) => !x.unlocked));
  });

  test('clearing a level earns its missions, stars, the clear bonus, badges and effort', () => {
    const hw = homeworkFor(lessons[0], 'middle');
    const attempts = hw.flatMap((m) => clear(m, '2026-09-14', 80));
    const s = questState(attempts, lessons, { now, offsetMinutes: IST, stage: 'middle' });
    assert.equal(s.levelsCleared, 1);
    const missionXp = hw.reduce((n, m) => n + m.xp + 2 * XP.starBonus, 0);
    const effort = Math.min(XP.attemptDailyCap, attempts.length * XP.attempt) + XP.activeDay;
    const badges = s.badges.filter((b) => b.earned).length;
    assert.equal(s.xp, missionXp + XP.levelCleared + effort + badges * XP.badge);
    assert.ok(s.badges.find((b) => b.id === 'triple-threat')!.earned);
    assert.equal(s.streak.current, 1);
  });

  test('effort XP is capped per day, so spamming earns nothing extra', () => {
    const spam = Array.from({ length: 200 }, (_, i) => attempt('free', 10, `2026-09-14T09:${String(i % 60).padStart(2, '0')}:00Z`));
    const s = questState(spam, lessons, { now, offsetMinutes: IST });
    const badges = s.badges.filter((b) => b.earned).length;
    assert.equal(s.xp, XP.attemptDailyCap + XP.activeDay + badges * XP.badge);
  });

  test('the daily quest pays out, including past days', () => {
    const today = dailyQuest('2026-09-14');
    const past = dailyQuest('2026-09-10');
    const s = questState([...clear(today, '2026-09-14', 90), ...clear(past, '2026-09-10', 90)], lessons, { now, offsetMinutes: IST });
    assert.equal(s.daily.passed, true);
    assert.ok(s.xp >= today.xp + past.xp);
  });

  test('a showcase unlocks after twelve cleared levels in its worlds', () => {
    const first12 = lessons.filter((l) => l.moduleNum <= 4).slice(0, 12);
    const attempts = first12.flatMap((l) => homeworkFor(l).flatMap((m) => clear(m, '2026-09-13')));
    const s = questState(attempts, lessons, { now, offsetMinutes: IST });
    assert.equal(s.showcases[0].unlocked, true);
    assert.equal(s.showcases[1].unlocked, false);
  });
});
