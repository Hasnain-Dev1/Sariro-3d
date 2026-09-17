'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import UserAvatar, { avatarUrlFor } from '@/components/account/user-avatar';

/**
 * SARIRO — change your profile picture, in Settings
 * ============================================================================
 * The picture is cropped to a centred square and shrunk to 256 pixels in the
 * browser before it is sent, so a 6 MB phone photo uploads as a few tens of
 * kilobytes and every avatar on the site loads instantly. The server
 * (api/account/avatar) stores it and puts it on the profile.
 */

const SIDE = 256;

async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIDE;
  canvas.height = SIDE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIDE, SIDE);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.88));
}

export default function AvatarEditor({ name, email }: { name: string; email: string | null | undefined }) {
  const { user, profile, refreshProfile } = useAuth();
  const input = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = avatarUrlFor(profile, user);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!/^image\//.test(file.type)) { setError('Choose a photo — a JPEG, PNG or WebP picture.'); return; }
    setBusy('upload');
    try {
      let blob: Blob = file;
      try { blob = await squareJpeg(file); } catch { /* a browser that cannot decode it sends the original */ }
      const form = new FormData();
      form.append('file', new File([blob], blob === file ? file.name : 'avatar.jpg', { type: blob.type || file.type }));
      const res = await fetch('/api/account/avatar', { method: 'POST', body: form });
      const j = await res.json().catch(() => null);
      if (!j?.ok) { setError(j?.message ?? 'The picture could not be saved.'); return; }
      await refreshProfile();
    } catch {
      setError('The picture could not be saved. Check your connection.');
    } finally {
      setBusy(null);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setError(null);
    setBusy('remove');
    try {
      const res = await fetch('/api/account/avatar', { method: 'DELETE' });
      const j = await res.json().catch(() => null);
      if (!j?.ok) { setError(j?.message ?? 'The picture could not be removed.'); return; }
      await refreshProfile();
    } catch {
      setError('The picture could not be removed. Check your connection.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={!!busy}
        className="relative shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Change profile picture"
      >
        <UserAvatar url={url} name={name || email} size={64} shape="rounded" />
        <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-600">
          {busy === 'upload' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900 truncate">{name || 'Your name'}</div>
        <div className="text-xs text-slate-500 truncate">{email}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => input.current?.click()} disabled={!!busy} className="text-[12px] font-bold text-blue-700 hover:text-blue-900 disabled:opacity-50">
            {url ? 'Change photo' : 'Add a photo'}
          </button>
          {url && (
            <button type="button" onClick={() => void remove()} disabled={!!busy} className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-rose-700 disabled:opacity-50">
              {busy === 'remove' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Remove
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-[12px] font-semibold text-rose-700">{error}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void choose(e.target.files?.[0])}
      />
    </div>
  );
}
