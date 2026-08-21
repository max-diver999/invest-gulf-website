# Content status — invest-gulf.com

> Claude Code и Cursor читают **первым** после `git pull origin main`.

## Источник правды

- Репо: `max-diver999/invest-gulf-website`, ветка **`main`**
- Программа: `more-group-content-os/programs/invest-gulf.yaml`
- Процесс: `docs/WORKFLOW-GITHUB.md`
- **Цель пилота:** лиды с намерением купить в UAE/Gulf (см. `site-passport.yaml`)

## Фаза 0 — аудит + topic discovery (⏳ старт 2026-08-21)

Content OS pilot на GitHub `main`. Submodule `more-group-content-os` обязателен.

| Задача Claude | Статус |
|---|---|
| Полный аудит ~610 MDX | не начат |
| GEO baseline (43 commercial ниже минимума) | зафиксирован |
| Roadmap починки + новые темы | не начат |
| SERP briefs в content-os | пока нет — Claude предлагает при topic discovery |

### Корпус (approx)

| Коллекция | MDX |
|---|---|
| guides | 485 |
| areas | 58 |
| compare | 30 |
| projects | 25 |
| news | 12 |
| **Итого** | **~610** |

### Недавняя работа на main

- `6bb267a` — убран boilerplate/spam с **88** MDX
- Site report v2.4 (GSC, GA4, Bing) — `cbd29c5`
- Индексация: план 120 URL — `scripts/indexing-plan-batches-100.md`

### GEO baseline (2026-08-21)

`npm run geo:audit`: **43** commercial-файла ниже минимума. Худшие — см. `docs/CONTENT_QUALITY_AUDIT.md`.

### GSC приоритет (impressions)

1. `guides/dubai-police-clearance-certificate` — 828 imp  
2. `guides/saudi-rental-yield-guide` — 380 imp  
3. `guides/oman-driving-license` — 313 imp  

Полный snapshot: `more-group-content-os/analytics-snapshots/invest-gulf-website/2026-08-21.json`

### Индексация (железно)

**Только** ключ `invest-gulf-indexing` / `scripts/google-indexing-key.json`.  
**Никогда** MORE Group quota `soy-braid-491510-c2`. Claude **не** индексирует.

### Следующий шаг для Claude

См. `CLAUDE-CODE-START.md` — полный промпт аудита. **СТОП** до «ок» Максима.

## Submodule

```bash
git pull origin main
git submodule update --init --recursive
```
