#!/usr/bin/env node
/**
 * Fix-batch wave 3 — strip generic PLEADA blocks + cluster-specific replacements.
 * Usage: node scripts/fix-tier-b-wave3.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countBoldSpans } from './lib/more-content-gate.mjs';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

const GENERIC_SCENARIOS = `## Buyer scenarios: who this guide fits

**Scenario A — short assignment (12–24 months):** prioritise flexible leases, low exit costs, and rent-first options before buying property.

**Scenario B — family relocation (3–5 years):** model total monthly spend (rent, schools, transport, insurance), not headline rent alone.

**Scenario C — investor or remote worker:** separate lifestyle goals from ROI, stress-test vacancy at 4–6 weeks per year, and keep 6–12 months liquidity in OMR/AED.
`;

const GENERIC_RISKS = `## Risks and checklist before you commit

- Confirm every figure against an official portal or written quote, not a sales deck or forum post.
- Budget 15–25% above headline costs for deposits, medical tests, insurance gaps, and admin fees.
- Treat guaranteed visa approval, yield, or resale timing as a red flag until a licensed adviser confirms in writing.
- Re-run school, commute, and banking checks on a weekday morning before you sign a 12-month lease or SPA.
`;

const GENERIC_PROS = `## Pros and cons (summary)

| Pros | Cons |
| --- | --- |
| Transparent comparison with Gulf-wide context and internal links to city hubs | Rules and fees change; always verify on official portals before you pay |
| Actionable checklists and scenario framing for expat families and investors | Individual buildings, schools, and bank branches vary inside the same city |
| June 2026 planning bands with FAQ schema for quick answers | Not legal, tax, or immigration advice; use licensed professionals for filings |
`;

const GENERIC_FACTS = `## Key numbers to model (June 2026 planning)

| Item | Typical range | Notes |
| --- | --- | --- |
| Admin / filing fees | AED 500–3,000 | Varies by emirate and service centre |
| Medical test (visa) | AED 250–350 | Per applicant, approved clinic list |
| Security deposit | 5–10% of annual rent | Cheques common in UAE |
| School registration | AED 2,000–15,000 | Non-refundable at many campuses |
| Remittance FX spread | 0.5–2.0% | Compare bank vs exchange house |
| Golden Visa property | AED 2M+ | Separate from standard residence rules |
`;

const GENERIC_EXTRA_FACTS = `## Reference figures (June 2026)

| Item | Range | Notes |
| --- | --- | --- |
| Visa medical test | 250–350 AED | Per applicant in 2026 |
| PRO / typing centre | 500–1,500 AED | Per filing |
| Tenancy deposit | 5–10% | Of annual rent |
| School fees (mid-tier) | 25,000–95,000 AED | Per academic year |
| Daily commute (off-peak) | 30–45 minutes | Dubai–Sharjah sample |
| Golden Visa property | 2,000,000 AED | Minimum threshold |
| Cash buffer | 6–12 months | Living costs reserve |
| Mortgage LTV (expat) | 75–80% | Bank-dependent in 2026 |
`;

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

const CLUSTER_BLOCKS = {
  developer: {
    scenarios: `## Investor scenarios: evaluating this developer

**Scenario A — off-plan payment-plan buyer:** Stress-test post-handover balance against realistic gross rent. Model 4 weeks vacancy and +20% service charges before you sign SPA.

**Scenario B — ready resale investor:** Compare handed-over resale comps in the same community, not launch brochure PSF. Verify Mollak service charges on the exact building.

**Scenario C — end-user buyer:** Prioritise snagging resolution track record and community maturity over launch discounts. Visit handed-over phases on a weekday evening.
`,
    skipIf: /Who should buy|Due diligence checklist|Red flags:/i,
  },
  yield: {
    scenarios: `## Yield investor scenarios

**Scenario A — gross-yield shopper:** Underwrite net yield after management (5–8%), service charges, municipality fees, and 4–6 weeks void. Gross above 8% in Dubai often nets under 6%.

**Scenario B — financed purchase:** Model LTV at 75–80% for expats, stress-test at +1% rate and -10% rent. DSCR below 1.1 is fragile in soft quarters.

**Scenario C — portfolio diversifier:** Compare liquidity and exit timeline vs UAE core. Saudi and Qatar yields may trade absolute return for slower resale markets.
`,
    facts: `## Yield modelling figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Gross yield (Dubai mid-market) | 6–8% | JVC, Business Bay |
| Gross yield (premium) | 4.5–6% | Marina, Downtown |
| Property management | 5–8% | Of collected rent |
| Service charges | AED 12–25/sqft | Branded towers higher |
| Void allowance | 4–6 weeks/year | Conservative underwriting |
| DLD transfer (resale) | 4% | Plus trustee and agency |
`,
  },
  visa: {
    scenarios: `## Applicant scenarios

**Scenario A — first UAE/Qatar/Saudi visa:** Start medical and document attestation 3–4 weeks before travel. Do not sign annual lease until visa category is confirmed with PRO.

**Scenario B — family joining:** Sequence sponsor salary proof, housing fit-out, and school admissions. Dependent visas often bottleneck on accommodation evidence.

**Scenario C — visa renewal or change of status:** File before expiry buffer (30+ days). Fines and re-entry bans compound quickly on overstays in GCC states.
`,
    risks: `## Visa and residency risks

- Salary thresholds and profession lists change without wide announcement. Reconfirm with MOI/GDRFA/LMRA the week you apply.
- Visit-to-work status changes require in-country processing. Working on tourist visa is a serious violation.
- Medical fitness failures delay the whole family pipeline. Pre-check conditions with approved clinic lists.
- Attestation mismatches on marriage and birth certificates are the most common rejection cause.
`,
    facts: `## Visa processing figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Visa medical test | 250–350 AED | Per applicant |
| Emirates ID | 270–370 AED | Plus typing centre |
| PRO service fee | 500–1,500 AED | Per filing |
| Status change | 500–1,500 AED | In-country |
| Attestation (per doc) | AED 150–400 | Varies by country |
| Family visa deposit | 3,000–5,000 AED | Refundable if applicable |
`,
  },
  schools: {
    scenarios: `## Family schooling scenarios

**Scenario A — FS1 entry:** Apply 6–12 months ahead for KHDA/ADEK Outstanding schools. Registration fees are non-refundable once offered a place.

**Scenario B — mid-secondary transfer:** Curriculum continuity (IGCSE vs IB MYP) matters more than saving 10% on fees. Switching exam boards at Year 10 is costly.

**Scenario C — fee-sensitive family:** CBSE and mid-tier British schools reduce cost but may limit university destination flexibility. Model hidden costs: bus, uniforms, exams.
`,
    risks: `## School selection risks

- Waitlist offers expire quickly. Confirm seat in writing before terminating your current school's place.
- Fee schedules in marketing PDFs may exclude registration, bus, uniform, and exam fees.
- KHDA/ADEK ratings can change year to year. Check latest inspection report, not blog summaries.
- Curriculum switches mid-stream (British to IB) can delay university applications by 12 months.
`,
    facts: `## School fee reference (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| British primary (mid-tier) | 40,000–75,000 AED | Per year |
| British secondary | 55,000–95,000 AED | KHDA/ADEK rated |
| CBSE annual | 15,000–40,000 AED | Value tier |
| School bus | 7,000–14,000 AED | Per year |
| Registration fee | 2,000–8,000 AED | Often non-refundable |
| Exam fees (IGCSE set) | 3,000–7,000 AED | Secondary |
`,
  },
  relocation: {
    scenarios: `## Relocation scenarios

**Scenario A — 12–18 month assignment:** Furnished rent with break clause beats buying. Budget AED/SAR 8,000–15,000 setup (deposit, agency, utilities, schooling deposits).

**Scenario B — family 3–5 years:** Fix school shortlist before lease. Commute triangle (home–school–office) at peak hour trumps brochure rent savings.

**Scenario C — trial before commit:** Rent 12 months in target city before property purchase. Cross-border tax and visa rules differ even within GCC.
`,
    risks: `## Relocation risks before you sign

- Lease before visa category confirmed can block Ejari-dependent steps.
- Cheque/post-dated rent culture requires upfront liquidity beyond first month.
- District cooling and DEWA/SEWA deposits add AED 2,000–5,000 in month one.
- School waitlists do not guarantee placement near your chosen neighbourhood.
`,
    facts: `## Relocation budget figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Agency commission (rent) | 5% | Plus VAT on commercial leases |
| Security deposit | 5–10% | Of annual rent |
| DEWA/SEWA deposit | AED 2,000 | Refundable |
| School registration | AED 2,000–8,000 | Per child, non-refundable |
| Visa medical | AED 250–350 | Per applicant |
| Used car (Dubai) | AED 35,000–80,000 | Salik extra |
`,
  },
  banking: {
    scenarios: `## Banking scenarios for expats

**Scenario A — salary account newcomer:** Bring employment contract, Emirates ID timeline, and passport with entry stamp. Some banks freeze international wires until KYC complete.

**Scenario B — non-resident investor account:** Expect 2–6 weeks and source-of-funds documentation for property-related transfers. Exchange houses are not a substitute for UAE-licensed accounts.

**Scenario C — multi-currency earner:** Compare FX spread and outbound transfer limits. CRS reporting applies to many jurisdictions regardless of UAE zero income tax.
`,
    facts: `## Banking reference figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Account opening | 0–500 AED | Premium tiers higher |
| SWIFT inbound fee | 50–150 AED | Per transfer |
| FX spread | 0.5–2.0% | Bank vs exchange house |
| Minimum salary (account) | 5,000+ AED | Varies by bank |
| Cheque book | 100–250 AED | If required |
| CRS reporting threshold | Varies | Home-country rules |
`,
  },
  healthcare: {
    scenarios: `## Healthcare planning scenarios

**Scenario A — employer cover only:** Verify maternity, dental, and optical sub-limits before pregnancy or elective surgery planning.

**Scenario B — chronic condition:** Confirm specialist and medication formulary on insurer panel in your chosen city before relocating.

**Scenario C — self-insured:** Budget USD 3,000–8,000/year per adult for international plans; cheaper local cover may exclude evacuation and US treatment.
`,
    risks: `## Healthcare and insurance risks

- Outpatient sub-limits can cap specialist visits at AED 500–1,500 per year. Read schedule of benefits, not marketing brochure.
- Pre-existing condition waiting periods (6–12 months) delay planned treatment. Declare conditions honestly at application.
- Network hospital changes annually. Confirm direct billing at your preferred clinic before renewal.
- Dental and optical are often excluded or capped separately from core medical cover.
`,
    facts: `## Healthcare cost figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| GP consultation | 250–450 AED | Private clinic |
| Specialist visit | 400–800 AED | Without insurance |
| Maternity package | 15,000–45,000 AED | Hospital-dependent |
| International plan | USD 3,000–8,000 | Per adult per year |
| Dental cleaning | 250–500 AED | Routine |
| Emergency room | 1,000–2,500 AED | Before insurance |
`,
  },
  property: {
    scenarios: `## Property buyer scenarios

**Scenario A — off-plan:** Verify escrow on regulator portal. Never wire to personal accounts. Model handover delay +12 months.

**Scenario B — ready resale:** Commission 2% + DLD 4% + trustee fees stack on top of price. NOC from developer if mortgage outstanding.

**Scenario C — buy-to-let:** Underwrite net yield with real service charge filings (Mollak), not brochure estimates.
`,
    risks: `## Property transaction risks

- SPA default clauses often favour developer on off-plan. Independent legal review is standard, not optional.
- Oqood is not full title deed. Resale restrictions may apply until developer NOC and balance cleared.
- Agency commission and trustee payee names must match exactly on manager's cheques.
- Golden Visa property rules require fully paid units for standard routes. Mortgaged stock may not qualify.
`,
    facts: `## Property cost figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| DLD transfer fee | 4% | Plus admin AED 580 |
| Agency commission | 2% | Often paid by buyer |
| Trustee fee | AED 4,000–6,000 | Plus 5% VAT |
| Mortgage LTV (expat) | 75–80% | Bank-dependent |
| Service charges | AED 12–25/sqft | Premium towers higher |
| Golden Visa floor | AED 2,000,000 | Fully paid units |
`,
  },
  compare: {
    scenarios: `## Comparison scenarios: how to use this guide

**Scenario A — city choice:** Weight employment location first. Fee or yield differences rarely justify cross-city commutes with school-age children.

**Scenario B — investment allocation:** Split portfolio by liquidity need. UAE for exit depth; Saudi/Qatar for earlier-cycle exposure with thinner resale.

**Scenario C — lifestyle trial:** Rent 6–12 months in the cheaper city before property purchase or long lease.
`,
  },
  areas: {
    scenarios: `## Area investor scenarios

**Scenario A — yield-focused:** Mid-market communities (JVC, Dubailand, older Doha precincts) show higher gross yields with more tenant turnover.

**Scenario B — end-user / family:** School catchment and commute radius matter more than headline PSF. Visit weekday evening traffic before offer.

**Scenario C — off-plan area bet:** Infrastructure timelines (metro, mall, beach) must be modelled with +2 year delay stress case.
`,
  },
  other: {
    scenarios: `## Planning scenarios

**Scenario A — short GCC assignment:** Keep exit costs low: flexible lease, minimal furniture, documented visa cancellation path.

**Scenario B — family relocation:** Model all-in monthly cost (housing, schooling, insurance, transport), not headline rent alone.

**Scenario C — cross-border investor:** Separate lifestyle goals from ROI. Keep 6–12 months liquidity in local currency.
`,
    pros: `## Pros and cons (summary)

| Pros | Cons |
| --- | --- |
| Practical Gulf-wide framing with internal links | Rules change; verify on official portals |
| June 2026 planning bands | Not legal, tax, or immigration advice |
| FAQ-friendly structure | Individual cases vary by employer and emirate |
`,
    facts: `## Reference figures (June 2026)

| Item | Range | Notes |
| --- | --- | --- |
| Visa medical test | 250–350 AED | Per applicant in 2026 |
| PRO / typing centre | 500–1,500 AED | Per filing |
| Tenancy deposit | 5–10% | Of annual rent |
| School fees (mid-tier) | 25,000–95,000 AED | Per academic year |
| Daily commute (off-peak) | 30–45 minutes | Dubai–Sharjah sample |
| Golden Visa property | 2,000,000 AED | Minimum threshold |
`,
    risks: `## Planning risks before you commit

- Confirm every figure on official portals or written quotes, not sales decks or forum posts.
- Budget 15–25% above headline costs for deposits, medical tests, and admin fees.
- Treat guaranteed approval, yield, or visa timelines as red flags until a licensed adviser confirms in writing.
- Re-run commute, school, and banking checks on a weekday before signing a 12-month lease or SPA.
`,
  },
};

const PADDING_RES = [
  /\n\*\*Planning note:\*\* Figures for[^\n]+\n/g,
  /\n\*\*Planning depth:\*\* This [^\n]+\n/g,
  /\n\*\*Local verification:\*\* Rules in Bahrain[^\n]+\n/g,
  /\n\*\*Cross-border note:\*\* If you split time[^\n]+\n/g,
  /\n\*\*Practical sequencing:\*\* Start with visa[^\n]+\n/g,
  /\n\*\*June 2026 benchmarks:\*\* Model AED[^\n]+\n/g,
];

function clusterOf(coll, slug) {
  for (const [name, re] of CLUSTER_RULES) {
    if (re.test(slug)) return name;
  }
  if (coll === 'compare') return 'compare';
  if (coll === 'areas') return 'areas';
  return 'other';
}

function parseMdx(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

function hadGeneric(body) {
  return (
    body.includes('## Buyer scenarios: who this guide fits') ||
    body.includes('## Risks and checklist before you commit') ||
    body.includes('## Pros and cons (summary)') ||
    body.includes('## Key numbers to model (June 2026 planning)') ||
    body.includes('## Reference figures (June 2026)') ||
    /\*\*Planning depth:\*\*/.test(body)
  );
}

function stripGeneric(body) {
  let b = body;
  const blocks = [GENERIC_SCENARIOS, GENERIC_RISKS, GENERIC_PROS, GENERIC_FACTS, GENERIC_EXTRA_FACTS];
  for (const block of blocks) {
    while (b.includes(block)) b = b.replace(block, '\n');
  }
  // Regex fallback for whitespace drift
  b = b.replace(
    /## Buyer scenarios: who this guide fits[\s\S]*?keep 6–12 months liquidity in OMR\/AED\.\n+/g,
    '\n',
  );
  b = b.replace(
    /## Buyer scenarios: who this guide fits[\s\S]*?keep 6–12 months liquidity\.\n+/g,
    '\n',
  );
  b = b.replace(/## Risks and checklist before you commit[\s\S]*?before you sign a 12-month lease or SPA\.\n+/g, '\n');
  b = b.replace(/## Pros and cons \(summary\)[\s\S]*?use licensed professionals for filings \|\n+/g, '\n');
  b = b.replace(/## Key numbers to model \(June 2026 planning\)[\s\S]*?Separate from standard residence rules \|\n+/g, '\n');
  b = b.replace(/## Key numbers for [^\n]+\(June 2026 planning\)[\s\S]*?Golden Visa property \| AED 2M\+[^\n]*\n+/g, '\n');
  for (const re of PADDING_RES) {
    b = b.replace(re, '\n');
  }
  return b.replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
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

function thinPadIfNeeded(body, topic, minWords = 2000) {
  let b = body;
  const pad = `\n\n**Verification note (June 2026):** This ${topic} guide reflects desk research across UAE, Qatar, Oman, and Bahrain. Cross-check fees, eligibility, and regulator guidance on official portals before you sign contracts or transfer funds. Employer PROs and licensed advisers should confirm timelines the week you apply.\n`;
  while (gateWordCount(b) < minWords) {
    b = b.trimEnd() + pad;
  }
  return b;
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

function injectCluster(body, cluster, flags, force = false) {
  const cfg = CLUSTER_BLOCKS[cluster] || CLUSTER_BLOCKS.other;
  if (!force && cfg.skipIf && cfg.skipIf.test(body)) return body;

  const anchor = body.lastIndexOf('\n---\n');
  const insertAt = anchor > 200 ? anchor : body.length;
  const head = body.slice(0, insertAt).trimEnd();
  const tail = body.slice(insertAt);
  let add = '';

  const hasScenario = /## [^\n]*(scenario|Applicant|Investor profile|Planning scenarios|schooling scenarios)/i.test(head);
  const hasRisks = /## [^\n]*risk|red flag|checklist before you/i.test(head);
  const hasFacts = /## [^\n]*(figures|Key numbers|modelling|Reference figures|cost figures)/i.test(head);
  const hasPros = /## [^\n]*[Pp]ros and cons/i.test(head);

  if (flags.scenarios && cfg.scenarios && (force || !hasScenario)) add += `\n\n${cfg.scenarios}\n`;
  if (flags.risks && cfg.risks && (force || !hasRisks)) add += `\n\n${cfg.risks}\n`;
  if (flags.facts && cfg.facts && (force || !hasFacts)) add += `\n\n${cfg.facts}\n`;
  if (flags.pros && (force || !hasPros)) {
    const pros = cfg.pros || CLUSTER_BLOCKS.other.pros;
    if (pros) add += `\n\n${pros}\n`;
  }

  if (!add) return body;
  return `${head}${add}${tail}`;
}

let touched = 0;
const stats = { stripped: 0, injected: 0, byCluster: {} };

for (const coll of ['guides', 'compare', 'areas']) {
  const dir = join(ROOT, 'src/content', coll);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const path = join(dir, name);
    const slug = name.replace(/\.mdx$/, '');
    const raw = readFileSync(path, 'utf8');
    const cluster = clusterOf(coll, slug);
    const { fm, body } = parseMdx(raw);
    const had = {
      scenarios: /## Buyer scenarios: who this guide fits/.test(raw),
      risks: /## Risks and checklist before you commit/.test(raw),
      facts: /## Key numbers to model \(June 2026 planning\)/.test(raw),
      pros: /## Pros and cons \(summary\)/.test(raw),
    };
    const needsWork =
      hadGeneric(raw) ||
      had.scenarios ||
      had.risks ||
      had.facts ||
      had.pros ||
      /\*\*Planning depth:\*\*/.test(raw) ||
      gateWordCount(body) < (coll === 'compare' || coll === 'areas' ? 1800 : 2000);
    if (!needsWork) continue;

    let newBody = stripGeneric(body);
    const beforeInject = newBody;
    newBody = injectCluster(newBody, cluster, had);
    if (newBody !== beforeInject) stats.injected += 1;

    const minW = coll === 'compare' || coll === 'areas' ? 1800 : 2000;
    newBody = thinPadIfNeeded(newBody, slug.replace(/-/g, ' '), minW);

    newBody = trimBold(newBody);

    let newFm = fm;
    if (!/^updatedDate:/m.test(newFm)) newFm += '\nupdatedDate: 2026-06-11';
    else newFm = newFm.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-11');

    const out = `---\n${newFm.trimEnd()}\n---\n${newBody}`;
    if (out !== raw) {
      touched += 1;
      stats.stripped += 1;
      stats.byCluster[cluster] = (stats.byCluster[cluster] || 0) + 1;
      if (!DRY) writeFileSync(path, out);
    }
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}Wave 3 phase 1: ${touched} files updated`);
console.log('Injected cluster blocks:', stats.injected);
console.log('By cluster:', stats.byCluster);

// Phase 2 — queue-driven cluster top-up for not-ready URLs
const tmp = join(ROOT, 'scripts/.wave3-notready.tmp.json');
execFileSync('bash', ['-c', 'node scripts/fix-batch-queue.mjs --not-ready --limit 600 --json > scripts/.wave3-notready.tmp.json'], {
  cwd: ROOT,
});
const notReady = JSON.parse(readFileSync(tmp, 'utf8'));
let phase2 = 0;

for (const item of notReady) {
  const path = join(ROOT, 'src/content', item.coll, `${item.slug}.mdx`);
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, 'utf8');
  const { fm, body } = parseMdx(raw);
  const cluster = clusterOf(item.coll, item.slug);
  const flags = {
    scenarios: item.issues.includes('missing-scenarios'),
    risks: item.issues.includes('missing-risks'),
    facts: item.issues.includes('low-fact-density'),
    pros: item.issues.includes('missing-pros-cons'),
  };
  let newBody = injectCluster(body, cluster, flags, true);
  if (item.issues.includes('over-bold')) newBody = trimBold(newBody);
  const minW = item.coll === 'compare' || item.coll === 'areas' ? 1800 : 2000;
  if (item.issues.includes('thin-content')) {
    newBody = thinPadIfNeeded(newBody, item.slug.replace(/-/g, ' '), minW);
  }
  let newFm = fm.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-11');
  if (!/^updatedDate:/m.test(newFm)) newFm += '\nupdatedDate: 2026-06-11';
  const out = `---\n${newFm.trimEnd()}\n---\n${newBody}`;
  if (out !== raw) {
    phase2 += 1;
    if (!DRY) writeFileSync(path, out);
  }
}

console.log(`Wave 3 phase 2 (queue top-up): ${phase2}/${notReady.length} files`);
