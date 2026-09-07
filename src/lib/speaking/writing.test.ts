import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyseWriting, sentences, syllables, words } from './writing';

/**
 * SARIRO — grading the craft, never the ideas
 * ============================================================================
 * A number on a child's ideas is a number they will argue with and learn
 * nothing from. Everything measured here is countable and fixable by Friday:
 * sentence variety, repeated openers, hedges, passive constructions, shape.
 *
 * The rule this must never break: a long sentence is not a mistake. Long
 * sentences are how complex ideas get expressed, and a checker that punishes
 * them produces writing made of stubs.
 */

describe('splitting it up', () => {
  test('sentences split on terminal punctuation', () => {
    assert.equal(sentences('One. Two! Three?').length, 3);
  });

  /* "Dr. Rao said so." is one sentence. Splitting it quietly halves every
     average on the page. */
  test('an abbreviation does not end a sentence', () => {
    assert.equal(sentences('Dr. Rao said so. Then he left.').length, 2);
    assert.equal(sentences('We met Mr. and Mrs. Iyer today.').length, 1);
  });

  test('trailing quotes and brackets stay with their sentence', () => {
    assert.equal(sentences('He said "stop." Then he ran.').length, 2);
  });

  test('empty text has no sentences and no crash', () => {
    assert.deepEqual(sentences(''), []);
    assert.deepEqual(words(''), []);
  });

  test('syllables are roughly right, which is enough', () => {
    assert.equal(syllables('cat'), 1);
    assert.equal(syllables('water'), 2);
    assert.equal(syllables('beautiful'), 3);
    assert.ok(syllables('') >= 1);
  });
});

describe('variety, not length', () => {
  /* The rule that must not break. */
  test('a long sentence on its own is not marked wrong', () => {
    const r = analyseWriting(
      'The rain began early that morning and kept on through the afternoon, ' +
      'filling the drains until they overflowed across the road. We stayed in. ' +
      'Later it stopped.'
    );
    assert.ok(!r.notes.some((n) => n.kind === 'fix' && /too long/i.test(n.text)));
    assert.equal(r.sentenceLength.verdict, 'good');
  });

  test('sentences that are all the same length are called out', () => {
    const r = analyseWriting(
      'The dog ran fast today. The cat sat down there. The bird flew away now. The fish swam around then.'
    );
    assert.equal(r.sentenceLength.verdict, 'low');
    assert.ok(r.notes.some((n) => /droning|change of pace/i.test(n.text)));
  });

  test('good variety is praised with the actual numbers', () => {
    const r = analyseWriting(
      'It rained. The whole afternoon disappeared into a grey blur of water against the window, ' +
      'and nobody moved from the sofa for hours. Then it stopped, and we went out into a street ' +
      'that smelled completely new.'
    );
    assert.ok(r.sentenceLength.variety >= 6, `variety was ${r.sentenceLength.variety}`);
    assert.ok(r.notes.some((n) => n.kind === 'good' && /variety/i.test(n.text)));
  });

  test('a genuinely overlong average is flagged', () => {
    /* Long AND varied — 20, 34 and 42 words. Uniformly long sentences trip the
       monotony check first, which is deliberate: sameness is the more
       actionable fault. 'high' is for prose that varies its rhythm and is
       still heavy, which is a different problem and a different fix. */
    const r = analyseWriting(
      'The committee met on Tuesday and argued for three hours about a proposal nobody in the room had actually read. ' +
      'By the end of the afternoon they had agreed to postpone the decision until the following month, which gave ' +
      'everybody time to prepare arguments they had already made twice before in almost identical words. ' +
      'The minutes ran to nineteen pages and recorded, among a great many other things of no consequence whatever, ' +
      'that the chairman had at one point stopped the discussion to ask whether anybody present could still ' +
      'remember what the original question had been.'
    );
    assert.ok(r.sentenceLength.variety >= 3, `variety ${r.sentenceLength.variety}`);
    assert.ok(r.sentenceLength.average > 28, `avg ${r.sentenceLength.average}`);
    assert.equal(r.sentenceLength.verdict, 'high');
    assert.ok(r.notes.some((n) => /full stop in the middle/i.test(n.text)));
  });
});

describe('the words that take the weight out', () => {
  test('hedges are counted and quoted back', () => {
    const r = analyseWriting(
      'It was really very good actually. I just think it was basically quite nice. The stuff was fine.'
    );
    assert.ok(r.hedging.count >= 5, `found ${r.hedging.count}`);
    assert.ok(r.notes.some((n) => /soft words/i.test(n.text)));
  });

  test('one hedge is not a problem', () => {
    const r = analyseWriting('The result was quite unexpected. We had prepared for the opposite outcome entirely.');
    assert.ok(!r.notes.some((n) => /soft words/i.test(n.text)));
  });
});

describe('who did the thing', () => {
  test('passive constructions are found and shown', () => {
    const r = analyseWriting('Mistakes were made. The ball was thrown by someone. The window was broken.');
    assert.ok(r.passive.count >= 2, `found ${r.passive.count}`);
    assert.ok(r.notes.some((n) => /by whom/i.test(n.text)));
    assert.ok(r.passive.examples.length > 0);
  });

  test('active writing is left alone', () => {
    const r = analyseWriting('Ravi threw the ball. It broke the window. His mother heard the crash from the kitchen.');
    assert.equal(r.passive.count, 0);
  });
});

describe('leaning on the same word', () => {
  test('sentences starting the same way, back to back', () => {
    const r = analyseWriting('Then we ate. Then we slept. Then we woke up again and it was raining hard.');
    assert.ok(r.repetition.repeatedOpeners.length > 0);
    assert.ok(r.notes.some((n) => /start with/i.test(n.text)));
  });

  test('an overused content word is named with its count', () => {
    const r = analyseWriting(
      'The garden was lovely. The garden had roses. I walked through the garden every morning. ' +
      'My garden is small but the garden is mine.'
    );
    assert.ok(r.repetition.overused.some((o) => o.word === 'garden'));
    assert.ok(r.notes.some((n) => /appears \d+ times/i.test(n.text)));
  });

  test('common words are not counted as overuse', () => {
    const r = analyseWriting('The cat sat on the mat and the dog sat on the floor and the bird watched them both.');
    assert.ok(!r.repetition.overused.some((o) => ['the', 'and', 'on'].includes(o.word)));
  });
});

describe('shape and readability', () => {
  test('one long block is told to break', () => {
    // The note fires past 140 words; twelve nine-word sentences is only 108.
    const r = analyseWriting(Array(20).fill('This is a sentence with several words in it.').join(' '));
    assert.equal(r.paragraphs, 1);
    assert.ok(r.words > 140, `only ${r.words} words`);
    assert.ok(r.notes.some((n) => /somewhere to breathe/i.test(n.text)));
  });

  test('paragraph breaks are counted', () => {
    const r = analyseWriting('First idea here.\n\nSecond idea here.\n\nThird idea here.');
    assert.equal(r.paragraphs, 3);
  });

  test('readability comes with words, not just a number', () => {
    const r = analyseWriting('The cat sat on the mat. The dog ran home. It was fun.');
    assert.ok(r.readability.summary.length > 0);
    assert.ok(Number.isFinite(r.readability.grade));
  });
});

describe('the edges', () => {
  test('too short to judge says so instead of scoring it', () => {
    const r = analyseWriting('Hello there.');
    assert.ok(r.notes.some((n) => /too short/i.test(n.text)));
  });

  test('empty text does not throw or produce NaN', () => {
    const r = analyseWriting('');
    assert.equal(r.words, 0);
    assert.equal(r.sentences, 0);
    assert.ok(Number.isFinite(r.score));
    assert.ok(Number.isFinite(r.readability.grade));
  });

  test('the score stays in range whatever it is given', () => {
    for (const t of ['', 'Hi.', Array(40).fill('Very really just basically stuff was done by them.').join(' ')]) {
      const r = analyseWriting(t);
      assert.ok(r.score >= 0 && r.score <= 100, `${r.score}`);
    }
  });

  test('clean writing gets told there is nothing to fix', () => {
    const r = analyseWriting(
      'Ravi threw the ball. It struck the window and the glass came apart in one long crack ' +
      'that ran from the corner to the middle. His mother heard it from the kitchen and said nothing at all.'
    );
    assert.ok(r.notes.some((n) => n.kind === 'good'));
  });
});
