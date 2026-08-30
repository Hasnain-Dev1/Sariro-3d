import { ImageResponse } from 'next/og';

/**
 * SARIRO — OG image brand frame
 *
 * Shared layout for all Open Graph images. Renders the Sariro "S Made of
 * Sunlight" logo chip + amber gradient S + course/track title + subtitle
 * on a deep navy background.
 *
 * Used by:
 *   - src/app/opengraph-image.tsx                (home / default)
 *   - src/app/pricing/opengraph-image.tsx        (pricing)
 *   - src/app/courses/[level]/opengraph-image.tsx (per-tier)
 *   - src/app/course-path/[id]/opengraph-image.tsx (per-track)
 *
 * ImageResponse uses Satori under the hood — a subset of CSS. Notably:
 *   - `display: flex` is required on every div (Satori enforces it).
 *   - No CSS variables, no `gap` shorthand inconsistencies — be explicit.
 *   - Fonts default to system sans; we use Inter-ish weights via fontWeight.
 *   - Gradients only work via `backgroundImage: linear-gradient(...)`.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/svg';

const ACCENT_COLORS: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
  cyan: '#06B6D4',
};

interface BrandFrameProps {
  /** Eyebrow — small uppercase label above the title (e.g. "BEGINNER · 1:4 COHORT"). */
  eyebrow?: string;
  /** Main headline — the course / page title. */
  title: string;
  /** Subtitle — tagline, price, or cohort date. */
  subtitle?: string;
  /** Accent color name from TRACKS / COURSES accent field. */
  accent?: keyof typeof ACCENT_COLORS | string;
  /** Optional footer-right text — e.g. "sariro.com" or "$199 · Starts Aug 12". */
  footerRight?: string;
}

export function buildOgImage({
  eyebrow,
  title,
  subtitle,
  accent = 'amber',
  footerRight,
}: BrandFrameProps): ImageResponse {
  const accentHex = ACCENT_COLORS[accent] ?? '#F59E0B';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#1A1611',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(245, 158, 11, 0.18) 0%, transparent 45%), radial-gradient(circle at 15% 85%, rgba(124, 58, 237, 0.12) 0%, transparent 50%)',
          padding: '80px',
          fontFamily: 'sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Top row: logo chip + brand name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              background: '#1E293B',
              border: '1px solid #334155',
            }}
          >
            <span
              style={{
                display: 'flex',
                fontSize: '44px',
                fontWeight: 800,
                backgroundImage: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              S
            </span>
          </div>
          <span
            style={{
              display: 'flex',
              fontSize: '32px',
              fontWeight: 700,
              color: '#FBF9F6',
              letterSpacing: '-0.02em',
            }}
          >
            Sariro
          </span>
        </div>

        {/* Eyebrow */}
        {eyebrow && (
          <div
            style={{
              display: 'flex',
              fontSize: '20px',
              fontWeight: 700,
              color: accentHex,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            {eyebrow}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#FBF9F6',
            marginBottom: '24px',
            maxWidth: '1000px',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            style={{
              display: 'flex',
              fontSize: '30px',
              fontWeight: 400,
              lineHeight: 1.35,
              color: '#94A3B8',
              maxWidth: '950px',
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Footer — brand on left, optional meta on right */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '40px',
            borderTop: '1px solid #1E293B',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              fontWeight: 600,
              color: '#64748B',
              letterSpacing: '0.05em',
            }}
          >
            Teaching the future. We teach thinking, not just coding.
          </div>
          {footerRight && (
            <div
              style={{
                display: 'flex',
                fontSize: '22px',
                fontWeight: 700,
                color: accentHex,
              }}
            >
              {footerRight}
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
