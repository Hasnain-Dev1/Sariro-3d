import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STORIES, storyAsPath, storyFor, STORY_PATH_ID } from './index';
import { trialSubjects } from '../subjects';

describe('trial stories', () => {
  test('every trial subject has a story for every grade a family can book', () => {
    for (const s of trialSubjects()) {
      for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, null]) {
        const st = storyFor(s.value, g);
        assert.ok(st, `${s.value} grade ${g} has no story`);
        assert.equal(st!.subject, s.value);
      }
    }
  });

  test('Mathematics, English and Coding have their own story for each of Grades 1–12', () => {
    for (const subject of ['mathematics', 'english', 'coding']) {
      for (let g = 1; g <= 12; g++) assert.equal(storyFor(subject, g)!.grade, g, `${subject} grade ${g}`);
    }
    for (const subject of ['physics', 'chemistry', 'biology']) {
      for (let g = 7; g <= 12; g++) assert.equal(storyFor(subject, g)!.grade, g, `${subject} grade ${g}`);
    }
    for (let g = 1; g <= 6; g++) assert.equal(storyFor('science', g)!.grade, g);
  });

  test('a coding track still finds the coding story', () => {
    assert.equal(storyFor('web', 8)!.subject, 'coding');
  });

  test('each story is complete, and one subject never repeats a grade or a title', () => {
    const keys = new Set<string>();
    const titles = new Set<string>();
    for (const st of STORIES) {
      const where = `${st.subject} g${st.grade}`;
      assert.ok(!keys.has(`${st.subject}:${st.grade}`), `${where} twice`);
      keys.add(`${st.subject}:${st.grade}`);
      assert.ok(!titles.has(st.title), `title "${st.title}" twice`);
      titles.add(st.title);
      for (const text of [st.title, st.emoji, st.role, st.hook, st.mission, st.stretch, st.cliffhanger, st.win, st.skill]) {
        assert.ok(text && text.trim().length > 0, `${where} has an empty field`);
      }
      assert.equal(st.chapters.length, 3, where);
      const minutes = st.chapters.reduce((n, c) => n + c.minutes, 0);
      assert.ok(minutes >= 14 && minutes <= 20, `${where}: ${minutes} minutes`);
      for (const c of st.chapters) {
        assert.ok(c.title.trim(), `${where} has an untitled chapter`);
        for (const text of [c.scene, c.task, c.lookFor, c.nudge]) assert.ok(text.trim().length > 10, `${where} "${c.title}" is thin`);
      }
      assert.ok(st.hook.length <= 260, `${where}: the hook is too long to read aloud (${st.hook.length})`);
    }
    assert.ok(STORIES.length >= 70);
  });

  test('a story becomes a playbook path the class clock can run', () => {
    const p = storyAsPath(storyFor('mathematics', 7)!);
    assert.equal(p.id, STORY_PATH_ID);
    assert.equal(p.steps.length, 4, 'the hook and three chapters');
    assert.equal(p.steps[0].say, storyFor('mathematics', 7)!.hook);
    assert.match(p.showOff, /cliffhanger/);
    assert.deepEqual(p.bands, ['middle']);
  });
});
