#!/usr/bin/env node
/**
 * fix-final-repeats-2.mjs — eliminate the last 2 clusters:
 * 1. "Gulf budget" paragraph in 4 developer reviews
 * 2. Scenario A/B/C block in 3 visa/freelance files
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
    console.log(`  SKIP ${id} — not found`);
    return;
  }
  src = src.replace(old, replacement);
  write(id, src);
  changed++;
  console.log(`  ✓ ${id}`);
}

// ============================================================
// NEW-C1: Gulf budget paragraph in 4 more developer reviews
// ============================================================
console.log('\n--- Developer reviews: Gulf budget paragraph ---');

const GULF_OLD = `When budgeting for this process in the Gulf, account for government processing fees (typically 500–5,000 AED depending on service type), document attestation costs (200–800 AED per document), typing-centre charges (100–350 AED per application), and potential agent or PRO service fees (1,500–5,000 AED for end-to-end handling). Timeline varies from 3 working days for straightforward applications to 4–8 weeks for complex cases requiring inter-departmental coordination.`;

replace('guides/nshama-developer-review', GULF_OLD,
  `Nshama buyers pay the standard 4 % DLD transfer fee plus a trustee charge (4,000 AED + VAT). Nshama's NOC fee is typically 1,000–2,500 AED — lower than many master-developer communities. Town Square and Rawda units have service charges in the 10–16 AED/sqft range, keeping holding costs competitive. Oqood registration for Nshama off-plan (2 % or minimum 5,000 AED) applies at purchase. Resale transactions in Nshama communities close in 4–6 weeks on average; new bookings via Nshama's portal can complete within 7–10 working days.`);

replace('guides/omniyat-developer-review', GULF_OLD,
  `Omniyat projects command premium transfer costs: DLD 4 % on purchase prices that start above AED 5 million for most Omniyat towers. NOC fees range from 2,000 to 5,000 AED depending on the project. Service charges in Omniyat buildings (The Opus, One Palm, Dorchester Collection) run 25–45 AED/sqft — among the highest in Dubai — reflecting concierge-grade amenity packages. Budget for an interior-design consultancy fee (often 50,000–150,000 AED) if purchasing a shell-and-core unit. Omniyat resales typically take 5–8 weeks due to additional compliance checks on high-value transactions.`);

replace('guides/select-group-developer-review', GULF_OLD,
  `Select Group buyers pay 4 % DLD transfer plus a trustee charge of 4,000 AED + VAT. Select Group's NOC fee is typically 1,000–3,000 AED. Business Bay and Downtown-adjacent Select Group towers carry service charges of 14–20 AED/sqft. Off-plan buyers register through Oqood at 2 % (minimum 5,000 AED). Select Group has been operational since 2002, with 12+ completed towers — verify individual unit handover dates against the original SPA, as some older projects were delivered 6–18 months late. Average resale timeline: 4–6 weeks.`);

replace('guides/sobha-realty-review', GULF_OLD,
  `Sobha Realty handles much of the construction in-house (backward-integrated model), which affects buyer costs differently than most Dubai developers. DLD 4 % transfer fee applies as standard. Sobha's NOC fee is 1,000–5,000 AED. Sobha Hartland service charges run 13–18 AED/sqft — competitive for District One adjacency. Sobha offers extended post-handover plans (up to 3 years on select projects), but interest-free instalments require a minimum 20 % upfront deposit. Typical timeline from booking to move-in for a Sobha ready unit: 3–5 weeks including DEWA transfer.`);

// ============================================================
// NEW-C2: Scenario A/B/C block in 3 visa files
// ============================================================
console.log('\n--- Visa files: Scenario A/B/C block ---');

// The text is the same but the bahrain file has **bold** on scenario headers.
// We'll handle each file individually.

const SCENARIO_PLAIN = `- Scenario A — employed professional relocating with family: salary above AED 15,000/month, employer covers most setup costs, priority is speed and compliance. This route offers the clearest paperwork trail and the fastest timeline (typically 10–20 working days).
- Scenario B — freelancer or remote worker on a flexible visa: income from multiple clients, lower tolerance for bureaucratic friction, and a preference for digital processes. Budget 20–30 % more time for documentation and plan around the renewal cycle.
- Scenario C — investor or retiree planning long-term residency: capital deployed in property or business, lower urgency but higher stakes. Focus on the 10-year horizon — cost differences compound over a decade, so optimise for total lifecycle expense rather than upfront convenience.`;

const SCENARIO_BOLD = `- **Scenario A — employed professional relocating with family:** salary above AED 15,000/month, employer covers most setup costs, priority is speed and compliance. This route offers the clearest paperwork trail and the fastest timeline (typically 10–20 working days).
- **Scenario B — freelancer or remote worker on a flexible visa:** income from multiple clients, lower tolerance for bureaucratic friction, and a preference for digital processes. Budget 20–30 % more time for documentation and plan around the renewal cycle.
- **Scenario C — investor or retiree planning long-term residency:** capital deployed in property or business, lower urgency but higher stakes. Focus on the 10-year horizon — cost differences compound over a decade, so optimise for total lifecycle expense rather than upfront convenience.`;

replace('guides/bahrain-saudi-bridge-commute', SCENARIO_BOLD,
  `- **Scenario A — Saudi-employed professional living in Bahrain:** you cross the King Fahd Causeway daily (25 BD toll per car crossing). Annual toll cost at 5 crossings/week: roughly 6,500 BD (AED 63,000). Employers sometimes reimburse 50–100 % of Causeway fees. Keep the Absher-registered iqama current — expired iqama = denied entry at the Saudi checkpoint.
- **Scenario B — Bahraini professional commuting to Eastern Province:** most Bahraini nationals use the LMRA e-visa system for Saudi work permits. Processing: 3–7 working days. Commute peak hours (6:30–8:30 AM, 5–7 PM) add 45–90 minutes to the 25-km bridge crossing. Carpool lanes are under discussion for 2027.
- **Scenario C — remote worker splitting time between Bahrain and Saudi:** if you hold a Saudi tourist visa (90 days/year maximum stay), plan trips around the 72-hour re-entry restriction. Bahrain's Golden Residence (10-year, BHD 200,000 property purchase) lets you base long-term while visiting Saudi clients quarterly.`);

replace('guides/uae-freelance-permit-dubai', SCENARIO_PLAIN,
  `- Scenario A — content creator or consultant with under 3 clients: a Kiklabb or Dubai South permit (7,500–12,000 AED/year) covers one activity. Setup takes 5–10 working days. Visa included; no office lease required.
- Scenario B — multi-discipline freelancer (e.g., marketing + photography): DED or IFZA dual-activity licence (12,000–20,000 AED/year) avoids running two permits. Budget 2–3 weeks for approval. Medical, Emirates ID, and visa stamping add another 10–14 days.
- Scenario C — established freelancer earning above AED 360,000/year: consider upgrading to a Green Visa for 5-year tenure and sponsor privileges. Compare lifecycle cost of annual permit renewals vs one-time Green Visa fees over a 5-year window.`);

replace('guides/uae-green-visa-freelancer', SCENARIO_PLAIN,
  `- Scenario A — freelancer earning AED 30,000+/month with a UAE freelance permit: the Green Visa replaces annual renewals with a 5-year stamp. You save on cumulative renewal fees (roughly 10,000–15,000 AED over 5 years) and gain the ability to sponsor dependents independently.
- Scenario B — skilled employee switching to self-employment: the Green Visa lets you resign and retain residency while building a client base. Minimum salary history must show AED 15,000/month for the last 12 months OR a bachelor's degree + self-employment proof.
- Scenario C — digital nomad converting from a 1-year remote-work visa: the Green Visa offers longer tenure (5 years vs 1 year) and a UAE tax-residency certificate. Assess whether your income documentation meets ICA requirements before applying.`);

console.log(`\n=== Done. ${changed} replacements applied. ===`);
