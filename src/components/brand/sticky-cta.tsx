'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, X } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

/**
 * SARIRO — the ask that follows you down the page
 * =========================================================
 * A visitor could read the entire site and never be asked for anything. The
 * only persistent call to action lived in the navbar, which scrolls away, and
 * the free class — the strongest offer Sariro has — was one button in a hero
 * most people scroll straight past.
 *
 * This is the ask, always reachable, on every marketing page.
 *
 * ── Why the FREE CLASS and not "buy" ────────────────────────────────────────
 * Nobody's first decision should be $279. A free class costs the visitor
 * nothing to accept, and it is the only claim on the site that proves itself:
 * they watch a real lesson before any money is discussed. Asking for the sale
 * first converts the few who were already sure and loses everyone else.
 *
 * ── Where it deliberately does NOT appear ───────────────────────────────────
 *   • checkout — never interrupt someone who is already buying
 *   • dashboard / auth — they are already a customer; this is noise
 *   • /welcome — that page IS the booking form; the bar would point at itself
 *   • for signed-in users — same reason
 *
 * ── Why it can be dismissed ─────────────────────────────────────────────────
 * A bar that cannot be closed is a bar people leave the page to escape. The
 * dismissal is remembered for the visit (sessionStorage, not localStorage) so
 * it does not nag, but a genuinely interested visitor who returns tomorrow
 * still sees the offer.
 */

const HIDDEN_PREFIXES = ['/dashboard', '/auth', '/checkout', '/enroll', '/welcome'];
const DISMISS_KEY = 'sariro-cta-dismissed';
/** Show once they have committed to the page — roughly past the hero. */
const SHOW_AFTER_PX = 700;

export default function StickyCta() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we know

  useEffect(() => {
    try {
      setDismissed(!!sessionStorage.getItem(DISMISS_KEY));
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hiddenHere = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));
  if (hiddenHere || dismissed || loading || user) return null;

  const close = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — it just reappears next page, which is acceptable */
    }
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 sm:px-6 sm:pb-5 pointer-events-none"
        >
          <div
            className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border shadow-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3 sm:gap-4"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FBF9F6 100%)',
              borderColor: 'rgba(245, 158, 11, 0.35)',
              boxShadow: '0 20px 50px -18px rgba(42, 37, 31, 0.35)',
            }}
          >
            <span
              className="hidden sm:flex w-10 h-10 rounded-xl shrink-0 items-center justify-center text-slate-900"
              style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' }}
            >
              <Rocket className="w-5 h-5" strokeWidth={2.3} />
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-[14px] sm:text-[15px] leading-tight">
                Try a class before you pay for one
              </p>
              {/* The objection, answered before it is raised. "Free" alone reads
                  as a sales call to anyone who has booked a "free consultation". */}
              <p className="text-[12.5px] sm:text-[13px] text-slate-600 mt-0.5 leading-snug">
                A real lesson with a real mentor. No card, no sales call.
              </p>
            </div>

            <Link
              href="/welcome#book"
              className="shrink-0 inline-flex items-center gap-1.5 h-10 sm:h-11 px-4 sm:px-5 rounded-xl text-slate-900 text-[13.5px] sm:text-[14.5px] font-extrabold hover:scale-[1.03] transition-transform"
              style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' }}
            >
              Book free
            </Link>

            <button
              onClick={close}
              aria-label="Dismiss"
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
