/**
 * SARIRO — School curriculum audit
 * =========================================================
 * Proves the grade scaffold is complete and internally honest before anything is
 * sold against it:
 *
 *   · every grade belongs to exactly one group (an overlap means a parent
 *     choosing "grade 6" gets two answers and the scheduler cannot place them)
 *   · every subject offers exactly 48 lessons per grade
 *   · every strand a subject claims actually exists in the capability map
 *     (a dead strand reference means evidence goes nowhere and the learner
 *     model quietly stays empty)
 *
 * Run: npx tsx scripts/audit-school-curriculum.ts
 */

import {
  AUTHORED_TITLES,
  GRADE_GROUPS,
  LESSONS_PER_GRADE,
  LESSONS_PER_GROUP,
  LESSONS_PER_MODULE,
  MODULES_PER_GRADE,
  SCHOOL_SUBJECTS,
  buildGradeSyllabus,
  enrolmentOptions,
  getSubject,
  gradeGroupFor,
  subjectsForGroup,
  testPositions,
} from '../src/lib/school/curriculum';
import { flattenTaxonomy } from '../src/lib/capabilities/taxonomy';
import {
  formatPrice,
  paymentPlans,
  priceBundle,
  startingAtLine,
} from '../src/lib/school/pricing';

const problems: string[] = [];
const strands = new Set(flattenTaxonomy().filter((n) => n.kind === 'strand').map((n) => n.slug));

console.log('\nSARIRO — school curriculum\n' + '='.repeat(62));

/* ── grade groups must partition the grades cleanly ─────────────────────── */
const seen = new Map<number, string>();
for (const g of GRADE_GROUPS) {
  if (g.grades.length !== 3) problems.push(`${g.slug}: ${g.grades.length} grades, expected 3`);
  for (const grade of g.grades) {
    const owner = seen.get(grade);
    if (owner) problems.push(`grade ${grade} is in both "${owner}" and "${g.slug}" — a grade must belong to exactly one group`);
    seen.set(grade, g.slug);
  }
}
const covered = [...seen.keys()].sort((a, b) => a - b);
const expected = Array.from({ length: 12 }, (_, i) => i + 1);
const missing = expected.filter((g) => !seen.has(g));
if (missing.length) problems.push(`grades not covered by any group: ${missing.join(', ')}`);

console.log(`grades covered : ${covered.join(', ')}`);
console.log(`groups         : ${GRADE_GROUPS.map((g) => g.label).join(' · ')}`);

/* ── the offer matrix ───────────────────────────────────────────────────── */
console.log('\nsubject × grade group\n' + '-'.repeat(62));
const header = 'subject'.padEnd(14) + GRADE_GROUPS.map((g) => g.label.padEnd(12)).join('');
console.log(header);

let totalLessons = 0;
let totalAuthored = 0;

for (const subject of SCHOOL_SUBJECTS) {
  let row = subject.name.padEnd(14);
  for (const group of GRADE_GROUPS) {
    row += (subject.groups.includes(group.slug) ? '144' : '—').padEnd(12);
    if (subject.groups.includes(group.slug)) totalLessons += LESSONS_PER_GROUP;
  }
  console.log(row);

  for (const dead of subject.strands.filter((s) => !strands.has(s))) {
    problems.push(`${subject.slug}: strand "${dead}" is not in the capability map`);
  }
}

/* ── every grade scaffolds to exactly 48 ────────────────────────────────── */
for (const subject of SCHOOL_SUBJECTS) {
  for (const group of GRADE_GROUPS) {
    if (!subject.groups.includes(group.slug)) continue;
    for (const grade of group.grades) {
      const syl = buildGradeSyllabus(subject.slug, grade);
      totalAuthored += syl.authoredCount;
      // 48 SLOTS is what a parent buys; 46 of them teach and 2 assess.
      if (syl.slotCount !== LESSONS_PER_GRADE) {
        problems.push(`${subject.slug} grade ${grade}: ${syl.slotCount} slots, expected ${LESSONS_PER_GRADE}`);
      }
      if (syl.testCount !== 2) {
        problems.push(`${subject.slug} grade ${grade}: ${syl.testCount} tests, expected 2`);
      }
      const keys = new Set(syl.modules.flatMap((m) => m.lessons.map((l) => l.key)));
      if (keys.size !== LESSONS_PER_GRADE) {
        problems.push(`${subject.slug} grade ${grade}: duplicate lesson keys`);
      }
    }
  }
}

/* ── authored content must fit the scaffold exactly ─────────────────────────
 * The checks above pass whether or not a single title is written — they only
 * measure the generated scaffold. These check the AUTHORING, which is where the
 * expensive mistakes live: a module with seven lessons pushes a title into a
 * slot that does not exist and it vanishes with no error, and a title written
 * into slot 24 or 48 is overwritten by the assessment and also vanishes. Both
 * failures are invisible in the UI — the page just renders "Lesson 24".
 */
console.log('\nauthored curriculum\n' + '-'.repeat(62));

for (const [key, authored] of Object.entries(AUTHORED_TITLES)) {
  const [subjectSlug, gradeRaw] = key.split(':');
  const grade = Number(gradeRaw);
  const subject = getSubject(subjectSlug);
  const group = gradeGroupFor(grade);

  if (!subject) {
    problems.push(`authored "${key}": no such subject`);
    continue;
  }
  if (!group || !subject.groups.includes(group.slug)) {
    problems.push(`authored "${key}": ${subject.name} is not offered for grade ${grade}`);
    continue;
  }
  if (authored.modules.length !== MODULES_PER_GRADE) {
    problems.push(`authored "${key}": ${authored.modules.length} modules, expected ${MODULES_PER_GRADE}`);
  }

  const testSlots = new Set(testPositions(MODULES_PER_GRADE * LESSONS_PER_MODULE));
  const titles = new Map<string, number>();

  authored.modules.forEach((mod, i) => {
    const num = i + 1;
    // Slots 24 and 48 are assessments and land on the LAST slot of modules 4
    // and 8, so those modules carry five teachable lessons, not six.
    const slots = Array.from({ length: LESSONS_PER_MODULE }, (_, l) => (num - 1) * LESSONS_PER_MODULE + l + 1);
    const teachable = slots.filter((s) => !testSlots.has(s)).length;

    if (!mod.title?.trim()) problems.push(`authored "${key}" module ${num}: empty module title`);
    if (mod.lessons.length !== teachable) {
      problems.push(
        `authored "${key}" module ${num}: ${mod.lessons.length} lessons, expected ${teachable}` +
        (teachable < LESSONS_PER_MODULE ? ' (an assessment takes the last slot of this module)' : '')
      );
    }
    mod.lessons.forEach((title, l) => {
      if (!title?.trim()) problems.push(`authored "${key}" module ${num} lesson ${l + 1}: empty title`);
      titles.set(title, (titles.get(title) ?? 0) + 1);
    });
  });

  for (const [title, count] of titles) {
    if (count > 1) problems.push(`authored "${key}": lesson title "${title}" appears ${count} times`);
  }

  const syl = buildGradeSyllabus(subjectSlug, grade);
  const modulesNamed = syl.modules.filter((m) => m.authored).length;
  console.log(
    `  ${key.padEnd(16)} ${String(syl.authoredCount).padStart(2)}/${syl.lessonCount} lessons` +
    `  ${modulesNamed}/${MODULES_PER_GRADE} modules named`
  );
}

/* ── what is still blank ────────────────────────────────────────────────── */
const gradeKeys: string[] = [];
for (const subject of SCHOOL_SUBJECTS) {
  for (const group of GRADE_GROUPS) {
    if (!subject.groups.includes(group.slug)) continue;
    for (const grade of group.grades) gradeKeys.push(`${subject.slug}:${grade}`);
  }
}
const done = gradeKeys.filter((k) => AUTHORED_TITLES[k]).length;
console.log(
  `\n  coverage: ${done}/${gradeKeys.length} subject-grades authored` +
  `  · ${gradeKeys.length - done} still render as "Lesson N"`
);

/* ── tests inside the scaffold ──────────────────────────────────────────── */
const sample = buildGradeSyllabus('mathematics', 8);
console.log('\nslot shape — Mathematics grade 8\n' + '-'.repeat(62));
console.log(`  ${sample.slotCount} slots = ${sample.lessonCount} lessons + ${sample.testCount} tests`);
for (const m of sample.modules) {
  for (const l of m.lessons) {
    if (l.kind === 'test') console.log(`  slot ${String(l.number).padStart(2)} · module ${m.num} · ${l.title}`);
  }
}
if (sample.lessonCount !== 46 || sample.testCount !== 2) {
  problems.push(`grade scaffold should be 46 lessons + 2 tests, got ${sample.lessonCount} + ${sample.testCount}`);
}
console.log(`  a full grade group therefore carries ${sample.testCount * 3} tests`);

/* ── pricing ────────────────────────────────────────────────────────────── */
for (const ratio of ['1:4', '1:1'] as const) {
  console.log(`\npricing — ${ratio}  (${formatPrice(ratio === '1:1' ? 9.99 : 6.99)}/class)\n` + '-'.repeat(62));
  console.log(`  ${startingAtLine(ratio)}`);
  for (const classes of [30, 42, 48, 96, 144]) {
    const b = priceBundle(classes, ratio);
    console.log(
      `  ${String(classes).padStart(3)} classes  raw ${formatPrice(b.rawTotal).padStart(9)}` +
      ` -> ${formatPrice(b.total).padStart(7)}` +
      `  (gives up ${formatPrice(b.roundingDiscount)})` +
      `  vs ${formatPrice(b.monthlyEquivalent).padStart(9)} monthly` +
      `  = save ${formatPrice(b.upfrontSaving)}`
    );
  }
}

console.log('\nplans — 48 classes, 1:4\n' + '-'.repeat(62));
for (const plan of paymentPlans(48, '1:4')) {
  console.log(`  ${plan.label.padEnd(14)} ${plan.formatted.padStart(9)}  ${plan.savingLabel ?? ''}`);
}

if (problems.length) {
  console.log(`\nPROBLEMS — ${problems.length}\n` + '-'.repeat(62));
  for (const p of problems) console.log(`  ${p}`);
  console.log('');
  process.exit(1);
}
console.log('\nScaffold is complete and every strand reference resolves.\n');
