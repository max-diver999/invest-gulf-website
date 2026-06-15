#!/usr/bin/env node
/** Strip [verify ...] markers from all MDX — replace with safe qualifier text. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(__dirname, '../src/content');
const COLLECTIONS = ['guides', 'compare', 'areas', 'projects', 'news'];

const REPLACEMENTS = [
  [/\s*\[verify ICP\/GDRFA\]/gi, ' (confirm registered value with ICP/GDRFA)'],
  [/\s*\[verify GDRFA 2026\]/gi, ' (confirm with GDRFA)'],
  [/\s*\[verify GDRFA\/ICP 2026\]/gi, ' (confirm with GDRFA/ICP)'],
  [/\s*\[verify mortgage rules\]/gi, ' (confirm mortgage rules with ICP)'],
  [/\s*\[verify transaction\]/gi, ' (confirm transaction fees locally)'],
  [/\s*\[verify ICP 2026\]/gi, ' (confirm current ICP rules)'],
  [/\s*\[verify ICP rules\]/gi, ' (confirm ICP rules)'],
  [/\s*\[verify ICP\]/gi, ' (confirm with ICP)'],
  [/\s*\[verify NPRA\]/gi, ' (confirm with NPRA)'],
  [/\s*\[verify MOI 2026\]/gi, ' (confirm current MOI rules)'],
  [/\s*\[verify MOI\]/gi, ' (confirm with MOI)'],
  [/\s*\[verify SAMA\]/gi, ' (confirm with SAMA)'],
  [/\s*\[verify ZATCA\]/gi, ' (confirm with ZATCA)'],
  [/\s*\[verify MOHUP\]/gi, ' (confirm with MOHUP)'],
  [/\s*\[verify Premium Residency Center\]/gi, ' (confirm with Premium Residency Center)'],
  [/\s*\[verify CBO rules\]/gi, ' (confirm Central Bank of Oman rules)'],
  [/\s*\[verify per unit\]/gi, ' (verify freehold status per unit)'],
  [/\s*\[verify per project\]/gi, ' (verify structure per project)'],
  [/\s*\[verify current rules\]/gi, ' (confirm current rules)'],
  [/\s*\[verify\]/gi, ' (confirm locally before purchase)'],
  [/\s*\[verify[^\]]+\]/gi, ' (confirm before purchase)'],
];

let changed = 0;
for (const coll of COLLECTIONS) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const path = join(dir, f);
    let text = readFileSync(path, 'utf8');
    const before = text;
    for (const [re, rep] of REPLACEMENTS) {
      text = text.replace(re, rep);
    }
    if (text !== before) {
      writeFileSync(path, text);
      changed++;
      console.log('updated', `${coll}/${f}`);
    }
  }
}
console.log(`Done: ${changed} files`);
