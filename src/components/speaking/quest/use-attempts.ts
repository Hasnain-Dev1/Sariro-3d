'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAttempts } from '@/lib/speaking/practice-log';
import type { PracticeAttempt } from '@/lib/speaking/progress';

/**
 * A learner's whole practice history, sound rounds included, for Voice Quest
 * and homework. `refresh` is called after a lab logs a row, so the mission it
 * belongs to ticks over without a reload.
 */
export function useAttempts(userId?: string) {
  const [attempts, setAttempts] = useState<PracticeAttempt[] | null>(null);

  const refresh = useCallback(async () => {
    const rows = await fetchAttempts(userId, { limit: 3000, sounds: true });
    setAttempts(rows);
  }, [userId]);

  useEffect(() => {
    let live = true;
    fetchAttempts(userId, { limit: 3000, sounds: true }).then((rows) => { if (live) setAttempts(rows); });
    return () => { live = false; };
  }, [userId]);

  /* A row is written a moment after the lab says so; ask twice so the second
     read catches a slow insert. */
  const afterLog = useCallback(() => {
    void refresh();
    window.setTimeout(() => { void refresh(); }, 1200);
  }, [refresh]);

  return { attempts, refresh, afterLog };
}
