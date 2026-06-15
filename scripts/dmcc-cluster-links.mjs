#!/usr/bin/env node
/**
 * DMCC cluster internal linking — cross-link high-traffic satellites to dmcc-company-setup.
 * Usage: node scripts/dmcc-cluster-links.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src/content');
const DRY = process.argv.includes('--dry');
const DMCC = '/guides/dmcc-company-setup/';

/** @type {{ rel: string, find: string, replace: string }[]} */
const PATCHES = [
  {
    rel: 'guides/dubai-co-working-spaces.mdx',
    find: 'Quick links: [UAE Remote Work Visa]',
    replace: `Quick links: [DMCC company setup](${DMCC}) · [UAE Remote Work Visa]`,
  },
  {
    rel: 'guides/dubai-co-working-spaces.mdx',
    find: 'opposite DMCC (Dubai Multi Commodities Centre). Co-working here',
    replace: `opposite [DMCC (Dubai Multi Commodities Centre)](${DMCC}). Co-working here`,
  },
  {
    rel: 'guides/schools-near-dubai-marina.mdx',
    find: '**Rent:** [Dubai rent prices by area](/guides/dubai-rent-prices-by-area/)',
    replace: `**Rent:** [Dubai rent prices by area](/guides/dubai-rent-prices-by-area/) · **JLT founders:** [DMCC company setup](${DMCC})`,
  },
  {
    rel: 'guides/uae-freelance-permit-dubai.mdx',
    find: 'TECOM (GoFreelance), DMCC, and DIFC carry strong banking credibility',
    replace: `TECOM (GoFreelance), [DMCC](${DMCC}), and DIFC carry strong banking credibility`,
  },
  {
    rel: 'guides/uae-freelance-permit-dubai.mdx',
    find: 'professionals in other sectors need to look at Meydan, DMCC, or other zones.',
    replace: `professionals in other sectors need to look at Meydan, [DMCC](${DMCC}), or other zones.`,
  },
  {
    rel: 'guides/dubai-business-setup-guide.mdx',
    find: '| DMCC | Commodities, gold, trading, crypto | AED 18,000–35,000 | Good, Mashreq, Emirates NBD |',
    replace: `| [DMCC](${DMCC}) | Commodities, gold, trading, crypto | AED 18,000–35,000 | Good, Mashreq, Emirates NBD |`,
  },
  {
    rel: 'guides/dubai-business-setup-guide.mdx',
    find: '1. **Select freezone** based on activity, visa needs, and banking compatibility.',
    replace: `1. **Select freezone** based on activity, visa needs, and banking compatibility. For JLT-based trading and services, see the [DMCC company setup guide](${DMCC}).`,
  },
  {
    rel: 'guides/open-bank-account-dubai.mdx',
    find: '**Hubs:** [Gulf banking comparison]',
    replace: `**Hubs:** [DMCC company setup](${DMCC}) · [Gulf banking comparison]`,
  },
  {
    rel: 'guides/open-bank-account-dubai.mdx',
    find: 'Self-employed add trade licence and MOA.',
    replace: `Self-employed add trade licence and MOA. DMCC and other freezone licences are widely accepted; see [DMCC company setup](${DMCC}) for corporate banking prep.`,
  },
  {
    rel: 'areas/jlt-property-investment.mdx',
    find: 'with direct access to the DMCC and JLT stations on the Green Line.',
    replace: `with direct access to the [DMCC](${DMCC}) and JLT stations on the Green Line.`,
  },
  {
    rel: 'areas/jlt-property-investment.mdx',
    find: '**Part of the [Best Areas to Buy Property in Dubai]',
    replace: `**Business setup:** [DMCC company setup](${DMCC}) (JLT freezone). **Part of the [Best Areas to Buy Property in Dubai]`,
  },
];

const RELATED = {
  'guides/dubai-co-working-spaces.mdx': 'dmcc-company-setup',
  'guides/schools-near-dubai-marina.mdx': 'dmcc-company-setup',
  'guides/uae-freelance-permit-dubai.mdx': 'dmcc-company-setup',
  'guides/dubai-business-setup-guide.mdx': 'dmcc-company-setup',
  'guides/open-bank-account-dubai.mdx': 'dmcc-company-setup',
  'guides/dubai-ai-digital-economy-expats.mdx': 'dmcc-company-setup',
  'guides/buy-property-through-uae-company.mdx': 'dmcc-company-setup',
  'guides/uae-green-visa-freelancer.mdx': 'dmcc-company-setup',
  'guides/russian-expats-dubai-guide.mdx': 'dmcc-company-setup',
  'guides/dubai-marina-living-pros-cons.mdx': 'dmcc-company-setup',
  'guides/difc-company-setup.mdx': 'dmcc-company-setup',
  'areas/dubai-marina-property-investment.mdx': 'dmcc-company-setup',
  'areas/dubai-silicon-oasis-property-investment.mdx': 'dmcc-company-setup',
};

const BODY = [
  {
    rel: 'guides/dubai-ai-digital-economy-expats.mdx',
    find: '**Quick answer:**',
    replace: `**Business setup hub:** [DMCC company setup](${DMCC}) · **Quick answer:**`,
  },
  {
    rel: 'guides/buy-property-through-uae-company.mdx',
    find: '**Quick answer:**',
    replace: `**Related:** [DMCC company setup](${DMCC}) · **Quick answer:**`,
  },
  {
    rel: 'guides/uae-green-visa-freelancer.mdx',
    find: '**Quick answer:**',
    replace: `**Company route:** [DMCC company setup](${DMCC}) · **Quick answer:**`,
  },
  {
    rel: 'guides/russian-expats-dubai-guide.mdx',
    find: '**Quick answer:**',
    replace: `**Business:** [DMCC company setup](${DMCC}) · **Quick answer:**`,
  },
  {
    rel: 'guides/dubai-marina-living-pros-cons.mdx',
    find: '**Quick answer:**',
    replace: `**Nearby JLT:** [DMCC company setup](${DMCC}) · **Quick answer:**`,
  },
  {
    rel: 'guides/difc-company-setup.mdx',
    find: '**Quick answer:**',
    replace: `**Compare:** [DMCC company setup](${DMCC}) · **Quick answer:**`,
  },
  {
    rel: 'areas/dubai-marina-property-investment.mdx',
    find: '**Quick answer:**',
    replace: `**JLT business:** [DMCC company setup](${DMCC}) · **Quick answer:**`,
  },
  {
    rel: 'areas/dubai-silicon-oasis-property-investment.mdx',
    find: '**Quick answer:**',
    replace: `**Freezone compare:** [DMCC company setup](${DMCC}) · **Quick answer:**`,
  },
];

function addRelatedSlug(raw, slug) {
  if (new RegExp(`^\\s*-\\s*"${slug}"`, 'm').test(raw)) return raw;
  const m = raw.match(/^relatedSlugs:\n((?:\s+-\s*"[^"]+"\n)+)/m);
  if (!m) return raw;
  return raw.replace(m[0], `${m[0]}  - "${slug}"\n`);
}

let applied = 0;
let related = 0;

for (const { rel, find, replace } of PATCHES) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) {
    console.warn('skip missing', rel);
    continue;
  }
  let raw = readFileSync(path, 'utf8');
  if (!raw.includes(find)) {
    console.warn('skip (find missing):', rel, find.slice(0, 60));
    continue;
  }
  raw = raw.replace(find, replace);
  if (!DRY) writeFileSync(path, raw);
  applied++;
  console.log('patched', rel);
}

for (const [rel, slug] of Object.entries(RELATED)) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) {
    console.warn('skip missing', rel);
    continue;
  }
  let raw = readFileSync(path, 'utf8');
  const next = addRelatedSlug(raw, slug);
  if (next !== raw) {
    if (!DRY) writeFileSync(path, next);
    related++;
    console.log('relatedSlugs +', rel);
  }
}

for (const { rel, find, replace } of BODY) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) {
    console.warn('skip missing body', rel);
    continue;
  }
  let raw = readFileSync(path, 'utf8');
  if (raw.includes(DMCC)) continue;
  if (!raw.includes(find)) {
    console.warn('skip body find', rel);
    continue;
  }
  raw = raw.replace(find, replace);
  if (!DRY) writeFileSync(path, raw);
  applied++;
  console.log('body patched', rel);
}

console.log('=== DMCC CLUSTER LINKS ===');
console.log('dry:', DRY);
console.log('patches:', applied);
console.log('relatedSlugs:', related);
