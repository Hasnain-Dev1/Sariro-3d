'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Global error boundary — catches uncaught errors from ANY route in the
 * app router. Must be a client component. Receives the error + a `reset`
 * function from React that re-renders the route segment.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in the console for debugging (dev only — Next.js
    // also forwards to its own logs in production).
    console.error('[global error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-5 py-20 relative overflow-hidden">
        {/* Subtle backdrop */}
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-lg w-full text-center"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/30"
          >
            <AlertTriangle className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Something went wrong
          </h1>
          <p className="text-base text-slate-600 mb-2 max-w-md mx-auto">
            An unexpected error occurred while loading this page. Your data is safe — try again, or head back to the homepage.
          </p>
          {error?.digest && (
            <p className="text-xs text-slate-400 mb-8 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={reset}
              className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm inline-flex items-center justify-center gap-2 min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/"
              className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm inline-flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Home className="w-4 h-4" />
              Back to homepage
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
