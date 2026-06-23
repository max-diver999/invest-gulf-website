import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../src/content/guides/');

function trimToEnd(content, startMarker) {
  const start = content.indexOf(startMarker);
  if (start === -1) return null;
  return content.slice(0, start).trimEnd() + '\n';
}

const jobs = [
  {
    file: 'omniyat-developer-review.mdx',
    run: (c) => trimToEnd(c, '\n\n### Buying into omniyat developer — verification checklist\n'),
  },
  {
    file: 'nshama-developer-review.mdx',
    run: (c) => trimToEnd(c, '\n\n### Buying into nshama developer — verification checklist\n'),
  },
  {
    file: 'select-group-developer-review.mdx',
    run: (c) => trimToEnd(c, '\n\n### Buying into select group developer — verification checklist\n'),
  },
  {
    file: 'ellington-properties-review.mdx',
    run: (c) => trimToEnd(c, '\n\n### Buying into ellington properties — verification checklist\n'),
  },
  {
    file: 'aldar-properties-review.mdx',
    run: (c) =>
      trimToEnd(c, '\n\n### Practical cost reference\n\nthe Gulf specifics for aldar') ??
      trimToEnd(c, '\n\n### Practical cost reference\n'),
  },
];

for (const { file, run } of jobs) {
  const p = join(ROOT, file);
  const before = readFileSync(p, 'utf8');
  let after = run(before);
  if (after === null) throw new Error(`Trim failed: ${file}`);

  if (file === 'aldar-properties-review.mdx') {
    after =
      after.trimEnd() +
      `

### Abu Dhabi transfer costs (Aldar)

Aldar Abu Dhabi stock registers under **DMT** — budget **2% transfer** on registered value (not Dubai's 4% DLD). Add trustee fees per DMT schedule, outstanding service charges before NOC, and escrow account verification on off-plan. Ready resale with clean liability letter typically closes in **3–6 weeks**.
`;
  }

  writeFileSync(p, after);
  console.log(`OK ${file}`);
}

console.log('batch 27 trim done');
