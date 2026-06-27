'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Home, GraduationCap, Sparkles } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';

export default function NotFound() {
  return (
    <BrandLayout>
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-32 pb-20">
        {/* Background */}
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-5 sm:px-6 text-center">
          {/* Animated 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="relative inline-block">
              {/* Glow */}
              <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full" />
              {/* 404 text */}
              <h1 className="relative text-8xl sm:text-9xl font-extrabold gradient-text" style={{ fontFamily: 'var(--font-jakarta)' }}>
                404
              </h1>
            </div>
          </motion.div>

          {/* Paper plane emoji flying */}
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl mb-6"
          >
            ✈️
          </motion.div>

          {/* Message */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            This page flew away.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg text-slate-600 mb-8 max-w-md mx-auto"
          >
            The page you're looking for doesn't exist — but your future in AI still does. Let's get you back on track.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/" className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm">
              <Home className="w-4 h-4" />
              Back to home
            </Link>
            <Link href="/courses" className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm">
              <Sparkles className="w-4 h-4" />
              Browse courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex flex-wrap gap-2 justify-center"
          >
            {['/courses', '/schools', '/events', '/pricing', '/about', '/story', '/resources', '/contact'].map((href) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg glass-panel text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {href.replace('/', '')}
              </Link>
            ))}
          </motion.div>
        </div>
      </section>
    </BrandLayout>
  );
}
