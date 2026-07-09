#!/usr/bin/env node
/**
 * Replace internal links and relatedSlugs pointing at noindex MDX with indexed KEEP slugs.
 * Usage: node scripts/fix-noindex-links.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry-run');
const COLLS = ['guides', 'compare', 'areas', 'comparisons', 'markets', 'costs', 'finance', 'legal'];

/** Hand-curated bad → indexed KEEP (from fix-tier-b-bulk + Gulf hubs) */
const MANUAL = {
  'international-schools-gulf-comparison': 'gulf-schools-comparison',
  'uae-tax-residency-183-day-rule': 'uae-tax-residency-183-days',
  'rak-cost-of-living-detailed': 'rak-cost-of-living',
  'wynn-al-marjan-living-impact': 'wynn-al-marjan-island-property-impact',
  'golden-visa-2-million-aed-explained': 'abu-dhabi-golden-visa-property',
  'can-foreigners-buy-property-dubai': 'can-foreigners-buy-property-uae',
  'qatar-residency-by-property': 'qatar-property-investment-guide',
  'bahrain-golden-residence-property': 'bahrain-property-foreigner-living',
  'wynn-al-marjan-island-timeline-impact': 'wynn-al-marjan-island-property-impact',
  'off-plan-vs-ready-property-uae': 'off-plan-vs-ready-property-dubai',
  'open-bank-account-non-resident-uae': 'open-bank-account-dubai',
  'dubai-vs-abu-dhabi-cost-living': 'abu-dhabi-cost-of-living',
  'abu-dhabi-driving-guide': 'abu-dhabi-driving-license',
  'gulf-property-investment-comparison-2026': 'gulf-residency-by-investment-guide',
  'uae-visa-property-investor-750k': 'golden-visa-mortgage-property-uae',
  'villanova-dubai-property-investment': 'villanova-property-investment',
  'best-off-plan-abu-dhabi': 'abu-dhabi-off-plan-guide',
  'best-off-plan-downtown-dubai': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-dubai-marina': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-dubai-south': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-jvc-dubai': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-business-bay-dubai': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-creek-harbour': 'best-off-plan-areas-dubai-2026',
  'uae-golden-visa-property': 'golden-visa-mortgage-property-uae',
  'gulf-expat-living-comparison': 'gulf-schools-comparison',
  'dubai-relocation-guide': 'emirates-id-application-guide',
  'uae-tax-residency-property': 'dmcc-company-setup',
  'oman-relocation-guide': 'oman-property-foreigner-living',
  'buy-property-dubai-foreigner': 'can-foreigners-buy-property-uae',
  'gulf-banking-comparison-expats': 'open-bank-account-dubai',
  'qatar-relocation-guide': 'qatar-property-investment-guide',
  'oman-residency-by-investment': 'oman-investment-residency-2026',
  'hidden-costs-living-dubai': 'dubai-cost-of-living',
  'saudi-arabia-relocation-guide': 'saudi-property-foreigner-living',
  'british-schools-dubai': 'gulf-schools-comparison',
  'qatar-vs-dubai-living': 'qatar-vs-dubai-property-investment',
  'dubai-monthly-budget-expat-family': 'dubai-cost-of-living',
  'bahrain-relocation-guide': 'bahrain-property-foreigner-living',
  'abu-dhabi-golden-visa-living': 'abu-dhabi-golden-visa-property',
  'oman-itc-visa-living': 'oman-itc-visa-guide',
  'dubai-international-schools-guide': 'gulf-schools-comparison',
  'saudi-premium-residency-living': 'saudi-premium-residency-property',
  'saudi-vs-uae-living': 'saudi-vs-uae-property-investment',
  'doha-rent-prices-by-area': 'doha-cost-of-living',
  'oman-vs-uae-living': 'oman-vs-uae-property-investment',
  'best-gulf-country-property-investment': 'gulf-residency-by-investment-guide',
  'living-the-pearl-qatar': 'qatar-property-investment-guide',
  'rak-commute-to-dubai': 'rak-cost-of-living',
  'qatar-property-buyer-relocation': 'qatar-property-investment-guide',
  'uae-corporate-tax-expats': 'dmcc-company-setup',
  'living-khalifa-city': 'abu-dhabi-cost-of-living',
  'riyadh-international-schools': 'riyadh-cost-of-living',
  'arabian-ranches-property-investment': 'arabian-ranches-dubai-property',
  'saudi-property-designated-zones-explained': 'saudi-arabia-property-foreigners-guide',
  'schools-near-jvc': 'gulf-schools-comparison',
  'sharjah-vs-dubai-commute-property': 'sharjah-dubai-commuter-guide',
  'living-lusail-qatar': 'lusail-city-property-investment',
  'uae-green-visa-guide': 'uae-green-visa-freelancer',
  'neom-property-investment': 'saudi-off-plan-guide',
  'rak-rental-yield-guide': 'rak-rental-yield-analysis',
  'abu-dhabi-utilities-addc': 'abu-dhabi-cost-of-living',
};

const HUBS = [
  ['dubai', 'dubai-property-investment-guide'],
  ['abu-dhabi', 'abu-dhabi-property-investment-guide'],
  ['qatar', 'qatar-property-investment-guide'],
  ['doha', 'qatar-property-investment-guide'],
  ['oman', 'oman-property-investment-guide'],
  ['muscat', 'oman-property-investment-guide'],
  ['saudi', 'saudi-arabia-property-foreigners-guide'],
  ['riyadh', 'saudi-arabia-property-foreigners-guide'],
  ['jeddah', 'saudi-arabia-property-foreigners-guide'],
  ['bahrain', 'bahrain-property-investment-guide'],
  ['rak', 'ras-al-khaimah-property-investment-guide'],
  ['ras-al-khaimah', 'ras-al-khaimah-property-investment-guide'],
];

function listAllMdx() {
  const out = [];
  for (const coll of COLLS) {
    const dir = join(CONTENT, coll);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.mdx')) out.push({ path: join(dir, f), coll, slug: f.replace(/\.mdx$/, '') });
    }
  }
  return out;
}

function isNoindex(raw) {
  return /^noindex:\s*true/m.test(raw);
}

function tokenOverlap(a, b) {
  const ta = new Set(a.split('-'));
  const tb = new Set(b.split('-'));
  let n = 0;
  for (const t of ta) if (tb.has(t)) n += 1;
  return n;
}

function hubFor(slug) {
  for (const [prefix, hub] of HUBS) {
    if (slug.startsWith(prefix) || slug.includes(prefix)) return hub;
  }
  return 'gulf-residency-by-investment-guide';
}

function buildMap(files, indexed, noindexSlugs) {
  const map = { ...MANUAL };
  for (const bad of noindexSlugs) {
    if (map[bad] && indexed.has(map[bad])) continue;
    const cands = [...indexed].filter((s) => s !== bad && (s.includes(bad) || bad.includes(s)));
    cands.sort((a, b) => tokenOverlap(bad, b) - tokenOverlap(bad, a) || a.length - b.length);
    if (cands.length) map[bad] = cands[0];
    else if (indexed.has(hubFor(bad))) map[bad] = hubFor(bad);
  }
  for (const [bad, good] of Object.entries(map)) {
    if (!indexed.has(good)) delete map[bad];
  }
  return map;
}

function replaceSlugRefs(text, map) {
  let out = text;
  for (const [bad, good] of Object.entries(map)) {
    for (const coll of COLLS) {
      out = out.replaceAll(`(/${coll}/${bad}/)`, `(/${coll}/${good}/)`);
      out = out.replaceAll(`(/${coll}/${bad})`, `(/${coll}/${good}/)`);
      out = out.replaceAll(`](/${coll}/${bad}/)`, `](/${coll}/${good}/)`);
    }
    out = out.replaceAll(`- "${bad}"`, `- "${good}"`);
    out = out.replaceAll(`- '${bad}'`, `- "${good}"`);
    out = out.replaceAll(`  - ${bad}\n`, `  - ${good}\n`);
  }
  return out;
}

const files = listAllMdx();
const indexed = new Set();
const noindexSlugs = new Set();
for (const f of files) {
  const raw = readFileSync(f.path, 'utf8');
  if (isNoindex(raw)) noindexSlugs.add(f.slug);
  else indexed.add(f.slug);
}

const map = buildMap(files, indexed, noindexSlugs);
console.log(`Noindex slugs: ${noindexSlugs.size} | Map entries: ${Object.keys(map).length}`);

let touched = 0;
for (const f of files) {
  const raw = readFileSync(f.path, 'utf8');
  if (isNoindex(raw)) continue;
  const next = replaceSlugRefs(raw, map);
  if (next !== raw) {
    touched += 1;
    if (!DRY) writeFileSync(f.path, next);
    console.log('updated', `${f.coll}/${f.slug}`);
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}Done: ${touched} indexed files updated`);
