# AUDIT REPORT — invest-gulf.com

**Date:** 2026-08-21
**Branch audited:** `main` @ `8b7e491` (post `6bb267a` spam cleanup)
**Scope:** 610 MDX + 637 rendered pages + sitemap + redirects + link graph + indexing state
**Auditor:** Claude Code (Content OS Phase 0)
**Status:** audit complete — **STOP, awaiting Maxim «ок»** before any MDX write, PR or push

---

## 0. Method + one limitation to disclose

| Step | What was run |
|---|---|
| Corpus parse | Custom scan of all 610 MDX (frontmatter, body, word count, link extraction) |
| Official gates | `npm run geo:audit`, `npm run qa:corpus` |
| Rendered audit | `astro build` → 637 HTML analysed for title/meta/canonical/robots/JSON-LD/H1/alt/word count |
| Index architecture | `vercel.json` (151 rules) × content slugs × `sitemap-0.xml` (429 URLs) × noindex frontmatter |
| Link graph | 610 pages → inbound/outbound internal links, orphans, dead links, redirect chains |
| Spam forensics | Sentence-level + 8-gram phrase-level repetition across corpus |
| Indexing hygiene | `indexing-plan-batches-100.json` + `submitted-urls.json` cross-checked vs noindex/301 |
| Competitors | SERP research on head terms (Golden Visa, buy-as-foreigner, yields, service charges, RAK, Saudi law) |

**Limitation — live site was not crawled.** `invest-gulf.com` is blocked by this environment's egress proxy (`403 on CONNECT`, confirmed via `$HTTPS_PROXY/__agentproxy/status`). I substituted a **full local production build and page-by-page audit of the rendered HTML**, which is byte-identical to what Vercel serves for static output. Everything below about titles, schema, H1, robots meta and thin pages is measured on real rendered output, not on source assumptions. What I could **not** verify without the live site: actual HTTP status codes on Vercel, Core Web Vitals, real GSC index coverage, and whether the deployed build matches `main`. Those four need a Cursor-side check.

---

## 1. Verdict

The corpus is **not primarily suffering from bad writing**. Per-page quality is decent: GEO avg **90/100**, median **2 003 words**, zero pages under 700 words, zero duplicate titles/descriptions, `qa:corpus` **PASS**, and the `6bb267a` spam cleanup genuinely worked at sentence level (**0** sentences repeated across ≥8 pages).

The pessimization is being driven by **four site-level patterns that Google reads as scaled content abuse plus self-inflicted index damage**:

| # | Root cause | Blast radius | Severity |
|---|---|---|---|
| **R1** | Machine-generation fingerprints (identical dates, template phrases, template H2s) | 610 / 401 / 110 pages | 🔴 Critical |
| **R2** | Over-pruning: 32% of the corpus set to `noindex,**nofollow**`, incl. head commercial terms | 197 pages, 1 105 internal links | 🔴 Critical |
| **R3** | Redirect architecture contradicts content (301 → noindex dead ends, live files behind 301s) | 36 slugs, 17 chains, 31 dup rules | 🟠 High |
| **R4** | Trust / brand defects on rendered pages (foreign phone, competitor brand, broken titles) | 624 / 57 / 611 pages | 🟠 High |

Google's scaled-content threshold that practitioners observe is roughly **~30% of URLs flagged as unhelpful → sitewide demotion**. This site has **32.3% of its own pages marked `noindex`** — the site is itself declaring a third of its corpus low-value, while the remaining two thirds still carry the same generation fingerprints.

**Recovery thesis:** stop looking for bad paragraphs. Remove the machine fingerprint, repair the index architecture, restore the commercial head pages, and consolidate the cannibalised clusters. That is a ~10-wave programme, not a rewrite.

---

## 2. R1 — Machine-generation fingerprints 🔴

### 2.1 Every page claims the same update date

```
updatedDate: 2026-07-27   → 610 / 610 pages  (100%)
pubDate:     2026-06-04..07 → 604 / 610 pages  (99%, four days)
             2026-06-11/19  →   6 / 610
```

Six distinct `pubDate` values exist across the entire site. A 610-page research publication that published 99% of its corpus in four days and updated 100% of it on one day is the single clearest scaled-content signal available to a crawler. It also breaks `dateModified` credibility in `Article` schema on every page.

### 2.2 Template "insight" sentences — 401 / 610 pages (66%)

The `inject-invest-gulf-insights.mjs` pass injected branded clauses with interchangeable tails. These survived `6bb267a` because that cleanup matched whole sentences, not phrases.

| Phrase | Pages |
|---|---:|
| `Invest Gulf treats …` | **355** |
| `for foreign buyers in this market` | **126** |
| `Invest Gulf research keeps …` | 14 |
| `Invest Gulf coordinates …` | 8 |
| `Invest Gulf reconciles …` | 4 |
| **Any of the above** | **401** |

Real example from `guides/uae-golden-visa-property.mdx` — three concatenated stock tails in one page:

> "…and Invest Gulf treats brochure-only values as a red flag **before any reservation deposit for foreign buyers in this market during active due diligence before any reservation fee**."
> "…**for foreign buyers in this market during active due diligence before any reservation fee in the current GDRFA cycle**."
> "…**for foreign buyers during active due diligence before any reservation fee in the current GDRFA cycle across the full purchase file**."

This reads as spun content to a human and to a classifier. It is on the site's most important commercial page.

### 2.3 Template H2 headings — ~110 pages

| Heading pattern | Pages |
|---|---:|
| "What checklist should run before you sign?" (+4 variants) | 73 |
| "What red flags should pause this Gulf purchase?" (+3 variants) | 43 |
| "What risks should buyers plan for before they commit?" (+1) | 14 |

8 605 H2s across the corpus, 8 431 distinct — the tail is fine, but the head is a visible template.

### 2.4 Template "Related reading" blocks

8-gram analysis shows the same link block repeated across large slices: `dubai property investment guide` on **215** pages, `dubai rental yield guide` on **72**, `gulf expat living comparison` on **68**. These are not editorial links, they are a footer-grade template embedded in body copy.

### 2.5 Other fingerprints

- 10 pages carry a machine `Navigation: [a] · [b] · [c]` line in body copy.
- 9 pages contain literally duplicated paragraphs inside themselves — worst: `guides/convert-foreign-license-dubai` (**10** duplicated blocks, all "Insider tip:" variants).
- 4 pages use `author: "Invest Gulf Editorial Team"` while 606 use `"Invest Gulf Editorial"` — inconsistent E-E-A-T entity.

---

## 3. R2 — The over-pruning wound 🔴

### 3.1 What happened

`scripts/pruning-batch-b-report.json` (2026-07-03) selected **258 pages for pruning on one rule: zero GSC impressions in a 90-day window** on a domain that was ~4 weeks old at the time. Pages that had never been crawled were treated as pages that had failed. 197 of them are `noindex` on `main` today (72 from the report were not applied; 11 additional pages were noindexed outside the report).

### 3.2 The meta tag is `noindex,nofollow` — not `noindex`

`src/layouts/BaseLayout.astro:90`

```astro
{noindex ? <meta name="robots" content="noindex,nofollow" /> : ...}
{!noindex && <link rel="canonical" href={canonical} />}
```

Consequences on 201 rendered pages:
1. **`nofollow` kills outbound equity** — every internal link on those pages is dropped.
2. **No canonical is emitted** on noindex pages.
3. Combined with sitemap exclusion **and** `index.astro` listing filters (`.filter((g) => !g.data.noindex)`), those 197 pages receive **zero internal links from any hub** — they are fully orphaned, not merely deindexed.

There is no reason to `nofollow` your own site. `noindex,follow` is the correct directive for consolidation.

### 3.3 Head commercial terms were deindexed

**1 105 internal links across the corpus point at `noindex` pages** (135 distinct targets). The link equity is being poured into dead ends:

| Noindex target | Inbound internal links | Why this hurts |
|---|---:|---|
| `guides/gulf-expat-living-comparison` | **122** | Largest internal link sink on the site |
| **`guides/uae-golden-visa-property`** | **78** | **Head commercial term. Also the 301 destination of two other slugs.** |
| `guides/dubai-relocation-guide` | 69 | Top-of-funnel entry point |
| `guides/rak-vs-sharjah-living` | 30 | |
| `guides/dubai-monthly-budget-expat-family` | 27 | |
| `guides/uae-tax-residency-property` | 21 | |
| `guides/saudi-vs-uae-living` | 18 | |

`guides/uae-golden-visa-property` being `noindex` is the most expensive single decision in the repo. The commercial lead page `/golden-visa-dubai-property/` links to it as its main supporting guide — pointing its only depth link at a deindexed, nofollowed page.

### 3.4 Pages deindexed **despite having GSC impressions**

Nine pages were noindexed even though they appear in the impressions list inside `identify-zero-impression-pages.mjs`:

```
/guides/uae-tax-residency-183-day-rule/        ← 52 imp, position 6.6, listed in PRIORITY-CTR-LEADS
/guides/can-foreigners-buy-property-dubai/
/guides/best-off-plan-abu-dhabi/
/guides/abu-dhabi-driving-guide/
/guides/qatar-residency-by-property/
/guides/gulf-property-investment-comparison-2026/
/guides/living-west-bay-doha/
/guides/umm-al-quwain-property-investment/
/guides/wynn-al-marjan-island-timeline-impact/
```

`uae-tax-residency-183-day-rule` is the clearest case of self-harm in the audit: **the site's best-ranking page (position 6.6) was both `noindex`-ed and 301-redirected away**, while its near-duplicate twin `guides/uae-tax-residency-183-days` — which has **zero inbound links and is an orphan** — was kept indexable. The ranking page was killed in favour of the orphan.

### 3.5 Indexing hygiene — clean ✅

One thing that is *not* broken. Cross-checked `indexing-plan-batches-100.json` (120 URLs) and `submitted-urls.json` (690 URLs) against the noindex and redirect sets:

- URLs submitted that are `noindex`: **0**
- URLs submitted that are 301-redirected: **0**
- Noindex pages present in `sitemap-0.xml`: **0**

The indexing isolation policy and the sitemap exclusion lib (`scripts/lib/sitemap-exclusions.mjs`) are working correctly. No action needed. Claude did not and will not touch indexing.

---

## 4. R3 — Redirect architecture contradicts the content 🟠

`vercel.json` carries **151 redirect rules**. Three defect classes:

### 4.1 Thirty-six live MDX files sit behind a 301

The file exists, Astro builds it, then Vercel redirects the URL away. Build waste, and confusing signals. Six of them are **not even `noindex`** — they are fully indexable pages the site has quietly made unreachable:

```
INDEXABLE + 301'd:
  guides/international-schools-gulf-comparison  → guides/gulf-schools-comparison
  guides/golden-visa-2-million-aed-explained    → guides/uae-golden-visa-property   (dest is NOINDEX)
  compare/off-plan-vs-ready-property-uae        → guides/off-plan-vs-ready-property-dubai
  guides/best-off-plan-downtown-dubai           → guides/best-off-plan-areas-dubai-2026
  guides/best-off-plan-jvc-dubai                → guides/best-off-plan-areas-dubai-2026
  guides/villanova-dubai-property-investment    → areas/villanova-property-investment (dest is NOINDEX)
```

These are exactly the 7 pages the rendered audit flags as *indexable but absent from sitemap*.

### 4.2 Seventeen redirects point at `noindex` destinations

A 301 into a `noindex,nofollow` page is a terminal dead end — the redirect passes equity into a page that absorbs it and forwards nothing:

```
guides/uae-golden-visa-property-2026        → NOINDEX guides/uae-golden-visa-property
guides/golden-visa-2-million-aed-explained  → NOINDEX guides/uae-golden-visa-property
guides/uae-tax-residency-183-day-rule       → NOINDEX guides/uae-tax-guide-expats
guides/business-bay-property-investment     → NOINDEX areas/business-bay-property-investment
guides/mbr-city-property-investment         → NOINDEX areas/mbr-city-property-investment
guides/arabian-ranches-property-investment  → NOINDEX areas/arabian-ranches-property-investment
guides/al-marjan-island-property-investment → NOINDEX areas/al-marjan-island-property-investment
guides/mina-al-arab-property-investment     → NOINDEX areas/mina-al-arab-property-investment
guides/town-square-property-investment      → NOINDEX areas/town-square-property-investment
guides/jbr-property-investment              → NOINDEX areas/jbr-property-investment
guides/khalifa-city-property-investment     → NOINDEX areas/khalifa-city-property-investment
guides/masdar-city-property-investment      → NOINDEX areas/masdar-city-property-investment
guides/villanova-property-investment        → NOINDEX areas/villanova-property-investment
guides/manama-property-investment           → NOINDEX areas/manama-property-investment
guides/qatar-residency-by-property          → NOINDEX guides/qatar-property-buyer-relocation
guides/gulf-property-investment-comparison-2026 → NOINDEX guides/best-gulf-country-property-investment
guides/villanova-dubai-property-investment  → NOINDEX areas/villanova-property-investment
```

Note the pattern: the **guides→areas migration** moved 20+ area pages to `/areas/`, and then the pruning pass noindexed the destinations. The migration's entire value was cancelled.

### 4.3 Thirty-one duplicate rules

31 rules are byte-identical duplicates of another rule (`/guides/discovery-gardens-property-investment/`, `/guides/impz-property-investment/`, … full list in wave 2). Harmless at runtime, but they inflate the file and hide real defects.

---

## 5. R4 — Trust and rendering defects on live pages 🟠

### 5.1 A Thai phone number on a Gulf property site — 624 pages

`src/data/site.ts:8-9`

```ts
whatsapp: 'https://wa.me/66651195327',
whatsappDisplay: '+66 65 119 5327',
```

`+66` is **Thailand**. This renders in the footer, the lead form and the sticky mobile CTA on **624 of 637 pages**. For a buyer about to enquire on an AED 2M purchase this is a hard trust break, and for Google it is a local-relevance contradiction on an entity that claims `areaServed: ["AE","QA","SA","BH","OM","KW"]`. It is also the highest-leverage single-line conversion fix in the repo.

### 5.2 A competitor's brand inside the corpus — 57 files

57 MDX files contain **"MORE Group"**, including four `## MORE Group underwriting snapshot` H2 headings. The site passport is explicit:

> `note: "Independent Invest Gulf brand — do not copy MORE Group Phuket/UAE cross-content"`

Examples: `areas/dubai-south-property-investment` (12 occurrences), `areas/city-walk-property-investment` (6), `areas/discovery-gardens-property-investment` (3, incl. an H2), `areas/mbr-city-property-investment` (H2 "How does MORE Group underwrite MBR City deals?").

This is a policy violation, an E-E-A-T defect (an "independent" publisher presenting another firm's underwriting as its own method), and template-farm evidence — the same generator clearly served both sites. `llms.txt` compounds it by citing a **Phuket construction** article under "External Citations" on a Gulf property site.

### 5.3 611 of 637 rendered titles exceed the SERP limit — and 52 are visibly broken

`src/layouts/BaseLayout.astro:40`

```ts
const fullTitle = title.includes('Invest Gulf') ? title : `${title} | Invest Gulf`;
```

`scripts/trim-titles.mjs` trimmed frontmatter titles to ≤62 chars, then the layout appends ` | Invest Gulf` (+14). Result: **611 rendered titles run 63–88 characters**. Worse, the trim cut mid-phrase and the damage is now the live H1 *and* the SERP title:

```
Dubai Rental Yield: Gross vs Net (Area Table + Worked | Invest Gulf      ← unclosed paren
10 Mistakes Foreign Buyers Make in Dubai Property (and | Invest Gulf     ← unclosed paren
Abu Dhabi Golden Visa Property: DMT Rules, AED 2M Threshold, | Invest…   ← trailing comma
Capital Gains Tax on UAE Property: What Investors Need to | Invest Gulf  ← trailing "to"
Emaar Properties Review: Delivery Rate, Flagship Projects, a | Invest…   ← trailing "a"
Golden Visa Application Step by Step: Documents, Timeline, a | Invest…   ← trailing "a"
```

**52 titles end on a dangling conjunction/preposition or a stray letter; 2 have unbalanced parentheses.** Every one of these is a CTR penalty on a page that already has impressions.

### 5.4 Duplicate H1 on 233 pages

`ArticleLayout.astro:88` renders `<h1>{title}</h1>` from frontmatter, **and 232 MDX bodies still contain a markdown `# ` heading**. 220 of those body H1s carry *different* text from the frontmatter title — usually the original untruncated version:

```
guides/abu-dhabi-banking-expats
  layout H1: "Abu Dhabi Banking for Expats: FAB, ADCB, ADIB, WPS"          (truncated)
  body   H1: "Abu Dhabi Banking for Expats 2026: FAB, ADCB, ADIB, WPS & Remittances"  (full)
```

Two competing H1s with divergent text on a third of the site. Ironically the **body H1s are the better copy** — they are the pre-trim originals. That makes wave 3 cheap: restore titles *from* the body H1s, then delete the body H1s.

### 5.5 Schema gaps

| Type | Pages | Note |
|---|---:|---|
| `Organization` + `NewsMediaOrganization` | 633 | ✅ good, includes `founder`, `sameAs`, Wikidata `Q140471703` |
| `FAQPage` | 611 | ✅ every article page |
| `Article` | 610 | ✅ but `dateModified` is 2026-07-27 on all of them |
| **`BreadcrumbList`** | **0** | ❌ **610 article pages have none** |
| JSON-LD parse errors | 0 | ✅ |

No `BreadcrumbList` anywhere is a straightforward AEO/GEO loss: it is the schema most used for SERP breadcrumb display and for answer-engine site-structure understanding. There is also **no visible breadcrumb navigation** in the layouts.

### 5.6 Money pages are the thinnest pages on the site

The commercial pages that must convert hot leads are shorter than every single guide:

| Lead page | Rendered words | Assessment |
|---|---:|---|
| `/abu-dhabi-property-investment/` | 243 | thinnest commercial page |
| `/invest-dubai-off-plan/` | 254 | |
| `/get-shortlist/` | 259 | |
| **`/golden-visa-dubai-property/`** | **260** | ~110 words of copy + a form; its only depth link goes to a **noindex** guide |
| `/gulf-property-investment-consultation/` | 270 | |
| `/invest-dubai-property/` | 345 | |
| **`/` (homepage)** | **407** | |
| `/gcc-rental-yields/` | 535 | best of the set, still thin |

Median guide: 2 003 words. The site put 2 000 words into "Dubai prayer times" and 260 into its Golden Visa money page.

### 5.7 Minor

- **633 pages** carry `<img alt="">` (empty alt) — hero images with no alt text. No missing `alt` attributes, so it is a content gap not a validity error.
- `/design-preview.html` and `/logo-preview.html` ship to production (both `noindex`, but they are dev artefacts in the public build).
- No `hreflang` — correct for an EN-only site, no action.
- 4 title tags exceed 62 chars *in frontmatter itself* (before suffix): `guides/dubai-property-market-forecast-2026-2027`, `news/damac-islands-handover-update-2026`, `news/dubai-golden-visa-applications-2026`, `news/emaar-creek-waters-launch-2026`.

---

## 6. Cannibalization

Intent clusters among **indexable** pages. The corpus is dense enough that most head terms have 5–7 pages competing:

| Cluster | Indexable pages | Worst overlap |
|---|---:|---|
| **Rental yield** | **62** | Dubai yield alone: `dubai-rental-yield-guide`, `highest-rental-yield-areas-dubai`, `gross-vs-net-yield-dubai`, `how-to-calculate-rental-yield-dubai`, `net-yield-calculator-uae-property`, `dubai-capital-appreciation-vs-yield`, `best-dubai-developers-rental-yield` = **7 pages, one query set** |
| **Schools / fees** | 37 | `dubai-school-fees-by-curriculum` vs `dubai-vs-abu-dhabi-school-fees` vs `gulf-schools-comparison` vs `school-fees-vs-property-budget-dubai` |
| **Tax** | 23 | `uae-tax-residency-183-days` (orphan, indexable) vs `uae-tax-residency-183-day-rule` (**noindex + 301, was ranked 6.6**) vs `uae-tax-guide-expats` |
| **Golden Visa** | 18 + head term noindexed | 18 satellites compete while `uae-golden-visa-property` is deindexed and `/golden-visa-dubai-property/` has 260 words |
| **Off-plan** | 19 | `off-plan-property-dubai-guide` / `off-plan-vs-ready-property-dubai` / `off-plan-vs-secondary-market-dubai` / `best-off-plan-areas-dubai-2026` + 3 more behind 301s |
| **Freehold / can-foreigners-buy** | 18 | `freehold-vs-leasehold-dubai` vs `compare/freehold-vs-leasehold-uae`; `can-foreigners-buy-property-uae` vs `can-foreigners-buy-property-dubai` (noindex+301) |
| **Developer reviews** | 17 | `emaar-properties-review` vs `compare/emaar-vs-*` (5 pages) vs `dubai-developers-guide` vs `how-to-evaluate-dubai-developer` |
| **Company setup** | 12 | 7 near-identical free-zone pages (`ifza`, `jafza`, `dmcc`, `rakez`, `difc`, `shams`, `abu-dhabi-mainland-llc`) |

**Judgement:** these are not 5 duplicate pages to delete. They are genuine sub-intents that were written as **separate pages instead of sections of one authoritative hub**. The fix is hub consolidation with 301s, not mass deletion — which is also exactly the recovery pattern for scaled-content demotion.

---

## 7. Link graph

| Signal | Count | Detail |
|---|---:|---|
| Dead internal links | **23** (6 targets) | `/areas/gulf-residency-by-investment-guide/` ×9 (wrong collection — it is a *guide*), `/guides/saudi-vs-uae-property-investment/` ×6 (it is in *compare*), `/compare/dubai-property-investment-guide/` ×5 (it is in *guides*), `/compare/oman-property-investment-guide/`, `/guides/rak-vs-fujairah-property-investment/`, `/compare/sharjah-vs-dubai-rent/` |
| Links into 301 chains | **52** (20 targets) | `/guides/gulf-property-investment-comparison-2026/` ×15, `/guides/lusail-city-property-investment/` ×5, `/guides/dubai-vs-abu-dhabi-cost-living/` ×4 |
| Links into `noindex` pages | **1 105** (135 targets) | see §3.3 |
| Orphans (indexable, 0 inbound) | **65 / 407** | guides 42, news 9, areas 8, compare 3, projects 3 |
| Trailing-slash inconsistencies | 0 | ✅ |

**All 6 dead-link targets are collection-path errors**, not missing content — the pages exist under a different collection. Trivial, high-value fix.

Notable orphans: `guides/oman-driving-license` (**313 GSC impressions — priority page, zero internal links**), `guides/uae-tax-residency-183-days`, `guides/is-dubai-property-bubble-2026`, `guides/dubai-property-valuation-guide`, `guides/ellington-properties-review`, all 4 recent `news/*` items.

Link distribution is also extremely top-heavy: `guides/dubai-property-investment-guide` takes **305** inbound links while 65 pages take zero.

---

## 8. GEO / AEO state

`npm run geo:audit`: **43 files below minimum**, corpus avg **90/100 (grade A)**. Rubric: answer 97 | self 85 | **structure 84** | stats 97 | **unique 81**.

Structure and uniqueness are the weak axes — consistent with §2 (template H2s, template insight sentences).

Worst 12 (all `[D]`, 52–58):

```
52  guides/bahrain-golden-residence-property     ← also noindex AND 301'd. Fix or drop, not both.
52  guides/sharjah-vs-dubai-commute-property     ← 0 citability blocks
54  guides/how-to-calculate-rental-yield-dubai   ← 5% coverage; cannibalises dubai-rental-yield-guide
54  guides/oman-banking-expats
55  compare/emaar-vs-nakheel                     ← missing insider-tip
55  guides/ellington-properties-review           ← also an orphan
55  guides/saudi-vs-uae-living
56  guides/arada-developer-review
56  guides/dubai-monthly-budget-expat-family     ← 27 inbound links, and it is noindex
56  guides/rent-vs-buy-dubai-expat
56  projects/sobha-hartland-2                    ← also an orphan
58  guides/qatar-residency-by-investment
```

Then a gap to `[B]` 70–74 (6 files) and `[A]` 81–82 (2 files).

**AEO assets in good shape:** `llms.txt` (2.2 KB) and `llms-full.txt` (37 KB) exist, with entity disambiguation and Wikidata linkage — genuinely above market. Two defects: the Phuket citation (§5.2) and `Updated: 2026-07-09` is stale.

---

## 9. Fact-check flags (YMYL)

Not errors I can confirm without primary sources, but they need verification before these pages get promoted:

1. **Saudi foreign ownership — highest priority.** The site's #2 traffic page is `guides/saudi-rental-yield-guide`, titled *"4% to 6% **in Riyadh and Jeddah**"* (380 impressions, position 9.3). The Foreign Property Ownership Law took effect **21 January 2026** (the corpus consistently says 22 January — check which is right), and reporting indicates **Riyadh, Jeddah, Makkah and Madinah are excluded from general foreign residential ownership**, with ownership permitted only in specifically approved zones, plus a REGA transfer fee capped at 5% and ~10% combined fees/taxes. The corpus wording ("designated zones") is defensible, but the **title and description promise Riyadh and Jeddah yields to foreign buyers**. Verify against REGA before this page is refreshed. Affects `saudi-rental-yield-guide`, `saudi-arabia-property-foreigners-guide`, `areas/riyadh-property-investment`, `areas/jeddah-property-investment`, `news/saudi-foreign-ownership-update-2026`.
2. **Golden Visa down-payment rule.** Corpus says the 50% down-payment requirement "was removed in widely reported policy updates"; current reporting attributes removal to a **February 2026 federal circular**, with DLD valuation certificate as the test. Add the specific instrument and date — vague sourcing on a YMYL claim is an E-E-A-T cost.
3. **`news/` collection is stale.** Newest item is dated within the same June–July window as everything else; nothing covers Q3 2026. A "news" section that never updates is a negative freshness signal — either feed it or retire it.

---

## 10. Competitor / SERP reading

Head terms checked: Dubai rental yields, Golden Visa via property, buy-as-foreigner + DLD fees, Dubai service charges/Mollak, RAK–Wynn Al Marjan, Saudi 2026 ownership law.

**Who ranks:** almost exclusively **brokerages and developers** — `drivenproperties.com`, `pearlshire.com`, `houseandhedges.ae`, `egsh.ae`, `dubailivin.com`, `astraterra.ae`, `sherwoodsproperty.com`, `lymrealestate.com`, `orfaliproperties.com`, `districtuae.com`, plus `engelvoelkers.com` and `guestready.com`.

**What that means for Invest Gulf:**

| Competitor weakness | Invest Gulf's opening |
|---|---|
| Every ranking page has a transaction incentive; none will publish downside honestly | **Independence is the only real moat.** Risk, dispute, exit-cost and "when not to buy" content is structurally unavailable to brokers |
| Coverage is broad and shallow — same AED 2M / 4% DLD / 7-9% yield facts recycled | Depth, worked models, and primary-source citation |
| Almost no interactive tools; buyers are sent to contact forms | **Calculators and indexes** — total-cost, net-yield-by-building, service-charge lookup. The site has `net-yield-calculator-uae-property` as *prose*, not a tool |
| Slow on regulatory change (Saudi Jan-2026 law, Golden Visa Feb-2026 circular are thinly covered) | Fast, dated, sourced regulatory updates — the strongest AEO/GEO play available |
| Brokers dominate Dubai; **RAK/Wynn, Oman ITC, Saudi zones are far less contested** | Secondary Gulf markets are winnable now |

**Uncomfortable but important:** the corpus already covers nearly every standard topic — all 12 major buyer nationalities, 30 comparison pages, 8 free-zone setups, every yield/off-plan/Golden-Visa angle. **The site does not have a topic gap. It has a credibility and architecture problem.** Publishing 30 more conventional guides in the current state would deepen the demotion, not lift it. The content roadmap is therefore built on *different content types*, and is explicitly gated behind cleanup waves 0–4.

---

## 11. What is healthy (do not "fix")

- `qa:corpus` **PASS** — em-dash, padding dupes, fix-queue, MDX patterns all clean.
- Sentence-level spam cleanup from `6bb267a` **worked** — 0 sentences repeated across ≥8 pages.
- Zero thin pages (min 836 words), zero duplicate titles, zero duplicate descriptions, zero description-length violations.
- Zero JSON-LD parse errors; `Organization`/`FAQPage`/`Article` on every article page.
- Sitemap exclusion logic is correct; **zero** noindex or 301 URLs in the sitemap.
- **Indexing hygiene is clean** — 0 bad URLs in the plan or the submitted log. Isolation policy respected.
- Trailing-slash policy consistent; `www` → apex 308 in place; security headers set.
- `llms.txt` / `llms-full.txt` with entity disambiguation + Wikidata — ahead of every competitor checked.

---

## 12. Assumptions made (per corpus-cleanup-mode: document, don't ask)

1. **Restoring index status beats keeping the prune.** The prune's single criterion (zero impressions in 90 days on a 4-week-old domain) was not evidence of low quality. I propose re-indexing on commercial value, not re-running the impressions rule. Wave 1 is written to be reversible.
2. **`noindex,nofollow` → `noindex,follow` is not a strategy change**, it is a defect fix, so it sits in wave 0 rather than waiting for a separate decision.
3. **Consolidate, don't delete.** For cannibalised clusters I assume merge-into-hub + 301, matching both the documented recovery pattern and `corpus-cleanup-mode`'s ban on mass deletion.
4. **The 30 new topics stay blocked until wave 4 lands.** Writing into an un-repaired corpus wastes the work.
5. **Titles get restored from the body H1s** (they are the pre-trim originals) rather than rewritten from scratch — cheaper and closer to intent.
6. **The `+66` number needs a real UAE/Gulf replacement from Maxim.** I have not guessed a number; wave 0 carries it as an input, not a fix.

---

## 13. Deliverables

| File | Contents |
|---|---|
| `.content-os/reports/AUDIT-REPORT-2026-08-21.md` | this document |
| `.content-os/batches/corpus-cleanup-roadmap-2026-08-21.md` | 11 fix waves, ≤25 slugs each, ordered by recovery impact |
| `.content-os/batches/content-roadmap-2026-08-21.md` | 30 new topics, gated behind wave 4 |
| `.content-os/batches/topics-proposal.json` | the same 30 topics, machine-readable |

**Nothing was written to MDX. No PR. No push to main. No indexing.**
Awaiting «ок» on the cleanup roadmap and Wave 1 scope.
