'use client';

import { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { LoginGateModal } from '@/components/auth/login-gate-modal';

interface ReserveSeatButtonProps {
  track: string;
  level: string;
  ratio: '1:4' | '1:1';
  paymentLink: string;
  courseName: string;
  accentColor: string;
  className?: string;
}

export function ReserveSeatButton({
  track, level, ratio, paymentLink, courseName, accentColor, className,
}: ReserveSeatButtonProps) {
  const { user } = useAuth();
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleClick = async () => {
    if (!user) {
      setShowLoginGate(true);
      return;
    }

    setProcessing(true);
    try {
      const supabase = createClient();
      await supabase.from('purchase_intents').insert({
        user_id: user.id,
        track,
        level,
        ratio,
        razorpay_link: paymentLink,
        status: 'pending',
      });
    } catch (err) {
      console.warn('[reserve-seat] intent failed:', err);
    } finally {
      setProcessing(false);
    }

    const successUrl = `${window.location.origin}/payment-success?track=${encodeURIComponent(track)}&level=${encodeURIComponent(level)}&ratio=${encodeURIComponent(ratio)}`;
    const finalLink = paymentLink.includes('?')
      ? `${paymentLink}&return_url=${encodeURIComponent(successUrl)}`
      : `${paymentLink}?return_url=${encodeURIComponent(successUrl)}`;
    window.location.href = finalLink;
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={processing}
        className={className ?? 'btn-tactile btn-tactile-primary w-full px-6 py-4 text-base'}
        style={{ background: accentColor }}
      >
        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
        Reserve your seat
        <ArrowRight className="w-5 h-5" />
      </button>

      <LoginGateModal
        open={showLoginGate}
        onClose={() => setShowLoginGate(false)}
        nextPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
        courseName={courseName}
      />
    </>
  );
}
