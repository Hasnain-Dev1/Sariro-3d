import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { describeChoice } from '@/lib/demo/learner-choice';

/**
 * SARIRO — the labels the demand charts render
 * =========================================================
 * `fetchDemand` itself talks to Supabase and is not unit-testable without a
 * database, but the part that can silently go wrong without anyone noticing is
 * the LABELLING: a chart axis that reads "mathematics" or "grade-8" instead of
 * "Mathematics" and "Grade 8" is a slug leaking into a dashboard an owner
 * shows other people.
 *
 * The panel derives its subject labels by calling describeChoice with only a
 * subject — a narrow contract that is easy to break by accident when
 * describeChoice grows, and that nothing else in the app exercises.
 */

describe('demand chart labels', () => {
  test('a subject alone renders as just that subject', () => {
    // This is exactly how demand-data.ts labels the subject chart. If
    // describeChoice ever starts appending something when focus and stage are
    // absent, the axis would read "Mathematics — null" and this catches it.
    assert.equal(describeChoice('mathematics', null, null, null), 'Mathematics');
    assert.equal(describeChoice('coding', null, null, null), 'Coding & AI');
    assert.equal(describeChoice('public-speaking', null, null, null), 'Public Speaking');
  });

  test('an unrecognised subject never renders as an empty bar label', () => {
    // A slug from an older row, or one retired from the catalogue: the chart
    // must still print something rather than an empty axis entry.
    const out = describeChoice('some-retired-subject', null, null, null);
    assert.ok(out.length > 0);
    assert.equal(out, 'No preference');
  });

  test('the recent list stays readable for every combination the form can produce', () => {
    const cases: [string | null, string | null, string | null, number | null][] = [
      ['mathematics', 'grade-8', 'school', 8],
      ['physics', 'mechanics', 'undergraduate', null],
      ['coding', 'python', 'professional', null],
      ['english', null, 'postgraduate', null],
      [null, null, 'school', 5],
      [null, null, null, null],
    ];
    for (const [s, f, st, g] of cases) {
      const out = describeChoice(s, f, st, g);
      assert.ok(out.length > 0, `empty label for ${JSON.stringify([s, f, st, g])}`);
      // No raw slug should ever reach the screen.
      assert.ok(!/[a-z]+-[a-z]+/.test(out), `slug leaked: ${out}`);
      assert.ok(!out.includes('null'), `null leaked: ${out}`);
    }
  });
});
