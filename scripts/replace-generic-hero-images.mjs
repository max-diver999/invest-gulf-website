#!/usr/bin/env node
/**
 * Replace 9 generic /images/heroes/*.jpg stock URLs with unique area/project heroes.
 * Context-first mapping for money pages; regional pool fallback (83 unique assets).
 *
 * Usage:
 *   node scripts/replace-generic-hero-images.mjs           # dry-run
 *   node scripts/replace-generic-hero-images.mjs --apply
 *   node scripts/replace-generic-hero-images.mjs --apply --money-only
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CONTENT = join(ROOT, 'src/content');
const BASE = 'https://invest-gulf.com';
const APPLY = process.argv.includes('--apply');
const MONEY_ONLY = process.argv.includes('--money-only');

const GENERIC_HERO_RE = /\/images\/heroes\/[^"']+\.jpg/;
const COLLECTIONS = ['guides', 'areas', 'compare', 'projects', 'news'];

const MONEY_SLUG_RE =
  /property-investment|golden-visa|can-foreigners|mortgage|rental-yield|off-plan|due-diligence|difc|dmcc|mainland-llc|free-zone|company-setup|visa-property|buy.*property|investment-guide|rent-increase|tenant-eviction|holiday-home|handover-checklist|service-charge|payment-plan/;

/** slug fragment → area folder under public/images/areas */
const SLUG_AREA_HINTS = [
  ['dubai-marina', 'dubai-marina'],
  ['jbr', 'jbr'],
  ['business-bay', 'business-bay'],
  ['downtown-dubai', 'downtown-dubai'],
  ['dubai-hills', 'dubai-hills-estate'],
  ['dubai-south', 'dubai-south'],
  ['dubai-creek', 'dubai-creek-harbour'],
  ['dubai-harbour', 'dubai-harbour'],
  ['dubai-islands', 'dubai-islands'],
  ['palm-jumeirah', 'palm-jumeirah'],
  ['jvc', 'jvc'],
  ['jlt', 'jlt'],
  ['city-walk', 'city-walk'],
  ['damac-hills', 'damac-hills'],
  ['arabian-ranches', 'arabian-ranches'],
  ['tilal-al-ghaf', 'tilal-al-ghaf'],
  ['mudon', 'mudon'],
  ['motor-city', 'motor-city'],
  ['discovery-gardens', 'discovery-gardens'],
  ['al-barari', 'al-barari'],
  ['al-furjan', 'al-furjan'],
  ['al-reem', 'al-reem-island'],
  ['saadiyat', 'saadiyat-island'],
  ['yas-island', 'yas-island'],
  ['al-maryah', 'al-maryah-island'],
  ['al-raha', 'al-raha-beach'],
  ['al-reef', 'al-reef-abu-dhabi'],
  ['hudayriyat', 'hudayriyat-island'],
  ['masdar', 'masdar-city'],
  ['al-ghadeer', 'al-ghadeer'],
  ['khalifa-city', 'khalifa-city'],
  ['al-marjan', 'al-marjan-island'],
  ['al-hamra', 'al-hamra-village'],
  ['al-nakheel-rak', 'al-nakheel-rak'],
  ['mina-al-arab', 'mina-al-arab'],
  ['aljada', 'aljada-sharjah'],
  ['al-zahia', 'al-zahia-sharjah'],
  ['west-bay', 'west-bay-doha'],
  ['lusail', 'lusail-city'],
  ['muscat-al-mouj', 'muscat-al-mouj'],
  ['muscat-qurum', 'muscat-qurum'],
  ['amwaj', 'amwaj-islands'],
  ['manama', 'manama'],
  ['jeddah', 'jeddah'],
  ['dammam', 'dammam-khobar'],
  ['riyadh', 'riyadh'],
  ['meydan', 'meydan-horizon'],
  ['impz', 'impz'],
  ['silicon-oasis', 'dubai-silicon-oasis'],
  ['sports-city', 'dubai-sports-city'],
  ['production-city', 'dubai-production-city'],
  ['the-valley', 'the-valley-dubai'],
  ['bluewaters', 'bluewaters-island'],
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function loadHeroPools() {
  const areas = [];
  const projects = [];
  const areaDir = join(ROOT, 'public/images/areas');
  const projectDir = join(ROOT, 'public/images/projects');

  if (existsSync(areaDir)) {
    for (const slug of readdirSync(areaDir)) {
      const hero = join(areaDir, slug, 'hero.jpg');
      if (existsSync(hero)) areas.push({ slug, url: `${BASE}/images/areas/${slug}/hero.jpg` });
    }
  }
  if (existsSync(projectDir)) {
    for (const slug of readdirSync(projectDir)) {
      const hero = join(projectDir, slug, 'hero.webp');
      if (existsSync(hero)) projects.push({ slug, url: `${BASE}/images/projects/${slug}/hero.webp` });
    }
  }
  return { areas, projects, all: [...areas.map((a) => a.url), ...projects.map((p) => p.url)] };
}

const POOLS = loadHeroPools();
const AREA_BY_SLUG = new Map(POOLS.areas.map((a) => [a.slug, a.url]));

function detectRegion(slug, tags, title) {
  const s = `${slug} ${tags.join(' ')} ${title}`.toLowerCase();
  if (/qatar|doha|lusail|west-bay|pearl/.test(s)) return 'qatar';
  if (/saudi|riyadh|jeddah|dammam|khobar|neom/.test(s)) return 'saudi';
  if (/oman|muscat/.test(s)) return 'oman';
  if (/bahrain|manama|amwaj|seef/.test(s)) return 'bahrain';
  if (/kuwait/.test(s)) return 'kuwait';
  if (/rak|ras-al-khaimah|marjan|hamra|wynn|al-nakheel-rak/.test(s)) return 'rak';
  if (/abu.?dhabi|saadiyat|yas-island|al-reem|maryah|reef-abu|khalifa|hudayriyat|masdar|al-raha/.test(s))
    return 'abu-dhabi';
  if (/sharjah|ajman|aljada|zahia|fujairah|umm-al-quwain/.test(s)) return 'emirates-north';
  return 'dubai';
}

function regionalAreaUrls(region) {
  const tests = {
    dubai: /dubai|jvc|jlt|palm|furjan|barari|ranches|bay|marina|hills|harbour|creek|mudon|motor|meydan|impz|valley|bluewaters|damac-hills|sports|silicon|production|islands/,
    'abu-dhabi': /abu|reem|saadiyat|yas|maryah|raha|reef|ghadeer|hudayriyat|masdar|khalifa/,
    rak: /marjan|hamra|nakheel-rak|mina-al-arab|rak/,
    qatar: /lusail|west-bay|doha|qatar/,
    saudi: /riyadh|jeddah|dammam|khobar|saudi/,
    oman: /muscat|mouj|qurum|oman/,
    bahrain: /amwaj|manama|bahrain|seef/,
    'emirates-north': /sharjah|ajman|aljada|zahia|fujairah|quwain/,
  };
  const re = tests[region] || tests.dubai;
  return POOLS.areas.filter((a) => re.test(a.slug)).map((a) => a.url);
}

function regionalProjectUrls(region) {
  const tests = {
    dubai: /./,
    'abu-dhabi': /aldar|saadiyat|yas/,
    rak: /rak|marjan|siniya/,
  };
  if (region === 'rak') {
    return POOLS.projects.filter((p) => /rak|marjan|siniya/.test(p.slug)).map((p) => p.url);
  }
  if (region === 'abu-dhabi') {
    return POOLS.projects.filter((p) => /aldar|saadiyat|yas/.test(p.slug)).map((p) => p.url);
  }
  if (['qatar', 'saudi', 'oman', 'bahrain', 'kuwait', 'emirates-north'].includes(region)) {
    return [];
  }
  return POOLS.projects.filter((p) => !/aldar|saadiyat|yas|rak|marjan|siniya/.test(p.slug)).map((p) => p.url);
}

function areaFromSlug(slug) {
  const stripped = slug.replace(/-property-investment$/, '');
  if (AREA_BY_SLUG.has(stripped)) return AREA_BY_SLUG.get(stripped);

  for (const [hint, areaSlug] of SLUG_AREA_HINTS) {
    if (slug.includes(hint) && AREA_BY_SLUG.has(areaSlug)) return AREA_BY_SLUG.get(areaSlug);
  }

  for (const area of POOLS.areas) {
    const core = area.slug.replace(/-property-investment$/, '');
    if (slug.includes(core) && core.length > 4) return area.url;
  }
  return null;
}

function projectFromSlug(slug) {
  for (const project of POOLS.projects) {
    if (slug.includes(project.slug)) return project.url;
  }
  return null;
}

function pickFallbackHero(key, region) {
  const pool = [...new Set([...regionalAreaUrls(region), ...regionalProjectUrls(region)])];
  if (!pool.length) pool.push(...POOLS.all);
  return pool[hash(key) % pool.length];
}

function pickHero({ collection, slug, tags, title }) {
  if (collection === 'areas') {
    const areaSlug = slug.replace(/-property-investment$/, '');
    if (AREA_BY_SLUG.has(areaSlug)) return AREA_BY_SLUG.get(areaSlug);
  }
  if (collection === 'projects') {
    const project = POOLS.projects.find((p) => p.slug === slug);
    if (project) return project.url;
  }

  const region = detectRegion(slug, tags, title);
  const contextual = areaFromSlug(slug) || projectFromSlug(slug);
  if (contextual) return contextual;

  // Topic defaults for money pages without geo in slug
  const topicDefaults = {
    'can-foreigners-buy-property-uae': 'dubai-marina',
    'dubai-property-investment-guide': 'downtown-dubai',
    'off-plan-property-dubai-guide': 'dubai-creek-harbour',
    'islamic-vs-conventional-mortgage-uae': 'business-bay',
    'non-resident-mortgage-dubai': 'dubai-marina',
    'uae-free-zone-vs-mainland': 'business-bay',
    'dubai-mainland-llc-setup': 'business-bay',
    'difc-company-setup': 'downtown-dubai',
    'dmcc-company-setup': 'jlt',
    'golden-visa-2-million-aed-explained': 'palm-jumeirah',
    'uae-visa-property-investor-750k': 'dubai-hills-estate',
    'gulf-property-investment-comparison-2026': 'dubai-marina',
    'how-to-buy-dubai-property-remotely': 'dubai-harbour',
    'due-diligence-dubai-property': 'business-bay',
    'kuwait-property-investment-guide': 'dubai-marina',
    'fujairah-property-investment-guide': 'aljada-sharjah',
    'sharjah-property-investment-guide': 'aljada-sharjah',
    'ajman-property-investment-guide': 'al-zahia-sharjah',
  };
  if (topicDefaults[slug] && AREA_BY_SLUG.has(topicDefaults[slug])) {
    return AREA_BY_SLUG.get(topicDefaults[slug]);
  }

  return pickFallbackHero(`${collection}/${slug}`, region);
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];
  const tags = [...fm.matchAll(/^\s+-\s+"([^"]+)"/gm)].map((x) => x[1]);
  const title = fm.match(/^title:\s*"(.*)"/m)?.[1] || '';
  const noindex = /^noindex:\s*true/m.test(fm);
  const heroMatch = fm.match(/^heroImage:\s*"([^"]+)"/m);
  return { fm, tags, title, noindex, hero: heroMatch?.[1] || null };
}

const changes = [];
for (const coll of COLLECTIONS) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const path = join(dir, file);
    const raw = readFileSync(path, 'utf8');
    const parsed = parseFrontmatter(raw);
    if (!parsed?.hero || !GENERIC_HERO_RE.test(parsed.hero)) continue;
    if (parsed.noindex && MONEY_ONLY) continue;

    const slug = file.replace(/\.mdx$/, '');
    if (MONEY_ONLY && !MONEY_SLUG_RE.test(slug)) continue;

    const newHero = pickHero({
      collection: coll,
      slug,
      tags: parsed.tags,
      title: parsed.title,
    });
    if (newHero === parsed.hero) continue;

    changes.push({
      path: `${coll}/${file}`,
      slug,
      oldHero: parsed.hero,
      newHero,
    });

    if (APPLY) {
      const next = raw.replace(/^heroImage:\s*"[^"]+"/m, `heroImage: "${newHero}"`);
      writeFileSync(path, next);
    }
  }
}

console.log(`=== Replace generic hero stock (9 JPG pool) ===`);
console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'}${MONEY_ONLY ? ' (money-only)' : ''}`);
console.log(`Unique asset pool: ${POOLS.all.length} area/project heroes`);
console.log(`Files to update: ${changes.length}\n`);

const byOld = changes.reduce((acc, c) => {
  const key = c.oldHero.split('/').pop();
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
console.log('Replacements by old generic file:');
for (const [k, v] of Object.entries(byOld).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v}\t${k}`);
}

console.log('\nSample:');
for (const c of changes.slice(0, 12)) {
  console.log(`  ${c.path}`);
  console.log(`    ${c.oldHero.split('/').pop()} → ${c.newHero.replace(BASE, '')}`);
}

if (!APPLY) {
  console.log('\nRun with --apply to write changes.');
} else {
  writeFileSync(join(import.meta.dirname, 'last-generic-hero-replace.json'), JSON.stringify(changes, null, 2));
  console.log(`\nLog: scripts/last-generic-hero-replace.json`);
}
