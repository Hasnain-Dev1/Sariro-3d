import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isEffectivelyEmpty, hasWrittenContent } from './content-state';

/**
 * SARIRO — what a child sees when they open a lesson
 * =========================================================
 * Two outcomes, and the wrong one is embarrassing. A page that has not been
 * written should say so in the mentor's voice. A page that HAS been written
 * must never be hidden because a rule here was too eager.
 *
 * The second failure is the worse one, so the borderline cases below lean
 * towards showing the page.
 */

describe('a page that has not been written', () => {
  test('nothing at all', () => {
    assert.equal(isEffectivelyEmpty(''), true);
    assert.equal(isEffectivelyEmpty('   \n  '), true);
    assert.equal(isEffectivelyEmpty(null), true);
    assert.equal(isEffectivelyEmpty(undefined), true);
  });

  /** Exactly what scripts/../seed writes. Forty-seven Python lessons look like this. */
  test('the seeder stub — a heading and nothing else', () => {
    assert.equal(isEffectivelyEmpty('<h1>Variables and Data Types</h1>'), true);
  });

  test('a stub with the tidying a person adds and then abandons', () => {
    assert.equal(isEffectivelyEmpty('<h1>Loops</h1>\n<p></p>\n<p>&nbsp;</p>'), true);
  });

  test('several headings and still no lesson', () => {
    assert.equal(
      isEffectivelyEmpty('<h1>Functions</h1><h2>What we cover</h2><h2>Homework</h2>'),
      true
    );
  });

  test('a heading with a one-word note under it is still not a lesson', () => {
    assert.equal(isEffectivelyEmpty('<h1>Arrays</h1><p>TODO</p>'), true);
  });
});

describe('a page that has been written', () => {
  test('a heading and a real paragraph', () => {
    const html =
      '<h1>Variables</h1><p>A variable is a name for a value your program wants to remember and use later.</p>';
    assert.equal(isEffectivelyEmpty(html), false);
    assert.equal(hasWrittenContent(html), true);
  });

  /**
   * The failure that would be worst: a lesson that is a video and a heading.
   * Stripping tags scores it zero, and the child would be told their lesson
   * does not exist while it sits there in the row.
   */
  test('a lesson that is one embedded video counts as written', () => {
    assert.equal(
      isEffectivelyEmpty('<h1>Setting up VS Code</h1><iframe src="https://youtube.com/embed/x"></iframe>'),
      false
    );
  });

  test('a code sample with no prose counts as written', () => {
    assert.equal(isEffectivelyEmpty('<h1>Hello world</h1><pre><code>print("hi")</code></pre>'), false);
  });

  test('an image counts as written', () => {
    assert.equal(isEffectivelyEmpty('<h1>The box model</h1><img src="/box.png" alt="">'), false);
  });

  test('a table counts as written', () => {
    assert.equal(isEffectivelyEmpty('<h1>Operators</h1><table><tr><td>+</td></tr></table>'), false);
  });

  test('a short list of real bullets counts as written', () => {
    assert.equal(
      isEffectivelyEmpty('<h1>Recap</h1><ul><li>Variables hold values</li><li>Loops repeat work</li></ul>'),
      false
    );
  });
});

describe('the boundary', () => {
  test('just under the threshold is empty, just over is not', () => {
    const short = '<h1>T</h1><p>' + 'a'.repeat(39) + '</p>';
    const long = '<h1>T</h1><p>' + 'a'.repeat(40) + '</p>';
    assert.equal(isEffectivelyEmpty(short), true);
    assert.equal(isEffectivelyEmpty(long), false);
  });

  test('entities do not pad a stub over the line', () => {
    // Sixty characters of markup, no words.
    assert.equal(isEffectivelyEmpty('<h1>X</h1><p>' + '&nbsp;'.repeat(10) + '</p>'), true);
  });

  test('whitespace and newlines do not count as body', () => {
    assert.equal(isEffectivelyEmpty('<h1>X</h1>\n\n<p>\n     \n</p>\n\n<div>\n</div>'), true);
  });

  test('the heading itself never counts, however long the title', () => {
    assert.equal(
      isEffectivelyEmpty('<h1>An Extremely Long Lesson Title That Runs Well Past Forty Characters</h1>'),
      true
    );
  });
});
