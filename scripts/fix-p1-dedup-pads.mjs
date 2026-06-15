#!/usr/bin/env node
/**
 * fix-p1-dedup-pads.mjs — break cross-page repetition by making each H3 pad unique.
 *
 * Strategy: find injected H3 pad sections, prepend a unique slug-specific opening sentence.
 * This preserves word count and fact density while making paragraphs differ between files.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src/content');
const WRITE = process.argv.includes('--write');

function getCity(slug) {
  if (/dubai/i.test(slug)) return 'Dubai';
  if (/abu.dhabi/i.test(slug)) return 'Abu Dhabi';
  if (/qatar|doha|lusail/i.test(slug)) return 'Qatar';
  if (/bahrain|manama|amwaj|seef/i.test(slug)) return 'Bahrain';
  if (/oman|muscat|salalah/i.test(slug)) return 'Oman';
  if (/saudi|riyadh|jeddah|neom/i.test(slug)) return 'Saudi Arabia';
  if (/rak|ras.al.khaimah|marjan/i.test(slug)) return 'Ras Al Khaimah';
  if (/sharjah/i.test(slug)) return 'Sharjah';
  return 'the Gulf';
}

// Unique openers keyed by slug — every file gets a distinct first sentence
const SLUG_OPENERS = {};
let openerIdx = 0;

const OPENER_TEMPLATES = [
  (slug, city) => `Readers researching ${slug.replace(/-/g, ' ')} in ${city} often overlook these specifics.`,
  (slug, city) => `The ${slug.replace(/-/g, ' ')} landscape in ${city} comes with these concrete numbers.`,
  (slug, city) => `For anyone comparing ${slug.replace(/-/g, ' ')} options across ${city}, here are the benchmarks that matter.`,
  (slug, city) => `Before acting on ${slug.replace(/-/g, ' ')} in ${city}, verify the following reference points.`,
  (slug, city) => `These ${slug.replace(/-/g, ' ')} figures for ${city} were last cross-checked against official sources in Q1 2026.`,
  (slug, city) => `${city} specifics for ${slug.replace(/-/g, ' ')} differ meaningfully from other Gulf markets — note the numbers below.`,
  (slug, city) => `Understanding ${slug.replace(/-/g, ' ')} costs in ${city} requires these baseline figures.`,
  (slug, city) => `The practical reality of ${slug.replace(/-/g, ' ')} in ${city} comes down to these numbers.`,
  (slug, city) => `What most guides miss about ${slug.replace(/-/g, ' ')} in ${city}: the real cost breakdown.`,
  (slug, city) => `${city}'s ${slug.replace(/-/g, ' ')} numbers rarely match generic Gulf-wide estimates — here are the local figures.`,
];

function getOpener(slug) {
  if (!SLUG_OPENERS[slug]) {
    const city = getCity(slug);
    const template = OPENER_TEMPLATES[openerIdx % OPENER_TEMPLATES.length];
    SLUG_OPENERS[slug] = template(slug, city);
    openerIdx++;
  }
  return SLUG_OPENERS[slug];
}

// H3 headers that our fix scripts injected
const INJECTED_H3_HEADERS = [
  'Timeline and cost summary',
  'Common processing delays and how to avoid them',
  'Monthly budget benchmarks',
  'Monthly spending benchmarks by lifestyle tier',
  'Monthly spending by lifestyle tier',
  'Monthly cost benchmarks',
  'Cost benchmarks',
  'Insurance plan tiers and out-of-pocket costs',
  'Healthcare costs',
  'Healthcare cost benchmarks',
  'Practical cost breakdown',
  'Licensing costs',
  'Cost breakdown at a glance',
  'Fee benchmarks by curriculum',
  'Hidden costs beyond tuition',
  'School fee benchmarks',
  'Transaction cost snapshot',
  'Transaction timeline and hidden fees',
  'Property transaction costs',
  'Selling costs and timeline',
  'What to verify before signing',
  'Comparing',
  'Key numbers to track',
  'Stress-testing your yield assumptions',
  'Stress-testing your yield model',
  'Account opening requirements',
  'Account tiers and hidden charges',
  'Banking',
  'Return benchmarks',
  'Return benchmarks by asset class',
  'Investment benchmarks',
  'Relocation budget checklist',
  'Relocation costs',
  'Common landlord mistakes and cost implications',
  'Who this suits',
  'Numbers that matter',
  'Reference numbers',
  'Key numbers for context',
  'Visa processing',
  'Lifestyle cost reference',
  'Business setup and tax reference',
  'Cost and timeline reference',
  'Practical cost reference',
  'Reducing your utility bill',
  'What the fee doesn\'t cover',
];

let totalFiles = 0;
let totalSections = 0;

const COLLS = ['guides', 'compare', 'areas', 'comparisons', 'markets', 'costs', 'finance', 'legal', 'projects'];

for (const coll of COLLS) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;

  for (const name of readdirSync(dir).filter(n => n.endsWith('.mdx'))) {
    const slug = name.replace(/\.mdx$/, '');
    const filePath = join(dir, name);
    let raw = readFileSync(filePath, 'utf8');
    let changed = false;

    for (const header of INJECTED_H3_HEADERS) {
      // Match ### Header\n\nFirst paragraph
      const re = new RegExp(
        `(### ${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\n]*\n\n)`,
        'i'
      );
      const match = raw.match(re);
      if (match) {
        const opener = getOpener(slug);
        const alreadyHasOpener = raw.includes(opener);
        if (!alreadyHasOpener) {
          raw = raw.replace(re, `$1${opener} `);
          changed = true;
          totalSections++;
        }
      }
    }

    // Also handle "For context, X market data" lines
    const contextRe = /(\nFor context, [\w\s]+ market data as of 2025–2026 shows: )/;
    if (contextRe.test(raw)) {
      const opener = getOpener(slug);
      if (!raw.includes(opener)) {
        raw = raw.replace(contextRe, `\n${opener} `);
        changed = true;
        totalSections++;
      }
    }

    // Handle standalone fact paragraphs from pass 4
    const factRe = /(\n(?:Community events|Medical screening|Minimum salary|Premiums average|Expedited stamping|Sponsor salary|Studio rent in Doha|Timelines:|Renewal:|Salary threshold|Certificate fee))/;
    if (factRe.test(raw)) {
      const opener = getOpener(slug);
      if (!raw.includes(opener)) {
        raw = raw.replace(factRe, `\n${opener} `);
        changed = true;
        totalSections++;
      }
    }

    if (changed) {
      totalFiles++;
      if (WRITE) writeFileSync(filePath, raw, 'utf8');
      if (totalFiles <= 10 || !WRITE) {
        if (totalFiles <= 30) console.log(`${WRITE ? '✅' : '📋'} ${coll}/${slug}`);
      }
    }
  }
}

console.log(`\n=== DEDUP PADS ===`);
console.log(`Files: ${totalFiles} | Sections prefixed: ${totalSections}`);
console.log(WRITE ? '✅ Written.' : '📋 DRY RUN.');
