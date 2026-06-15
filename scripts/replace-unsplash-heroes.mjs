#!/usr/bin/env node
/**
 * P0: Replace all Unsplash heroImage URLs with self-hosted regional heroes.
 * - Maps 20 legacy Unsplash IDs → invest-gulf.com/images/heroes/*.jpg
 * - Assigns project hero.webp where region matches (Dubai/Abu Dhabi/RAK)
 * - Stable hash per slug for variety within region pool
 *
 * Usage: node scripts/replace-unsplash-heroes.mjs [--dry]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'areas', 'compare'];
const DRY = process.argv.includes('--dry');

const BASE = 'https://invest-gulf.com';
const LOCAL_HEROES = {
  'dubai-marina': `${BASE}/images/heroes/dubai-marina.jpg`,
  'dubai-skyline': `${BASE}/images/heroes/dubai-skyline.jpg`,
  'luxury-villa': `${BASE}/images/heroes/luxury-villa.jpg`,
  'modern-tower': `${BASE}/images/heroes/modern-tower.jpg`,
  'glass-towers': `${BASE}/images/heroes/glass-towers.jpg`,
  'coastal-resort': `${BASE}/images/heroes/coastal-resort.jpg`,
  'waterfront': `${BASE}/images/heroes/waterfront.jpg`,
  'interior-luxury': `${BASE}/images/heroes/interior-luxury.jpg`,
  'gulf-business': `${BASE}/images/heroes/gulf-business.jpg`,
};

const mapJson = JSON.parse(readFileSync(join(__dirname, 'gulf-hero-map.json'), 'utf8'));
const UNSPLASH_REDIRECT = mapJson.unsplashToLocal;

function projectHeroesByRegion() {
  const out = { dubai: [], 'abu-dhabi': [], rak: [] };
  const dir = join(ROOT, 'public/images/projects');
  if (!existsSync(dir)) return out;
  for (const slug of readdirSync(dir)) {
    const hero = join(dir, slug, 'hero.webp');
    if (!existsSync(hero)) continue;
    const url = `${BASE}/images/projects/${slug}/hero.webp`;
    const s = slug.toLowerCase();
    if (/rak|marjan|siniya/.test(s)) out.rak.push(url);
    else if (/aldar|saadiyat|yas/.test(s)) out['abu-dhabi'].push(url);
    else out.dubai.push(url);
  }
  return out;
}

const PROJECT = projectHeroesByRegion();

const REGION_POOL = {
  dubai: [
    ...PROJECT.dubai,
    LOCAL_HEROES['dubai-marina'],
    LOCAL_HEROES['dubai-skyline'],
    LOCAL_HEROES['luxury-villa'],
    LOCAL_HEROES['modern-tower'],
  ],
  'abu-dhabi': [
    ...PROJECT['abu-dhabi'],
    LOCAL_HEROES['glass-towers'],
    LOCAL_HEROES['coastal-resort'],
    LOCAL_HEROES['waterfront'],
  ],
  rak: [...PROJECT.rak, LOCAL_HEROES['coastal-resort'], LOCAL_HEROES['waterfront'], LOCAL_HEROES['luxury-villa']],
  qatar: [LOCAL_HEROES['glass-towers'], LOCAL_HEROES['waterfront'], LOCAL_HEROES['dubai-skyline']],
  saudi: [LOCAL_HEROES['modern-tower'], LOCAL_HEROES['coastal-resort'], LOCAL_HEROES['glass-towers']],
  oman: [LOCAL_HEROES['coastal-resort'], LOCAL_HEROES['waterfront'], LOCAL_HEROES['luxury-villa']],
  bahrain: [LOCAL_HEROES['waterfront'], LOCAL_HEROES['modern-tower'], LOCAL_HEROES['glass-towers']],
  kuwait: [LOCAL_HEROES['glass-towers'], LOCAL_HEROES['modern-tower'], LOCAL_HEROES['dubai-skyline']],
  sharjah: [LOCAL_HEROES['modern-tower'], LOCAL_HEROES['luxury-villa'], LOCAL_HEROES['dubai-marina']],
  generic: [
    LOCAL_HEROES['luxury-villa'],
    LOCAL_HEROES['modern-tower'],
    LOCAL_HEROES['glass-towers'],
    LOCAL_HEROES['gulf-business'],
  ],
};

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function parseFm(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: '', body: raw, tags: [], title: '' };
  const fm = m[1];
  const tags = [...fm.matchAll(/^\s+-\s+"([^"]+)"/gm)].map((x) => x[1]);
  const title = fm.match(/^title:\s*"(.*)"/m)?.[1] || '';
  return { fm, body: raw.slice(m[0].length), tags, title };
}

function detectRegion(slug, tags, title) {
  const s = `${slug} ${tags.join(' ')} ${title}`.toLowerCase();
  if (/qatar|doha|lusail|west-bay|pearl/.test(s)) return 'qatar';
  if (/saudi|riyadh|jeddah|dammam|khobar|neom/.test(s)) return 'saudi';
  if (/oman|muscat/.test(s)) return 'oman';
  if (/bahrain|manama|amwaj|seef/.test(s)) return 'bahrain';
  if (/kuwait/.test(s)) return 'kuwait';
  if (/rak|ras-al-khaimah|ras al khaimah|marjan|hamra|mina-al-arab|al-nakheel-rak|wynn/.test(s)) return 'rak';
  if (/abu.?dhabi|saadiyat|yas-island|al-reem|maryah|reef-abu|khalifa-city|hudayriyat|masdar|al-raha/.test(s))
    return 'abu-dhabi';
  if (/sharjah|ajman|aljada|zahia/.test(s)) return 'sharjah';
  return 'dubai';
}

function pickHero(slug, region) {
  const pool = [...(REGION_POOL[region] || []), ...REGION_POOL.generic];
  const unique = [...new Set(pool.filter(Boolean))];
  return unique[hash(slug) % unique.length];
}

let changed = 0;
let unsplashBefore = 0;
const log = [];

for (const coll of COLLECTIONS) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const path = join(dir, file);
    const raw = readFileSync(path, 'utf8');
    if (!/images\.unsplash\.com/.test(raw)) continue;
    unsplashBefore++;
    const slug = file.replace(/\.mdx$/, '');
    const { tags, title } = parseFm(raw);
    const region = detectRegion(slug, tags, title);
    const hero = pickHero(`${coll}/${slug}`, region);

    let next = raw;
    const heroRe = /^heroImage:\s*["'][^"']+["']\s*$/m;
    if (heroRe.test(next)) {
      next = next.replace(heroRe, `heroImage: "${hero}"`);
    } else {
      console.warn(`No heroImage line: ${coll}/${file}`);
      continue;
    }

    // Replace any other unsplash in file (inline) via redirect map
    for (const [oldU, newU] of Object.entries(UNSPLASH_REDIRECT)) {
      next = next.split(oldU).join(newU);
    }
    next = next.replace(/https:\/\/images\.unsplash\.com\/[^\s"']+/g, hero);

    if (next !== raw) {
      if (!DRY) writeFileSync(path, next);
      changed++;
      log.push({ coll, slug, region, hero });
    }
  }
}

console.log(`Unsplash files: ${unsplashBefore}`);
console.log(`Updated: ${changed}${DRY ? ' (dry)' : ''}`);
if (!DRY && log.length) {
  writeFileSync(join(__dirname, 'last-hero-replace-log.json'), JSON.stringify(log, null, 2) + '\n');
}

const remaining = COLLECTIONS.flatMap((coll) => {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx') && /unsplash/.test(readFileSync(join(dir, f), 'utf8')))
    .map((f) => `${coll}/${f}`);
});
if (remaining.length) {
  console.error('Still unsplash:', remaining.length);
  process.exit(1);
}
console.log('✓ Zero Unsplash remaining in guides/areas/compare');
