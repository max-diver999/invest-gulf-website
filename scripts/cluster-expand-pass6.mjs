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
  'motor-city-property-investment': `Link school bus routes to [schools near Arabian Ranches](/guides/schools-near-arabian-ranches/) when marketing Green Community townhouses — family tenants search by bus stop name, not Dubailand polygon.`,
  'the-valley-dubai-property-investment': `Underwrite handover delays at **one extra year** of service charge and mortgage interest before first Ejari — DP phases with under 70% occupancy rarely hit broker yield promises in year one.`,
  'bahrain-driving-license': `
## Theory test prep — English-language resources

Driving institutes bundle **highway code book**, practice tests, and yard sessions. If English theory is weak, pay for translated summary sheets approved by institute — GDT questions may still be bilingual ** (confirm)**. Yard test fails often on **parallel park** and **three-point turn** in tight Isa Town lanes — book extra yard hour even if package includes minimum.

Night driving after licence: Manama souq streets are narrow; Amwaj roads better lit. Keep **reflective triangle** and first-aid kit — police checks occur after accidents.

Corporate fleet drivers: some employers register vehicles in company name — ensure personal GDT licence still updated; company insurance may not cover personal weekend accidents ** (confirm policy)**.`,
  'bahrain-family-visa': `
## School waitlist strategy (Manama 2026)

Apply to **two schools minimum** before housing finalised: one reach (British tier-1) and one confirm (CBSE or mid-tier British). Pay registration deposit only when refund policy is written — "non-refundable" is standard on popular seats.

LMRA filing after school offer: PRO needs **offer letter with student name matching passport** — typos delay weeks. Arabic name transliteration mismatches between passport and birth cert are frequent — fix at embassy before arrival.

Teen dependants: secondary placement harder than primary — verify Year 7 seat exists before signing lease in Seef far from school bus route.`,
  'bahrain-healthcare-guide': `
## Specialist referral pathway

GP → referral letter → specialist appointment often **2–4 weeks** for non-urgent cases. Private hospitals compete on MRI wait times — ask insurer which centres are pre-approved for imaging.

Pharmacy chain differences: some accept insurance direct billing on premium tiers; others cash-only then reclaim — ask pharmacist before opening expensive brand-name drugs.

Home country treatment while on vacation: travel insurance for trips is separate — do not cancel UK NHS without understanding **residency tests** if British.`,
  'bahrain-saudi-bridge-commute': `
## EP office locations vs Bahrain home bases

| EP work hub | Realistic Bahrain base | Off-peak drive |
|---|---|---|
| Khobar business district | Amwaj / Seef | 35–55 min |
| Dammam industrial | Saar / Riffa | 40–65 min |
| Dhahran campus | Amwaj | 45–70 min |

**School constraint:** if children study in Bahrain British curriculum, EP commute is viable; if you need EP American school, live EP — causeway daily with kids in car seats breaks patience fast.

**Fuel strategy:** ARAMCO stations on Saudi side differ in queue; some commuters fill KSA side only for price ** (confirm current rules)**.

**Breakdown on causeway:** keep **Saudi emergency number** and insurer KSA hotline in windshield QR — tow from mid-bridge is slow and expensive.

**Visa run interaction:** do not let visit visa expire while car is in Bahrain garage and job is EP — status and insurance must align every month.`,
  'bahrain-vs-dubai-living': `
## Property investor angle — liquidity comparison

Dubai resale: **Ejari depth**, mortgage market, off-plan exit options. Bahrain freehold: smaller buyer pool but **lower entry** — Amwaj 2BR BHD 120K vs Dubai JVC AED 900K+ equivalent. Capital appreciation in Bahrain is slower; Dubai cycles are sharper post-2020.

If buying primarily for **Golden-style residency**, compare [UAE Golden Visa property](/guides/uae-golden-visa-property/) AED 2M threshold with Bahrain Golden Residence BHD 200K ** (confirm)** — visa utility differs from investment return.

Renting first 12 months in each city before buying reduces wrong-country property mistake — both markets allow quality furnished lets for trial.`,
  'living-amwaj-islands': `
## Property types — who each suits

| Type | Best for | Watch-out |
|---|---|---|
| Lagoon 2BR apt | Couples, small family | SC + marina fees |
| 3BR villa | School family | Garden maintenance |
| Penthouse | Executive | Wind, salt corrosion |
| Ground floor | Elderly | Privacy, humidity |

Investors: lagoon apartments lease faster than marina walk units to **causeway commuters** wanting lock-and-leave; villas lease to school families on 24-month terms with lower void if bus confirmed.`,
  'living-seef-bahrain': `
## Seef corporate lease market

Many towers target **single expat on housing allowance** — 12-month corporate leases dominate. Family-sized 3BR in Seef is scarce; those units lease to **diplomatic or senior bank** profiles at premia.

Furniture: Nordic-style furnished packs common — inspect mattress and AC age; negotiate replacement before signing.

Building management: save **facility manager WhatsApp** — AC leaks in summer need same-day response or mould follows within 48 hours in humid units.`,
};
for (const [s, b] of Object.entries(P)) {
  const p = join(ROOT, s + '.mdx');
  let r = readFileSync(p, 'utf8');
  r = ins(r, b);
  writeFileSync(p, r);
  console.log(s, r.split('---').slice(2).join('---').split(/\s+/).filter(Boolean).length);
}
