/**
 * Single source of truth for "content file -> site URL path".
 *
 * Most collections render at /{collection}/{slug}/. The geo tree is different:
 * an entry that carries a `path` in its frontmatter renders at that path, so
 * /uae/dubai/ and /uae/dubai/palm-jumeirah/ can live in one collection without
 * the URL being derivable from the folder name.
 */
import { readFileSync } from 'node:fs';

export function frontmatterOf(raw) {
  return raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

/** Explicit `path:` frontmatter wins; otherwise fall back to the collection folder. */
export function urlPathFrom(collection, slug, frontmatter = '') {
  const explicit = frontmatter.match(/^path:\s*["']?([^"'\n]+?)["']?\s*$/m);
  if (explicit) {
    const clean = explicit[1].trim().replace(/^\/+|\/+$/g, '');
    if (clean) return `/${clean}/`;
  }
  return `/${collection}/${slug}/`;
}

export function urlPathForFile(collection, slug, absPath) {
  let raw = '';
  try {
    raw = readFileSync(absPath, 'utf8');
  } catch {
    /* unreadable file falls back to the folder convention */
  }
  return urlPathFrom(collection, slug, frontmatterOf(raw));
}

export default { frontmatterOf, urlPathFrom, urlPathForFile };
