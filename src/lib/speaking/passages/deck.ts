/**
 * SARIRO — dealing passages without repeats
 * ============================================================================
 * Like a shuffled deck: every passage comes up once before any comes up twice.
 * Random alone would hand a child the same passage twice in a week out of a
 * hundred and twenty; in order would hand every child the same first passage.
 *
 * What has been dealt is remembered on the device, per drill, so coming back
 * tomorrow carries on rather than starting again. Storage is untrusted, so ids
 * that no longer exist are dropped.
 */

export interface Dealt {
  id: string;
  /** Everything dealt so far in this pass through the deck, this one included. */
  seen: string[];
}

export function dealNext(ids: readonly string[], seen: readonly string[], rand: () => number = Math.random): Dealt {
  if (ids.length === 0) throw new Error('dealNext: an empty deck');
  const known = new Set(ids);
  let history = seen.filter((id) => known.has(id));

  let pool = ids.filter((id) => !history.includes(id));
  if (pool.length === 0) {
    // A full pass is done. Start again — but never with the one just read.
    const last = history[history.length - 1];
    history = [];
    pool = ids.length > 1 ? ids.filter((id) => id !== last) : [...ids];
  }

  const id = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
  return { id, seen: [...history, id] };
}

/** Read a stored deck back. Anything malformed is an empty deck, never an error. */
export function parseSeen(raw: string | null | undefined): string[] {
  try {
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Deal the next passage for a drill, remembering it on this device. Never throws on storage. */
export function dealFromStorage(key: string, ids: readonly string[], rand: () => number = Math.random): string {
  let seen: string[] = [];
  try { seen = parseSeen(localStorage.getItem(key)); } catch { /* private mode */ }
  const next = dealNext(ids, seen, rand);
  try { localStorage.setItem(key, JSON.stringify(next.seen)); } catch { /* the passage still shows */ }
  return next.id;
}
