import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeBillLink, expensesToCsv } from './expenses';
import type { Expense } from './expenses';

/**
 * SARIRO — the bill link, and the file the accountant opens
 * =========================================================
 * `document_url` is rendered as an anchor. Everything below exists because a
 * value pasted into that box is a click away from running in somebody's
 * session, and because a comma in a vendor's name silently shifts every column
 * after it in the filing spreadsheet.
 */

describe('a bill link has to be a link', () => {
  test('a Google Drive share link is what this is for', () => {
    assert.equal(isSafeBillLink('https://drive.google.com/file/d/1a2b3c/view?usp=sharing'), true);
  });

  test('plain http is allowed — some vendor portals still are', () => {
    assert.equal(isSafeBillLink('http://billing.vendor.in/inv/8823'), true);
  });

  test('javascript: is refused — it would run on click', () => {
    assert.equal(isSafeBillLink('javascript:fetch("/api/hr",{method:"POST"})'), false);
  });

  test('data: is refused for the same reason', () => {
    assert.equal(isSafeBillLink('data:text/html,<script>alert(1)</script>'), false);
  });

  test('a scheme-less address is refused — it resolves against our own domain', () => {
    assert.equal(isSafeBillLink('drive.google.com/file/d/1a2b3c/view'), false);
  });

  test('surrounding whitespace does not change the answer', () => {
    assert.equal(isSafeBillLink('  https://drive.google.com/x  '), true);
  });

  test('nothing at all is not a link', () => {
    assert.equal(isSafeBillLink(''), false);
    assert.equal(isSafeBillLink('the receipt is in my email'), false);
  });
});

const row = (over: Partial<Expense> = {}): Expense => ({
  id: 'e1',
  title: 'Zoom subscription',
  amount: 2400,
  spent_on: '2026-08-04',
  category: 'Software',
  description: null,
  reason: 'Monthly licences',
  vendor: 'Zoom',
  payment_method: 'Card',
  document_url: 'https://drive.google.com/file/d/1a2b3c/view',
  notes: null,
  status: 'approved',
  approved_by: null,
  approved_at: null,
  created_by: null,
  created_at: '2026-08-04T10:00:00Z',
  ...over,
} as Expense);

describe('the filing export', () => {
  test('the bill link is a column, so filing is one download', () => {
    const csv = expensesToCsv([row()]);
    const [header, line] = csv.split('\r\n');
    assert.equal(header.split(',').indexOf('Bill link'), 8);
    assert.ok(line.includes('https://drive.google.com/file/d/1a2b3c/view'));
  });

  test('a comma in a vendor name does not shift every column after it', () => {
    const csv = expensesToCsv([row({ vendor: 'Bose, Sen & Co' })]);
    assert.ok(csv.includes('"Bose, Sen & Co"'));
    // Header commas plus the one quoted field's own — the row must still have
    // exactly ten fields when a reader parses it properly.
    assert.equal(csv.split('\r\n')[1].split('"').length, 3);
  });

  test('a quote inside a field is doubled, not dropped', () => {
    const csv = expensesToCsv([row({ title: 'Mic for the "studio"' })]);
    assert.ok(csv.includes('"Mic for the ""studio"""'));
  });

  test('an expense with no bill leaves the cell empty rather than saying none', () => {
    const csv = expensesToCsv([row({ document_url: null })]);
    assert.ok(csv.split('\r\n')[1].includes(',,'));
    assert.ok(!/null|undefined/.test(csv));
  });

  test('the header alone comes back when there is nothing to file', () => {
    assert.equal(expensesToCsv([]).split('\r\n').length, 1);
  });
});
