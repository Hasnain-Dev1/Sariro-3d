import { NextRequest, NextResponse } from 'next/server';
import { requireActor } from '@/lib/auth/actor';
import { canOpenCertificate, loadCourseCertificate } from '@/lib/certificates/course';

/**
 * SARIRO — GET /api/certificates/course?id=<enrollmentId>
 *
 * The course certificate, for its student or for staff. The page used to read
 * the enrolment through the student's own session, which meant admin and HR —
 * who now issue these — could not open the certificate they had just issued.
 *
 * Somebody else's certificate answers exactly like a missing one, so an id
 * cannot be used to find out whether a stranger has finished a course.
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'certificate-view', skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  /* A query parameter rather than a [id] segment: nested dynamic API routes
     are the ones this project's dev server has lost before. */
  const id = (req.nextUrl.searchParams.get('id') ?? '').trim();
  if (!id) return NextResponse.json({ ok: false, error: 'missing_id', message: 'Which certificate?' }, { status: 400 });
  const { enrolment, certificate } = await loadCourseCertificate(actor.admin, id);

  if (!enrolment || !canOpenCertificate({ id: actor.id, role: actor.role }, enrolment.user_id)) {
    return NextResponse.json({ ok: false, error: 'not_found', message: 'We could not find that certificate.' }, { status: 404 });
  }
  if (!certificate) {
    return NextResponse.json({
      ok: false,
      error: 'not_completed',
      message: 'This certificate is not available yet. The course has not been marked as completed.',
    }, { status: 409 });
  }
  return NextResponse.json({ ok: true, certificate, viewerIsOwner: actor.id === enrolment.user_id });
}
