#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const plan = JSON.parse(readFileSync('scripts/indexing-plan-batches-100.json', 'utf8'));
let md = '# invest-gulf.com — план повторной индексации\n\n';
md += 'Сгенерировано: 18 Aug 2026\n\n';
md += '## Логика отбора\n\n';
md += '| | Кол-во |\n|---|---|\n';
md += `| URL в live-sitemap | ${plan.sitemapTotal} |\n`;
md += '| Минус отправленные сегодня (88) | −88 |\n';
md += `| Минус уже в Google (показы в GSC) | −${plan.excluded.indexed} |\n`;
md += `| **Итого к отправке** | **${plan.totalCandidates}** |\n\n`;
md += 'Полный JSON: `scripts/indexing-plan-batches-100.json`\n\n';
md += 'Каналы: Google Indexing API + Bing IndexNow. Яндекс — не используем.\n\n';

for (const b of plan.batches) {
  md += `---\n\n## День ${b.day} (${b.suggestedDate}) — ${b.count} URL\n\n`;
  md += '```\nnode scripts/google-indexing-api.mjs --explicit \\\n';
  b.urls.forEach((u, i) => {
    md += `  ${u}${i < b.urls.length - 1 ? ' \\' : ''}\n`;
  });
  md += '```\n\n';
  md += '<details><summary>Список ссылок</summary>\n\n';
  for (const u of b.urls) md += `- ${u}\n`;
  md += '\n</details>\n\n';
}

writeFileSync('scripts/indexing-plan-batches-100.md', md);
console.log(`Wrote ${plan.batchCount} day(s), ${plan.totalCandidates} URLs`);
