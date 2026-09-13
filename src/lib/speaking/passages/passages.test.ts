import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PASSAGES, passageById, wordCount, readingSeconds, READING_WPM } from './index';
import { dealNext, parseSeen } from './deck';
import { wordsOf } from '../analyse';
import { tokens } from '../listening';

describe('the passage library', () => {
  test('at least a hundred passages', () => {
    assert.ok(PASSAGES.length >= 100, `only ${PASSAGES.length}`);
  });

  test('every id, title and text is unique', () => {
    for (const key of ['id', 'title', 'text'] as const) {
      const values = PASSAGES.map((p) => p[key]);
      const dupes = values.filter((v, i) => values.indexOf(v) !== i);
      assert.deepEqual(dupes, [], `duplicate ${key}`);
    }
  });

  test('every passage is about a minute aloud', () => {
    const off = PASSAGES
      .map((p) => ({ id: p.id, words: wordCount(p.text), seconds: readingSeconds(p) }))
      .filter((p) => p.seconds < 52 || p.seconds > 72);
    assert.deepEqual(off, [], `outside 52–72s at ${READING_WPM} wpm`);
  });

  test('no digits — a recogniser hears words, and would mark a correct reading wrong', () => {
    assert.deepEqual(PASSAGES.filter((p) => /\d/.test(p.text)).map((p) => p.id), []);
  });

  test('straight apostrophes only, so words are counted the way the analyser counts them', () => {
    assert.deepEqual(PASSAGES.filter((p) => /[‘’“”]/.test(p.text + p.title)).map((p) => p.id), []);
  });

  test('somewhere to breathe: every passage has at least eight sentences', () => {
    const short = PASSAGES.filter((p) => (p.text.match(/[.!?]["']?(\s|$)/g) ?? []).length < 8).map((p) => p.id);
    assert.deepEqual(short, []);
  });

  test('the analysers read every passage as words', () => {
    for (const p of PASSAGES) {
      assert.ok(wordsOf(p.text).length >= 120, `${p.id}: ${wordsOf(p.text).length} words to the analyser`);
      assert.ok(tokens(p.text).length >= 120, `${p.id}: listening tokens`);
    }
  });

  test('ids are safe to store and log', () => {
    assert.ok(PASSAGES.every((p) => /^[a-z]+-[a-z0-9-]+$/.test(p.id)));
  });

  test('every topic is represented', () => {
    const topics = new Set(PASSAGES.map((p) => p.topic));
    assert.equal(topics.size, 6);
  });

  test('looked up by id', () => {
    assert.equal(passageById(PASSAGES[3].id), PASSAGES[3]);
    assert.equal(passageById('nope'), null);
    assert.equal(passageById(null), null);
  });
});

describe('dealing without repeats', () => {
  const ids = ['a', 'b', 'c', 'd'];
  const seq = (values: number[]) => { let i = 0; return () => values[i++ % values.length]; };

  test('every passage once before any twice', () => {
    let seen: string[] = [];
    const dealt: string[] = [];
    const rand = seq([0.7, 0.1, 0.9, 0.4, 0.2]);
    for (let i = 0; i < ids.length; i++) {
      const next = dealNext(ids, seen, rand);
      dealt.push(next.id);
      seen = next.seen;
    }
    assert.deepEqual([...dealt].sort(), ids);
  });

  test('a finished pass starts again, but never with the passage just read', () => {
    for (const last of ids) {
      const seen = [...ids.filter((x) => x !== last), last];
      for (const r of [0, 0.3, 0.6, 0.99]) {
        const next = dealNext(ids, seen, () => r);
        assert.notEqual(next.id, last);
        assert.deepEqual(next.seen, [next.id]);
      }
    }
  });

  test('a passage that no longer exists is forgotten, not dealt', () => {
    const next = dealNext(ids, ['a', 'gone'], () => 0);
    assert.ok(!next.seen.includes('gone'));
    assert.notEqual(next.id, 'a');
  });

  test('a one-passage deck still deals', () => {
    assert.equal(dealNext(['only'], ['only']).id, 'only');
  });

  test('stored decks are untrusted', () => {
    assert.deepEqual(parseSeen(null), []);
    assert.deepEqual(parseSeen('not json'), []);
    assert.deepEqual(parseSeen('{"a":1}'), []);
    assert.deepEqual(parseSeen('["a", 3, "b"]'), ['a', 'b']);
  });

  test('the real library deals a full pass with no repeats', () => {
    let seen: string[] = [];
    const dealt = new Set<string>();
    const all = PASSAGES.map((p) => p.id);
    for (let i = 0; i < all.length; i++) {
      const next = dealNext(all, seen);
      assert.ok(!dealt.has(next.id), `repeated ${next.id}`);
      dealt.add(next.id);
      seen = next.seen;
    }
    assert.equal(dealt.size, all.length);
  });
});
