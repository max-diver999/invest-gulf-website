#!/usr/bin/env node
/** Append unique expansions to thin cluster articles + unique Dubai bridge lines */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/guides/', import.meta.url).pathname);

const BRIDGES = {
  'al-furjan-property-investment':
    '**Al Furjan note:** Nakheel metro-linked apartments often trade at AED 900–1,200/sqft ready — budget **~6.7% all-in** on a AED 1.8M 2BR (DLD 4% + trustee ~AED 4K). Full fee tables: [cost of buying property Dubai](/guides/cost-of-buying-property-dubai/).',
  'dubai-production-city-property-investment':
    '**Dubai Production City note:** Studio-heavy stock means lower ticket but thinner resale — on AED 650K entry, DLD fees alone are ~AED 26K. Model loaded yield in [Dubai rental yield guide](/guides/dubai-rental-yield-guide/).',
  'dubai-silicon-oasis-property-investment':
    '**Silicon Oasis note:** Free-zone adjacency supports tech-tenant demand; on AED 1.1M 1BR, all-in acquisition ~AED 1.17M with standard DLD stack — see [cost of buying property Dubai](/guides/cost-of-buying-property-dubai/).',
  'motor-city-property-investment':
    '**Motor City note:** Dubailand villa and apt mix — verify **service charge per sq ft** before using gross yield; DLD 4% on AED 1.5M = AED 60K. Hub: [Dubai property investment guide](/guides/dubai-property-investment-guide/).',
  'mudon-property-investment':
    '**Mudon note:** Townhouse buyers at AED 2.2M should reserve **AED 145K+** for DLD, trustee, and agent in year one — family tenants care about school bus, not fee tables. Reference: [cost of buying property Dubai](/guides/cost-of-buying-property-dubai/).',
  'the-valley-dubai-property-investment':
    '**The Valley note:** Newer DP phases carry handover risk — escrow and snagging before you add DLD 4% on SPA value. Compare loaded cost vs [Arabian Ranches](/guides/arabian-ranches-property-investment/) resale liquidity.',
  'villanova-property-investment':
    '**Villanova note:** Smaller community than Mudon — thinner Ejari history but similar DLD fee stack on AED 1.7–2.4M townhouses. See [cost of buying property Dubai](/guides/cost-of-buying-property-dubai/) for transaction maths.',
};

const OLD_BRIDGE =
  '**Dubai-wide transaction maths:** DLD 4%, trustee, and mortgage stress tests are identical across emirates-freehold communities — model them once in [cost of buying property in Dubai](/guides/cost-of-buying-property-dubai/). The sections below are **community-specific** to this guide.';

for (const [slug, text] of Object.entries(BRIDGES)) {
  const path = join(ROOT, slug + '.mdx');
  let raw = readFileSync(path, 'utf8');
  if (raw.includes(OLD_BRIDGE)) {
    raw = raw.replace(OLD_BRIDGE, text);
    writeFileSync(path, raw);
    console.log('bridge', slug);
  }
}

const EXPANSIONS = {
  'bahrain-driving-license': `

## GDT Isa Town — what happens on appointment day

Arrive with **CPR**, passport, original home licence, and **eye-test certificate** (usually same-day at approved opticians near Seef or Riffa). GDT Isa Town processes conversions in batches — morning slots fill first in August when new expats arrive.

| Document | Common rejection reason |
|---|---|
| Home licence | Expired or laminate unreadable |
| Translation | Not from approved translator |
| CPR | Address mismatch vs utility bill |
| Photos | Wrong background spec |

If conversion is denied, you enter the **school queue** for theory — waiting lists stretch 2–6 weeks in peak season. Book a driving institute package that includes **highway and roundabout modules**; examiners fail candidates who hesitate at multi-lane roundabouts near Sanabis.

---

## Roundabouts, speed cameras, and causeway etiquette

Bahrain driving culture is **assertive at roundabouts** — signal early and hold lane. Speed cameras are dense on Sheikh Isa Bin Salman Highway and King Faisal Highway; fines post to GDT online within days.

Causeway driving: keep **left lane** unless overtaking; Friday evening queues toward Saudi can exceed 90 minutes — not a licence issue but affects whether Amwaj vs Seef housing works for EP commuters.

---

## Car ownership vs long-term taxi (2026 math)

| Option | Monthly indicative | Best for |
|---|---|---|
| Small sedan owned | BHD 120–180 (fuel, insurance, parking) | Amwaj, Saar, Riffa families |
| Taxi / ride-hail only | BHD 80–200 depending on commute | Seef towers, no school run |
| One car + spouse GDT | Add BHD 40–80 insurance | Dual-income households |

Heat makes **AC maintenance non-optional** — budget BHD 30–60 quarterly service in summer.

---

## Insurance and Saudi extension — document checklist

Before first causeway trip obtain written confirmation that **KSA third-party liability** is active. Standard Bahrain policies often exclude Saudi territory unless endorsed — accidents without endorsement void claims on both sides of the bridge.

Comprehensive cover is advisable for financed vehicles; banks require it for auto loans ** (confirm current official rules with lender)**.

`,

  'bahrain-family-visa': `

## LMRA dependant visa — document attestation chain

Marriage and birth certificates typically require:

1. Notary in home country  
2. Foreign ministry apostille  
3. Bahrain embassy attestation  
4. LMRA submission with **salary certificate** meeting dependant threshold ** (confirm current official rules)**

Start attestation **before** resigning overseas jobs — the chain takes 3–8 weeks depending on country.

| Dependent | Extra document |
|---|---|
| Spouse | Attested marriage cert |
| Child | Attested birth cert + passport |
| Parent | Proof of dependency ** (confirm current official rules)** |

---

## School seat before housing — why order matters

International schools in Bahrain issue **conditional offers** that expire if CPR is delayed. Signing a 12-month Seef lease before a written seat offer is the most common family relocation mistake.

Budget **BHD 2,000–8,000** annual tuition deposits plus registration — see [Gulf schools comparison](/guides/gulf-schools-comparison/) for curriculum trade-offs.

---

## PRO escalation playbook

If employer PRO is unresponsive:

| Week | Action |
|---|---|
| 1 | Email HR + PRO with LMRA checklist attached |
| 2 | Request written timeline for CPR appointment |
| 3 | Escalate to HR director with school start date |
| 4 | Consider PRO agency fee (BHD 100–300) for family file |

Finance-sector employers usually move faster when **compliance** is copied on emails — CBB-regulated banks fear LMRA penalties for delayed registrations.

`,

  'bahrain-healthcare-guide': `

## Public vs private care — when each makes sense

**Salmaniya Medical Complex** handles emergencies for all residents; expats with employer insurance still use private hospitals for elective care to avoid queue times.

| Scenario | Typical route |
|---|---|
| Chest pain / trauma | 999 → nearest ER |
| Paediatric fever | Private paediatric clinic if in-network |
| Maternity | Plan hospital 6+ months ahead |
| Dental | Almost always out-of-pocket |

---

## Insurance tiers employers hide in PDF footnotes

Ask HR for the **Table of Benefits** not the marketing one-pager:

| Tier signal | Meaning |
|---|---|
| Network list < 5 hospitals | You'll pay out-of-network often |
| Co-pay 20% on outpatient | Budget BHD 30–80 per visit |
| Mental health excluded | Common on basic packages |
| Geographic limit | Confirm Saudi causeway accidents |

---

## Chronic conditions and prescriptions

Bring **3-month supply** of maintenance meds plus prescription letters — Bahrain pharmacies recognize many international brands but not all dosages. Register with a **GP clinic** in week two for repeat prescriptions; walk-in refills without file are harder.

`,

  'bahrain-saudi-bridge-commute': `

## King Fahd Causeway — peak patterns

| Window | Queue behaviour |
|---|---|
| Thu 15:00–23:00 | Saudi weekend outbound heavy |
| Sun 06:00–09:00 | Return to Bahrain for work week |
| Public holidays | Unpredictable — test twice |
| Ramadan evenings | Shorter queues midday, longer after iftar |

Use **Saudi entry permission** apps and keep passport valid 6+ months — border officers reject damaged scan pages.

---

## Housing arbitrage: Bahrain rent vs EP salary

Many Aramco-corridor workers live in **Amwaj or Seef** and commute to Khobar/Dammam:

| Line | Bahrain side | EP side equivalent |
|---|---|---|
| 2BR rent | BHD 550–900 | SAR 3,500–6,000 |
| School | Bahrain international | EP limited choice |
| Liquidity | Freehold resale | REGA zones only |

Compare [Amwaj property investment](/guides/amwaj-islands-property-investment/) before buying EP off-plan solely for commute.

---

## Vehicle prep for daily cross-border use

- KSA insurance endorsement on Bahrain policy  
- **Iqama / visit visa** valid for work location  
- Emergency kit: water, printed employer letter, spare phone battery  
- Secondary driver on policy if spouse shares commute  

`,

  'bahrain-vs-dubai-living': `

## Monthly cost comparison — same household profile

**Profile:** British couple, one child Year 3, one car, 2BR target.

| Line | Manama (Amwaj) | Dubai (JVC 2BR) |
|---|---|---|
| Rent | BHD 700–950 | AED 95,000–120,000/yr |
| School | BHD 400–700/mo | AED 60,000–90,000/yr |
| Utilities | BHD 120–200 summer | AED 800–1,400/mo DEWA |
| Transport | Car essential | Car + occasional metro |

Dubai wins on **school depth and resale**; Bahrain wins on **total monthly burn** for finance-sector salaries paid in BHD.

---

## Career and visa trajectory

| Factor | Bahrain | Dubai |
|---|---|---|
| Golden residency property | ~BHD 200K track ** (confirm)** | AED 2M Golden Visa |
| Job market breadth | Finance, causeway EP | Diversified mega-city |
| Naturalisation | Not available | Not available |

---

## Who regrets the move

**Bahrain → Dubai regret:** families when child hits GCSE and local British school options narrow.  
**Dubai → Bahrain regret:** singles who miss nightlife density and metro convenience.

Run a **two-week trial stay** in target neighbourhood before shipping household goods — Airbnb in Amwaj vs hotel apartment in JVC reveals commute reality better than spreadsheets.

`,

  'living-amwaj-islands': `

## Amwaj rental and ownership — investor lens

Amwaj freehold apartments and villas attract **causeway commuters** and **finance families** priced out of Dubai. Gross yields **5–6.5%** on BHD 120K–220K tickets are realistic if service charges and marina maintenance are modeled.

| Product | Tenant type | Lease length |
|---|---|---|
| 2BR lagoon apt | Young couples | 12 months |
| 3BR villa | School families | 24 months |
| Marina front | Higher turnover | 6–12 months |

See [Amwaj Islands property investment](/guides/amwaj-islands-property-investment/) for zone-level pricing.

---

## Daily logistics parents underestimate

- **School bus** routes fill — confirm seat before lease  
- **Groceries:** Marina Mall vs Danube drive  
- **Causeway:** Sunday morning queue if spouse works EP  
- **Parking:** Villa vs apartment visitor spaces  

---

## Seasonal rhythm

Summer: indoor life, pool maintenance costs rise. Ramadan: shorter retail hours. National Day: marina events — good for community feel, noisy for light sleepers.

`,

  'living-seef-bahrain': `

## Seef tower living — floor and building choice

Newer towers with **allocated parking** command BHD 50–100/month premia but reduce daily stress. Check **elevator count** — 4 lifts on 40 floors fails at 07:30 weekday rush.

| Building age | Typical issue |
|---|---|
| 2010–2018 | Modern AC, higher SC |
| Pre-2010 | Renovation variance, ask about chiller |

---

## Seef vs Amwaj — 18-month expat pattern

Couples without school-age kids stay Seef; families relocate Amwaj/Saar when **school run exceeds 25 minutes**. Investors letting Seef 1BR should target **dual-income no-kids** or **weekly business travellers**.

---

## Walkability wins and losses

**Wins:** Seef Mall, cafes, bank branches on foot.  
**Losses:** Beaches, large parks, British school proximity — plan drives to Saar or Busaiteen for weekend recreation.

`,

  'living-seef-bahrain': `

## Seef tower living — floor and building choice

Newer towers with **allocated parking** command BHD 50–100/month premia but reduce daily stress. Check **elevator count** — 4 lifts on 40 floors fails at 07:30 weekday rush.

| Building age | Typical issue |
|---|---|
| 2010–2018 | Modern AC, higher SC |
| Pre-2010 | Renovation variance, ask about chiller |

---

## Seef vs Amwaj — 18-month expat pattern

Couples without school-age kids stay Seef; families relocate Amwaj/Saar when **school run exceeds 25 minutes**. Investors letting Seef 1BR should target **dual-income no-kids** or **weekly business travellers**.

---

## Walkability wins and losses

**Wins:** Seef Mall, cafes, bank branches on foot.  
**Losses:** Beaches, large parks, British school proximity — plan drives to Saar or Busaiteen for weekend recreation.

`,
};

for (const [slug, block] of Object.entries(EXPANSIONS)) {
  if (!block.trim()) continue;
  const path = join(ROOT, slug + '.mdx');
  let raw = readFileSync(path, 'utf8');
  const insertBefore = raw.includes('## After you collect') ? '## After you collect' :
    raw.includes('**Related reading:**') ? '**Related reading:**' :
    raw.includes('---\n\n**Related reading:**') ? '---\n\n**Related reading:**' : null;
  if (!insertBefore || raw.includes(block.slice(0, 40))) continue;
  raw = raw.replace(insertBefore, block.trim() + '\n\n' + insertBefore);
  writeFileSync(path, raw);
  const words = raw.split('---').slice(2).join('---').split(/\s+/).filter(Boolean).length;
  console.log('expand', slug, words, 'words');
}
