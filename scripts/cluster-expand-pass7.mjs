#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = decodeURIComponent(new URL('../src/content/guides/', import.meta.url).pathname);
function ins(raw, b) {
  for (const m of ['**Related reading:**', '*Invest Gulf Editorial —', '*Invest Gulf Editorial*'])
    if (raw.includes(m)) return raw.replace(m, b.trim() + '\n\n' + m);
  return raw + b;
}
const P = {
  'bahrain-driving-license': `Final tip: photograph every GDT receipt — PRO audits and licence renewal both ask for payment proof years later.`,
  'motor-city-property-investment': `Verify **Dubailand master community fee** separately from building SC — some Motor City clusters bill both lines on annual statement.`,
  'bahrain-family-visa': `
## Dual-nationality children

If child holds two passports, LMRA may require **both** presented at stamping — align name spelling across passports and birth cert before PRO submission. Visa sticker goes in passport used for entry; keep second passport for school registration only if names match exactly.

**Nanny on family visa:** domestic worker visa is separate application with housing inspection — do not assume family visa bundle includes helper.`,
  'bahrain-healthcare-guide': `
## Chronic condition imports

Diabetes, asthma, and hypertension patients should bring **6-month medication supply** plus prescription letters for customs. Register with GP within 14 days to localise prescriptions — some brands differ by manufacturer in GCC pharmacies.

**Optical:** bring last two prescriptions; progressive lenses in Seef opticians cost BHD 120–280 depending on frame tier.`,
  'bahrain-saudi-bridge-commute': `
## Weather and visibility

Summer heat haze and winter shamal dust reduce visibility on causeway — reduce speed below posted limit when yellow hazard lights active. Accidents in fog rare but severe; check weather app before 06:00 departure.

**Carpool formalities:** if sharing car with colleague, insurer may require named driver list — undeclared driver voids claim ** (confirm policy)**.

**Electric vehicles:** charging network thinner in EP corridor — range plan if considering EV commute from Amwaj.

**Holiday calendar:** Saudi National Day and Eid shift queues — employer may grant remote days; use to avoid peak cross-border days when possible.`,
  'bahrain-vs-dubai-living': `
## Remote work nuance

Dubai remote-work visa targets global earners; Bahrain employment visa assumes local sponsor. If income is **fully remote foreign employer**, tax and visa rules differ — do not assume Dubai remote visa applies in Manama without counsel.

**Social networks:** Dubai meetup density higher for entrepreneurs; Bahrain finance WhatsApp groups dominate — pick city by professional network not weather alone.`,
  'living-amwaj-islands': `
## Utilities and chiller

Amwaj towers often use **district cooling or building chiller** — summer bills spike June–September. Ask for last tenant's **May and August** EWA statements; lagoon-facing units pay more for dehumidification load.

**Pest control:** lagoon proximity means mosquito management — buildings spray common areas; villas need garden treatment contract.

**Investor furnishing:** family tenants expect washer/dryer and maid room in 3BR villa — unfurnished without white goods sees 30+ day longer void.`,
  'living-seef-bahrain': `
## Seef vs Manama souq — lifestyle split

Many Seef residents drive to **Manama Souq** monthly for spices and bargains — factor car cost if choosing Seef to "avoid driving." Walking score is high for finance errands but low for authentic grocery savings.

**Tower age and resale:** buyers discount towers with **known lift outage history** — ask facility manager for last 12-month lift maintenance log before purchasing investor unit.

**Corporate relocation packages:** if employer offers Seef tower housing, negotiate **parking slot count** and **utility cap** before accepting — packages assume single tenant not family of four.

**Weekend noise:** ground-floor retail with live music affects floors 1–8 — inspect Friday 21:00 before signing.

**Investment hold period:** Seef 1BR flips underperform Amwaj 2BR on 24-month hold — Seef suits **long hold income** not quick capital gain.`,
};
for (const [s, b] of Object.entries(P)) {
  const p = join(ROOT, s + '.mdx');
  let r = readFileSync(p, 'utf8');
  r = ins(r, b);
  writeFileSync(p, r);
  console.log(s, r.split('---').slice(2).join('---').split(/\s+/).filter(Boolean).length);
}
