'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Cookie, Check, X, ShieldCheck } from 'lucide-react';
import { overOwnButtons } from '@/lib/ui/own-buttons';

const STORAGE_KEY = 'sariro-cookie-consent';
const COOKIE_NAME = 'sariro_cc';
const COOKIE_TTL_DAYS = 365;

/**
 * CookieConsent — a small card in the bottom-left corner.
 * Stores choice in BOTH localStorage (instant) + cookie (server-readable).
 * Persists across navigation. Shown to all new visitors.
 *
 * ── Why a corner, not the middle ────────────────────────────────────────────
 * It was a 768x214 card pinned to the bottom-CENTRE of the screen. For every
 * visitor who had not chosen yet, it sat on top of whatever centred button was
 * scrolling past — most visibly the middle "Become a Builder" pricing button,
 * which simply did not respond while the two outer ones did.
 *
 * A corner alone was not enough: a card there covered the LEFT pricing button
 * instead. So over a section with its own buttons (lib/ui/own-buttons.ts) the
 * card folds into a small "Cookies" pill beside the WhatsApp button — still
 * there, one tap to open, and never covering a whole button. A consent notice
 * must never be the reason a page does not work.
 *
 * Choices:
 *  - "accepted": full cookies allowed (analytics, essential, marketing)
 *  - "rejected": only essential cookies allowed
 *  - "essential": same as rejected (alias)
 */
function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

function getStoredChoice(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredChoice(choice: 'accepted' | 'rejected') {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
    // Dispatch a manual storage event so any same-tab listeners can react
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: choice }));
  } catch {
    /* ignore */
  }
  setCookie(COOKIE_NAME, choice, COOKIE_TTL_DAYS);
}

export default function CookieConsent() {
  // Start hidden; only show after mount if no choice is stored.
  // We use a deferred state update via requestAnimationFrame to avoid the
  // "setState in effect" lint rule (which flags synchronous calls).
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  /* Folded into the pill while a pricing-style section is on screen — unless
     the visitor opened it on purpose, in which case it stays open for them. */
  const [docked, setDocked] = useState(false);
  const [openedByVisitor, setOpenedByVisitor] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => setDocked(overOwnButtons());
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [visible]);

  useEffect(() => {
    // Defer mounted flag to next frame (avoids sync setState in effect)
    const m = requestAnimationFrame(() => setMounted(true));
    const existing = getStoredChoice();
    if (existing) {
      return () => cancelAnimationFrame(m);
    }
    // Slight delay so it doesn't clash with the cinematic intro (which lasts ~3.7s)
    const t = setTimeout(() => setVisible(true), 4200);
    return () => {
      cancelAnimationFrame(m);
      clearTimeout(t);
    };
  }, []);

  // Also listen for the manual storage event — if another tab chose, hide here too
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setVisible(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const accept = () => {
    setStoredChoice('accepted');
    setVisible(false);
  };

  const reject = () => {
    setStoredChoice('rejected');
    setVisible(false);
  };

  if (!mounted) return null;

  const folded = docked && !openedByVisitor;

  return (
    <AnimatePresence mode="wait">
      {visible && folded && (
        <motion.button
          key="cookie-pill"
          type="button"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          onClick={() => setOpenedByVisitor(true)}
          className="fixed z-[60] bottom-3 left-3 lg:bottom-6 lg:left-[88px] inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white text-[13px] font-bold text-slate-800 border border-[var(--card-border)] shadow-[0_8px_24px_-12px_rgba(42,37,31,0.35)] hover:bg-slate-50 sariro-cookie-consent"
          style={{ fontFamily: 'var(--font-grotesk)' }}
          aria-label="Open cookie choices"
        >
          <Cookie className="w-4 h-4 text-blue-600" strokeWidth={2.3} />
          Cookies
        </motion.button>
      )}
      {visible && !folded && (
        <motion.div
          key="cookie-card"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          className="fixed z-[60] bottom-3 inset-x-3 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[372px] sariro-cookie-consent"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFF 100%)',
              border: '1px solid rgba(37, 99, 235, 0.18)',
              boxShadow: '0 20px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(37, 99, 235, 0.05)',
            }}
          >
            {/* Colorful top accent stripe */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 33%, #16A34A 66%, #F59E0B 100%)',
              }}
            />

            {/* Close button */}
            <button
              onClick={reject}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-4">
              <div className="flex items-start gap-3 pr-6">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
                >
                  <Cookie className="w-[18px] h-[18px]" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-extrabold text-slate-900 leading-tight"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    We use cookies
                  </h3>
                  <p className="mt-1 text-[12.5px] text-slate-600 leading-[1.5]">
                    Essential cookies keep Sariro working; analytics help us improve it. Never sold.{' '}
                    <Link href="/contact" className="text-blue-600 font-semibold underline hover:text-blue-700">
                      Cookie policy
                    </Link>
                  </p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    Essential always on
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={accept}
                  className="btn-tactile btn-tactile-primary px-3 py-2 text-[13px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept all
                </button>
                <button
                  onClick={reject}
                  className="btn-tactile btn-tactile-light px-3 py-2 text-[13px]"
                >
                  Essential only
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
