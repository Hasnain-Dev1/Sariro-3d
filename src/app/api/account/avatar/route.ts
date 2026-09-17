import { NextRequest, NextResponse } from 'next/server';
import { requireActor } from '@/lib/auth/actor';

/**
 * SARIRO — your own profile picture
 * ============================================================================
 * POST   /api/account/avatar   multipart form, field `file`: a JPEG, PNG or WebP
 * DELETE /api/account/avatar   back to the initial
 *
 * Any signed-in person, for their own account only. The Settings page crops and
 * shrinks the picture to a small square before sending it, so what arrives is a
 * few tens of kilobytes; the limit here is a guard, not the expected size.
 *
 * Stored in a public Supabase Storage bucket, `avatars`, under the person's own
 * id — created here the first time it is needed, so there is no SQL to run.
 * Public on purpose: an avatar is shown to classmates, teachers and staff, and
 * a signed URL would expire out from under the page.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function ensureBucket(admin: import('@supabase/supabase-js').SupabaseClient): Promise<string | null> {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (data) return null;
  const { error } = await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES, allowedMimeTypes: Object.keys(TYPES) });
  if (error && !/already exists/i.test(error.message)) return error.message;
  return null;
}

/** Everything under this person's folder — removed when replaced or deleted, so old pictures do not pile up. */
async function clearFolder(admin: import('@supabase/supabase-js').SupabaseClient, userId: string, keep?: string) {
  const { data } = await admin.storage.from(BUCKET).list(userId, { limit: 100 });
  const stale = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keep);
  if (stale.length) await admin.storage.from(BUCKET).remove(stale);
}

export async function POST(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'account-avatar', limit: 10 });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('file');
    file = f instanceof File ? f : null;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid', message: 'Choose a picture to upload.' }, { status: 400 });
  }
  if (!file) return NextResponse.json({ ok: false, error: 'invalid', message: 'Choose a picture to upload.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ ok: false, error: 'type', message: 'Use a JPEG, PNG or WebP picture.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: 'size', message: 'That picture is too large — use one under 2 MB.' }, { status: 400 });

  const bucketError = await ensureBucket(actor.admin);
  if (bucketError) {
    console.error('[account-avatar] bucket:', bucketError);
    return NextResponse.json({ ok: false, error: 'storage', message: 'Pictures cannot be saved right now. Please try again later.' }, { status: 503 });
  }

  const path = `${actor.id}/${Date.now()}.${ext}`;
  const { error: upError } = await actor.admin.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (upError) {
    console.error('[account-avatar] upload:', upError.message);
    return NextResponse.json({ ok: false, error: 'storage', message: 'The picture could not be saved. Please try again.' }, { status: 502 });
  }

  const url = actor.admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: saveError } = await actor.admin.from('profiles').update({ avatar_url: url }).eq('id', actor.id);
  if (saveError) {
    console.error('[account-avatar] profile:', saveError.code, saveError.message);
    await actor.admin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ ok: false, error: 'save', message: 'The picture could not be saved to your profile.' }, { status: 500 });
  }

  await clearFolder(actor.admin, actor.id, path);
  return NextResponse.json({ ok: true, url });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'account-avatar', limit: 10 });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const { error } = await actor.admin.from('profiles').update({ avatar_url: null }).eq('id', actor.id);
  if (error) return NextResponse.json({ ok: false, error: 'save', message: 'The picture could not be removed.' }, { status: 500 });
  await clearFolder(actor.admin, actor.id);
  return NextResponse.json({ ok: true });
}
