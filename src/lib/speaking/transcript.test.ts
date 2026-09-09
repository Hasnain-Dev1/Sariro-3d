import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assembleTranscript, type ResultLike } from './transcript';

/**
 * SARIRO — the bug that inflated every number in the report
 * ============================================================================
 * "The transcription is not correct." It was appending from `e.resultIndex`,
 * which is the first result that CHANGED — not the first one unseen — so any
 * event Chrome re-fired at an already-final index appended that phrase again.
 *
 * Duplicated words are not a cosmetic problem here. Word count, pace and
 * filler count are all derived from this string, so a doubled phrase makes a
 * child look faster and more repetitive than they were.
 */

const res = (...rows: [string, boolean][]): ArrayLike<ResultLike> =>
  rows.map(([transcript, isFinal]) => ({ isFinal, 0: { transcript } }));

describe('assembleTranscript', () => {
  test('finals are joined, interim kept separate', () => {
    const a = assembleTranscript(res(['I think', true], ['we should', false]));
    assert.equal(a.final, 'I think ');
    assert.equal(a.interim, 'we should');
    assert.equal(a.display, 'I think we should');
  });

  test('the same event replayed does not double the words', () => {
    // The whole bug. Chrome re-fires with a resultIndex that is already final;
    // the old code appended it a second time.
    const results = res(['the committee reached a decision', true]);
    const first = assembleTranscript(results);
    const again = assembleTranscript(results);
    assert.equal(first.final, again.final, 'replaying an event must be idempotent');
    assert.equal(again.final.match(/committee/g)!.length, 1);
  });

  test('a growing results list keeps each phrase once', () => {
    // Event 1 has one final; event 2 has that same final plus a new one.
    const a = assembleTranscript(res(['one', true]));
    const b = assembleTranscript(res(['one', true], ['two', true]));
    assert.equal(a.final, 'one ');
    assert.equal(b.final, 'one two ');
  });

  test('interim text is never banked as final', () => {
    // Interim is Chrome guessing. Measuring it counts words that were never
    // said, and it changes on the next event anyway.
    const a = assembleTranscript(res(['definitely', false]));
    assert.equal(a.final, '');
    assert.equal(a.display, 'definitely');
  });

  test('a restarted session continues from what was banked', () => {
    // Chrome gives up after a few seconds of quiet and the lab restarts it.
    // The new session's results list is EMPTY, so without `prior` a 60-second
    // drill keeps only whatever came after the child's last pause.
    const banked = assembleTranscript(res(['before the pause', true])).final;
    const after = assembleTranscript(res(['after the pause', true]), banked);
    assert.equal(after.final, 'before the pause after the pause ');
  });

  test('banking twice does not smear the join', () => {
    let banked = assembleTranscript(res(['one', true])).final;
    banked = assembleTranscript(res(['two', true]), banked).final;
    const out = assembleTranscript(res(['three', true]), banked).final;
    assert.equal(out, 'one two three ');
    assert.doesNotMatch(out, /  /, 'no double spaces');
  });

  test('never starts with a space', () => {
    // A leading space costs a word in a naive splitter and looks like sloppy
    // software in the panel.
    assert.doesNotMatch(assembleTranscript(res(['hello', true]), '').display, /^ /);
    assert.doesNotMatch(assembleTranscript(res(['hello', true]), '   ').display, /^ /);
  });

  test('empty and whitespace-only finals are dropped', () => {
    const a = assembleTranscript(res(['', true], ['   ', true], ['real', true]));
    assert.equal(a.final, 'real ');
  });

  test('no results at all is an empty transcript, not a crash', () => {
    assert.equal(assembleTranscript(res()).display, '');
    assert.equal(assembleTranscript(null).display, '');
    assert.equal(assembleTranscript(undefined).display, '');
  });

  test('a malformed result is skipped rather than throwing mid-recording', () => {
    // A thrown error inside onresult kills the rest of the recording, and the
    // child finds out when they press stop and there is nothing there.
    const rough = [
      { isFinal: true, 0: { transcript: 'good' } },
      { isFinal: true } as unknown as ResultLike,
      { isFinal: true, 0: {} } as unknown as ResultLike,
      { isFinal: true, 0: { transcript: 'also good' } },
    ];
    assert.equal(assembleTranscript(rough).final, 'good also good ');
  });
});
