# Corpus cleanup roadmap — invest-gulf.com

**Date:** 2026-08-21
**Source:** `.content-os/reports/AUDIT-REPORT-2026-08-21.md`
**Rules:** `more-group-content-os/policies/corpus-cleanup-mode.md` — ≤25 slugs per PR, no mass regex, no `geo-fix-corpus-all.mjs`, no new slugs
**Branch prefix:** `cc/gulf-`
**Status:** 🔴 **NOT APPROVED — awaiting Maxim «ок»**. Nothing below has been executed.

---

## Ordering logic

Waves are ordered by **recovery impact per unit of risk**, not by convenience:

```
W0  site-wide config      → stops ongoing damage on 610 pages, 1 PR, zero content risk
W1  restore index status  → recovers the commercial head terms + 1105 wasted links
W2  redirect architecture → removes 301→noindex dead ends
W3  titles + H1           → fixes 611 broken SERP titles / 233 duplicate H1
W4  de-fingerprint        → removes the scaled-content signal (the actual demotion driver)
W5  MORE Group removal    → policy violation + E-E-A-T
W6  date realism          → removes the 100%-same-date fingerprint
W7  link graph repair     → 23 dead + 52 chains + 65 orphans
W8  cannibalization       → hub consolidation, the highest-effort wave
W9  GEO below-min 43      → the original baseline task
W10 money pages           → conversion + commercial depth
```

**W0–W4 are the pessimization exit.** W5–W10 are the climb back. Do not reorder W4 later — it is the wave that addresses the actual cause.

Gates on **every** PR:

```bash
npm run fix:markdown-glue -- --dry    # must report 0 files would change
npm run validate:content:changed
npm run validate:batch -- --changed
npm run geo:audit                     # regression check, corpus avg must not drop
```

Waves touching many `href`s (W2, W7, W8) additionally run `npm run check-links`.

---

## Wave 0 — Site-wide configuration ⚙️

**Branch:** `cc/gulf-wave0-config` · **Files:** 4 (no MDX) · **Risk:** low · **Impact:** 610+ pages

Not slug-based, so it does not consume the ≤25 budget. Run first — every later wave inherits it.

| # | Fix | File | Detail |
|---|---|---|---|
| 0.1 | **Replace the Thai phone number** | `src/data/site.ts:8-9` | `+66 65 119 5327` → a real UAE/Gulf number. **INPUT NEEDED FROM MAXIM** — I will not guess. Renders on 624 pages. |
| 0.2 | `noindex,nofollow` → `noindex,follow` | `src/layouts/BaseLayout.astro:90` | Stops equity loss on 201 pages. Deliberate deindex stays intact. |
| 0.3 | Emit canonical on noindex pages | `src/layouts/BaseLayout.astro:92` | Remove the `{!noindex && ...}` guard. |
| 0.4 | Title-length safety | `src/layouts/BaseLayout.astro:40` | Append ` \| Invest Gulf` only when `title.length <= 46`; otherwise emit the title bare. Fixes 611 over-length titles at the layout level before W3 fixes the copy. |
| 0.5 | Add `BreadcrumbList` schema + visible breadcrumbs | `src/layouts/ArticleLayout.astro` | 610 article pages currently have none. |
| 0.6 | Exclude dev artefacts from the build | `astro.config.mjs` / `public/` | `design-preview.html`, `logo-preview.html` should not ship. |
| 0.7 | Refresh `llms.txt` | `scripts/generate-llms-full.mjs` | Drop the Phuket construction citation; bump `Updated:` from 2026-07-09. |

**Blocked on Maxim:** 0.1 needs the real number. Everything else can ship without input.

---

## Wave 1 — Restore index status on commercial pages 🔴

**Branch:** `cc/gulf-wave1-reindex` · **Slugs:** 25 · **Risk:** medium (reversible — one frontmatter line each) · **Impact:** recovers ~600 of the 1 105 wasted internal links

Selection rule: **inbound internal links × commercial intent**, *not* the impressions rule that caused the damage. Each of these is a page other pages already vote for.

| # | Slug | Inbound | Why restore |
|---:|---|---:|---|
| 1 | `guides/uae-golden-visa-property` | 78 | **Head commercial term.** 301 destination of 2 slugs. The `/golden-visa-dubai-property/` lead page points here. |
| 2 | `guides/gulf-expat-living-comparison` | 122 | Largest link sink on the site |
| 3 | `guides/dubai-relocation-guide` | 69 | Top-of-funnel entry |
| 4 | `guides/uae-tax-residency-183-day-rule` | 1 | **Was position 6.6 in GSC.** Also needs its 301 removed (W2) |
| 5 | `guides/uae-tax-residency-property` | 21 | Tax/residency cluster spine |
| 6 | `guides/abu-dhabi-golden-visa-living` | 18 | Golden Visa cluster, Abu Dhabi |
| 7 | `guides/best-gulf-country-property-investment` | 10 | 301 destination, purchase intent |
| 8 | `guides/can-foreigners-buy-property-dubai` | — | Had impressions; decide restore **or** clean 301 (see W2) |
| 9 | `areas/al-marjan-island-property-investment` | 14 | RAK/Wynn — least contested growth market |
| 10 | `guides/gulf-banking-comparison-expats` | 15 | Purchase-adjacent, GEO 70 |
| 11 | `guides/saudi-premium-residency-living` | 15 | Saudi residency, purchase intent |
| 12 | `guides/dubai-monthly-budget-expat-family` | 27 | GEO 56 — restore **and** queue for W9 |
| 13 | `guides/rak-vs-sharjah-living` | 30 | |
| 14 | `guides/rak-commute-to-dubai` | 24 | |
| 15 | `guides/sharjah-vs-dubai-rent` | 18 | |
| 16 | `guides/saudi-vs-uae-living` | 18 | GEO 55 — also W9 |
| 17 | `guides/oman-relocation-guide` | 21 | |
| 18 | `guides/jeddah-cost-of-living` | 22 | |
| 19 | `guides/sharjah-relocation-guide` | 18 | |
| 20 | `guides/qatar-relocation-guide` | 15 | |
| 21 | `guides/dubai-international-schools-guide` | 14 | Family-buyer bridge |
| 22 | `guides/ajman-living-guide` | 16 | GEO 73 |
| 23 | `guides/saudi-banking-expats` | 13 | |
| 24 | `guides/bahrain-relocation-guide` | 13 | |
| 25 | `guides/abu-dhabi-banking-expats` | 11 | |

**Method:** delete the `noindex: true` line. Sitemap inclusion follows automatically via `scripts/lib/sitemap-exclusions.mjs`.

**Explicitly NOT in this wave:** the remaining ~172 noindex pages. Many are genuinely thin satellites and are better handled by W8 consolidation. Restoring all 197 at once would re-create the original problem.

**PR body must record** the per-slug rationale (corpus-cleanup-mode requires this for noindex decisions in either direction).

---

## Wave 2 — Redirect architecture 🟠

**Branch:** `cc/gulf-wave2-redirects` · **Files:** `vercel.json` + up to 25 MDX deletions · **Risk:** medium · Run `npm run check-links`

| # | Action | Count |
|---|---|---:|
| 2.1 | Delete 31 byte-identical duplicate rules | 31 rules |
| 2.2 | Resolve **17 redirects whose destination is `noindex`** — after W1, seven destinations are indexable again; for the other ten either restore the destination or delete both sides. A 301 into a noindex page is always wrong. | 17 rules |
| 2.3 | Resolve **36 slugs that exist as MDX behind a 301** — delete the orphaned MDX (its URL is unreachable) or drop the redirect. Six are indexable-but-unreachable and must be decided explicitly: `international-schools-gulf-comparison`, `golden-visa-2-million-aed-explained`, `compare/off-plan-vs-ready-property-uae`, `best-off-plan-downtown-dubai`, `best-off-plan-jvc-dubai`, `villanova-dubai-property-investment` | 36 files |
| 2.4 | Remove the 301 on `guides/uae-tax-residency-183-day-rule` and instead 301 its orphan twin `guides/uae-tax-residency-183-days` **into** it — reversing the current direction. The ranked page becomes canonical. | 2 rules |

**Split if >25 MDX deletions:** `wave2a-rules` (vercel.json only) then `wave2b-orphan-files` (MDX deletions).

---

## Wave 3 — Titles and H1 🟠

**Branch:** `cc/gulf-wave3a-titles` / `cc/gulf-wave3b-h1` · **Slugs:** 25 + 25 per PR

### 3a — Repair 54 truncated titles (3 PRs of ≤25)

**Method — cheap because the answer is already in the file:** 220 of the 232 body H1s are the **pre-trim originals**. Restore the frontmatter title from the body H1, shortened editorially to ≤46 chars so W0.4's suffix keeps it under 60.

Priority order — GSC pages first:

```
PR 3a-1 (GSC + commercial):
  guides/abu-dhabi-golden-visa-property      "…AED 2M Threshold,"      ← trailing comma
  guides/abu-dhabi-rental-yield-guide        "…Net vs"                 ← trailing "vs"
  guides/best-areas-buy-property-dubai       "…Yield, Capital, and"
  guides/capital-gains-uae-property          "…What Investors Need to"
  guides/dubai-mortgage-rates-2026           "…Bank Comparison, and"
  guides/dubai-rental-yield-guide            "…(Area Table + Worked"   ← unbalanced paren
  guides/mistakes-foreign-buyers-dubai-property "…Property (and"       ← unbalanced paren
  guides/golden-visa-application-step-by-step "…Timeline, a"
  guides/off-plan-risks-delays-dubai         "…What Buyers Need to"
  guides/emaar-properties-review             "…Flagship Projects, a"
  + 15 more from the 54-item list
PR 3a-2, 3a-3: remainder
```

Also fix the 4 frontmatter titles already >62 chars before any suffix: `guides/dubai-property-market-forecast-2026-2027`, `news/damac-islands-handover-update-2026`, `news/dubai-golden-visa-applications-2026`, `news/emaar-creek-waters-launch-2026`.

### 3b — Delete duplicate body H1s (232 files, 10 PRs of ≤25)

Remove the leading `# ` line from each MDX body. `ArticleLayout.astro:88` already renders the H1. **Must run after 3a** so the good copy is captured first.

Scriptable with a human-readable diff (one line removed per file) — permitted under corpus-cleanup-mode's "small scripted fixes" clause, not under the mass-regex ban.

---

## Wave 4 — De-fingerprint 🔴 (the actual demotion driver)

**Branch:** `cc/gulf-wave4-N-defingerprint` · **401 files → 17 PRs of ≤25** · **Risk:** high (real copy edits) · **Effort:** the largest wave

This is the wave that matters. Do **not** defer it below W5–W10.

### 4.1 Kill the template insight clauses

| Pattern | Files |
|---|---:|
| `Invest Gulf treats …` | 355 |
| `for foreign buyers in this market` | 126 |
| `during active due diligence before any reservation fee` | — |
| `in the current GDRFA cycle` | — |
| `Invest Gulf research keeps / coordinates / reconciles …` | 26 |

**Method — rewrite, do not delete.** Each sentence carries a real editorial claim under the template wrapper. Strip the stock tail and rewrite the clause page-specifically. Deleting them outright would drop GEO `unique` and `self` scores further.

Sequencing: **GSC pages and lead-page hubs first** (priority list from `docs/PRIORITY-CTR-LEADS.md`), then by inbound links descending.

### 4.2 Rewrite the 110 template H2s

- "What checklist should run before you sign?" ×73 (5 variants)
- "What red flags should pause this Gulf purchase?" ×43 (4 variants)
- "What risks should buyers plan for before they commit?" ×14

Replace with page-specific question headings. This also lifts the GEO `structure` axis (currently 84, the weakest).

### 4.3 Replace template "Related reading" blocks

The same 3–5 links repeat on 215 / 72 / 68 pages. Replace with 3–5 contextually chosen links per page — this doubles as W7 orphan repair.

### 4.4 Fix 9 pages with internally duplicated paragraphs

Worst: `guides/convert-foreign-license-dubai` (10 duplicate "Insider tip:" blocks). Also `net-yield-calculator-uae-property` (4), `emirates-id-after-property-purchase` (2), `shams-free-zone-setup` (2), + 5 with one each.

### 4.5 Remove 10 machine `Navigation:` lines

---

## Wave 5 — Remove the MORE Group brand 🟠

**Branch:** `cc/gulf-wave5-N-brand` · **57 files → 3 PRs of ≤25**

Direct violation of `site-passport.yaml`: *"Independent Invest Gulf brand — do not copy MORE Group Phuket/UAE cross-content"*.

```
PR 5-1 — heaviest (24 files):
  areas/dubai-south-property-investment          11 occurrences
  compare/aldar-vs-damac                          9
  compare/ras-al-khaimah-vs-dubai-investment      7
  compare/dubai-vs-muscat-property-investment     7
  areas/city-walk-property-investment             6
  areas/discovery-gardens-property-investment     4  ← incl. H2 "MORE Group underwriting snapshot"
  guides/uae-green-visa-skilled-worker            4
  projects/rak-gateway-2                          3
  compare/rak-vs-sharjah-property-investment      3
  areas/the-pearl-lusail-property-investment      3
  areas/mina-al-arab-property-investment          3
  areas/mbr-city-property-investment              2  ← incl. H2 "How does MORE Group underwrite MBR City deals?"
  + 12 more with 2 occurrences each
PR 5-2, 5-3: the ~33 single-occurrence files
```

**Method:** replace with `Invest Gulf` **only where the claim is genuinely Invest Gulf's methodology**. Where the sentence asserts underwriting Invest Gulf does not actually perform, delete or rewrite as a neutral market observation. Do not simply find-and-replace the brand name onto someone else's claims — that trades a policy violation for a truthfulness problem.

The 4 `## MORE Group …` H2 headings need real replacement headings.

---

## Wave 6 — Date realism ⚙️

**Branch:** `cc/gulf-wave6-dates` · **Files:** 610 frontmatter fields · **Risk:** low-medium

Current state: `updatedDate: 2026-07-27` on **100%** of pages; 99% of `pubDate` inside four days.

**Method:**
1. `updatedDate` — set to the date the page is **actually** touched by waves 1–5, and stop back-dating. Pages not touched by any wave keep `pubDate` and drop `updatedDate` entirely rather than claiming a false refresh.
2. `pubDate` — reconstruct from git history where possible (`git log --diff-filter=A --follow`). Where history shows the true bulk-import date, keep it honest; do not fabricate a staggered schedule. An honest bulk-import date is a smaller problem than a fabricated one.
3. Normalise `author` on the 4 pages using `"Invest Gulf Editorial Team"`.

**Decision needed from Maxim:** whether to (a) leave true bulk-import `pubDate`s visible, or (b) drop `pubDate` display from the article layout and lean on `updatedDate` only. I recommend **(a) + honest updatedDate** — fabricating dates is itself a spam signal.

---

## Wave 7 — Link graph repair 🟢

**Branch:** `cc/gulf-wave7a-links` / `7b-orphans` · Run `npm run check-links`

### 7a — 23 dead links (6 targets, all collection-path errors)

```
/areas/gulf-residency-by-investment-guide/  ×9  → /guides/gulf-residency-by-investment-guide/
/guides/saudi-vs-uae-property-investment/   ×6  → /compare/saudi-vs-uae-property-investment/
/compare/dubai-property-investment-guide/   ×5  → /guides/dubai-property-investment-guide/
/compare/oman-property-investment-guide/    ×1  → /guides/oman-property-investment-guide/
/guides/rak-vs-fujairah-property-investment/×1  → /compare/rak-vs-fujairah-property-investment/
/compare/sharjah-vs-dubai-rent/             ×1  → /guides/sharjah-vs-dubai-rent/
```

Every target exists — pure path errors. Cheapest win in the roadmap.

### 7b — 52 links into 301 chains

Point them at the final destination. Worst: `/guides/gulf-property-investment-comparison-2026/` ×15, `/guides/lusail-city-property-investment/` ×5, `/guides/dubai-vs-abu-dhabi-cost-living/` ×4.

### 7c — 65 orphans (3 PRs of ≤25)

Give each ≥3 contextual inbound links from topically related pages. Priority: **`guides/oman-driving-license` (313 GSC impressions, zero inbound links)**, then `guides/dubai-property-valuation-guide`, `guides/is-dubai-property-bubble-2026`, `guides/uae-savings-fixed-deposits`, the 9 orphaned `news/*`, `compare/adgm-vs-difc-company-setup`.

Also rebalance the top: `guides/dubai-property-investment-guide` holds **305** inbound links while 65 pages hold zero.

---

## Wave 8 — Cannibalization consolidation 🟠

**Branch:** `cc/gulf-wave8-N-{cluster}` · **Risk:** high · **Effort:** highest · **Do after W4**

Merge into hub + 301 the satellites. This is the documented recovery pattern for scaled-content demotion: fewer, deeper, genuinely useful pages.

| PR | Cluster | Hub | Merge in (301) |
|---|---|---|---|
| 8-1 | **Dubai rental yield** (7 → 2) | `guides/dubai-rental-yield-guide` | `how-to-calculate-rental-yield-dubai` (GEO 54, 5% coverage), `gross-vs-net-yield-dubai`, `net-yield-calculator-uae-property`. **Keep** `highest-rental-yield-areas-dubai` (distinct "best areas" intent) and `dubai-capital-appreciation-vs-yield` (distinct strategy intent) |
| 8-2 | **Tax residency** (3 → 1) | `guides/uae-tax-residency-183-day-rule` (restored in W1) | `uae-tax-residency-183-days` (orphan twin) 301 → hub; reconcile with `uae-tax-guide-expats` |
| 8-3 | **Freehold / can-foreigners-buy** (4 → 2) | `guides/can-foreigners-buy-property-uae` | `can-foreigners-buy-property-dubai`; merge `compare/freehold-vs-leasehold-uae` into `guides/freehold-vs-leasehold-dubai` |
| 8-4 | **Off-plan** (7 → 4) | `guides/off-plan-property-dubai-guide` | Resolve the 3 already behind 301s (W2); merge `off-plan-vs-secondary-market-dubai` into `off-plan-vs-ready-property-dubai` |
| 8-5 | **Golden Visa** (18 → ~12) | `guides/uae-golden-visa-property` (restored in W1) | Merge `golden-visa-2-million-aed-explained`, `golden-visa-vs-green-visa`, `golden-visa-vs-dubai-residence-visa` into a single "which visa route" page |
| 8-6 | **Free-zone setup** (7 → 2) | `guides/dubai-business-setup-guide` | `ifza`, `jafza`, `dmcc`, `rakez`, `shams` become sections of one comparison page; keep `difc-company-setup` (distinct high-value intent) |
| 8-7 | **Developer reviews** (17 → ~10) | `guides/dubai-developers-guide` | Fold the 4 orphaned single-developer reviews (`ellington`, `omniyat`, `select-group`, `binghatti`) into the tier comparison hub |
| 8-8 | **Schools** (37 → ~25) | `guides/gulf-schools-comparison` | Merge the 4 `schools-near-*` micro-pages into area pages |

Each PR: rewrite the hub to genuinely absorb the merged material (do not stub), add 301s, update inbound links, re-run `geo:audit`.

---

## Wave 9 — GEO below-minimum 🟢

**Branch:** `cc/gulf-wave9-geo` · **43 files → 2 PRs of ≤25**

The original baseline task. Deliberately **last-but-one** — several of these files are resolved by earlier waves (`bahrain-golden-residence-property` is noindex + 301'd; `how-to-calculate-rental-yield-dubai` merges away in W8-1), so running this first would waste effort on pages that will not survive.

Priority within the wave — the 12 grade-`[D]` files:

```
52  guides/bahrain-golden-residence-property   ← resolve status in W2 first
52  guides/sharjah-vs-dubai-commute-property   ← 0 citability blocks
54  guides/how-to-calculate-rental-yield-dubai ← merges in W8-1; skip if merged
54  guides/oman-banking-expats
55  compare/emaar-vs-nakheel                   ← missing insider-tip
55  guides/ellington-properties-review         ← orphan; may fold in W8-7
55  guides/saudi-vs-uae-living
56  guides/arada-developer-review
56  guides/dubai-monthly-budget-expat-family   ← restored in W1
56  guides/rent-vs-buy-dubai-expat
56  projects/sobha-hartland-2                  ← orphan
58  guides/qatar-residency-by-investment
```

Common defects: thin H2 openings (<35w), citability blocks under 130w, low coverage %. Fix pattern is documented in the geo audit output per file.

---

## Wave 10 — Money pages 🟠

**Branch:** `cc/gulf-wave10-leadpages` · **Files:** 8 `.astro` pages (not MDX)

The commercial pages are the thinnest on the site (243–535 words vs a 2 003-word guide median).

| Page | Words | Target |
|---|---:|---|
| `/golden-visa-dubai-property/` | 260 | 1 200+. Link to the **restored** `uae-golden-visa-property`. Add the Feb-2026 circular, AED 2M worked example, qualifying-area table |
| `/gcc-rental-yields/` | 535 | 1 500+. Country-by-country net yield table with sourcing — this is the site's best differentiator vs brokers |
| `/abu-dhabi-property-investment/` | 243 | 1 000+ |
| `/invest-dubai-off-plan/` | 254 | 1 000+ |
| `/invest-dubai-property/` | 345 | 1 200+ |
| `/invest-ras-al-khaimah-property/` | 236 | 1 000+. Wynn/Al Marjan is the least contested growth story in the Gulf |
| `/gulf-property-investment-consultation/` | 270 | 800+ |
| `/` (homepage) | 407 | 900+ |

Also fix the 633 empty `alt=""` hero images (schedulable inside W3b's file sweep).

---

## Effort summary

| Wave | PRs | Files | Risk | Blocks recovery? |
|---|---:|---:|---|---|
| W0 config | 1 | 4 | low | **yes** |
| W1 reindex | 1 | 25 | med | **yes** |
| W2 redirects | 2 | ~40 | med | **yes** |
| W3 titles+H1 | 13 | 286 | low | **yes** |
| W4 de-fingerprint | 17 | 401 | high | **yes — the core** |
| W5 MORE Group | 3 | 57 | med | no |
| W6 dates | 1 | 610 | low-med | no |
| W7 links | 5 | ~90 | low | no |
| W8 cannibalization | 8 | ~60 | high | no |
| W9 GEO 43 | 2 | 43 | low | no |
| W10 money pages | 1–2 | 8 | med | no |
| **Total** | **~54** | — | — | — |

Realistic expectation, based on the documented recovery pattern for scaled-content demotion: **3–6 months after W0–W4 land**, longer if a Helpful-Content-style sitewide demotion is in play. No wave produces a visible lift inside two weeks — this is a credibility rebuild, not a tweak.

---

## Decisions needed from Maxim before Wave 1

1. **The replacement phone number** for `site.ts` (blocks W0.1).
2. **Wave 1 slug list** — approve the 25 as listed, or adjust.
3. **W2.3 six indexable-but-301'd slugs** — restore or delete.
4. **W6 date policy** — honest bulk-import dates (my recommendation) vs dropping `pubDate` display.
5. **W8 consolidation appetite** — merging ~40 slugs into hubs is the highest-impact and highest-effort call in the roadmap.

Record the approval in `.content-os/lock.json` per `publishing-gates.md`:

```json
{
  "approved_wave": "gulf-wave-0",
  "approved_plan_date": "2026-08-21",
  "approved_slugs": ["..."],
  "hero_upload": "pending_cursor"
}
```
