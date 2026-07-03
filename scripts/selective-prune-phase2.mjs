#!/usr/bin/env node
/**
 * Phase 2.3 selective pruning (Variant B).
 * noindex only obvious weak/zero-impression pages; protect money pillars.
 *
 * Usage:
 *   node scripts/selective-prune-phase2.mjs           # dry-run report
 *   node scripts/selective-prune-phase2.mjs --apply   # write noindex: true
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const APPLY = process.argv.includes('--apply');
const ROOT = join(import.meta.dirname, '..');
const GSC_JSON = join(import.meta.dirname, 'gsc-pages-90d.json');
const REPORT_JSON = join(import.meta.dirname, 'pruning-batch-b-report.json');

/** Never noindex: core money / recovery pillars */
const PROTECT_SLUGS = new Set([
  'dubai-property-investment-guide',
  'can-foreigners-buy-property-uae',
  'golden-visa-2-million-aed-explained',
  'uae-visa-property-investor-750k',
  'non-resident-mortgage-dubai',
  'due-diligence-dubai-property',
  'dubai-rent-increase-calculator-rera',
  'gulf-property-investment-comparison-2026',
  'how-to-buy-dubai-property-remotely',
  'ejari-registration-landlord-guide',
  'islamic-vs-conventional-mortgage-uae',
  'dubai-mainland-llc-setup',
  'uae-free-zone-vs-mainland',
  'ras-al-khaimah-property-investment-guide',
  'saudi-arabia-property-foreigners-guide',
  'qatar-property-investment-guide',
  'bahrain-property-investment-guide',
  'kuwait-property-investment-guide',
  'oman-property-investment-guide',
  'abu-dhabi-property-investment-guide',
  'dubai-off-plan-investment-guide',
  'off-plan-property-dubai-guide',
  'dubai-rental-yield-guide',
  'abu-dhabi-rental-yield-guide',
  'sharjah-property-investment-guide',
  'ajman-property-investment-guide',
  'fujairah-property-investment-guide',
  'umm-al-quwain-property-investment',
  'wynn-al-marjan-island-timeline-impact',
  'difc-company-setup',
  'dmcc-company-setup',
  'adgm-vs-difc-company-setup',
  'dubai-rental-yield-guide',
  'dubai-off-plan-investment-guide',
  'dubai-cooling-off-period-off-plan',
  'dubai-tenant-eviction-rules-rera',
  'dubai-property-handover-checklist',
  'dubai-property-scams-red-flags',
  'dubai-property-valuation-guide',
  'dubai-property-dispute-resolution',
  'dubai-property-inheritance-guide',
  'dubai-mortgage-broker-guide',
  'buy-to-let-mortgage-dubai',
  'cash-vs-mortgage-dubai-property',
  'capital-gains-uae-property',
  'cost-of-buying-property-dubai',
  'dld-mortgage-registration-fees',
  'currency-transfer-buy-property-uae',
  'buy-property-through-uae-company',
  'dubai-holiday-home-roi-calculator-guide',
  'dubai-payment-plan-types-explained',
  'dubai-service-charge-index-explained',
  'dubai-district-cooling-charges',
  'dubai-rental-guarantee-schemes-explained',
  'dubai-rental-law-landlord-guide',
  'dubai-property-taxes-explained',
  'dubai-property-snagging-living',
  'dubai-property-market-cooling-or-growing',
  'dubai-capital-appreciation-vs-yield',
  'best-areas-buy-property-dubai',
  'best-dubai-developers-rental-yield',
  'dubai-developers-guide',
  'dubai-business-setup-guide',
  'saudi-rental-yield-guide',
  'bahrain-rental-yield-guide',
  'qatar-rental-yield-guide',
]);

const GUIDE_MONEY_INTENT =
  /(property-investment-guide|rental-yield|golden-visa|mortgage|off-plan|due-diligence|ejari|tenant-eviction|mainland-llc|free-zone-vs-mainland|can-foreigners|police-clearance|company-setup|difc|dmcc|how-to-buy.*remotely|islamic-vs-conventional|handover-checklist|scams-red-flags|valuation-guide|dispute-resolution|inheritance-guide|holiday-home-roi|payment-plan|service-charge|district-cooling|rental-guarantee|rental-law-landlord|property-taxes|capital-gains|buy-to-let|cash-vs-mortgage|cost-of-buying|dld-mortgage|currency-transfer|buy-property-through|developers-guide|business-setup|best-areas-buy|best-dubai-developers)/;

const PRUNE_RULES = [
  {
    id: 'news-zero-impression',
    reason: 'News with 0 GSC impressions in 90d (programmatic, no demand)',
    test: ({ collection }) => collection === 'news',
  },
  {
    id: 'projects-zero-impression',
    reason: 'Project catalog pages with 0 GSC impressions',
    test: ({ collection }) => collection === 'projects',
  },
  {
    id: 'compare-zero-impression',
    reason: 'Comparison pages with 0 GSC impressions (thin programmatic cluster)',
    test: ({ collection }) => collection === 'compare',
  },
  {
    id: 'areas-zero-impression',
    reason: 'Area pages with 0 GSC impressions (secondary geo, no search signal)',
    test: ({ collection }) => collection === 'areas',
  },
  {
    id: 'nationality-buyer-guides',
    reason: 'Nationality-specific buyer guides (programmatic, no traction)',
    test: ({ slug }) => /^dubai-property-for-.+-buyers$/.test(slug),
  },
  {
    id: 'living-neighbourhood-guides',
    reason: 'Living-* guides duplicate area/relocation intent',
    test: ({ slug }) => slug.startsWith('living-'),
  },
  {
    id: 'schools-near-guides',
    reason: 'Schools-near-* micro pages with no search demand',
    test: ({ slug }) => slug.startsWith('schools-near-'),
  },
  {
    id: 'developer-reviews',
    reason: 'Developer review pages with 0 impressions',
    test: ({ slug }) =>
      /-review$/.test(slug) ||
      slug.endsWith('-properties-review') ||
      slug.endsWith('-developer-review'),
  },
  {
    id: 'freezone-company-setup-cluster',
    reason: 'Secondary free zone / company setup pages (keep DIFC/DMCC/mainland pillars)',
    test: ({ slug }) =>
      /-(free-zone-setup|company-setup|mainland-llc-setup)$/.test(slug) ||
      [
        'ifza-company-setup',
        'jafza-company-setup',
        'rakez-company-setup',
        'meydan-free-zone-setup',
        'dubai-south-free-zone-setup',
        'shams-free-zone-setup',
        'abu-dhabi-mainland-llc-setup',
        'saudi-company-setup-guide',
        'ajman-rental-yield-guide',
        'fujairah-rental-yield-guide',
        'umm-al-quwain-rental-yield-guide',
        'kuwait-rental-yield-guide',
      ].includes(slug),
  },
  {
    id: 'duplicate-area-in-guides',
    reason: 'Property investment guide duplicates /areas/ URL',
    test: ({ collection, slug }) =>
      collection === 'guides' && slug.endsWith('-property-investment'),
  },
  {
    id: 'relocation-satellite',
    reason: 'Relocate-* and first-30-days lifestyle satellites',
    test: ({ slug }) =>
      slug.startsWith('relocate-') ||
      [
        'first-30-days-dubai-expat',
        'abu-dhabi-relocation-guide',
        'oman-relocation-guide',
        'dubai-relocation-guide',
        'bahrain-relocation-guide',
        'qatar-relocation-guide',
      ].includes(slug),
  },
  {
    id: 'lifestyle-micro',
    reason: 'Low-intent lifestyle micro topics (not property leads)',
    test: ({ slug }) =>
      [
        'dubai-air-quality',
        'dubai-flooding-rain-risk',
        'dubai-chores-time-parking',
        'dubai-weekend-culture',
        'pet-relocation-dubai',
        'dubai-nursery-early-years',
        'dubai-neighbourhoods-for-singles',
        'dubai-domestic-worker-visa',
        'dubai-maid-nanny-cost',
        'dubai-inheritance-non-muslim-wills',
        'dubai-property-insurance-guide',
        'dubai-property-market-cycle-2026',
        'dubai-villa-vs-apartment-investment',
        'dubai-property-vs-stock-market',
        'dubai-property-visa-relocation-bundle',
        'currency-exchange-aed-usd-eur',
        'tax-german-residents-dubai',
        'offshore-bank-account-uae-expats',
        'uae-savings-fixed-deposits',
        'uae-blue-visa',
        'uae-freelance-permit-dubai',
        'uae-green-visa-freelancer',
        'uae-residency-visa-types-guide',
        'sharjah-dubai-commuter-guide',
        'how-to-evaluate-dubai-developer',
        'post-handover-payment-plan-dubai',
        'leaving-dubai-exit-checklist',
        'dubai-special-needs-schools',
        'dubai-school-bus-transport-fees',
        'dubai-school-fees-by-curriculum',
        'dubai-rta-fines-parking',
        'dubai-public-vs-private-healthcare',
        'dubai-car-ownership-cost',
        'dubai-cost-of-living-guide',
        'dubai-expat-community-groups',
        'gulf-schools-comparison',
        'gulf-healthcare-comparison',
        'gulf-expat-living-comparison',
        'gulf-residency-by-investment-guide',
        'golden-visa-vs-green-visa',
        'golden-visa-vs-investor-visa-uae',
        'how-much-to-invest-dubai-property',
        'ib-schools-dubai',
        'indian-schools-dubai-cbse',
        'khda-school-ratings-explained',
        'manama-cost-of-living',
        'muscat-cost-of-living',
        'riyadh-cost-of-living',
        'rak-cost-of-living',
        'rak-cost-of-living-detailed',
        'rak-healthcare-guide',
        'rak-vs-dubai-family-life',
        'abu-dhabi-cost-of-living',
        'abu-dhabi-expat-community',
        'abu-dhabi-utilities-addc',
        'abu-dhabi-residency-options',
        'abu-dhabi-golden-visa-living',
        'adek-school-ratings-abu-dhabi',
        'bahrain-international-schools',
        'bahrain-healthcare-guide',
        'bahrain-relocation-guide',
        'oman-healthcare-guide',
        'oman-banking-expats',
        'oman-family-visa',
        'oman-itc-zones-property',
        'oman-rental-yield-guide',
        'qatar-tax-expats',
        'qatar-permanent-residency',
        'qatar-residency-by-investment',
        'qatar-residency-by-property',
        'qatar-school-fees',
        'qatar-work-visa-process',
        'saudi-driving-women-expats',
        'saudi-healthcare-expats',
        'saudi-off-plan-guide',
        'saudi-premium-residency-property',
        'saudi-property-foreigner-living',
        'uae-banking-guide-expats',
        'uae-central-bank-mortgage-rules',
        'uae-mortgage-banks-list',
        'uae-credit-score-al-etihad',
        'double-tax-treaty-uae',
        'emirates-id-application-guide',
        'emirates-id-after-property-purchase',
      ].includes(slug),
  },
  {
    id: 'best-off-plan-cluster',
    reason: 'Best-off-plan area listicles (scaled content)',
    test: ({ slug }) => slug.startsWith('best-off-plan-'),
  },
  {
    id: 'secondary-banking-residency',
    reason: 'Secondary banking / residency guides with 0 impressions',
    test: ({ slug }) =>
      slug.endsWith('-banking-expats') ||
      slug.endsWith('-driving-license') ||
      slug.endsWith('-driving-guide') ||
      slug.endsWith('-healthcare-guide') ||
      slug.endsWith('-international-schools') ||
      slug.endsWith('-international-schools-guide') ||
      slug.endsWith('-freehold-areas') ||
      slug.endsWith('-freehold-property-guide') ||
      slug.endsWith('-off-plan-guide') ||
      slug.endsWith('-golden-visa-property') ||
      slug.endsWith('-golden-residence') ||
      slug.endsWith('-golden-residence-property') ||
      slug.endsWith('-property-foreigner-living') ||
      slug.endsWith('-rent-prices-by-area') ||
      slug.endsWith('-cost-of-living') ||
      slug.endsWith('-vs-dubai-families') ||
      (slug.endsWith('-property-investment-guide') && !PROTECT_SLUGS.has(slug)),
  },
  {
    id: 'best-listicles',
    reason: 'Best-* listicles with no GSC traction',
    test: ({ slug }) => slug.startsWith('best-') && !PROTECT_SLUGS.has(slug),
  },
  {
    id: 'school-curriculum-guides',
    reason: 'School curriculum micro guides (boarding schools pillar keeps traffic elsewhere)',
    test: ({ slug }) =>
      /^(american|british|french|ib|indian)-schools-/.test(slug) ||
      slug === 'boarding-schools-uae',
  },
  {
    id: 'living-relocation-duplicates',
    reason: 'Living / relocation duplicate guides',
    test: ({ slug }) =>
      slug.endsWith('-living-guide') ||
      slug.endsWith('-living-pros-cons') ||
      slug.includes('-living') ||
      slug.endsWith('-relocation-checklist') ||
      slug.endsWith('-relocation-guide') ||
      slug === 'buy-property-dubai-foreigner',
  },
  {
    id: 'emirate-guide-satellites',
    reason: 'Non-core emirate satellite guides (pillars protected separately)',
    test: ({ collection, slug }) => {
      if (collection !== 'guides') return false;
      if (PROTECT_SLUGS.has(slug)) return false;
      return /^(abu-dhabi|bahrain|qatar|saudi|oman|kuwait|ajman|sharjah|fujairah|rak|umm-al-quwain|doha|riyadh|manama|muscat)-/.test(
        slug,
      );
    },
  },
  {
    id: 'dubai-lifestyle-satellite',
    reason: 'Dubai lifestyle / admin satellites with 0 impressions',
    test: ({ collection, slug }) => {
      if (collection !== 'guides') return false;
      if (PROTECT_SLUGS.has(slug)) return false;
      if (!slug.startsWith('dubai-')) return false;
      if (GUIDE_MONEY_INTENT.test(slug)) return false;
      return true;
    },
  },
  {
    id: 'uae-satellite-guides',
    reason: 'UAE-wide admin guides without property-buyer intent',
    test: ({ collection, slug }) => {
      if (collection !== 'guides') return false;
      if (PROTECT_SLUGS.has(slug)) return false;
      if (!slug.startsWith('uae-')) return false;
      if (GUIDE_MONEY_INTENT.test(slug)) return false;
      return true;
    },
  },
  {
    id: 'gulf-generic-satellites',
    reason: 'Generic Gulf comparison / lifestyle guides',
    test: ({ slug }) =>
      slug.startsWith('gulf-') ||
      slug.startsWith('best-gulf-') ||
      slug === 'convert-foreign-license-dubai' ||
      slug === 'dubai-property-investment-for-beginners' ||
      slug === 'dubai-property-flipping-guide' ||
      slug === 'dubai-property-portfolio-strategy' ||
      slug === 'dubai-property-russian-buyers-relocation' ||
      slug === 'dubai-property-market-cooling-or-growing',
  },
];

function normalizeUrl(url) {
  return url.replace('https://www.', 'https://').replace(/\/$/, '');
}

async function loadGscPages() {
  const raw = JSON.parse(await readFile(GSC_JSON, 'utf8'));
  const pages = raw.pages || raw.data?.map((r) => r.page) || [];
  return new Set(pages.map(normalizeUrl));
}

async function getAllMdx() {
  const collections = ['areas', 'guides', 'compare', 'projects', 'news'];
  const all = [];
  for (const collection of collections) {
    const dir = join(ROOT, 'src', 'content', collection);
    const files = await readdir(dir);
    for (const file of files.filter((f) => f.endsWith('.mdx'))) {
      const slug = file.replace(/\.mdx$/, '');
      all.push({
        collection,
        slug,
        relPath: join('src', 'content', collection, file),
        url: normalizeUrl(`https://invest-gulf.com/${collection}/${slug}/`),
      });
    }
  }
  return all;
}

function hasNoindex(content) {
  return /^noindex:\s*true/m.test(content.split('---').slice(1, 2).join('---'));
}

function classify(page) {
  if (PROTECT_SLUGS.has(page.slug)) {
    return { action: 'keep', rule: 'protected-pillar' };
  }
  for (const rule of PRUNE_RULES) {
    if (rule.test(page)) {
      return { action: 'prune', rule: rule.id, reason: rule.reason };
    }
  }
  return { action: 'keep', rule: 'zero-impression-but-potential' };
}

async function applyNoindex(relPath) {
  const full = join(ROOT, relPath);
  let content = await readFile(full, 'utf8');
  if (hasNoindex(content)) return 'already';

  const parts = content.split('---');
  if (parts.length < 3) return 'invalid-frontmatter';

  const fm = parts[1];
  if (/\nnoindex:/m.test(fm)) {
    parts[1] = fm.replace(/noindex:\s*false/, 'noindex: true');
  } else {
    parts[1] = `${fm.trimEnd()}\nnoindex: true\n`;
  }
  await writeFile(full, parts.join('---'), 'utf8');
  return 'applied';
}

async function main() {
  const gscSet = await loadGscPages();
  const allMdx = await getAllMdx();
  const zeroImp = allMdx.filter((p) => !gscSet.has(p.url));

  const decisions = zeroImp.map((page) => ({ ...page, ...classify(page) }));
  const prune = decisions.filter((d) => d.action === 'prune');
  const keep = decisions.filter((d) => d.action === 'keep');

  const byRule = prune.reduce((acc, p) => {
    acc[p.rule] = (acc[p.rule] || 0) + 1;
    return acc;
  }, {});

  const report = {
    generatedAt: new Date().toISOString(),
    period: '2026-04-04 to 2026-07-02',
    totalMdx: allMdx.length,
    gscPagesWithImpressions: gscSet.size,
    zeroImpressionTotal: zeroImp.length,
    pruneCount: prune.length,
    keepCount: keep.length,
    indexedAfterApprox: allMdx.length - prune.length,
    byRule,
    prune: prune.map(({ collection, slug, relPath, rule, reason }) => ({
      collection,
      slug,
      relPath,
      rule,
      reason,
    })),
    keepSample: keep.slice(0, 40).map(({ collection, slug, rule }) => ({
      collection,
      slug,
      rule,
    })),
  };

  await writeFile(REPORT_JSON, JSON.stringify(report, null, 2));

  console.log('=== SELECTIVE PRUNE Phase 2.3 (Variant B) ===\n');
  console.log(`Zero impression pages: ${zeroImp.length}`);
  console.log(`PRUNE (noindex):       ${prune.length}`);
  console.log(`KEEP (potential):      ${keep.length}`);
  console.log(`~Indexed corpus after:  ${allMdx.length - prune.length} pages\n`);
  console.log('By rule:');
  for (const [rule, count] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}\t${rule}`);
  }
  console.log(`\nReport: ${REPORT_JSON}`);

  if (!APPLY) {
    console.log('\nDry run only. Run with --apply to write noindex: true');
    return;
  }

  let applied = 0;
  let already = 0;
  for (const p of prune) {
    const result = await applyNoindex(p.relPath);
    if (result === 'applied') applied++;
    else if (result === 'already') already++;
    else console.warn(`Skip ${p.relPath}: ${result}`);
  }
  console.log(`\nApplied noindex: ${applied}, already had noindex: ${already}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
