import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMessage } from './contact-policy';

/**
 * SARIRO — the rule that keeps a learner's conversation on the platform
 * =========================================================
 * This is the guard against the Codingal failure: teacher and student swap
 * numbers, the relationship moves to WhatsApp, and when the teacher leaves the
 * students follow — invisibly, months after it actually happened.
 *
 * Both directions of error are expensive:
 *
 *   too loose — a number gets through and the conversation leaves the building;
 *   too tight — a teacher cannot send a Meet link, or gets accused of a policy
 *               violation for counting to ten with a six-year-old, and the
 *               teachers stop trusting the system that accused them.
 *
 * The second is the one that quietly kills a rule like this, so most of what
 * follows pins the things that must still go through.
 */

const withStudent = { involvesStudent: true };
const staffOnly = { involvesStudent: false };

describe('what must be refused', () => {
  test('a plain mobile number', () => {
    assert.equal(evaluateMessage('call me on 9876543210', withStudent).verdict, 'block');
  });

  test('the ways people space a number out', () => {
    for (const text of [
      '+91 98765 43210',
      '98765-43210',
      '+919876543210',
      '9 8 7 6 5 4 3 2 1 0',
      'my no is 98765.43210',
      '91-9876543210',
    ]) {
      assert.equal(evaluateMessage(text, withStudent).verdict, 'block', text);
    }
  });

  test('WhatsApp, by name or by link', () => {
    for (const text of [
      'message me on whatsapp',
      'https://wa.me/message/NDAMWOPNYEWGE1',
      'join here chat.whatsapp.com/xyz',
      'add me on whats app',
      'I am on telegram, t.me/someone',
      'discord.gg/abcd',
      'follow me instagram.com/teacher',
    ]) {
      assert.equal(evaluateMessage(text, withStudent).verdict, 'block', text);
    }
  });

  test('an email address, including the dodges', () => {
    for (const text of [
      'mail me at teacher@gmail.com',
      'teacher (at) gmail (dot) com',
    ]) {
      assert.equal(evaluateMessage(text, withStudent).verdict, 'block', text);
    }
  });

  test('a number read aloud as words', () => {
    const text = 'nine eight seven six five four three two one zero';
    assert.equal(evaluateMessage(text, withStudent).verdict, 'block');
  });

  test('the sender is told what happened, never silently dropped', () => {
    const res = evaluateMessage('9876543210', withStudent);
    assert.ok(res.message && res.message.length > 0, 'a refusal must explain itself');
    assert.match(res.message!, /recorded/i, 'and must say the attempt was recorded');
  });
});

describe('what must still go through', () => {
  test('a Google Meet link — its code is not a phone number', () => {
    const res = evaluateMessage('Join here: https://meet.google.com/abc-defg-hij', withStudent);
    assert.equal(res.verdict, 'allow');
  });

  test('ordinary teaching', () => {
    for (const text of [
      'Great work on question 7! See you Tuesday at 5:30 pm.',
      'Your test is on 12/09/2026, chapters 4 to 6.',
      'You scored 18/20 — read pages 100 to 128 before Friday.',
      'The answer is 3.14159265358979',
      'Class moved to 4 pm. Room 402.',
    ]) {
      assert.equal(evaluateMessage(text, withStudent).verdict, 'allow', text);
    }
  });

  test('counting to ten with a small child is not smuggling a number', () => {
    // Ten number-words, but a counting lesson starts at one and a mobile does
    // not. This is the false positive that would make teachers distrust the rule.
    const res = evaluateMessage('one two three four five six seven eight nine ten', withStudent);
    assert.notEqual(res.verdict, 'block');
  });

  test('the allowed links teachers actually send', () => {
    for (const text of [
      'https://docs.google.com/document/d/1234567890abcdef/edit',
      'watch https://youtu.be/dQw4w9WgXcQ',
      'https://scratch.mit.edu/projects/123456789',
      'https://sariro.com/dashboard/student',
    ]) {
      assert.equal(evaluateMessage(text, withStudent).verdict, 'allow', text);
    }
  });
});

describe('flagged, not refused', () => {
  test('the shape of trying, without a number attached', () => {
    const res = evaluateMessage('can you give me your number?', withStudent);
    assert.equal(res.verdict, 'flag', 'it goes through — the pattern over weeks is the signal');
    assert.ok(res.reasons.includes('contact_intent'));
  });

  test('a flagged message still sends, with a reminder', () => {
    const res = evaluateMessage('lets talk outside the platform', withStudent);
    assert.equal(res.verdict, 'flag');
    assert.ok(res.message, 'the sender sees the reminder');
  });
});

describe('the rule binds conversations with a learner in them', () => {
  test('HR passing a number to an admin is ordinary work', () => {
    const res = evaluateMessage('The new teacher is on 9876543210', staffOnly);
    assert.equal(res.verdict, 'allow');
    assert.deepEqual(res.reasons, []);
  });

  test('the identical message is refused once a student is present', () => {
    const text = 'The new teacher is on 9876543210';
    assert.equal(evaluateMessage(text, staffOnly).verdict, 'allow');
    assert.equal(evaluateMessage(text, withStudent).verdict, 'block');
  });
});
