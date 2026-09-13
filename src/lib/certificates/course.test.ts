import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  decideCertificateAction, courseCertificateNumber, buildCourseCertificate, canOpenCertificate,
  isCertificateStaff, applyCertificateAction, type EnrolmentRow,
} from './course';

const enrolment = (over: Partial<EnrolmentRow> = {}): EnrolmentRow => ({
  id: '1a2b3c4d-5e6f-7a8b-9c0d-112233445566',
  user_id: 'student-1',
  track: 'public-speaking',
  level: 'Beginner',
  cohort_id: null,
  started_at: '2026-06-01T00:00:00Z',
  completed_at: '2026-09-13T10:00:00Z',
  status: 'completed',
  ...over,
});

describe('decideCertificateAction', () => {
  test('an active course can be issued', () => {
    assert.deepEqual(decideCertificateAction('active', 'issue'), { ok: true, from: 'active', to: 'completed' });
  });

  test('issuing twice says so rather than re-stamping the date', () => {
    const d = decideCertificateAction('completed', 'issue');
    assert.equal(d.ok, false);
    assert.equal(!d.ok && d.error, 'already_issued');
  });

  test('a dropped course is not quietly turned into a certificate', () => {
    const d = decideCertificateAction('dropped', 'issue');
    assert.equal(!d.ok && d.error, 'dropped');
  });

  test('only an issued certificate can be withdrawn, back to active', () => {
    assert.deepEqual(decideCertificateAction('completed', 'withdraw'), { ok: true, from: 'completed', to: 'active' });
    assert.equal(decideCertificateAction('active', 'withdraw').ok, false);
    assert.equal(decideCertificateAction(null, 'withdraw').ok, false);
  });

  test('status is read however it was stored', () => {
    assert.equal(decideCertificateAction(' Active ', 'issue').ok, true);
  });
});

describe('the certificate itself', () => {
  test('the number is stable and matches the student page', () => {
    assert.equal(courseCertificateNumber('1a2b3c4d-5e6f-7a8b-9c0d-112233445566', '2026-09-13T10:00:00Z'), 'SARIRO-2026-1A2B3C4D');
  });

  test('built only for a completed enrolment', () => {
    assert.equal(buildCourseCertificate(enrolment({ status: 'active' }), null), null);
    const c = buildCourseCertificate(enrolment(), { full_name: 'Aanya Rao', email: 'a@example.com' })!;
    assert.equal(c.student_name, 'Aanya Rao');
    assert.equal(c.level, 'beginner');
    assert.equal(c.certificate_number, 'SARIRO-2026-1A2B3C4D');
    assert.equal(c.founder_name, 'Mimo Patra');
  });

  test('the course is named, never printed as its slug', () => {
    const c = buildCourseCertificate(enrolment(), null)!;
    assert.notEqual(c.track_name, 'public-speaking');
    assert.match(c.track_name, /Public Speaking/i);
  });

  test('a student with no name still gets a certificate that reads properly', () => {
    assert.equal(buildCourseCertificate(enrolment(), null)!.student_name, 'Sariro Student');
  });
});

describe('who may open one', () => {
  test('the student, and admin, super admin and HR', () => {
    assert.equal(canOpenCertificate({ id: 'student-1', role: 'student' }, 'student-1'), true);
    for (const role of ['admin', 'super_admin', 'hr'] as const) {
      assert.equal(canOpenCertificate({ id: 'staff', role }, 'student-1'), true, role);
    }
  });

  test('not another student, a teacher or a seller', () => {
    for (const role of ['student', 'teacher', 'seller'] as const) {
      assert.equal(canOpenCertificate({ id: 'someone-else', role }, 'student-1'), false, role);
    }
    assert.equal(isCertificateStaff(null), false);
  });
});

/* Just enough of the service client for the write path. */
function fakeAdmin(row: EnrolmentRow | null, opts: { raceLost?: boolean } = {}) {
  const writes: { table: string; op: string; payload?: unknown; filters?: Record<string, unknown> }[] = [];
  const from = (table: string) => {
    const filters: Record<string, unknown> = {};
    let op = 'select';
    let payload: unknown;
    const b = {
      select: () => b,
      update: (p: unknown) => { op = 'update'; payload = p; return b; },
      insert: async (p: unknown) => { writes.push({ table, op: 'insert', payload: p }); return { error: null }; },
      eq: (c: string, v: unknown) => { filters[c] = v; if (op === 'update' && c === 'status') return finishUpdate(); return b; },
      maybeSingle: async () => ({ data: row, error: null }),
    };
    const finishUpdate = () => ({
      select: async () => {
        writes.push({ table, op, payload, filters });
        if (opts.raceLost || !row || row.status !== filters.status) return { data: [], error: null };
        return { data: [{ ...row, ...(payload as object) }], error: null };
      },
    });
    return b;
  };
  return { writes, client: { from } as never };
}

describe('applyCertificateAction', () => {
  test('issuing stamps completed, clears the popup flag and writes the audit log', async () => {
    const { client, writes } = fakeAdmin(enrolment({ status: 'active', completed_at: null }));
    const r = await applyCertificateAction(client, { enrollmentId: 'e1', action: 'issue', actorId: 'hr-1', nowIso: '2026-09-13T12:00:00Z' });
    assert.equal(r.ok, true);
    assert.equal(r.ok && r.certificateUrl, '/certificate/1a2b3c4d-5e6f-7a8b-9c0d-112233445566');
    const update = writes.find((w) => w.op === 'update')!;
    assert.deepEqual(update.payload, { status: 'completed', completed_at: '2026-09-13T12:00:00Z', completion_shown_at: null, updated_at: '2026-09-13T12:00:00Z' });
    assert.equal((update.filters as Record<string, unknown>).status, 'active', 'only lands if still active');
    const audit = writes.find((w) => w.table === 'admin_audit_logs')!;
    assert.equal((audit.payload as { action: string; admin_id: string }).action, 'certificate_issued');
    assert.equal((audit.payload as { admin_id: string }).admin_id, 'hr-1');
  });

  test('withdrawing puts it back to active with no completion date', async () => {
    const { client, writes } = fakeAdmin(enrolment());
    const r = await applyCertificateAction(client, { enrollmentId: 'e1', action: 'withdraw', actorId: 'admin-1', nowIso: '2026-09-13T12:00:00Z' });
    assert.equal(r.ok && r.certificateUrl, null);
    assert.deepEqual(writes.find((w) => w.op === 'update')!.payload, { status: 'active', completed_at: null, updated_at: '2026-09-13T12:00:00Z' });
  });

  test('a refused decision writes nothing', async () => {
    const { client, writes } = fakeAdmin(enrolment({ status: 'dropped' }));
    const r = await applyCertificateAction(client, { enrollmentId: 'e1', action: 'issue', actorId: 'hr-1' });
    assert.equal(!r.ok && r.error, 'dropped');
    assert.equal(writes.length, 0);
  });

  test('two people at once: the second is told, and no audit row claims it', async () => {
    const { client, writes } = fakeAdmin(enrolment({ status: 'active' }), { raceLost: true });
    const r = await applyCertificateAction(client, { enrollmentId: 'e1', action: 'issue', actorId: 'hr-2' });
    assert.equal(!r.ok && r.error, 'changed');
    assert.equal(writes.some((w) => w.table === 'admin_audit_logs'), false);
  });

  test('a missing enrolment is a 404', async () => {
    const { client } = fakeAdmin(null);
    const r = await applyCertificateAction(client, { enrollmentId: 'nope', action: 'issue', actorId: 'hr-1' });
    assert.equal(!r.ok && r.status, 404);
  });
});
