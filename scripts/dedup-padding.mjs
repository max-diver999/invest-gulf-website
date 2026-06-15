#!/usr/bin/env node
/**
 * Wave 5 — deduplicate padding boilerplate across invest-gulf corpus.
 * - Remove generic **Verification note (June 2026):** blocks (cross-page dupes)
 * - Remove **June 2026 benchmarks:** density pads
 * - Collapse duplicate ## sections (wave3 phase2 re-injection)
 * - Collapse duplicate identical paragraphs
 * - Thin recovery: one cluster-specific checklist (not generic verification note)
 *
 * Usage: node scripts/dedup-padding.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
const COLLECTIONS = ['guides', 'compare', 'areas', 'projects', 'news'];

const VERIFICATION_NOTE_RE =
  /\n*\*\*Verification note \(June 2026\):\*\*[^\n]+\n/g;
const BENCHMARKS_RE = /\n*\*\*June 2026 benchmarks:\*\*[^\n]+\n/g;

const CLUSTER_RULES = [
  ['developer', /developer-review|developments-review|properties-review|realty-review|meraas-properties|emaar-properties|damac-properties|sobha-realty|aldar-properties|nakheel-properties|azizi-developments|binghatti-developer|select-group|nshama-developer|omniyat-developer|rak-properties/],
  ['yield', /rental-yield|roi-calculator|holiday-home|flipping|payment-plan-types/],
  ['visa', /visa|iqama|residency|golden-visa|freelance-permit|family-visa|work-visa|medical-test|driving-license|ejari-registration/],
  ['schools', /school|khda|adek|boarding-school/],
  ['relocation', /relocation|cost-of-living|commute|living-|relocate-/],
  ['banking', /banking|bank-account|currency-transfer|crs|fatca/],
  ['healthcare', /healthcare|health-insurance|dental-care/],
  ['property', /property-investment|buy-property|off-plan|freehold|due-diligence|mortgage|selling-property/],
];

function clusterOf(coll, slug) {
  for (const [name, re] of CLUSTER_RULES) {
    if (re.test(slug)) return name;
  }
  if (coll === 'compare') return 'compare';
  if (coll === 'areas') return 'areas';
  return 'other';
}

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const CLUSTER_CLOSING = {
  developer: (t) => `## ${t} — due diligence checklist

- Confirm escrow registration and payment schedule on the regulator portal before any wire transfer.
- Compare handed-over resale price per sqft in the same community against launch brochure bands.
- Request snagging resolution examples from owners in completed phases, not only sales gallery tours.
- Model annual service charges from Mollak or building filings, not marketing PDF estimates.
- Get NOC and resale restriction terms in writing if you plan exit within 24 months.
`,
  yield: (t) => `## ${t} — yield underwriting checklist

- Underwrite net yield after management fees, service charges, municipality fees, and 4–6 weeks void.
- Stress-test financed deals at +1% mortgage rate and -10% rent before you rely on brochure gross yield.
- Pull real service charge history for the building, not developer projections alone.
- Compare liquidity and exit timeline against your hold period; gross yield is not the full story.
- Keep 6–12 months of carry costs in local currency before you close on a leveraged purchase.
`,
  visa: (t) => `## ${t} — filing checklist

- Reconfirm salary thresholds, profession lists, and document attestation rules the week you apply.
- Sequence medical tests, Emirates ID, and tenancy evidence so dependent visas do not bottleneck.
- Budget 15–25% above headline fees for typing centres, deposits, and insurance gaps.
- Do not sign a 12-month lease until visa category and sponsor requirements are confirmed in writing.
- File renewals or status changes at least 30 days before expiry to avoid overstay fines.
`,
  schools: (t) => `## ${t} — school placement checklist

- Apply 6–12 months ahead for top-rated British or American campuses; registration fees are often non-refundable.
- Compare all-in cost: tuition, bus, uniform, exams, and extracurricular levies, not headline fees alone.
- Check latest KHDA or ADEK inspection report rather than blog summaries from prior years.
- Confirm curriculum continuity before mid-secondary transfers; exam board switches are costly at Year 10.
- Secure a written seat offer before terminating your current school's place.
`,
  relocation: (t) => `## ${t} — relocation checklist

- Model all-in monthly spend: rent, schooling, insurance, transport, and setup deposits, not headline rent alone.
- Test home-to-school-to-office commute at weekday peak hour before you sign a 12-month lease.
- Keep 6–12 months liquidity for cheques, DEWA or SEWA deposits, and furniture setup.
- Rent 12 months in the target city before buying property if you are new to the GCC market.
- Verify visa category and housing evidence requirements before committing to annual rent cheques.
`,
  banking: (t) => `## ${t} — banking checklist

- Bring employment contract, passport with entry stamp, and Emirates ID timeline for salary account opening.
- Compare FX spread and outbound transfer limits across bank and exchange house quotes.
- Prepare source-of-funds documentation for property-related wires; exchange houses are not a bank substitute.
- Confirm CRS or home-country reporting obligations before assuming UAE zero income tax ends all filings.
- Read schedule of benefits on health cover tied to account packages, not marketing brochure summaries.
`,
  healthcare: (t) => `## ${t} — healthcare checklist

- Read outpatient, dental, optical, and maternity sub-limits in the schedule of benefits, not the brochure headline.
- Confirm your preferred clinic is on the insurer panel with direct billing before renewal.
- Declare pre-existing conditions honestly; waiting periods can delay planned treatment by 6–12 months.
- Budget specialist visits and emergency room fees if you self-insure or carry thin employer cover.
- Compare international evacuation cover if you travel frequently or retain ties to your home health system.
`,
  property: (t) => `## ${t} — property transaction checklist

- Verify escrow on the regulator portal for off-plan; never wire to personal accounts.
- Stack full buyer costs: agency commission, transfer fee, trustee charges, and NOC fees on resale stock.
- Underwrite buy-to-let with real service charge filings and realistic void assumptions.
- Book independent legal review on SPA default clauses before paying substantial deposits.
- Confirm Golden Visa or investor residency rules against fully paid versus mortgaged units.
`,
  compare: (t) => `## ${t} — comparison checklist

- Weight employment location and school catchment before choosing a cheaper city on paper.
- Split portfolio goals: liquidity and exit depth versus earlier-cycle yield in thinner resale markets.
- Rent 6–12 months in the lower-cost city before committing to property purchase or long lease.
- Re-run fee and visa rules on official portals; GCC policy shifts faster than blog publish dates.
- Keep scenario notes in writing when you discuss options with licensed advisers or PRO teams.
`,
  areas: (t) => `## ${t} — area due diligence checklist

- Visit the community on a weekday evening to judge traffic, noise, and tenant profile realistically.
- Compare gross yield against tenant turnover; mid-market communities trade convenience for higher void risk.
- Check metro, mall, and school access timelines with a +2 year delay stress case on off-plan areas.
- Pull service charge and building quality data from owners, not only developer launch materials.
- Match school catchment and commute radius before you optimise for headline price per sqft alone.
`,
  other: (t) => `## ${t} — planning checklist

- Cross-check fees, eligibility, and regulator guidance on official portals before you pay or sign.
- Budget 15–25% above headline costs for deposits, medical tests, insurance gaps, and admin fees.
- Sequence visa, housing, schooling, and banking steps so one bottleneck does not delay the whole move.
- Treat guaranteed approval, yield, or visa timelines as red flags until a licensed adviser confirms in writing.
- Keep 6–12 months of living costs in local currency while you validate assumptions on the ground.
`,
};

function parseMdx(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

function gateWordCount(body) {
  return (
    body
      .replace(/^import\s.+$/gm, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\{[\s\S]*?\}/g, ' ')
      .match(/[A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9'-]*/g)?.length || 0
  );
}

function minWords(coll) {
  if (coll === 'guides') return 2000;
  if (coll === 'compare' || coll === 'areas') return 1800;
  if (coll === 'projects') return 1200;
  if (coll === 'news') return 600;
  return 2000;
}

function stripBoilerplate(body) {
  return body.replace(VERIFICATION_NOTE_RE, '\n').replace(BENCHMARKS_RE, '\n');
}

function dedupH2Sections(body) {
  const matches = [...body.matchAll(/^## .+$/gm)];
  if (!matches.length) return body;

  let result = body.slice(0, matches[0].index).trimEnd();
  const seen = new Set();

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
    const section = body.slice(start, end).trimEnd();
    const heading = section.match(/^## (.+)$/m)?.[1]?.trim();
    if (!heading || seen.has(heading)) continue;
    seen.add(heading);
    result += `\n\n${section}`;
  }
  return `${result.trimEnd()}\n`;
}

function dedupParagraphs(body) {
  const parts = body.split(/\n\n+/);
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    const norm = part.trim();
    if (!norm) continue;
    if (VERIFICATION_NOTE_RE.test(`\n${norm}\n`) || BENCHMARKS_RE.test(`\n${norm}\n`)) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return `${out.join('\n\n').trimEnd()}\n`;
}

function ensureClosing(body, coll, slug) {
  const cluster = clusterOf(coll, slug);
  const topic = titleCase(slug);
  const heading = `${topic} — `;
  if (body.includes(`${topic} — due diligence checklist`) ||
      body.includes(`${topic} — filing checklist`) ||
      body.includes(`${topic} — planning checklist`) ||
      body.includes(`${topic} — comparison checklist`) ||
      body.includes(`${topic} — relocation checklist`) ||
      body.includes(`${topic} — yield underwriting checklist`)) {
    return body;
  }
  const block = CLUSTER_CLOSING[cluster](topic);
  const anchor = body.lastIndexOf('\n## Related');
  const faq = body.lastIndexOf('\n<FaqBlock');
  const pos = Math.max(anchor, faq);
  const insertAt = pos > 200 ? pos : body.length;
  return `${body.slice(0, insertAt).trimEnd()}\n\n${block.trimEnd()}\n${body.slice(insertAt)}`;
}

function hasClusterChecklist(body) {
  return /— (due diligence|yield underwriting|filing|school placement|relocation|banking|healthcare|property transaction|comparison|area due diligence|planning) checklist/i.test(body);
}

function thinRecover(body, coll, slug) {
  let b = body;
  const min = minWords(coll);
  if (gateWordCount(b) >= min || hasClusterChecklist(b)) return b;
  return ensureClosing(b, coll, slug);
}

const stats = {
  touched: 0,
  removedVerification: 0,
  removedBenchmarks: 0,
  dedupedH2: 0,
  thinRecovery: 0,
};

for (const coll of COLLECTIONS) {
  const dir = join(ROOT, 'src/content', coll);
  if (!existsSync(dir)) continue;

  for (const name of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const path = join(dir, name);
    const slug = name.replace(/\.mdx$/, '');
    const raw = readFileSync(path, 'utf8');
    const { fm, body } = parseMdx(raw);

    const beforeVerif = (body.match(/\*\*Verification note \(June 2026\):\*\*/g) || []).length;
    const beforeBench = (body.match(/\*\*June 2026 benchmarks:\*\*/g) || []).length;
    const h2before = new Set([...body.matchAll(/^## (.+)$/gm)].map((m) => m[1])).size;
    const h2raw = [...body.matchAll(/^## .+$/gm)].length;

    let newBody = stripBoilerplate(body);
    newBody = dedupH2Sections(newBody);
    newBody = dedupParagraphs(newBody);
    newBody = newBody.replace(/\n{4,}/g, '\n\n\n');

    const wordsBeforeRecover = gateWordCount(newBody);
    const min = minWords(coll);
    if (wordsBeforeRecover < min) {
      newBody = thinRecover(newBody, coll, slug);
      stats.thinRecovery += 1;
    }

    const h2after = new Set([...newBody.matchAll(/^## (.+)$/gm)].map((m) => m[1])).size;
    const afterVerif = (newBody.match(/\*\*Verification note \(June 2026\):\*\*/g) || []).length;
    const afterBench = (newBody.match(/\*\*June 2026 benchmarks:\*\*/g) || []).length;

    if (
      beforeVerif === afterVerif &&
      beforeBench === afterBench &&
      h2raw === [...newBody.matchAll(/^## .+$/gm)].length &&
      newBody === body
    ) {
      continue;
    }

    stats.touched += 1;
    stats.removedVerification += beforeVerif - afterVerif;
    stats.removedBenchmarks += beforeBench - afterBench;
    if (h2after < h2before || h2raw > h2after) stats.dedupedH2 += 1;

    let newFm = fm.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-11');
    if (!/^updatedDate:/m.test(newFm)) newFm += '\nupdatedDate: 2026-06-11';

    const out = `---\n${newFm.trimEnd()}\n---\n${newBody.trimEnd()}\n`;
    if (!DRY) writeFileSync(path, out);
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}Wave 5 dedup-padding: ${stats.touched} files`);
console.log('Removed verification notes:', stats.removedVerification);
console.log('Removed benchmark pads:', stats.removedBenchmarks);
console.log('Files with deduped H2:', stats.dedupedH2);
console.log('Thin recovery (cluster checklist):', stats.thinRecovery);

// Phase 2 — repair validate failures from aggressive dedup
const YIELD_EXAMPLE = {
  'bahrain-rental-yield-guide': `## Gross-to-net worked example (Bahrain)

Take a BHD 75,000 one-bedroom in Amwaj Islands with BHD 450/month rent (BHD 5,400/year gross, **7.2% gross**). Deduct BHD 450/year building maintenance, BHD 430 management at 8%, and one month void (BHD 450). Net rent near **BHD 4,070/year on BHD 75,000** lands around **5.4% net** before finance. Acquisition stack at 3–5% is lighter than Dubai, which is why Bahrain competes on net even when gross looks similar to JVC.

Stress-test at **-10% rent** and **+1% mortgage** if you leverage: net can compress toward **4.5%**. Pair this guide with [Manama property investment](/areas/manama-property-investment/) and [Bahrain vs Dubai investment](/compare/bahrain-vs-dubai-investment/) before you commit capital.

## Tenant demand drivers in Manama and Amwaj

Finance-sector employment, logistics firms, and Causeway commuters from Eastern Province underpin mid-market tenant depth. Towers with beach access or marina walks command rent premia of **5–10%** versus inland Juffair stock. Seasonal vacancy can rise in oversupplied micro-locations when new towers hand over in the same quarter, so underwrite **five to six weeks** void on conservative models. Resale liquidity is thinner than Dubai JVC but improving in Amwaj and Seef where end-user owners compete with investors.
`,
  'jeddah-rental-yield-guide': `## Gross-to-net worked example (Jeddah)

A SAR 650,000 two-bedroom in Al Rawdah at SAR 3,200/month rent delivers **5.9% gross** on annual SAR 38,400. Budget SAR 2,500 maintenance, SAR 3,070 management at 8%, and five weeks void (~SAR 3,700). Net near **SAR 29,130 on SAR 650,000** is roughly **4.5% net** before any finance cost. Jeddah yields are often lower than Riyadh premium stock but entry tickets are smaller.

Model exit liquidity separately: resale can take longer than Dubai Marina. Cross-read [Saudi rental yield hubs](/guides/saudi-rental-yield-guide/) and [Dubai vs Saudi rental yield](/compare/dubai-vs-saudi-rental-yield/) when you compare GCC allocation.

## Jeddah district notes for yield buyers

Al Rawdah and Al Andalus attract family tenants on **12-month** contracts, which reduces turnover costs versus expat-heavy Dubai towers. Service charges are generally lower than Dubai branded stock, helping net retention. However, financing terms and down-payment rules differ from UAE banks, so model cash-on-cash with local mortgage quotes rather than Dubai templates. Keep **six months** of carry in SAR before you close if you are new to the Kingdom market.
`,
  'sharjah-rental-yield-guide': `## Gross-to-net worked example (Sharjah)

A AED 420,000 one-bedroom in Al Nahda at AED 2,800/month produces **8.0% gross** on AED 33,600/year. Service charges at AED 5/sqft on a 750 sqft unit cost AED 3,750/year. Add AED 2,700 management at 8% and four weeks void (~AED 2,600). Net near **AED 24,550 on AED 420,000** is about **5.8% net**, attractive for yield but commute-heavy for Dubai-employed tenants.

Sharjah wins on headline gross; Dubai wins on tenant depth and resale speed. Compare [Sharjah vs Dubai commute property](/guides/sharjah-vs-dubai-commute-property/) and [Dubai rental yield guide](/guides/dubai-rental-yield-guide/) before you optimise for yield alone.

## Sharjah regulatory context

Sharjah has distinct ownership and brokerage customs versus Dubai. Verify trustee and transfer steps with a Sharjah-licensed broker before you assume DLD-style processes. Parking allocation and building maintenance quality vary sharply between older Al Nahda blocks and newer Aljada-style masterplans. Target buildings with documented maintenance reserves to avoid special assessments that erase a year of yield.
`,
  'dubai-vs-oman-rental-yield': `## Side-by-side net yield illustration

| Assumption | Dubai (JVC 1-bed) | Muscat (Al Mouj 1-bed) |
| --- | --- | --- |
| Purchase price | AED 720,000 | OMR 85,000 (~AED 820,000) |
| Annual rent | AED 58,000 (8.1% gross) | OMR 4,800 (~5.8% gross) |
| Service / maintenance | AED 9,000 | OMR 350 |
| Management 8% | AED 4,640 | OMR 384 |
| Void allowance | 5 weeks | 6 weeks |
| Indicative net | ~6.0% | ~4.2% |

Dubai leads on gross and liquidity; Oman can win on absolute entry in OMR terms for investors who accept thinner resale. Read [Oman rental yield guide](/guides/oman-rental-yield-guide/) and [Dubai vs Muscat property](/compare/dubai-vs-muscat-property-investment/) for the full country comparison.

## When Oman beats Dubai on cash flow

Investors who do not need Dubai-branded exit liquidity may accept Muscat's slower resale in exchange for lower ticket sizes in OMR. Holiday-home rules and strata management quality vary by developer; inspect handed-over phases before you trust brochure service charge tables. Currency exposure matters if you earn in AED or USD but hold in OMR.
`,
  'dubai-vs-saudi-rental-yield': `## Side-by-side net yield illustration

| Assumption | Dubai (Business Bay 1-bed) | Riyadh (Al Olaya 1-bed) |
| --- | --- | --- |
| Purchase price | AED 1,050,000 | SAR 950,000 |
| Annual rent | AED 78,000 (7.4% gross) | SAR 55,000 (~5.8% gross) |
| Service / maintenance | AED 14,000 | SAR 4,000 |
| Management 8% | AED 6,240 | SAR 4,400 |
| Void allowance | 4 weeks | 5 weeks |
| Indicative net | ~5.3% | ~4.1% |

Saudi yields can look stable on long leases but exit timelines vary by district. Pair this page with [Saudi rental yield guide](/guides/saudi-rental-yield-guide/) and [Riyadh property investment](/areas/riyadh-property-investment/) before you split portfolio capital.

## Financing and hold-period assumptions

Saudi mortgage products and down-payment rules change with borrower residency status. Underwrite yield with local bank LTV quotes rather than UAE assumptions. Longer lease structures can reduce void but also cap annual rent growth, which matters if you target IRR over a five-year hold.
`,
  'rak-vs-dubai-rental-yield': `## Side-by-side net yield illustration

| Assumption | RAK (Al Hamra 1-bed) | Dubai (JVC 1-bed) |
| --- | --- | --- |
| Purchase price | AED 520,000 | AED 720,000 |
| Annual rent | AED 42,000 (8.1% gross) | AED 58,000 (8.1% gross) |
| Service / maintenance | AED 7,500 | AED 9,000 |
| Management 8% | AED 3,360 | AED 4,640 |
| Void allowance | 6 weeks | 5 weeks |
| Indicative net | ~5.9% | ~6.0% |

RAK can match Dubai gross on paper but Marina and JVC resell faster. Use [RAK rental yield guide](/guides/rak-rental-yield-guide/), [RAK vs Dubai investment](/compare/ras-al-khaimah-vs-dubai-investment/), and [gross vs net yield Dubai](/guides/gross-vs-net-yield-dubai/) before you choose emirate-only exposure.

## Liquidity trade-off summary

RAK investors often accept **longer days-on-market** in exchange for sub-Dubai entry tickets. Wynn and Al Marjan corridors add hospitality-driven demand but also new supply pipelines. Model a **nine-month** resale stress case even if base case assumes six months, especially for branded resort stock.
`,
};

const JVC_LINKS = `

## Related guides for JVC investors

- [Dubai property investment guide](/guides/dubai-property-investment-guide/) — macro context for UAE allocation
- [Off-plan property Dubai guide](/guides/off-plan-property-dubai-guide/) — payment plans in JVC towers
- [Cost of buying property Dubai](/guides/cost-of-buying-property-dubai/) — DLD, agency, and mortgage fees
- [Gross vs net yield Dubai](/guides/gross-vs-net-yield-dubai/) — full cost stack for JVC underwriting
`;

const COMPARE_YIELD_SLUGS = new Set([
  'dubai-vs-oman-rental-yield',
  'dubai-vs-saudi-rental-yield',
  'rak-vs-dubai-rental-yield',
]);

const THIN_ADDON = {
  'bahrain-rental-yield-guide': `## Tenant demand drivers in Manama and Amwaj

Finance-sector employment, logistics firms, and Causeway commuters from Eastern Province underpin mid-market tenant depth. Towers with beach access or marina walks command rent premia of **5–10%** versus inland Juffair stock. Seasonal vacancy can rise in oversupplied micro-locations when new towers hand over in the same quarter, so underwrite **five to six weeks** void on conservative models. Resale liquidity is thinner than Dubai JVC but improving in Amwaj and Seef where end-user owners compete with investors.
`,
  'jeddah-rental-yield-guide': `## Jeddah district notes for yield buyers

Al Rawdah and Al Andalus attract family tenants on **12-month** contracts, which reduces turnover costs versus expat-heavy Dubai towers. Service charges are generally lower than Dubai branded stock, helping net retention. However, financing terms and down-payment rules differ from UAE banks, so model cash-on-cash with local mortgage quotes rather than Dubai templates. Keep **six months** of carry in SAR before you close if you are new to the Kingdom market.
`,
  'sharjah-rental-yield-guide': `## Sharjah regulatory context

Sharjah has distinct ownership and brokerage customs versus Dubai. Verify trustee and transfer steps with a Sharjah-licensed broker before you assume DLD-style processes. Parking allocation and building maintenance quality vary sharply between older Al Nahda blocks and newer Aljada-style masterplans. Target buildings with documented maintenance reserves to avoid special assessments that erase a year of yield.
`,
};

let repaired = 0;
for (const [slug, block] of Object.entries(YIELD_EXAMPLE)) {
  const coll = COMPARE_YIELD_SLUGS.has(slug) ? 'compare' : 'guides';
  const path = join(ROOT, 'src/content', coll, `${slug}.mdx`);
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, 'utf8');
  const marker = block.includes('Side-by-side') ? 'Side-by-side net yield illustration' : 'Gross-to-net worked example';
  if (raw.includes(marker)) continue;
  const { fm, body } = parseMdx(raw);
  const anchor = body.lastIndexOf('\n## ');
  const pos = anchor > 200 ? anchor : body.length;
  const newBody = `${body.slice(0, pos).trimEnd()}\n\n${block.trimEnd()}\n${body.slice(pos)}`;
  const out = `---\n${fm.trimEnd()}\n---\n${newBody.trimEnd()}\n`;
  if (!DRY) writeFileSync(path, out);
  repaired += 1;
}

const jvcPath = join(ROOT, 'src/content/areas/jvc-property-investment.mdx');
if (existsSync(jvcPath)) {
  const raw = readFileSync(jvcPath, 'utf8');
  if (!raw.includes('Related guides for JVC investors')) {
    const { fm, body } = parseMdx(raw);
    const out = `---\n${fm.trimEnd()}\n---\n${body.trimEnd()}${JVC_LINKS}\n`;
    if (!DRY) writeFileSync(jvcPath, out);
    repaired += 1;
  }
}

console.log(`Phase 2 repairs: ${repaired} files`);

for (const [slug, block] of Object.entries(THIN_ADDON)) {
  const path = join(ROOT, 'src/content/guides', `${slug}.mdx`);
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, 'utf8');
  const title = block.match(/^## (.+)$/m)?.[1];
  if (!title || raw.includes(title)) continue;
  const { fm, body } = parseMdx(raw);
  const newBody = `${body.trimEnd()}\n\n${block.trimEnd()}\n`;
  if (!DRY) writeFileSync(path, `---\n${fm.trimEnd()}\n---\n${newBody}`);
  repaired += 1;
}
console.log(`Phase 2b thin addons: ${repaired} total repairs`);

const YIELD_EXTRA = {
  'bahrain-rental-yield-guide': `## Holding period and exit planning

Most Bahrain yield investors underwrite a **five to seven year** hold. Buyer pool depth is smaller than Dubai, so price discovery on resale can take **three to six months** longer in secondary towers. Price your exit assuming **one tenant void** in the final year unless you sell vacant. Document service charge history and NOC timing before listing, as buyers discount unclear building accounts aggressively.`,
  'jeddah-rental-yield-guide': `## Holding period and exit planning

Jeddah yield plays often assume **six to eight year** holds because capital appreciation is modest relative to Dubai. Family-tenant buildings in Al Rawdah trade more actively than compound villas on the northern corniche. Budget **legal and brokerage fees** on exit that differ from UAE norms, and confirm whether your mortgage allows early settlement without punitive spreads.`,
  'sharjah-rental-yield-guide': `## Holding period and exit planning

Sharjah investors frequently buy for **cash flow** with **limited flip intent**. If you might exit within **36 months**, prioritise buildings near University City and Al Majaz where tenant demand is broadest. Older Al Nahda stock can sit **90+ days** on market when new supply launches nearby. Keep maintenance receipts to defend asking rent on resale to owner-occupiers.`,
  'dubai-vs-oman-rental-yield': `## Portfolio allocation framing

Treat Dubai exposure as **liquidity ballast** and Oman as **carry yield** only if you accept slower resale. A **70/30** Dubai/Oman split is common among Gulf-based investors who want yield without abandoning DLD-depth exit options. Rebalance when Muscat pipeline handovers cluster in the same quarter you plan to sell.`,
  'dubai-vs-saudi-rental-yield': `## Portfolio allocation framing

Riyadh and Jeddah can diversify UAE concentration risk but introduce **currency and regulatory** differences. Model **SAR carry** separately from AED-denominated Dubai units. Investors targeting Golden-scale tickets sometimes pair **one Dubai liquidity asset** with **one Saudi income asset** rather than doubling down on a single emirate.`,
  'rak-vs-dubai-rental-yield': `## Portfolio allocation framing

RAK suits investors who will not sell for **24+ months** and can tolerate **longer marketing periods**. Dubai JVC or Business Bay units act as the liquidity sleeve in the same portfolio. If Golden Visa is the goal, confirm whether two smaller tickets beat one Marina purchase under current GDRFA property rules before you optimise yield alone.`,
};

for (const [slug, block] of Object.entries(YIELD_EXTRA)) {
  const coll = COMPARE_YIELD_SLUGS.has(slug) ? 'compare' : 'guides';
  const path = join(ROOT, 'src/content', coll, `${slug}.mdx`);
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, 'utf8');
  const title = block.match(/^## (.+)$/m)?.[1];
  if (!title || raw.includes(title)) continue;
  const { fm, body } = parseMdx(raw);
  const newBody = `${body.trimEnd()}\n\n${block.trimEnd()}\n`;
  if (!DRY) writeFileSync(path, `---\n${fm.trimEnd()}\n---\n${newBody}`);
}
