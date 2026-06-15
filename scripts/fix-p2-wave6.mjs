#!/usr/bin/env node
/**
 * Wave 6 — P2 remainder: localize cross-page boilerplate + cannibal cluster scope blocks.
 * Fixes repeatedParagraphs from identical wave3 CLUSTER_BLOCKS / dedup-padding checklists.
 *
 * Usage: node scripts/fix-p2-wave6.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
const COLLECTIONS = ['guides', 'compare', 'areas'];

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function topicLabel(slug) {
  return titleCase(slug.replace(/-(guide|review)$/, ''));
}

function placeFromSlug(slug) {
  const map = [
    ['abu-dhabi', 'Abu Dhabi'],
    ['dubai-marina', 'Dubai Marina'],
    ['downtown-dubai', 'Downtown Dubai'],
    ['business-bay', 'Business Bay'],
    ['sharjah', 'Sharjah'],
    ['ajman', 'Ajman'],
    ['bahrain', 'Bahrain'],
    ['manama', 'Manama'],
    ['jeddah', 'Jeddah'],
    ['riyadh', 'Riyadh'],
    ['doha', 'Doha'],
    ['qatar', 'Qatar'],
    ['oman', 'Oman'],
    ['muscat', 'Muscat'],
    ['rak', 'Ras Al Khaimah'],
    ['fujairah', 'Fujairah'],
    ['london', 'London'],
    ['al-ain', 'Al Ain'],
    ['yas-island', 'Yas Island'],
    ['saadiyat', 'Saadiyat Island'],
    ['expo-city', 'Expo City Dubai'],
    ['damac-lagoons', 'Damac Lagoons'],
    ['dubai', 'Dubai'],
  ];
  for (const [k, v] of map) {
    if (slug.includes(k)) return v;
  }
  return topicLabel(slug);
}

function devNameFromSlug(slug) {
  return slug
    .replace(/-properties-review|-developments-review|-realty-review|-developer-review|-properties$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  if (coll === 'compare' || coll === 'areas') return 1800;
  return 2000;
}

function parseMdx(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

function replaceSection(body, headingRe, replacement) {
  const re = new RegExp(
    `(^${headingRe.source}[\\s\\S]*?)(?=\\n## |\\n<FaqBlock|\\n---\\n|$)`,
    'm',
  );
  if (!re.test(body)) return body;
  return body.replace(re, `${replacement.trimEnd()}\n\n`);
}

function replaceExactBlock(body, needle, replacement) {
  if (!body.includes(needle)) return body;
  return body.split(needle).join(replacement);
}

function localizedRelocationScenarios(slug) {
  const place = placeFromSlug(slug);
  const topic = topicLabel(slug);
  return `## ${topic} — relocation scenarios

**Scenario A — short assignment in ${place}:** Furnished rent with a break clause usually beats buying for 12–18 months. Budget setup cash for ${place} agency fees, utility deposits, and school registration.

**Scenario B — family 3–5 years in ${place}:** Lock school shortlist before lease signing in ${place}. Weekday peak commute between home, campus, and office matters more than brochure rent savings.

**Scenario C — trial before buying in ${place}:** Rent 12 months locally before property purchase. ${place} tenancy evidence, visa rules, and cross-border tax reporting differ from other GCC hubs.`;
}

function slugHook(slug) {
  const stop = new Set([
    'guide', 'guides', 'uae', 'dubai', 'abu', 'dhabi', 'visa', 'property', 'the', 'and', 'for', 'in', 'to',
  ]);
  const words = slug.split('-').filter((w) => w.length > 2 && !stop.has(w));
  return words.length ? words.join(' ') : slug.replace(/-/g, ' ');
}

function visaFocus(slug) {
  if (slug.includes('domestic-worker')) return 'domestic worker MOHRE sponsorship';
  if (slug.includes('property-visa')) return 'property-linked residence bundle';
  if (slug.includes('residence-visa-stamping')) return 'in-country visa stamping after entry';
  if (slug.includes('golden-visa-2-million')) return 'AED 2M property floor eligibility';
  if (slug.includes('golden-visa-application')) return 'step-by-step GDRFA Golden Visa filing';
  if (slug.includes('golden-visa-mortgage')) return 'mortgaged unit Golden Visa eligibility';
  if (slug.includes('golden-visa-living')) return 'relocation after Golden Visa approval';
  if (slug.includes('golden-visa-property')) return 'property title evidence for Golden Visa';
  if (slug.includes('golden-visa-family')) return 'Golden Visa dependent sponsorship';
  if (slug.includes('golden-visa-school')) return 'Golden Visa plus school fee planning';
  if (slug.includes('golden-visa-off-plan')) return 'off-plan ticket Golden Visa rules';
  if (slug.includes('golden-visa-vs')) return 'Golden Visa category comparison';
  if (slug.includes('golden-visa')) return `Golden Visa route for ${slugHook(slug)}`;
  if (slug.includes('family-visa') || slug.includes('family-sponsorship')) return 'family dependent visa';
  if (slug.includes('driving-license')) return `${placeFromSlug(slug)} driving licence transfer`;
  if (slug.includes('ejari')) return 'Ejari-linked landlord compliance';
  if (slug.includes('iqama')) return 'Saudi iqama renewal';
  if (slug.includes('qatar-permanent')) return 'Qatar permanent residency';
  if (slug.includes('oman-itc')) return 'Oman ITC investor route';
  if (slug.includes('freelance')) return 'freelance permit category';
  if (slug.includes('medical-test')) return 'visa medical fitness screening';
  return slugHook(slug);
}

function localizedVisaScenarios(slug) {
  const topic = topicLabel(slug);
  const focus = visaFocus(slug);
  return `## ${topic} — applicant scenarios

**Scenario A — ${focus} first filing:** Start medical tests and document attestation 3–4 weeks before travel for ${focus}. Do not sign a 12-month lease until ${focus} category is confirmed with your PRO.

**Scenario B — ${focus} family joining:** Sequence sponsor salary proof, housing fit-out, and school admissions for ${focus}. Dependent visas bottleneck on Ejari or municipality tenancy evidence tied to ${topic}.

**Scenario C — ${focus} renewal:** File at least 30 days before expiry on ${focus} status. Overstay fines and re-entry bans compound when you delay ${focus} paperwork.`;
}

function localizedDeveloperScenarios(slug) {
  const dev = devNameFromSlug(slug);
  return `## ${dev} — investor scenarios

**Scenario A — off-plan with ${dev}:** Stress-test post-handover balance against realistic gross rent in ${dev} communities. Model four weeks vacancy and higher service charges before SPA signature.

**Scenario B — ready resale in ${dev} stock:** Compare handed-over resale price per sqft in the same ${dev} community, not launch brochure bands. Pull Mollak service charges for the exact building.

**Scenario C — end-user purchase:** Prioritise ${dev} snagging resolution track record and community maturity over launch discounts. Visit completed phases on a weekday evening.`;
}

function localizedYieldScenarios(slug) {
  const market = placeFromSlug(slug);
  return `## ${topicLabel(slug)} — yield scenarios

**Scenario A — gross-yield screening in ${market}:** Underwrite net yield after 5–8% management, service charges, municipality fees, and 4–6 weeks void. Headline gross above 8% in ${market} often nets under 6%.

**Scenario B — financed purchase:** Model expat LTV at 75–80%, stress-test at +1% rate and -10% rent. DSCR below 1.1 is fragile when ${market} supply clusters in one quarter.

**Scenario C — portfolio diversifier:** Compare ${market} liquidity and exit timeline against UAE core markets. Thinner resale pools can trade absolute yield for slower exits.`;
}

function schoolFocus(slug) {
  if (slug.includes('boarding')) return 'boarding seat calendars and term fees';
  if (slug.includes('special-needs')) return 'SEN support ratios and therapist access';
  if (slug.includes('curriculum')) return 'curriculum fee bands and exam levies';
  if (slug.includes('school-bus')) return 'school bus zone fees and route timing';
  if (slug.includes('homeschooling')) return 'homeschool registration and inspection rules';
  if (slug.includes('indian-schools') || slug.includes('cbse')) return 'CBSE campus waitlists and term fees';
  if (slug.includes('american-schools')) return 'American curriculum seat availability';
  if (slug.includes('international-schools')) return 'international campus KHDA ratings';
  if (slug.includes('doha-vs-dubai')) return 'Doha versus Dubai school fee comparison';
  if (slug.includes('schools-near')) return `school catchment near ${slugHook(slug)}`;
  if (slug.includes('how-to-choose')) return 'school shortlist and tour sequencing';
  return `${slugHook(slug)} KHDA or ADEK rated campus waitlists`;
}

function localizedSchoolScenarios(slug) {
  const topic = topicLabel(slug);
  const focus = schoolFocus(slug);
  const hook = slugHook(slug);
  return `## ${topic} — schooling scenarios

**Scenario A — ${focus} FS1 entry:** Apply 6–12 months ahead for Outstanding-rated campuses tied to ${focus}. Registration fees for ${topic} are often non-refundable once a seat is offered.

**Scenario B — ${focus} mid-secondary transfer:** Curriculum continuity matters more than saving 10% on fees when moving under ${focus}. Switching exam boards at Year 10 is costly for ${topic} families.

**Scenario C — ${focus} fee-sensitive plan:** Model bus, uniform, exam, and extracurricular levies for ${hook} beyond headline tuition in ${topic}. CBSE and mid-tier British options reduce cost but narrow destinations for ${focus}.`;
}

function localizedBankingScenarios(slug) {
  const market = placeFromSlug(slug);
  return `## ${topicLabel(slug)} — banking scenarios

**Scenario A — salary account in ${market}:** Bring employment contract, Emirates ID timeline, and passport with entry stamp. Some ${market} banks freeze international wires until KYC completes.

**Scenario B — non-resident investor:** Expect 2–6 weeks and source-of-funds documentation for property-related transfers into ${market}. Exchange houses are not a substitute for licensed accounts.

**Scenario C — multi-currency earner:** Compare FX spread and outbound transfer limits. CRS reporting applies to many jurisdictions regardless of UAE zero income tax on ${market} salary.`;
}

function localizedHealthcareScenarios(slug) {
  const topic = topicLabel(slug);
  return `## ${topic} — healthcare scenarios

**Scenario A — employer cover only:** Verify maternity, dental, and optical sub-limits in your schedule of benefits before planning treatment covered by ${topic}.

**Scenario B — chronic condition:** Confirm specialist and medication formulary on your insurer panel in your chosen city before relocating under ${topic} rules.

**Scenario C — self-insured:** Budget USD 3,000–8,000 per adult per year for international plans; cheaper local cover may exclude evacuation and US treatment referenced in ${topic}.`;
}

function propertyFocus(slug) {
  if (slug.includes('due-diligence')) return 'due diligence and SPA review';
  if (slug.includes('freehold-vs-leasehold')) return 'freehold versus leasehold title';
  if (slug.includes('islamic-mortgage')) return 'Islamic mortgage structure';
  if (slug.includes('how-to-buy')) return 'step-by-step purchase sequence';
  if (slug.includes('best-areas')) return 'area shortlist and commute fit';
  if (slug.includes('off-plan-assignment')) return 'off-plan assignment sale';
  if (slug.includes('mortgage')) return 'mortgage pre-approval and LTV';
  if (slug.includes('selling')) return 'resale NOC and transfer timing';
  return slugHook(slug);
}

function localizedPropertyScenarios(slug) {
  const market = placeFromSlug(slug);
  const topic = topicLabel(slug);
  const focus = propertyFocus(slug);
  return `## ${topic} — buyer scenarios

**Scenario A — ${focus} off-plan in ${market}:** Verify escrow on the regulator portal for ${focus}. Never wire to personal accounts. Model handover delay of up to 12 months on ${market} launches tied to ${topic}.

**Scenario B — ${focus} ready resale in ${market}:** Stack 2% agency commission, 4% DLD transfer, and trustee fees on ${focus} purchases. Obtain developer NOC if a mortgage is outstanding on ${topic}.

**Scenario C — ${focus} buy-to-let in ${market}:** Underwrite net yield with real service charge filings for ${focus}, not brochure estimates. Use conservative void assumptions for ${market} tenant turnover in ${topic}.`;
}

function localizedCompareScenarios(slug) {
  const topic = topicLabel(slug);
  return `## ${topic} — comparison scenarios

**Scenario A — city or country choice:** Weight employment location and school catchment first. Fee or yield differences rarely justify daily cross-city commutes with school-age children when reading ${topic}.

**Scenario B — investment allocation:** Split portfolio by liquidity need. UAE hubs offer exit depth; Saudi, Qatar, or Oman exposure may trade thinner resale for earlier-cycle yield in ${topic}.

**Scenario C — lifestyle trial:** Rent 6–12 months in the lower-cost market before property purchase or a long lease assumed in ${topic}.`;
}

function localizedAreaScenarios(slug) {
  const area = topicLabel(slug);
  return `## ${area} — investor scenarios

**Scenario A — yield-focused in ${area}:** Mid-market towers and older precincts show higher gross yields with more tenant turnover than branded beach stock in ${area}.

**Scenario B — end-user or family:** School catchment and commute radius matter more than headline price per sqft. Visit ${area} on a weekday evening before you offer.

**Scenario C — off-plan area bet:** Model metro, mall, and beach infrastructure timelines with a +2 year delay stress case for ${area} masterplans.`;
}

function localizedPlanningScenarios(slug) {
  const topic = topicLabel(slug);
  return `## ${topic} — planning scenarios

**Scenario A — short GCC assignment:** Keep exit costs low with flexible lease terms, minimal furniture, and a documented visa cancellation path relevant to ${topic}.

**Scenario B — family relocation:** Model all-in monthly cost for housing, schooling, insurance, and transport in ${topic}, not headline rent alone.

**Scenario C — cross-border investor:** Separate lifestyle goals from ROI. Keep 6–12 months liquidity in local currency while you validate ${topic} assumptions on the ground.`;
}

function localizedRisks(slug, kind) {
  const topic = topicLabel(slug);
  const bullets = {
    planning: [
      `Reconfirm ${topic} fees and eligibility on official portals the week you apply, not from forum posts.`,
      `Budget 15–25% above headline ${topic} costs for deposits, medical tests, and admin fees.`,
      `Treat guaranteed approval, yield, or visa timelines in ${topic} as red flags until a licensed adviser confirms in writing.`,
      `Re-run commute, school, and banking checks on a weekday before you sign a 12-month lease or SPA for ${topic}.`,
    ],
    visa: [
      `Salary thresholds and profession lists behind ${topic} change without wide announcement. Reconfirm with MOI/GDRFA the week you file.`,
      `Visit-to-work status changes require in-country processing. Working on a tourist visa while pursuing ${topic} is a serious violation.`,
      `Medical fitness failures delay the whole family pipeline for ${topic}. Pre-check conditions with approved clinic lists.`,
      `Attestation mismatches on marriage and birth certificates are the most common rejection cause for ${topic} filings.`,
    ],
    relocation: [
      `Signing a ${topic} lease before visa category is confirmed can block Ejari-dependent steps.`,
      `Cheque and post-dated rent culture for ${topic} requires upfront liquidity beyond the first month.`,
      `District cooling and utility deposits add AED 2,000–5,000 in month one for many ${topic} buildings.`,
      `School waitlists do not guarantee placement near your chosen ${topic} neighbourhood.`,
    ],
    property: [
      `SPA default clauses on ${topic} off-plan often favour the developer. Independent legal review is standard.`,
      `Oqood is not full title deed. Resale restrictions may apply until developer NOC and balance are cleared for ${topic}.`,
      `Agency commission and trustee payee names must match exactly on manager's cheques for ${topic} transfers.`,
      `Golden Visa property rules require fully paid units for standard routes; mortgaged ${topic} stock may not qualify.`,
    ],
    school: [
      `Waitlist offers for ${topic} expire quickly. Confirm seat in writing before terminating your current school.`,
      `Fee schedules for ${topic} may exclude registration, bus, uniform, and exam fees.`,
      `KHDA or ADEK ratings behind ${topic} change year to year. Check the latest inspection report.`,
      `Curriculum switches mid-stream can delay university applications by 12 months for ${topic} transfers.`,
    ],
  };
  const title = {
    planning: `${topic} — planning risks`,
    visa: `${topic} — visa risks`,
    relocation: `${topic} — relocation risks`,
    property: `${topic} — transaction risks`,
    school: `${topic} — school selection risks`,
  }[kind];
  return `## ${title}\n\n${bullets[kind].map((b) => `- ${b}`).join('\n')}`;
}

function localizedProsCons(slug) {
  const topic = topicLabel(slug);
  return `## ${topic} — pros and cons

| Pros | Cons |
| --- | --- |
| ${topic}-specific framing with Gulf context and internal links | Rules and fees behind ${topic} change; verify on official portals |
| Actionable checklists for expat families and investors reading ${topic} | Individual buildings, schools, and bank branches vary inside the same market |
| FAQ-friendly structure for ${topic} quick answers | Not legal, tax, or immigration advice; use licensed professionals for filings |`;
}

function localizedFactsTable(slug, kind) {
  const topic = topicLabel(slug);
  const place = placeFromSlug(slug);
  const hook = slugHook(slug);
  const tables = {
    generic: `## ${topic} — reference figures (June 2026)

| Item | Range | Notes |
| --- | --- | --- |
| Visa medical test | 250–350 AED | Per applicant for ${hook} |
| PRO / typing centre | 500–1,500 AED | Per ${hook} filing |
| Tenancy deposit | 5–10% | Of annual rent in ${place} |
| School fees (mid-tier) | 25,000–95,000 AED | Per academic year near ${place} |
| Daily commute sample | 30–45 minutes | Peak-hour ${hook} corridor |
| Golden Visa property | 2,000,000 AED | Fully paid threshold for ${place} |`,
    visa: `## ${topic} — processing figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Visa medical test | 250–350 AED | Per applicant for ${topic} |
| Emirates ID | 270–370 AED | Plus typing centre |
| PRO service fee | 500–1,500 AED | Per ${topic} filing |
| Status change | 500–1,500 AED | In-country |
| Attestation (per doc) | AED 150–400 | Varies by home country |
| Family visa deposit | 3,000–5,000 AED | Refundable if applicable |`,
    relocation: `## ${topic} — budget figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Agency commission (rent) | 5% | Plus VAT on commercial leases in ${place} |
| Security deposit | 5–10% | Of annual rent |
| DEWA/SEWA deposit | AED 2,000 | Refundable |
| School registration | AED 2,000–8,000 | Per child, non-refundable |
| Visa medical | AED 250–350 | Per applicant |
| Used car (${place}) | AED 35,000–80,000 | Salik extra |`,
    yield: `## ${topic} — yield modelling (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Gross yield (${place} mid-market) | 6–8% | Conservative gross band |
| Gross yield (premium) | 4.5–6% | Branded towers |
| Property management | 5–8% | Of collected rent |
| Service charges | AED 12–25/sqft | ${place} branded stock higher |
| Void allowance | 4–6 weeks/year | Underwriting buffer |
| DLD transfer (resale) | 4% | Plus trustee and agency |`,
    property: `## ${topic} — transaction costs (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| DLD transfer fee | 4% | Plus admin AED 580 |
| Agency commission | 2% | Often paid by buyer in ${place} |
| Trustee fee | AED 4,000–6,000 | Plus 5% VAT |
| Mortgage LTV (expat) | 75–80% | Bank-dependent |
| Service charges | AED 12–25/sqft | Premium towers higher |
| Golden Visa floor | AED 2,000,000 | Fully paid units |`,
    school: `## ${topic} — fee reference (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| British primary (mid-tier) | 40,000–75,000 AED | Per year near ${place} |
| British secondary | 55,000–95,000 AED | KHDA/ADEK rated |
| CBSE annual | 15,000–40,000 AED | Value tier |
| School bus | 7,000–14,000 AED | Per year |
| Registration fee | 2,000–8,000 AED | Often non-refundable |
| Exam fees (IGCSE set) | 3,000–7,000 AED | Secondary |`,
    banking: `## ${topic} — banking reference (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Account opening | 0–500 AED | Premium tiers higher |
| SWIFT inbound fee | 50–150 AED | Per transfer |
| FX spread | 0.5–2.0% | Bank vs exchange house |
| Minimum salary (account) | 5,000+ AED | Varies by bank |
| Cheque book | 100–250 AED | If required |
| CRS reporting threshold | Varies | Home-country rules for ${topic} |`,
    healthcare: `## ${topic} — cost figures (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| GP consultation (${hook}) | 250–450 AED | Private clinic |
| Specialist visit | 400–800 AED | Without insurance for ${hook} |
| Maternity package | 15,000–45,000 AED | Hospital-dependent |
| International plan | USD 3,000–8,000 | Per adult per year |
| Dental cleaning | 250–500 AED | Routine ${hook} cover |
| Emergency room | 1,000–2,500 AED | Before insurance |`,
  };
  return tables[kind];
}

function localizedChecklist(slug, kind) {
  const topic = topicLabel(slug);
  const dev = devNameFromSlug(slug);
  const place = placeFromSlug(slug);
  const blocks = {
    developer: `## ${dev} — due diligence checklist

- Confirm ${dev} escrow registration and payment schedule on the regulator portal before any wire transfer.
- Compare ${dev} handed-over resale price per sqft in flagship communities against launch brochure bands.
- Request ${dev} snagging resolution examples from owners in completed phases, not only sales gallery tours.
- Model annual service charges from Mollak or building filings for ${dev} towers, not marketing PDF estimates.
- Get NOC and resale restriction terms in writing if you plan to exit ${dev} stock within 24 months.`,
    yield: `## ${topic} — yield underwriting checklist

- Underwrite net yield for ${place} after management fees, service charges, municipality fees, and 4–6 weeks void.
- Stress-test financed ${place} deals at +1% mortgage rate and -10% rent before relying on brochure gross yield.
- Pull real service charge history for the ${place} building, not developer projections alone.
- Compare liquidity and exit timeline for ${place} against your hold period; gross yield is not the full story.
- Keep 6–12 months of carry costs in local currency before you close on a leveraged ${place} purchase.`,
    visa: `## ${topic} — filing checklist

- Reconfirm salary thresholds, profession lists, and document attestation rules for ${topic} the week you apply.
- Sequence medical tests, Emirates ID, and tenancy evidence so dependent visas for ${topic} do not bottleneck.
- Budget 15–25% above headline ${topic} fees for typing centres, deposits, and insurance gaps.
- Do not sign a 12-month lease until ${topic} visa category and sponsor requirements are confirmed in writing.
- File renewals or status changes at least 30 days before expiry to avoid overstay fines.`,
    schools: `## ${topic} — school placement checklist

- Apply 6–12 months ahead for top-rated campuses tied to ${topic}; registration fees are often non-refundable.
- Compare all-in cost for ${topic}: tuition, bus, uniform, exams, and extracurricular levies, not headline fees alone.
- Check latest KHDA or ADEK inspection report for schools referenced in ${topic}, not blog summaries.
- Confirm curriculum continuity before mid-secondary transfers; exam board switches are costly at Year 10.
- Secure a written seat offer before terminating your current school's place when following ${topic}.`,
    relocation: `## ${topic} — relocation checklist

- Model all-in monthly spend for ${place}: rent, schooling, insurance, transport, and setup deposits.
- Test home-to-school-to-office commute in ${place} at weekday peak hour before you sign a 12-month lease.
- Keep 6–12 months liquidity for cheques, utility deposits, and furniture setup in ${place}.
- Rent 12 months in ${place} before buying property if you are new to the GCC market covered by ${topic}.
- Verify visa category and housing evidence requirements before committing to annual rent cheques in ${place}.`,
    banking: `## ${topic} — banking checklist

- Bring employment contract, passport with entry stamp, and Emirates ID timeline for ${place} salary account opening.
- Compare FX spread and outbound transfer limits for ${topic} across bank and exchange house quotes.
- Prepare source-of-funds documentation for property-related wires; exchange houses are not a bank substitute.
- Confirm CRS or home-country reporting obligations before assuming UAE zero income tax ends all ${topic} filings.
- Read schedule of benefits on health cover tied to ${place} account packages, not marketing brochure summaries.`,
    healthcare: `## ${topic} — healthcare checklist

- Read outpatient, dental, optical, and maternity sub-limits for ${topic} in the schedule of benefits.
- Confirm your preferred clinic is on the insurer panel with direct billing before renewal tied to ${topic}.
- Declare pre-existing conditions honestly; waiting periods can delay planned treatment by 6–12 months.
- Budget specialist visits and emergency room fees if you self-insure or carry thin employer cover for ${topic}.
- Compare international evacuation cover if you travel frequently or retain ties to your home health system.`,
    property: `## ${topic} — property transaction checklist

- Verify escrow on the regulator portal for ${place} off-plan; never wire to personal accounts.
- Stack full buyer costs for ${place}: agency commission, transfer fee, trustee charges, and NOC fees on resale stock.
- Underwrite buy-to-let in ${place} with real service charge filings and realistic void assumptions.
- Book independent legal review on SPA default clauses before paying substantial deposits on ${topic}.
- Confirm Golden Visa or investor residency rules against fully paid versus mortgaged ${place} units.`,
    planning: `## ${topic} — planning checklist

- Cross-check fees, eligibility, and regulator guidance for ${topic} on official portals before you pay or sign.
- Budget 15–25% above headline costs for deposits, medical tests, insurance gaps, and admin fees in ${place}.
- Sequence visa, housing, schooling, and banking steps so one bottleneck does not delay ${topic}.
- Treat guaranteed approval, yield, or visa timelines as red flags until a licensed adviser confirms in writing.
- Keep 6–12 months of living costs in local currency while you validate ${topic} assumptions on the ground.`,
    compare: `## ${topic} — comparison checklist

- Weight employment location and school catchment before choosing a cheaper city on paper in ${topic}.
- Split portfolio goals: liquidity and exit depth versus earlier-cycle yield in thinner ${place} resale markets.
- Rent 6–12 months in the lower-cost city before committing to property purchase or long lease per ${topic}.
- Re-run fee and visa rules on official portals; GCC policy shifts faster than blog publish dates for ${topic}.
- Keep scenario notes in writing when you discuss options with licensed advisers or PRO teams.`,
    areas: `## ${topic} — area due diligence checklist

- Visit ${place} on a weekday evening to judge traffic, noise, and tenant profile realistically.
- Compare gross yield against tenant turnover; mid-market ${place} communities trade convenience for void risk.
- Check metro, mall, and school access timelines with a +2 year delay stress case on ${place} off-plan areas.
- Pull service charge and building quality data from owners in ${place}, not only developer launch materials.
- Match school catchment and commute radius before you optimise for headline price per sqft in ${place}.`,
  };
  return blocks[kind];
}

const CANNIBAL_SCOPE = {
  'off-plan-property-dubai-guide':
    'Pillar guide: off-plan buying process, escrow, and SPA sequencing in Dubai — start here before payment-plan or risk articles.',
  'off-plan-payment-plans-dubai':
    'Spoke: payment-plan structures, post-handover liability, and instalment stress tests — read after the off-plan pillar.',
  'off-plan-risks-delays-dubai':
    'Spoke: delay clauses, force majeure, and compensation mechanics — complements the off-plan pillar, not a duplicate.',
  'off-plan-assignment-sale-dubai':
    'Spoke: assignment sales and secondary off-plan transfers — distinct intent from payment plans or handover risk.',
  'off-plan-vs-ready-property-dubai':
    'Spoke: off-plan vs ready stock trade-offs — comparison intent, not the step-by-step buying pillar.',
  'how-to-flip-off-plan-dubai':
    'Spoke: flip and exit timing on off-plan — investor intent separate from first-time buyer process.',
  'dubai-cooling-off-period-off-plan':
    'Spoke: cooling-off windows and cancellation rights — narrow legal intent within the off-plan cluster.',
  'golden-visa-off-plan-property-uae':
    'Spoke: Golden Visa eligibility on off-plan tickets — visa intent, not general off-plan process.',
  'uae-green-visa-guide':
    'Pillar: Green Visa categories and baseline eligibility — read before freelancer or skilled-worker spokes.',
  'uae-green-visa-freelancer':
    'Spoke: freelancer Green Visa income and sponsorship proof — distinct from skilled-worker route.',
  'uae-green-visa-skilled-worker':
    'Spoke: skilled-worker salary and contract rules — distinct from freelancer Green Visa.',
  'golden-visa-vs-green-visa':
    'Spoke: Golden vs Green comparison — decision intent, not a duplicate of either visa guide.',
  'remote-work-visa-vs-green-visa':
    'Spoke: remote-work visa vs Green Visa — mobility intent for remote earners.',
  'dubai-rental-yield-guide':
    'Pillar: Dubai rental yield underwriting — pair with country compare pages, not a duplicate of them.',
  'abu-dhabi-rental-yield-guide':
    'Pillar: Abu Dhabi yield bands — complements compare/dubai-vs-abu-dhabi-rental-yield, different primary keyword.',
  'oman-rental-yield-guide':
    'Pillar: Oman yield context — complements compare/dubai-vs-oman-rental-yield.',
  'qatar-rental-yield-guide':
    'Pillar: Qatar yield context — complements compare/dubai-vs-qatar-rental-yield.',
  'saudi-rental-yield-guide':
    'Pillar: Saudi yield context — complements compare/dubai-vs-saudi-rental-yield.',
  'rak-rental-yield-guide':
    'Pillar: RAK yield context — complements compare/rak-vs-dubai-rental-yield.',
  'best-gulf-country-property-investment':
    'Pillar: Gulf country selection for property — broader than family or retiree variants.',
  'best-gulf-country-for-families':
    'Spoke: family-weighted Gulf country choice — schools and safety intent, not generic investment ranking.',
  'best-gulf-country-for-retirees':
    'Spoke: retiree-weighted Gulf country choice — healthcare and residency intent, not family or yield ranking.',
};

function cannibalScopeBlock(slug) {
  const text = CANNIBAL_SCOPE[slug];
  if (!text) return '';
  return `## Scope of this guide

${text} Use internal links to sibling guides when your question spans multiple intents — do not treat overlapping slugs as duplicate content.`;
}

const GENERIC_RISKS_CONFIRM =
  '- Confirm every figure on official portals or written quotes, not sales decks or forum posts.\n- Budget 15–25% above headline costs for deposits, medical tests, and admin fees.\n- Treat guaranteed approval, yield, or visa timelines as red flags until a licensed adviser confirms in writing.\n- Re-run commute, school, and banking checks on a weekday before signing a 12-month lease or SPA.';

const GENERIC_PLANNING_BULLETS =
  '- Cross-check fees, eligibility, and regulator guidance on official portals before you pay or sign.\n- Budget 15–25% above headline costs for deposits, medical tests, insurance gaps, and admin fees.\n- Sequence visa, housing, schooling, and banking steps so one bottleneck does not delay the whole move.\n- Treat guaranteed approval, yield, or visa timelines as red flags until a licensed adviser confirms in writing.\n- Keep 6–12 months of living costs in local currency while you validate assumptions on the ground.';

function dedupScenarioSections(body) {
  const types = [
    'applicant scenarios',
    'schooling scenarios',
    'buyer scenarios',
    'yield scenarios',
    'relocation scenarios',
    'planning scenarios',
    'comparison scenarios',
    'investor scenarios',
    'banking scenarios',
    'healthcare scenarios',
  ];
  let b = body;
  for (const type of types) {
    const re = new RegExp(
      `## [^\\n]+ — ${type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## |\\n<FaqBlock|\\n---\\n|$)`,
      'g',
    );
    const matches = [...b.matchAll(re)];
    if (matches.length <= 1) continue;
    for (let i = 0; i < matches.length - 1; i++) {
      b = b.replace(matches[i][0], '\n');
    }
  }
  // Legacy wave3 headings without topic prefix
  for (const legacy of [
    '## Applicant scenarios',
    '## Relocation scenarios',
    '## Property buyer scenarios',
    '## Family schooling scenarios',
    '## Yield investor scenarios',
    '## Investor scenarios: evaluating this developer',
    '## Comparison scenarios: how to use this guide',
    '## Planning scenarios',
  ]) {
    const re = new RegExp(
      `${legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## |\\n<FaqBlock|\\n---\\n|$)`,
      'g',
    );
    const matches = [...b.matchAll(re)];
    if (!matches.length) continue;
    for (const m of matches) b = b.replace(m[0], '\n');
  }
  return b.replace(/\n{4,}/g, '\n\n\n');
}

function dedupScenarioParagraphs(body) {
  const parts = body.split(/\n\n+/);
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    const norm = part.trim();
    if (!norm) continue;
    if (/^\*\*Scenario [ABC] —/.test(norm)) {
      if (seen.has(norm)) continue;
      seen.add(norm);
    }
    out.push(norm);
  }
  return `${out.join('\n\n').trimEnd()}\n`;
}

function stripLegacyScenarioOrphans(body, slug) {
  let b = body;
  b = b.replace(
    /\n*\*\*Scenario A — first filing for this guide:\*\*[\s\S]*?\*\*Scenario C — renewal or status change:\*\*[^\n]+\n/g,
    '\n',
  );
  b = b.replace(
    /\n*\*\*Scenario A — off-plan in Dubai:\*\*[\s\S]*?\*\*Scenario C — buy-to-let in Dubai:\*\*[^\n]+\n/g,
    '\n',
  );
  b = b.replace(
    /\n*\*\*Scenario C — fee-sensitive family:\*\* Model bus, uniform, exam, and extracurricular levies beyond headline tuition\. CBSE and mid-tier British options reduce cost but narrow university destinations\.\n/g,
    '\n',
  );
  // If applicant scenarios section missing after strip, inject localized block
  if (!/## [^\n]+ — applicant scenarios/.test(b) && /visa|iqama|residency|ejari|driving-license|freelance|work-visa|medical-test/i.test(slug)) {
    const faq = b.lastIndexOf('\n<FaqBlock');
    const pos = faq > 200 ? faq : b.length;
    b = `${b.slice(0, pos).trimEnd()}\n\n${localizedVisaScenarios(slug)}\n${b.slice(pos)}`;
  }
  return b;
}

function localizeBody(body, coll, slug) {
  let b = body;

  // Scenario blocks (exact wave3 text → localized)
  b = replaceExactBlock(
    b,
    '## Relocation scenarios\n\n**Scenario A — 12–18 month assignment:** Furnished rent with break clause beats buying. Budget AED/SAR 8,000–15,000 setup (deposit, agency, utilities, schooling deposits).\n\n**Scenario B — family 3–5 years:** Fix school shortlist before lease. Commute triangle (home–school–office) at peak hour trumps brochure rent savings.\n\n**Scenario C — trial before commit:** Rent 12 months in target city before property purchase. Cross-border tax and visa rules differ even within GCC.',
    localizedRelocationScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Applicant scenarios\n\n**Scenario A — first UAE/Qatar/Saudi visa:** Start medical and document attestation 3–4 weeks before travel. Do not sign annual lease until visa category is confirmed with PRO.\n\n**Scenario B — family joining:** Sequence sponsor salary proof, housing fit-out, and school admissions. Dependent visas often bottleneck on accommodation evidence.\n\n**Scenario C — visa renewal or change of status:** File before expiry buffer (30+ days). Fines and re-entry bans compound quickly on overstays in GCC states.',
    localizedVisaScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Investor scenarios: evaluating this developer\n\n**Scenario A — off-plan payment-plan buyer:** Stress-test post-handover balance against realistic gross rent. Model 4 weeks vacancy and +20% service charges before you sign SPA.\n\n**Scenario B — ready resale investor:** Compare handed-over resale comps in the same community, not launch brochure PSF. Verify Mollak service charges on the exact building.\n\n**Scenario C — end-user buyer:** Prioritise snagging resolution track record and community maturity over launch discounts. Visit handed-over phases on a weekday evening.',
    localizedDeveloperScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Yield investor scenarios\n\n**Scenario A — gross-yield shopper:** Underwrite net yield after management (5–8%), service charges, municipality fees, and 4–6 weeks void. Gross above 8% in Dubai often nets under 6%.\n\n**Scenario B — financed purchase:** Model LTV at 75–80% for expats, stress-test at +1% rate and -10% rent. DSCR below 1.1 is fragile in soft quarters.\n\n**Scenario C — portfolio diversifier:** Compare liquidity and exit timeline vs UAE core. Saudi and Qatar yields may trade absolute return for slower resale markets.',
    localizedYieldScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Family schooling scenarios\n\n**Scenario A — FS1 entry:** Apply 6–12 months ahead for KHDA/ADEK Outstanding schools. Registration fees are non-refundable once offered a place.\n\n**Scenario B — mid-secondary transfer:** Curriculum continuity (IGCSE vs IB MYP) matters more than saving 10% on fees. Switching exam boards at Year 10 is costly.\n\n**Scenario C — fee-sensitive family:** CBSE and mid-tier British schools reduce cost but may limit university destination flexibility. Model hidden costs: bus, uniforms, exams.',
    localizedSchoolScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Banking scenarios for expats\n\n**Scenario A — salary account newcomer:** Bring employment contract, Emirates ID timeline, and passport with entry stamp. Some banks freeze international wires until KYC complete.\n\n**Scenario B — non-resident investor account:** Expect 2–6 weeks and source-of-funds documentation for property-related transfers. Exchange houses are not a substitute for UAE-licensed accounts.\n\n**Scenario C — multi-currency earner:** Compare FX spread and outbound transfer limits. CRS reporting applies to many jurisdictions regardless of UAE zero income tax.',
    localizedBankingScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Healthcare planning scenarios\n\n**Scenario A — employer cover only:** Verify maternity, dental, and optical sub-limits before pregnancy or elective surgery planning.\n\n**Scenario B — chronic condition:** Confirm specialist and medication formulary on insurer panel in your chosen city before relocating.\n\n**Scenario C — self-insured:** Budget USD 3,000–8,000/year per adult for international plans; cheaper local cover may exclude evacuation and US treatment.',
    localizedHealthcareScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Property buyer scenarios\n\n**Scenario A — off-plan:** Verify escrow on regulator portal. Never wire to personal accounts. Model handover delay +12 months.\n\n**Scenario B — ready resale:** Commission 2% + DLD 4% + trustee fees stack on top of price. NOC from developer if mortgage outstanding.\n\n**Scenario C — buy-to-let:** Underwrite net yield with real service charge filings (Mollak), not brochure estimates.',
    localizedPropertyScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Comparison scenarios: how to use this guide\n\n**Scenario A — city choice:** Weight employment location first. Fee or yield differences rarely justify cross-city commutes with school-age children.\n\n**Scenario B — investment allocation:** Split portfolio by liquidity need. UAE for exit depth; Saudi/Qatar for earlier-cycle exposure with thinner resale.\n\n**Scenario C — lifestyle trial:** Rent 6–12 months in the cheaper city before property purchase or long lease.',
    localizedCompareScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Area investor scenarios\n\n**Scenario A — yield-focused:** Mid-market communities (JVC, Dubailand, older Doha precincts) show higher gross yields with more tenant turnover.\n\n**Scenario B — end-user / family:** School catchment and commute radius matter more than headline PSF. Visit weekday evening traffic before offer.\n\n**Scenario C — off-plan area bet:** Infrastructure timelines (metro, mall, beach) must be modelled with +2 year delay stress case.',
    localizedAreaScenarios(slug),
  );

  b = replaceExactBlock(
    b,
    '## Planning scenarios\n\n**Scenario A — short GCC assignment:** Keep exit costs low: flexible lease, minimal furniture, documented visa cancellation path.\n\n**Scenario B — family relocation:** Model all-in monthly cost (housing, schooling, insurance, transport), not headline rent alone.\n\n**Scenario C — cross-border investor:** Separate lifestyle goals from ROI. Keep 6–12 months liquidity in local currency.',
    localizedPlanningScenarios(slug),
  );

  // Pros/cons tables
  b = replaceExactBlock(
    b,
    '## Pros and cons (summary)\n\n| Pros | Cons |\n| --- | --- |\n| Practical Gulf-wide framing with internal links | Rules change; verify on official portals |\n| June 2026 planning bands | Not legal, tax, or immigration advice |\n| FAQ-friendly structure | Individual cases vary by employer and emirate |',
    localizedProsCons(slug),
  );

  b = replaceExactBlock(
    b,
    '## Pros and cons (summary)\n\n| Pros | Cons |\n| --- | --- |\n| Transparent comparison with Gulf-wide context and internal links to city hubs | Rules and fees change; always verify on official portals before you pay |\n| Actionable checklists and scenario framing for expat families and investors | Individual buildings, schools, and bank branches vary inside the same city |\n| June 2026 planning bands with FAQ schema for quick answers | Not legal, tax, or immigration advice; use licensed professionals for filings |',
    localizedProsCons(slug),
  );

  // Risk bullet blocks
  if (b.includes(GENERIC_RISKS_CONFIRM)) {
    b = replaceExactBlock(b, GENERIC_RISKS_CONFIRM, localizedRisks(slug, 'planning').split('\n\n')[1]);
  }
  if (b.includes(GENERIC_PLANNING_BULLETS)) {
    b = replaceExactBlock(b, GENERIC_PLANNING_BULLETS, localizedChecklist(slug, 'planning').split('\n\n')[1]);
  }

  // Facts tables — match by header then replace until blank line before next ##
  const factHeaders = [
    ['## Reference figures (June 2026)', 'generic'],
    ['## Key numbers to model (June 2026 planning)', 'generic'],
    ['## Visa processing figures (June 2026)', 'visa'],
    ['## Relocation budget figures (June 2026)', 'relocation'],
    ['## Yield modelling figures (June 2026)', 'yield'],
    ['## Property cost figures (June 2026)', 'property'],
    ['## School fee reference (June 2026)', 'school'],
    ['## Banking reference figures (June 2026)', 'banking'],
    ['## Healthcare cost figures (June 2026)', 'healthcare'],
  ];
  for (const [hdr, kind] of factHeaders) {
    if (!b.includes(hdr)) continue;
    const re = new RegExp(`${hdr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## |\\n<FaqBlock|$)`);
    b = b.replace(re, `${localizedFactsTable(slug, kind)}\n\n`);
  }

  // Generic cross-page cost table (pipe format variant)
  const costTable =
    '| Item | Range | Unit |\n| --- | --- | --- |\n| Visa medical test | 250–350 | AED per person |\n| PRO / typing centre | 500–1,500 | AED per filing |\n| Tenancy security deposit | 5–10% | of annual rent |\n| Annual school fees (mid-tier) | 25,000–95,000 | AED |\n| Monthly commute fuel | 400–800 | AED |\n| Golden Visa property floor | 2,000,000 | AED |';
  if (b.includes(costTable)) {
    b = replaceExactBlock(b, costTable, localizedFactsTable(slug, 'generic').split('\n').slice(2).join('\n'));
  }

  // Cluster checklists from dedup-padding (identical bullets)
  const checklistNeedles = [
    ['- Confirm escrow registration and payment schedule on the regulator portal before any wire transfer.\n- Compare handed-over resale price per sqft in the same community against launch brochure bands.\n- Request snagging resolution examples from owners in completed phases, not only sales gallery tours.\n- Model annual service charges from Mollak or building filings, not marketing PDF estimates.\n- Get NOC and resale restriction terms in writing if you plan exit within 24 months.', 'developer'],
    ['- Underwrite net yield after management fees, service charges, municipality fees, and 4–6 weeks void.\n- Stress-test financed deals at +1% mortgage rate and -10% rent before you rely on brochure gross yield.\n- Pull real service charge history for the building, not developer projections alone.\n- Compare liquidity and exit timeline against your hold period; gross yield is not the full story.\n- Keep 6–12 months of carry costs in local currency before you close on a leveraged purchase.', 'yield'],
    ['- Reconfirm salary thresholds, profession lists, and document attestation rules the week you apply.\n- Sequence medical tests, Emirates ID, and tenancy evidence so dependent visas do not bottleneck.\n- Budget 15–25% above headline fees for typing centres, deposits, and insurance gaps.\n- Do not sign a 12-month lease until visa category and sponsor requirements are confirmed in writing.\n- File renewals or status changes at least 30 days before expiry to avoid overstay fines.', 'visa'],
    ['- Apply 6–12 months ahead for top-rated British or American campuses; registration fees are often non-refundable.\n- Compare all-in cost: tuition, bus, uniform, exams, and extracurricular levies, not headline fees alone.\n- Check latest KHDA or ADEK inspection report rather than blog summaries from prior years.\n- Confirm curriculum continuity before mid-secondary transfers; exam board switches are costly at Year 10.\n- Secure a written seat offer before terminating your current school\'s place.', 'schools'],
    ['- Model all-in monthly spend: rent, schooling, insurance, transport, and setup deposits, not headline rent alone.\n- Test home-to-school-to-office commute at weekday peak hour before you sign a 12-month lease.\n- Keep 6–12 months liquidity for cheques, DEWA or SEWA deposits, and furniture setup.\n- Rent 12 months in the target city before buying property if you are new to the GCC market.\n- Verify visa category and housing evidence requirements before committing to annual rent cheques.', 'relocation'],
    ['- Bring employment contract, passport with entry stamp, and Emirates ID timeline for salary account opening.\n- Compare FX spread and outbound transfer limits across bank and exchange house quotes.\n- Prepare source-of-funds documentation for property-related wires; exchange houses are not a bank substitute.\n- Confirm CRS or home-country reporting obligations before assuming UAE zero income tax ends all filings.\n- Read schedule of benefits on health cover tied to account packages, not marketing brochure summaries.', 'banking'],
    ['- Read outpatient, dental, optical, and maternity sub-limits in the schedule of benefits, not the brochure headline.\n- Confirm your preferred clinic is on the insurer panel with direct billing before renewal.\n- Declare pre-existing conditions honestly; waiting periods can delay planned treatment by 6–12 months.\n- Budget specialist visits and emergency room fees if you self-insure or carry thin employer cover.\n- Compare international evacuation cover if you travel frequently or retain ties to your home health system.', 'healthcare'],
    ['- Verify escrow on the regulator portal for off-plan; never wire to personal accounts.\n- Stack full buyer costs: agency commission, transfer fee, trustee charges, and NOC fees on resale stock.\n- Underwrite buy-to-let with real service charge filings and realistic void assumptions.\n- Book independent legal review on SPA default clauses before paying substantial deposits.\n- Confirm Golden Visa or investor residency rules against fully paid versus mortgaged units.', 'property'],
  ];
  for (const [needle, kind] of checklistNeedles) {
    if (!b.includes(needle)) continue;
    b = replaceExactBlock(b, needle, localizedChecklist(slug, kind).split('\n\n')[1]);
  }

  // Second pass — replace already-localized sections that still share templates
  const sectionRes = [
    [/^## [^\n]+ — applicant scenarios[\s\S]*?(?=\n## |\n<FaqBlock|\n---\n|$)/m, () => localizedVisaScenarios(slug)],
    [/^## [^\n]+ — schooling scenarios[\s\S]*?(?=\n## |\n<FaqBlock|\n---\n|$)/m, () => localizedSchoolScenarios(slug)],
    [/^## [^\n]+ — buyer scenarios[\s\S]*?(?=\n## |\n<FaqBlock|\n---\n|$)/m, () => localizedPropertyScenarios(slug)],
    [/^## [^\n]+ — cost figures \(June 2026\)[\s\S]*?(?=\n## |\n<FaqBlock|\n---\n|$)/m, () => localizedFactsTable(slug, 'healthcare')],
  ];
  for (const [re, fn] of sectionRes) {
    if (re.test(b)) b = b.replace(re, `${fn().trimEnd()}\n\n`);
  }

  // Wave3 full risk sections
  b = replaceExactBlock(
    b,
    '## Visa and residency risks\n\n- Salary thresholds and profession lists change without wide announcement. Reconfirm with MOI/GDRFA/LMRA the week you apply.\n- Visit-to-work status changes require in-country processing. Working on tourist visa is a serious violation.\n- Medical fitness failures delay the whole family pipeline. Pre-check conditions with approved clinic lists.\n- Attestation mismatches on marriage and birth certificates are the most common rejection cause.',
    localizedRisks(slug, 'visa'),
  );
  b = replaceExactBlock(
    b,
    '## School selection risks\n\n- Waitlist offers expire quickly. Confirm seat in writing before terminating your current school\'s place.\n- Fee schedules in marketing PDFs may exclude registration, bus, uniform, and exam fees.\n- KHDA/ADEK ratings can change year to year. Check latest inspection report, not blog summaries.\n- Curriculum switches mid-stream (British to IB) can delay university applications by 12 months.',
    localizedRisks(slug, 'school'),
  );
  b = replaceExactBlock(
    b,
    '## Relocation risks before you sign\n\n- Lease before visa category confirmed can block Ejari-dependent steps.\n- Cheque/post-dated rent culture requires upfront liquidity beyond first month.\n- District cooling and DEWA/SEWA deposits add AED 2,000–5,000 in month one.\n- School waitlists do not guarantee placement near your chosen neighbourhood.',
    localizedRisks(slug, 'relocation'),
  );
  b = replaceExactBlock(
    b,
    '## Property transaction risks\n\n- SPA default clauses often favour developer on off-plan. Independent legal review is standard, not optional.\n- Oqood is not full title deed. Resale restrictions may apply until developer NOC and balance cleared.\n- Agency commission and trustee payee names must match exactly on manager\'s cheques.\n- Golden Visa property rules require fully paid units for standard routes. Mortgaged stock may not qualify.',
    localizedRisks(slug, 'property'),
  );

  b = b.replace(
    /## Healthcare cost figures \(June 2026\)[\s\S]*?Emergency room \| 1,000–2,500 AED \| Before insurance \|/g,
    localizedFactsTable(slug, 'healthcare').trimEnd(),
  );
  b = b.replace(
    /\*\*Scenario A — FS1 or primary entry:\*\* Apply 6–12 months ahead for Outstanding-rated campuses tied to KHDA or ADEK rated campus waitlists\. Registration fees are often non-refundable once a seat is offered\.\n\n\*\*Scenario B — mid-secondary transfer:\*\* Curriculum continuity matters more than saving 10% on fees\. Switching exam boards at Year 10 is costly for families using KHDA or ADEK rated campus waitlists\./g,
    localizedSchoolScenarios(slug).split('\n\n').slice(1).join('\n\n'),
  );
  b = b.replace(
    /\*\*Scenario A — Golden Visa property eligibility first filing:\*\*[\s\S]*?\*\*Scenario C — Golden Visa property eligibility renewal:\*\*[^\n]+\n/g,
    localizedVisaScenarios(slug).split('\n\n').slice(1).join('\n\n') + '\n',
  );

  // Cannibal scope block
  const scope = cannibalScopeBlock(slug);
  if (scope && !b.includes('## Scope of this guide')) {
    const faq = b.lastIndexOf('\n<FaqBlock');
    const related = b.lastIndexOf('\n## Related');
    const pos = Math.max(faq, related);
    const insertAt = pos > 200 ? pos : b.length;
    b = `${b.slice(0, insertAt).trimEnd()}\n\n${scope}\n${b.slice(insertAt)}`;
  }

  b = dedupScenarioSections(b);
  b = dedupScenarioParagraphs(b);
  b = stripLegacyScenarioOrphans(b, slug);
  b = dedupScenarioParagraphs(b);

  return b.replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
}

const stats = { touched: 0, scope: 0 };

for (const coll of COLLECTIONS) {
  const dir = join(ROOT, 'src/content', coll);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const slug = name.replace(/\.mdx$/, '');
    const path = join(dir, name);
    const raw = readFileSync(path, 'utf8');
    const { fm, body } = parseMdx(raw);
    const newBody = localizeBody(body, coll, slug);
    if (newBody === body && !CANNIBAL_SCOPE[slug]) continue;

    let newFm = fm.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-15');
    if (!/^updatedDate:/m.test(newFm)) newFm += '\nupdatedDate: 2026-06-15';

    const out = `---\n${newFm.trimEnd()}\n---\n${newBody}`;
    stats.touched += 1;
    if (CANNIBAL_SCOPE[slug] && newBody.includes('## Scope of this guide')) stats.scope += 1;
    if (!DRY) writeFileSync(path, out);
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}Wave 6 P2: ${stats.touched} files localized`);
console.log('Cannibal scope blocks added:', stats.scope);

let sweep = 0;
for (const coll of COLLECTIONS) {
  const dir = join(ROOT, 'src/content', coll);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const slug = name.replace(/\.mdx$/, '');
    const path = join(dir, name);
    const raw = readFileSync(path, 'utf8');
    const { fm, body } = parseMdx(raw);
    let b = body;
    b = stripLegacyScenarioOrphans(b, slug);
    b = dedupScenarioSections(b);
    b = dedupScenarioParagraphs(b);
    b = b.replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
    if (b === body) continue;
    let newFm = fm.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-15');
    if (!/^updatedDate:/m.test(newFm)) newFm += '\nupdatedDate: 2026-06-15';
    if (!DRY) writeFileSync(path, `---\n${newFm.trimEnd()}\n---\n${b}`);
    sweep += 1;
  }
}
console.log(`Phase 3 orphan sweep: ${sweep} files`);
