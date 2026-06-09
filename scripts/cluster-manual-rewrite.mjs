#!/usr/bin/env node
/**
 * Manual-quality cluster cleanup — strip shared boilerplate, inject unique endings, heroImage.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/guides/', import.meta.url).pathname);

const HERO = {
  'bahrain-driving-license': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80',
  'bahrain-family-visa': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
  'bahrain-healthcare-guide': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
  'bahrain-saudi-bridge-commute': 'https://images.unsplash.com/photo-1544622357-20f1d3392c8d?w=1200&q=80',
  'bahrain-vs-dubai-living': 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80',
  'living-amwaj-islands': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'living-seef-bahrain': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'relocate-bahrain': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'bahrain-golden-residence': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
  'bahrain-relocation-guide': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'manama-cost-of-living': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'al-furjan-property-investment': 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80',
  'dubai-production-city-property-investment': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  'dubai-silicon-oasis-property-investment': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  'motor-city-property-investment': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
  'mudon-property-investment': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  'the-valley-dubai-property-investment': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  'villanova-property-investment': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  'palm-jumeirah-property-investment': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
  'amwaj-islands-property-investment': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'schools-near-arabian-ranches': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  'schools-near-dubai-hills': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  'schools-near-dubai-marina': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  'schools-near-jvc': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  'how-to-choose-school-dubai': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  'dammam-khobar-property-investment': 'https://images.unsplash.com/photo-1566073771259-6a8506099925?w=1200&q=80',
  'jeddah-property-investment': 'https://images.unsplash.com/photo-1566073771259-6a8506099925?w=1200&q=80',
  'manama-property-investment': 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'muscat-al-mouj-property-investment': 'https://images.unsplash.com/photo-1586724237569-f3d0c1f98c02?w=1200&q=80',
  'muscat-qurum-property-investment': 'https://images.unsplash.com/photo-1586724237569-f3d0c1f98c02?w=1200&q=80',
};

const ENDINGS = {
  'bahrain-driving-license': `## After you collect your GDT licence

Keep conversion receipts with your CPR file — employers and insurers ask for them at renewal. If you plan daily Saudi commutes, confirm **causeway insurance extension** in writing before your first crossing; standard third-party Bahrain cover often excludes KSA unless endorsed.

Book practical training only with **GDT-licensed schools**; private instructors without accreditation do not count toward test clearance. For family households, budget a second conversion once dependants receive CPR — see [Bahrain family visa](/guides/bahrain-family-visa/).

---

**Related reading:** [Bahrain–Saudi bridge commute](/guides/bahrain-saudi-bridge-commute/) · [Living on Amwaj Islands](/guides/living-amwaj-islands/) · [Relocate to Bahrain hub](/guides/relocate-bahrain/).`,

  'bahrain-family-visa': `## Family visa timing that actually works

LMRA will not register dependants without attested marriage and birth certificates **and** a lease registered at the municipality. Sequence matters: CPR for primary visa holder → attested documents → family visa application → school seat letter → housing contract. Skipping the school step before signing a 12-month lease is how families end up in Seef towers with a 40-minute school run.

If your employer PRO is slow in August, escalate early — waiting until week three of the school year burns deposits on both housing and tuition.

---

**Related reading:** [Bahrain driving licence](/guides/bahrain-driving-license/) · [Manama cost of living](/guides/manama-cost-of-living/) · [Relocate to Bahrain](/guides/relocate-bahrain/).`,

  'bahrain-healthcare-guide': `## Choosing hospitals before you need one

Download your insurer app on arrival day and confirm **in-network hospitals** for your tier — "international cover" marketing does not always include the private hospital nearest Seef. Paediatric GP selection matters for school medical forms; dental and maternity waiting periods are commonly excluded on basic employer plans.

For emergencies dial **999**; for elective procedures get **pre-authorisation** in the app to avoid five-figure bills.

---

**Related reading:** [Manama cost of living](/guides/manama-cost-of-living/) · [Living in Seef](/guides/living-seef-bahrain/) · [Bahrain relocation guide](/guides/bahrain-relocation-guide/).`,

  'bahrain-saudi-bridge-commute': `## Causeway commute — test before you lease

Run **two Sunday mornings at 06:30** from your shortlisted address to your Saudi office pin. Maps off-peak lie; queue length varies with Saudi weekend travel and holiday periods. Budget **45–90 minutes** gate-to-gate in peak season even though the drive is only ~30 km.

Insurance: verify **KSA extension** on your Bahrain policy; accidents on the causeway without it void claims. Some EP workers reverse-commute from [Amwaj](/guides/living-amwaj-islands/) — compare rent saved vs weekly queue hours.

---

**Related reading:** [Bahrain driving licence](/guides/bahrain-driving-license/) · [Dammam–Khobar property](/guides/dammam-khobar-property-investment/) · [Gulf expat living comparison](/guides/gulf-expat-living-comparison/).`,

  'bahrain-vs-dubai-living': `## Who should pick Bahrain over Dubai

Choose Bahrain when **monthly burn** matters more than brand-name schools and when your job sits in **Manama finance** or **causeway-adjacent EP** roles. Choose Dubai when you need **deepest school choice**, daily metro, or resale liquidity on a 24-month horizon.

Neither is "better" — compare net lifestyle cost: Bahrain rent + car + AC vs Dubai rent + metro + higher tuition. Model both in [Manama COL](/guides/manama-cost-of-living/) and [Dubai COL](/guides/dubai-cost-of-living-guide/).

---

**Related reading:** [Relocate to Bahrain](/guides/relocate-bahrain/) · [Dubai vs Abu Dhabi living](/guides/dubai-vs-abu-dhabi-living/) · [Gulf schools comparison](/guides/gulf-schools-comparison/).`,

  'living-amwaj-islands': `## Amwaj daily life — what investors miss

Amwaj feels resort-like but runs on **car logistics**: grocery runs, school buses, and causeway commutes all need parking and AC budget. Marina walkability is real within the island; everything off-island is a drive. Rental demand is **family-heavy** — 12-month leases with August renewals dominate.

For property investors, underwrite **5–6.5% gross** with full service-charge load; do not copy Dubai Marina yield tables.

---

**Related reading:** [Amwaj Islands property investment](/guides/amwaj-islands-property-investment/) · [Bahrain–Saudi commute](/guides/bahrain-saudi-bridge-commute/) · [Manama cost of living](/guides/manama-cost-of-living/).`,

  'living-seef-bahrain': `## Seef for finance professionals

Seef wins on **walk-to-bank** convenience and tower amenities; it loses on green space and school proximity. Couples and pre-school families tolerate it; school-age families often move to Amwaj or Saar within 18 months — factor turnover into rental underwriting.

Parking in older towers can be tight; confirm **two spaces** before signing if dual-income household.

---

**Related reading:** [Manama cost of living](/guides/manama-cost-of-living/) · [Living on Amwaj](/guides/living-amwaj-islands/) · [Bahrain healthcare guide](/guides/bahrain-healthcare-guide/).`,

  'bahrain-golden-residence': `## Golden Residence vs employment visa

Golden Residence is an **investment track** — separate from salary visa, separate from driving licence class, separate from tax residency elsewhere. Verify current **BHD 200,000** threshold, eligible asset classes, and annual maintenance with licensed counsel before transferring capital.

Property in designated zones may qualify but **title + valuation + LMRA filing** must align — verbal developer promises are not evidence.

---

**Related reading:** [Bahrain property for foreigners](/guides/bahrain-property-foreigner/) · [Relocate to Bahrain](/guides/relocate-bahrain/) · [Gulf residency by investment](/guides/gulf-residency-by-investment-guide/).`,

  'bahrain-relocation-guide': `## Week-one checklist (Bahrain-specific)

| Day | Action |
|---|---|
| 1 | CPR appointment booked; 999 saved |
| 2–3 | Municipality lease registration started |
| 4–5 | Bank intro letter submitted |
| 7 | GDT eye test if driving |
| 14 | School seat deposit or waitlist in writing |

This guide is the **detailed relocation manual**; for a shorter decision framework see [Relocate to Bahrain](/guides/relocate-bahrain/).

---

**Related reading:** [Manama cost of living](/guides/manama-cost-of-living/) · [Bahrain family visa](/guides/bahrain-family-visa/) · [Bahrain Golden Residence](/guides/bahrain-golden-residence/).`,

  'manama-cost-of-living': `## Manama budget worksheet (2026 indicative)

| Line | Single professional | Family of four |
|---|---|---|
| Rent (Seef 1BR / Amwaj 3BR) | BHD 450–650 | BHD 900–1,400 |
| EWA + AC summer | BHD 80–120 | BHD 150–250 |
| Car + fuel | BHD 120–180 | BHD 200–280 |
| Groceries | BHD 150–220 | BHD 350–500 |
| School (if applicable) | — | BHD 400–800 |

Add **10% contingency** for Ramadan hours, causeway tolls, and insurance co-pays — Bahrain looks cheap until August AC and school invoices land together.

---

**Related reading:** [Living in Seef](/guides/living-seef-bahrain/) · [Living on Amwaj](/guides/living-amwaj-islands/) · [Bahrain vs Dubai living](/guides/bahrain-vs-dubai-living/).`,
};

const DUBAI_AREA_BRIDGE = `---

**Dubai-wide transaction maths:** DLD 4%, trustee, and mortgage stress tests are identical across emirates-freehold communities — model them once in [cost of buying property in Dubai](/guides/cost-of-buying-property-dubai/). The sections below are **community-specific** to this guide.

`;

const BAHRAIN_STACK = '## Related guides in the Bahrain stack';
const BAHRAIN_EXTENDED = '## Extended planning — employer and PRO coordination';
const DUBAI_TX = '## Transaction cost stack — every purchase';
const DUBAI_PRACTICAL = '## Practical decision filter for Dubai planning';

function stripDuplicateSection(body, heading) {
  const first = body.indexOf(heading);
  if (first === -1) return body;
  const second = body.indexOf(heading, first + heading.length);
  if (second === -1) return body;
  return body.slice(0, second).trimEnd();
}

function stripFromMarker(body, marker, unlessSlug, slug) {
  if (unlessSlug && slug === unlessSlug) return body;
  const idx = body.indexOf(marker);
  if (idx === -1) return body;
  return body.slice(0, idx).trimEnd();
}

function stripDubaiGenericBlock(body) {
  const start = body.indexOf(DUBAI_TX);
  const practical = body.indexOf(DUBAI_PRACTICAL);
  if (start === -1 || practical === -1 || practical <= start) return body;
  return body.slice(0, start).trimEnd() + DUBAI_AREA_BRIDGE + body.slice(practical);
}

function stripSchoolsDupes(body) {
  body = body.replace(/\\n/g, '\n');
  const m = body.match(/## [^\n]+ school-route reality check/);
  if (!m) return body;
  const h = m[0];
  const first = body.indexOf(h);
  const second = body.indexOf(h, first + h.length);
  if (second > -1) body = body.slice(0, second).trimEnd();
  const m2 = body.match(/## Local scenario test/);
  if (m2) {
    const h2 = m2[0];
    const f1 = body.indexOf(h2);
    const f2 = body.indexOf(h2, f1 + h2.length);
    if (f2 > -1) body = body.slice(0, f2).trimEnd();
  }
  return body;
}

function stripCityCheckDupes(body, slug) {
  const marker = '| Check | Why it matters |';
  const idx = body.indexOf(marker);
  if (idx === -1) return body;
  const before = body.slice(0, idx);
  const after = body.slice(idx);
  const city =
    slug.includes('dammam') ? 'Dammam–Khobar' :
    slug.includes('jeddah') ? 'Jeddah' :
    slug.includes('manama') ? 'Manama' :
    slug.includes('mouj') ? 'Al Mouj Muscat' :
    slug.includes('qurum') ? 'Qurum Muscat' : 'this market';
  const unique = `## ${city} — final underwriting checks

Before you wire a deposit, confirm **zone-level foreign ownership**, **actual service charges** on the last three years of accounts, and **three Ejari- or market-comparable leases** in the same building — not portal asking rents.

| ${city} check | Why it matters here |
|---|---|
| Title type (freehold vs usufruct) | ${slug.includes('manama') ? 'Bahrain freehold zones differ by island' : slug.includes('jeddah') || slug.includes('dammam') ? 'Saudi REGA designated zones only' : 'Muscat ITC vs freehold product mix'} |
| Tenant employer mix | ${slug.includes('dammam') ? 'Aramco-corridor tenants vs generic expat' : slug.includes('jeddah') ? 'Vision 2030 professional vs hospitality' : slug.includes('manama') ? 'Finance vs causeway commuters' : 'Tourism vs long-stay residents'} |
| Exit liquidity | ${slug.includes('muscat') ? '90–180 days typical for premium villas' : slug.includes('manama') ? '60–120 days in Amwaj/Seef' : 'REGA market still thinner — 120+ days'} |
| Currency repatriation | Document rental repatriation path before closing |

`;
  return before.trimEnd() + '\n\n' + unique + after.slice(after.indexOf('\n\n', 20) + 2);
}

function addHero(fmRaw, slug) {
  const url = HERO[slug];
  if (!url || /\nheroImage:/.test(fmRaw)) return fmRaw;
  return fmRaw.replace(/(\nreadingTime:[^\n]+)/, `$1\nheroImage: "${url}"`) + (/\nupdatedDate:/.test(fmRaw) ? '' : '\nupdatedDate: 2026-06-07');
}

function setUpdated(fmRaw) {
  if (/\nupdatedDate:/.test(fmRaw)) {
    return fmRaw.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-07');
  }
  return fmRaw + '\nupdatedDate: 2026-06-07';
}

const BAHRAIN_SLUGS = new Set(Object.keys(ENDINGS));
const DUBAI_AREA = new Set([
  'al-furjan-property-investment',
  'dubai-production-city-property-investment',
  'dubai-silicon-oasis-property-investment',
  'motor-city-property-investment',
  'mudon-property-investment',
  'the-valley-dubai-property-investment',
  'villanova-property-investment',
  'palm-jumeirah-property-investment',
]);
const SCHOOLS = new Set([
  'schools-near-arabian-ranches',
  'schools-near-dubai-hills',
  'schools-near-dubai-marina',
  'schools-near-jvc',
  'how-to-choose-school-dubai',
]);
const GULF_CITY = new Set([
  'dammam-khobar-property-investment',
  'jeddah-property-investment',
  'manama-property-investment',
  'muscat-al-mouj-property-investment',
  'muscat-qurum-property-investment',
  'amwaj-islands-property-investment',
]);

for (const slug of [
  ...BAHRAIN_SLUGS,
  ...DUBAI_AREA,
  ...SCHOOLS,
  ...GULF_CITY,
]) {
  const path = join(ROOT, slug + '.mdx');
  let raw = readFileSync(path, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;
  let fmRaw = fmMatch[1];
  let body = raw.slice(fmMatch[0].length);

  if (BAHRAIN_SLUGS.has(slug)) {
    if (slug === 'relocate-bahrain') {
      body = stripDuplicateSection(body, '## Planning checklist — 90 days before arrival');
      body = body.replace(/\*Draft v1 2026-06-04[^\n]*\n?/g, '');
    } else {
      body = stripFromMarker(body, BAHRAIN_STACK, null, slug);
      body = stripFromMarker(body, BAHRAIN_EXTENDED, null, slug);
      body = stripDuplicateSection(body, '## Planning checklist — 90 days before arrival');
      body = stripDuplicateSection(body, '## Red flags');
      body = body.replace(/\*Draft v1 2026-06-04[\s\S]*?(?=## |\n---|\*\*Related|\Z)/g, '');
      if (ENDINGS[slug]) body = body.trimEnd() + '\n\n' + ENDINGS[slug];
    }
  }

  if (DUBAI_AREA.has(slug)) body = stripDubaiGenericBlock(body);
  if (SCHOOLS.has(slug)) body = stripSchoolsDupes(body);
  if (GULF_CITY.has(slug)) body = stripCityCheckDupes(body, slug);

  fmRaw = addHero(setUpdated(fmRaw), slug);
  writeFileSync(path, `---\n${fmRaw.trimEnd()}\n---${body}`);
  console.log('rewrote', slug);
}
