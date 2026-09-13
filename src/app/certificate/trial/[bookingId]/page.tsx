import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Award, ArrowLeft } from 'lucide-react';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { trialCertificateFor, REASON_COPY } from '@/lib/trial/certificate';
import { BRAND } from '@/lib/sariro-data';
import PrintButton from './print-button';

/**
 * SARIRO — /certificate/trial/[bookingId]
 *
 * The certificate the class page promises. Worked out on the server from the
 * booking and the attendance — see lib/trial/certificate.ts for the rule — and
 * only ever for the signed-in child, so a certificate cannot be opened for
 * somebody else by guessing a booking id.
 */
export const dynamic = 'force-dynamic';

/* Everything but the certificate disappears when printed, so "Save as PDF"
   produces the certificate and nothing else. */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #certificate, #certificate * { visibility: visible !important; }
  #certificate { position: absolute !important; inset: 0 !important; margin: 0 !important; box-shadow: none !important; }
  .no-print { display: none !important; }
  @page { size: landscape; margin: 0.4in; }
}`;

export default async function TrialCertificatePage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const supa = await createServerClientHelper();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${encodeURIComponent(`/certificate/trial/${bookingId}`)}`);

  const result = await trialCertificateFor(createServiceClient(), bookingId, user.id);

  if (!result.ok) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Award className="w-6 h-6 text-slate-400" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            No certificate for this class
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{REASON_COPY[result.reason]}</p>
          <Link href="/my-class" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900">
            <ArrowLeft className="w-4 h-4" /> Back to your class
          </Link>
        </div>
      </main>
    );
  }

  const c = result.certificate;
  const date = new Date(c.classDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print max-w-4xl mx-auto mb-5 flex items-center justify-between gap-3">
        <Link href="/my-class" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to your class
        </Link>
        <PrintButton />
      </div>

      <div
        id="certificate"
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
        style={{ aspectRatio: '1.414 / 1' }}
      >
        <div className="h-full border-[10px] border-double border-blue-900/80 m-3 rounded-xl flex flex-col items-center justify-center text-center px-10 py-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Sariro" width={34} height={34} />
            <span className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {BRAND.name}
            </span>
          </div>

          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.3em] text-blue-900/70" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Certificate of completion
          </p>
          <p className="mt-1 text-sm text-slate-500">Free trial class</p>

          <p className="mt-6 text-sm text-slate-600">This is to certify that</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {c.studentName}
          </h1>

          <p className="mt-4 text-base text-slate-700 max-w-xl leading-relaxed">
            attended and completed a live trial class in{' '}
            <strong className="text-slate-900">{c.course}</strong> at <strong className="text-slate-900">{c.grade}</strong>
            {c.teacherName ? <>, taught by <strong className="text-slate-900">{c.teacherName}</strong></> : null}, on {date}.
          </p>

          <div className="mt-8 flex items-center gap-3 text-amber-600">
            <Award className="w-8 h-8" />
          </div>

          <div className="mt-6 w-full flex items-end justify-between text-left">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Certificate no.</p>
              <p className="text-xs font-mono text-slate-700">{c.number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{BRAND.founder}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Founder, {BRAND.name}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
