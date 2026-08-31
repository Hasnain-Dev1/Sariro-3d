import { buildOgImage } from '@/lib/og/brand-frame';

/**
 * OG image for /pricing.
 */

export const alt = 'Sariro Pricing — live classes from $6.99, four to a room';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function PricingOgImage() {
  return buildOgImage({
    eyebrow: 'Pricing',
    title: 'Cohorts from $199.',
    subtitle: 'Live mentor-led cohorts. 1:4 standard or 1:1 premium. 14-day refund guarantee.',
    accent: 'green',
    footerRight: 'sariro.com/pricing',
  });
}
