import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analysePronunciation, PATTERN_FLOOR, MIN_WORDS } from './pronunciation';

/**
 * SARIRO — the tests are mostly about NOT accusing a child
 * ============================================================================
 * Where the passage and the transcript disagree, one of three things happened:
 * the child mispronounced a word, the recogniser misheard a correct one, or
 * they stumbled. Only the first is worth reporting, and nothing in the data
 * says which it was.
 *
 * So the bar is repetition: the same substitution across different words. A
 * recogniser's errors are scattered; a speaker's are systematic. Most of what
 * follows checks that a single odd word stays quiet.
 */

const REF = 'I think three things about the thought that we shared with everyone today';

describe('analysePronunciation — when it refuses to judge', () => {
  test('a passage too short to judge says so and scores nothing', () => {
    const r = analysePronunciation({ reference: 'read this', transcript: 'read this' });
    assert.equal(r.scored, false);
    assert.equal(r.patterns.length, 0);
  });

  test('silence is not a bad score', () => {
    // A child who pressed record and said nothing has not pronounced anything
    // badly. Scoring them 0% would be a lie about their speech.
    const r = analysePronunciation({ reference: REF, transcript: '' });
    assert.equal(r.scored, false);
  });

  test('the reference must be long enough to contain a pattern at all', () => {
    assert.ok(MIN_WORDS >= 8);
  });
});

describe('a clean read', () => {
  const r = analysePronunciation({ reference: REF, transcript: REF });

  test('scores 100 and finds nothing', () => {
    assert.equal(r.accuracy, 100);
    assert.equal(r.patterns.length, 0);
  });

  test('says so, rather than going silent', () => {
    assert.equal(r.notes[0].kind, 'good');
    assert.match(r.notes[0].text, /clearly|exactly right/);
  });

  test('never reports a fault on a perfect read', () => {
    assert.equal(r.notes.some((n) => n.kind === 'fix'), false);
  });
});

describe('the pattern that matters', () => {
  test('th coming out as t across THREE words is reported', () => {
    // think→tink, three→tree, thought→tought. Systematic — a real mouth.
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I tink tree things about the tought that we shared with everyone today',
    });
    assert.ok(r.patterns.length > 0, 'a repeated substitution must be found');
    const p = r.patterns[0];
    assert.equal(p.sound, 'th');
    assert.equal(p.heardAs, 't');
    assert.ok(p.count >= PATTERN_FLOOR);
  });

  test('the note names the words, so a child can hear it back', () => {
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I tink tree things about the tought that we shared with everyone today',
    });
    const fix = r.notes.find((n) => n.kind === 'fix');
    assert.ok(fix);
    assert.match(fix.text, /tink|tree|tought/);
  });

  test('it counts opportunities, not just failures', () => {
    // "3 times out of 4" is honest. "3 times" invites a child to think every
    // th they ever say is wrong.
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I tink tree things about the tought that we shared with everyone today',
    });
    assert.ok(r.patterns[0].opportunities >= r.patterns[0].count);
  });

  test('advice is a physical instruction, not a label', () => {
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I tink tree things about the tought that we shared with everyone today',
    });
    assert.match(r.patterns[0].note, /tongue|teeth/i);
  });
});

describe('what it deliberately stays quiet about', () => {
  test('ONE odd word is not a pattern', () => {
    // The single most important test here. One substitution is noise, and
    // reporting it is how a child stops believing the whole report.
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I tink three things about the thought that we shared with everyone today',
    });
    assert.equal(r.patterns.length, 0, 'one occurrence must never become a finding');
  });

  test('a wild mishearing is blamed on nobody', () => {
    // "thought" -> "elephant" is the microphone having a bad day. No mouth
    // does that, and the confusion table should refuse to explain it.
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I think three things about the elephant that we shared with everyone today',
    });
    assert.equal(r.patterns.length, 0);
  });

  test('words astray with no pattern gets a hedged note, not an accusation', () => {
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I banana lorry things about the piano that we shared with everyone today',
    });
    assert.equal(r.patterns.length, 0);
    const note = r.notes.find((n) => n.kind === 'watch' || n.kind === 'fix');
    assert.ok(note);
    assert.match(note.text, /microphone/, 'must admit it might not be the child');
  });

  test('at most ONE thing to fix is ever shown', () => {
    // Two different real patterns at once — v/w AND th/t.
    const r = analysePronunciation({
      reference: 'we have very vivid views about the three things they think there',
      transcript: 'we have wery wiwid wiews about the tree tings they tink there',
    });
    assert.ok(r.patterns.length >= 1);
    assert.equal(r.notes.filter((n) => n.kind === 'fix').length, 1);
  });
});

describe('alignment, so one stumble does not condemn the rest', () => {
  test('a skipped word does not make every later word wrong', () => {
    // Index-by-index compare would mark everything after the gap as a miss.
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I think things about the thought that we shared with everyone today',
    });
    assert.ok(r.accuracy >= 85, `expected a high score, got ${r.accuracy}`);
  });

  test('an extra word they added is not a pronunciation fault', () => {
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I um think three things about the thought that we shared with everyone today',
    });
    assert.ok(r.accuracy >= 90, `expected a high score, got ${r.accuracy}`);
  });

  test('stopping halfway is reported as coverage, not as errors', () => {
    // A child who read half is not a child who got half wrong.
    const r = analysePronunciation({
      reference: REF,
      transcript: 'I think three things about',
    });
    assert.ok(r.coverage < 60);
    assert.ok(r.accuracy >= 90, `the part they read was right: got ${r.accuracy}`);
    assert.ok(r.notes.some((n) => /read about/.test(n.text)));
  });
});

describe('punctuation and case never count against anybody', () => {
  test('capitals and full stops are ignored', () => {
    const r = analysePronunciation({
      reference: 'I think three things about the thought that we shared.',
      transcript: 'i think three things about the thought that we shared',
    });
    assert.equal(r.accuracy, 100);
  });
});
