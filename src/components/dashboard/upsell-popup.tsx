'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GraduationCap, Sparkles, X, ArrowRight, PartyPopper } from 'lucide-react';
import type { UpsellRecommendation } from '@/lib/dashboard/upsell-engine';

interface UpsellPopupProps {
  enrollmentId: string;
  completedTrackName: string;
  completedLevel: string;
  recommendation: UpsellRecommendation;
  onDismiss: (enrollmentId: string) => Promise<void>;
}

const PITCH_STYLES = {
  beginner_to_intermediate: {
    gradient: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #1A1611 100%)',
    accent: '#60A5FA',
    icon: Sparkles,
  },
  intermediate_to_advanced: {
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 50%, #1A1611 100%)',
    accent: '#C4B5FD',
    icon: GraduationCap,
  },
  advanced_to_next_track: {
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #DC2626 50%, #1A1611 100%)',
    accent: '#FCD34D',
    icon: PartyPopper,
  },
} as const;

export function UpsellPopup({
  enrollmentId,
  completedTrackName,
  completedLevel,
  recommendation,
  onDismiss,
}: UpsellPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const styles = PITCH_STYLES[recommendation.pitch_variant];
  const Icon = styles.icon;

  // Open after a brief delay so it doesn't feel jarring
  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = async () => {
    setIsOpen(false);
    setIsDismissed(true);
    // Mark in DB so it never shows again for this enrollment
    try {
      await onDismiss(enrollmentId);
    } catch (err) {
      console.warn('[upsell] failed to mark shown:', err);
    }
  };

  if (isDismissed && !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upsell-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Card */}
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl shadow-2xl"
            style={{ background: styles.gradient }}
          >
            {/* Decorative grid pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Close button — 44px touch target */}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative p-6 sm:p-8 text-white">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0"
                  style={{ boxShadow: `0 0 30px ${styles.accent}40` }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/80"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    Course Complete
                  </div>
                  <div
                    className="text-sm sm:text-base font-extrabold truncate"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {completedTrackName} — {completedLevel}
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h2
                id="upsell-title"
                className="text-xl sm:text-2xl font-extrabold mb-3 leading-tight"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {recommendation.heading}
              </h2>

              {/* Body */}
              <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-6">
                {recommendation.body}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/course-path/${recommendation.next_track_id}`}
                  onClick={handleDismiss}
                  className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-white/95 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {recommendation.primary_cta_label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleDismiss}
                  className="min-h-[48px] px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/25 transition-colors"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  Maybe later
                </button>
              </div>

              {/* Footer hint */}
              <p className="text-[11px] text-white/60 mt-4 text-center">
                You can always find this recommendation on your dashboard.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
