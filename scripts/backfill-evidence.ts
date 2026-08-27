/**
 * SARIRO — Evidence backfill  (Stage 2 · S1)
 * =========================================================
 * Replays history that already exists in production into the ledger, so the
 * learner model does not start empty for students who have been here for months.
 *
 * Sources, strongest first:
 *   project_submissions + submission_feedback   a human judged real work
 *   lesson_progress                             exposure, not mastery
 *   session_attendance                          presence, not mastery
 *
 * Safe to re-run: every row carries a source_ref and the ledger has a unique
 * index on (learner, capability, source, source_ref), so replays are ignored
 * rather than double-counted.
 *
 * Run:
 *   npx tsx scripts/backfill-evidence.ts --dry      inspect, write nothing
 *   npx tsx scripts/backfill-evidence.ts            write
 *   npx tsx scripts/backfill-evidence.ts --learner <uuid>    one person only
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { COURSES } from '../src/lib/sariro-data';
import { resolveUnitKey } from '../src/lib/curriculum/identity';
import { evidenceForUnit, signalForReview, type EvidenceRowInsert } from '../src/lib/learner-model/evidence';
import { scoreLearner, type EvidenceRow } from '../src/lib/learner-model/mastery';

config();

const DRY = process.argv.includes('--dry');
const learnerFilter = (() => {
  const i = process.argv.indexOf('--learner');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('\nMissing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env\n');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

/** enrollments carry track + level, not course_id — map back to the course. */
function courseIdFor(track: string | null, level: string | null): string | null {
  if (!track || !level) return null;
  const course = COURSES.find(
    (c) => c.trackId === track && c.level.toLowerCase() === level.toLowerCase()
  );
  return course?.id ?? null;
}

async function main() {
  console.log(`\nSARIRO — evidence backfill${DRY ? '  (DRY RUN — nothing will be written)' : ''}`);
  console.log('='.repeat(62));

  /* ── enrollments give us learner + course for everything below ─────────── */
  let enrollQuery = db.from('enrollments').select('id, user_id, track, level');
  if (learnerFilter) enrollQuery = enrollQuery.eq('user_id', learnerFilter);
  const { data: enrollments, error: enrollErr } = await enrollQuery;
  if (enrollErr) throw new Error(`enrollments: ${enrollErr.message}`);

  const enrollment = new Map(
    (enrollments ?? []).map((e) => [
      e.id as string,
      { learnerId: e.user_id as string, courseId: courseIdFor(e.track, e.level) },
    ])
  );
  console.log(`  enrollments        ${enrollment.size}`);

  const rows: EvidenceRowInsert[] = [];
  const skipped = { noCourse: 0, noUnit: 0, noTags: 0 };

  const push = (unitKey: string | null, make: () => EvidenceRowInsert[]) => {
    if (!unitKey) {
      skipped.noUnit += 1;
      return;
    }
    const made = make();
    if (made.length === 0) skipped.noTags += 1;
    rows.push(...made);
  };

  /* ── 1. project reviews — the strongest signal ──────────────────────────── */
  const { data: submissions, error: subErr } = await db
    .from('project_submissions')
    .select('id, user_id, enrollment_id, module_num, lesson_name, status, reviewed_at, submitted_at');
  if (subErr) throw new Error(`project_submissions: ${subErr.message}`);

  let reviewCount = 0;
  for (const s of submissions ?? []) {
    const enr = enrollment.get(s.enrollment_id as string);
    if (!enr?.courseId) {
      skipped.noCourse += 1;
      continue;
    }
    if (learnerFilter && enr.learnerId !== learnerFilter) continue;

    // Only reviewed work is evidence. A submission nobody looked at tells us
    // the learner submitted something, not that they can do it.
    const outcome =
      s.status === 'approved' ? 'complete' : s.status === 'partial' ? 'partial' : s.status === 'resubmit' ? 'invalid' : null;
    if (!outcome) continue;

    const unitKey = resolveUnitKey(enr.courseId, s.module_num as string, s.lesson_name as string);
    push(unitKey, () => {
      reviewCount += 1;
      return evidenceForUnit(unitKey!, {
        learnerId: enr.learnerId,
        source: 'project_review',
        sourceRef: s.id as string,
        signal: signalForReview(outcome),
        observedAt: new Date((s.reviewed_at ?? s.submitted_at) as string),
      });
    });
  }
  console.log(`  project reviews    ${reviewCount}`);

  /* ── 2. lesson completions — weak, exposure only ────────────────────────── */
  const { data: progress, error: progErr } = await db
    .from('lesson_progress')
    .select('id, enrollment_id, module_num, lesson_name, completed_at');
  if (progErr) throw new Error(`lesson_progress: ${progErr.message}`);

  let lessonCount = 0;
  for (const p of progress ?? []) {
    if (!p.completed_at) continue;
    const enr = enrollment.get(p.enrollment_id as string);
    if (!enr?.courseId) {
      skipped.noCourse += 1;
      continue;
    }
    if (learnerFilter && enr.learnerId !== learnerFilter) continue;

    const unitKey = resolveUnitKey(enr.courseId, p.module_num as string, p.lesson_name as string);
    push(unitKey, () => {
      lessonCount += 1;
      return evidenceForUnit(unitKey!, {
        learnerId: enr.learnerId,
        source: 'lesson_complete',
        sourceRef: p.id as string,
        // Deliberately modest. Finishing a lesson is not evidence of capability,
        // and treating it as such is exactly the "% complete" model we left.
        signal: 0.4,
        observedAt: new Date(p.completed_at as string),
      });
    });
  }
  console.log(`  lesson completions ${lessonCount}`);

  /* ── report ─────────────────────────────────────────────────────────────── */
  console.log('='.repeat(62));
  console.log(`  evidence rows      ${rows.length}`);
  console.log(`  skipped            ${skipped.noCourse} no course · ${skipped.noUnit} unresolved lesson · ${skipped.noTags} untagged`);

  const learners = new Set(rows.map((r) => r.learner_id));
  console.log(`  learners covered   ${learners.size}`);

  if (rows.length === 0) {
    console.log('\nNothing to write.\n');
    return;
  }

  if (DRY) {
    printSampleProfile(rows);
    console.log('\nDRY RUN — nothing written. Re-run without --dry to commit.\n');
    return;
  }

  /* ── write in chunks; the unique index makes replays harmless ───────────── */
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await db
      .from('learning_evidence')
      .upsert(chunk, { onConflict: 'learner_id,capability_slug,source,source_ref', ignoreDuplicates: true });
    if (error) throw new Error(`insert: ${error.message}`);
    written += chunk.length;
    process.stdout.write(`\r  writing            ${written}/${rows.length}`);
  }
  console.log('');

  await rebuildMastery(learners);
  printSampleProfile(rows);
  console.log('');
}

/** Recompute the rollup from the ledger. Disposable by design. */
async function rebuildMastery(learners: Set<string>) {
  let updated = 0;
  for (const learnerId of learners) {
    const { data, error } = await db
      .from('learning_evidence')
      .select('capability_slug, source, signal, weight, observed_at')
      .eq('learner_id', learnerId);
    if (error) throw new Error(`read evidence: ${error.message}`);

    const scored = scoreLearner(
      (data ?? []).map((r) => ({
        capabilitySlug: r.capability_slug as string,
        source: r.source as EvidenceRow['source'],
        signal: Number(r.signal),
        weight: Number(r.weight),
        observedAt: new Date(r.observed_at as string),
      }))
    );

    if (scored.length === 0) continue;
    const { error: upErr } = await db.from('learner_capability_mastery').upsert(
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
    if (upErr) throw new Error(`mastery upsert: ${upErr.message}`);
    updated += 1;
  }
  console.log(`  mastery rebuilt    ${updated} learners`);
}

/**
 * The S1 exit test, printed: a real profile for a real learner. If this is not
 * recognisably that student to their teacher, the model is wrong — and no amount
 * of further engineering fixes a wrong model.
 */
function printSampleProfile(rows: EvidenceRowInsert[]) {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.learner_id, (counts.get(r.learner_id) ?? 0) + 1);

  const [learnerId] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!learnerId) return;

  const scored = scoreLearner(
    rows
      .filter((r) => r.learner_id === learnerId)
      .map((r) => ({
        capabilitySlug: r.capability_slug,
        source: r.source,
        signal: r.signal,
        weight: r.weight,
        observedAt: new Date(r.observed_at),
      }))
  );

  console.log(`\n  Sample profile — learner ${learnerId.slice(0, 8)}…  (${counts.get(learnerId)} observations)`);
  console.log('  ' + '-'.repeat(58));
  for (const m of scored.slice(0, 12)) {
    const bar = '█'.repeat(Math.round(m.level / 5)).padEnd(20, '·');
    console.log(
      `  ${m.capabilitySlug.padEnd(28)} ${bar} ${String(Math.round(m.level)).padStart(3)}` +
      `   conf ${m.confidence.toFixed(2)}  n=${m.evidenceCount}`
    );
  }
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
