'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ArrowRight, RefreshCw, LifeBuoy } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';

function PaymentFailureInner() {
  const searchParams = useSearchParams();
  const trackId = searchParams.get('track') || '';
  const level = searchParams.get('level') || '';
  const ratio = searchParams.get('ratio') || '1:4';

  return (
    <BrandLayout>
      <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-30" />
        <div className="relative max-w-xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }} className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>Payment didn't go through</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">No charge was made. This usually happens when a card is declined, UPI times out, or the payment window closes. You can try again — your seat is still available.</p>
            {trackId && (
              <div className="card-3d p-6 mb-8 text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>Course you were trying to enroll in</div>
                <div className="font-bold text-slate-900">{trackId} {level && `· ${level}`} {ratio && `· ${ratio}`}</div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link href="/courses" className="btn-tactile btn-tactile-primary px-6 py-3 text-sm flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Try again</Link>
              <Link href="/contact" className="btn-tactile btn-tactile-light px-6 py-3 text-sm flex items-center justify-center gap-2"><LifeBuoy className="w-4 h-4" /> Contact support</Link>
            </div>
            <div className="card-3d p-6 text-left">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>Common reasons</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Card declined by your bank — try a different card or UPI</li>
                <li>• Payment window timed out — try again with a stable connection</li>
                <li>• Insufficient balance — check your account</li>
                <li>• International card not supported — use UPI or NetBanking</li>
              </ul>
              <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">If money was deducted but you see this page, don't worry — Razorpay will auto-refund within 5-7 business days. Email <a href="mailto:support@sariro.com" className="text-blue-600 font-bold">support@sariro.com</a> with your payment ID for help.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </BrandLayout>
  );
}

export default function PaymentFailurePage() {
  return (<Suspense><PaymentFailureInner /></Suspense>);
}
