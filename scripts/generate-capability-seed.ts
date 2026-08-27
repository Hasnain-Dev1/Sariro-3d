/**
 * SARIRO — Capability seed generator  (Stage 2 · S0)
 * =========================================================
 * The map is authored in code (`src/lib/capabilities/taxonomy.ts`) so it can be
 * argued over in a diff. This turns it into idempotent SQL the founder runs in
 * Supabase by hand, matching how every other migration in this repo ships.
 *
 * Run:  npx tsx scripts/generate-capability-seed.ts
 * Then: run scripts/capability-graph.sql, then the generated file, in Supabase.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DOMAINS, findDuplicateSlugs, flattenTaxonomy } from '../src/lib/capabilities/taxonomy';

const dupes = findDuplicateSlugs();
if (dupes.length) {
  console.error(`\nDuplicate slugs would silently merge two capabilities:\n  ${dupes.join('\n  ')}\n`);
  process.exit(1);
}

const nodes = flattenTaxonomy();
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const values = nodes
  .map((n) =>
    `  (${q(n.slug)}, ${q(n.name)}, ${q(n.kind)}, ${q(n.domainSlug)}, ` +
    `${n.parentSlug ? q(n.parentSlug) : 'null'}, ${q(n.description)}, ${n.isMeta}, ${n.sortOrder})`
  )
  .join(',\n');

const sql = `-- =============================================================================
-- SARIRO — Capability map seed   (GENERATED — do not edit by hand)
-- =============================================================================
-- Source:    src/lib/capabilities/taxonomy.ts
-- Regenerate: npx tsx scripts/generate-capability-seed.ts
--
-- Run scripts/capability-graph.sql first. Idempotent: re-running updates names
-- and descriptions in place and never orphans evidence, because slugs are the
-- identity and slugs never change.
--
-- ${DOMAINS.length} domains · ${nodes.length - DOMAINS.length} strands · ${nodes.length} nodes total
-- =============================================================================

insert into public.capabilities (slug, name, kind, domain_slug, parent_slug, description, is_meta, sort_order)
values
${values}
on conflict (slug) do update set
  name        = excluded.name,
  kind        = excluded.kind,
  domain_slug = excluded.domain_slug,
  parent_slug = excluded.parent_slug,
  description = excluded.description,
  is_meta     = excluded.is_meta,
  sort_order  = excluded.sort_order;

-- Anything in the table that is no longer in the authored map is reported, not
-- deleted — a stray row may already have a learner's evidence pointing at it.
do $$
declare stray_count integer;
begin
  select count(*) into stray_count
  from public.capabilities
  where slug not in (${nodes.map((n) => q(n.slug)).join(', ')});

  if stray_count > 0 then
    raise notice 'Sariro: % capability rows exist that are not in taxonomy.ts — review before deleting.', stray_count;
  end if;
end $$;
`;

const out = join(process.cwd(), 'scripts', 'capability-seed.generated.sql');
writeFileSync(out, sql);

const strandCount = nodes.length - DOMAINS.length;
console.log(`\nSARIRO — capability map`);
console.log('='.repeat(50));
for (const d of DOMAINS) {
  console.log(`  ${d.name.padEnd(28)} ${String(d.strands.length).padStart(2)} strands${d.isMeta ? '   (meta)' : ''}`);
}
console.log('='.repeat(50));
console.log(`  ${DOMAINS.length} domains · ${strandCount} strands · ${nodes.length} nodes`);
console.log(`\nwrote scripts/capability-seed.generated.sql\n`);
