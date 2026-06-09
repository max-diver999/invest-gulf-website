#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/guides/', import.meta.url).pathname);

function append(slug, block, marker = '**Related reading:**') {
  const path = join(ROOT, slug + '.mdx');
  let raw = readFileSync(path, 'utf8');
  if (raw.includes(block.slice(20, 80))) return;
  if (!raw.includes(marker)) marker = '---\n\n*Invest Gulf Editorial';
  if (!raw.includes(marker)) return;
  raw = raw.replace(marker, block.trim() + '\n\n' + marker);
  writeFileSync(path, raw);
  const w = raw.split('---').slice(2).join('---').split(/\s+/).filter(Boolean).length;
  console.log(slug, w);
}

append('bahrain-driving-license', `
## Conversion by nationality — practical notes (2026)

Rules change; always verify on GDT portal before booking. Patterns expats report:

| Origin licence | Typical pathway |
|---|---|
| UK / EU | Conversion common with eye test |
| US / Canada | Conversion if state listed ** (confirm)** |
| India / Pakistan | Often full test — shop driving school with English theory |
| Philippines | Mixed — translation quality matters |
| GCC licence | Usually streamlined ** (confirm)** |

Bring **original** licence — GDT rejects laminated cards that cannot be scanned. If licence is expiring within 90 days, renew at home first or enter full test track.

---

## Women driving in Bahrain — what is different from Saudi history

Women hold standard Bahrain licences with no guardian requirement. Practical tips: night driving is normal in Seef/Amwaj; causeway queues are gender-neutral; parking in older Manama souq areas is tight — choose towers with basement parking if uncomfortable with street parking.

---

## Rental car while waiting for GDT

Most agencies require **international driving permit + home licence** for tourists; residents on work visa may need Bahrain licence within weeks ** (confirm current official rules)**. Do not drive long-term on visitor rules — insurance void risk.

| Agency type | Typical deposit |
|---|---|
| Airport chain | BHD 100–200 |
| Local lot | BHD 50–150 |

---

## Black points, fines, and licence suspension

Speed camera fines accumulate in GDT portal — unpaid fines block licence renewal. Serious offences can add **black points** leading to suspension ** (confirm current official rules)**. Set GDT SMS alerts if available.

---

## Motorcycle and heavy licence classes

This guide covers **light vehicle (car)** licence. Motorcycle requires separate test track. Heavy truck licences need commercial medical — irrelevant for most expat families but note if employer provides pickup fleet.
`);

append('bahrain-family-visa', `
## Salary thresholds and LMRA categories ** (confirm current official rules)**

Dependant visas tie to sponsor salary band and job category. HR should provide **LMRA eligibility letter** before dependants fly — airlines may ask at check-in during peak relocation season.

| Mistake | Fix |
|---|---|
| Spouse arrives on visit visa | Convert before 30-day overstays |
| Child born abroad | Register birth abroad + attest before travel |
| Ex-spouse on visa | Cancel dependant before final exit |

---

## Housing contract clauses that break family visa files

Municipality-registered lease must match **CPR address**. Landlords who refuse registration to avoid tax expose tenant to visa renewal failure. Pay slightly higher rent for compliant landlords.

---

## Single-parent and non-married dependants

Rules vary — legal counsel required for custody documentation. Do not assume Dubai GCC precedents apply in LMRA system.

---

## Timeline example — British family, August start

| Week | Milestone |
|---|---|
| -12 | School application + deposit |
| -8 | Attestation chain started |
| -4 | CPR for primary visa holder |
| -2 | Family visa submitted |
| 0 | Flights after visa sticker |
| +1 | Municipality lease registration |

`);
append('bahrain-healthcare-guide', `
## Maternity and paediatric planning

Maternity packages at private hospitals range **BHD 2,000–6,000+** depending on hospital tier and C-section risk. Waiting periods on new policies often **10–12 months** — activate insurance before pregnancy where possible.

Paediatricians in Seef/Amwaj book 1–2 weeks out for well-child visits; emergency walk-in available but slower.

---

## Mental health and physiotherapy coverage

Basic employer tiers often **exclude** psychiatry and physio — budget BHD 40–80 per session out-of-pocket. Some multinationals offer Employee Assistance Programme (EAP) hotline separately from insurance card.

---

## Medical evacuation and travel insurance overlap

Do not assume home-country travel insurance covers Bahrain residency care — it covers trips, not LMRA life. Evacuation riders matter for adventure sports and pre-existing conditions declarations.

`);
append('bahrain-saudi-bridge-commute', `
## Alternative: live EP, weekend Bahrain

Reverse pattern exists — SAR salary, Bahrain leisure. Less common for Invest Gulf readers but affects **Friday causeway direction**. Hotels in Manama fill when Saudi weekend starts.

---

## Bus and shared ride options

Most commuters drive — bus options limited vs Dubai. Carpool WhatsApp groups exist in Aramco-adjacent compounds ** (informal — verify safety)**.

---

## Accident on causeway — procedure sketch

Move to safe lane, call insurer hotline, obtain police report on applicable side ** (confirm current official rules)**. Cross-border liability disputes slow claims — photograph all IDs and policy numbers immediately.

`);
append('bahrain-vs-dubai-living', `
## Education depth comparison

| Curriculum breadth | Dubai | Bahrain |
|---|---|---|
| British schools | Very deep | Moderate |
| IB | Many options | Fewer |
| Indian CBSE | Huge | Growing |
| American | Several | Limited |

If child needs **specific exam board**, confirm seat **before** choosing country — not neighbourhood.

---

## Property as residency anchor

| | Dubai Golden Visa | Bahrain Golden Residence |
|---|---|---|
| Typical threshold | AED 2M property ** (confirm)** | ~BHD 200K ** (confirm)** |
| Market liquidity | High | Lower but improving |

See [UAE Golden Visa property](/guides/uae-golden-visa-property/) vs [Bahrain Golden Residence](/guides/bahrain-golden-residence/).

`);
append('living-amwaj-islands', `
## Marina vs lagoon vs villa streets

| Sub-area | Vibe | Rent band |
|---|---|---|
| Marina walk | Restaurants, tourists | Higher |
| Lagoon apartments | Families, quieter | Mid |
| Villa clusters | School buses, cars | Mid-high |

Investors: lagoon 2BR often best **yield-to-void** balance; marina front trades on lifestyle premium with more turnover.

`);
append('living-seef-bahrain', `
## Banking and dining ecosystem

Seef concentrates **HSBC, NBB, BBK** branches — salary transfer day queues are real on last working day of month. Dining options skew mall-based; Manama souq is 15–20 min drive for cheaper produce.

---

## Noise and construction

New tower builds along Seef District continue — inspect **higher floors** for crane noise and **lower floors** for traffic hum from Sheikh Isa Highway.

`);

append('dubai-production-city-property-investment', `
## Production City 2026 — investor snapshot

Media Free Zone adjacency supports **studio tenant pool** (media freelancers, small agency staff). Gross yields can reach **7–8%** on sub-AED 700K studios but **service charge per sq ft** and elevator wait times in older towers compress net returns.

Before buying, pull **three Ejari comps** from the same building — Production City has wide variance between Tecom-adjacent towers and interior blocks with longer walks to metro bus links.
`);

append('motor-city-property-investment', `
## Motor City — Green Community vs Uptown

| Cluster | Product | Yield note |
|---|---|---|
| Green Community | Townhouses | Family stable, 5.5–6.5% gross |
| Uptown apartments | 1–2BR | Higher yield, more turnover |
| Autodrome adjacency | Niche | Event-day traffic spikes |

Verify **Dubai Sports City** spillover competition when setting rent — tenants cross-shop similar Dubailand rents within 10 minutes drive.
`);

append('mudon-property-investment', `
## Mudon 2026 pricing anchor

Three-bedroom townhouses in **Rahat** cluster transact **AED 1.85M–2.4M** with Ejari **AED 110K–145K** — gross **5.8–6.4%** before DP service charge. Arabella phases with upgraded finishes command **AED 15K–25K** rent premia but higher SC.
`);

append('the-valley-dubai-property-investment', `
## The Valley — phase risk checklist

| Phase status | Investor action |
|---|---|
| Under 50% handover | Stress-test developer delay 12 months |
| 50–80% | Compare SC provisional vs mature Mudon |
| 80%+ | Ejari comps become reliable |

DP handover quality improved post-2022 on several phases — still snagging before first tenant.
`);

append('schools-near-jvc', `
## JVC school commute — building-level test

Pick **three buildings** on Hessa Street and time **07:15 departure** to shortlisted schools (Sunmarke, Arcadia, South View). Difference between Cluster 34 and Cluster V can be **12–18 minutes** — enough to lose a family tenant at renewal.
`);
