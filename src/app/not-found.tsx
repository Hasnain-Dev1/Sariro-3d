'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Home, BookOpen, Compass, Sparkles } from 'lucide-react';

/* Quick links to all main routes */
const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/schools', label: 'Schools' },
  { href: '/events', label: 'Events' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/story', label: 'Story' },
  { href: '/faq', label: 'FAQ' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Simple navbar */}
      <nav className="px-5 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Sariro</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold" style={{ fontFamily: 'var(--font-grotesk)' }}>AI Education</span>
          </div>
        </Link>
      </nav>

      <section className="relative flex-1 flex items-center justify-center overflow-hidden pt-8 pb-20">
        {/* Background */}
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-5 text-center">
          {/* Giant 404 with glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-3xl opacity-40 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full" />
              <h1 className="relative text-8xl sm:text-9xl font-extrabold gradient-text" style={{ fontFamily: 'var(--font-jakarta)' }}>
                404
              </h1>
            </div>
          </motion.div>

          {/* Animated airplane emoji */}
          <motion.div
            animate={{ x: [0, 20, -20, 0], y: [0, -8, 4, 0], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl mb-6"
          >
            ✈️
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            This page <span className="gradient-text">flew away.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg text-slate-600 max-w-md mx-auto mb-8"
          >
            The page you're looking for doesn't exist — but your future in AI still does. Let's get you back on track.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
          >
            <Link href="/" className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm">
              <Home className="w-4 h-4" />
              Back to home
            </Link>
            <Link href="/courses" className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm">
              <BookOpen className="w-4 h-4" />
              Browse courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg glass-panel text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
