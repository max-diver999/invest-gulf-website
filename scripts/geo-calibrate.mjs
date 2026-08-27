#!/usr/bin/env node
/**
 * Calibration harness for the GEO scorer.
 *
 * The point of this file is that a scoring rubric is a hypothesis, and a
 * hypothesis needs a test set. Ours is labelled by history:
 *
 *   bad/  files as they stood at commit 745d602, where an agent was told to
 *         lift the corpus to GEO 90+ and did it by injecting generated blocks.
 *         The old rubric scored these mean 87.5, min 85.
 *   good/ articles composed sentence by sentence in August 2026.
 *   mid/  honest prose rebuilt semi-automatically: should sit between.
 *
 * A rubric is only worth shipping if it separates bad from good. Run:
 *   node scripts/geo-calibrate.mjs --prepare      # rebuild the labelled sets
 *   node scripts/geo-calibrate.mjs                # score them and report separation
 *
 * KNOWN WEAKNESS OF THIS PARTICULAR LABELLING, stated here so nobody reads the
 * separation number as more than it is: no human-written prose exists anywhere
 * in this repository. The root commit is a squashed import of all 612 content
 * files and every one carries `author: "Invest Gulf Editorial"`. The good/ set
 * was therefore written by the same kind of agent whose output this rubric will
 * grade. That makes the score a RELATIVE separator — "this page sits closer to
 * the 745d602 end than to the August batch" — and not an absolute quality
 * target. Treat TARGETS as tripwires, not as a definition of good writing, and
 * never let this scorer be the only gate on new work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const LAB = '/tmp/geo-lab';
// 745d602 "feat: lift all MDX pages to GEO citability 90+ and clean machine
// pads." — 610 files, 53,452 insertions. The generator that produced it is
// still in the tree at scripts/geo-fix-corpus-90.mjs, and its templates are
// legible: "typically require ${a} carry proof, ${b} DLD transfer fee
// awareness" and "buyer desk files average ${d} turnaround".
const GARBAGE_COMMIT = '745d602';
/**
 * Slugs are `collection/slug`, because the machine padding did not confine
 * itself to guides: the worst single case of content destruction in the whole
 * corpus is an areas page (al-reem-island lost 386 lines to gain 98 of pad).
 *
 * bad/ is a CURATED list rather than every guide at that commit. Taking the
 * commit wholesale looked tempting and is wrong: files such as
 * dld-mortgage-registration-fees and uae-credit-score-al-etihad sit at that
 * commit with eleven checklist blocks each that are all DIFFERENT and carry
 * real figures ("Budget 0.25 percent of loan as cash, not financed principal").
 * A garbage set contaminated with decent text makes bad.max fail for correct
 * scorer behaviour, which would teach exactly the wrong lesson.
 */
const GARBAGE = [
  'guides/ajman-living-guide',
  'guides/saudi-premium-residency-property',
  'guides/oman-healthcare-guide',
  'guides/oman-property-foreigner-living',
  'guides/gulf-banking-comparison-expats',
  'guides/sharjah-vs-dubai-commute-property',
  'guides/saudi-vs-uae-living',
  'guides/ellington-properties-review',
  'guides/abu-dhabi-golden-visa-living',
  'guides/saudi-banking-expats',
  'guides/saudi-property-designated-zones-explained',
  'guides/power-of-attorney-property-dubai',
  'guides/uae-visa-overstay-fines',
  'guides/dubai-metaverse-property-nft-reality',
  'guides/uae-residency-vs-citizenship',
  'guides/saudi-iqama-process',
  'guides/dubai-school-fees-by-curriculum',
  'guides/golden-visa-renewal-requirements-uae',
  'guides/saudi-family-visa',
  'guides/living-amwaj-islands',
  'guides/schools-near-jvc',
  'guides/best-off-plan-ras-al-khaimah',
  'guides/dubai-international-schools-guide',
  'guides/dubai-vs-abu-dhabi-living',
  'guides/dubai-utility-bills-deewa',
  'areas/al-reem-island-property-investment',
  'areas/al-maryah-island-property-investment',
  'areas/dubai-harbour-property-investment',
  'areas/town-square-property-investment',
  'areas/motor-city-property-investment',
  'areas/saadiyat-island-property-investment',
  'areas/amwaj-islands-property-investment',
  'areas/dubai-hills-estate-property-investment',
  'areas/dubai-creek-harbour-property-investment',
  'areas/al-furjan-property-investment',
  'areas/dubai-silicon-oasis-property-investment',
  'compare/saudi-arabia-vs-uae-golden-visa',
  'compare/qatar-vs-uae-residency',
  'compare/emaar-vs-nakheel',
  'compare/freehold-vs-leasehold-uae',
  'compare/uae-vs-oman-property-investment',
];

/**
 * Four, not the seven written in that batch. Three were demoted to mid/ because
 * they are mutually templated and would have taught the rubric to tolerate the
 * one thing it exists to catch: "by-product of a sound purchase" appears
 * verbatim in three of them, "puts renewal at risk" in two, and "the current
 * year and the two prior years" in two more.
 */
const HANDWRITTEN = [
  'guides/dubai-developer-delay-compensation-claim',
  'guides/qatar-foreign-ownership-rules-changelog',
  'guides/when-not-to-buy-gulf-property',
  'guides/dubai-service-charge-dispute-escalation',
];

/**
 * Two entries here are deliberately the same slugs that appear in GARBAGE, at a
 * different revision: bad/ holds them at 745d602 and mid/ holds them at HEAD.
 * That pair is the most informative thing in the whole set, because it tests the
 * rubric on one page before and after repair rather than on two different pages.
 * sharjah-vs-dubai-commute-property goes 5,198 words with 22 filler paragraphs
 * and 22 stub tables at 745d602, to 3,888 words with none of either at HEAD.
 */
const MIDDLE = [
  'guides/arada-developer-review',
  'guides/oman-banking-expats',
  'guides/dubai-monthly-budget-expat-family',
  'guides/umm-al-quwain-rental-yield-guide',
  'guides/sharjah-vs-dubai-commute-property',
  'guides/how-to-calculate-rental-yield-dubai',
  'guides/dubai-payment-plan-types-explained',
  'guides/dubai-property-scams-red-flags',
  'guides/aed-2m-golden-visa-best-value-units',
  'guides/dubai-first-investment-under-aed-1m',
  'guides/uae-golden-visa-property-rule-changes-log',
  'projects/sobha-hartland-2',
  'compare/emaar-vs-nakheel',
];

/**
 * Every unresolvable slug throws rather than being skipped, and the counts
 * printed are files actually written rather than list lengths. The previous
 * version did neither, so a set of slugs belonging to a different site printed
 * "good=10" over an empty directory and the mistake only surfaced much later,
 * as an unrelated-looking "labelled set is empty" from scoreSet.
 */
function prepare() {
  for (const d of ['bad', 'good', 'mid']) {
    fs.rmSync(path.join(LAB, d), { recursive: true, force: true });
    fs.mkdirSync(path.join(LAB, d), { recursive: true });
  }

  const missing = [];
  let bad = 0;
  for (const slug of GARBAGE) {
    const src = `src/content/${slug}.mdx`;
    try {
      const content = execFileSync('git', ['show', `${GARBAGE_COMMIT}:${src}`], { maxBuffer: 32e6 }).toString();
      fs.writeFileSync(path.join(LAB, 'bad', `${slug.replace('/', '__')}.mdx`), content);
      bad += 1;
    } catch {
      missing.push(`${slug} (absent at ${GARBAGE_COMMIT})`);
    }
  }

  const written = { good: 0, mid: 0 };
  for (const [dir, slugs] of [['good', HANDWRITTEN], ['mid', MIDDLE]]) {
    for (const slug of slugs) {
      const src = `src/content/${slug}.mdx`;
      if (!fs.existsSync(src)) {
        missing.push(`${slug} (absent in working tree)`);
        continue;
      }
      fs.copyFileSync(src, path.join(LAB, dir, `${slug.replace('/', '__')}.mdx`));
      written[dir] += 1;
    }
  }

  if (missing.length) {
    throw new Error(`labelled set references files that do not exist:\n  ${missing.join('\n  ')}`);
  }
  console.log(`prepared: bad=${bad} good=${written.good} mid=${written.mid} in ${LAB}`);
}

function stats(xs) {
  if (!xs.length) return { n: 0, mean: 0, min: 0, max: 0, p90: 0 };
  const s = [...xs].sort((a, b) => a - b);
  return {
    n: xs.length,
    mean: xs.reduce((a, b) => a + b, 0) / xs.length,
    min: s[0],
    max: s[s.length - 1],
    p90: s[Math.floor(s.length * 0.9)] ?? s[s.length - 1],
  };
}

async function scoreSet(dir, scorer) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).map((f) => path.join(dir, f));
  if (!files.length) throw new Error(`labelled set ${dir} is empty; run --prepare`);
  const out = [];
  for (const f of files) out.push({ file: f, ...(await scorer(f, files)) });
  return out;
}

async function main() {
  if (process.argv.includes('--prepare')) return prepare();
  if (!fs.existsSync(path.join(LAB, 'bad'))) prepare();

  const which = process.argv.includes('--old') ? 'old' : 'new';
  let scorer;
  if (which === 'old') {
    const { scorePage } = await import('./lib/geo-citability-scorer.mjs');
    scorer = async (f) => {
      const raw = fs.readFileSync(f, 'utf8');
      const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
      const r = scorePage(body, { collection: 'guides' });
      return { score: r.score };
    };
  } else {
    const mod = await import('./lib/geo/score.mjs').catch(() => null);
    if (!mod) {
      console.error('scripts/lib/geo/score.mjs not implemented yet; run with --old to see the baseline');
      process.exit(2);
    }
    scorer = mod.scoreFileForCalibration;
  }

  const sets = {};
  for (const d of ['bad', 'good', 'mid']) sets[d] = await scoreSet(path.join(LAB, d), scorer);

  console.log(`\n=== GEO calibration (${which} scorer) ===`);
  const summary = {};
  for (const [k, rows] of Object.entries(sets)) {
    const st = stats(rows.map((r) => r.score));
    summary[k] = st;
    console.log(
      `${k.padEnd(5)} n=${String(st.n).padStart(3)}  mean=${st.mean.toFixed(1)}  min=${st.min}  p90=${st.p90}  max=${st.max}`,
    );
  }
  const sep = summary.good.mean - summary.bad.mean;
  console.log(`\nseparation (good.mean - bad.mean) = ${sep.toFixed(1)} points`);
  const overlap = sets.bad.filter((r) => r.score >= Math.min(...sets.good.map((g) => g.score))).length;
  console.log(`garbage files scoring at or above the worst hand-written file: ${overlap}/${sets.bad.length}`);

  // Targets are set against the deterministic stage, which tops out at 75.
  // The remaining twenty points to the 95 ceiling are only reachable through
  // the judge stage, so a deterministic 60 is a good article, not a mediocre one.
  const TARGETS = { badMax: 25, goodMin: 55, separation: 35 };
  const fails = [];
  if (summary.bad.max > TARGETS.badMax) fails.push(`bad.max ${summary.bad.max} > ${TARGETS.badMax}`);
  if (summary.good.min < TARGETS.goodMin) fails.push(`good.min ${summary.good.min} < ${TARGETS.goodMin}`);
  if (sep < TARGETS.separation) fails.push(`separation ${sep.toFixed(1)} < ${TARGETS.separation}`);
  if (which === 'new') {
    console.log(fails.length ? `\n❌ calibration FAILED\n  ${fails.join('\n  ')}` : '\n✅ calibration passed');
    if (fails.length) process.exit(1);
  }
}

main();
