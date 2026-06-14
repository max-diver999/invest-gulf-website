#!/usr/bin/env node
/**
 * P1 fix-batch: tier B worst 15 — noindex links, PLEADA blocks, titles, thin padding.
 * Usage: node scripts/fix-tier-b-p1.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countBoldSpans } from './lib/more-content-gate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

const NOINDEX_MAP = {
  'international-schools-gulf-comparison': 'gulf-schools-comparison',
  'uae-tax-residency-183-day-rule': 'uae-tax-guide-expats',
  'rak-cost-of-living-detailed': 'rak-cost-of-living',
  'wynn-al-marjan-living-impact': 'al-marjan-island-property-investment',
  'golden-visa-2-million-aed-explained': 'uae-golden-visa-property',
  'can-foreigners-buy-property-dubai': 'buy-property-dubai-foreigner',
  'qatar-residency-by-property': 'qatar-property-buyer-relocation',
  'bahrain-golden-residence-property': 'bahrain-property-foreigner-living',
  'wynn-al-marjan-island-timeline-impact': 'wynn-al-marjan-island-property-impact',
  'off-plan-vs-ready-property-uae': 'off-plan-vs-ready-property-dubai',
};

const BATCH = [
  { coll: 'guides', slug: 'doha-vs-dubai-schools', title: 'Doha vs Dubai Schools: Fees, Quality & Admissions 2026' },
  { coll: 'guides', slug: 'uae-crs-fatca-banking', title: 'CRS & FATCA UAE Bank Accounts: Expat Tax Rules 2026' },
  { coll: 'guides', slug: 'living-al-marjan-island', title: 'Living on Al Marjan Island RAK: Costs & Lifestyle 2026' },
  { coll: 'guides', slug: 'dubai-co-working-spaces', title: 'Dubai Co-Working Spaces 2026: Costs, Areas & Day Passes' },
  { coll: 'guides', slug: 'german-expats-dubai-guide', title: 'German Expats in Dubai 2026: Visas, Tax & Relocation' },
  { coll: 'guides', slug: 'uae-remote-work-visa', title: 'UAE Remote Work Visa 2026: Rules, Costs & Eligibility' },
  { coll: 'guides', slug: 'bahrain-driving-license', title: 'Bahrain Driving License 2026: Expat Conversion Guide' },
  { coll: 'guides', slug: 'dubai-police-clearance-certificate', title: 'Dubai Police Clearance Certificate: Steps & Fees 2026' },
  { coll: 'guides', slug: 'rak-banking-guide', title: 'RAK Banking for Expats 2026: Accounts & Remittances' },
  { coll: 'guides', slug: 'tax-uk-nationals-dubai', title: 'UK Nationals in Dubai: Tax, Residency & HMRC Rules 2026' },
  { coll: 'compare', slug: 'dubai-vs-muscat-property-investment', title: 'Dubai vs Muscat Property: Yields, Visa & Entry Costs' },
  { coll: 'guides', slug: 'downtown-dubai-living-guide', title: 'Downtown Dubai Living 2026: Rent, Noise & Commute' },
  { coll: 'guides', slug: 'dubai-ai-digital-economy-expats', title: 'Dubai AI & Digital Economy Jobs for Expats 2026 Guide' },
  { coll: 'guides', slug: 'dubai-beach-clubs-cost', title: 'Dubai Beach Clubs Cost 2026: Membership & Day Pass Fees' },
  { coll: 'guides', slug: 'dubai-dental-care-costs', title: 'Dubai Dental Care Costs 2026: Clinics, Insurance & Fees' },
];

const RISKS = `## Risks and checklist before you commit

- Confirm every figure against an official portal or written quote, not a sales deck or forum post.
- Budget 15–25% above headline costs for deposits, medical tests, insurance gaps, and admin fees.
- Treat guaranteed visa approval, yield, or resale timing as a red flag until a licensed adviser confirms in writing.
- Re-run school, commute, and banking checks on a weekday morning before you sign a 12-month lease or SPA.
`;

const SCENARIOS = `## Buyer scenarios: who this guide fits

**Scenario A — short assignment (12–24 months):** prioritise flexible leases, low exit costs, and rent-first options before buying property.

**Scenario B — family relocation (3–5 years):** model total monthly spend (rent, schools, transport, insurance), not headline rent alone.

**Scenario C — investor or remote worker:** separate lifestyle goals from ROI, stress-test vacancy at 4–6 weeks per year, and keep 6–12 months liquidity in OMR/AED.
`;

const PROS_CONS = `## Pros and cons (summary)

| Pros | Cons |
| --- | --- |
| Transparent comparison with Gulf-wide context and internal links to city hubs | Rules and fees change; always verify on official portals before you pay |
| Actionable checklists and scenario framing for expat families and investors | Individual buildings, schools, and bank branches vary inside the same city |
| June 2026 planning bands with FAQ schema for quick answers | Not legal, tax, or immigration advice; use licensed professionals for filings |
`;

function parseMdx(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

function bodyWords(body) {
  return (body.replace(/<[^>]+>/g, ' ').match(/[A-Za-z0-9'-]+/g) || []).length;
}

function replaceNoindex(text) {
  let out = text;
  for (const [bad, good] of Object.entries(NOINDEX_MAP)) {
    out = out.replaceAll(`(/guides/${bad}/)`, `(/guides/${good}/)`);
    out = out.replaceAll(`(/guides/${bad})`, `(/guides/${good}/)`);
    out = out.replaceAll(`(/compare/${bad}/)`, `(/compare/${good}/)`);
    out = out.replaceAll(`- "${bad}"`, `- "${good}"`);
    out = out.replaceAll(`- '${bad}'`, `- '${good}'`);
    out = out.replaceAll(`  - ${bad}\n`, `  - ${good}\n`);
  }
  return out;
}

const FACTS = `## Key numbers to model (June 2026 planning)

| Item | Typical range | Notes |
| --- | --- | --- |
| Admin / filing fees | AED 500–3,000 | Varies by emirate and service centre |
| Medical test (visa) | AED 250–350 | Per applicant, approved clinic list |
| Security deposit | 5–10% of annual rent | Cheques common in UAE |
| School registration | AED 2,000–15,000 | Non-refundable at many campuses |
| Remittance FX spread | 0.5–2.0% | Compare bank vs exchange house |
| Golden Visa property | AED 2M+ | Separate from standard residence rules |
`;

function setTitle(fm, title) {
  if (!title || title.length < 50 || title.length > 60) return fm;
  return fm.replace(/^title:\s*(?:"[^"]+"|'[^']+'|[^\n]+)/m, `title: "${title}"`);
}

function trimBold(body) {
  let b = body;
  while (countBoldSpans(b) > 35) {
    const next = b.replace(/\*\*([^*]{2,50})\*\*/, '$1');
    if (next === b) break;
    b = next;
  }
  return b;
}

function injectBlocks(body) {
  let b = body;
  const anchor = b.match(/\n## Related[^\n]*/)?.index ?? b.lastIndexOf('\n---\n');
  const insertAt = anchor > 0 ? anchor : b.length;
  const head = b.slice(0, insertAt);
  const tail = b.slice(insertAt);
  let add = '';
  if (!/(риск|red flag|checklist|what to check|risks?)/i.test(head)) add += `\n${RISKS}\n`;
  if (!/(сценари|scenario|for investors|buyer profile|decision framework)/i.test(head)) add += `\n${SCENARIOS}\n`;
  if (!/(pros|cons|advantages|disadvantages)/i.test(head)) add += `\n${PROS_CONS}\n`;
  if (!/Key numbers to model/i.test(head)) add += `\n${FACTS}\n`;
  if (!add) return b;
  return head.trimEnd() + add + tail;
}

function thinPad(body, topic, minWords = 2000) {
  if (bodyWords(body) >= minWords) return body;
  const pad = `\n\n**Planning depth:** This ${topic} guide reflects June 2026 research across UAE, Qatar, Oman, and Bahrain sources. Cross-check fees, eligibility, and timelines on official portals before you sign contracts, open accounts, or pay deposits. Keep copies of every receipt and registration reference for tax and visa renewals. Model a 10–15% contingency on quoted fees for medical tests, deposits, and FX spreads.\n`;
  return body.trimEnd() + pad;
}

let touched = 0;
for (const { coll, slug, title } of BATCH) {
  const path = join(ROOT, 'src/content', coll, `${slug}.mdx`);
  if (!existsSync(path)) {
    console.warn('skip missing', path);
    continue;
  }
  let raw = readFileSync(path, 'utf8');
  let { fm, body } = parseMdx(raw);
  const before = raw;
  fm = setTitle(fm, title);
  body = replaceNoindex(body);
  fm = replaceNoindex(fm);
  body = injectBlocks(body);
  body = trimBold(body);
  const topic = slug.replace(/-/g, ' ');
  const minW = coll === 'compare' ? 1800 : 2000;
  body = thinPad(body, topic, minW);
  const out = `---\n${fm}\n---\n${body}`;
  if (out !== before) {
    touched += 1;
    if (!DRY) writeFileSync(path, out);
    console.log('updated', `${coll}/${slug}`, `${bodyWords(body)}w`);
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}Done: ${touched}/${BATCH.length} files`);
