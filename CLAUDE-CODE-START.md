# Claude Code — invest-gulf.com

Environment: **MORE Group Content**  
Repo: **max-diver999/invest-gulf-website**

```bash
git pull origin main
git submodule update --init --recursive
```

Read order:

1. `.content-os/STATUS.md`
2. `.content-os/site-passport.yaml`
3. `more-group-content-os/programs/invest-gulf.yaml`
4. `more-group-content-os/policies/claude-autonomous-decisions.md`
5. `more-group-content-os/policies/corpus-cleanup-mode.md`
6. `more-group-content-os/policies/publishing-gates.md`
7. `docs/PRIORITY-CTR-LEADS.md` + `docs/CONTENT_QUALITY_AUDIT.md`
8. `more-group-content-os/analytics-snapshots/invest-gulf-website/2026-08-21.json`
9. `CLAUDE.md`

**Full audit prompt (copy to chat):**

```text
Pull main + submodule. invest-gulf.com — Content OS pilot (UAE/Gulf EN, ~610 MDX).

Прочитай STATUS, site-passport, programs/invest-gulf.yaml, PRIORITY-CTR-LEADS, CONTENT_QUALITY_AUDIT, analytics snapshot, indexing-plan-batches-100.md (только контекст — не индексируй).

Задача фаза 0:
A) Аудит корпуса: GEO (43 below min), каннибализация, internal links, остатки spam после 6bb267a, hubs areas/compare/projects
B) GSC: усилить страницы с impressions (dubai-police-clearance-certificate, saudi-rental-yield, oman-driving-license…)
C) Roadmap: волны починки (≤25 slug) + 10–20 новых тем guides/areas с purchase intent
D) Артефакты: .content-os/reports/AUDIT-REPORT-{date}.md, .content-os/batches/corpus-cleanup-roadmap-{date}.md, .content-os/batches/content-roadmap-{date}.md, topics-proposal.json если можешь

СТОП: не пиши MDX, не PR, не push. Жди «ок». Индексация — только Cursor после «выложи», ключ invest-gulf-indexing.
```
