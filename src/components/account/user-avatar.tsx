'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';

/**
 * SARIRO — a person's picture, wherever a person is shown
 * ============================================================================
 * The founder, 17 Sep 2026: the avatar in the corner was always a letter. Every
 * avatar circle drew the first letter of the name and never looked at the
 * picture — while fifteen accounts already had one, from signing in with Google
 * or GitHub, and nobody could add their own.
 *
 * The picture, in order: the one on the profile (uploaded in Settings, or copied
 * from Google/GitHub at sign-up), then the sign-in provider's own. If the image
 * will not load — an expired Google link, a deleted file — it quietly becomes
 * the initial again rather than a broken image.
 */

/**
 * The best picture for the signed-in person. Once the profile has loaded it is
 * the only word — so a picture removed in Settings stays removed, rather than the
 * Google one reappearing. The sign-in provider's picture only fills the moment
 * before the profile arrives.
 */
export function avatarUrlFor(profile: { avatar_url?: string | null } | null | undefined, user: User | null | undefined): string | null {
  const https = (v: unknown): v is string => typeof v === 'string' && /^https:\/\//.test(v);
  if (profile) return https(profile.avatar_url) ? profile.avatar_url : null;
  const meta = (user?.user_metadata ?? {}) as { avatar_url?: unknown; picture?: unknown };
  return https(meta.avatar_url) ? meta.avatar_url : https(meta.picture) ? meta.picture : null;
}

export default function UserAvatar({
  url,
  name,
  size = 36,
  shape = 'circle',
  className = '',
}: {
  url: string | null | undefined;
  name: string | null | undefined;
  /** Pixels. */
  size?: number;
  shape?: 'circle' | 'rounded';
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const img = useRef<HTMLImageElement | null>(null);
  /* An image that failed before the page hydrated never fires onError for React,
     and would sit there broken. Checked once it has mounted. */
  useEffect(() => {
    const el = img.current;
    if (url && el && el.complete && el.naturalWidth === 0) {
      Promise.resolve().then(() => setFailed(url));
    }
  }, [url]);
  const radius = shape === 'circle' ? 'rounded-full' : size >= 56 ? 'rounded-2xl' : 'rounded-lg';
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';

  if (url && failed !== url) {
    return (
      // A plain <img>: avatars come from Google, GitHub and Supabase Storage, and next/image would need every host configured.
      <img
        ref={img}
        src={url}
        alt={name ? `${name}` : 'Profile picture'}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(url)}
        className={`${radius} object-cover shrink-0 bg-slate-100 shadow-md ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`${radius} bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-md shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), fontFamily: 'var(--font-jakarta)' }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
