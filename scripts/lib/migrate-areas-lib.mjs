import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const COLLECTIONS = ['guides', 'compare', 'areas', 'projects', 'news'];

export function setCategoryAreas(raw) {
  if (/^category:\s*["']?areas["']?/m.test(raw)) return raw;
  if (/^category:\s*/m.test(raw)) {
    return raw.replace(/^category:\s*.+$/m, 'category: "areas"');
  }
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return raw;
  return raw.replace(/^---\n[\s\S]*?\n---/, `---\n${m[1].trimEnd()}\ncategory: "areas"\n---`);
}

/**
 * @param {string[]} slugs
 * @param {{ dry?: boolean, label?: string, root?: string }} opts
 */
export function migrateAreaSlugs(slugs, opts = {}) {
  const ROOT = opts.root ?? join(process.cwd(), 'src/content');
  const DRY = opts.dry ?? false;
  const label = opts.label ?? 'migrate-areas';

  const areasDir = join(ROOT, 'areas');
  if (!existsSync(areasDir)) mkdirSync(areasDir, { recursive: true });

  let moved = 0;
  for (const slug of slugs) {
    const src = join(ROOT, 'guides', `${slug}.mdx`);
    const dest = join(ROOT, 'areas', `${slug}.mdx`);
    if (!existsSync(src)) {
      console.warn('skip missing', slug);
      continue;
    }
    if (existsSync(dest)) {
      console.warn('skip exists in areas/', slug);
      continue;
    }
    let raw = readFileSync(src, 'utf8');
    raw = setCategoryAreas(raw);
    if (!DRY) {
      writeFileSync(dest, raw);
      unlinkSync(src);
    }
    moved++;
    console.log(DRY ? 'would move' : 'moved', slug);
  }

  let linkRewrites = 0;
  for (const coll of COLLECTIONS) {
    const dir = join(ROOT, coll);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
      const path = join(dir, file);
      let raw = readFileSync(path, 'utf8');
      let changed = false;
      for (const slug of slugs) {
        const from = `/guides/${slug}/`;
        const to = `/areas/${slug}/`;
        const n = raw.split(from).length - 1;
        if (n) {
          raw = raw.split(from).join(to);
          linkRewrites += n;
          changed = true;
        }
        const fromNoSlash = `/guides/${slug})`;
        const toNoSlash = `/areas/${slug})`;
        if (raw.includes(fromNoSlash)) {
          raw = raw.split(fromNoSlash).join(toNoSlash);
          changed = true;
        }
      }
      if (changed && !DRY) writeFileSync(path, raw);
    }
  }

  console.log(`=== ${label} ===`);
  console.log('dry:', DRY);
  console.log('moved:', moved, '/', slugs.length);
  console.log('link rewrites:', linkRewrites);
  return { moved, linkRewrites, total: slugs.length };
}
