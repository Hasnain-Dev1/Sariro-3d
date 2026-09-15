import type { SupabaseClient } from '@supabase/supabase-js';
import { isMissingRelation } from '@/lib/supabase/schema-gaps';
import { DEFAULT_PRICE_BOOK, sanitizePriceBook, type PriceBook } from './price-book';

/**
 * SARIRO — loading and saving the price book (server only)
 * ============================================================================
 * Always through the service client, after the route has checked who is
 * asking: the tables have no RLS policies at all (scripts/price-book.sql).
 */

export const PRICE_BOOK_SETUP_MESSAGE =
  'Saving prices is waiting on a database update — scripts/price-book.sql has not been run in Supabase yet. ' +
  'Until then everyone sees the default price list.';

export interface LoadedPriceBook {
  /** False until scripts/price-book.sql has run. */
  configured: boolean;
  /** True once somebody has saved a book; false while it is still the defaults. */
  saved: boolean;
  book: PriceBook;
  updatedAt: string | null;
  updatedBy: string | null;
}

async function nameOf(admin: SupabaseClient, id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await admin.from('profiles').select('full_name').eq('id', id).maybeSingle();
  return (data?.full_name as string | null) ?? null;
}

export async function loadPriceBook(admin: SupabaseClient): Promise<LoadedPriceBook> {
  const { data, error } = await admin
    .from('price_book')
    .select('data, updated_at, updated_by')
    .eq('id', 'current')
    .maybeSingle();

  if (error) {
    if (!isMissingRelation(error)) console.warn('[price-book] load failed:', error.code, error.message);
    return { configured: !isMissingRelation(error), saved: false, book: DEFAULT_PRICE_BOOK, updatedAt: null, updatedBy: null };
  }
  if (!data) return { configured: true, saved: false, book: DEFAULT_PRICE_BOOK, updatedAt: null, updatedBy: null };

  return {
    configured: true,
    saved: true,
    // Sanitized on the way out too: a book saved before a field existed gets
    // that field's default instead of undefined.
    book: sanitizePriceBook(data.data),
    updatedAt: (data.updated_at as string) ?? null,
    updatedBy: await nameOf(admin, (data.updated_by as string | null) ?? null),
  };
}

export interface HistoryRow {
  changedAt: string;
  changedBy: string | null;
  note: string | null;
}

export async function priceBookHistory(admin: SupabaseClient, limit = 10): Promise<HistoryRow[]> {
  const { data, error } = await admin
    .from('price_book_history')
    .select('changed_at, changed_by, note')
    .order('changed_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  /* profiles has no FK join through PostgREST we can rely on, so names are
     looked up once per distinct person. */
  const ids = [...new Set(data.map((r) => r.changed_by as string | null).filter((v): v is string => !!v))];
  const names = new Map<string, string | null>();
  if (ids.length) {
    const { data: people } = await admin.from('profiles').select('id, full_name').in('id', ids);
    for (const p of people ?? []) names.set(p.id as string, (p.full_name as string | null) ?? null);
  }
  return data.map((r) => ({
    changedAt: r.changed_at as string,
    changedBy: r.changed_by ? names.get(r.changed_by as string) ?? null : null,
    note: (r.note as string | null) ?? null,
  }));
}

export type SaveResult = { ok: true; updatedAt: string } | { ok: false; setup: boolean; message: string };

export async function savePriceBook(admin: SupabaseClient, raw: unknown, actorId: string, note: string | null): Promise<SaveResult> {
  const book = sanitizePriceBook(raw);
  const now = new Date().toISOString();

  const { error } = await admin
    .from('price_book')
    .upsert({ id: 'current', data: book, updated_at: now, updated_by: actorId }, { onConflict: 'id' });
  if (error) {
    const setup = isMissingRelation(error);
    if (!setup) console.warn('[price-book] save failed:', error.code, error.message);
    return { ok: false, setup, message: setup ? PRICE_BOOK_SETUP_MESSAGE : 'The price book did not save.' };
  }

  /* The history is the reason anybody can trust a floor: who moved it, when,
     and from what. A failure here is reported, not swallowed — the book saved,
     but a change nobody can trace is worth a warning in the log. */
  const { error: histErr } = await admin
    .from('price_book_history')
    .insert({ data: book, note: note?.slice(0, 500) || null, changed_at: now, changed_by: actorId });
  if (histErr) console.warn('[price-book] history insert failed:', histErr.code, histErr.message);

  return { ok: true, updatedAt: now };
}
