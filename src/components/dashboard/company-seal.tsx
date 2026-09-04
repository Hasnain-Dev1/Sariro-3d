'use client';

import Image from 'next/image';
import { COMPANY } from '@/lib/invoice/company';

/**
 * SARIRO — the company seal
 * =========================================================
 * The round stamp above the authorised signatory line on an invoice. Loaded
 * exactly the way the logo in the header is: a file in public/, referenced by
 * path through COMPANY, rendered with next/image and `unoptimized` so the
 * transparent PNG reaches the print engine untouched.
 *
 * Replacing the stamp is replacing the file — nothing here changes.
 *
 * ── Why a seal at all ───────────────────────────────────────────────────────
 * Indian commercial practice expects a company stamp and an authorised
 * signatory on an invoice. It is not what makes the invoice valid — the GSTIN,
 * the serial and the tax breakdown do that — but a parent, a school accounts
 * office or a bank all read its absence as an unfinished document.
 *
 * ── Print resolution ────────────────────────────────────────────────────────
 * This renders at 88px on screen and at 88pt on A4. A source image of about
 * 600x600 gives roughly 170 dots per inch on paper; smaller than that and the
 * stamp is visibly soft beside type that is printing at 600.
 *
 * WebP, with transparency — same format as the other photographic asset in
 * public/images. Every browser that can open this dashboard reads it.
 */
export default function CompanySeal({ size = 88 }: { size?: number }) {
  return (
    <Image
      src={COMPANY.stampSrc}
      alt=""
      width={size}
      height={size}
      unoptimized
      style={{ display: 'block', width: size, height: 'auto' }}
    />
  );
}
