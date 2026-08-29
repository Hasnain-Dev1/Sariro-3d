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
  GRADE_GROUPS,
  LESSONS_PER_GRADE,
  LESSONS_PER_GROUP,
  SCHOOL_SUBJECTS,
  buildGradeSyllabus,
  enrolmentOptions,
  subjectsForGroup,
} from '../src/lib/school/curriculum';
import { flattenTaxonomy } from '../src/lib/capabilities/taxonomy';
import {
  LIST_PER_CLASS,
  LIST_PER_MONTH,
  PRICE_PER_CLASS,
  PRICE_PER_MONTH,
  formatPrice,
  paymentPlans,
  startingAtLine,
} from '../src/lib/school/pricing';
import {
  REGIONS,
  activeRegions,
  billingNote,
  regionalPlans,
  startingAtFor,
} from '../src/lib/school/regions';

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
      if (syl.lessonCount !== LESSONS_PER_GRADE) {
        problems.push(`${subject.slug} grade ${grade}: ${syl.lessonCount} lessons, expected ${LESSONS_PER_GRADE}`);
      }
      const keys = new Set(syl.modules.flatMap((m) => m.lessons.map((l) => l.key)));
      if (keys.size !== LESSONS_PER_GRADE) {
        problems.push(`${subject.slug} grade ${grade}: duplicate lesson keys`);
      }
    }
  }
}

/* ── what a parent can buy ──────────────────────────────────────────────── */
console.log('\nsample offer — Mathematics, grade 6\n' + '-'.repeat(62));
for (const opt of enrolmentOptions('mathematics', 6)) {
  console.log(`  ${opt.label.padEnd(34)} ${String(opt.lessonCount).padStart(3)} lessons · ${opt.months} months`);
}

/* ── report ─────────────────────────────────────────────────────────────── */
const offered = SCHOOL_SUBJECTS.reduce((n, s) => n + s.groups.length, 0);

console.log('\n' + '='.repeat(62));
console.log(`subjects        : ${SCHOOL_SUBJECTS.length}`);
console.log(`subject×group   : ${offered} offerings`);
console.log(`lessons scaffolded : ${totalLessons}`);
console.log(`lessons authored   : ${totalAuthored}  (${totalLessons - totalAuthored} still blank)`);
for (const group of GRADE_GROUPS) {
  console.log(`  ${group.label.padEnd(12)} ${subjectsForGroup(group.slug).map((s) => s.name).join(', ')}`);
}

/* ── pricing ────────────────────────────────────────────────────────────── */
for (const ratio of ['1:4', '1:1'] as const) {
  console.log(`
pricing — ${ratio}
` + '-'.repeat(62));
  console.log(`  ${startingAtLine(ratio)}`);
  for (const plan of paymentPlans(ratio)) {
    const p = plan.price;
    console.log(
      `  ${plan.label.padEnd(18)} ${formatPrice(p.amount).padStart(12)}` +
      `  was ${formatPrice(p.listAmount).padStart(12)}  -${p.discountPercent}%` +
      `  (${p.classes} classes @ ${formatPrice(p.perClass)})`
    );
  }
}

/* ── regional pricing ───────────────────────────────────────────────────── */
console.log(`
regional pricing
` + '-'.repeat(62));
for (const region of REGIONS) {
  if (!region.confirmed || region.perMonth <= 0) {
    console.log(`  ${region.name.padEnd(15)} NOT CONFIGURED — hidden from all pricing pages`);
    continue;
  }
  const plans = regionalPlans(region);
  const note = billingNote(region);
  console.log(`  ${region.name} (${region.currency})`);
  console.log(`    ${startingAtFor(region)}`);
  for (const p of plans) {
    console.log(
      `    ${p.label.padEnd(18)} ${p.formatted.padStart(11)}` +
      `  was ${p.formattedList.padStart(11)}  -${p.discountPercent}%  (${p.classes} classes)`
    );
  }
  if (note) console.log(`    disclosure: ${note}`);
}
console.log(`
  live regions: ${activeRegions().map((r) => r.name).join(', ')}`);

// The two anchors disagree: 4 x LIST_PER_CLASS should equal LIST_PER_MONTH if a
// parent is ever going to multiply. Flagged, not corrected — the numbers are a
// business decision, but the inconsistency is visible to anyone with a phone.
const impliedMonthlyList = LIST_PER_CLASS * 4;
if (impliedMonthlyList !== LIST_PER_MONTH) {
  console.log(`
PRICING NOTE
` + '-'.repeat(62));
  console.log(`  per-class anchor implies ${formatPrice(impliedMonthlyList)}/month, but the`);
  console.log(`  monthly anchor is ${formatPrice(LIST_PER_MONTH)} — two different discount rates`);
  console.log(`  on the same product (${Math.round((1 - PRICE_PER_CLASS / LIST_PER_CLASS) * 100)}% per class vs ${Math.round((1 - PRICE_PER_MONTH / LIST_PER_MONTH) * 100)}% monthly).`);
  console.log(`  Align LIST_PER_MONTH to ${formatPrice(impliedMonthlyList)} to make the maths hold.`);
}

if (problems.length) {
  console.log(`\nPROBLEMS — ${problems.length}\n` + '-'.repeat(62));
  for (const p of problems) console.log(`  ${p}`);
  console.log('');
  process.exit(1);
}
console.log('\nScaffold is complete and every strand reference resolves.\n');
