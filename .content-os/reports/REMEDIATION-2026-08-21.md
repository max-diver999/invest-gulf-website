# Remediation report — invest-gulf.com

**Date:** 2026-08-21
**Branch:** `claude/invest-gulf-content-audit-nn1isp`
**Scope:** all 11 waves of `corpus-cleanup-roadmap-2026-08-21.md`, executed after Maxim's approval
**Audit that drove this:** `.content-os/reports/AUDIT-REPORT-2026-08-21.md`

---

## Result

All repository quality gates pass:

```
npm run build            → exit 0   (postbuild rendered audit: 586 pages, 0 errors, P0 0, P1 0)
npm run validate:content → exit 0   (0 issues / 586 files, was 44)
npm run qa:corpus        → exit 0
npm run geo:audit        → exit 0   (was failing)
npm run audit:images     → exit 1   ← sandbox artefact, see §"Known non-issue"
```

---

## Before → after

| Metric | Before | After |
|---|---:|---:|
| MDX files | 610 | **586** |
| `noindex` pages | 197 (32.3%) | **96 (16.4%)** |
| Robots directive on deindexed pages | `noindex,nofollow` | **`noindex,follow`** |
| Canonical emitted on noindex pages | no | **yes** |
| URLs in sitemap | 429 | **512** |
| Redirect rules | 151 | **83** |
| Duplicate redirect rules | 67 | **0** |
| Redirect sources that still existed as MDX | 36 | **0** |
| Redirects resolving to a `noindex` destination | 17 | **0** |
| Rendered `<title>` over 62 chars | 611 | **0** |
| Titles truncated mid-phrase | 62 | **0** |
| Pages rendering two `<h1>` | 233 | **0** |
| Article pages with `BreadcrumbList` | 0 | **586** |
| Hero images with empty `alt` | 610 | **0** |
| Dead internal links | 23 | **0** |
| Internal links into 301 chains | 52 | **0** |
| Internal links into `noindex` pages | 1 105 (19%) | **107 (1.8%)** |
| Orphan pages (indexable, 0 inbound) | 65 | **0** |
| Files referencing "MORE Group" | 51 | **0** |
| Machine wrapper headings (`What should buyers know about …`) | 150 | **0** |
| Filler `for foreign buyers in this market` | 126 files | **0** |
| `Invest Gulf treats` occurrences | 344 | **56** |
| Brand mentions in body copy | 8 043 (~13.7/page) | **4 313 (~7.4/page)** |
| Machine `Navigation:` lines | 10 | **0** |
| Pages with internally duplicated paragraphs | 8 | **0** |
| Truncated link anchors (`…`) | 34 | **0** |
| Distinct `pubDate` values | 6 | **229** |
| Distinct `updatedDate` values | 1 | **79** |
| GEO avg (commercial) | 90 | 87 |
| GEO gate | ❌ fail | ✅ **pass** |
| `validate:content` issues | 44 | **0** |

---

## What was done, wave by wave

### W0 — Site configuration
- `BaseLayout.astro`: `noindex,nofollow` → **`noindex,follow`**; canonical now emitted on every page; brand suffix appended only when the title still fits inside 60 characters.
- `ArticleLayout.astro`: **`BreadcrumbList` schema + visible breadcrumb nav** on all 586 article pages; hero images given descriptive `alt`.
- `BaseLayout` now accepts an array of JSON-LD objects so a page can carry `Article` + `BreadcrumbList` + `Organization`.
- Removed `public/design-preview.html` and `public/logo-preview.html` from the deployed build.
- `llms.txt`: dropped the Phuket construction citation, refreshed the `Updated:` date.
- **Not done, per your instruction:** the `+66` (Thailand) WhatsApp number in `src/data/site.ts` is unchanged and still renders on ~610 pages. This remains the single highest-leverage conversion and trust fix outstanding.

### W1 — Index restoration
85 pages had `noindex` removed, selected on a documented rule — a page qualifies if it is a 301 destination, has ≥10 inbound internal links, appears in the GSC impressions list, or is a head commercial term — rather than on the "zero impressions in 90 days" rule that caused the original damage. Restored pages include `uae-golden-visa-property` (78 inbound links, destination of two 301s), `gulf-expat-living-comparison` (122), `dubai-relocation-guide` (69) and `uae-tax-residency-183-day-rule` (previously ranked at position 6.6 and then deindexed).

The remaining 96 `noindex` pages are thin satellites with no links and no impressions; leaving them deindexed keeps the corpus below the ~30% threshold at which sitewide demotion is observed.

### W2 — Redirect architecture
- 67 duplicate rules collapsed.
- 22 MDX files whose URLs were permanently redirected were deleted; every one was a genuine duplicate whose 301 destination serves the query better. This includes the six that were indexable-but-unreachable, which you asked me to judge: all six were duplicates (`golden-visa-2-million-aed-explained` → `uae-golden-visa-property`, `international-schools-gulf-comparison` → `gulf-schools-comparison`, and four `best-off-plan-*` pages → `best-off-plan-areas-dubai-2026`). Restoring them would have re-created cannibalisation; removing the orphaned files makes the existing 301s clean instead.
- **`uae-tax-residency-183-day-rule` reversed:** its 301 was removed and its orphan twin `uae-tax-residency-183-days` now redirects *into* it. The page that actually ranked is canonical again.
- Result: zero redirect sources that still exist as files, zero dead destinations, zero redirects into `noindex`.

### W3 — Titles and H1
- 71 truncated titles repaired, restored from the untruncated body H1s where available, plus 12 hand-written titles for priority commercial and GSC pages, plus 10 further titles that were cut mid-word (`… & Chiller B`, `… Designated Z`, `… Manama F`).
- All 586 frontmatter titles now sit in the 45–60 character band, which satisfies the repo validator and leaves room for the brand suffix without exceeding the SERP limit.
- 225 duplicate body `# ` headings removed; **zero pages now render two H1s**.

### W4 — De-fingerprinting (the core wave)
- **1 941 filler tails removed** (`for foreign buyers in this market`, `during active due diligence before any reservation fee`, `in the current GDRFA cycle`, `in Invest Gulf models` and six more), scoped to sentences that actually carried them.
- **1 369 branded subject phrases diversified** across grammar-preserving variants, with position-aware capitalisation, so no single construction dominates the corpus. `Invest Gulf treats` fell from 344 occurrences to 56.
- **171 subject–verb agreement errors** introduced by those swaps were found and corrected in three passes (`we still routes` → `we still route`, `we compare … and often finds` → `and often find`).
- **150 machine wrapper headings** unwrapped into natural headings (`## What should buyers know about Service charges can rise after handover?` → `## Service charges can rise after handover`), and **124 template question headings** rewritten to be page-specific.
- 10 machine `Navigation:` lines removed; 18 internally duplicated paragraphs and 16 duplicated sentences removed; 34 truncated link anchors regenerated from their target's title; 3 titles carrying a `in?` year-strip artefact repaired.

### W5 — Competitor brand removal
All 51 files containing "MORE Group" cleaned, including 16 headings. Claims were converted to neutral or first-person editorial voice (`MORE Group underwriting for X starts with` → `Sound underwriting for X should start with`) rather than simply relabelled — transferring another firm's specific underwriting claims onto Invest Gulf would have swapped a policy violation for a truthfulness problem.

### W7 — Link graph
- All 23 dead internal links fixed (every one was a wrong-collection path, e.g. `/areas/gulf-residency-by-investment-guide/` → `/guides/…`).
- All 52 links into 301 chains repointed to final destinations.
- **70 orphan pages given contextual inbound links** from topically-matched donors, with varied lead-in phrasing so the fix does not itself become a template. Includes `dubai-police-clearance-certificate` (828 GSC impressions) and `oman-driving-license` (313).
- 12 stale `relatedSlugs` entries repaired or dropped.

### W8 — Consolidation
Executed conservatively. The bulk of consolidation happened in W2 (22 duplicate files removed behind existing 301s). Beyond that I acted only where the overlap was unambiguous:
- **IMPZ and Dubai Production City are the same place.** `areas/impz-property-investment` merged into `areas/dubai-production-city-property-investment` with a 301.
- Titles differentiated on three genuinely competing pairs (`uae-tax-residency-property` repositioned to the property-owner angle; the Dubai yield hub and `highest-rental-yield-areas-dubai` separated so they no longer target the same phrase).

I did **not** mass-merge the yield, schools or free-zone clusters. A title-similarity sweep found 70 candidate pairs, but on inspection nearly all are distinct markets (Bahrain vs Muscat schools, Dubai vs Oman driving licences) rather than cannibalisation. Deleting genuinely distinct pages to satisfy a similarity score would have cost real coverage.

### W9 — GEO
- **113 thin H2 openings expanded** with page-specific substance across the 10 worst-scoring pages.
- **22 sections that had no opening paragraph at all** (a heading followed straight by a table) given real 40–60 word openings.
- **95 citability paragraphs** brought back into the 130–170 word band with genuine, hand-written editorial content — no filler. These paragraphs had fallen below the threshold precisely because W4 stripped the padding that used to hold them there.
- Missing insider tip added to `compare/emaar-vs-nakheel`.
- Result: **0 files below the minimum score, 0 hard issues, gate passes.**

### W10 — Money pages
Every thin commercial page rewritten with substantive content:

| Page | Before | After |
|---|---:|---|
| `/golden-visa-dubai-property/` | 260w | full rewrite: what counts toward AED 2M, three routes, costs, FAQ with `FAQPage` schema |
| `/gcc-rental-yields/` | 535w | added why gross misleads across borders, what to hold constant, liquidity |
| `/invest-dubai-property/` | 345w | entry costs, filter method, yield vs growth, buying from abroad |
| `/abu-dhabi-property-investment/` | 243w | how AD differs from Dubai, three theses, realistic modelling, Golden Visa |
| `/invest-ras-al-khaimah-property/` | 236w | Wynn repricing, three communities, yield reality, pre-reservation checks |
| `/invest-dubai-off-plan/` | 254w | what escrow does and does not protect, payment plans, developer risk |
| `/invest-abu-dhabi-off-plan/` | 201w | DMT vs DLD mechanics, checks, timing |
| `/gulf-property-investment-consultation/` | 270w | what a consultation covers, what to prepare, markets |
| `/get-shortlist/` | 259w | what you get back, what we need, how it differs from a broker list |
| `/` homepage | 407w | what Invest Gulf is and is not, method, where to start |
| `/methodology/` | 177w | rents and yields method, what we do not do, limitations, corrections policy |

### W6 — Dates
Executed last, so dates reflect the finished corpus. Per your instruction I spread them rather than keeping them honest-but-uniform:
- `pubDate` distributed across **June 2025 → June 2026**, weekday-biased, deterministic by slug.
- `updatedDate` distributed across **May → August 2026**, always after `pubDate` and never in the future.
- 4 pages using `author: "Invest Gulf Editorial Team"` normalised to the site-wide entity.

**Flagging this once, as agreed:** I recommended honest dates in the audit and you chose spread dates. What is defensible about the outcome is that the previous state (100% of pages claiming an update on 2026-07-27, 99% published across four days) was itself inaccurate — the domain has had GSC impressions since May 2025, so a 2025–2026 publishing spread is closer to the site's actual life than the bulk-import stamp was. What remains is that individual dates are assigned rather than recorded. If you want this on a fully evidenced footing later, the fix is to derive `pubDate` from `git log --diff-filter=A` per file.

---

## Two corrections to the original audit

1. **"633 pages with empty `alt`" was partly a false positive.** The empty `alt` on the header logo is *correct* accessibility practice, because the logo sits inside a link that already contains the site name as text. The real defect was the hero images, which did carry empty `alt` and are now fixed.
2. **"57 files with MORE Group / Phuket / Thailand" overstated the brand leakage.** 51 files contained "MORE Group" and those were genuine violations. The remaining Thailand and Phuket mentions are legitimate comparative-market references (Thai condominium quotas, Phuket yields as a comparison point) and were correctly left in place.

---

## Known non-issue

`npm run audit:images` exits 1 with 260+ `[403]` results. Every one is a URL on `https://invest-gulf.com/images/…`, and **this sandbox's egress proxy blocks that host** — the same 403 that prevented the live crawl in Phase 0. I verified all **285 referenced images exist locally** under `public/images/`, so the failure is an environment artefact, not a content defect. This gate should be re-run from a machine with normal network access before deploy.

---

## What is still outstanding

1. **The `+66` phone number** — deferred by your instruction. One line in `src/data/site.ts`, ~610 pages affected.
2. **Live-site verification** — HTTP status codes on Vercel, Core Web Vitals, real GSC index coverage, and confirmation that the deployed build matches this branch. All four need a machine that can reach the domain.
3. **The Saudi fact-check** — `saudi-rental-yield-guide` (site's #2 page by impressions) is titled "4% to 6% in Riyadh and Jeddah" while reporting indicates Riyadh, Jeddah, Makkah and Madinah are excluded from general foreign residential ownership under the January 2026 law. The body copy is careful ("designated zones"); the title and description promise more. This needs verification against REGA, which I could not reach from here.
4. **The 30-topic content roadmap** — unchanged and still gated. Its precondition (waves W0–W4) is now met, so it can start on your word. Topic #7, the Saudi ownership-law page, is the one I would write first because it resolves item 3.
5. **`unique` rubric axis sits at 53** where it was 81. That is not a regression in quality: the old score was largely counting brand-name repetition, because the scorer's `UNIQUE_RE` literally matched the string "Invest Gulf". I rewrote that regex to measure first-hand research markers instead, and added QAR/OMR/BHD/KWD to the currency patterns, which the Gulf-focused scorer was missing entirely. The 53 is the honest baseline; raising it means adding genuine first-hand analysis, not brand mentions.

---

## Files changed

- `src/content/**` — 586 MDX files (23 deleted)
- `src/layouts/BaseLayout.astro`, `src/layouts/ArticleLayout.astro`
- `src/pages/` — 11 commercial and static pages
- `scripts/lib/geo-citability-scorer.mjs` — `UNIQUE_RE`, `SKIP_H2`, Gulf currency patterns
- `vercel.json` — 151 → 83 redirect rules
- `public/llms.txt`; `public/design-preview.html` and `public/logo-preview.html` deleted

**No push to `main`. No PR. No deploy. No indexing.**

---

# Phase 2 — bringing the live site to a finished state

Run after the wave work, on the instruction to finish the current site before any new articles.

## Gates

```
npm run build            → exit 0   (postbuild: 586 pages, 0 errors, P0 0, P1 0)
npm run validate:content → exit 0
npm run qa:corpus        → exit 0
npm run geo:audit        → exit 0
```

## What phase 2 fixed

### Machine residue the wave work had missed

| Defect | Found | Now |
|---|---:|---:|
| `serpExempt` / `serpExemptReason` dead frontmatter (not in the schema, read by nothing, values literally logging fix-batch runs) | 583 files | **0** |
| `{/* geo-cit-a */}` generator markers in body copy | 30 | **0** |
| Machine wrapper headings at H3–H6 that the H2-only pass could not see (`What should you verify for …`, `What should Gulf buyers budget for …`, `What should you check on …`, `What should you know about …`, `How does X work for expats?`) | 215 | **0** |
| Headings with broken capitalisation (`Uae`, `hsbc oman`, `islamic`, `invest gulf`) | 50 | **0** |
| Truncated headings cut mid-word (`… residency ro`, `… from your acc`, `… home-country r`) | 4 | **0** |
| Descriptions opening `Complete guide to …` | 20 | **0** |
| Closing lines repeated across 4+ pages | 6 | **2** (both legitimate hub cross-links) |
| Duplicate paragraphs inside a page | 0 | **0** |

### Technical and Core Web Vitals

- **`robots.txt` was structurally wrong.** `Disallow: /api/`, `/thanks/` and `/site-report/` sat after the last `User-agent` block, so they applied only to PerplexityBot and never to Googlebot. Rewritten so every group carries its own rules.
- **`llms-full.txt` advertised 24 deleted URLs** to AI crawlers and listed `noindex` pages alongside indexable ones. The generator now filters `noindex` and was re-run: 490 URLs, 0 dead, 0 noindex.
- **Images recompressed: 72 MB → 40 MB** (231 JPEGs, 63 WebPs, 1 PNG) with mozjpeg at q76. Files over 300 KB fell from 71 to 13, and the largest hero went from 867 KB to ~220 KB. All 285 referenced images verified present and decodable afterwards.
- **Hero image**: added `width`/`height` (reserves layout, kills CLS), `fetchpriority="high"` and `decoding="async"` for LCP.
- **Inline content images**: a new rehype plugin (`scripts/lib/rehype-image-attrs.mjs`) adds `loading="lazy"`, `decoding="async"` and intrinsic dimensions at build time, sourced from `scripts/data/image-dimensions.json` (regenerated by `node scripts/build-image-dimensions.mjs`). Previously 81 files shipped inline images with no dimensions, loading eagerly against the hero.

### Content

- **Saudi Arabia corrected and updated.** The effective date was wrong across 24 references (22 → **21 January 2026**). Added the confirmed detail from the Executive Regulation approved **23 June 2026**: Riyadh has **9** designated zones, Jeddah **57**, Makkah and Madinah stay restricted to Muslim buyers, a foreign resident may hold one unit outside the map for personal use, and transfer charges are capped at 5%. Three FAQ answers still describing the superseded "phased list" position were rewritten. The two Saudi hub pages carry different treatments so the update does not become duplicate content.
- **`/contact/` expanded** from 289 words with what we can and cannot help with, response times, and a press/data-use section.
- **31 genuinely incomplete H2 openings** expanded with page-specific substance across 8 files; blocks under 28 words fell from 31 to **0**.
- **22 pages had fewer than 5 outbound internal links**; all now clear it, with donors chosen to favour under-linked targets rather than the already top-heavy hubs.
- **News dates reconciled with their reporting periods.** Date spreading had produced items published before the month they report on (`uae-mortgage-rates-june-2026` dated 5 May). Three items corrected.

## One correction to phase 1, and a mistake worth recording

**My Saudi flag in the audit was too strong.** I wrote that Riyadh and Jeddah were "excluded from general foreign residential ownership", implying the site's #2 traffic page was making a false claim. On closer research that is not right: foreigners can buy in both cities inside designated zones, and Jeddah in particular has 57 of them. The page's body copy was careful and correct throughout — it always said "designated zones". What the pages actually needed was the newer, concrete detail, not a correction. The date was genuinely wrong and is now fixed.

**A pass I wrote damaged content and was reverted.** A "list repair" heuristic intended to move a handful of paragraphs out of the middle of numbered lists matched 821 paragraphs across 181 files, because a label introducing a sub-list (`Documents commonly required:`) looks identical to the defect. It hoisted legitimate structure and, in one file, separated `3-year scenario:` labels from their content. I reverted `src/content` to the last commit and re-ran the whole phase-2 pipeline from scripts, this time with a rewritten inserter that never touches headings, list items, tables or JSX. The four genuine cases were fixed individually instead. Nothing from that pass survives in the committed tree.

## Still outstanding

1. **The `+66` phone number** in `src/data/site.ts`, left per your instruction. One line, ~610 pages.
2. **Live-site verification** — HTTP status codes on Vercel, real Core Web Vitals, GSC index coverage. The sandbox blocks `invest-gulf.com`, so `npm run audit:images` also still exits 1 there for the same reason; all referenced images are verified present locally.
3. **`unique` rubric axis at 53.** Unchanged and honest: the old 81 was counting brand repetition. Raising it means adding genuine first-hand analysis.
4. **The 30-topic roadmap**, unstarted and ready when you are.
