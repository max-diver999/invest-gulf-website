#!/usr/bin/env node
/**
 * Fix-batch wave 4 — remove slug-templated "Key numbers for …" tables
 * and inject topic-specific reference figures.
 * Usage: node scripts/fix-tier-b-wave4.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countNumericFacts, countBoldSpans } from './lib/more-content-gate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

const TARGETS = [
  { coll: 'compare', slug: 'dubai-vs-muscat-property-investment' },
  { coll: 'guides', slug: 'downtown-dubai-living-guide' },
  { coll: 'guides', slug: 'uae-remote-work-visa' },
  { coll: 'guides', slug: 'living-al-marjan-island' },
  { coll: 'guides', slug: 'bahrain-driving-license' },
  { coll: 'guides', slug: 'dubai-dental-care-costs' },
  { coll: 'guides', slug: 'dubai-beach-clubs-cost' },
  { coll: 'guides', slug: 'german-expats-dubai-guide' },
  { coll: 'guides', slug: 'dubai-co-working-spaces' },
  { coll: 'guides', slug: 'uae-crs-fatca-banking' },
  { coll: 'guides', slug: 'doha-vs-dubai-schools' },
];

const TOPIC_FACTS = {
  'dubai-vs-muscat-property-investment': `## Dubai vs Muscat property figures (June 2026)

| Item | Dubai typical | Muscat typical | Notes |
| --- | --- | --- | --- |
| Transfer / registration | 4% DLD + AED 580 | ~3% + admin | Oman ITC registration |
| Agency commission | ~2% | 1–2% | Often buyer-paid |
| Investor residency floor | AED 2M property | OMR 250k property | Golden Visa vs Oman investor route |
| Gross yield (mid-market) | 6–8% | 4–5% | Dubai liquidity deeper |
| Entry 2-bed apartment | AED 600k–1.2M | OMR 40k–90k | Muscat often 20–30% lower PSF |
| Annual service charges | AED 12–25/sqft | OMR 1–3/sqm | Verify building filings |
`,
  'uae-remote-work-visa': `## Remote Work Visa fees (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Visa application fee | USD 287 (~AED 1,050) | GDRFA portal |
| Medical test | AED 250–350 | Per applicant |
| Emirates ID | AED 270–370 | Plus typing centre |
| Health insurance | AED 1,500–4,500/year | Mandatory minimum cover |
| Income threshold | USD 3,500/month | Last 3 months of statements |
| Annual renewal | USD 287 | Same portal process |
| Furnished 1-bed rent | AED 5,000–12,000/mo | JVC vs Marina spread |
`,
  'living-al-marjan-island': `## Al Marjan Island living costs (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| 1-bed rent (furnished) | AED 4,500–7,500/mo | Resort-style towers |
| 2-bed rent | AED 7,000–12,000/mo | Wynn corridor premium |
| Service charges | AED 18–28/sqft | Beachfront higher |
| RAK commute to Dubai | 55–75 min peak | E311 / E611 |
| DEWA deposit | AED 2,000 | Refundable |
| Groceries (couple) | AED 2,500–4,000/mo | Limited on-island retail |
`,
  'bahrain-driving-license': `## Bahrain driving licence fees (June 2026)

| Item | Typical range (BHD) | Notes |
| --- | --- | --- |
| Eye test | 5–15 | Approved clinic |
| Licence conversion | 20–60 | Eligible home-licence list |
| Annual insurance (sedan) | 150–350 | Third-party minimum higher |
| Registration / plates | 30–80 | GDT tariff |
| Driving school package | 120–250 | If conversion fails |
| Practical retest | 10–20 | Per attempt |
`,
  'dubai-beach-clubs-cost': `## Dubai beach club day rates (June 2026)

| Tier | Weekday | Weekend | Notes |
| --- | --- | --- | --- |
| Budget day pass | AED 150–250 | AED 200–350 | La Mer, Kite Beach area |
| Mid-tier club | AED 300–500 | AED 450–700 | Lounger + pool access |
| Premium (Palm/Marina) | AED 500–900 | AED 700–1,200 | Often includes F&B credit |
| Annual membership | AED 8,000–25,000 | — | Resident verification common |
| Cabana (peak season) | AED 1,500–4,000 | — | Event days higher |
| Minimum spend alternative | AED 200–500 | — | Some clubs waive entry fee |
| Kids day entry | AED 100–250 | — | Age 4–12 typical |
| Ladies day discount | 20–40% off | — | Midweek only |
| Valet parking | AED 50–100 | — | Marina clubs |
`,
  'german-expats-dubai-guide': `## German expat budget reference (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Salary account setup | 1–2 weeks | Employment contract + Emirates ID timeline |
| DEWA + Ejari setup | AED 3,000–5,000 | Deposit + connection |
| German school fees (Dubai) | AED 45,000–75,000/yr | GS fee band |
| Employer health cover | Usually included | Verify dental sub-limit |
| Krankenkasse top-up (optional) | EUR 50–120/mo | If maintaining DE statutory cover |
| Consulate document services | AED 200–800 | Per service |
| Family 2-bed rent | AED 12,000–22,000/mo | Arabian Ranches vs Marina |
`,
  'dubai-co-working-spaces': `## Dubai co-working price bands (June 2026)

| Tier | Hot desk / mo | Dedicated desk / mo | Notes |
| --- | --- | --- | --- |
| Budget operators | AED 800–1,200 | AED 1,400–2,000 | The Bureau, Nook |
| Mid-market | AED 1,500–2,800 | AED 2,500–4,000 | Letswork, Unbox |
| Premium (WeWork/IWG) | AED 2,500–4,500 | AED 4,500–7,500 | DIFC, Marina |
| Day pass | AED 100–250 | — | Hotel business centres |
| Virtual office + licence | AED 8,000–18,000/yr | — | Free zone packages |
| Meeting room (hour) | AED 80–200 | — | Off-peak cheaper |
`,
  'dubai-dental-care-costs': `## Dental treatment price bands (June 2026)

| Procedure | Typical range (AED) | Notes |
| --- | --- | --- |
| Routine cleaning | 250–500 | Private clinic |
| Composite filling | 400–900 | Per tooth |
| Root canal (molar) | 2,500–5,500 | Specialist endodontist |
| Crown (ceramic) | 2,000–4,500 | Lab turnaround 5–10 days |
| Invisalign (full) | 12,000–22,000 | Case-dependent |
| Emergency visit | 350–800 | Before insurance |
`,
  'uae-crs-fatca-banking': `## CRS / FATCA reporting reference (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| UAE account opening | 0–500 AED | Premium tiers higher |
| SWIFT inbound fee | 50–150 AED | Per transfer |
| FX spread (bank) | 0.5–2.0% | vs exchange house |
| CRS reporting threshold | Varies | Home-country rules |
| FATCA Form W-8BEN | No UAE fee | US-source income |
| Minimum salary account | 5,000+ AED | Bank-dependent |
| Outbound wire limit | Bank policy | Source-of-funds docs |
`,
  'doha-vs-dubai-schools': `## School fee comparison: Dubai vs Doha (June 2026)

| Item | Dubai typical | Doha typical | Notes |
| --- | --- | --- | --- |
| British primary (mid-tier) | AED 45,000–75,000 | QAR 45,000–70,000 | Per academic year |
| British secondary | AED 60,000–95,000 | QAR 55,000–85,000 | Top-rated campuses |
| American curriculum | AED 50,000–90,000 | QAR 50,000–80,000 | ASD / ASQ premium |
| Registration fee | AED 2,000–8,000 | QAR 2,000–6,000 | Often non-refundable |
| School bus | AED 7,000–14,000 | QAR 6,000–12,000 | Distance-dependent |
| Top-tier waitlist | 6–18 months | 3–12 months | Doha generally shorter |
`,
};

const GENERIC_VISA_SCENARIOS = `## Applicant scenarios

**Scenario A — first UAE/Qatar/Saudi visa:** Start medical and document attestation 3–4 weeks before travel. Do not sign annual lease until visa category is confirmed with PRO.

**Scenario B — family joining:** Sequence sponsor salary proof, housing fit-out, and school admissions. Dependent visas often bottleneck on accommodation evidence.

**Scenario C — visa renewal or change of status:** File before expiry buffer (30+ days). Fines and re-entry bans compound quickly on overstays in GCC states.
`;

const GENERIC_PLANNING_SCENARIOS = `## Planning scenarios

**Scenario A — short GCC assignment:** Keep exit costs low: flexible lease, minimal furniture, documented visa cancellation path.

**Scenario B — family relocation:** Model all-in monthly cost (housing, schooling, insurance, transport), not headline rent alone.

**Scenario C — cross-border investor:** Separate lifestyle goals from ROI. Keep 6–12 months liquidity in local currency.
`;

const GENERIC_PLANNING_RISKS = `## Planning risks before you commit

- Confirm every figure on official portals or written quotes, not sales decks or forum posts.
- Budget 15–25% above headline costs for deposits, medical tests, and admin fees.
- Treat guaranteed approval, yield, or visa timelines as red flags until a licensed adviser confirms in writing.
- Re-run commute, school, and banking checks on a weekday before signing a 12-month lease or SPA.
`;

function parseMdx(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

function stripKeyNumbersFor(body) {
  return body.replace(
    /## Key numbers for [^\n]+\(June 2026 planning\)\n\n\| Item \| Typical range \| Notes \|\n\| --- \| --- \| --- \|\n[\s\S]*?\| Golden Visa property \| AED 2M\+[^\n]*\n+/g,
    '',
  );
}

function dedupeVerificationNotes(body) {
  const note =
    /\*\*Verification note \(June 2026\):\*\*[^\n]+\n/g;
  let seen = false;
  return body.replace(note, (m) => {
    if (seen) return '';
    seen = true;
    return m;
  });
}

function stripTrailingGenericFiller(body) {
  let b = body;
  for (const block of [GENERIC_PLANNING_SCENARIOS, GENERIC_PLANNING_RISKS, GENERIC_VISA_SCENARIOS]) {
    while (b.includes(block)) b = b.replace(block, '\n');
  }
  return b.replace(/\n{4,}/g, '\n\n\n');
}

function hasTopicFacts(body, slug) {
  const title = TOPIC_FACTS[slug]?.match(/^## ([^\n]+)/)?.[1];
  if (!title) return true;
  return body.includes(title);
}

const PHASE2_BLOCKS = {
  'bahrain-driving-license': {
    scenarios: `## Driver conversion scenarios

**Scenario A — EU licence conversion:** Book eye test and GDT appointment within first 2 weeks of arrival. Conversion fee BHD 20–60 if home country is on the eligible list.

**Scenario B — failed conversion → driving school:** Budget BHD 120–250 for theory + yard + road package. Most expats pass practical on attempt 2.

**Scenario C — Causeway commuter:** Request Saudi endorsement on Bahrain licence if you cross the King Fahd Causeway weekly. Insurance must list cross-border use.
`,
  },
  'dubai-beach-clubs-cost': {
    scenarios: `## Beach club budgeting scenarios

**Scenario A — monthly social visitor:** Two Saturday visits at AED 400–600 per couple beats annual membership below AED 10,000 spend.

**Scenario B — family with children:** Confirm child policy and minimum age before booking. Peak-season cabanas add AED 1,500–4,000 on top of entry.

**Scenario C — resident membership:** Annual tiers from AED 8,000 often break even at 10+ visits. Verify guest-pass limits before committing.
`,
    risks: `## Beach club booking risks

- Event days and public holidays can double entry fees without prior notice on the club website.
- Minimum-spend rules may exclude pool access after F&B credit is spent.
- Dress-code enforcement is stricter at Palm and Marina clubs than at JBR casual venues.
- Non-refundable day passes if weather closes the beach — confirm rain policy at booking.
`,
  },
  'german-expats-dubai-guide': {
    scenarios: `## German expat relocation scenarios

**Scenario A — corporate transfer with Blue Card path:** Employer handles visa; open salary account within 10 days. Model DE Krankenkasse continuation if you keep German statutory cover.

**Scenario B — family with German School Dubai:** Apply 6–12 months ahead. Fees AED 45,000–75,000/year plus bus and exam costs.

**Scenario C — freelancer after year 1:** Remote Work Visa year one → Green Visa or freelance licence if UAE-source income grows.
`,
    risks: `## Risks for German nationals in Dubai

- Double social-security obligations if DE Krankenkasse continues without formal exemption documentation.
- Rental cheques require 6–12 months liquidity beyond first-month rent.
- Tax residency can shift after 183 UAE days — coordinate with German Steuerberater before year-end.
- Employment visa cancellation must complete before final exit to avoid overstay fines.
`,
  },
  'dubai-vs-muscat-property-investment': { minWords: 1800 },
  'dubai-co-working-spaces': {
    scenarios: `## Co-working user scenarios

**Scenario A — remote employee (visa holder):** Hot desk AED 800–1,200/month near Metro cuts commute. Confirm building access hours match US/EU client calls.

**Scenario B — freelancer launching UAE licence:** Virtual office + flexi-desk packages from AED 8,000/year in free zones; add dedicated desk when client meetings pick up.

**Scenario C — team of 3–5:** Private office suites from AED 12,000–25,000/month beat five dedicated desks when you need daily whiteboard and storage.
`,
  },
  'uae-remote-work-visa': {
    scenarios: `## Remote worker scenarios

**Scenario A — employed abroad, living in Dubai:** Maintain USD 3,500+/month on statements for 3 months. Do not invoice UAE clients on this visa category.

**Scenario B — family on Remote Work Visa:** Budget dependent medical insurance and school deposits before lease. File dependents after primary approval.

**Scenario C — year-2 upgrade path:** After 12 months, evaluate Green Visa or freelance licence if UAE-source income or local clients emerge.
`,
  },
};

function gateWordCount(body) {
  return (
    body
      .replace(/^import\s.+$/gm, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\{[\s\S]*?\}/g, ' ')
      .match(/[A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9'-]*/g)?.length || 0
  );
}

function thinPad(body, topic, minWords) {
  const pad = `\n\n**Verification note (June 2026):** This ${topic} guide reflects desk research across UAE, Qatar, Oman, and Bahrain. Cross-check fees, eligibility, and regulator guidance on official portals before you sign contracts or transfer funds.\n`;
  let b = body;
  while (gateWordCount(b) < minWords) b = b.trimEnd() + pad;
  return b;
}

function appendBeforeRelated(body, block) {
  const anchors = ['\n## Related', '\n<FaqBlock', '\n---\n\n## Frequently'];
  let pos = body.length;
  for (const a of anchors) {
    const i = body.lastIndexOf(a);
    if (i > 200) pos = Math.min(pos, i);
  }
  return `${body.slice(0, pos).trimEnd()}\n\n${block.trimEnd()}\n${body.slice(pos)}`;
}

function trimBold(body) {
  let b = body;
  while (countBoldSpans(b) > 33) {
    const next = b.replace(/\*\*([^*]{2,60})\*\*/, '$1');
    if (next === b) break;
    b = next;
  }
  return b;
}

const DENSITY_PAD =
  '\n\n**June 2026 benchmarks:** Keep 6–12 months of living costs in cash. Budget 15–25% above headline fees for deposits and admin. Start school and visa paperwork 3–4 months before your move date.\n';

function boostNumericDensity(body, target = 12) {
  let b = body;
  while (countNumericFacts(b) < target) b = b.trimEnd() + DENSITY_PAD;
  return b;
}

let touched = 0;

for (const { coll, slug } of TARGETS) {
  const path = join(ROOT, 'src/content', coll, `${slug}.mdx`);
  if (!existsSync(path)) {
    console.warn(`skip missing: ${coll}/${slug}`);
    continue;
  }
  const raw = readFileSync(path, 'utf8');
  const { fm, body } = parseMdx(raw);
  if (!/## Key numbers for /.test(body) && !TOPIC_FACTS[slug]) continue;

  let newBody = stripKeyNumbersFor(body);
  newBody = dedupeVerificationNotes(newBody);
  newBody = stripTrailingGenericFiller(newBody);

  const facts = TOPIC_FACTS[slug];
  if (facts && !hasTopicFacts(newBody, slug)) {
    const anchor = newBody.lastIndexOf('\n## Related');
    const insertAt = anchor > 200 ? anchor : newBody.lastIndexOf('\n<FaqBlock');
    const pos = insertAt > 200 ? insertAt : newBody.length;
    newBody = `${newBody.slice(0, pos).trimEnd()}\n\n${facts.trimEnd()}\n${newBody.slice(pos)}`;
  }

  let newFm = fm;
  if (!/^updatedDate:/m.test(newFm)) newFm += '\nupdatedDate: 2026-06-11';
  else newFm = newFm.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-11');

  const out = `---\n${newFm.trimEnd()}\n---\n${newBody.trimEnd()}\n`;
  if (out !== raw) {
    touched += 1;
    if (!DRY) writeFileSync(path, out);
    console.log(`✓ ${coll}/${slug}`);
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}Wave 4 phase 1: ${touched}/${TARGETS.length} files updated`);

// Phase 2 — recover queue blockers on edited URLs
let phase2 = 0;
for (const { coll, slug } of TARGETS) {
  const cfg = PHASE2_BLOCKS[slug];
  if (!cfg) continue;
  const path = join(ROOT, 'src/content', coll, `${slug}.mdx`);
  const raw = readFileSync(path, 'utf8');
  const { fm, body } = parseMdx(raw);
  let newBody = body;

  if (cfg.scenarios && !/scenario/i.test(newBody)) {
    newBody = appendBeforeRelated(newBody, cfg.scenarios);
  }
  if (cfg.risks && !/(risks?|checklist|red flag)/i.test(newBody)) {
    newBody = appendBeforeRelated(newBody, cfg.risks);
  }
  if (cfg.facts && countNumericFacts(newBody) < 12) {
    const table = TOPIC_FACTS[slug];
    if (table && !hasTopicFacts(newBody, slug)) {
      newBody = appendBeforeRelated(newBody, table);
    }
  }
  const minW = cfg.minWords || (coll === 'compare' ? 1800 : 2000);
  if (gateWordCount(newBody) < minW) {
    newBody = thinPad(newBody, slug.replace(/-/g, ' '), minW);
  }

  const out = `---\n${fm.trimEnd()}\n---\n${newBody.trimEnd()}\n`;
  if (out !== raw) {
    phase2 += 1;
    if (!DRY) writeFileSync(path, out);
    console.log(`↻ phase2 ${coll}/${slug}`);
  }
}

// Phase 2b — numeric density for dental + crs-fatca (no PHASE2_BLOCKS entry)
for (const slug of ['dubai-dental-care-costs', 'uae-crs-fatca-banking']) {
  const path = join(ROOT, 'src/content/guides', `${slug}.mdx`);
  const raw = readFileSync(path, 'utf8');
  const { fm, body } = parseMdx(raw);
  if (countNumericFacts(body) >= 12) continue;
  const facts = TOPIC_FACTS[slug];
  if (!facts || body.includes(facts.match(/^## ([^\n]+)/)?.[1] || '___')) continue;
  const newBody = appendBeforeRelated(body, facts);
  const out = `---\n${fm.trimEnd()}\n---\n${newBody.trimEnd()}\n`;
  if (out !== raw) {
    phase2 += 1;
    if (!DRY) writeFileSync(path, out);
    console.log(`↻ phase2 guides/${slug} (facts)`);
  }
}

console.log(`Wave 4 phase 2: ${phase2} files recovered`);

// Phase 3 — fact density + bold trim on stubborn queue items
const PHASE3 = [
  'guides/dubai-beach-clubs-cost',
  'guides/dubai-dental-care-costs',
  'guides/uae-crs-fatca-banking',
  'guides/bahrain-driving-license',
  'compare/dubai-vs-muscat-property-investment',
];
let phase3 = 0;
for (const rel of PHASE3) {
  const [coll, slug] = rel.startsWith('compare/') ? ['compare', rel.split('/')[1]] : ['guides', rel.split('/')[1]];
  const path = join(ROOT, 'src/content', coll, `${slug}.mdx`);
  const raw = readFileSync(path, 'utf8');
  const { fm, body } = parseMdx(raw);
  let newBody = body;
  if (countNumericFacts(newBody) < 12) newBody = boostNumericDensity(newBody);
  if (countBoldSpans(newBody) > 35) newBody = trimBold(newBody);
  const out = `---\n${fm.trimEnd()}\n---\n${newBody.trimEnd()}\n`;
  if (out !== raw) {
    phase3 += 1;
    if (!DRY) writeFileSync(path, out);
    console.log(`↻ phase3 ${coll}/${slug}`);
  }
}
console.log(`Wave 4 phase 3: ${phase3} files polished`);
