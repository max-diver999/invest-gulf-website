#!/usr/bin/env node
/**
 * Wave 7 — eliminate remaining cross-page repeated paragraphs with
 * slug-specific, intent-matched sections (Opus-quality replacements).
 *
 * Usage: node scripts/fix-p2-wave7.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

function parseMdx(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Remove generic applicant-scenario blocks and duplicate cost tables */
function stripNoise(body) {
  let b = body;
  b = b.replace(
    /## [^\n]+ — applicant scenarios[\s\S]*?(?=\n## |\n<FaqBlock|\n---\n|$)/g,
    '\n',
  );
  b = b.replace(
    /\n*\*\*Scenario [ABC] —[^*]+(?:first filing|family joining|renewal):\*\*[^\n]+\n(?:\n\*\*Scenario [ABC] —[^\n]+\n)*/g,
    '\n',
  );
  const genericHealthcareTable =
    /\n\| Item \| Typical range \| Notes \|\n\| --- \| --- \| --- \|\n\| GP consultation \| 250–450 AED \| Private clinic \|[\s\S]*?\| Emergency room \| 1,000–2,500 AED \| Before insurance \|\n/g;
  let prev;
  do {
    prev = b;
    b = b.replace(genericHealthcareTable, '\n');
  } while (b !== prev && genericHealthcareTable.test(b));

  b = b.replace(
    /## [^\n]+ — yield underwriting checklist\n\n- Underwrite net yield for Dubai after management fees[\s\S]*?- Keep 6–12 months of carry costs in local currency before you close on a leveraged Dubai purchase\.\n/g,
    '\n',
  );
  b = b.replace(
    /## [^\n]+ — yield modelling \(June 2026\)\n\n\| Item \| Typical range \| Notes \|[\s\S]*?\| DLD transfer \(resale\) \| 4% \| Plus trustee and agency \|\n/g,
    '\n',
  );
  b = b.replace(
    /## [^\n]+ — relocation scenarios\n\n\*\*Scenario A — short assignment in Qatar:\*\*[\s\S]*?\*\*Scenario C — trial before buying in Qatar:\*\*[^\n]+\n/g,
    '\n',
  );
  b = b.replace(
    /## [^\n]+ — planning checklist\n\n- Cross-check fees, eligibility, and regulator guidance on official portals before you pay or sign\.\n- Budget 15–25% above headline costs for deposits, medical tests, insurance gaps, and admin fees\.\n- Sequence visa, housing, schooling, and banking steps so one bottleneck does not delay the whole move\.\n- Treat guaranteed approval, yield, or visa timelines as red flags until a licensed adviser confirms in writing\.\n- Keep 6–12 months of living costs in local currency while you validate assumptions on the ground\.\n/g,
    '\n',
  );

  return b.replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
}

const DRIVING_SCENARIOS = {
  'dubai-driving-license-guide': `## Dubai licence — typical paths

**Path A — direct conversion:** If your home licence is on RTA's approved list, complete an eye test (AED 100–200), pay the conversion fee at a Customer Happiness Centre (AED 220–550), and collect your UAE licence the same day. You need a valid residence visa and Emirates ID.

**Path B — driving school route:** Licences from non-listed countries require theory, yard, and road tests through an RTA-approved school. Budget AED 3,500–8,000 and allow 4–8 weeks depending on instructor slots and prior experience.

**Path C — expired foreign licence:** If your home licence expired more than six months ago, RTA may require the full school route. Renew abroad before relocation when possible, or plan extra time for lessons and tests.`,

  'abu-dhabi-driving-license': `## Abu Dhabi licence — typical paths

**Path A — transfer from Dubai:** UAE federal licences are valid across emirates, but update your traffic file address when you move residence to Abu Dhabi. Insurance and Salik accounts stay separate from Dubai.

**Path B — foreign licence conversion:** Abu Dhabi Police accepts direct conversion from many countries after eye test and file opening. Fees differ slightly from Dubai RTA; book through Abu Dhabi Police service centres or approved apps.

**Path C — new learner in Abu Dhabi:** Non-convertible licences follow Abu Dhabi driving institute curriculum. Factor school fees plus rental car needs in Khalifa City or MBZ if your employer is on Reem Island or Saadiyat.`,

  'bahrain-driving-license': `## Bahrain licence — typical paths

**Path A — CPR holder converting:** Residents with valid CPR can convert many foreign licences at the Traffic Directorate after medical clearance. Bring attested licence, passport, and lease or utility bill proving address.

**Path B — new arrival on work visa:** Employer PRO often coordinates first licence appointment. Causeway commuters should confirm whether Bahrain or Saudi insurance covers daily Dammam runs before relying on a new Bahrain plate.

**Path C — GCC visitor driving:** Short assignments may drive on approved foreign licences for a limited window; confirm duration with Traffic Directorate before assuming UAE or Saudi licences qualify.`,

  'oman-driving-license': `## Oman licence — typical paths

**Path A — resident conversion:** ROP accepts conversion from several countries when you hold a valid residence card and pass the local eye test. Muscat expats in Qurum or Al Mouj should plan one morning at a ROP traffic office plus insurance binding same week.

**Path B — new learner:** Full Omani driving school is required when conversion is not available. Budget OMR 250–450 for lessons and tests; wait times spike before summer school holidays.

**Path C — cross-border GCC licence:** Driving in Oman on a UAE licence is not a long-term substitute for residency holders. Obtain Omani licence before your employment contract assumes daily Muscat commuting.`,

  'qatar-driving-license': `## Qatar licence — typical paths

**Path A — Qatar ID holder:** MOI traffic department converts eligible foreign licences after medical and file opening. West Bay and Lusail residents should align licence appointment with Kahramaa utility registration to avoid duplicate trips.

**Path B — school route:** Non-eligible licences require Qatari driving institute enrollment. Allow 6–10 weeks in peak season; Lusail tram access reduces urgency but family compounds in Al Wakrah still need two cars.

**Path C — employer-sponsored fleet:** Some employers arrange bulk conversions for new hires. Confirm whether fleet insurance covers personal weekend use before declining individual policy quotes.`,
};

const FAMILY_VISA_SCENARIOS = {
  'bahrain-family-visa': `## Bahrain family visa — sponsor paths

**Path A — LMRA salary route:** Confirm dependant eligibility against your LMRA profession and salary band before signing a Manama lease. Attested marriage and birth certificates must match passport transliteration exactly.

**Path B — school-led sequencing:** Secure conditional school offer letters before housing inspection if your category requires minimum bedroom counts. LMRA rejects files when Seef studio leases cannot fit declared dependants.

**Path C — renewal and CPR updates:** Renew dependant stickers before passport expiry buffer. Banks and schools copy visa pages repeatedly; worn passports fail Causeway scanners when commuting to Eastern Province.`,

  'uae-family-visa-sponsorship': `## UAE family visa — sponsor paths

**Path A — employment sponsor:** Salary must meet GDRFA/MOHRE thresholds for the profession listed on your labour contract. Do not sign a 12-month Ejari lease until dependant quota is confirmed in writing by your PRO.

**Path B — property or investor sponsor:** Golden Visa and some investor routes allow family sponsorship with different evidence rules than employment. Title deed or Oqood must match sponsor name before dependant medical appointments.

**Path C — mid-year school transfer:** Sequence Emirates ID renewal, health insurance activation, and school seat confirmation. Dependent visas bottleneck when tenancy contract address does not match Ejari certificate submitted to GDRFA.`,

  'saudi-family-visa': `## Saudi family visa — sponsor paths

**Path A — iqama sponsor:** Verify profession code and salary against Jawazat dependant rules the week you apply. Family visit visas are not interchangeable with long-term dependant iqama without status change.

**Path B — housing and schooling:** Compound leases in Riyadh or Jeddah must match declared family size on visa forms. International school seats should be held in writing before shipping household goods.

**Path C — renewal before expiry:** File dependant renewal at least 45 days early; fines accumulate quickly on overstayed iqama. Exit/re-entry visa timing affects summer home leave—plan GOSI and medical insurance continuity.`,

  'qatar-family-visa-sponsorship': `## Qatar family visa — sponsor paths

**Path A — QID sponsor:** Ministry of Interior dependant rules tie to salary certificates and employer NOC. Lusail and West Bay leases need Kahramaa registration receipts before family medical biometrics.

**Path B — newborn registration:** Birth in Qatar triggers a narrow window for baby QID and passport coordination. Hospital discharge paperwork must match sponsor QID profession list.

**Path C — school-dependent timing:** Apply to two schools before finalising Pearl or Lusail tower lease; bus routes assume fixed campus choice. Family visa stamping waits on attested marriage certs from home embassy.`,

  'oman-family-visa': `## Oman family visa — sponsor paths

**Path A — resident card sponsor:** ROP family joining requires salary evidence and attested relationship documents. Muscat employers often batch PRO appointments after housing contract is attested.

**Path B — Muscat schooling:** British and Indian schools require seat offers before visa stamping for secondary-age children. Commute from Al Mouj to Qurum schools affects housing choice more than rent savings.

**Path C — renewal and insurance:** Dependants must stay on valid health cover aligned with employer policy. Renewal gaps block driving licence updates and school re-enrollment each academic year.`,
};

const FREELANCE_SCENARIOS = {
  'uae-freelance-permit-dubai': `## Dubai freelance permit — application paths

**Path A — free zone first-time:** Choose a zone that matches your activity code (DMCC for consulting, TECOM for media, Meydan for general services). Budget AED 13,000–22,000 all-in for year one including permit, visa, insurance, and e-channel fees.

**Path B — employed convert:** Obtain employer NOC before applying if you hold a labour visa. Parallel employment without NOC creates MOHRE violations even when freelance permit is approved.

**Path C — renewal sync:** Align permit renewal with residence visa and Emirates ID expiry. GoFreelance and DMCC send 60-day reminders; missing the window triggers establishment card holds at banks.`,

  'dubai-freelance-visa-cost': `## Freelance visa cost — budgeting paths

**Path A — headline vs all-in:** Compare permit fee, establishment card, e-channel, medical, Emirates ID, and mandatory health insurance as one stack. Cheapest zone on paper may cost more after bank minimum balance rules.

**Path B — family add-on:** Sponsoring dependants on freelance visa requires higher income evidence at some zones. Model school deposits and Ejari cheques before choosing Meydan over DMCC on fee alone.

**Path C — multi-year TCO:** Year-two renewal drops visa issuance but keeps insurance and zone annual fee. Stripe or Wise verification still treats licence renewal as a business event—keep trade licence PDF current.`,

  'uae-green-visa-freelancer': `## Green Visa freelancer — eligibility paths

**Path A — skilled freelancer without employer:** Green Visa freelancer track needs proof of income and qualifications distinct from free-zone permit routes. Do not assume Meydan permit automatically qualifies for Green Visa classification.

**Path B — property plus freelance:** Investors comparing Golden Visa AED 2M route against Green Visa should model liquidity separately from permit costs. This guide focuses on non-employer residency, not property thresholds.

**Path C — renewal evidence:** Freelancer Green Visa renewal expects continued income proof and health insurance. Gap years on permit without tax invoices may trigger GDRFA questions at renewal.`,
};

const GOLDEN_COMPARE_SCENARIOS = {
  'golden-visa-vs-green-visa': `## Golden vs Green — decision paths

**Path A — property-qualified buyer:** You hold or can complete AED 2M qualifying UAE property. Start with [UAE Golden Visa property](/guides/uae-golden-visa-property/) and compare ten-year stability against Green Visa income proof requirements.

**Path B — skilled professional without AED 2M:** Green Visa skilled worker or freelancer tracks fit better than stretching into mortgaged property that may not qualify. Compare salary floors in [UAE Green Visa guide](/guides/uae-green-visa-guide/).

**Path C — portfolio investor:** You want residency decoupled from a single employer but may not need ten-year Golden Visa. Model exit flexibility: Golden ties to property disposal rules; Green ties to income continuity.`,

  'golden-visa-vs-dubai-residence-visa': `## Golden vs standard residence — decision paths

**Path A — employer-sponsored executive:** Standard employment visa is faster and cheaper if you have a UAE job offer. Golden Visa matters when you want independence from employer cancellation risk.

**Path B — property investor:** AED 2M fully paid route targets Golden Visa; employment visa does not require property but expires with job loss. Compare [Golden Visa application steps](/guides/golden-visa-application-step-by-step/).

**Path C — family stability:** Golden Visa offers longer horizon for school planning and mortgages. Standard visa renewal every 2–3 years works if employer is stable and PRO responsive.`,

  'golden-visa-vs-investor-visa-uae': `## Golden vs investor visa — decision paths

**Path A — real estate only:** Property-based Golden Visa needs AED 2M qualifying stock and fully paid units for standard routes. Generic investor visa may allow operating company ownership with different capital rules.

**Path B — operating business:** If you need trade licence activity beyond passive property, investor or partner visa pathways may suit better than Golden property route alone.

**Path C — mixed portfolio:** Some buyers hold property plus company shares. Sequence which visa category carries dependants and banking KYC before transferring large wires.`,
};

const QATAR_RELOCATION_SCENARIOS = {
  'living-lusail-qatar': `## Lusail relocation — practical paths

**Path A — tram-linked assignment:** Choose Marina or Fox Hills towers within walking distance of Lusail LRT if one parent works in West Bay. Furnished 2BR runs QAR 9,000–14,000; budget Kahramaa deposits plus school bus fees to Doha campuses.

**Path B — family on Lusail tram line:** Seat children early for Lusail International School or accept bus commute to West Bay British schools. Peak Corniche drive from Lusail still hits 35–50 minutes despite tram.

**Path C — buy vs rent in Lusail:** Foreign freehold zones exist but liquidity is thinner than West Bay. Rent 12 months before buying; verify Qetaifan Island and Plaza retail openings affect tower noise and access.`,

  'qatar-relocation-guide': `## Qatar relocation — emirate-wide paths

**Path A — Doha corporate hire:** Employer PRO bundles QID, medical, and bank letter. Secure temporary hotel housing first; West Bay and The Pearl rents require post-dated cheques and salary certificates.

**Path B — family with schooling priority:** Shortlist schools before neighbourhoods. American School of Doha waitlists differ from British streams; bus routes dictate acceptable compound radius.

**Path C — GCC transferee:** Qatar tax and End of Service rules differ from UAE. Model shipping, car import duties, and Kahramaa summer bills before breaking Dubai lease.`,

  'relocate-qatar': `## Relocate to Qatar — sequencing paths

**Path A — visa before housing:** Obtain entry permit and QID appointment before paying annual rent. Landlords expect cheques upfront; reversing a lease after visa rejection is costly in The Pearl and Lusail.

**Path B — pet and vehicle import:** Qatar import rules for pets and right-hand-drive cars differ from UAE. Plan veterinary certificates and MOI traffic inspection slots in first 30 days.

**Path C — spouse career lag:** Trailing spouse cannot work until separate visa category is filed. Budget single-income months and community networks in West Bay expat associations while job searching.`,
};

const YIELD_CHECKLISTS = {
  'how-to-calculate-rental-yield-dubai': `## Yield calculation — verification checklist

- Pull **Ejari-transacted** rent for the exact building, not listing portals or broker blast emails.
- Use **Mollak** service charge per sqft for the tower; branded stock often runs AED 18–25/sqft not brochure AED 12.
- Model **void as weeks**, not percentage points: four weeks equals 7.7% rent loss on annual gross.
- Separate **gross yield** (rent/price) from **net yield** after management, SC, maintenance, and DLD on exit.
- Re-run the formula when mortgage offer changes LTV; leveraged net yield is the investable metric.`,

  'dubai-holiday-home-roi-calculator-guide': `## Holiday home ROI — verification checklist

- Confirm **DTCM permit** costs and building STR rules before using long-term yield math on short-stay revenue.
- Stress **occupancy at 55–65%** even in peak towers; Marina STR is not 85% year-round unless portfolio-proven.
- Include **platform fees, cleaning, linen, and VAT** on each booking; gross nightly rate overstates net by 25–35%.
- Compare **seasonality**: December vs August nightly rates can swing 40%; model lowest quarter explicitly.
- Check **developer STR ban** in SPA or building bylaws before assuming holiday-home exit path.`,

  'dubai-property-flipping-guide': `## Flip underwriting — verification checklist

- Underwrite **total calendar time** from Oqood to NOC to resale, not just build progress photos.
- Stack **2% agency + 4% DLD + trustee + NOC + mortgage settlement** on exit; flips die on fee math at 8% gross.
- Confirm **assignment permitted** in SPA; some developers block secondary sales until 40% paid or handover.
- Model **service charge accrual** during hold; empty off-plan units still bill SC from handover month one.
- Keep **proof of payment trail** for buyer due diligence; messy escrow history discounts resale by 3–5%.`,

  'dubai-payment-plan-types-explained': `## Payment plan stress — verification checklist

- Map **post-handover liability** against realistic rent; 70% on handover plus mortgage is fragile at 6% gross.
- Compare **developer vs bank financing** APR and early settlement penalties before choosing 1% monthly plans.
- Stress **handover delay +12 months** on cash-flow: can you service instalments without tenant income?
- Verify **escrow milestone** matches construction stage on Dubai REST; never wire non-escrow "admin" fees.
- Read **default clause** on missed instalment; some SPAs accelerate full balance after two late payments.`,

  'dubai-vs-saudi-rental-yield': `## Cross-border yield — comparison checklist

- Quote **net yield in AED and SAR** with FX assumption documented; currency swing can erase 1–2% net over hold.
- Compare **exit liquidity**: Dubai JVC resale depth vs Riyadh district days-on-market for same ticket size.
- Model **visa and tax residency** separately from yield; Saudi income asset may not suit Golden-UAE lifestyle plan.
- Use **local service charge evidence** in each market; Saudi gross looks higher until maintenance and void are applied.
- Pair yield result with [Saudi rental yield guide](/guides/saudi-rental-yield-guide/) before portfolio split decision.`,
};

const YIELD_TABLES = {
  'how-to-calculate-rental-yield-dubai': `## Dubai yield inputs (June 2026)

| Input | Typical source | Notes |
| --- | --- | --- |
| Annual rent | Ejari / REST transacted | Not listing ask |
| Service charge | Mollak building filing | AED/sqft all-in |
| Management fee | PM contract | 5–8% collected rent |
| Void weeks | Underwriter assumption | 4–6 conservative |
| Maintenance | Owner actuals | AED 3–8/sqft/year |
| Exit DLD | Resale stack | 4% + 2% agency typical |`,

  'dubai-holiday-home-roi-calculator-guide': `## STR ROI inputs (June 2026)

| Input | Typical range | Notes |
| --- | --- | --- |
| Nightly rate (Marina 1BR) | AED 450–750 | Seasonal swing |
| Occupancy | 55–70% | Verify building STR history |
| Platform + cleaning | 25–35% | Of gross booking |
| DTCM permit | AED 1,500–3,000 | Annual |
| Utilities peak summer | AED 1,200–2,000 | 1BR monthly |
| Furniture capex | AED 25,000–45,000 | Amortise over 3 years |`,

  'dubai-property-flipping-guide': `## Flip cost stack (June 2026)

| Item | Typical range | Notes |
| --- | --- | --- |
| Assignment fee | 2–5% | Developer-dependent |
| DLD on resale | 4% | Plus AED 580 admin |
| Service charges during hold | AED 12–22/sqft | From handover |
| Agency commission | 2% | Often buyer-paid |
| NOC / trustee | AED 3,000–7,000 | Developer + trustee |
| Carry cost months | 3–9 | Off-plan to resale |`,

  'dubai-payment-plan-types-explained': `## Payment plan benchmarks (June 2026)

| Plan type | Handover balance | Risk flag |
| --- | --- | --- |
| 60/40 post-handover | 40% due at keys | High if rent under 6% net |
| 70/30 construction | 30% at completion | Lower post-handover shock |
| 1% monthly post-handover | Spreads 24–36 months | Check APR vs mortgage |
| Bank linked | Developer + bank MOU | Verify bank approval letter |
| Full cash discount | 3–8% off list | Opportunity cost of capital |
| Delayed handover clause | SPA schedule H | Model +12 month slip |`,
};

const HEALTHCARE_TABLES = {
  'dubai-healthcare-guide-expats': `## Dubai healthcare costs (June 2026)

| Service | Typical range | Notes |
| --- | --- | --- |
| GP visit (private) | AED 250–450 | DHA-licensed clinic |
| Specialist consultation | AED 400–800 | Without insurance |
| MRI (outpatient) | AED 1,800–3,500 | Hospital-dependent |
| Maternity package | AED 15,000–45,000 | Hospital tier |
| International plan | USD 3,000–8,000 | Per adult/year |
| ER visit (uninsured) | AED 1,000–2,500 | Before claim |`,

  'best-health-insurance-dubai': `## Insurance premium bands (June 2026)

| Tier | Annual premium (adult) | Typical network |
| --- | --- | --- |
| Essential (DHA min) | AED 650–1,200 | Limited hospitals |
| Enhanced | AED 2,500–6,000 | Major private network |
| Comprehensive | AED 8,000–18,000 | Premium + dental partial |
| International | USD 3,000–8,000 | Multi-country cover |
| Maternity add-on | AED 3,000–8,000 | Waiting periods apply |
| Optical/dental rider | AED 500–2,000 | Often capped |`,

  'dubai-dental-care-costs': `## Dubai dental fees (June 2026)

| Procedure | Typical range | Notes |
| --- | --- | --- |
| Cleaning | AED 250–500 | Hygienist |
| Filling (composite) | AED 400–900 | Per tooth |
| Root canal | AED 1,500–3,500 | Molar higher |
| Crown | AED 2,000–4,500 | Material-dependent |
| Implant (single) | AED 8,000–15,000 | Excludes crown |
| Invisalign consult | AED 500–1,000 | Treatment separate |`,

  'dubai-health-insurance-mandatory': `## DHA mandatory minimums (June 2026)

| Requirement | Value | Notes |
| --- | --- | --- |
| Essential Benefits Plan floor | AED ~650/year | Employer-sponsored |
| Outpatient sub-limit (typical) | AED 150,000 | Read schedule |
| Inpatient annual cap | AED 150,000–1M | Plan-dependent |
| Pharmacy cap | AED 1,500–7,500 | Essential tier lower |
| Maternity waiting | 6–12 months | Declare early |
| Dependants | Employer must cover | Same sponsor visa |`,

  'dubai-public-vs-private-healthcare': `## Public vs private cost compare (June 2026)

| Service | Dubai Health (public) | Private hospital |
| --- | --- | --- |
| GP visit | AED 100–200 | AED 250–450 |
| Specialist | AED 200–400 | AED 400–800 |
| MRI | AED 800–1,500 | AED 1,800–3,500 |
| Normal delivery | AED 8,000–15,000 | AED 20,000–45,000 |
| ER triage | Lower copay | Full tariff |
| Wait time | Longer queue | Same-day typical |`,

  'abu-dhabi-healthcare-guide': `## Abu Dhabi healthcare costs (June 2026)

| Service | Typical range | Notes |
| --- | --- | --- |
| GP (private) | AED 280–480 | DOH-licensed |
| Thiqa eligible services | Subsidised | UAE nationals |
| Specialist | AED 450–850 | Without insurance |
| Maternity (private) | AED 18,000–50,000 | Hospital tier |
| Employer plan premium | AED 3,000–12,000 | DOH compliant |
| Pharmacy copay | AED 20–80 | Plan-dependent |`,

  'rak-healthcare-guide': `## RAK healthcare costs (June 2026)

| Service | Typical range | Notes |
| --- | --- | --- |
| GP visit | AED 200–380 | RAK Hospital / clinics |
| Specialist | AED 350–650 | Travel to Dubai optional |
| Emergency | AED 900–2,200 | Before insurance |
| Employer insurance | AED 1,800–5,500 | Often essential tier |
| Dubai specialist commute | 45–70 min | For complex cases |
| Pharmacy | AED 50–200 copay | Network-dependent |`,

  'saudi-healthcare-expats': `## Saudi healthcare costs (June 2026)

| Service | Typical range (SAR) | Notes |
| --- | --- | --- |
| GP visit | SAR 200–400 | Private clinic |
| Specialist | SAR 350–700 | Without insurance |
| Maternity package | SAR 15,000–40,000 | Hospital tier |
| Employer insurance | SAR 2,500–8,000 | Mandatory for iqama |
| Dental cleaning | SAR 250–500 | Often excluded |
| ER visit | SAR 800–2,000 | Before claim |`,
};

const PROJECT_NEWS_CHECKLISTS = {
  'creek-waters-emaar': `## Creek Waters — buyer due diligence checklist

- Verify escrow registration and payment milestones on Dubai REST before any transfer to Emaar sales accounts.
- Model post-handover service charges for Dubai Creek Harbour towers; waterfront stock often runs above AED 18/sqft.
- Compare handed-over Creek Harbour resale comps versus launch PSF; liquidity concentrates in 1–2BR investor units.
- Request SPA default and handover delay clauses in writing; Creek corridor supply competes with nearby masterplan pipeline.
- Confirm mortgage LTV and Golden Visa eligibility separately if residency is part of your purchase thesis.`,

  'nakheel-como-residences': `## Como Residences — buyer due diligence checklist

- Palm Jumeirah ultra-premium units need Nakheel NOC and transfer fee stack modelled before offer—not list price alone.
- Underwrite holding costs for branded Palm stock: service charges, chiller, and facade maintenance exceed mid-market Dubai.
- Compare Palm resale days-on-market for similar branded inventory; exit pool is thin above AED 15M ticket.
- Verify SPA restrictions on short-term rental if yield matters; many Palm towers cap holiday-home activity.
- Independent snagging on handover is non-optional at this price band; retain holdback where contract allows.`,

  'dubai-transaction-volume-may-2026': `## Reading May 2026 volume data — analyst checklist

- Cross-check DLD headline value against transaction *count*; average ticket inflation can mask volume softness.
- Split off-plan versus ready stock; May 2026 mix shifts interpretation for yield-focused investors.
- Compare month-on-month with Ramadan/Eid calendar effects before calling a trend reversal.
- Map volume spikes to micro-markets (JVC, Marina, Business Bay)—emirate-wide stats hide neighbourhood dispersion.
- Treat broker "record month" claims as marketing until REST/DLD published figures match the narrative.`,
};

const DISCLAIMERS = {
  'rak-vs-sharjah-living': `> Disclaimer: June 2026 planning ranges for RAK vs Sharjah commute and rent — not quotes. E311 traffic, school fees, and employer location shift the winner; verify leases and KHDA/ADEK fees before you move.`,
  'relocate-ras-al-khaimah': `> Disclaimer: June 2026 planning ranges for RAK relocation — not quotes. Al Marjan and Wynn corridor rents, visa rules, and RAK Municipality tenancy steps change; confirm with PRO and landlord before cheques.`,
  'wynn-al-marjan-living-impact': `> Disclaimer: June 2026 planning ranges for Al Marjan / Wynn impact — not opening-date guarantees. Hospitality supply, STR rules, and RAK resale liquidity evolve; verify DLD/RAK REST and developer handover notices at decision time.`,
};

const WAVE7_SLUGS = new Set([
  ...Object.keys(DRIVING_SCENARIOS),
  ...Object.keys(FAMILY_VISA_SCENARIOS),
  ...Object.keys(FREELANCE_SCENARIOS),
  ...Object.keys(GOLDEN_COMPARE_SCENARIOS),
  ...Object.keys(QATAR_RELOCATION_SCENARIOS),
  ...Object.keys(YIELD_CHECKLISTS),
  ...Object.keys(YIELD_TABLES),
  ...Object.keys(HEALTHCARE_TABLES),
  ...Object.keys(PROJECT_NEWS_CHECKLISTS),
  ...Object.keys(DISCLAIMERS),
]);

function applyWave7(body, slug) {
  const stripped = stripNoise(body);
  let b = stripped;
  const inserts = [];

  if (DRIVING_SCENARIOS[slug] && !b.includes(DRIVING_SCENARIOS[slug].split('\n')[0])) inserts.push(DRIVING_SCENARIOS[slug]);
  if (FAMILY_VISA_SCENARIOS[slug] && !b.includes(FAMILY_VISA_SCENARIOS[slug].split('\n')[0])) inserts.push(FAMILY_VISA_SCENARIOS[slug]);
  if (FREELANCE_SCENARIOS[slug] && !b.includes(FREELANCE_SCENARIOS[slug].split('\n')[0])) inserts.push(FREELANCE_SCENARIOS[slug]);
  if (GOLDEN_COMPARE_SCENARIOS[slug] && !b.includes(GOLDEN_COMPARE_SCENARIOS[slug].split('\n')[0])) inserts.push(GOLDEN_COMPARE_SCENARIOS[slug]);
  if (QATAR_RELOCATION_SCENARIOS[slug] && !b.includes(QATAR_RELOCATION_SCENARIOS[slug].split('\n')[0])) inserts.push(QATAR_RELOCATION_SCENARIOS[slug]);
  if (YIELD_CHECKLISTS[slug] && !b.includes(YIELD_CHECKLISTS[slug].split('\n')[0])) inserts.push(YIELD_CHECKLISTS[slug]);
  if (YIELD_TABLES[slug] && !b.includes(YIELD_TABLES[slug].split('\n')[0])) inserts.push(YIELD_TABLES[slug]);
  if (HEALTHCARE_TABLES[slug] && !b.includes(HEALTHCARE_TABLES[slug].split('\n')[0])) inserts.push(HEALTHCARE_TABLES[slug]);
  if (PROJECT_NEWS_CHECKLISTS[slug] && !b.includes(PROJECT_NEWS_CHECKLISTS[slug].split('\n')[0])) inserts.push(PROJECT_NEWS_CHECKLISTS[slug]);

  if (DISCLAIMERS[slug]) {
    b = b.replace(
      /> Disclaimer: Figures are June 2026 planning ranges, not quotes\. Wynn opening dates, visa rules and market rents change, verify at decision time\./,
      DISCLAIMERS[slug],
    );
  }

  if (inserts.length) {
    const faq = b.lastIndexOf('\n<FaqBlock');
    const related = b.lastIndexOf('\n## Related');
    const scope = b.lastIndexOf('\n## Scope of this guide');
    const pos = Math.max(faq, related, scope);
    const insertAt = pos > 200 ? pos : b.length;
    b = `${b.slice(0, insertAt).trimEnd()}\n\n${inserts.join('\n\n')}\n${b.slice(insertAt)}`;
  }

  return b.replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
}

let touched = 0;
for (const coll of ['guides', 'compare', 'areas', 'projects', 'news']) {
  const dir = join(ROOT, 'src/content', coll);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const slug = name.replace(/\.mdx$/, '');
    if (!WAVE7_SLUGS.has(slug)) continue;
    const path = join(dir, name);
    const raw = readFileSync(path, 'utf8');
    const { fm, body } = parseMdx(raw);
    const newBody = applyWave7(body, slug);
    if (newBody === body) continue;
    let newFm = fm.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-15');
    if (!/^updatedDate:/m.test(newFm)) newFm += '\nupdatedDate: 2026-06-15';
    if (!DRY) writeFileSync(path, `---\n${newFm.trimEnd()}\n---\n${newBody}`);
    touched += 1;
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}Wave 7 P2: ${touched} files updated`);
