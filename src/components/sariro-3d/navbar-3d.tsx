'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, Sparkles } from 'lucide-react';
import { NAV_LINKS, BRAND } from '@/lib/sariro-data';

export default function Navbar3D() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6"
      >
        <div
          className={`mx-auto max-w-7xl mt-3 transition-all duration-300 ${
            scrolled
              ? 'glass-panel rounded-2xl px-4 sm:px-6 py-3 shadow-xl'
              : 'bg-transparent px-2 py-4'
          }`}
        >
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-70 transition-opacity rounded-xl" />
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {BRAND.name}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  AI Education
                </span>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className="relative px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors group cursor-pointer"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {link.label}
                  <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-blue-600 to-violet-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
                </button>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => handleNav('pricing')}
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors px-3 py-2 cursor-pointer"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Sign in
              </button>
              <button
                onClick={() => handleNav('courses')}
                className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Start Learning
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute top-0 right-0 bottom-0 w-[82%] max-w-sm bg-white shadow-2xl p-6 pt-24 flex flex-col"
            >
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => handleNav(link.id)}
                    className="text-left px-4 py-3.5 rounded-xl text-base font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {link.label}
                  </motion.button>
                ))}
              </nav>
              <div className="mt-auto pt-6 flex flex-col gap-3">
                <button
                  onClick={() => handleNav('courses')}
                  className="btn-tactile btn-tactile-primary px-5 py-3.5 w-full"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Learning
                </button>
                <button
                  onClick={() => handleNav('pricing')}
                  className="btn-tactile btn-tactile-light px-5 py-3.5 w-full"
                >
                  Sign in
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
