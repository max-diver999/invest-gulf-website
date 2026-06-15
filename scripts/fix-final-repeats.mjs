#!/usr/bin/env node
/**
 * fix-final-repeats.mjs — eliminate the last 7 repeated-paragraph clusters.
 * Each generic paragraph is replaced with a unique, slug-specific version.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(__dirname, '..', 'src/content');

function read(id) { return readFileSync(join(CONTENT, `${id}.mdx`), 'utf8'); }
function write(id, data) { writeFileSync(join(CONTENT, `${id}.mdx`), data, 'utf8'); }

let changed = 0;

function replace(id, old, replacement) {
  let src = read(id);
  if (!src.includes(old)) {
    console.log(`  SKIP ${id} — target not found`);
    return;
  }
  src = src.replace(old, replacement);
  write(id, src);
  changed++;
  console.log(`  ✓ ${id}`);
}

// ============================================================
// C1: developer reviews — budget paragraph (6 files)
// ============================================================
console.log('\n--- C1: developer-review budget paragraph ---');

const C1_OLD = `When budgeting for this process in the Gulf, account for government processing fees (typically 500–5,000 AED depending on service type), document attestation costs (200–800 AED per document), typing-centre charges (100–350 AED per application), and potential agent or PRO service fees (1,500–5,000 AED for end-to-end handling). Timeline varies from 3 working days for straightforward applications to 4–8 weeks for complex cases requiring inter-departmental coordination.`;

replace('guides/azizi-developments-review', C1_OLD,
  `Buyers in an Azizi project should budget for DLD transfer (4 % of the purchase price), a trustee fee of 4,000 AED plus VAT, Oqood registration for off-plan (2 % or minimum 5,000 AED), and Azizi's own NOC charge (typically 1,000–5,000 AED depending on the community). If financing, add a bank valuation fee of 2,500–3,500 AED and an arrangement fee of 0.25–1 %. From booking to title deed, most Azizi resale deals close in 4–6 weeks; off-plan transfers can take longer when DLD approval queues spike.`);

replace('guides/damac-properties-review', C1_OLD,
  `DAMAC buyers face DLD transfer fees of 4 %, plus an admin fee DAMAC charges on resale NOCs — historically 1,000–5,000 AED per unit. If purchasing through the DAMAC Financing programme, the mortgage registration fee (0.25 % of the loan) and valuation (2,500–3,500 AED) apply. Agent commissions on DAMAC secondary stock sit at 2 % of the sale price. Budget 5–7 weeks for a straightforward DAMAC resale; primary sales with DAMAC's in-house team can close in 10–15 working days if payment is ready.`);

replace('guides/ejari-registration-landlord-guide', C1_OLD,
  `Ejari registration itself costs roughly 220 AED through the official RERA portal (Ejari fee 172 AED + knowledge/innovation fees). Typing centres charge 100–250 AED on top for data entry. If the tenancy contract is in Arabic only, an attested English translation adds 200–500 AED. Renewals cost the same as new registrations. Most Ejari applications are processed within 1–3 working days if the title deed, passport copies, and tenancy contract are uploaded correctly the first time. Rejected applications due to mismatched unit numbers or landlord names add 5–10 days of back-and-forth.`);

replace('guides/ellington-properties-review', C1_OLD,
  `Ellington charges a NOC fee in the range of 1,000–5,000 AED for resale transfers. On top of DLD's 4 % transfer fee, buyers pay a trustee charge (4,000 AED + VAT) and — if mortgaged — a bank valuation fee (2,500–3,500 AED). Ellington off-plan units registered through Oqood carry a 2 % registration cost (minimum 5,000 AED). End-to-end timelines for Ellington resales average 4–6 weeks; new purchases with Ellington's direct sales team are often faster, around 2–3 weeks, because the developer handles most admin internally.`);

replace('guides/emaar-properties-review', C1_OLD,
  `Emaar's standard NOC fee ranges from 500 to 5,000 AED depending on the community and property type. Add the DLD 4 % transfer fee, trustee charge (4,000 AED + VAT), and any outstanding service-charge balance that Emaar requires cleared before issuing the NOC. Emaar developments in Downtown and Dubai Hills typically have higher service charges (18–25 AED/sqft), so verify outstanding fees early. A clean Emaar resale transaction — with no mortgage on either side — usually completes in 3–5 weeks from MOU signing.`);

replace('guides/meraas-properties-review', C1_OLD,
  `Meraas properties attract the standard 4 % DLD transfer fee plus a trustee charge of 4,000 AED + VAT. Meraas NOC fees sit at 1,000–5,000 AED; City Walk and Bluewaters units are at the higher end due to premium community classification. Service charges in Meraas communities run 20–30 AED per square foot — among the highest in Dubai. Buyers should verify the exact annual charge with Meraas property management before signing the MOU. From listing to title deed, resale timelines in Meraas projects average 5–7 weeks.`);

// C1 part 2: framework link (3 files)
console.log('\n--- C1b: developer-review framework link ---');

const C1B_OLD = `Full framework: [How to Evaluate a Dubai Developer](/guides/how-to-evaluate-dubai-developer/) and [Due Diligence Dubai Property](/guides/due-diligence-dubai-property/).`;

replace('guides/azizi-developments-review', C1B_OLD,
  `For Azizi-specific due diligence tips, see [How to Evaluate a Dubai Developer](/guides/how-to-evaluate-dubai-developer/). Cross-reference Azizi's escrow accounts with RERA using [Due Diligence Dubai Property](/guides/due-diligence-dubai-property/).`);

replace('guides/ellington-properties-review', C1B_OLD,
  `Ellington's boutique positioning demands extra design-quality checks — start with [How to Evaluate a Dubai Developer](/guides/how-to-evaluate-dubai-developer/) and follow up with the legal walkthrough in [Due Diligence Dubai Property](/guides/due-diligence-dubai-property/).`);

replace('guides/emaar-properties-review', C1B_OLD,
  `Even with a household name like Emaar, structured due diligence matters. Use [How to Evaluate a Dubai Developer](/guides/how-to-evaluate-dubai-developer/) for financial checks and [Due Diligence Dubai Property](/guides/due-diligence-dubai-property/) for the title-deed and SPA review steps.`);

// ============================================================
// C2: bahrain-bridge + freelance — scenario intro (3 files)
// ============================================================
console.log('\n--- C2: scenario intro paragraph ---');

const C2_OLD = `Each path converges at the same destination; the difference is timeline, cost, and hassle level. Pick the scenario closest to yours and skip sections that don't apply.`;

replace('guides/bahrain-saudi-bridge-commute', C2_OLD,
  `Bridge commuters fall into distinct profiles — Saudi employee living in Bahrain, Bahraini professional working in Saudi, or remote worker splitting time between both sides. Each has different Causeway toll economics and iqama implications, so pick the scenario closest to yours.`);

replace('guides/uae-freelance-permit-dubai', C2_OLD,
  `Freelance permits come through several issuing bodies — Dubai DED, IFZA, Dubai South, Kiklabb, and Meydan — each with different pricing, visa inclusion, and activity scope. Choose the path that matches your profession and client base.`);

replace('guides/uae-green-visa-freelancer', C2_OLD,
  `The Green Visa sits between a standard employment visa and the Golden Visa in both cost and flexibility. It suits self-employed professionals earning above AED 360,000 annually who want 5-year residency without an employer sponsor. Assess whether it outperforms a freelance permit for your situation.`);

// C2 part 2: scenario A/B/C (2 files — freelance + green visa)
console.log('\n--- C2b: scenario A/B/C block ---');

const C2B_OLD = `- Scenario A — employed professional relocating with family: salary above AED 15,000/month, employer covers most setup costs, priority is speed and compliance. This route offers the clearest paperwork trail and the fastest timeline (typically 10–20 working days). - Scenario B — freelancer or remote worker on a flexible visa: income from multiple clients, lower tolerance for bureaucratic friction, and a preference for digital processes. Budget 20–30 % more time for documentation and plan around the renewal cycle. - Scenario C — investor or retiree planning long-term residency: capital deployed in property or business, lower urgency but higher stakes. Focus on the 10-year horizon — cost differences compound over a decade, so optimise for total lifecycle expense rather than upfront convenience.`;

replace('guides/uae-freelance-permit-dubai', C2B_OLD,
  `- Scenario A — content creator or consultant with under 3 clients: a Kiklabb or Dubai South permit (7,500–12,000 AED/year) covers one activity. Setup takes 5–10 working days. Visa included; no office lease required. - Scenario B — multi-discipline freelancer (e.g., marketing + photography): DED or IFZA dual-activity licence (12,000–20,000 AED/year) avoids running two permits. Budget 2–3 weeks for approval. Medical, Emirates ID, and visa stamping add another 10–14 days. - Scenario C — established freelancer earning above AED 360,000/year: consider upgrading to a Green Visa for 5-year tenure and sponsor privileges. Compare lifecycle cost of annual permit renewals vs one-time Green Visa fees over a 5-year window.`);

replace('guides/uae-green-visa-freelancer', C2B_OLD,
  `- Scenario A — freelancer earning AED 30,000+/month with a UAE freelance permit: the Green Visa replaces annual renewals with a 5-year stamp. You save on cumulative renewal fees (roughly 10,000–15,000 AED over 5 years) and gain the ability to sponsor dependents independently. - Scenario B — skilled employee switching to self-employment: the Green Visa lets you resign and retain residency while building a client base. Minimum salary history must show AED 15,000/month for the last 12 months OR a bachelor's degree + self-employment proof. - Scenario C — digital nomad converting from a 1-year remote-work visa: the Green Visa offers longer tenure (5 years vs 1 year) and a UAE tax-residency certificate. Assess whether your income documentation meets ICA requirements before applying.`);

// ============================================================
// C3: living comparison — budget tier paragraph (3 files)
// ============================================================
console.log('\n--- C3: living-comparison budget tiers ---');

const C3_OLD = `Budget tier in Dubai (single professional): studio rental 3,000–5,500 AED, groceries 1,200–1,800 AED, transport 400–800 AED, total 6,000–9,000 AED/month. Mid-range (couple): 2-bed apartment 7,000–13,000 AED, groceries 2,500–3,500 AED, car payment 1,500–2,500 AED, total 14,000–22,000 AED/month. Premium (family of four, villa): villa rent 15,000–35,000 AED, amortised school fees 3,000–10,000 AED/month, total 25,000–50,000 AED/month.`;

replace('guides/bahrain-vs-dubai-living', C3_OLD,
  `Bahrain is 25–40 % cheaper for housing: a 2-bed apartment in Juffair costs 300–450 BHD (roughly 3,000–4,500 AED) versus 7,000–13,000 AED for an equivalent in Dubai Marina or JLT. Groceries run 10–15 % less in Bahrain thanks to Saudi supply chains. However, Dubai offers higher earning potential — median expat salaries are 30–50 % above Bahrain in finance and tech. Factor in the 25 BD Causeway toll per crossing if you plan to shop or socialise across the border regularly.`);

replace('guides/dubai-monthly-budget-expat-family', C3_OLD,
  `Family of four in Dubai, realistic 2025 monthly budget: 2-bed apartment in JVC or Al Furjan (8,000–12,000 AED), school fees amortised (3,000–8,000 AED/month depending on curriculum — British tends to be 20–30 % pricier than American or IB), groceries and household (3,500–5,000 AED), car loan or lease (1,800–2,500 AED), utilities including district cooling (800–1,500 AED), health insurance top-up (500–1,200 AED), and dining/entertainment (2,000–4,000 AED). Comfortable total: 22,000–36,000 AED/month. Premium areas (Dubai Hills, Arabian Ranches) push housing to 15,000–25,000 AED.`);

replace('guides/dubai-vs-abu-dhabi-living', C3_OLD,
  `Abu Dhabi housing costs run 15–25 % below equivalent Dubai areas: a 2-bed on Al Reem Island costs 55,000–80,000 AED/year versus 85,000–130,000 AED in Dubai Marina. Grocery prices are virtually identical across both emirates. Abu Dhabi's advantage is school fees — ADEK-regulated tuition caps keep annual increases under 4–5 %, while Dubai's KHDA allows market-rate adjustments. Transport costs are lower in Abu Dhabi (less congestion, shorter commutes) but Dubai's Metro covers more ground for car-free lifestyles.`);

// ============================================================
// C4: utility/rental — budget paragraph (3 files)
// ============================================================
console.log('\n--- C4: utility/rental budget paragraph ---');

const C4_OLD = `When budgeting for this process in Dubai, account for government processing fees (typically 500–5,000 AED depending on service type), document attestation costs (200–800 AED per document), typing-centre charges (100–350 AED per application), and potential agent or PRO service fees (1,500–5,000 AED for end-to-end handling). Timeline varies from 3 working days for straightforward applications to 4–8 weeks for complex cases requiring inter-departmental coordination.`;

replace('guides/dubai-district-cooling-charges', C4_OLD,
  `District cooling connection in Dubai involves a one-time connection fee (2,000–8,000 AED depending on the provider — Emicool, Empower, or National Central Cooling), a refundable deposit (500–2,000 AED), and ongoing consumption charges measured per ton-hour of refrigeration (typically 0.17–0.35 AED/ton-hr). Account activation takes 3–5 working days if the developer's NOC and tenancy contract are in order. Late connection requests during peak summer can stretch to 10–15 days due to demand.`);

replace('guides/dubai-utility-bills-deewa', C4_OLD,
  `Setting up DEWA (Dubai Electricity and Water Authority) requires a refundable security deposit (2,000 AED for a flat, 4,000 AED for a villa), a connection fee of 130 AED, plus knowledge/innovation fees totalling roughly 10 AED. Activation typically takes 1–2 working days online or same-day at a DEWA customer happiness centre. For disconnection when vacating, submit a move-out request at least 3 days before your Ejari end date to avoid overlapping billing.`);

replace('guides/short-term-vs-long-term-rental-dubai', C4_OLD,
  `Short-term rental licensing in Dubai requires a DTCM permit (annual fee 1,070 AED for a holiday-home operator licence), property-specific permits (370 AED per unit), and RERA registration. Long-term landlords need Ejari registration (roughly 220 AED) and a DEWA account transfer. Short-term yields are typically 8–12 % gross but carry 15–25 % management fees and 35–45 % seasonal vacancy. Long-term yields run 5–8 % gross with near-zero vacancy and minimal management overhead.`);

// C4 part 2: utility tips (2 files)
console.log('\n--- C4b: utility cost tips ---');

const C4B_OLD = `Dubai residents can cut utility costs by 15–30 % with targeted actions: (1) set AC to 24–25°C instead of 20–22°C — each degree higher saves roughly 5–8 % on cooling, (2) switch to LED lighting throughout (payback in 6–12 months at 200–500 AED investment), (3) install a smart thermostat (300–800 AED) to schedule cooling around occupancy, (4) request district-cooling meter audit if charges exceed 3.50 AED per ton-hour — billing errors are more common than residents assume. Average monthly utility bills by unit type in Dubai: studio 250–450 AED, 1-bed 400–700 AED, 2-bed 600–1,100 AED, villa 1,500–3,500 AED. Summer months (June–September) typically run 40–60 % above winter averages.`;

replace('guides/dubai-district-cooling-charges', C4B_OLD,
  `District-cooling-specific savings: (1) verify your tariff plan — Empower offers demand-based and consumption-based rates, and switching plans can save 10–20 % annually for units with irregular occupancy. (2) Check the BTU capacity of your fan-coil units; oversized coils waste energy and inflate charges. (3) Seal windows and balcony doors — a 2-mm gap can increase cooling load by 5–10 %. Average district-cooling charges by unit type: studio 150–300 AED/month, 1-bed 250–500 AED/month, 2-bed 400–800 AED/month, penthouse/townhouse 800–2,000 AED/month. Summer surcharges add 30–50 % above the winter baseline.`);

replace('guides/dubai-utility-bills-deewa', C4B_OLD,
  `DEWA-specific savings: (1) enrol in DEWA's Shams Dubai net-metering programme if you own a villa — solar panels offset 30–60 % of electricity in peak months. (2) Use DEWA's smart-home app to set consumption alerts at 80 % of your average bill. (3) Report leaks promptly — a dripping tap wastes 20–40 litres per day, adding 50–100 AED per quarter. DEWA slab tariff: the first 2,000 kWh costs 0.23 AED/kWh; consumption above 6,000 kWh jumps to 0.38 AED/kWh — heavy villa users should monitor the slab carefully. Water tariff: first 6,000 IG at 0.03 AED/IG, next tier at 0.04 AED/IG.`);

// ============================================================
// C5: property transactions — purchase timeline (3 files)
// ============================================================
console.log('\n--- C5: purchase timeline paragraph ---');

const C5_OLD = `A typical Dubai purchase takes 4–8 weeks from offer to title transfer. Budget for: transfer fee (2–4 %), trustee/escrow (2,000–6,000 AED), NOC from developer (500–5,000 AED), agency commission (1–2 % buyer side), mortgage valuation (2,500–3,500 AED), and arrangement fee (0.25–1 %). Post-purchase costs include first-year service charges (due within 30 days of handover), utility connections (1,000–3,000 AED), and interior fit-out for off-plan units (100–250 AED per square foot).`;

replace('guides/dubai-property-handover-checklist', C5_OLD,
  `Handover-day cost stack: final payment tranche (5–10 % of the purchase price held until completion), snagging-company fee (1,500–4,000 AED per unit), DEWA connection deposit (2,000–4,000 AED), chiller deposit if applicable (500–2,000 AED), community move-in fee (500–1,000 AED), and first-quarter service charges (calculated from handover date, not calendar quarter). Off-plan buyers should budget an additional 100–250 AED per square foot for basic fit-out if the unit is delivered as a shell. Total move-in costs beyond the sale price: typically 15,000–40,000 AED for an apartment and 30,000–80,000 AED for a villa.`);

replace('guides/mistakes-foreign-buyers-dubai-property', C5_OLD,
  `Common cost surprises for first-time foreign buyers: (1) the 4 % DLD transfer fee is payable on the day of transfer — no instalment option, (2) agency commission in Dubai is negotiable but market standard is 2 % from the buyer on secondary stock, (3) mortgage pre-approval takes 5–10 working days and many buyers miss deadlines by applying late, (4) service-charge arrears on resale units become the buyer's liability if not cleared before transfer — always request a zero-balance certificate from the developer. A well-prepared buyer completes the purchase in 4–5 weeks; those caught off-guard by documentation delays often face 8–10 weeks.`);

replace('guides/selling-property-dubai-guide', C5_OLD,
  `Seller-side cost stack: agency commission (2 % standard), NOC fee from developer (500–5,000 AED), early mortgage settlement penalty (1–3 % of outstanding balance if applicable), and any outstanding service charges that must be cleared before the NOC is issued. Timeline for sellers: listing to MOU (1–3 weeks), MOU to NOC (5–10 working days), NOC to transfer at DLD trustee (1–3 working days). Total elapsed time: 4–7 weeks in a liquid market; off-plan assignments may take 6–10 weeks due to additional developer approvals.`);

// C5 part 2: escrow note (appears twice in same file — selling-property-dubai-guide)
console.log('\n--- C5b: escrow/buyer-checklist ---');

const C5B_OLD = `- Verify escrow on the regulator portal for Dubai off-plan; never wire to personal accounts. - Stack full buyer costs for Dubai: agency commission, transfer fee, trustee charges, and NOC fees on resale stock. - Underwrite buy-to-let in Dubai with real service charge filings and realistic void assumptions. - Book independent legal review on SPA default clauses before paying substantial deposits on Selling Property Dubai. - Confirm Golden Visa or investor residency rules against fully paid versus mortgaged Dubai units.`;

// This appears twice in the same file, replace all
{
  let src = read('guides/selling-property-dubai-guide');
  const count = src.split(C5B_OLD).length - 1;
  if (count >= 2) {
    // Remove the second occurrence entirely
    const firstIdx = src.indexOf(C5B_OLD);
    const secondIdx = src.indexOf(C5B_OLD, firstIdx + C5B_OLD.length);
    src = src.slice(0, secondIdx) + src.slice(secondIdx + C5B_OLD.length);
    write('guides/selling-property-dubai-guide', src);
    changed++;
    console.log(`  ✓ guides/selling-property-dubai-guide (removed duplicate block)`);
  } else if (count === 1) {
    console.log(`  SKIP guides/selling-property-dubai-guide — only 1 occurrence, not a self-duplicate`);
  } else {
    console.log(`  SKIP guides/selling-property-dubai-guide — target not found`);
  }
}

// ============================================================
// C6: rental yield compare — scenario paragraph (3 files)
// ============================================================
console.log('\n--- C6: rental-yield scenario paragraph ---');

const C6_OLD = `Run three scenarios before committing capital in Dubai: (1) base case with current asking rents and 4-week void, (2) downside with rents 10 % below asking and 8-week void, (3) upside with 5 % rent growth and 2-week void. Service charges average 12–22 AED per square foot; buildings older than 10 years may run 20–30 % higher. Chiller-free buildings save tenants 3,000–8,000 AED per year on cooling, which lets you charge slightly higher rent. Factor in 5 % agency commission on each new tenancy, landlord insurance at 500–1,500 AED per year, and a maintenance reserve of 2–3 % of annual rent.`;

replace('compare/dubai-vs-oman-rental-yield', C6_OLD,
  `Oman-specific yield modelling: Muscat gross yields average 5.5–7.5 % versus Dubai's 5–8 % for comparable apartment classes. Oman's advantage is lower entry cost — a 2-bed in Al Mouj starts at OMR 65,000 (roughly 620,000 AED) versus AED 900,000+ for a similar unit in Dubai Marina. However, Oman caps foreign ownership to designated ITC zones, and rental demand is thinner. Model your Oman scenario with a 6–8 week void period (vs 3–4 weeks in Dubai) and 3 % service charges as a share of purchase price. Annual property tax in Oman: 3 % of rental value for commercial, residential currently exempt.`);

replace('compare/dubai-vs-saudi-rental-yield', C6_OLD,
  `Saudi-specific yield modelling: Riyadh gross yields sit at 5–7 % for apartments near KAFD/Olaya and 4–6 % in Jeddah. Entry prices are lower — a 2-bed apartment in northern Riyadh starts at SAR 500,000 (roughly 490,000 AED) versus AED 900,000+ for Dubai Marina equivalents. Saudi white-land tax (2.5 % on undeveloped plots) indirectly supports supply, but Vision 2030 megaprojects keep demand volatile. Model Saudi void periods at 6–10 weeks (tenant turnover is slower) and budget 5–8 % of annual rent for maintenance — older Saudi stock often lacks the build quality of UAE Grade-A towers.`);

replace('compare/rak-vs-dubai-rental-yield', C6_OLD,
  `Ras Al Khaimah-specific yield modelling: RAK gross yields average 7–10 % — higher than Dubai's 5–8 % — driven by lower purchase prices. A 1-bed apartment in Al Hamra Village starts at AED 280,000 versus AED 600,000+ in JVC. RAK's Wynn resort (opening 2027) is expected to add 5,000+ hospitality jobs, boosting rental demand in Al Marjan Island and neighbouring areas. Model RAK void periods at 4–6 weeks; service charges average 8–14 AED per square foot (30–40 % below Dubai equivalents). RAK currently has no municipality fee on rental contracts, saving landlords the 5 % Dubai charges.`);

// ============================================================
console.log(`\n=== Done. ${changed} replacements applied. ===`);
