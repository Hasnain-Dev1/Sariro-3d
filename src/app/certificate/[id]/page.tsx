'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Award, Download, Loader2, AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchCertificateData, type CertificateData } from '@/lib/dashboard/student-data';

/* ─────────────────────── Print CSS ───────────────────────
   Hides everything except the certificate card so window.print()
   produces a clean PDF. */
const PRINT_STYLES = `
@media print {
  body * {
    visibility: hidden !important;
  }
  #certificate-print-area, #certificate-print-area * {
    visibility: visible !important;
  }
  #certificate-print-area {
    position: absolute !important;
    top: 0;
    left: 0;
    right: 0;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    transform: none !important;
  }
  .no-print {
    display: none !important;
  }
  @page {
    size: landscape;
    margin: 0.5in;
  }
}
`;

/* ─────────────────────── Inner component (uses hooks) ─────────────────────── */
function CertificatePageInner() {
  const params = useParams<{ id: string }>();
  const enrollmentId = params?.id ?? '';
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError('Please sign in to view your certificate.');
      setLoading(false);
      return;
    }
    if (!enrollmentId) {
      setError('Missing certificate ID.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cert = await fetchCertificateData(enrollmentId);
        if (cancelled) return;
        if (!cert) {
          setError('This certificate is not available. The course may not be marked as completed yet.');
          setData(null);
        } else {
          setData(cert);
          setError(null);
        }
      } catch (err) {
        console.warn('[certificate] fetch error:', err);
        if (!cancelled) setError('Failed to load certificate data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enrollmentId, user, authLoading]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      <section className="relative min-h-[80vh] py-12 sm:py-16 px-5">
        {/* Decorative backdrop */}
        <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Back link + actions */}
          <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <Link
              href="/dashboard/student"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors min-h-[44px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
            {data && (
              <button
                onClick={() => window.print()}
                className="btn-tactile btn-tactile-primary px-5 py-3 text-sm inline-flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}
          </div>

          {loading ? (
            <LoadingCard />
          ) : error ? (
            <ErrorCard message={error} />
          ) : data ? (
            <motion.div
              id="certificate-print-area"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CertificateCard data={data} />
            </motion.div>
          ) : null}
        </div>
      </section>
    </>
  );
}

/* ─────────────────────── Certificate card ─────────────────────── */
function CertificateCard({ data }: { data: CertificateData }) {
  const completionDate = new Date(data.completed_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const levelDisplay = data.level.charAt(0).toUpperCase() + data.level.slice(1);

  return (
    <div className="relative bg-white rounded-2xl border-2 border-slate-200 shadow-2xl overflow-hidden">
      {/* Decorative gold corners */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-amber-500 rounded-tl-2xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-amber-500 rounded-tr-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-amber-500 rounded-bl-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-amber-500 rounded-br-2xl pointer-events-none" />

      {/* Subtle watermark pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative px-6 sm:px-12 py-10 sm:py-14 text-center">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-md" style={{ fontFamily: 'var(--font-jakarta)' }}>
            S
          </div>
          <div className="text-left">
            <div className="text-xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {data.brand_name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold" style={{ fontFamily: 'var(--font-grotesk)' }}>
              AI & Technology Education
            </div>
          </div>
        </div>

        {/* Award icon */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
          className="inline-flex w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/30"
        >
          <Award className="w-8 h-8 text-white" strokeWidth={2.5} />
        </motion.div>

        {/* Title */}
        <div
          className="text-[11px] uppercase tracking-[0.32em] text-amber-700 font-bold mb-2"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          Certificate of Completion
        </div>
        <div className="text-sm text-slate-500 mb-6">This certifies that</div>

        {/* Student name */}
        <h1
          className="text-3xl sm:text-5xl font-extrabold gradient-text mb-4"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          {data.student_name}
        </h1>

        {/* Course description */}
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-6">
          has successfully completed the
          <br />
          <span className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {data.track_name}
          </span>{' '}
          —{' '}
          <span className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {levelDisplay}
          </span>{' '}
          cohort
        </p>

        {/* Sparkle divider */}
        <div className="flex items-center justify-center gap-2 mb-6 text-amber-500">
          <div className="h-px w-12 bg-amber-300" />
          <Sparkles className="w-4 h-4" />
          <div className="h-px w-12 bg-amber-300" />
        </div>

        {/* Founder signature + date */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-xl mx-auto pt-4">
          <div className="text-center sm:text-left">
            <div
              className="text-2xl font-extrabold text-slate-900 italic mb-1"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              {data.founder_name}
            </div>
            <div className="h-px w-32 bg-slate-300 mb-1 mx-auto sm:mx-0" />
            <div className="text-xs text-slate-500">Founder & Lead Educator</div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-sm font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {completionDate}
            </div>
            <div className="h-px w-32 bg-slate-300 mb-1 mx-auto sm:ml-auto sm:mr-0" />
            <div className="text-xs text-slate-500">Date of completion</div>
          </div>
        </div>

        {/* Certificate number */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-mono">
            Certificate No. {data.certificate_number}
          </div>
          {data.student_email && (
            <div className="text-[10px] text-slate-400 mt-1">
              Issued to {data.student_email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── States ─────────────────────── */
function LoadingCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-16 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-sm text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
        Loading your certificate...
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-7 h-7 text-amber-600" />
      </div>
      <h2
        className="text-xl font-extrabold text-slate-900 mb-2"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        Certificate unavailable
      </h2>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      <Link
        href="/dashboard/student"
        className="btn-tactile btn-tactile-primary px-5 py-3 text-sm inline-flex items-center gap-2 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>
    </div>
  );
}

/* ─────────────────────── Page export ─────────────────────── */
export default function CertificatePage() {
  return (
    <BrandLayout>
      <Suspense fallback={<LoadingCard />}>
        <CertificatePageInner />
      </Suspense>
    </BrandLayout>
  );
}
