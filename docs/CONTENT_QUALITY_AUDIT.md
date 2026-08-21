# Content quality audit — invest-gulf.com (baseline)

> Machine baseline for Claude Phase 0. **Not** a full page-by-page audit — Claude builds `AUDIT-REPORT-{date}.md` in `.content-os/reports/`.

**Date:** 2026-08-21  
**Command:** `npm run geo:audit` on `main`

## Summary

| Signal | Value |
|---|---|
| Total MDX (approx) | 610 |
| Commercial below GEO min | **43** |
| Rubric avg (answer / structure / stats) | 97 / 84 / 97 |
| Recent spam cleanup | 88 files — commit `6bb267a` |
| Flagged list | `scripts/_flagged-spam-files.json` |

## Worst commercial scores (fix-batch candidates)

| Score | File |
|---:|---|
| 52 | guides/bahrain-golden-residence-property.mdx |
| 52 | guides/sharjah-vs-dubai-commute-property.mdx |
| 54 | guides/how-to-calculate-rental-yield-dubai.mdx |
| 54 | guides/oman-banking-expats.mdx |
| 55 | compare/emaar-vs-nakheel.mdx |
| 55 | guides/ellington-properties-review.mdx |
| 55 | guides/saudi-vs-uae-living.mdx |
| 56 | guides/arada-developer-review.mdx |
| 56 | guides/dubai-monthly-budget-expat-family.mdx |
| 56 | guides/rent-vs-buy-dubai-expat.mdx |

Common issues: thin H2 opens, missing insider-tip, citability blocks under 130w, low coverage %.

## Claude audit must also check

- Cannibalization (multiple yield / Golden Visa / school fee guides)  
- Orphan area pages (0 inbound links)  
- Compare pages post-spam cleanup  
- Internal link hubs: `/gcc-rental-yields/`, `/golden-visa-dubai-property/`  
- `validate:batch` / `qa:corpus` baseline (run on sample, report counts)

## After audit

1. `corpus-cleanup-roadmap-{date}.md` — waves ≤25 slugs  
2. `content-roadmap-{date}.md` — new topics (after cleanup «ок» or parallel backlog)  
3. Stop until Maxim «ок»
