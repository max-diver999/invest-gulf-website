#!/usr/bin/env node
/**
 * 1. Clean TldrBlock text (Hubs/R91 junk, confirm rules, em/en-dash)
 * 2. Remove duplicate Quick answer / TL;DR / ## Quick Answer when TldrBlock exists
 */
import fs from 'node:fs';
import { globSync } from 'glob';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function cleanTldrText(text) {
  let t = text
    .replace(/\s*Hubs:\s*.+$/i, '')
    .replace(/\s*\(R\d+\)/gi, '')
    .replace(/\s*\*\*\s*\(confirm current official rules\)\s*\*\*/gi, '')
    .replace(/\s*\(confirm current official rules\)/gi, '')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
  return t;
}

function updateTldrBlock(raw) {
  let n = 0;
  const updated = raw.replace(
    /<TldrBlock text=\{("(?:\\.|[^"\\])*")\}/g,
    (match, jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr);
        const cleaned = cleanTldrText(parsed);
        if (cleaned !== parsed) n++;
        if (!cleaned || cleaned.length < 20) return match;
        return `<TldrBlock text={${JSON.stringify(cleaned)}}`;
      } catch {
        return match;
      }
    },
  );
  const updated2 = updated.replace(
    /<TldrBlock text="((?:\\.|[^"\\])*)"/g,
    (match, inner) => {
      const parsed = inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      const cleaned = cleanTldrText(parsed);
      if (cleaned !== parsed) n++;
      if (!cleaned || cleaned.length < 20) return match;
      return `<TldrBlock text={${JSON.stringify(cleaned)}}`;
    },
  );
  return { text: updated2, cleaned: n };
}

const INTRO_PATTERNS = [
  /^\*\*Quick [Aa]nswer:\*\*\s*.+?(?:\n\n|\n(?=[#*>!\[]|[A-Z][a-z]))/m,
  /^Quick answer:\s*.+?(?:\n\n|\n(?=[#*>!\[]|[A-Z][a-z]))/m,
  /^TL;DR:\s*.+?(?:\n\n|\n(?=[#*>!\[]|[A-Z][a-z]))/im,
  /^\*\*TL;DR:\*\*\s*.+?(?:\n\n|\n(?=[#*>!\[]|[A-Z][a-z]))/im,
  /^## Quick Answer\s*\n[\s\S]*?(?=\n## |\n---\n|\n<TldrBlock|\n# [^#])/m,
];

function stripAfterImports(body) {
  const importEnd = body.search(/^(?!import |$|\s*$)/m);
  if (importEnd === -1) return body;
  const head = body.slice(0, importEnd);
  let tail = body.slice(importEnd);

  let changed = true;
  while (changed) {
    changed = false;
    for (const p of INTRO_PATTERNS) {
      const next = tail.replace(p, '');
      if (next !== tail) {
        tail = next;
        changed = true;
        break;
      }
    }
  }

  tail = tail.replace(/\n{3,}/g, '\n\n');
  tail = tail.replace(/\n---\n\n(?=<TldrBlock)/g, '\n\n');
  tail = tail.replace(/^\n---\n+/m, '\n');
  return head + tail.replace(/^\n+/, '\n');
}

const files = globSync('src/content/**/*.mdx', { cwd: ROOT });
let cleanedTexts = 0;
let strippedFiles = 0;

for (const rel of files) {
  const path = join(ROOT, rel);
  let raw = fs.readFileSync(path, 'utf8');
  if (!raw.includes('TldrBlock')) continue;

  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) continue;

  const { text: withCleanTldr, cleaned } = updateTldrBlock(m[2]);
  cleanedTexts += cleaned;

  const newBody = stripAfterImports(withCleanTldr);
  if (newBody !== m[2]) strippedFiles++;

  const out = `---\n${m[1]}\n---\n${newBody}`;
  if (out !== raw) fs.writeFileSync(path, out);
}

console.log(`TldrBlock texts cleaned: ${cleanedTexts}`);
console.log(`Files with duplicate intro stripped: ${strippedFiles}`);
