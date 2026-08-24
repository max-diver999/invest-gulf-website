#!/usr/bin/env node
/**
 * Restore indexing on purchase-intent pages noindexed by Phase 2.3 (commit 56762eab, 3 Jul 2026).
 *
 * Why: that prune used a "90-day zero impression" window of 2026-04-04 → 2026-07-02, but the
 * site launched 2026-06-05. Pages were judged on 28 days of a brand-new domain that Google had
 * not finished crawling — not on quality. Every slug below is 1.3k–4.3k words of original
 * research with brand or purchase intent (developer reviews, project pages, buyer-nationality
 * guides, investment comparisons).
 *
 * Lifestyle and visa-admin satellites stay noindexed — the prune was right about those.
 *
 * Usage: node scripts/restore-index-wave1.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY = process.argv.includes('--dry');
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Curated wave 1 — purchase intent only. */
const RESTORE = [
  // Developer reviews — brand queries, top of the buyer research path
  'guides/aldar-properties-review',
  'guides/arada-developer-review',
  'guides/azizi-developments-review',
  'guides/damac-properties-review',
  'guides/danube-properties-review',
  'guides/meraas-properties-review',
  'guides/nakheel-review',
  'guides/sobha-realty-review',

  // Project pages — brand queries with direct purchase intent
  'projects/azizi-riviera-reber',
  'projects/binghatti-hills',
  'projects/binghatti-phantom',
  'projects/ellington-ocean-house',
  'projects/nshama-town-square-phase',
  'projects/rak-gateway-2',
  'projects/samana-barari-heights',
  'projects/sobha-siniya-island',

  // Developer and market comparisons — decision-stage commercial intent
  'compare/emaar-vs-nakheel',
  'compare/emaar-vs-sobha',
  'compare/sobha-vs-damac',
  'compare/dubai-vs-london-property-investment',
  'compare/dubai-vs-doha-property-investment',
  'compare/dubai-vs-riyadh-property-investment',
  'compare/bahrain-vs-dubai-investment',
  'compare/ras-al-khaimah-vs-dubai-investment',
  'compare/uae-vs-oman-property-investment',

  // Buyer-nationality guides — highest purchase intent in the corpus
  'guides/dubai-property-for-american-buyers',
  'guides/dubai-property-for-canadian-buyers',
  'guides/dubai-property-for-chinese-buyers',
  'guides/dubai-property-for-french-buyers',
  'guides/dubai-property-for-indian-buyers',
  'guides/dubai-property-for-south-african-buyers',
  'guides/dubai-property-russian-buyers-relocation',

  // Investment guides — money cluster
  'guides/dubai-property-investment-for-beginners',
  'guides/dubai-property-flipping-guide',
  'guides/dubai-vacancy-rates-rental-demand',
  'guides/dubai-property-insurance-home',
  'guides/fujairah-beach-property-investment',
  'guides/rak-branded-residences-guide',
  'guides/qatar-property-management-guide',
  'guides/uae-vs-saudi-for-investors',

  // --- Wave 1b: family-buyer bridge and area-living guides -------------------------------
  // docs/PRIORITY-CTR-LEADS.md flags "Abu Dhabi school fees (bridge to family buyers)" as a
  // cluster to grow, and guides/dubai-vs-abu-dhabi-school-fees already earns impressions.
  // The living guides below are area pages in all but name — each maps to an investable district.
  'guides/adek-school-ratings-abu-dhabi',
  'guides/american-schools-dubai',
  'guides/schools-near-al-reem-island',
  'guides/schools-near-saadiyat-island',
  'guides/sharjah-schools-for-dubai-commuters',
  'guides/rak-schools-guide',
  'guides/palm-jumeirah-living-guide',
  'guides/dubai-creek-harbour-living',
  'guides/dubai-marina-living-pros-cons',
];

let changed = 0;
const missing = [];
const skipped = [];

for (const slug of RESTORE) {
  const file = join(ROOT, 'src/content', `${slug}.mdx`);
  if (!existsSync(file)) {
    missing.push(slug);
    continue;
  }
  const text = readFileSync(file, 'utf8');
  if (!/^noindex:\s*true\s*$/m.test(text)) {
    skipped.push(slug);
    continue;
  }
  // Drop the whole frontmatter line, leaving no blank gap behind.
  const next = text.replace(/^noindex:\s*true\s*\n/m, '');
  if (!DRY) writeFileSync(file, next);
  changed += 1;
}

console.log(`${DRY ? '[dry] ' : ''}restored index on ${changed}/${RESTORE.length} pages`);
if (skipped.length) console.log(`already indexed (no change): ${skipped.length}`);
if (missing.length) console.log(`MISSING FILES: ${missing.join(', ')}`);
