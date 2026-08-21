# Content roadmap — invest-gulf.com (30 new topics)

**Date:** 2026-08-21
**Source:** `.content-os/reports/AUDIT-REPORT-2026-08-21.md` §10
**Machine-readable:** `.content-os/batches/topics-proposal.json`
**Status:** 🔴 **PROPOSAL ONLY — no MDX written.** Per `publishing-gates.md`, topic discovery alone is not approval to write.

---

## 🛑 Gate: this roadmap is blocked behind cleanup Wave 4

I am recommending against writing any of these until **Waves 0–4 of `corpus-cleanup-roadmap-2026-08-21.md` have landed**, and I want the reasoning on record rather than buried:

The site has **610 pages**, of which **32% are self-declared `noindex`**, **66% carry template-generated sentences**, **100% claim the same update date**, and **99% claim a publication date inside one four-day window**. Adding 30 more pages into that state adds 30 more data points to the exact pattern that is suppressing the domain. The measurable outcome would be *negative*.

The order that works is: remove the fingerprint → restore the head pages → **then** publish, so the new work lands on a domain Google is re-evaluating rather than one it is discounting.

---

## Why these 30, and not 30 more guides

The corpus is **saturated on conventional topics**. Verified during the audit:

- All 12 major buyer nationalities have a dedicated guide (`dubai-property-for-{indian,chinese,british,russian,pakistani,american,french,german,canadian,australian,south-african,saudi}-buyers`)
- 30 comparison pages, 8 free-zone setup guides, 62 indexable yield pages, 19 off-plan pages, 18 Golden Visa pages
- Every "obvious" gap I probed already exists: `due-diligence-dubai-property`, `dubai-property-dispute-resolution`, `leaving-dubai-exit-checklist`, `uae-will-difc-adgm`, `dubai-property-valuation-guide`, `is-dubai-property-bubble-2026`, `property-management-dubai-cost`, `neom-property-investment`

**There is no topic gap. There is a format gap and a credibility gap.**

SERP research on the head terms (Golden Visa AED 2M, buy-as-foreigner + DLD fees, Dubai yields, service charges/Mollak, RAK–Wynn, Saudi 2026 law) returned almost exclusively **brokerages and developers**: `drivenproperties.com`, `pearlshire.com`, `houseandhedges.ae`, `egsh.ae`, `dubailivin.com`, `astraterra.ae`, `sherwoodsproperty.com`, `districtuae.com`, `lymrealestate.com`, `engelvoelkers.com`.

Every one of them has a transaction incentive. That creates four openings an independent publisher can take and they structurally cannot:

| Opening | Why brokers can't take it | Batches |
|---|---|---|
| **Interactive tools** | A calculator that outputs "this deal nets 3.9%" costs them a sale; their model is to route you to a form | N1 |
| **Dated regulatory changelogs** | Requires editorial upkeep with no listing revenue attached | N2 |
| **Primary data indexes** | Publishing delivery-delay records names their own suppliers | N3 |
| **Risk / dispute / exit content** | "Here is how to sue the developer" is unpublishable next to that developer's listings | N4 |

That is the whole strategy: **stop competing on guides, compete on things a seller cannot publish.** It is also what earns citations from answer engines, which is the GEO half of the brief.

Every topic below carries an explicit **anti-cannibalization note** naming the existing page it must not overlap and how it differs. Given the corpus density, that column is the most important one on this page.

---

## Batch N1 — Interactive tools (6)

**Format:** `.astro` tool pages with real inputs, not MDX prose. This is a **new content type for the site** — cannibalization risk near zero, differentiation highest.
**Priority:** 🥇 first batch after cleanup. **Lead value:** highest — a buyer who models a real deal is a hot lead.

| # | Slug | Target intent | Must not cannibalize | How it differs |
|---:|---|---|---|---|
| 1 | `dubai-property-purchase-cost-calculator` | "dubai property buying costs calculator", "total cost buying property dubai" | `cost-of-buying-property-dubai`, `dld-mortgage-registration-fees` | Those explain fees in prose. This computes: price → DLD 4% + trustee AED 2,100–4,200 + title deed AED 580 + agent 2% + VAT + NOC + mortgage reg 0.25% + valuation + Y1 service charge. Existing guides link **into** it |
| 2 | `uae-mortgage-ltv-calculator-non-resident` | "non resident mortgage dubai LTV", "how much can I borrow dubai" | `dubai-mortgage-rates-2026`, `cash-vs-mortgage-dubai-property`, `buy-to-let-mortgage-dubai` | `ltv` appears in **zero** existing slugs. Outputs max loan by residency status, nationality tier, property value band, first-vs-second property |
| 3 | `dubai-service-charge-lookup-by-building` | "service charge [tower name] dubai", "mollak service charge index" | `dubai-service-charge-index-explained`, `service-charges-dubai-by-area` | Existing pages give AED 12–25/sqft **ranges by area**. Competitors do the same. Nobody publishes **building-level** figures. This is the single biggest hidden cost in a Dubai net-yield model |
| 4 | `gcc-property-acquisition-cost-comparison` | "cost of buying property UAE vs Qatar vs Saudi" | `compare/*` cluster (30 pages) | Those compare markets narratively. This is one table: total acquisition cost % across UAE, Qatar, Saudi (incl. the new ~10% foreign fee load), Oman, Bahrain, Kuwait — on the same purchase price |
| 5 | `golden-visa-property-eligibility-checker` | "do I qualify for dubai golden visa property" | `uae-golden-visa-property` (hub), `golden-visa-mortgage-property-uae`, `golden-visa-multiple-properties-uae` | Decision-tree tool: value / off-plan-or-ready / mortgaged / single-or-aggregate / emirate → eligibility + document list. Feeds `/golden-visa-dubai-property/` directly |
| 6 | `dubai-off-plan-payment-plan-comparison` | "developer payment plans dubai compared" | `dubai-payment-plan-types-explained`, `off-plan-payment-plans-dubai`, `post-handover-payment-plan-dubai` | Those explain plan *types*. This is a sortable table of **actual current plans by developer** with effective-cost-of-finance calculated per plan |

---

## Batch N2 — Dated regulatory changelogs (5)

**Format:** MDX with a dated changelog table, primary-source citations, and a visible "last verified" date per claim.
**Why:** the fastest AEO/GEO win available. Answer engines strongly prefer dated, sourced, single-topic regulatory pages — and this is where the corpus is thinnest and most at risk (see AUDIT §9).

| # | Slug | Target intent | Must not cannibalize | How it differs |
|---:|---|---|---|---|
| 7 | `saudi-foreign-property-ownership-law-2026` | "can foreigners buy property saudi arabia 2026", "saudi property law expats" | `saudi-arabia-property-foreigners-guide`, `news/saudi-foreign-ownership-update-2026` | **Highest priority page in the whole roadmap.** The law took effect Jan 2026; reporting indicates Riyadh, Jeddah, Makkah, Madinah are excluded from general foreign residential ownership, with a REGA transfer fee capped at 5% and ~10% combined fee load. The site's **#2 traffic page** (`saudi-rental-yield-guide`, 380 imp, pos 9.3) is titled *"4% to 6% in Riyadh and Jeddah"*. This page becomes the authoritative, dated source that guide cites — and forces the fact-check |
| 8 | `uae-golden-visa-property-rule-changes-log` | "golden visa dubai rule changes 2026", "did golden visa rules change" | `uae-golden-visa-property` (hub) | A dated changelog, not a guide: Feb-2026 federal circular removing the 50% down-payment requirement, the DLD valuation-certificate test, the mortgage/NOC position. The corpus currently says "widely reported policy updates" — vague sourcing on a YMYL claim |
| 9 | `dubai-dld-fee-schedule-2026` | "DLD fees 2026", "dubai land department fees list" | `cost-of-buying-property-dubai`, `dld-mortgage-registration-fees` | The official schedule as a citable reference table with source links and per-line verification dates. Tool #1 consumes it |
| 10 | `qatar-foreign-ownership-zones-2026` | "qatar freehold zones foreigners 2026" | `qatar-property-investment-guide`, `news/qatar-property-law-amendment-2026` | Current designated-zone list + 2026 amendments, dated and sourced |
| 11 | `oman-itc-freehold-rules-2026` | "oman ITC freehold foreigners 2026" | `oman-itc-zones-property`, `oman-property-foreigner-living` | Same treatment. Oman is genuinely under-covered by competitors — winnable |

---

## Batch N3 — Primary data indexes (5)

**Format:** MDX + data tables, refreshed quarterly, with a stated methodology and sourcing.
**Why:** this is what makes "independent research" a true claim rather than positioning copy. It is also the most citable content type for answer engines.

| # | Slug | Target intent | Must not cannibalize | How it differs |
|---:|---|---|---|---|
| 12 | `dubai-net-yield-index-by-community` | "dubai net rental yield by area 2026" | `dubai-rental-yield-guide` (hub), `highest-rental-yield-areas-dubai` | ⚠️ Densest cluster on the site (62 indexable pages). **Only publish after cleanup W8-1 consolidates it.** Position as the quarterly *data asset* the hub cites — net, not gross, with service charge and vacancy shown per community. Every competitor publishes gross |
| 13 | `dubai-developer-delivery-record-index` | "which dubai developers deliver on time" | `dubai-developers-guide`, `how-to-evaluate-dubai-developer`, 9 `*-review` pages | Reviews are qualitative. This is a delivery/delay **dataset** by developer and project. No broker will publish it about their own suppliers |
| 14 | `rak-al-marjan-price-index-wynn-effect` | "al marjan island prices 2026", "wynn effect RAK property" | `wynn-al-marjan-island-property-impact`, `areas/al-marjan-island-property-investment` | Price-per-sqft time series against the Wynn 2027 timeline. 1-beds moved from AED 550k–900k to AED 900k–1.6M in 18 months — the market wants the number series, not another narrative. **Least contested growth story in the Gulf** |
| 15 | `gcc-transaction-volume-tracker` | "dubai transaction volume 2026", "gulf property market data" | `news/dubai-transaction-volume-may-2026`, `dubai-property-market-cycle-2026` | A live tracker that replaces one-off news posts. **Also fixes the stale `news/` collection problem** flagged in AUDIT §9.3 |
| 16 | `dubai-rera-index-vs-actual-ejari-rents` | "RERA rent index accurate", "actual rents vs rera dubai" | `dubai-rent-increase-calculator-rera`, `dubai-rental-yield-guide` | The gap between the official index and registered Ejari contracts. Directly actionable for landlords and buyers; nobody publishes it |

---

## Batch N4 — Risk, dispute and exit (6)

**Format:** MDX, long-form, heavy FAQ + citability blocks.
**Why:** structurally unavailable to every site currently ranking. Highest E-E-A-T and link-earning value; strongest support for the "independent, not a portal" entity claim in `llms.txt`.

| # | Slug | Target intent | Must not cannibalize | How it differs |
|---:|---|---|---|---|
| 17 | `dubai-property-legal-recourse-map` | "where to complain dubai property", "RERA vs RDC vs DIFC courts" | `dubai-property-dispute-resolution` | The existing page explains the dispute *process*. This is a **routing map**: dispute type → correct forum (RERA / RDC / DLD / Rental Dispute Centre / DIFC Courts) → cost → timeline → what you need first. One page that answers "who do I go to" |
| 18 | `dubai-off-plan-cancellation-refund-rights` | "developer cancelled project dubai refund", "off-plan project cancellation RERA" | `off-plan-risks-delays-dubai`, `escrow-oqood-dubai-explained` | Those cover risk and escrow mechanics. This covers what happens **after** cancellation: RERA cancellation procedure, escrow refund waterfall, buyer priority, realistic recovery rates |
| 19 | `dubai-developer-delay-compensation-claim` | "off plan delayed dubai compensation", "can I claim developer delay" | `off-plan-risks-delays-dubai` | Remedy, not risk: SPA delay clauses, the 30% completion threshold, RERA remedies, how claims actually resolve |
| 20 | `dubai-property-resale-exit-cost-model` | "cost of selling property dubai", "how long to sell dubai property" | `dubai-property-flipping-guide`, `how-to-flip-off-plan-dubai`, `leaving-dubai-exit-checklist` | `resale` appears in **zero** slugs. Full exit model: agent 2%, NOC, DLD, mortgage settlement, early-settlement penalty, realistic days-on-market by area, plus the off-plan assignment route. **The number every serious investor asks for and no broker publishes** |
| 21 | `dubai-service-charge-dispute-escalation` | "service charge too high dubai", "dispute mollak service charge" | `dubai-service-charge-index-explained` | How to challenge a budget: Mollak audit records, owner association rights, RERA escalation. Pairs with tool #3 |
| 22 | `uae-rental-income-repatriation-fx` | "send rental income out of UAE", "repatriate rent dubai tax" | `currency-transfer-buy-property-uae`, `rental-income-tax-uae` | The existing page covers money coming **in**. This covers money going **out**: FX spread, bank limits, CRS reporting, home-country treatment. Closes the investor lifecycle |

---

## Batch N5 — Transactional buyer journeys (4)

**Format:** MDX, bottom-funnel, CTA-heavy.
**Why:** direct lead generation. These are the pages that convert.

| # | Slug | Target intent | Must not cannibalize | How it differs |
|---:|---|---|---|---|
| 23 | `aed-2m-golden-visa-best-value-units` | "cheapest property for golden visa dubai", "AED 2M property golden visa which area" | `uae-golden-visa-property`, `best-areas-buy-property-dubai` | Extremely high purchase intent, no equivalent anywhere. Which **actual areas and unit types** clear AED 2M while still netting a defensible yield — the exact question a Golden Visa buyer types |
| 24 | `dubai-first-investment-under-aed-1m` | "cheapest area to invest dubai", "dubai property under 1 million" | `best-areas-buy-property-dubai`, `highest-rental-yield-areas-dubai` | Budget-anchored entry playbook rather than a ranking: what AED 700k–1M actually buys, financing at that level, realistic net yield, what to avoid |
| 25 | `gulf-property-portfolio-sequencing` | "second property dubai", "build property portfolio UAE" | `golden-visa-multiple-properties-uae`, `compare/*` | Repeat-buyer content — nobody covers sequencing. Order of purchases, cross-market diversification, aggregation to AED 2M, financing across markets. **Highest-value lead segment** |
| 26 | `uae-property-purchase-timeline-week-by-week` | "how long to buy property dubai", "dubai property purchase timeline" | `how-to-buy-property-dubai-step-by-step`, `dubai-property-handover-checklist` | The existing page lists steps. This is a calendar: week 1 → week 8, ready vs off-plan vs mortgaged, with the realistic slippage points marked |

---

## Batch N6 — Entity, authority and trust (4)

**Format:** MDX + one `.astro` upgrade.
**Why:** GEO/AEO. These pages make the site *citable* and back the independence claim that the whole strategy rests on.

| # | Slug | Target intent | Must not cannibalize | How it differs |
|---:|---|---|---|---|
| 27 | `invest-gulf-methodology-data-sources` | brand / E-E-A-T / citability | `/methodology/` (177 words) | Expand the existing thin page into a real, citable methodology: named data sources, update cadence, what the site does and does not do, editorial independence statement, correction policy. This is what an answer engine checks before citing. Currently one of the site's thinnest pages |
| 28 | `gulf-property-glossary` | "what is oqood", "what is ejari", "what is mollak", "musataha meaning" | none | Strong AEO/entity play: Oqood, Ejari, Mollak, Tawtheeq, Trakheesi, NOC, Usufruct, Musataha, Iqama, REGA, DMT, KHDA/ADEK. Each term a linkable anchor. Captures a wide long tail of definitional queries and becomes the site's most-linked internal asset |
| 29 | `how-to-verify-gulf-property-claims` | "how to check dubai developer RERA", "verify property listing dubai" | `due-diligence-dubai-property` | The existing page is a buyer's due-diligence process. This is a **verification manual for any claim**: which official portal proves what (DLD, Trakheesi, Mollak, Ejari, REGA, MOI), with the lookup steps. Pure GEO citability — the kind of page answer engines quote |
| 30 | `when-not-to-buy-gulf-property` | "is dubai property a bad investment", "should I not buy dubai property" | `is-dubai-property-bubble-2026` (currently an **orphan**) | The existing page asks a market-timing question. This is the anti-sales page: the buyer profiles and situations where the honest answer is *don't buy* — short horizons, leverage limits, currency mismatch, service-charge-sensitive yields, illiquid secondary markets. **No competitor with a sales incentive can publish this.** It is the single strongest trust asset available, and it links to everything |

---

## Sequencing

| Phase | Batches | Precondition | Rationale |
|---|---|---|---|
| **Blocked** | — | Cleanup W0–W4 complete | Publishing into the current corpus state is net-negative |
| **P1** | N2 (5) + N6 #27, #29 | W0–W4 landed | Regulatory freshness + methodology = fastest AEO/GEO signal, lowest cannibalization risk |
| **P2** | N1 (6) | P1 shipped | Tools take the longest to build; start once the domain is being re-evaluated |
| **P3** | N4 (6) + N6 #30 | — | Trust/risk cluster; earns links and citations |
| **P4** | N5 (4) + N6 #28 | — | Bottom-funnel conversion + glossary |
| **P5** | N3 (5) | **After W8 consolidation** | Data indexes must not land in an un-consolidated yield cluster |

Batch size per `site-passport.yaml` `topic_discovery.batch_size_default: 5`. PR prefix `cc/gulf-`.

---

## Honest expectations

- **None of these 30 pages will rank while the domain is suppressed.** Content is the second half of the fix; the cleanup roadmap is the first.
- The realistic recovery window for a scaled-content demotion is **3–6 months after the cleanup lands**, longer for a Helpful-Content-style sitewide demotion.
- The lead-generating pages here (N1, N5) will convert traffic the site does not yet have. Their value is banked for after recovery — which is an argument for building them, not for building them *first*.
- **`saudi-foreign-property-ownership-law-2026` (#7) is the exception worth arguing about.** It supports the site's #2 traffic page, which currently carries a possible factual problem in its title. If Maxim wants one page written before the cleanup completes, it should be that one — and it should be paired with a fact-check pass on `saudi-rental-yield-guide`.

---

## Approval needed

Per `publishing-gates.md`, writing is authorised when Maxim confirms the plan («ок», «пишем по плану», «волна N») or lists topic IDs. Record in `.content-os/lock.json`:

```json
{
  "approved_plan_date": "2026-08-21",
  "approved_topic_ids": [7, 8, 9, 10, 11],
  "approved_wave": "gulf-content-p1"
}
```
