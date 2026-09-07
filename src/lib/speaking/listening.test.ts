import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyseListening, tokens } from './listening';

/**
 * SARIRO — marking a listening drill without discouraging the listener
 * ============================================================================
 * The failure mode here is not being too lenient. It is marking a child wrong
 * for something they got right — dropping "the", saying "made" for "reached",
 * or a microphone typing "their" when they said "there". A drill that does that
 * teaches parroting, and then teaches them to stop practising.
 *
 * So most of these tests are about what must NOT be counted as a mistake.
 */

const src = 'The committee reached a difficult decision about the new library building.';

describe('what counts as having heard it', () => {
  test('word-perfect scores full recall', () => {
    const r = analyseListening({ source: src, response: src, mode: 'spoken' });
    assert.equal(r.recall.percent, 100);
    assert.deepEqual(r.recall.missed, []);
  });

  /* Dropping "the" and "a" is not a listening failure — those words carry no
     meaning and a transcript without them has lost nothing. */
  test('dropping the small words costs nothing', () => {
    const r = analyseListening({
      source: src,
      response: 'committee reached difficult decision about new library building',
      mode: 'spoken',
    });
    assert.equal(r.recall.percent, 100);
  });

  test('case and punctuation are not the point', () => {
    const r = analyseListening({ source: src, response: src.toUpperCase().replace(/\./g, '!!'), mode: 'typed' });
    assert.equal(r.recall.percent, 100);
  });

  test('a missed content word is named, so it can be taught', () => {
    const r = analyseListening({
      source: src,
      response: 'The committee reached a decision about the new library building.',
      mode: 'spoken',
    });
    assert.ok(r.recall.percent < 100);
    assert.deepEqual(r.recall.missed, ['difficult']);
  });

  test('a word said twice has to come back twice', () => {
    const r = analyseListening({
      source: 'The small dog met the small cat.',
      response: 'The small dog met the cat.',
      mode: 'typed',
    });
    assert.deepEqual(r.recall.missed, ['small']);
  });

  test('nothing back is zero, not a crash', () => {
    const r = analyseListening({ source: src, response: '', mode: 'spoken' });
    assert.equal(r.recall.percent, 0);
    assert.equal(r.score, 0);
    assert.ok(r.notes.length > 0);
  });

  test('an empty passage does not divide by zero', () => {
    const r = analyseListening({ source: '', response: 'anything at all', mode: 'typed' });
    assert.equal(r.recall.total, 0);
    assert.ok(Number.isFinite(r.score));
  });
});

describe('the microphone is not the child', () => {
  /* "their" for "there" means the ear was right and only the transcription was
     not. Marking that wrong is how a learner stops using the microphone. */
  test('a homophone counts as heard', () => {
    const r = analyseListening({
      source: 'There were two of them over there.',
      response: 'Their were too of them over their.',
      mode: 'spoken',
    });
    assert.equal(r.recall.missed.length, 0);
  });

  test('and it is pointed out kindly rather than counted against them', () => {
    const r = analyseListening({
      source: 'They went to the sea.',
      response: 'They went to the see.',
      mode: 'spoken',
    });
    assert.ok(r.homophones.length > 0);
    assert.ok(r.notes.some((n) => n.kind === 'good' && /ear was right/i.test(n.text)));
  });
});

describe('order is scored on its own', () => {
  /* "the dog bit the man" and "the man bit the dog" share every word and mean
     opposite things. Recall alone cannot tell them apart. */
  test('the same words in the wrong order lose sequence, not recall', () => {
    const r = analyseListening({
      source: 'The dog bit the man in the garden.',
      response: 'The garden man bit the dog in the.',
      mode: 'typed',
    });
    assert.equal(r.recall.percent, 100);
    assert.ok(r.sequence.percent < 100, `sequence was ${r.sequence.percent}`);
  });

  test('right order scores full sequence', () => {
    const r = analyseListening({ source: src, response: src, mode: 'typed' });
    assert.equal(r.sequence.percent, 100);
  });

  test('a jumbled answer is told to slow down rather than just marked wrong', () => {
    const r = analyseListening({
      source: 'First we measured the water, then we heated it, then we recorded the temperature.',
      response: 'Temperature recorded heated water measured first then',
      mode: 'typed',
    });
    assert.ok(r.notes.some((n) => /one sentence at a time/i.test(n.text)));
  });
});

describe('words that were never said', () => {
  test('invented words are counted', () => {
    const r = analyseListening({
      source: 'The committee reached a decision.',
      response: 'The committee reached a unanimous historic controversial decision.',
      mode: 'typed',
    });
    assert.equal(r.invented.count, 3);
  });

  test('and guessing is named as guessing', () => {
    const r = analyseListening({
      source: 'The dog barked.',
      response: 'The enormous angry frightened dog barked loudly outside',
      mode: 'typed',
    });
    assert.ok(r.notes.some((n) => /guessing fills gaps/i.test(n.text)));
  });
});

describe('typed answers are held slightly higher than spoken ones', () => {
  /* No microphone to blame, and they could re-read their own sentence. */
  test('the same answer can pass spoken and fall short typed', () => {
    // 5 of the 7 content words — 71%, which sits between the two floors.
    const partial = 'The committee reached a decision about the new building.';
    const spoken = analyseListening({ source: src, response: partial, mode: 'spoken' });
    const typed = analyseListening({ source: src, response: partial, mode: 'typed' });
    assert.equal(spoken.recall.percent, typed.recall.percent);
    assert.equal(spoken.recall.verdict, 'good');
    assert.equal(typed.recall.verdict, 'low');
  });
});

describe('tokens', () => {
  test('apostrophes stay inside a word', () => {
    assert.deepEqual(tokens("don't stop"), ["don't", 'stop']);
  });
  test('empty in, empty out', () => {
    assert.deepEqual(tokens(''), []);
    assert.deepEqual(tokens('   ...  '), []);
  });
});
