#!/usr/bin/env node
/**
 * Move "## Buyer scenarios" block out from between imports and body (MDX parse break).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const CONTENT = join(ROOT, 'src/content');
const MARKER = '## Buyer scenarios: who this guide fits';
const BLOCK_RE = new RegExp(
  `\\n*${MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?Scenario C[^\\n]+\\n+`,
  'm',
);

function listMdx() {
  const out = [];
  for (const coll of readdirSync(CONTENT)) {
    const dir = join(CONTENT, coll);
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) out.push(join(dir, f));
  }
  return out;
}

let fixed = 0;
for (const abs of listMdx()) {
  const raw = readFileSync(abs, 'utf8');
  const fm = raw.match(/^---\n[\s\S]*?\n---\n?/)?.[0] || '';
  let body = raw.slice(fm.length);
  if (!body.includes(MARKER)) continue;

  const importsEnd = body.search(/\n(?!import )/);
  const scenarioIdx = body.indexOf(MARKER);
  if (scenarioIdx === -1) continue;

  const beforeScenario = body.slice(0, scenarioIdx);
  const onlyImportsAndBlanks = /^[\s\S]*?(?:^import[^\n]*\n)+$/m.test(beforeScenario.trimEnd() + '\n');
  if (!onlyImportsAndBlanks && !beforeScenario.trimEnd().endsWith("from '../../components/FaqBlock.astro';")) {
    continue;
  }

  const blockMatch = body.match(BLOCK_RE);
  if (!blockMatch) continue;
  const block = blockMatch[0].trim() + '\n\n';
  body = body.replace(BLOCK_RE, '\n');
  body = body.replace(/\n---\n\n+/, '\n\n');
  body = body.replace(/\n{3,}/g, '\n\n');

  const insertAfter =
    body.search(/<TldrBlock[\s\S]*?\/>/) >= 0
      ? body.search(/<TldrBlock[\s\S]*?\/>/) + body.match(/<TldrBlock[\s\S]*?\/>/)?.[0].length
      : body.search(/\n\n[^<\n#]/);

  if (insertAfter < 0) continue;
  const next = body.slice(0, insertAfter) + `\n\n${block}` + body.slice(insertAfter);
  if (next === body) continue;
  writeFileSync(abs, fm + next);
  fixed += 1;
  console.log('fixed', abs.replace(ROOT + '/', ''));
}

console.log(`Done: ${fixed} files`);
