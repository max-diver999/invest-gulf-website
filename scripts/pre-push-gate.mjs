#!/usr/bin/env node
/**
 * Pre-push gate: validate changed MDX + optional build when content changed.
 * Usage: npm run prepush:gate
 * Install hook: npm run setup:hooks  (once per clone)
 */
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = dirname(fileURLToPath(new URL('..', import.meta.url)));

function run(cmd, args = []) {
  const r = spawnSync(cmd, args, { cwd: repoRoot, stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function hasChangedMdx() {
  try {
    const staged = execSync('git diff --cached --name-only', { cwd: repoRoot, encoding: 'utf8' });
    const unstaged = execSync('git diff --name-only', { cwd: repoRoot, encoding: 'utf8' });
    const all = `${staged}\n${unstaged}`;
    return /src\/content\/.*\.mdx/.test(all);
  } catch {
    return true;
  }
}

console.log('=== invest-gulf pre-push gate ===');

if (hasChangedMdx()) {
  console.log('MDX changes detected → validate:content --changed');
  run('node', [join(repoRoot, 'scripts/qa-audit.mjs'), '--changed']);
  console.log('→ npm run build');
  run('npm', ['run', 'build']);
} else {
  console.log('No MDX changes — skipping content validate/build');
}

console.log('✅ prepush gate passed');
