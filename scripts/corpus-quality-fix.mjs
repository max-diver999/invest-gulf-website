#!/usr/bin/env node
/**
 * Apply corpus QC fixes: broken link paths, cannibalization noindex, duplicate tails.
 * Usage: node scripts/corpus-quality-fix.mjs [--dry]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/', import.meta.url).pathname);
const COLLECTIONS = ['guides', 'compare', 'areas', 'projects', 'news'];
const DRY = process.argv.includes('--dry');

const LINK_FIXES = [
  ['/guides/dubai-vs-sharjah-property-investment/', '/compare/dubai-vs-sharjah-property-investment/'],
  ['/guides/freehold-vs-leasehold-uae/', '/compare/freehold-vs-leasehold-uae/'],
  ['/guides/uae-vs-oman-property-investment/', '/compare/uae-vs-oman-property-investment/'],
  ['/guides/uae-vs-qatar-property-investment/', '/compare/uae-vs-qatar-property-investment/'],
  ['/guides/saudi-vs-uae-property-investment/', '/compare/saudi-vs-uae-property-investment/'],
  // noindex → KEEP targets
  ['/guides/can-foreigners-buy-property-dubai/', '/guides/can-foreigners-buy-property-uae/'],
  ['/guides/international-schools-gulf-comparison/', '/guides/gulf-schools-comparison/'],
  ['/guides/rak-cost-of-living-detailed/', '/guides/rak-cost-of-living/'],
  ['/guides/wynn-al-marjan-living-impact/', '/guides/wynn-al-marjan-island-property-impact/'],
  ['/guides/wynn-al-marjan-island-timeline-impact/', '/guides/wynn-al-marjan-island-property-impact/'],
  ['/guides/golden-visa-2-million-aed-explained/', '/guides/uae-golden-visa-property/'],
  ['/compare/off-plan-vs-ready-property-uae/', '/guides/off-plan-vs-ready-property-dubai/'],
  // P2 cannibalization → KEEP
  ['/guides/best-off-plan-abu-dhabi/', '/guides/abu-dhabi-off-plan-guide/'],
  ['/guides/best-off-plan-downtown-dubai/', '/guides/best-off-plan-areas-dubai-2026/'],
  ['/guides/best-off-plan-dubai-marina/', '/guides/best-off-plan-areas-dubai-2026/'],
  ['/guides/best-off-plan-dubai-south/', '/guides/best-off-plan-areas-dubai-2026/'],
  ['/guides/best-off-plan-jvc-dubai/', '/guides/best-off-plan-areas-dubai-2026/'],
  ['/guides/best-off-plan-business-bay-dubai/', '/guides/best-off-plan-areas-dubai-2026/'],
  ['/guides/best-off-plan-creek-harbour/', '/guides/best-off-plan-areas-dubai-2026/'],
  ['/guides/dubai-vs-abu-dhabi-cost-living/', '/guides/abu-dhabi-cost-of-living/'],
  ['/guides/abu-dhabi-driving-guide/', '/guides/abu-dhabi-driving-license/'],
  ['/guides/open-bank-account-non-resident-uae/', '/guides/open-bank-account-dubai/'],
  ['/guides/qatar-residency-by-property/', '/guides/qatar-property-buyer-relocation/'],
  ['/guides/bahrain-golden-residence-property/', '/guides/bahrain-property-foreigner-living/'],
  ['/guides/uae-tax-residency-183-day-rule/', '/guides/uae-tax-guide-expats/'],
];

/** coll/slug → KEEP note */
const NOINDEX = {
  'guides/can-foreigners-buy-property-dubai': 'KEEP: can-foreigners-buy-property-uae',
  'guides/international-schools-gulf-comparison': 'KEEP: gulf-schools-comparison',
  'guides/rak-cost-of-living-detailed': 'KEEP: rak-cost-of-living',
  'guides/wynn-al-marjan-living-impact': 'KEEP: wynn-al-marjan-island-property-impact',
  'guides/wynn-al-marjan-island-timeline-impact': 'KEEP: wynn-al-marjan-island-property-impact',
  'guides/off-plan-vs-ready-property-uae': 'KEEP: off-plan-vs-ready-property-dubai',
  'guides/golden-visa-2-million-aed-explained': 'KEEP: uae-golden-visa-property',
  'compare/off-plan-vs-ready-property-uae': 'KEEP: off-plan-vs-ready-property-dubai',
  // P2 cannibalization clusters
  'guides/best-off-plan-abu-dhabi': 'KEEP: abu-dhabi-off-plan-guide',
  'guides/best-off-plan-downtown-dubai': 'KEEP: best-off-plan-areas-dubai-2026',
  'guides/best-off-plan-dubai-marina': 'KEEP: best-off-plan-areas-dubai-2026',
  'guides/best-off-plan-dubai-south': 'KEEP: best-off-plan-areas-dubai-2026',
  'guides/best-off-plan-jvc-dubai': 'KEEP: best-off-plan-areas-dubai-2026',
  'guides/best-off-plan-business-bay-dubai': 'KEEP: best-off-plan-areas-dubai-2026',
  'guides/best-off-plan-creek-harbour': 'KEEP: best-off-plan-areas-dubai-2026',
  'guides/dubai-vs-abu-dhabi-cost-living': 'KEEP: abu-dhabi-cost-of-living',
  'guides/abu-dhabi-driving-guide': 'KEEP: abu-dhabi-driving-license',
  'guides/open-bank-account-non-resident-uae': 'KEEP: open-bank-account-dubai',
  'guides/qatar-residency-by-property': 'KEEP: qatar-property-buyer-relocation',
  'guides/bahrain-golden-residence-property': 'KEEP: bahrain-property-foreigner-living',
  'guides/uae-tax-residency-183-day-rule': 'KEEP: uae-tax-guide-expats',
};

const BAHRAIN_HUB = 'relocate-bahrain';
const BAHRAIN_CLUSTER = [
  'bahrain-driving-license',
  'bahrain-family-visa',
  'bahrain-healthcare-guide',
  'bahrain-saudi-bridge-commute',
  'bahrain-vs-dubai-living',
  'living-amwaj-islands',
  'living-seef-bahrain',
];

const DUBAI_MID_MARKET = [
  'al-furjan-property-investment',
  'dubai-production-city-property-investment',
  'dubai-silicon-oasis-property-investment',
  'motor-city-property-investment',
  'mudon-property-investment',
  'the-valley-dubai-property-investment',
];

const SCHOOLS_SATELLITES = [
  'schools-near-arabian-ranches',
  'schools-near-dubai-hills',
  'schools-near-dubai-marina',
  'schools-near-jvc',
];

const BAHRAIN_TAIL_MARKER = '## Red flags\n\n| Signal | Action |';
const GENERIC_TX_MARKER = '## Transaction cost stack — every purchase';
const BAHRAIN_FOOTER_START = '| Guide | ID | When to read |';
const SCHOOLS_FOOTER_START = '## School fees and KHDA ratings — quick reference';

function stripDuplicateBahrainTail(body) {
  const first = body.indexOf(BAHRAIN_TAIL_MARKER);
  if (first === -1) return body;
  const second = body.indexOf(BAHRAIN_TAIL_MARKER, first + BAHRAIN_TAIL_MARKER.length);
  if (second === -1) return body;
  const tail = body.slice(second);
  const relatedMatch = tail.match(/\n(\*\*Related reading:\*\*[\s\S]*)$/);
  const related = relatedMatch ? '\n\n' + relatedMatch[1].trim() : '';
  return body.slice(0, second).trimEnd() + '\n\n---' + related;
}

function stripBahrainClusterFooter(body, slug) {
  if (slug === BAHRAIN_HUB) return body;
  const idx = body.indexOf(BAHRAIN_FOOTER_START);
  if (idx === -1) return body;
  const before = body.slice(0, idx).trimEnd();
  const tail = body.slice(idx);
  const relatedMatch = tail.match(/(\*\*Related reading:\*\*[\s\S]*)$/);
  const related = relatedMatch ? '\n\n---\n\n' + relatedMatch[1].trim() : '';
  const hubLink =
    '\n\n---\n\n**Bahrain hub:** [Relocate to Bahrain guide](/guides/relocate-bahrain/) · [Manama cost of living](/guides/manama-cost-of-living/).';
  return before + hubLink + related;
}

function stripGenericDubaiTail(body) {
  const idx = body.indexOf(GENERIC_TX_MARKER);
  if (idx === -1) return body;
  const before = body.slice(0, idx).trimEnd();
  const hub =
    '\n\n---\n\n**Reference:** [Dubai acquisition costs](/guides/cost-of-buying-property-dubai/) · [Dubai property investment hub](/guides/dubai-property-investment-guide/) · [Market forecast 2026–2027](/guides/dubai-property-market-forecast-2026-2027/).';
  const editorialMatch = body.match(/\*Invest Gulf Editorial[^\n]*\n?$/);
  const editorial = editorialMatch ? '\n\n' + editorialMatch[0].trim() : '';
  return before + hub + editorial;
}

function stripSchoolsBoilerplate(body, slug) {
  const idx = body.indexOf(SCHOOLS_FOOTER_START);
  if (idx === -1) return body;
  const before = body.slice(0, idx).trimEnd();
  const hub =
    '\n\n---\n\n**School hub:** [How to choose a school in Dubai](/guides/how-to-choose-school-dubai/) · [Gulf schools comparison](/guides/gulf-schools-comparison/).';
  return before + hub;
}

function setNoindex(raw) {
  if (/\nnoindex:\s*true/.test(raw)) return raw;
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return raw;
  let fm = m[1];
  fm = fm.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-07');
  if (!/^updatedDate:/m.test(fm)) fm += '\nupdatedDate: 2026-06-07';
  fm += '\nnoindex: true';
  return raw.replace(/^---\n[\s\S]*?\n---/, `---\n${fm.trimEnd()}\n---`);
}

const log = { links: 0, noindex: 0, tails: 0, files: [] };

for (const coll of COLLECTIONS) {
  const dir = join(ROOT, coll);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const slug = file.replace(/\.mdx$/, '');
    const id = `${coll}/${slug}`;
    const path = join(dir, file);
    let raw = readFileSync(path, 'utf8');
    let changed = false;

    for (const [from, to] of LINK_FIXES) {
      const n = (raw.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (n) {
        raw = raw.split(from).join(to);
        log.links += n;
        changed = true;
      }
    }

    if (NOINDEX[id]) {
      const next = setNoindex(raw);
      if (next !== raw) {
        raw = next;
        log.noindex++;
        log.files.push(`NOINDEX ${id} (${NOINDEX[id]})`);
        changed = true;
      }
    }

    if (coll === 'guides') {
      const fmMatch = raw.match(/^---\n[\s\S]*?\n---/);
      if (!fmMatch) continue;
      const fm = fmMatch[0];
      let body = raw.slice(fm.length);

      if (BAHRAIN_CLUSTER.includes(slug) || slug === BAHRAIN_HUB) {
        const c1 = stripDuplicateBahrainTail(body);
        const c2 = stripBahrainClusterFooter(c1, slug);
        if (c2 !== body) {
          body = c2;
          log.tails++;
          log.files.push(`BAHRAIN-TAIL ${slug}`);
          changed = true;
        }
      }

      if (DUBAI_MID_MARKET.includes(slug)) {
        const c = stripGenericDubaiTail(body);
        if (c !== body) {
          body = c;
          log.tails++;
          log.files.push(`DUBAI-GENERIC-TAIL ${slug}`);
          changed = true;
        }
      }

      if (SCHOOLS_SATELLITES.includes(slug)) {
        const c = stripSchoolsBoilerplate(body);
        if (c !== body) {
          body = c;
          log.tails++;
          log.files.push(`SCHOOLS-TAIL ${slug}`);
          changed = true;
        }
      }

      if (changed) raw = fm + body;
    }

    if (changed && !DRY) writeFileSync(path, raw);
  }
}

console.log('=== CORPUS QUALITY FIX ===');
console.log('dry run:', DRY);
console.log('link replacements:', log.links);
console.log('noindex applied:', log.noindex);
console.log('duplicate tails trimmed:', log.tails);
for (const line of log.files) console.log(' ', line);
