# Единый процесс — invest-gulf.com (GitHub only)

> **Источник правды:** `max-diver999/invest-gulf-website`, ветка **`main`**.

## Роли

| Кто | Где | Что |
|---|---|---|
| **Claude Code** | claude.ai/code, env MORE Group Content | Аудит → roadmap → **стоп** → fix-batch / новые статьи → PR |
| **Cursor** | Локально | Ревью PR → merge → «выложи» → индексация |
| **Максим** | Чат | «ок» на план → «выложи» |

## Цикл

```text
main (~610 MDX, spam cleanup 88 files done)
  ↓
Claude: audit + GEO + GSC snapshot
  ↓
AUDIT-REPORT + cleanup roadmap + content roadmap → СТОП → «ок»
  ↓
Fix-batch волна (≤25) → validate → PR cc/gulf-*
  ↓
Cursor merge → deploy → indexing (invest-gulf-indexing key ONLY)
  ↓
Topic discovery → новые guides → тот же цикл
```

## Файлы

| Файл | Назначение |
|---|---|
| `.content-os/STATUS.md` | Где мы сейчас |
| `.content-os/site-passport.yaml` | Пути, MCP, indexing policy |
| `docs/PRIORITY-CTR-LEADS.md` | GSC приоритеты |
| `docs/CONTENT_QUALITY_AUDIT.md` | GEO baseline |
| `CLAUDE-CODE-START.md` | Промпт для нового чата |

## Submodule

```bash
git submodule update --init --recursive
```

## Индексация

См. `invest-gulf-indexing-isolation` — **never** MORE Group `soy-braid-491510-c2`.

## Запрещено Claude

- push main, deploy, indexing API  
- новые slug до «ок» на audit roadmap  
- mass delete / geo-fix-corpus-all без волны
