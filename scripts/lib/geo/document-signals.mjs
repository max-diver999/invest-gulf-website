/**
 * Single-document signals.
 *
 * Every signal here earned its place on the labelled sets. Candidates that
 * sounded right and failed are recorded in docs/GEO-SCORING.md rather than
 * quietly dropped, because the previous rubric was built entirely out of
 * plausible-sounding rules that nobody ever tested.
 *
 * Measured (machine-injected corpus vs hand-written):
 *   malformed tokens per file    13.1  vs  0.0
 *   heading-echo openers         10.5  vs  0.6
 *   most-repeated opener shape   0.69  vs  0.16
 *   hedge words per 1000 words    5.9  vs  1.9
 */

import { plainText, words, sentences } from './corpus-signals.mjs';

/** Wreckage left by string-templating: "r," and "undefined" reached production in July. */
/**
 * Broken output: a template that rendered nothing, or a word emitted twice.
 *
 * The doubled-word arm needed two exclusions on this corpus, both found by a
 * page being capped at 40 for text that is correct, and both narrow enough that
 * they cost the signal nothing measurable:
 *
 *  - Followed by a hyphen. "DAMAC trails Emaar on on-time delivery" is ordinary
 *    English; the word boundary after the second "on" is satisfied by the
 *    hyphen, so the bare rule read a compound adjective as a stutter.
 *
 *  - Lowercase followed by capitalised. plainText collapses newlines into
 *    spaces, so a paragraph ending "...in every cash-flow model" followed by
 *    one beginning "Model net yield after..." arrives as "model Model". Only
 *    that direction is excluded, and the asymmetry carries the discrimination:
 *    a sentence boundary capitalises the SECOND word, whereas a real stutter at
 *    the start of a sentence capitalises the FIRST ("The the transfer fee"),
 *    which is still caught.
 *
 * Genuine hits survive both: "Founded by Zaal Zaal" on the Al Barari page is
 * the founder's name (Zaal Mohamed Zaal) mangled by an earlier pass, and it is
 * still flagged. So is a proper noun that really does repeat, such as the JBR
 * beach club "Bla Bla" — the rule stays deliberately blunt there rather than
 * growing a list of exempt names, and the page is cheapest to fix by writing
 * "Bla Bla Beach Club".
 */
const MALFORMED_RE = new RegExp(
  [
    String.raw`\bundefined\b`,
    String.raw`\bNaN\b`,
    String.raw`\bR\s*,`,
    String.raw`\s,\s`,
  ].join('|'),
  'gi',
);
const DOUBLED_WORD_RE = /\b(\w+)\s+\1\b(?!-)(?!\s*(?:street|road|bay))/gi;
const SENTENCE_JOIN = /^([a-z]\w*)\s+([A-Z]\w*)$/;

// "may" is matched lowercase only, deliberately. Case-insensitively it also
// matches the month, and a news article quoting MPC meeting dates was charged
// 12 points for writing "May 2026" seven times. The month is always
// capitalised and hedging "may" is almost always mid-sentence, so lowercase is
// a near-perfect discriminator: on the labelled sets the change moves the
// machine corpus from 5.83 to 5.77 hedges per 1000 and leaves the
// hand-written set at 1.87 exactly.
const HEDGE_RE_I = /\b(might|could|generally|typically|usually|often|tends? to|somewhat|relatively)\b/gi;
const HEDGE_RE_MAY = /\bmay\b/g;

export function sections(raw) {
  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const parts = body.split(/^## /m).slice(1);
  return parts.map((part) => {
    const nl = part.indexOf('\n');
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const section = nl === -1 ? '' : part.slice(nl + 1);
    const text = plainText(section);
    return { heading, section, text, firstSentence: sentences(text)[0] || '' };
  });
}

export function malformedTokens(raw) {
  const text = plainText(raw);
  const doubled = (text.match(DOUBLED_WORD_RE) || []).filter((m) => !SENTENCE_JOIN.test(m.trim()));
  const found = [...(text.match(MALFORMED_RE) || []), ...doubled];
  return { count: found.length, samples: [...new Set(found)].slice(0, 5) };
}

/**
 * An opener that just restates its own heading answers nothing. The generator
 * produced these by construction; a writer answering the question does not.
 */
export function headingEchoes(raw) {
  const norm = (t) => words(t.toLowerCase()).join(' ');
  const hits = [];
  for (const s of sections(raw)) {
    const h = words(s.heading.toLowerCase());
    const opener = norm(s.firstSentence);
    if (h.length < 4 || !opener) continue;

    // An answer naturally reuses its question's nouns, so bag-of-words overlap
    // flags good writing. What the generator did instead was paste the heading
    // in verbatim behind a template, which shows up as a long contiguous run.
    let longestRun = 0;
    for (let i = 0; i < h.length; i += 1) {
      for (let n = h.length - i; n >= 4; n -= 1) {
        if (opener.includes(h.slice(i, i + n).join(' '))) {
          longestRun = Math.max(longestRun, n);
          break;
        }
      }
    }
    if (longestRun >= 5) hits.push({ heading: s.heading, run: longestRun });
  }
  return hits;
}

/** If every section opens with the same four-word shape, one template wrote them all. */
export function openerTemplateShare(raw) {
  const keys = sections(raw)
    .map((s) => words(s.firstSentence).slice(0, 4).map((w) => (/^\d/.test(w) ? '#' : w.toLowerCase())).join(' '))
    .filter(Boolean);
  if (keys.length < 3) return { share: 0, shape: null, sections: keys.length };
  const counts = new Map();
  for (const k of keys) counts.set(k, (counts.get(k) || 0) + 1);
  const [shape, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { share: n / keys.length, shape, sections: keys.length };
}

export function hedgeDensity(raw) {
  const text = plainText(raw);
  const w = words(text).length || 1;
  const hits = (text.match(HEDGE_RE_I) || []).length + (text.match(HEDGE_RE_MAY) || []).length;
  return (hits / w) * 1000;
}

/**
 * Figures that appear once, in prose, and never again anywhere on the page.
 * Not a defect on its own (hand-written articles carry more prose figures than
 * the generated ones did), so this is reported for review, never scored.
 */
export function orphanFigures(raw) {
  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const re = /(?:R\s?\d[\d,]*(?:\.\d+)?(?:\s*(?:million|bn|k))?|\d+(?:\.\d+)?%)/gi;
  const counts = new Map();
  for (const m of body.match(re) || []) {
    const k = m.trim().replace(/\s+/g, ' ').toLowerCase();
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n === 1).map(([k]) => k);
}

/**
 * Repetition between sections of one article.
 *
 * The cross-file detector misses a file that repeats itself, which is what a
 * generator does when it fills every section from one template. Measured over
 * the labelled sets this separates perfectly: machine files average 0.27, and
 * all ten hand-written articles score exactly 0.
 */
export function crossSectionEcho(raw) {
  const secs = sections(raw);
  if (secs.length < 2) return { score: 0, worst: null };
  const grams = secs.map((s) => {
    const w = words(s.text).map((x) => x.toLowerCase());
    const set = new Set();
    for (let i = 0; i + 8 <= w.length; i += 1) set.add(w.slice(i, i + 8).join(' '));
    return set;
  });
  let shared = 0;
  let total = 0;
  let worst = null;
  for (let i = 0; i < grams.length; i += 1) {
    let mine = 0;
    for (const g of grams[i]) {
      const elsewhere = grams.some((other, j) => j !== i && other.has(g));
      if (elsewhere) { shared += 1; mine += 1; }
      total += 1;
    }
    const share = grams[i].size ? mine / grams[i].size : 0;
    if (!worst || share > worst.share) worst = { heading: secs[i].heading, share: Number(share.toFixed(3)) };
  }
  return { score: total ? shared / total : 0, worst };
}

/**
 * A currency amount bolted to a noun that cannot carry one. The generator that
 * produced this corpus emitted "typically require 40% carry proof" and "buyer
 * desk files average 100% turnaround" by slotting a number into a template that
 * never asked what the number measured.
 *
 * The word list is NOT the one this rubric shipped with, and the difference was
 * measured rather than assumed. At the garbage commit (745d602, 610 files):
 *
 *   % carry proof   16 hits   nonsense: not a measurable quantity
 *   % turnaround    22 hits   nonsense: a turnaround is a duration
 *   % LTV          246 hits   LEGITIMATE: loan-to-value is a percentage
 *   % occupancy     45 hits   LEGITIMATE: occupancy is a rate
 *   % vacancy      199 hits   LEGITIMATE: vacancy is a rate
 *   AED n vacancy    8 hits   LEGITIMATE: a dirham cost line in a carry stack
 *                             ("AED 5,000 management, and AED 4,000 vacancy")
 *
 * So occupancy, vacancy and LTV are removed from the money form: on this corpus
 * they fire only on correct writing. Keeping them would cap 490 legitimate pages
 * and teach a writer to avoid the right word, which is the rule making the
 * corpus worse. The percentage form keeps turnaround and carry proof, which are
 * the two that are genuinely nonsense here.
 */
const UNIT_TYPE_RULES = [
  /(?:\b(?:AED|SAR|QAR|OMR|BHD|KWD|USD|GBP|EUR|SGD|INR)|\$)\s?[\d,]+(?:\.\d+)?\s*(?:million|bn|k)?\s+(turnaround|awareness|confirmation|carry proof)\b/gi,
  /\b\d+(?:\.\d+)?%\s+(turnaround|carry proof|clearance certificate|withholding awareness)\b/gi,
  /(?:\b(?:AED|SAR|QAR|OMR|BHD|KWD|USD|GBP|EUR|SGD|INR)|\$)\s?[\d,]+(?:\.\d+)?\s+(?:withholding awareness|non-resident LTV|endorsement language)\b/gi,
];

// A currency amount followed by a bare duration ("R135,000 months") reads as a
// generator slip but is also ordinary compressed English, so it is not a rule:
// it fired on a hand-written sentence about nightly rates stacking into monthly
// revenue. Precision matters more than recall for a check that caps a score.

export function unitTypeViolations(raw) {
  const text = plainText(raw);
  const hits = [];
  for (const re of UNIT_TYPE_RULES) {
    for (const m of text.match(new RegExp(re.source, re.flags)) || []) hits.push(m.trim());
  }
  return [...new Set(hits)];
}

/**
 * The same long line, byte for byte, several times in one document.
 *
 * This exists because crossSectionEcho is a SHARE and shares dilute. The
 * generator that padded this corpus pasted an identical three-line checklist
 * after nearly every H2; in a 3,184-word article eleven such blocks come to 6%,
 * which sits under the 8% gate and let a file that is 31-times-repeated pad
 * score 29. A count does not dilute, and it cannot be diluted deliberately by
 * writing more around the pad.
 *
 * Measured on the labelled sets before it was added, which is the only reason
 * it is here:
 *
 *   set   mean  max  files repeating a line 3+ times
 *   bad   7.46   31  18 of 41
 *   good  1.00    1   0 of 4
 *   mid   1.00    1   0 of 13
 *
 * Perfect separation: every hand-written and every semi-automatic file repeats
 * no line at all. Tables are excluded before counting, because a table legend
 * legitimately repeats, and the eight-word floor keeps short list labels
 * ("- Verify the title deed") out of it.
 */
export function repeatedLines(raw) {
  const counts = new Map();
  const body = raw
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .replace(/^\s*(?:import|export)\s.+$/gm, '')
    .replace(/^\|.*$/gm, '');
  for (const lineRaw of body.split('\n')) {
    const line = lineRaw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (line.split(' ').filter(Boolean).length < 8) continue;
    counts.set(line, (counts.get(line) || 0) + 1);
  }
  let max = 0;
  let worst = '';
  for (const [line, n] of counts) {
    if (n > max) { max = n; worst = line; }
  }
  return { max, worst };
}

export function documentSignals(raw) {
  return {
    malformed: malformedTokens(raw),
    headingEchoes: headingEchoes(raw),
    openerTemplate: openerTemplateShare(raw),
    hedgePer1000: hedgeDensity(raw),
    crossSectionEcho: crossSectionEcho(raw),
    unitTypeViolations: unitTypeViolations(raw),
    repeatedLines: repeatedLines(raw),
    sectionCount: sections(raw).length,
    wordCount: words(plainText(raw)).length,
  };
}
