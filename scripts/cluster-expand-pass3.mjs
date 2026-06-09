#!/usr/bin/env node
/** Final word-count pass — unique scenario sections per slug */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/guides/', import.meta.url).pathname);

const BLOCKS = {
  'bahrain-driving-license': `
## Worked example: UK licence holder, August arrival

**Week -2 (still in UK):** Renew licence if expiring within 90 days; order international driving permit if you plan a rental car on landing. Scan passport and employment contract for PRO.

**Week 1 in Manama:** CPR biometric appointment; same week book eye test at approved optician (Seef or Riffa malls — many finish in 30 minutes). Do not book GDT conversion until CPR receipt shows correct address matching your lease.

**Week 2:** GDT Isa Town online slot; bring originals, BHD cash for fees, two passport photos per current spec. If converted same day, photograph licence front/back for insurer.

**Week 3:** Insurance quote with **causeway extension** if applicable; register car if purchased; set GDT portal login for fine alerts.

| Step | Cost band (BHD) |
|---|---|
| Eye test | 5–15 |
| Conversion | 20–60 |
| Insurance (annual) | 150–350 |
| Registration / plates | per GDT tariff |

**If conversion fails:** Book driving school package including theory app in English; practical test routes often use Sanabis roundabouts and Sheikh Isa Highway merge — practice merges at 80 km/h flow.

---

## Practical test failure points (examiner patterns)

Examiners commonly mark down: **rolling stops**, **lane drift at roundabouts**, **following too close on highway**, **not checking blind spot on lane change**. One serious fault fails the test — budget two attempts in planning.

Night driving test slots are rare; most tests are daylight. Rain is uncommon but wet roads appear in winter — reduce speed without prompting.

---

## Parking violations and mall garage rules

Seef and City Centre garages use **ticket systems** — lost tickets incur maximum daily charge. Street parking in older Manama requires **municipality SMS payment** where marked — fines camera-enforced in business districts.

`,

  'bahrain-family-visa': `
## Case study: Indian IT professional, spouse + two children

Primary visa holder lands on employment visa; PRO promises family visa in "two weeks" — realistic timeline with attestation is **6–10 weeks**.

| Phase | Action | Risk if skipped |
|---|---|---|
| Pre-arrival | Attest marriage + two birth certs in India | LMRA rejection |
| Week 1–2 | CPR primary | Cannot sponsor |
| Week 3 | Municipality lease in family name | Address mismatch |
| Week 4 | School conditional offer letter | Lease signed too early |
| Week 5–8 | Family visa stamping abroad | Kids miss term start |

**Cost stack (indicative):** attestation USD 200–400; visa fees BHD 100–300 per dependant; school deposit BHD 1,000–3,000 — model in [Manama cost of living](/guides/manama-cost-of-living/).

---

## Employer change mid-family visa

If sponsor changes jobs, dependant visas may need **transfer or reissue** ** (confirm current official rules with LMRA)**. Do not travel on old visa sticker after sponsor cancellation — common cause of border denial.

---

## Domestic worker visa (separate track)

Maid/nanny visas follow **LMRA domestic worker** rules — different salary threshold and housing inspection. Not covered by family visa guide but often requested same week as school start; queue separately.

`,

  'bahrain-healthcare-guide': `
## Employer switch — insurance gap month

When changing jobs, ask both HR teams about **run-out cover** on old policy and **waiting periods** on new. A gap month without insurance for chronic medication is expensive — budget BHD 500–2,000 for interim private consultations if needed.

---

## Hospital shortlist template (fill before emergency)

| Hospital | In-network? | Paediatric ER? | Distance from home |
|---|---|---|---|
| | | | |
| | | | |

Save **999** and insurer **pre-auth number** in phone favourites. Amwaj residents often use **Bahrain Specialist Hospital** or **Awali** options depending on network — verify card back, not brochure.

---

## Dental and optical — almost always extra

Budget **BHD 50–150** per dental cleaning out-of-pocket on basic tiers. Optical allowances appear on **premium** multinational packages only — glasses in Seef malls run BHD 80–250 for basic frames.

`,

  'bahrain-saudi-bridge-commute': `
## Sample weekly commute budget (Amwaj → Khobar office)

| Item | Monthly |
|---|---|
| Fuel (daily return) | BHD 80–140 |
| Causeway toll | per current tariff |
| KSA insurance uplift | BHD 15–40 |
| Vehicle depreciation | BHD 50–100 |
| Time cost (10 hr/wk) | subjective |

If fuel + toll + insurance uplift exceeds **BHD 250/month**, compare renting a small EP apartment for SAR 2,500–3,500 — break-even depends on family size and school location.

---

## Border document wallet

Laminated folder in glove box: CPR copy, employer letter, KSA entry permission, insurance PDF with KSA clause highlighted, emergency contact in Arabic and English.

---

## Ramadan and Eid queue shifts

Working hours compress; causeway peaks **shift earlier**. Test commute during Ramadan before signing 12-month lease assuming January timings.

`,

  'bahrain-vs-dubai-living': `
## Decision matrix — score your household

Rate 1–5 (5 = critical) and multiply by weight:

| Factor | Weight | Bahrain | Dubai |
|---|---|---|---|
| School curriculum fit | ×3 | | |
| Monthly savings | ×2 | | |
| Nightlife / dining | ×1 | | |
| Property resale | ×2 | | |
| Spouse career breadth | ×2 | | |

If school row scores 5 for Dubai and 2 for Bahrain, **Dubai usually wins** regardless of rent savings — do not let BHD 300/month rent delta override GCSE pathway.

---

## Trial itinerary (7 days)

**Days 1–3 Manama/Amwaj:** apartment viewings, school tour, grocery run, one causeway test if EP job.  
**Days 4–7 Dubai JVC or Marina:** equivalent viewings and school tour.  
Compare **sleep quality** (noise, AC bill) not just brochure photos.

`,

  'living-amwaj-islands': `
## Amwaj lease negotiation points

| Clause | Ask for |
|---|---|
| EWA cap | Landlord account vs tenant |
| Marina view premium | 10–15% over lagoon — verify noise |
| Pet policy | Many towers restrict |
| Early exit | 2-month penalty common |

Families with boats: confirm **marina berth** waitlist separately from apartment lease — multi-year queues reported anecdotally.

---

## Hurricane of visitors — when Airbnb neighbours hurt

Some lagoon towers have heavy short-term rental turnover — ask security about **STR frequency** before buying investor unit; family tenants complain about elevator noise on weekends.

`,

  'living-seef-bahrain': `
## Seef 1BR investor — tenant profile script

Target ad copy: "Walking distance to CBB / GIB / BBK towers, basement parking, gym, 12-month lease preferred." Avoid marketing to families with school-age kids unless you price **15–20% below Amwaj** equivalent — they will leave at first school waitlist.

---

## Summer AC bill shock

Tower chiller vs split unit matters — ask previous tenant for **July–August EWA screenshot** before signing. BHD 40/month quote in winter becomes BHD 120+ in August on poorly insulated units.

`,

  'dubai-production-city-property-investment': `
## Studio underwriting — Production City example

**Purchase:** AED 620,000 studio, 450 sq ft, service charge AED 12/sq ft ≈ AED 5,400/yr.  
**Rent:** AED 42,000/yr gross → **6.8% gross** on price.  
**Loaded:** DLD 4% (AED 24,800) year one; management 5%; SC as above → **net ~4.8–5.2%** if void under 3 weeks.

Compare with [JVC property investment](/guides/jvc-property-investment/) studios at similar ticket — Production City wins on yield, JVC on resale depth.

`,

  'motor-city-property-investment': `
## Green Community townhouse — 3BR worked example

**Price:** AED 2.1M · **Rent:** AED 130K · **Gross:** 6.2%  
**SC + garden:** AED 18K–25K/yr · **Net:** ~4.5–5%  
**Days on market (resale):** 90–150 typical for Dubailand villas

Link: [Dubai rental yield guide](/guides/dubai-rental-yield-guide/) for emirate-wide benchmarks.

`,

  'the-valley-dubai-property-investment': `
## Nara vs Eden — phase selection

| Phase | Handover era | Investor note |
|---|---|---|
| Eden early | 2020–22 | Ejari history available |
| Nara | 2022–24 | Verify snagging reports |
| Latest launches | Off-plan | Payment plan only |

Family tenants pay **AED 5–15K** premia for park-facing plots — photograph actual park completion, not render.

`,

  'schools-near-jvc': `
## School shortlist from JVC (2026 distances indicative)

| School | Curriculum | Drive off-peak | Bus common? |
|---|---|---|---|
| Sunmarke | British | 12–18 min | Yes |
| Arcadia | British | 10–15 min | Yes |
| South View | British | 15–22 min | Limited |
| Nord Anglia (Al Barsha) | IB/British | 20–28 min | Some routes |

Always confirm **current KHDA rating** and fee schedule on school site — ratings and fees change annually.

---

## Investor angle — school proximity premium

JVC 2BR with confirmed bus seat to Sunmarke/Arcadia achieves **AED 5–10K** annual rent premia over units west of Sheikh Mohammed bin Zayed Road without bus access — verify with three Ejari comps in same cluster before marketing.

`,
};

for (const [slug, block] of Object.entries(BLOCKS)) {
  const path = join(ROOT, slug + '.mdx');
  let raw = readFileSync(path, 'utf8');
  const marker = '**Related reading:**';
  if (!raw.includes(marker)) continue;
  if (raw.includes(block.trim().slice(20, 60))) continue;
  raw = raw.replace(marker, block.trim() + '\n\n' + marker);
  writeFileSync(path, raw);
  const w = raw.split('---').slice(2).join('---').split(/\s+/).filter(Boolean).length;
  console.log(slug, w);
}
