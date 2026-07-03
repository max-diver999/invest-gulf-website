/**
 * Contextual hero picker for invest-gulf.com MDX.
 * Guides/compare/news use area heroes only (no random project stock photos).
 */

import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const BASE = 'https://invest-gulf.com';

export const SLUG_AREA_HINTS = [
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
  ['the-pearl', 'the-pearl-lusail'],
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

export const TOPIC_AREA_DEFAULTS = {
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
  return { areas, projects };
}

const POOLS = loadHeroPools();
const AREA_BY_SLUG = new Map(POOLS.areas.map((a) => [a.slug, a.url]));
const PROJECT_BY_SLUG = new Map(POOLS.projects.map((p) => [p.slug, p.url]));

export function detectRegion(slug, tags, title) {
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

export function regionalAreaUrls(region) {
  const tests = {
    dubai:
      /dubai|jvc|jlt|palm|furjan|barari|ranches|bay|marina|hills|harbour|creek|mudon|motor|meydan|impz|valley|bluewaters|damac-hills|sports|silicon|production|islands|jebel/,
    'abu-dhabi': /abu|reem|saadiyat|yas|maryah|raha|reef|ghadeer|hudayriyat|masdar|khalifa/,
    rak: /marjan|hamra|nakheel-rak|mina-al-arab|rak/,
    qatar: /lusail|west-bay|doha|qatar|pearl/,
    saudi: /riyadh|jeddah|dammam|khobar|saudi/,
    oman: /muscat|mouj|qurum|oman/,
    bahrain: /amwaj|manama|bahrain|seef/,
    'emirates-north': /sharjah|ajman|aljada|zahia|fujairah|quwain/,
  };
  const re = tests[region] || tests.dubai;
  return POOLS.areas.filter((a) => re.test(a.slug)).map((a) => a.url).sort();
}

function areaFromSlug(slug) {
  const stripped = slug.replace(/-property-investment$/, '');
  if (AREA_BY_SLUG.has(stripped)) return AREA_BY_SLUG.get(stripped);

  for (const [hint, areaSlug] of SLUG_AREA_HINTS) {
    if (slug.includes(hint) && AREA_BY_SLUG.has(areaSlug)) return AREA_BY_SLUG.get(areaSlug);
  }
  return null;
}

function pickRegionalAreaHero(key, region) {
  const pool = regionalAreaUrls(region);
  if (pool.length) return pool[hash(key) % pool.length];
  const all = POOLS.areas.map((a) => a.url);
  return all[hash(key) % all.length];
}

/** Guides, compare, news: area heroes only */
export function pickContentHero({ collection, slug, tags, title }) {
  const contextual = areaFromSlug(slug);
  if (contextual) return contextual;

  if (TOPIC_AREA_DEFAULTS[slug] && AREA_BY_SLUG.has(TOPIC_AREA_DEFAULTS[slug])) {
    return AREA_BY_SLUG.get(TOPIC_AREA_DEFAULTS[slug]);
  }

  const region = detectRegion(slug, tags, title);
  return pickRegionalAreaHero(`${collection}/${slug}/${title}`, region);
}

/** Canonical hero for any collection */
export function pickCanonicalHero({ collection, slug, tags, title }) {
  if (collection === 'areas') {
    const areaSlug = slug.replace(/-property-investment$/, '');
    return AREA_BY_SLUG.get(areaSlug) || pickContentHero({ collection, slug, tags, title });
  }
  if (collection === 'projects') {
    return PROJECT_BY_SLUG.get(slug) || pickContentHero({ collection, slug, tags, title });
  }
  return pickContentHero({ collection, slug, tags, title });
}

export function slugMatchesProjectHero(slug, heroUrl) {
  const m = heroUrl.match(/\/projects\/([^/]+)\/hero\.webp$/);
  if (!m) return true;
  const project = m[1];
  if (slug === project || slug.includes(project)) return true;
  const parts = project.split('-').filter((p) => p.length > 4);
  return parts.some((p) => slug.includes(p));
}

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];
  const tags = [...fm.matchAll(/^\s+-\s+"([^"]+)"/gm)].map((x) => x[1]);
  const title = fm.match(/^title:\s*"(.*)"/m)?.[1] || '';
  const heroMatch = fm.match(/^heroImage:\s*"([^"]+)"/m);
  return { tags, title, hero: heroMatch?.[1] || null };
}

export { POOLS, AREA_BY_SLUG, PROJECT_BY_SLUG, hash };
