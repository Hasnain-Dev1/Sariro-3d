/**
 * SARIRO — which courses actually have lessons
 * =========================================================
 *   npx tsx scripts/audit-lesson-content.ts
 *
 * Read-only. Prints every course in the catalogue beside the number of lessons
 * its syllabus promises and the number anyone has actually written.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * Two things hid the gap. The admin screen ticked a lesson green as soon as a
 * ROW existed, whether or not it had content; and a seeded row renders as a
 * heading on an empty page, which looks like a bug rather than an unwritten
 * lesson. Both are fixed, and this is how you check the answer without
 * clicking through thirty-five courses.
 *
 * "Written" here means the same thing it means to a learner — see
 * lib/lessons/content-state.ts.
 */
import { readFileSync } from 'node:fs';
import { COURSES } from '@/lib/sariro-data';
import { getAllStructuredCourses } from '@/lib/curriculum';
import { hasWrittenContent } from '@/lib/lessons/content-state';

const env: Record<string, string> = {};
for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const BASE = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
const res = await fetch(`${BASE}/rest/v1/lesson_pages?select=course_id,lesson_name,html_content&limit=5000`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
const pages = (await res.json()) as { course_id: string; lesson_name: string; html_content: string }[];

const structuredCount = new Map(getAllStructuredCourses().map((c) => [c.courseId, c.lessons.length]));

const byCourse = new Map<string, { total: number; real: number }>();
for (const p of pages) {
  const e = byCourse.get(p.course_id) ?? { total: 0, real: 0 };
  e.total++;
  // The same rule the content route and the admin screen use, so all three
  // agree about what "written" means.
  if (hasWrittenContent(p.html_content)) e.real++;
  byCourse.set(p.course_id, e);
}

console.log(
  'course'.padEnd(20), 'track'.padEnd(11), 'level'.padEnd(13),
  'syllabus'.padStart(8), 'pages'.padStart(6), 'written'.padStart(8), '  source'
);
console.log('-'.repeat(92));

let missing = 0, stubbed = 0, done = 0;
let syllabusLessons = 0, writtenLessons = 0;

for (const c of COURSES) {
  const syl = (c.syllabus ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
  const page = byCourse.get(c.id);
  const struct = structuredCount.get(c.id);

  syllabusLessons += syl;
  writtenLessons += struct ?? page?.real ?? 0;

  let source = 'NOTHING';
  if (struct) { source = `structured (${struct})`; done++; }
  else if (page && page.real > 0) { source = 'db html'; done++; }
  else if (page) { source = 'db stubs only'; stubbed++; }
  else { missing++; }

  console.log(
    c.id.padEnd(20), String(c.trackId).padEnd(11), String(c.level).padEnd(13),
    String(syl).padStart(8), String(page?.total ?? 0).padStart(6),
    String(page?.real ?? 0).padStart(8), '  ' + source
  );
}

console.log();
console.log(`${COURSES.length} courses in the catalogue`);
console.log(`  ${done} have some written lessons`);
console.log(`  ${stubbed} have pages but not one is written`);
console.log(`  ${missing} have no lesson pages at all`);
console.log();
// The count that actually says how much work is left. Course-level buckets
// flatter it: a course with one lesson of forty-eight lands in "has content".
console.log(`${writtenLessons} of ${syllabusLessons} lessons written across the whole catalogue`);
console.log(`${syllabusLessons - writtenLessons} still show "taught live with your mentor"`);

const known = new Set(COURSES.map((c) => c.id));
const orphans = [...byCourse.keys()].filter((id) => !known.has(id));
if (orphans.length) console.log('\nlesson_pages rows for courses NOT in the catalogue:', orphans);
}
void main();
