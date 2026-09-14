import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { codingTierViews, featureLines, courseLevelFor } from './coding-tiers';
import { PRICING_TIERS } from '@/lib/sariro-data';

describe('coding tier cards', () => {
  const group = codingTierViews('1:4');
  const solo = codingTierViews('1:1');

  test('one card per tier, in order, exactly one marked most popular', () => {
    assert.deepEqual(group.map((t) => t.id), PRICING_TIERS.map((t) => t.id));
    assert.equal(group.filter((t) => t.popular).length, 1);
  });

  test('every button goes to a level /courses actually filters by', () => {
    const levels = ['Elementary', 'Beginner', 'Intermediate', 'Advanced'];
    for (const t of group) {
      const level = new URL(t.href, 'https://sariro.com').searchParams.get('level');
      assert.ok(level && levels.includes(level), `${t.id} → ${t.href}`);
    }
    assert.equal(courseLevelFor('expert'), 'Advanced');
    assert.equal(group.find((t) => t.id === 'intermediate')!.href, '/courses?level=Intermediate');
  });

  test('small batch shows the group price, one to one shows the one-to-one price', () => {
    for (const tier of PRICING_TIERS) {
      assert.equal(group.find((t) => t.id === tier.id)!.price, tier.price);
      assert.equal(solo.find((t) => t.id === tier.id)!.price, tier.oneOnOnePrice ?? tier.price);
    }
  });

  test('price per class is the price over the classes, to the cent', () => {
    for (const t of [...group, ...solo]) {
      if (t.price === null || !t.classes) continue;
      assert.equal(t.perClass, Math.round((t.price / t.classes) * 100) / 100);
    }
  });

  test('one to one never shows a group-price discount', () => {
    assert.ok(solo.every((t) => t.was === null && t.savePercent === 0));
  });
});

describe('featureLines', () => {
  test('the ratio line tells the truth for the ratio on screen', () => {
    const f = ['1:4 teacher-student ratio (1 teacher per 4 students)'];
    assert.equal(featureLines(f, '1:4')[0].text, 'Four learners to one mentor');
    assert.equal(featureLines(f, '1:1')[0].text, 'One to one — the mentor is all yours');
  });

  test('"Everything in Beginner, plus:" is a heading, not a ticked feature', () => {
    assert.deepEqual(featureLines(['Everything in Beginner, plus:'], '1:4')[0], { kind: 'heading', text: 'Everything in Beginner, plus' });
  });

  test('ordinary features pass through', () => {
    assert.deepEqual(featureLines(['Certificate of completion'], '1:1')[0], { kind: 'item', text: 'Certificate of completion' });
  });
});
