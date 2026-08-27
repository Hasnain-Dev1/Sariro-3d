/**
 * SARIRO — Content Identity Audit  (Stage 2 · S0)
 * =========================================================
 * Answers the question every later slice depends on: can we reliably join a
 * `lesson_progress` row to the lesson content it refers to?
 *
 * Reports, per structured course, in three buckets that mean different things:
 *   BLOCKING     the join itself is unsound — duplicate claims, orphaned
 *                content, ambiguous names. Silent data corruption. Must be zero.
 *   CONTENT GAP  the join works; the lesson simply has not been written yet.
 *                A business problem, not an engineering one — does not block S1.
 *   ADVISORY     resolves by position, titles disagree. Worth a look.
 *
 * Also writes `scripts/content-units.lock.json`: a committed snapshot of every
 * unitKey. Because unitKey is derived from lesson position, reordering lessons
 * would silently repoint every capability tag — the lockfile turns that into a
 * reviewable diff instead of silent data damage.
 *
 * Run:   npx tsx scripts/audit-content-identity.ts
 * Exits non-zero when anything blocking is found, so it can gate CI later.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllStructuredCourses } from '../src/lib/curriculum';
import {
  getSyllabus,
  listContentUnits,
  normalizeLessonName,
  parseModuleNum,
  resolveSyllabusLesson,
  unitKeyOfLesson,
  type UnitKey,
} from '../src/lib/curriculum/identity';

type Problem = { courseId: string; module: string; detail: string };

const blocking: Problem[] = [];
const advisory: Problem[] = [];
const contentGap: Problem[] = [];
const claimed = new Set<UnitKey>();

console.log('\nSARIRO — content identity audit\n' + '='.repeat(60));

for (const course of getAllStructuredCourses()) {
  const { courseId } = course;
  const syllabus = getSyllabus(courseId);

  console.log(`\n${courseId}  ·  ${course.lessons.length} structured lessons`);

  if (!syllabus) {
    blocking.push({ courseId, module: '-', detail: 'course has structured lessons but no syllabus in sariro-data.ts' });
    console.log('  !! no syllabus found — nothing to join against');
    continue;
  }

  let exact = 0;
  let drift = 0;
  let gaps = 0;

  for (const mod of syllabus) {
    const modNum = parseModuleNum(mod.num);
    if (modNum === null) {
      blocking.push({ courseId, module: mod.num, detail: `module num "${mod.num}" is not an integer` });
      continue;
    }

    for (const lessonName of mod.lessons) {
      const r = resolveSyllabusLesson(courseId, mod.num, lessonName);

      if (!r.unitKey) {
        // Distinguish "we cannot join this" from "nobody has written it yet".
        // A lesson past the end of the authored module is simply unwritten —
        // the identity layer is fine, the curriculum is incomplete.
        const authoredInModule = course.lessons.filter((l) => l.moduleNum === modNum).length;
        const ordinal = mod.lessons.findIndex((l) => normalizeLessonName(l) === normalizeLessonName(lessonName));
        if (ordinal >= authoredInModule) {
          gaps++;
          contentGap.push({ courseId, module: mod.num, detail: `not written yet: "${lessonName}"` });
        } else {
          blocking.push({ courseId, module: mod.num, detail: `unresolved syllabus lesson: "${lessonName}"` });
        }
        continue;
      }

      if (claimed.has(r.unitKey)) {
        blocking.push({ courseId, module: mod.num, detail: `duplicate claim on ${r.unitKey} by "${lessonName}"` });
        continue;
      }
      claimed.add(r.unitKey);

      if (r.quality === 'name-drift') {
        drift++;
        advisory.push({
          courseId,
          module: mod.num,
          detail: `name drift  syllabus "${lessonName}"  vs  structured "${r.structuredName}"`,
        });
      } else {
        exact++;
      }
    }
  }

  // Structured lessons nothing points at: real content a student can never be
  // credited for, because no progress row will ever name it.
  const orphans = course.lessons.filter((l) => !claimed.has(unitKeyOfLesson(l)));
  for (const o of orphans) {
    blocking.push({
      courseId,
      module: String(o.moduleNum),
      detail: `orphan structured lesson (no syllabus entry): "${o.name}"`,
    });
  }

  console.log(`  exact ${exact}   name-drift ${drift}   orphans ${orphans.length}   not-written ${gaps}`);
}

/* ── name-collision check ───────────────────────────────────────────────────
   Two lessons with the same normalized name inside one module would make the
   ordinal lookup ambiguous — findIndex would always return the first. */
for (const course of getAllStructuredCourses()) {
  const syllabus = getSyllabus(course.courseId);
  if (!syllabus) continue;
  for (const mod of syllabus) {
    const seen = new Set<string>();
    for (const l of mod.lessons) {
      const n = normalizeLessonName(l);
      if (seen.has(n)) {
        blocking.push({ courseId: course.courseId, module: mod.num, detail: `ambiguous duplicate lesson name: "${l}"` });
      }
      seen.add(n);
    }
  }
}

/* ── report ─────────────────────────────────────────────────────────────── */

const units = listContentUnits();

if (advisory.length) {
  console.log(`\nADVISORY — ${advisory.length} (resolved by position; titles disagree)\n` + '-'.repeat(60));
  for (const p of advisory) console.log(`  ${p.courseId} m${p.module}  ${p.detail}`);
}

if (contentGap.length) {
  const byCourse = new Map<string, number>();
  for (const p of contentGap) byCourse.set(p.courseId, (byCourse.get(p.courseId) ?? 0) + 1);
  console.log(`\nCONTENT GAP — ${contentGap.length} sold-but-unwritten lessons\n` + '-'.repeat(60));
  for (const [c, n] of byCourse) console.log(`  ${c}  ${n} lessons in the public syllabus have no authored content`);
}

if (blocking.length) {
  console.log(`\nBLOCKING — ${blocking.length}\n` + '-'.repeat(60));
  for (const p of blocking) console.log(`  ${p.courseId} m${p.module}  ${p.detail}`);
}

console.log('\n' + '='.repeat(60));
console.log(`content units : ${units.length}`);
console.log(`resolved      : ${claimed.size}`);
console.log(`blocking      : ${blocking.length}`);
console.log(`content gap   : ${contentGap.length}`);
console.log(`advisory      : ${advisory.length}`);

const lockPath = join(process.cwd(), 'scripts', 'content-units.lock.json');
writeFileSync(
  lockPath,
  JSON.stringify(
    { generatedFrom: 'scripts/audit-content-identity.ts', count: units.length, units: units.map((u) => u.unitKey).sort() },
    null,
    2
  ) + '\n'
);
console.log(`lockfile      : scripts/content-units.lock.json (${units.length} keys)`);

if (blocking.length) {
  console.log('\nS0 is NOT clear. Every capability tag and evidence row depends on this join.\n');
  process.exit(1);
}
console.log('\nS0 identity clear — safe to tag capabilities against these keys.');
if (contentGap.length) {
  console.log(`Note: ${contentGap.length} lessons are sold in a public syllabus but not written.`);
  console.log('That is a content decision, not an identity problem — S1 is unblocked.\n');
} else {
  console.log('');
}
