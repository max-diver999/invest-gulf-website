# Content status — invest-gulf.com

> Claude Code и Cursor читают **первым** после `git pull origin main`.

## Источник правды

- Репо: `max-diver999/invest-gulf-website`, ветка **`main`** (merge `0a0be139`, 2026-08-21)
- Программа: `more-group-content-os/programs/invest-gulf.yaml`
- Процесс: `docs/WORKFLOW-GITHUB.md`
- **Цель пилота:** лиды с намерением купить в UAE/Gulf (см. `site-passport.yaml`)

## Фаза 0 — аудит + починка корпуса (✅ выполнено 2026-08-21)

| Задача Claude | Статус |
|---|---|
| Полный аудит ~610 MDX | ✅ `.content-os/reports/AUDIT-REPORT-2026-08-21.md` |
| Roadmap починки (11 волн) | ✅ `.content-os/batches/corpus-cleanup-roadmap-2026-08-21.md` |
| Исполнение всех 11 волн | ✅ `.content-os/reports/REMEDIATION-2026-08-21.md` |
| Roadmap новых тем (30 шт.) | ✅ `.content-os/batches/content-roadmap-2026-08-21.md` + `topics-proposal.json` |
| Написание новых статей | ⏸ ждёт «ок» Максима |

### Корпус после починки

| Коллекция | MDX |
|---|---|
| guides | 463 |
| areas | 57 |
| compare | 29 |
| projects | 25 |
| news | 12 |
| **Итого** | **586** |

Удалено 24 файла: 22 дубликата, чьи URL и так уводились 301, плюс сирота-двойник
`uae-tax-residency-183-days` и дубль `areas/impz-property-investment` (IMPZ = Dubai Production City).

### Гейты

```
npm run build            → exit 0   (postbuild rendered audit: 0 errors, P0 0, P1 0)
npm run validate:content → exit 0   (0 issues / 586)
npm run qa:corpus        → exit 0
npm run geo:audit        → exit 0   (avg 86/100; **11** коммерческих файлов ниже минимума — см. REMEDIATION)
npm run audit:images     → exit 1   ← артефакт песочницы, см. REMEDIATION §"Known non-issue"
```

### Ключевые изменения

- `noindex` 197 → **96** (32.3% → 16.4% корпуса); директива `noindex,nofollow` → **`noindex,follow`**
- Редиректы 151 → **83**; ноль дубликатов, ноль 301→noindex, ноль источников, живущих как файлы
- Заголовки: **0** обрезанных, **0** длиннее 62 символов в рендере (было 611)
- **0** страниц с двумя H1 (было 233); **BreadcrumbList** на всех 586 (было 0)
- Ссылочный граф: **0** битых, **0** цепочек 301, **0** сирот; в noindex уходит 1.8% ссылок (было 19%)
- Машинный отпечаток: **0** «MORE Group», **0** wrapper-заголовков, филлер-хвосты вычищены
- Даты: 229 уникальных `pubDate` (было 6), 79 `updatedDate` (было 1)

### Фаза 2 — доводка (✅ 2026-08-21)

- `robots.txt`: `Disallow` применялись только к PerplexityBot — переписан
- `llms-full.txt`: убраны 24 мёртвых URL и все noindex; генератор фильтрует
- Изображения: 72 → 40 МБ; hero получил `width/height` + `fetchpriority`; inline — `lazy` + размеры через rehype-плагин
- Снято 215 машинных обёрток заголовков на H3–H6, 583 мёртвых поля `serpExempt`, 30 маркеров `geo-cit`
- Саудовская Аравия: дата 22 → **21 января 2026**, добавлены подтверждённые зоны (Эр-Рияд 9, Джидда 57) по регламенту от 23 июня 2026
- Дописан `/contact/`, 31 неполное открытие H2, 22 страницы с нехваткой исходящих ссылок

### Осталось (требует человека или сети)

1. **Телефон `+66`** в `src/data/site.ts` — оставлен по указанию Максима, рендерится на ~610 страницах
2. **Проверка на живом сайте** — HTTP-коды, Core Web Vitals, охват в GSC (домен закрыт egress-прокси песочницы)
3. **Факт-чек Саудовской Аравии** — `saudi-rental-yield-guide` (#2 по показам) обещает в title доходность «в Эр-Рияде и Джидде», при том что эти города, по сообщениям, исключены из общего права иностранцев по закону от января 2026. Нужна сверка с REGA
4. **30 новых тем** — гейт W0–W4 пройден, можно стартовать по команде

### Индексация (железно)

**Только** ключ `invest-gulf-indexing` / `scripts/google-indexing-key.json`.
**Никогда** MORE Group quota `soy-braid-491510-c2`. Claude **не** индексирует.

## Submodule

```bash
git pull origin main
git submodule update --init --recursive
```
