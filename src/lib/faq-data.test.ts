import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { matchFaq, FAQ_KNOWLEDGE_BASE } from './faq-data';

/**
 * SARIRO — the chat only knows what is in this file
 * ============================================================================
 * There is no model behind the site chat. It keyword-matches this knowledge
 * base and nothing else, which has one consequence worth testing for:
 *
 *   A feature that ships without an entry here is a feature the chat will
 *   confidently deny exists.
 *
 * That happened. The trial chain and the practice room both went live while
 * the chat still answered from a knowledge base written before either, so a
 * parent asking "when is my free class" got the generic fallback and the
 * password answer still described a flow that had changed.
 *
 * These tests are phrased the way a parent actually types — lower case, no
 * punctuation, half a sentence — rather than the way the questions are
 * written in the file, because matching its own titles proves nothing.
 */

/** What a match has to be for the chat to use it rather than the fallback. */
const answers = (asked: string, id: string) => {
  const m = matchFaq(asked);
  assert.ok(m, `no match at all for: "${asked}"`);
  assert.equal(m.entry.id, id, `"${asked}" answered with ${m.entry.id}`);
};

describe('the knowledge base itself', () => {
  test('every entry has an id, keywords and a real answer', () => {
    for (const e of FAQ_KNOWLEDGE_BASE) {
      assert.ok(e.id, 'entry with no id');
      assert.ok(e.keywords.length > 0, `${e.id} has no keywords`);
      assert.ok(e.answer.length > 40, `${e.id} has a stub answer`);
      assert.ok(e.priority >= 1 && e.priority <= 10, `${e.id} priority out of range`);
    }
  });

  test('no two entries share an id', () => {
    const ids = FAQ_KNOWLEDGE_BASE.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate id in the knowledge base');
  });
});

describe('trial classes — live Sept 2026', () => {
  test('"where do i see my trial class"', () => {
    answers('where do i see my trial class', 'trial-where-is-it');
  });

  test('"how much time until my free class"', () => {
    // The founder's own words for what was missing from the dashboard.
    const m = matchFaq('how much time remaining until my free class');
    assert.ok(m);
    assert.equal(m.entry.category, 'trial');
  });

  test('"i cant join my trial there is no link"', () => {
    answers('i cant join my trial there is no link', 'trial-join');
  });

  test('"what happens in the free trial"', () => {
    const m = matchFaq('what happens in the free trial');
    assert.ok(m);
    assert.equal(m.entry.category, 'trial');
  });
});

describe('the practice room — live Sept 2026', () => {
  test('"what is the practice room"', () => {
    answers('what is the practice room', 'practice-what-is-it');
  });

  test('"is my voice recorded"', () => {
    // The question a parent asks first, and the one a wrong answer loses them
    // over. It must never fall through to the generic reply.
    answers('is my voice recorded', 'practice-privacy');
  });

  test('"it is not asking for my microphone"', () => {
    answers('it is not asking for my microphone permission', 'practice-mic-not-working');
  });

  test('"am i getting better at speaking"', () => {
    const m = matchFaq('am i getting better at speaking, can i see my progress');
    assert.ok(m);
    assert.equal(m.entry.category, 'practice');
  });
});

describe('the password answer, after the code path shipped', () => {
  test('"forgot my password"', () => {
    answers('i forgot my password', 'auth-reset-password');
  });

  test('"the reset link is not working"', () => {
    // Previously matched nothing useful. This is the exact sentence somebody
    // types the moment the link fails, and the code is the answer to it.
    answers('the reset link is not working', 'auth-reset-password');
  });

  test('the answer mentions the six-digit code, not just the link', () => {
    const m = matchFaq('i forgot my password');
    assert.ok(m);
    assert.match(m.entry.answer, /six[- ]digit/i);
  });
});

describe('nothing new has stolen an old question', () => {
  test('"how much does it cost" is still about pricing', () => {
    const m = matchFaq('how much does it cost');
    assert.ok(m);
    assert.equal(m.entry.category, 'pricing');
  });

  test('"what courses do you offer" is still about courses', () => {
    const m = matchFaq('what courses do you offer');
    assert.ok(m);
    assert.equal(m.entry.category, 'courses');
  });

  test('"how do i contact you" is still contact', () => {
    const m = matchFaq('how do i contact you');
    assert.ok(m);
    assert.equal(m.entry.category, 'contact');
  });
});
