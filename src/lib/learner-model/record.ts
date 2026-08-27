import { createServiceClient } from '@/lib/supabase/server';
import type { EvidenceRowInsert } from '@/lib/learner-model/evidence';

/**
 * SARIRO — Writing to the ledger (server only)
 * =========================================================
 * Every observation the product makes about a learner lands here.
 *
 * **Recording evidence must never break the thing that produced it.** A teacher
 * reviewing a project, a class being completed, attendance being marked — those
 * are load-bearing operations that move money and credits. If the ledger write
 * fails, the operation still succeeds and we log it. A missed observation is a
 * small loss; a teacher who cannot mark attendance is an outage.
 *
 * The ledger is append-only at the database level, so this only ever inserts.
 * Replays are absorbed by the unique index on
 * (learner_id, capability_slug, source, source_ref).
 */

export async function recordEvidence(rows: EvidenceRowInsert[], context: string): Promise<number> {
  if (rows.length === 0) return 0;

  try {
    const admin = createServiceClient();
    const { error } = await admin
      .from('learning_evidence')
      .upsert(rows, {
        onConflict: 'learner_id,capability_slug,source,source_ref',
        ignoreDuplicates: true,
      });

    if (error) {
      console.warn(`[evidence:${context}] insert failed:`, error.message);
      return 0;
    }
    return rows.length;
  } catch (err) {
    console.warn(`[evidence:${context}] threw:`, err instanceof Error ? err.message : String(err));
    return 0;
  }
}

/**
 * Recompute one learner's mastery rollup from their ledger.
 *
 * Deliberately not called on every write: the rollup is derived and disposable,
 * and rebuilding it inside a request that a teacher is waiting on would trade a
 * user-visible delay for a number nobody is reading at that moment. Callers
 * refresh it when someone is about to look — a dashboard load — or in a batch.
 */
export async function rebuildLearnerMastery(learnerId: string): Promise<number> {
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from('learning_evidence')
      .select('capability_slug, source, signal, weight, observed_at')
      .eq('learner_id', learnerId);

    if (error) {
      console.warn('[evidence:rebuild] read failed:', error.message);
      return 0;
    }

    const { scoreLearner } = await import('@/lib/learner-model/mastery');
    const scored = scoreLearner(
      (data ?? []).map((r) => ({
        capabilitySlug: r.capability_slug as string,
        source: r.source as Parameters<typeof scoreLearner>[0][number]['source'],
        signal: Number(r.signal),
        weight: Number(r.weight),
        observedAt: new Date(r.observed_at as string),
      }))
    );

    if (scored.length === 0) return 0;

    const { error: upErr } = await admin.from('learner_capability_mastery').upsert(
      scored.map((m) => ({
        learner_id: learnerId,
        capability_slug: m.capabilitySlug,
        level: m.level,
        confidence: m.confidence,
        evidence_count: m.evidenceCount,
        last_evidence_at: m.lastEvidenceAt.toISOString(),
        computed_at: new Date().toISOString(),
      })),
      { onConflict: 'learner_id,capability_slug' }
    );

    if (upErr) {
      console.warn('[evidence:rebuild] upsert failed:', upErr.message);
      return 0;
    }
    return scored.length;
  } catch (err) {
    console.warn('[evidence:rebuild] threw:', err instanceof Error ? err.message : String(err));
    return 0;
  }
}
