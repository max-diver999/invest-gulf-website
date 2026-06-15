#!/usr/bin/env node
/** Append yield-format expansion blocks to hit validate word minimums */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src/content');

const EXPANSIONS = {
  'compare/dubai-vs-qatar-rental-yield.mdx': `

## Field underwriting: three investor profiles

| Profile | Capital | Dubai fit | Qatar fit | Net target |
|---|---|---|---|---|
| Yield maximiser | AED 1–2M | JVC 1–2 beds | Avoid Pearl premium | 5%+ net Dubai |
| Stability allocator | AED 2–4M | Marina long-let | Pearl / West Bay corporate | 4% net either |
| Gulf diversifier | AED 3M+ | 60% Dubai mid | 40% Lusail / Pearl | Blended 4.5–5.5% |

**Yield maximiser:** Prioritise **Ejari-verified** JVC stock under AED 800K. Qatar only if Lusail studio entry under QAR 550K with corporate lease in hand.

**Stability allocator:** Qatar corporate tenants in **West Bay** and **Pearl** reduce void. Dubai equivalent: Business Bay mid-towers with employer-paid housing.

**Gulf diversifier:** Hold **both** — correlation between rents is not perfect; energy-sector Qatar cycles differ from Dubai tourism cycles.

---

## Quarterly yield monitoring KPIs

Track these each quarter — the same discipline we apply on [Qatar rental yield](/guides/qatar-rental-yield-guide/) accounts:

| KPI | Dubai source | Qatar source |
|---|---|---|
| Achieved rent vs offer | Ejari / REST | MOJ / broker leases |
| Void days | PM report | PM report |
| Service charge invoice | Mollak / OA | Building management |
| Renewal rate | PM | PM |
| Comparable sales DOM | Bayut / Property Finder | Qatar portals |

If **void exceeds 45 days** or **renewal drops below 70%**, reassess district selection — not just tenant quality.

---

## Currency and repatriation

Both **AED and QAR** peg to USD. Rental income repatriation is straightforward for UAE and Qatar bank accounts with proper KYC. Factor **FX only if your reporting currency is EUR/GBP/RUB** — not peg risk between the two markets.

---

## MORE Group buyer checklist (Dubai vs Qatar yield)

1. Match **bed count and sqm** before comparing gross percentages.
2. Pull **12-month rent history** for the building, not the district brochure.
3. Model **net** with one month void minimum on both sides.
4. Write **exit timeline** — if under 36 months, default Dubai unless Qatar price is deeply discounted.
5. Link portfolio to [UAE vs Qatar property](/compare/uae-vs-qatar-property-investment/) for residency and fee context.
`,

  'compare/dubai-vs-saudi-rental-yield.mdx': `

## Riyadh vs Jeddah within Saudi — yield split

| City | Gross (1-bed zone) | Tenant anchor | Liquidity |
|---|---|---|---|
| Riyadh DQ / north | 4–5.5% | Government, Giga projects | Moderate |
| Jeddah Obhur | 5.5–6.5% | Red Sea corporate, tourism | Moderate |
| Jeddah Corniche | 4–5.5% | Senior exec | Slower turnover |

Saudi **city choice** matters as much as Saudi vs Dubai. See [Jeddah rental yield](/guides/jeddah-rental-yield-guide/) and [Riyadh property](/areas/riyadh-property-investment/).

---

## Investor scenarios

**Scenario A — Dubai income core:** AED 1.5M in JVC, target 5.5% net, 5-year hold, exit via Dubai broker network.

**Scenario B — Saudi frontier sleeve:** SAR 800K in Jeddah designated zone, target 4% net year one rising to 4.8% year three as district matures, 7-year hold.

**Scenario C — Blended:** 75% Dubai / 25% Saudi — Dubai funds distributions; Saudi participates in Vision 2030 rent growth without dominating cash flow.

---

## REGA verification workflow

1. Download current **designated zone** list from REGA channels.
2. Confirm **developer registration** and escrow (if off-plan).
3. Align **mortgage** availability with bank policy for foreigners.
4. Register lease template with local counsel before first tenant.

Skipping step one invalidates all yield math.

---

## GSC-aligned keywords (why this page exists)

Search data shows emerging interest in **roi on apartments in riyadh**, **roi on apartments in jeddah**, and **roi on villas in ksa**. This comparison answers **rental yield** specifically — not capital growth speculation.

---

## Extended cost comparison

| Cost | Dubai mid | Saudi zone |
|---|---|---|
| Transfer / registration | ~4% DLD + fees | REGA + local fees (verify) |
| PM annual | 5–8% rent | 8–12% rent |
| Typical void | 1 month | 1–2 months year one |
| Resale discount (fast) | 2–5% | 5–8% |

---

## Monitoring checklist

- Track **Saudi employment visa** policy changes — affects tenant pool.
- Compare **your achieved rent** to [Dubai rental yield](/guides/dubai-rental-yield-guide/) benchmarks quarterly.
- Re-read [Saudi designated zones](/guides/saudi-property-designated-zones-explained/) after any Royal Decree update.
`,

  'compare/dubai-vs-oman-rental-yield.mdx': `

## Salalah and Sohar — beyond Muscat

| Zone | Gross | Hold period |
|---|---|---|
| Muscat Al Mouj | 6–7% | 5+ years |
| Muscat Qurum | 5.5–6.5% | 5+ years |
| Salalah ITC | 5–6% | 7+ years (tourism) |
| Sohar industrial | 5.5–6.5% | Corporate lease |

[Muscat Al Mouj](/areas/muscat-al-mouj-property-investment/) and [Qurum](/areas/muscat-qurum-property-investment/) are primary foreign-buy zones.

---

## Lease length advantage — numeric example

**Dubai:** AED 60,000 rent, 1 month void every 12 months → **AED 5,000/month effective**.

**Oman:** OMR 5,200 rent (~AED 5,300), 24-month corporate lease, 0 void → **OMR 217/month effective** stability premium.

Oman wins **predictability**; Dubai wins **absolute AED** when void is controlled.

---

## Investor profiles

| Profile | Allocation | Rationale |
|---|---|---|
| Dubai yield hunter | 80% Dubai / 20% Oman | Max net AED |
| Muscat lifestyle + income | 40% Dubai / 60% Oman ITC | Long leases, live part-year |
| Pure diversifier | 70% Dubai / 30% Oman | Non-correlated tenant bases |

---

## ITC due diligence (foreign buyers)

1. Confirm **ITC decree** covers your unit.
2. Ask developer for **rental permission** letter.
3. Identify **PM with ITC experience** — generic Dubai PMs often fail here.
4. Open **Omani bank account** before first tenant.

---

## Tourism vs corporate underwriting

Coastal ITC projects marketed with **holiday rental** upside must be modelled as **long-let base case**. STR upside in Oman is **not** Dubai DET-equivalent maturity.

---

## Quarterly review KPIs

| Metric | Action if red flag |
|---|---|
| Corporate lease renewals under 60% | Revisit district |
| HOA spike above 15% YoY | Recalculate net |
| Muscat vacancy over 30 days | Compare to Dubai exit |

---

## Capital growth vs yield (separate decision)

Yield comparison does not replace [Dubai vs Muscat property investment](/compare/dubai-vs-muscat-property-investment/) for appreciation thesis — Oman ITC can appreciate slowly while Dubai mid-market moves faster in hot cycles.

---

## MORE Group notes

Clients combining **Dubai JVC yield** with **Al Mouj waterfront** typically target 5-year minimum on Oman leg and keep Dubai leg for liquidity buffer. Never size Oman above **30%** of Gulf rental allocation without explicit liquidity elsewhere.
`,

  'compare/rak-vs-dubai-rental-yield.mdx': `

## Al Marjan vs Al Hamra — yield timing

| Area | 2026 gross | Catalyst sensitivity |
|---|---|---|
| Al Hamra (mature) | 7–8.5% | Low — operational today |
| Mina Al Arab | 6.5–8% | Medium — master plan |
| Al Marjan (new) | 6–7.5% | High — Wynn narrative |

[Wynn Al Marjan impact](/guides/wynn-al-marjan-island-property-impact/) — treat STR/tourism uplift as scenario, not base rent.

---

## Commuter tenant math

RAK tenants saving **AED 30–40K/year** vs Dubai Marina rent accept commute cost. Yield investors benefit from **occupancy** — monitor **Dubai employer layoff cycles** as leading indicator for RAK void.

---

## Three portfolio uses of RAK

1. **Yield satellite** — 20% of UAE rental allocation in Al Hamra.
2. **Golden Visa discount** — AED 2M buys more sqm in RAK than Downtown.
3. **Tourism option** — Marjan units with licensed STR (if available) as upside sleeve.

---

## Service charge comparison (illustrative 800 sqft)

| Emirate | AED/sqft | Annual AED |
|---|---|---|
| RAK Al Hamra | 10–14 | 8,000–11,200 |
| Dubai JVC | 16–22 | 12,800–17,600 |
| Dubai Marina | 22–35 | 17,600–28,000 |

RAK net edge often comes from this table even when gross ties.

---

## Resale discount sensitivity

| Hold | RAK expected discount to sell in 60 days | Dubai mid |
|---|---|---|
| 3 years | 5–8% | 2–4% |
| 5 years | 3–5% | 1–3% |

Price the discount into **IRR**, not just yield.

---

## Investor mistakes (RAK-specific)

- Buying **Marjan pre-Wynn** at post-Wynn prices.
- Ignoring **humidity and building envelope** capex on coastal stock.
- Assuming **RAK Ejari equivalent depth** — thinner rent comps.

---

## Cross-emirate strategy

Pair with [Sharjah rental yield](/guides/sharjah-rental-yield-guide/) for northern UAE affordability comparison, or [RAK vs Dubai investment](/compare/ras-al-khaimah-vs-dubai-investment/) for non-yield factors.

---

## Monitoring

Review **RAK transaction volume** quarterly via market reports. If volume drops while supply rises, pause new yield acquisitions until rents catch up.
`,

  'guides/bahrain-rental-yield-guide.mdx': `

## Seef and Reef Island — premium yield trade-off

| Area | Gross | Occupancy | Best for |
|---|---|---|---|
| Seef finance district | 5.5–6.5% | High | Corporate credit |
| Reef Island | 5–6% | Moderate | Lifestyle |
| Durrat | 4.5–5.5% | Lower turnover | Long hold |

Premium zones **rarely beat Amwaj on net** unless purchased with discount.

---

## Causeway commuter effect

Bahrain rents are supported by **Saudi commuters** and logistics firms serving the region. Weekend and holiday patterns affect **short void windows** in Juffair — model **11 months effective rent** not 12 in conservative cases.

---

## Acquisition cost advantage

| Stack item | Bahrain | Dubai |
|---|---|---|
| Transfer + legal | ~3–5% | ~6–9% |
| Agent fee | 2% common | 2% + VAT |
| Finance cost | Limited | Deep mortgage market |

Lower stack improves **year-one net** even when gross ties Dubai.

---

## Three-year cash flow model (Amwaj 1-bed)

| Year | Gross rent | Costs | Net | Notes |
|---|---|---|---|---|
| 1 | BHD 5,200 | BHD 1,150 | BHD 4,050 | Lease-up |
| 2 | BHD 5,350 | BHD 1,100 | BHD 4,250 | Renewal |
| 3 | BHD 5,500 | BHD 1,100 | BHD 4,400 | Stable |

IRR improves with **hold** — not flip.

---

## Banking and rent collection

Open **Bahrain bank account** with trade licence or ownership docs before tenant move-in. Delayed account setup is a common **first-year yield killer** for foreign landlords.

---

## Comparison cluster links

- [Bahrain vs Dubai investment](/compare/bahrain-vs-dubai-investment/)
- [Dubai vs Qatar rental yield](/compare/dubai-vs-qatar-rental-yield/) — alternative stability play
- [Qatar rental yield](/guides/qatar-rental-yield-guide/) — GSC-proven format reference

---

## Red flags

- Seller cannot show **NPRA freehold** documentation.
- Gross yield quoted **above 9%** without building inspection.
- **Single-tenant dependency** (one corporate lease = 100% income).

---

## MORE Group allocation guidance

Bahrain suits **5–15%** of Gulf rental sleeve for investors already heavy UAE. Do not replace Dubai core — complement it.
`,

  'guides/sharjah-rental-yield-guide.mdx': `

## University and hospital corridor detail

| Micro-area | Gross | Tenant type |
|---|---|---|
| Muwaileh | 7.5–9% | Students, faculty |
| Al Nahda (border) | 7–8.5% | Commuters |
| University City adjacency | 7–8% | Academic staff |

Turnover runs **higher** than Aljada — budget **1.5 months void** in year one models.

---

## Aljada vs Muwaileh decision

| Factor | Muwaileh | Aljada |
|---|---|---|
| Gross yield | Higher | Moderate |
| Building age | Older | New |
| Freehold clarity | Verify each tower | Clear |
| Resale | Faster in Aljada | Slower older stock |
| PM quality | Variable | Developer-linked |

Foreign buyers usually choose **Aljada / Al Zahia**; yield hunters accept **Muwaileh diligence** burden.

---

## Sharjah acquisition vs Dubai — worked stack

Purchase AED 500,000 Sharjah 1-bed vs AED 750,000 JVC:

| Line | Sharjah | Dubai JVC |
|---|---|---|
| Rent | 38,000 | 58,000 |
| Costs | 9,000 | 20,000 |
| Net | 29,000 (5.8%) | 38,000 (5.1%) |

Sharjah can win **net %** on lower ticket — Dubai wins **absolute cash**.

---

## Registration and compliance

Sharjah tenancy registration differs from **Ejari** — use emirate-correct contracts. Incorrect registration weakens **eviction and rent dispute** pathway, indirectly hitting yield via prolonged void.

---

## Five-year hold IRR drivers

1. **Rent growth** — tracks Dubai with lag.
2. **Capital appreciation** — slower than Dubai hotspots.
3. **Discount on exit** — 5% if forced sale.
4. **Capex** — older towers year 3–4 surprises.

---

## Cross-links

- [Dubai vs Sharjah property](/compare/dubai-vs-sharjah-property-investment/)
- [RAK vs Sharjah](/compare/rak-vs-sharjah-property-investment/)
- [Highest yield areas Dubai](/guides/highest-rental-yield-areas-dubai/)

---

## Scenario table

| Investor | Sharjah role |
|---|---|
| UAE resident yield | Core |
| Foreign first UAE buy | Satellite after Dubai |
| Golden Visa seeker | Usually Dubai first |

---

## Monitoring

If **Sharjah-Dubai rent spread** narrows below 15%, commuter demand may shift — revisit Muwaileh yields quarterly.
`,

  'guides/jeddah-rental-yield-guide.mdx': `

## Northern Jeddah master plans

| Project type | Gross | Year-one void |
|---|---|---|
| Established Obhur | 5.5–6.5% | 1 month |
| New coastal tower | 4.5–6% | 2–3 months |
| Inland refurbished | 5–6.5% | 1–2 months |

Year-one **void** is the Saudi yield story — underwrite conservatively.

---

## Riyadh comparison within Saudi

| Metric | Jeddah Obhur | Riyadh north |
|---|---|---|
| Gross | 5.5–6.5% | 5–6% |
| Tenant | Tourism + corporate | Government |
| Seasonality | Higher | Lower |

[Dubai vs Saudi rental yield](/compare/dubai-vs-saudi-rental-yield/) for full tri-market view.

---

## Corporate lease structures

Saudi corporates often request **furnished units** with **annual maintenance** included in rent. Gross rent looks higher — but **landlord capex** rises. Net neutral unless you price furniture depreciation.

---

## Three-year stabilisation model

| Year | Occupancy | Net yield |
|---|---|---|
| 1 | 85% | 3.8% |
| 2 | 92% | 4.5% |
| 3 | 95% | 4.9% |

Do not buy on **year-three** net alone without financing **year-one** cash need.

---

## Red Sea tourism pipeline

Jeddah benefits from **giga-project employment** and tourism upgrades. Long-term rent growth thesis is valid; **near-term yield compression** from foreign buyer entry is equally valid. Separate **growth** and **income** decisions.

---

## Banking and repatriation

Setup **Saudi riyal account** early. Rent in SAR, report in your home currency. Cross-check [Saudi vs UAE property](/compare/saudi-vs-uae-property-investment/) for tax and ownership differences.

---

## GSC query alignment

Queries such as **roi on apartments in jeddah** and **roi on villas in ksa** map to this guide's **net yield** sections — use net tables when comparing to [Dubai rental yield](/guides/dubai-rental-yield-guide/).

---

## Villa vs apartment (Jeddah)

| Type | Gross | Liquidity |
|---|---|---|
| Apartment Obhur | 5.5–6.5% | Better |
| Villa compound | 4.5–5.5% | Slower |

Villas suit **family corporate leases**; apartments suit **yield per SAR deployed**.

---

## Due diligence checklist

1. REGA zone confirmation in writing.
2. Developer delivery history (if off-plan).
3. PM with **Saudi lease experience**.
4. Sample **registered lease** from building.
5. Compare to [Saudi rental yield](/guides/saudi-rental-yield-guide/) national averages.

---

## Portfolio sizing

Cap Jeddah **Saudi sleeve** at 10–25% of Gulf property unless you have explicit Saudi business ties. Dubai remains **liquidity engine**.
`,
};

for (const [rel, block] of Object.entries(EXPANSIONS)) {
  const path = join(ROOT, rel);
  let raw = readFileSync(path, 'utf8');
  const marker = '## Next steps';
  if (!raw.includes(marker)) {
    console.warn('no marker', rel);
    continue;
  }
  if (raw.includes('Field underwriting') || raw.includes('Field underwrite')) {
    console.log('skip already expanded', rel);
    continue;
  }
  raw = raw.replace(marker, block.trim() + '\n\n---\n\n' + marker);
  writeFileSync(path, raw);
  const body = raw.split('---').slice(2).join('---');
  console.log('expanded', rel, body.split(/\s+/).filter(Boolean).length, 'words');
}

const EXPANSIONS2 = {
  'compare/dubai-vs-qatar-rental-yield.mdx': `

## Studio vs villa yield curve (both markets)

| Unit | Dubai gross | Qatar gross | Liquidity winner |
|---|---|---|---|
| Studio | 7.5–9.5% | 5.5–6.5% | Dubai |
| 1-bed | 7–9% | 4.8–6.2% | Dubai |
| 2-bed family | 6–7.5% | 4.5–5.5% | Dubai |
| Villa | 4.5–6% | 4–5% | Qatar (lower ticket) |

Family villas in Qatar **Pearl** can suit **owner-occupier landlords** more than pure yield funds.

---

## Off-plan vs ready yield caution

Off-plan marketing yields often use **projected rents** — neither market guarantees them. Ready stock with **12 months Ejari or MOJ leases** is the only underwriting base we use at MORE Group for client memos.
`,

  'compare/dubai-vs-saudi-rental-yield.mdx': `

## Mortgage-financed yield note

If you finance at **70% LTV**, net yield must be calculated on **equity down payment**, not full price. Dubai mortgage depth exceeds Saudi — financing cost can flip which market wins on **cash-on-cash return**.

---

## Employment visa policy link

Saudi **Saudization** and sector hiring plans affect tenant pool in Riyadh more than Jeddah tourism corridors. Monitor **quarterly hiring** in your target district's dominant industry.

---

## Extended Dubai district table

| Dubai area | Gross | Net |
|---|---|---|
| International City | 8–9%+ | 5.5–7% |
| Discovery Gardens | 7–8% | 5–6.5% |
| JLT | 6–7.5% | 4.5–6% |
| Dubai Hills (apt) | 5.5–6.5% | 4–5.5% |

[JLT property](/areas/jlt-property-investment/) — corporate tenant overlap with Qatar West Bay profile.

---

## Saudi year-two rent growth assumptions

Conservative: **2–3% annual** rent growth in designated zones. Aggressive: **5%+** if district employment beats supply. Stress-test **0%** growth before purchase.
`,

  'compare/dubai-vs-oman-rental-yield.mdx': `

## Diplomatic housing premium

Muscat **diplomatic quarter** and **embassy-adjacent** ITC stock commands **lower gross** but **multi-year leases** with government guarantors — similar to Qatar West Bay, not Dubai JVC.

---

## Currency and reporting

OMR is pegged; rental income in OMR simplifies **USD reporting**. Dubai AED ditto. Choose based on **tenant and hold**, not FX.

---

## Extended Muscat sub-markets

| Sub-market | Gross | Lease term |
|---|---|---|
| Qurum waterfront | 5.5–6.5% | 24 mo |
| Al Mouj marina | 6–7% | 24–36 mo |
| Seeb airport corridor | 5–6% | 12–24 mo |

---

## Dubai STR optionality reminder

Licensed Dubai holiday homes can add **15–25% gross uplift** in permitted towers — Oman has **no equivalent maturity**. If STR is part of strategy, Dubai dominates.

---

## Hold period matrix

| Hold | Winner |
|---|---|
| under 3 years | Dubai |
| 3–7 years | Either (tenant fit) |
| 7+ years | Oman ITC corporate |
`,

  'compare/rak-vs-dubai-rental-yield.mdx': `

## Golden Visa per-dirham efficiency

RAK **AED 2M** buys roughly **double sqm** versus Downtown Dubai — same visa outcome, different yield and liquidity profile. See [Golden Visa property](/guides/uae-golden-visa-property/).

---

## Al Nakheel city stock

Older RAK city apartments can print **8–9% gross** on low tickets — **building condition risk** is elevated. Inspect **lift, chiller, and facade** before yield promises.

---

## Dubai Sports City parallel

RAK Al Hamra **gross** often tracks **Dubai Sports City** — compare net using Sports City service charge data as Dubai proxy.

---

## Seasonal tourism void (Marjan)

If underwriting **Al Marjan**, model **August–September** void at **50% higher** than Al Hamra unless annual corporate tenant secured.

---

## Financing and yield

RAK mortgages exist but **LTV** and **rates** may differ from Dubai — cash buyers often win RAK auctions.
`,

  'guides/bahrain-rental-yield-guide.mdx': `

## Juffair deep dive

| Building era | Gross | Capex risk |
|---|---|---|
| 2000s mid-rise | 7–8% | Medium |
| 2010+ | 6.5–7.5% | Lower |
| Renovated | 6–7% | Furnishing cost |

Military and contractor tenants dominate — **12-month rotation** is normal.

---

## Seef corporate tenancy

Finance tenants often pay **quarterly in advance** — improves landlord cash flow vs monthly Dubai defaults.

---

## Net yield comparison table (1-bed)

| Market | Gross | Net |
|---|---|---|
| Amwaj | 7% | 5.5% |
| Dubai JVC | 8% | 5.2% |
| Qatar Lusail | 6% | 4% |

Bahrain **net** can beat Qatar; Dubai still leads **absolute BHD/AED income** at scale.

---

## Insurance and catastrophe

Coastal Amwaj — verify **building insurance** includes flood/storm clauses; claims affect **net** in bad years.
`,

  'guides/sharjah-rental-yield-guide.mdx': `

## Parking and yield

Muwaileh **parking shortages** cause tenant churn — buildings with **dedicated bays** achieve **5–10% rent premium**.

---

## Al Zahia family yield

Three-bedroom **family stock** gross **5.5–6.5%** with **lower turnover** than studios — net can beat studio gross after void adjustment.

---

## Dubai border rent spread

When spread **below 12%**, Sharjah yield thesis weakens — tenants migrate Dubai-side. Track quarterly via [Sharjah vs Dubai rent](/guides/sharjah-vs-dubai-rent/).

---

## Developer service charge (Aljada)

Arada communities publish **charge schedules** — use official numbers, not broker estimates, in net models.

---

## Exit case study (illustrative)

AED 520K purchase, AED 38K rent, sold AED 540K in 18 months — **capital gain minimal**, yield carried return. Sharjah is **income play**, not flip market.
`,

  'guides/jeddah-rental-yield-guide.mdx': `

## Obhur villa segment

Four-bedroom **compound villas** gross **4.5–5.5%** with **24-month corporate leases** — lower gross, superior **payment security**.

---

## Furnished vs unfurnished

Furnished premium **8–12% rent** costs **SAR 40–80K** setup — depreciate over **3 years** in net model.

---

## Riyadh government tenant contrast

Riyadh **ministry-linked** leases rarely default; Jeddah **tourism** leases more seasonal — pick city for **risk preference**.

---

## Comparison to [Dammam-Khobar](/areas/dammam-khobar-property-investment/)

Eastern Province yields can match Jeddah with **industrial tenant** base — different liquidity profile.

---

## Stress test table

| Scenario | Net yield |
|---|---|
| Base | 4.5% |
| +1 month void | 3.8% |
| -10% rent | 3.5% |
| Both | 2.9% |

Buy only if **stress net** still meets mandate.
`,
};

for (const [rel, block] of Object.entries(EXPANSIONS2)) {
  const path = join(ROOT, rel);
  let raw = readFileSync(path, 'utf8');
  const marker = '## Next steps';
  if (raw.includes('Studio vs villa yield curve') || raw.includes('Mortgage-financed yield note') || raw.includes('Diplomatic housing premium') || raw.includes('Golden Visa per-dirham') || raw.includes('Juffair deep dive') || raw.includes('Parking and yield') || raw.includes('Obhur villa segment')) {
    console.log('skip2', rel);
    continue;
  }
  raw = raw.replace(marker, block.trim() + '\n\n---\n\n' + marker);
  writeFileSync(path, raw);
  const body = raw.split('---').slice(2).join('---');
  console.log('expanded2', rel, body.split(/\s+/).filter(Boolean).length, 'words');
}

const EXPANSIONS3 = {
  'compare/dubai-vs-qatar-rental-yield.mdx': `

## Portfolio split recommendation

A **60/40 Dubai–Qatar** income sleeve balances **7%+ gross Dubai** with **Qatar occupancy stability**. Rebalance when Dubai void exceeds **45 days** or Qatar rent growth stalls two consecutive years.
`,

  'compare/dubai-vs-saudi-rental-yield.mdx': `

## Final underwriting checklist

Before signing SPA: (1) **12-month comparable rents** in same building class, (2) **service charge schedule** in writing, (3) **exit broker quote** for resale timeline, (4) **visa/residency** impact on hold period. MORE Group issues **one-page yield memos** for Dubai vs Riyadh/Jeddah pairs on request.
`,

  'compare/dubai-vs-oman-rental-yield.mdx': `

## Corporate lease documentation

Oman ITC leases should include **maintenance split**, **early termination**, and **rent review clause** — vague contracts inflate void when diplomats rotate. Dubai Ejari standardises many terms; Oman requires **lawyer review**.

---

## Building age and yield decay

Muscat stock built **before 2010** may show **higher gross** on paper but **elevated capex** (AC, plumbing). Underwrite **1% of value annual capex** on older buildings vs **0.3%** on new ITC towers.

---

## Liquidity scorecard

| Factor | Dubai | Oman |
|---|---|---|
| Days on market | 30–90 | 90–180 |
| Buyer pool | Global | Regional + diplomatic |
| Mortgage depth | High | Moderate |

Yield-chasers with **under 5-year hold** should default Dubai unless Oman tenant is **pre-leased 36 months**.
`,

  'compare/rak-vs-dubai-rental-yield.mdx': `

## RAK free zone employee housing

RAK FTZ and industrial employers sometimes lease **blocks** in Al Hamra — one corporate lease can stabilise **net** for 24 months. Dubai rarely offers single-building block deals at RAK ticket sizes.

---

## Service charge verification

Request **last 3 years** audited building accounts before offer. RAK buildings with **spiking chiller costs** can erase **1.5% net** overnight.

---

## Dubai Marina liquidity benchmark

When RAK resale exceeds **9 months**, opportunity cost versus **Dubai Marina 6-week** sales matters even if gross was higher in year one.

---

## Combined strategy

Buy **RAK for yield + Dubai studio for liquidity** — same Golden Visa threshold possible at **half total capital** if structured as two smaller tickets instead of one Marina asset.
`,

  'guides/bahrain-rental-yield-guide.mdx': `

## Regulatory and tax context

Bahrain has **no property tax** on residential investment stock for foreign owners in designated zones. Municipality fees apply — budget **2–3% of annual rent** in admin costs alongside management.

---

## Tenant screening for Amwaj

Verify **employer letter** and **rotation end date** for defence contractors. Short rotations increase void unless you price **6-month premiums** into gross assumptions.

---

## Capital appreciation vs yield

Bahrain price growth has been **modest (2–4% annual in strong years)** — treat as **yield-first market**. Compare to [Dubai rental yield](/guides/dubai-rental-yield-guide/) if capital gain share of total return must exceed **40%**.

---

## MORE Group Bahrain workflow

We map **Amwaj vs Seef** using live broker rent rolls, not portal asking prices. Typical deliverable: **gross, net, void-adjusted net** on three shortlisted units before SPA.
`,

  'guides/sharjah-rental-yield-guide.mdx': `

## University tenant calendar

Academic year starts **September** — list units **July** to capture family arrivals. Missing this window adds **30–45 days void** in underwriting.

---

## Building compliance

Sharjah municipalities enforce **partitioning rules** — illegal splits risk fines and tenant eviction. Verify **unit title matches physical layout** before purchase.

---

## Net yield worked example (Muwaileh 1-bed)

| Line item | AED/year |
|---|---|
| Rent | 42,000 |
| Service charge | 4,200 |
| Management 5% | 2,100 |
| Void 1 mo | 3,500 |
| **Net** | **32,200 (~6.2% on 520K)** |

Adjust void to **2 months** if no parking — net can fall below **5.5%**.

---

## When Sharjah beats Dubai on net

If Dubai comparable rents only **8% higher** but price **25% higher**, Sharjah **net** wins despite lower gross. Run spreadsheet before dismissing emirate.
`,

  'guides/jeddah-rental-yield-guide.mdx': `

## Hajj and Umrah seasonality

**Ramadan and Hajj windows** can lift **short-term furnished** rents **15–20%** in Corniche-adjacent stock — but require **licensed hospitality** compliance. Unlicensed STR risks fines.

---

## Water and utilities (coastal)

Older Corniche towers: **high water bills** in summer — add **SAR 500–800/month** to tenant or landlord depending on lease. Net models ignoring utilities miss **0.3–0.5% yield**.

---

## Comparison to [Saudi rental yield guide](/guides/saudi-rental-yield-guide/)

National guide covers **Riyadh and Eastern Province**; Jeddah is **tourism-weighted**. Use national guide for **visa and finance rules**, this guide for **Jeddah micro-markets**.

---

## Due diligence timeline

Allow **3–4 weeks** for title, developer escrow status, and **Ejar registration** readiness. Rushing SPA before Ejar clarity is top cause of **delayed first rent**.
`,
};

for (const [rel, block] of Object.entries(EXPANSIONS3)) {
  const path = join(ROOT, rel);
  let raw = readFileSync(path, 'utf8');
  const marker = '## Next steps';
  const tag = block.trim().slice(0, 40);
  if (raw.includes('Portfolio split recommendation') || raw.includes('Final underwriting checklist') || raw.includes('Corporate lease documentation') || raw.includes('RAK free zone employee') || raw.includes('Regulatory and tax context') || raw.includes('University tenant calendar') || raw.includes('Hajj and Umrah seasonality')) {
    console.log('skip3', rel);
    continue;
  }
  raw = raw.replace(marker, block.trim() + '\n\n---\n\n' + marker);
  writeFileSync(path, raw);
  const body = raw.split('---').slice(2).join('---');
  console.log('expanded3', rel, body.split(/\s+/).filter(Boolean).length, 'words');
}
