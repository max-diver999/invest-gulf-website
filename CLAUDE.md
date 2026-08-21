# invest-gulf.com — Claude Code entry

Independent **UAE & Gulf property** research site (~610 MDX). Content OS pilot **2026-08-21**.

Read **`.content-os/STATUS.md`** first after `git pull origin main`.

One-line prompts: **`CLAUDE-CODE-START.md`**.

## Paths

| What | Where |
|---|---|
| Passport | `.content-os/site-passport.yaml` |
| Program | `more-group-content-os/programs/invest-gulf.yaml` |
| Analytics | `more-group-content-os/analytics-snapshots/invest-gulf-website/2026-08-21.json` |
| Priority pages | `docs/PRIORITY-CTR-LEADS.md` |
| GEO baseline | `docs/CONTENT_QUALITY_AUDIT.md` |
| Indexing isolation | `more-group-content-os/policies/cursor-rules/invest-gulf-indexing-isolation.mdc` |
| Index backlog | `scripts/indexing-plan-batches-100.md` |
| Live site report | `src/pages/site-report/` |

## Workflow

1. Pull + submodule → read STATUS, passport, program yaml  
2. Full audit → `AUDIT-REPORT` + `corpus-cleanup-roadmap` + `content-roadmap` → **stop for «ок»**  
3. After «ок» on fix wave: fix-batch → validate → PR `cc/gulf-*`  
4. After audit ok: topic discovery → new guides → same PR cycle  
5. Cursor: review → merge → «выложи» → indexing (Maxim only, invest-gulf key)

## Forbidden

- push main, deploy, Google/Bing indexing from Claude  
- MORE Group indexing key for invest-gulf URLs  
- mass regex / geo-fix-corpus-all without wave approval  
- new slugs before audit roadmap «ок»
