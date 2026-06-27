'use client';

import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Menu, X, GraduationCap, Sparkles } from 'lucide-react';
import { BRAND } from '@/lib/sariro-data';
import { CustomCursor } from '@/components/sariro-3d/scroll-effects';
import { CompanionOrb3D, BackgroundParticles3D } from '@/components/sariro-3d/persistent-3d';
import ChapterNav, { ScrollHueShift } from '@/components/sariro-3d/chapter-nav';
import SmoothScrollProvider from '@/components/sariro-3d/smooth-scroll-provider';
import CinematicIntro from '@/components/brand/cinematic-intro';
import MobileScrollTop from '@/components/brand/mobile-scroll-top';

/* ===============================================================
   BRAND LAYOUT — Used on EVERY page for consistent brand identity.
   - Sticky glass navbar with Sariro logo (always top-left)
   - Brand colors + signature neural pathway SVG in bg
   - Custom cursor (desktop)
   - Companion orb (bottom-left, color-shifts per page)
   - Smooth scroll (Lenis)
   - Scroll progress bar (top)
   - Page transition animations
   - Footer with brand identity
=============================================================== */

const NAV_ITEMS = [
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

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 h-1 z-[100] bg-gradient-to-r from-blue-600 via-violet-600 to-green-500"
      aria-hidden
    />
  );
}

function BrandNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change (deferred to avoid setState-in-effect)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMobileOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6"
      >
        <div
          className={`mx-auto max-w-7xl mt-3 transition-all duration-300 ${
            scrolled
              ? 'glass-panel rounded-2xl px-5 sm:px-6 py-3 shadow-xl'
              : 'bg-transparent px-3 sm:px-2 py-4'
          }`}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-6 pr-1">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-70 transition-opacity rounded-xl" />
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {BRAND.name}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  AI Education
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3.5 py-2 text-sm font-semibold transition-colors group ${
                      active ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                    }`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {item.label}
                    <span
                      className={`absolute left-3 right-3 -bottom-0.5 h-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full transition-transform origin-left ${
                        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA — full button on md+ */}
            <div className="hidden md:block">
              <Link
                href="/courses"
                className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Start Learning
              </Link>
            </div>

            {/* Mobile CTA — compact pill with icon + "Start" text */}
            <div className="md:hidden">
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white text-xs font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
                style={{ minHeight: '40px', fontFamily: 'var(--font-grotesk)' }}
                aria-label="Start Learning"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                Start
              </Link>
            </div>

            {/* Mobile toggle — properly sized touch target, fully visible */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation flex-shrink-0"
              aria-label="Toggle menu"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                {NAV_ITEMS.map((item, i) => {
                  const active = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <Link
                        href={item.href}
                        className={`block px-4 py-3.5 rounded-xl text-base font-bold transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-800 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
              <div className="mt-auto pt-6">
                <Link
                  href="/courses"
                  className="btn-tactile btn-tactile-primary px-5 py-3.5 w-full"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Learning
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* Brand signature: neural pathway SVG motif */
function NeuralMotifBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]" aria-hidden>
      <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="motifGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        {/* Neural pathway — a flowing line with nodes */}
        <path
          d="M0,200 Q360,100 720,300 T1440,250"
          stroke="url(#motifGrad)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0,500 Q360,400 720,600 T1440,550"
          stroke="url(#motifGrad)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0,700 Q360,600 720,800 T1440,750"
          stroke="url(#motifGrad)"
          strokeWidth="2"
          fill="none"
        />
        {/* Nodes on the paths */}
        {[200, 500, 700, 250, 550, 750].map((y, i) => (
          <circle key={i} cx={360 * (i + 1) % 1440} cy={y} r="4" fill="url(#motifGrad)" />
        ))}
      </svg>
    </div>
  );
}

function BrandFooter() {
  return (
    <footer className="relative bg-slate-950/95 text-slate-300 pt-20 pb-8 overflow-hidden mt-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2 max-w-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-extrabold text-xl text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {BRAND.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  AI Education
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {BRAND.tagline} Cohort-based AI education for students, schools, and professionals — by educator {BRAND.founder}.
            </p>
            <div className="flex items-center gap-2 mt-6">
              {NAV_ITEMS.slice(0, 5).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-2 py-1"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Learn
            </h4>
            <ul className="space-y-2.5">
              {NAV_ITEMS.slice(1, 5).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {NAV_ITEMS.slice(5).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Connect
            </h4>
            <a href={`mailto:${BRAND.emails.contact}`} className="block text-sm text-slate-400 hover:text-white transition-colors mb-1">contact@sariro.com</a>
            <a href={`mailto:${BRAND.emails.support}`} className="block text-sm text-slate-400 hover:text-white transition-colors mb-1">support@sariro.com</a>
            <a href={`mailto:${BRAND.emails.hr}`} className="block text-sm text-slate-400 hover:text-white transition-colors mb-1">hr@sariro.com</a>
            <a href={`mailto:${BRAND.emails.founder}`} className="block text-sm text-slate-400 hover:text-white transition-colors mb-1">founder@sariro.com</a>
            <a href={`mailto:${BRAND.emails.dev}`} className="block text-sm text-slate-400 hover:text-white transition-colors mb-1">dev@sariro.com</a>
            <p className="text-sm text-slate-400 mt-2">{BRAND.location}</p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {BRAND.name}. Built with care by educators, for builders.</p>
          <div className="flex gap-4">
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* Page transition wrapper */
function PageTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function BrandLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <CinematicIntro />
      <CustomCursor />
      <BackgroundParticles3D />
      <ScrollHueShift />
      <ChapterNav />
      <CompanionOrb3D />
      <MobileScrollTop />
      <ScrollProgressBar />
      <NeuralMotifBg />
      <BrandNavbar />
      <PageTransition>
        <div className="relative min-h-screen flex flex-col bg-white text-slate-900" style={{ zIndex: 1 }}>
          <main className="flex-1 relative" style={{ zIndex: 2 }}>
            {children}
          </main>
          <BrandFooter />
        </div>
      </PageTransition>
    </SmoothScrollProvider>
  );
}
