/**
 * SARIRO — Capability seed generator  (Stage 2 · S0)
 * =========================================================
 * The map and its content tags are authored in code so they can be argued over
 * in a diff. This turns them into idempotent SQL the founder runs in Supabase by
 * hand, matching how every other migration in this repo ships.
 *
 * Run:  npx tsx scripts/generate-capability-seed.ts
 *
 * Then, in Supabase, in this order:
 *   1. scripts/capability-graph.sql
 *   2. scripts/capability-seed.generated.sql
 *   3. scripts/content-tags.generated.sql
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DOMAINS, findDuplicateSlugs, flattenTaxonomy } from '../src/lib/capabilities/taxonomy';
import { CONTENT_TAGS, validateContentTags } from '../src/lib/capabilities/content-tags';

const dupes = findDuplicateSlugs();
if (dupes.length) {
  console.error(`\nDuplicate slugs would silently merge two capabilities:\n  ${dupes.join('\n  ')}\n`);
  process.exit(1);
}

const tagProblems = validateContentTags();
if (tagProblems.length) {
  console.error(`\n${tagProblems.length} content-tag problems — a tag pointing nowhere is silent data loss:`);
  for (const p of tagProblems) console.error(`  ${p.unitKey}  ${p.detail}`);
  console.error('');
  process.exit(1);
}

const nodes = flattenTaxonomy();
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const NL = '\n';

/* ── 1. the map ───────────────────────────────────────────────────────────── */

const nodeRows = nodes
  .map((n) =>
    `  (${q(n.slug)}, ${q(n.name)}, ${q(n.kind)}, ${q(n.domainSlug)}, ` +
    `${n.parentSlug ? q(n.parentSlug) : 'null'}, ${q(n.description)}, ${n.isMeta}, ${n.sortOrder})`
  )
  .join(',' + NL);

const strandCount = nodes.length - DOMAINS.length;

const mapSql = [
  '-- =============================================================================',
  '-- SARIRO — Capability map seed   (GENERATED — do not edit by hand)',
  '-- =============================================================================',
  '-- Source:     src/lib/capabilities/taxonomy.ts',
  '-- Regenerate: npx tsx scripts/generate-capability-seed.ts',
  '--',
  '-- Run scripts/capability-graph.sql first. Idempotent: re-running updates names',
  '-- and descriptions in place and never orphans evidence, because slugs are the',
  '-- identity and slugs never change.',
  '--',
  `-- ${DOMAINS.length} domains · ${strandCount} strands · ${nodes.length} nodes total`,
  '-- =============================================================================',
  '',
  'insert into public.capabilities (slug, name, kind, domain_slug, parent_slug, description, is_meta, sort_order)',
  'values',
  nodeRows,
  'on conflict (slug) do update set',
  '  name        = excluded.name,',
  '  kind        = excluded.kind,',
  '  domain_slug = excluded.domain_slug,',
  '  parent_slug = excluded.parent_slug,',
  '  description = excluded.description,',
  '  is_meta     = excluded.is_meta,',
  '  sort_order  = excluded.sort_order;',
  '',
  '-- Anything in the table that is no longer in the authored map is reported, not',
  "-- deleted — a stray row may already have a learner's evidence pointing at it.",
  'do $$',
  'declare stray_count integer;',
  'begin',
  '  select count(*) into stray_count',
  '  from public.capabilities',
  `  where slug not in (${nodes.map((n) => q(n.slug)).join(', ')});`,
  '',
  '  if stray_count > 0 then',
  "    raise notice 'Sariro: % capability rows are not in taxonomy.ts — review before deleting.', stray_count;",
  '  end if;',
  'end $$;',
  '',
].join(NL);

writeFileSync(join(process.cwd(), 'scripts', 'capability-seed.generated.sql'), mapSql);

/* ── 2. content tags ──────────────────────────────────────────────────────── */

const tagRows = Object.entries(CONTENT_TAGS).flatMap(([unitKey, tags]) =>
  tags.map(([slug, weight]) => `  (${q(unitKey)}, ${q(slug)}, ${weight.toFixed(2)})`)
);

const taggedStrands = new Set(Object.values(CONTENT_TAGS).flat().map(([slug]) => slug));

const tagSql = [
  '-- =============================================================================',
  '-- SARIRO — Content capability tags   (GENERATED — do not edit by hand)',
  '-- =============================================================================',
  '-- Source:     src/lib/capabilities/content-tags.ts',
  '-- Regenerate: npx tsx scripts/generate-capability-seed.ts',
  '--',
  '-- Run scripts/capability-graph.sql and capability-seed.generated.sql first.',
  '--',
  `-- ${Object.keys(CONTENT_TAGS).length} lessons · ${tagRows.length} tags · ${taggedStrands.size} strands touched`,
  '-- =============================================================================',
  '',
  'insert into public.content_capabilities (unit_key, capability_slug, weight)',
  'values',
  tagRows.join(',' + NL),
  'on conflict (unit_key, capability_slug) do update set',
  '  weight = excluded.weight;',
  '',
].join(NL);

writeFileSync(join(process.cwd(), 'scripts', 'content-tags.generated.sql'), tagSql);

/* ── report ───────────────────────────────────────────────────────────────── */

console.log(`\nSARIRO — capability map`);
console.log('='.repeat(52));
for (const d of DOMAINS) {
  const tagged = d.strands.filter((s) => taggedStrands.has(s.slug)).length;
  console.log(
    `  ${d.name.padEnd(26)} ${String(d.strands.length).padStart(2)} strands` +
    `${tagged ? `   ${tagged} with content` : ''}${d.isMeta ? '   (meta)' : ''}`
  );
}
console.log('='.repeat(52));
console.log(`  ${DOMAINS.length} domains · ${strandCount} strands · ${nodes.length} nodes`);
console.log(`  ${Object.keys(CONTENT_TAGS).length} lessons tagged · ${tagRows.length} tags`);
console.log(`  ${taggedStrands.size} of ${strandCount} strands have content behind them`);
console.log(`\nwrote scripts/capability-seed.generated.sql`);
console.log(`wrote scripts/content-tags.generated.sql\n`);
