#!/usr/bin/env node
/**
 * Peek at repeated paragraphs between specific file groups.
 * Shows the actual duplicated text.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(__dirname, '..', 'src/content');

const CLUSTERS = [
  { label: 'C1: developer reviews (10)', ids: ['guides/azizi-developments-review','guides/damac-properties-review','guides/ejari-registration-landlord-guide','guides/ellington-properties-review','guides/emaar-properties-review','guides/meraas-properties-review'] },
  { label: 'C2: bahrain-bridge + freelance (3)', ids: ['guides/bahrain-saudi-bridge-commute','guides/uae-freelance-permit-dubai','guides/uae-green-visa-freelancer'] },
  { label: 'C3: living comparison (3)', ids: ['guides/bahrain-vs-dubai-living','guides/dubai-monthly-budget-expat-family','guides/dubai-vs-abu-dhabi-living'] },
  { label: 'C4: utility/rental (3)', ids: ['guides/dubai-district-cooling-charges','guides/dubai-utility-bills-deewa','guides/short-term-vs-long-term-rental-dubai'] },
  { label: 'C5: property transactions (3)', ids: ['guides/dubai-property-handover-checklist','guides/mistakes-foreign-buyers-dubai-property','guides/selling-property-dubai-guide'] },
  { label: 'C6: rental yield compare (3)', ids: ['compare/dubai-vs-oman-rental-yield','compare/dubai-vs-saudi-rental-yield','compare/rak-vs-dubai-rental-yield'] },
];

const MIN_PARA_LEN = 80;

for (const cluster of CLUSTERS) {
  console.log(`\n=== ${cluster.label} ===`);

  const parasByHash = new Map();

  for (const id of cluster.ids) {
    const path = join(CONTENT, `${id}.mdx`);
    const raw = readFileSync(path, 'utf8');
    const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');

    const paragraphs = body.split(/\n\n+/).filter(p => p.trim().length >= MIN_PARA_LEN);
    for (const p of paragraphs) {
      const normalized = p.trim().replace(/\s+/g, ' ');
      const hash = createHash('md5').update(normalized).digest('hex').slice(0, 12);
      if (!parasByHash.has(hash)) parasByHash.set(hash, { text: normalized, files: [] });
      parasByHash.get(hash).files.push(id.split('/')[1]);
    }
  }

  // Show paragraphs that appear in 3+ files (or 2+ if cluster has only 3 files)
  const minCount = cluster.ids.length <= 3 ? 2 : 3;
  const dupes = [...parasByHash.values()]
    .filter(v => v.files.length >= minCount)
    .sort((a, b) => b.files.length - a.files.length);

  if (dupes.length === 0) {
    console.log('  No repeated paragraphs found at threshold ' + minCount);
    continue;
  }

  for (const d of dupes.slice(0, 5)) {
    console.log(`  [${d.files.length}x] in: ${d.files.join(', ')}`);
    console.log(`  FULL TEXT:`);
    console.log(d.text);
    console.log(`  ---END---`);
    console.log();
  }
}
