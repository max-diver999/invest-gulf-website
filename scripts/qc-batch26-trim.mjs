import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../src/content/guides/');

function trimBetween(content, startMarker, endMarker, replacement = '') {
  const start = content.indexOf(startMarker);
  if (start === -1) return null;
  const end = endMarker ? content.indexOf(endMarker, start) : content.length;
  if (endMarker && end === -1) throw new Error(`End not found: ${endMarker.slice(0, 60)}`);
  return content.slice(0, start) + replacement + (endMarker ? content.slice(end) : '');
}

function trimToEnd(content, startMarker) {
  const start = content.indexOf(startMarker);
  if (start === -1) return null;
  return content.slice(0, start).trimEnd() + '\n';
}

const jobs = [
  {
    file: 'rak-properties-developer-review.mdx',
    run: (c) =>
      trimToEnd(
        c,
        '\n\n### Practical cost reference\n\nThe practical reality of rak properties developer review'
      ) ??
      trimToEnd(c, '\n\n### Practical cost reference\n'),
  },
  {
    file: 'azizi-developments-review.mdx',
    run: (c) => trimToEnd(c, '\n\n### Cost and timeline reference\n'),
  },
  {
    file: 'damac-properties-review.mdx',
    run: (c) => trimToEnd(c, '\n\n### What to verify before signing\n'),
  },
  {
    file: 'sobha-realty-review.mdx',
    run: (c) => trimToEnd(c, '\n\n### Buying into sobha realty — verification checklist\n'),
  },
  {
    file: 'emaar-properties-review.mdx',
    run: (c) => trimToEnd(c, '\n\n### Buying into emaar properties — verification checklist\n'),
  },
  {
    file: 'meraas-properties-review.mdx',
    run: (c) => trimToEnd(c, '\n\n## Pros and cons at a glance\n'),
  },
  {
    file: 'binghatti-review.mdx',
    run: (c) => {
      if (c.includes('**Further reading:**')) return c;
      const marker = '\n\n**Disclaimer:** Delivery rates';
      const idx = c.indexOf(marker);
      if (idx === -1) return c;
      return (
        c.slice(0, idx) +
        `\n\n**Further reading:** [How to evaluate Dubai developer](/guides/how-to-evaluate-dubai-developer/) · [Azizi developments review](/guides/azizi-developments-review/) · [Danube properties review](/guides/danube-properties-review/) · [Off-plan risks Dubai](/guides/off-plan-risks-delays-dubai/) · [JVC property investment](/areas/jvc-property-investment/).` +
        c.slice(idx)
      );
    },
  },
];

for (const { file, run } of jobs) {
  const p = join(ROOT, file);
  const before = readFileSync(p, 'utf8');
  const after = run(before);
  if (after === null) throw new Error(`Trim failed: ${file}`);
  if (after === before) {
    console.log(`SKIP ${file} (no change)`);
    continue;
  }
  writeFileSync(p, after);
  console.log(`OK ${file}`);
}

console.log('batch 26 trim done');
