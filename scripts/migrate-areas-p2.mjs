#!/usr/bin/env node
/**
 * P2 — move map-100 area guides from guides/ → areas/ + rewrite internal links.
 * Usage: node scripts/migrate-areas-p2.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src/content');
const COLLECTIONS = ['guides', 'compare', 'areas', 'projects', 'news'];
const DRY = process.argv.includes('--dry');

/** GULF_RE_CONTENT_MAP_100 ARE slugs (#42–55, 58–61, 67–69, 74, 79) */
export const AREA_SLUGS = [
  'jvc-property-investment',
  'dubai-marina-property-investment',
  'business-bay-property-investment',
  'downtown-dubai-property-investment',
  'palm-jumeirah-property-investment',
  'dubai-hills-estate-property-investment',
  'dubai-south-property-investment',
  'jlt-property-investment',
  'dubai-creek-harbour-property-investment',
  'mbr-city-property-investment',
  'dubai-sports-city-property-investment',
  'arabian-ranches-property-investment',
  'dubai-islands-property-investment',
  'damac-hills-property-investment',
  'saadiyat-island-property-investment',
  'yas-island-property-investment',
  'al-reem-island-property-investment',
  'al-maryah-island-property-investment',
  'al-marjan-island-property-investment',
  'al-hamra-village-property-investment',
  'mina-al-arab-property-investment',
  'the-pearl-lusail-property-investment',
  'riyadh-property-investment',
];

function setCategoryAreas(raw) {
  if (/^category:\s*["']?areas["']?/m.test(raw)) return raw;
  if (/^category:\s*/m.test(raw)) {
    return raw.replace(/^category:\s*.+$/m, 'category: "areas"');
  }
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return raw;
  return raw.replace(/^---\n[\s\S]*?\n---/, `---\n${m[1].trimEnd()}\ncategory: "areas"\n---`);
}

const areasDir = join(ROOT, 'areas');
if (!existsSync(areasDir)) mkdirSync(areasDir, { recursive: true });

let moved = 0;
for (const slug of AREA_SLUGS) {
  const src = join(ROOT, 'guides', `${slug}.mdx`);
  const dest = join(ROOT, 'areas', `${slug}.mdx`);
  if (!existsSync(src)) {
    console.warn('skip missing', slug);
    continue;
  }
  if (existsSync(dest)) {
    console.warn('skip exists in areas/', slug);
    continue;
  }
  let raw = readFileSync(src, 'utf8');
  raw = setCategoryAreas(raw);
  if (!DRY) {
    writeFileSync(dest, raw);
    unlinkSync(src);
  }
  moved++;
  console.log(DRY ? 'would move' : 'moved', slug);
}

let linkRewrites = 0;
for (const coll of COLLECTIONS) {
  const dir = join(ROOT, coll);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const path = join(dir, file);
    let raw = readFileSync(path, 'utf8');
    let changed = false;
    for (const slug of AREA_SLUGS) {
      const from = `/guides/${slug}/`;
      const to = `/areas/${slug}/`;
      const n = raw.split(from).length - 1;
      if (n) {
        raw = raw.split(from).join(to);
        linkRewrites += n;
        changed = true;
      }
      const fromNoSlash = `/guides/${slug})`;
      const toNoSlash = `/areas/${slug})`;
      if (raw.includes(fromNoSlash)) {
        raw = raw.split(fromNoSlash).join(toNoSlash);
        changed = true;
      }
    }
    if (changed && !DRY) writeFileSync(path, raw);
  }
}

console.log('=== MIGRATE AREAS P2 ===');
console.log('dry:', DRY);
console.log('moved:', moved, '/', AREA_SLUGS.length);
console.log('link rewrites:', linkRewrites);
