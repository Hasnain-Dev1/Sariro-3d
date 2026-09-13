import type { Metadata } from 'next';
import VoiceCheck from './voice-check';

/**
 * SARIRO — /voice-check
 *
 * Free, public, no account. The metadata is what a WhatsApp or Instagram
 * preview shows when somebody shares their score, so it is written for the
 * person receiving the link, not for a search engine.
 */
export const metadata: Metadata = {
  title: 'Voice Check — how does your child really sound? | Sariro',
  description:
    'A free 45-second speaking test. Get an instant score for pace, filler words, pauses and expression — measured on your own device, nothing uploaded.',
  openGraph: {
    title: 'How does your child really sound?',
    description: 'Free 45-second speaking test — an instant score, and one drill to get better straight away.',
    type: 'website',
  },
};

export default function VoiceCheckPage() {
  return <VoiceCheck />;
}
